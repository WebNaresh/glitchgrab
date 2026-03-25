"use client";

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
import { Loader2, UserX } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RevokeButtonProps {
  collaboratorId: string;
  email: string;
}

export function RevokeButton({ collaboratorId, email }: RevokeButtonProps) {
  const [removing, setRemoving] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch(`/api/v1/collaborators/${collaboratorId}/revoke`, {
        method: "PATCH",
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Removed ${email}`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(json.error ?? "Failed to remove");
      }
    } catch {
      toast.error("Failed to remove");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive shrink-0"
          />
        }
      >
        <UserX className="h-4 w-4 mr-1" />
        Remove
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove collaborator?</AlertDialogTitle>
          <AlertDialogDescription>
            This will revoke <strong>{email}</strong>&apos;s access to your
            repositories. They won&apos;t be able to report bugs anymore. You can
            always invite them again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={removing}
            onClick={handleRemove}
          >
            {removing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Removing...
              </>
            ) : (
              "Remove"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
