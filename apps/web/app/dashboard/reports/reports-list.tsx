"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Loader2 } from "lucide-react";
import { ReportsTabs } from "./reports-tabs";

interface ReportFromAPI {
  id: string;
  source: string;
  status: string;
  rawInput: string | null;
  failReason: string | null;
  createdAt: string;
  repoId: string;
  repoFullName: string;
  reporterPrimaryKey: string;
  reporterName: string;
  reporterEmail: string | null;
  issue: {
    githubNumber: number;
    githubUrl: string;
    title: string;
    githubState: string | null;
  } | null;
}

export function ReportsList({ isOwner }: { isOwner: boolean }) {
  const { data, isLoading, isFetching } = useQuery<ReportFromAPI[]>({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data } = await axios.get("/api/v1/reports");
      return data.data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const reports = data ?? [];

  if (reports.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Reports will appear here when bugs are captured via the SDK or dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  // TODO: split into myReports vs productIssues using platform token repo detection
  // For now, show all as product issues
  const mapped = reports.map((r) => ({
    id: r.id,
    source: r.source,
    status: r.status,
    rawInput: r.rawInput,
    failReason: r.failReason,
    createdAt: r.createdAt,
    repoFullName: r.repoFullName,
    reporterPrimaryKey: r.reporterPrimaryKey,
    reporterName: r.reporterName,
    reporterEmail: r.reporterEmail,
    issue: r.issue,
  }));

  return (
    <div className="relative">
      {isFetching && !isLoading && (
        <div className="absolute top-0 right-0">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <ReportsTabs
        myReports={[]}
        productIssues={mapped}
        isOwner={isOwner}
      />
    </div>
  );
}
