"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Settings, GitFork } from "lucide-react";
import { toast } from "sonner";

interface Repo {
  id: string;
  fullName: string;
}

export function EditReposDialog({
  collaboratorId,
  email,
  currentRepoIds,
  allRepos,
}: {
  collaboratorId: string;
  email: string;
  currentRepoIds: string[];
  allRepos: Repo[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentRepoIds));
  const queryClient = useQueryClient();

  function toggleRepo(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { data } = await axios.patch(`/api/v1/collaborators/${collaboratorId}/repos`, {
        repoIds: Array.from(selectedIds),
      });
      if (!data.success) throw new Error(data.error ?? "Failed to update");
      return data;
    },
    onSuccess: () => {
      toast.success(`Updated repos for ${email}`);
      queryClient.invalidateQueries({ queryKey: ["collaborators"] });
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    },
  });

  const hasChanges =
    selectedIds.size !== currentRepoIds.length ||
    !currentRepoIds.every((id) => selectedIds.has(id));

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setSelectedIds(new Set(currentRepoIds));
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted"
          />
        }
      >
        <Settings className="h-3.5 w-3.5" />
        edit repos
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Settings className="h-4 w-4" />
            edit_repo_access
          </DialogTitle>
          <p className="font-mono text-[11px] text-muted-foreground truncate">
            {email}
          </p>
        </DialogHeader>

        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <GitFork className="h-3 w-3" />
            accessible repositories
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1 rounded border border-border bg-card/40 p-2">
            {allRepos.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground text-center py-4">
                No repos connected.
              </p>
            ) : (
              allRepos.map((repo) => {
                const selected = selectedIds.has(repo.id);
                return (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => toggleRepo(repo.id)}
                    className={`flex items-center justify-between w-full rounded px-3 py-2 text-sm font-mono transition border ${
                      selected
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "hover:bg-muted text-foreground border-transparent"
                    }`}
                  >
                    <span className="truncate">{repo.fullName}</span>
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <Button
          className="w-full font-mono text-[11px] uppercase tracking-widest"
          disabled={isPending || selectedIds.size === 0 || !hasChanges}
          onClick={() => mutate()}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              updating...
            </>
          ) : (
            <>
              update ({selectedIds.size} repo
              {selectedIds.size !== 1 ? "s" : ""})
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
