export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCollabSession } from "@/lib/collab-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, ExternalLink } from "lucide-react";

const STATUS_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  PROCESSING: "secondary",
  CREATED: "default",
  DUPLICATE: "secondary",
  FAILED: "destructive",
};

const SOURCE_LABELS: Record<string, string> = {
  SDK_AUTO: "Auto Capture",
  SDK_USER_REPORT: "User Report",
  DASHBOARD_UPLOAD: "Dashboard",
  HANDWRITTEN_NOTE: "Handwritten",
  MCP: "MCP",
};

export default async function ReportsPage() {
  const session = await auth();
  const collabSession = await getCollabSession();
  const userId = session?.user?.id;

  // Get repos the user owns or has access to
  const repoIds: string[] = [];

  if (userId) {
    const repos = await prisma.repo.findMany({
      where: { userId },
      select: { id: true },
    });
    repoIds.push(...repos.map((r) => r.id));
  }

  if (collabSession) {
    const collabRepos = await prisma.collaboratorRepo.findMany({
      where: {
        collaborator: { id: collabSession.collaboratorId, status: "ACCEPTED" },
      },
      select: { repoId: true },
    });
    repoIds.push(...collabRepos.map((r) => r.repoId));
  }

  if (repoIds.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Bug reports and issues created</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Connect a repo and start reporting bugs to see them here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reports = await prisma.report.findMany({
    where: { repoId: { in: repoIds } },
    include: {
      repo: { select: { fullName: true } },
      issue: { select: { githubNumber: true, githubUrl: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          {reports.length} report{reports.length === 1 ? "" : "s"} — bug reports and issues created
        </p>
      </div>

      {reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Reports will appear here when bugs are captured via the SDK or dashboard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {report.issue ? (
                      <a
                        href={report.issue.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline flex items-center gap-1.5 min-w-0"
                      >
                        <span className="truncate">{report.issue.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                      </a>
                    ) : (
                      <p className="text-sm font-medium truncate">
                        {report.rawInput?.slice(0, 100) || report.failReason || "No description"}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">{report.repo.fullName}</span>
                      {report.issue && (
                        <span className="text-xs text-muted-foreground">#{report.issue.githubNumber}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      {SOURCE_LABELS[report.source] ?? report.source}
                    </Badge>
                    <Badge variant={STATUS_COLORS[report.status] ?? "outline"} className="text-[10px]">
                      {report.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
