export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCollabSession } from "@/lib/collab-auth";
import { BugChat } from "./bug-chat";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GitFork } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const collabSession = await getCollabSession();

  const userName = session?.user?.name?.split(" ")[0]
    ?? collabSession?.email.split("@")[0]
    ?? "there";

  // Fetch own repos (if logged in via GitHub)
  const ownRepos = session?.user?.id
    ? await prisma.repo.findMany({
        where: { userId: session.user.id },
        select: { id: true, fullName: true, owner: true, name: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Fetch shared repos (if has collab session)
  const sharedRepos = collabSession
    ? await prisma.collaboratorRepo.findMany({
        where: {
          collaborator: {
            id: collabSession.collaboratorId,
            status: "ACCEPTED",
          },
        },
        include: {
          repo: { select: { id: true, fullName: true, owner: true, name: true } },
        },
      })
    : [];

  // Merge both, deduplicate by repo id
  const seenIds = new Set(ownRepos.map((r) => r.id));
  const mergedRepos = [
    ...ownRepos,
    ...sharedRepos
      .map((cr) => cr.repo)
      .filter((r) => !seenIds.has(r.id)),
  ];

  if (mergedRepos.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="border-dashed max-w-sm w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GitFork className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No repos connected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {collabSession && !session?.user?.id
                ? "No repositories have been shared with you yet."
                : "Connect a GitHub repo to start reporting bugs."}
            </p>
            {session?.user?.id && (
              <Link href="/dashboard/repos">
                <Button>Connect a Repo</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <BugChat repos={mergedRepos} userName={userName} />;
}
