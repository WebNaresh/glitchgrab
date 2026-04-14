export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface GithubPull {
  number: number;
  title: string;
  html_url: string;
  draft: boolean;
  created_at: string;
  user: { login: string; avatar_url: string } | null;
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
      return NextResponse.json({ success: true, data: [] });
    }

    const repos = await prisma.repo.findMany({
      where: { userId },
      select: { fullName: true },
    });

    const pulls = (
      await Promise.all(
        repos.map(async (repo) => {
          try {
            const res = await fetch(
              `https://api.github.com/repos/${repo.fullName}/pulls?state=open&sort=updated&direction=desc&per_page=10`,
              {
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                  Accept: "application/vnd.github+json",
                },
              }
            );
            if (!res.ok) return [];
            const prs = (await res.json()) as GithubPull[];
            return prs.map((pr) => ({
              number: pr.number,
              title: pr.title,
              url: pr.html_url,
              draft: pr.draft,
              createdAt: pr.created_at,
              author: pr.user?.login ?? "unknown",
              authorAvatar: pr.user?.avatar_url ?? null,
              repoFullName: repo.fullName,
            }));
          } catch {
            return [];
          }
        })
      )
    ).flat();

    pulls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, data: pulls.slice(0, 20) });
  } catch (error) {
    console.error("Fetch PRs error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
