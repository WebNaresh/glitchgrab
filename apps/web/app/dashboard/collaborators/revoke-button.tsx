"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RevokeButtonProps {
  collaboratorId: string;
  email: string;
}

export function RevokeButton({ collaboratorId, email }: RevokeButtonProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { data } = await axios.patch(`/api/v1/collaborators/${collaboratorId}/revoke`);
      if (!data.success) throw new Error(data.error ?? "Failed to remove");
      return data;
    },
    onSuccess: () => {
      toast.success(`Removed ${email}`);
      queryClient.invalidateQueries({ queryKey: ["collaborators"] });
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
          />
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
        revoke
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-400" />
            revoke_collaborator
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will revoke{" "}
            <strong className="font-mono text-foreground">{email}</strong>
            &apos;s access to your repositories. They won&apos;t be able to
            report bugs anymore. You can always invite them again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            className="font-mono text-[11px] uppercase tracking-widest"
          >
            cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => mutate()}
            className="font-mono text-[11px] uppercase tracking-widest"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                removing...
              </>
            ) : (
              "revoke access"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
