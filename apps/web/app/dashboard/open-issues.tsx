"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AlertCircle, ArrowRight, Circle, Loader2, MessageCircle } from "lucide-react";

interface IssueItem {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  author: string;
  authorAvatar: string | null;
  comments: number;
  labels: { name: string; color: string }[];
  repoFullName: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.round(diff / 60000))}m`;
  if (diff < day) return `${Math.round(diff / (60 * 60 * 1000))}h`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d`;
  return new Date(iso).toLocaleDateString();
}

function isHighPriority(labels: { name: string }[]) {
  return labels.some((l) => /p0|p1|critical|urgent|security|bug/i.test(l.name));
}

export function OpenIssues() {
  const { data, isLoading } = useQuery<IssueItem[]>({
    queryKey: ["open-issues"],
    queryFn: async () => {
      const { data } = await axios.get("/api/v1/repos/issues");
      return data.data ?? [];
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center gap-3 border border-dashed border-border rounded-md px-4 py-4">
        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-xs font-mono text-muted-foreground">
          No open issues — nice work.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.slice(0, 5).map((issue) => {
        const critical = isHighPriority(issue.labels);
        return (
          <li key={`${issue.repoFullName}-${issue.number}`}>
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative block rounded-md p-3 pl-4 transition-colors border ${
                critical
                  ? "bg-red-500/5 border-red-500/20 hover:border-red-500/50"
                  : "bg-card/40 border-border hover:bg-card hover:border-primary/50"
              }`}
            >
              <span
                aria-hidden
                className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-l-md ${
                  critical ? "bg-red-500/80" : "bg-border"
                }`}
              />
              <div className="flex items-start gap-3">
                <div className="pt-0.5 shrink-0">
                  {critical ? (
                    <AlertCircle className="h-4 w-4 text-red-400 fill-red-500/30" />
                  ) : (
                    <Circle className="h-4 w-4 text-primary/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {issue.title}
                    </h3>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-muted-foreground flex-wrap">
                    <span className="text-primary/70">
                      {issue.repoFullName} #{issue.number}
                    </span>
                    <span className="opacity-40">·</span>
                    <span>{timeAgo(issue.createdAt)}</span>
                    {issue.comments > 0 && (
                      <>
                        <span className="opacity-40">·</span>
                        <span className="flex items-center gap-0.5">
                          <MessageCircle className="h-3 w-3" />
                          {issue.comments}
                        </span>
                      </>
                    )}
                    {issue.labels.slice(0, 2).map((label) => {
                      const isBug = /bug|critical|p0/i.test(label.name);
                      return (
                        <span
                          key={label.name}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            isBug
                              ? "text-red-400 bg-red-400/10 border-red-400/20"
                              : "text-muted-foreground bg-muted border-border"
                          }`}
                        >
                          {label.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
