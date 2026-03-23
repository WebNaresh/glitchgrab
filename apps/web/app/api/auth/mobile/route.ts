export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encode } from "next-auth/jwt";

/**
 * POST /api/auth/mobile
 *
 * Receives a GitHub access_token from the mobile app.
 * Finds or creates the user in the database (same as NextAuth would),
 * then creates a JWT session token in the same format NextAuth uses.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { access_token } = body;

    if (!access_token || typeof access_token !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing access_token" },
        { status: 400 }
      );
    }

    // Step 1: Fetch user profile from GitHub
    const [profileRes, emailsRes] = await Promise.all([
      fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
      fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    ]);

    if (!profileRes.ok) {
      return NextResponse.json(
        { success: false, error: "Invalid GitHub access token" },
        { status: 401 }
      );
    }

    const profile = await profileRes.json();
    const emails: Array<{ email: string; primary: boolean; verified: boolean }> =
      emailsRes.ok ? await emailsRes.json() : [];

    const primaryEmail =
      emails.find((e) => e.primary && e.verified)?.email ||
      emails.find((e) => e.verified)?.email ||
      profile.email;

    if (!primaryEmail) {
      return NextResponse.json(
        { success: false, error: "No verified email found on GitHub account" },
        { status: 400 }
      );
    }

    const githubId = String(profile.id);

    // Step 2: Find or create user + account (same as PrismaAdapter would)
    let account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: githubId,
        },
      },
      include: { user: true },
    });

    let user;

    if (account) {
      // Update the stored access token
      await prisma.account.update({
        where: { id: account.id },
        data: { access_token },
      });
      user = account.user;
    } else {
      // Check if a user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: primaryEmail },
      });

      if (existingUser) {
        // Link the GitHub account to existing user
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: "oauth",
            provider: "github",
            providerAccountId: githubId,
            access_token,
            token_type: "bearer",
            scope: "read:user,user:email,repo",
          },
        });
        user = existingUser;
      } else {
        // Create new user + account
        user = await prisma.user.create({
          data: {
            name: profile.name || profile.login,
            email: primaryEmail,
            image: profile.avatar_url,
            accounts: {
              create: {
                type: "oauth",
                provider: "github",
                providerAccountId: githubId,
                access_token,
                token_type: "bearer",
                scope: "read:user,user:email,repo",
              },
            },
          },
        });
      }
    }

    // Step 3: Create a JWT session token (same format as NextAuth)
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("AUTH_SECRET is not set");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const sessionToken = await encode({
      token: {
        name: user.name,
        email: user.email,
        picture: user.image,
        sub: user.id,
        id: user.id,
      } as Record<string, unknown>,
      secret,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    } as Parameters<typeof encode>[0]);

    return NextResponse.json({
      success: true,
      sessionToken,
      user: {
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (err: any) {
    console.error("Mobile auth error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
