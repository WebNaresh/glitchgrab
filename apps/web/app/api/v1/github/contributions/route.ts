export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const QUERY = `
  query {
    viewer {
      login
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }
`;

interface GhDay { date: string; contributionCount: number; color: string }
interface GhWeek { contributionDays: GhDay[] }
interface GhResponse {
  data?: {
    viewer: {
      login: string;
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: GhWeek[];
        };
      };
    };
  };
  errors?: { message: string }[];
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findFirst({
      where: { userId, provider: "github" },
      select: { access_token: true },
    });

    if (!account?.access_token) {
      return NextResponse.json({
        success: true,
        data: { total: 0, weeks: [], login: null },
      });
    }

    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ query: QUERY }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("GitHub contributions fetch failed:", res.status, text);
      return NextResponse.json({
        success: true,
        data: { total: 0, weeks: [], login: null },
      });
    }

    const body = (await res.json()) as GhResponse;
    if (body.errors || !body.data) {
      console.error("GitHub contributions errors:", body.errors);
      return NextResponse.json({
        success: true,
        data: { total: 0, weeks: [], login: null },
      });
    }

    const cal = body.data.viewer.contributionsCollection.contributionCalendar;
    const weeks = cal.weeks.map((w) =>
      w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        total: cal.totalContributions,
        login: body.data.viewer.login,
        weeks,
      },
    });
  } catch (error) {
    console.error("Fetch contributions error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
