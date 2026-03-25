"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserX } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RevokeButtonProps {
  collaboratorId: string;
  email: string;
}

export function RevokeButton({ collaboratorId, email }: RevokeButtonProps) {
  const [revoking, setRevoking] = useState(false);
  const router = useRouter();

  async function handleRevoke() {
    if (!confirm(`Revoke access for ${email}?`)) return;

    setRevoking(true);
    try {
      const res = await fetch(`/api/v1/collaborators/${collaboratorId}/revoke`, {
        method: "PATCH",
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Revoked access for ${email}`);
        router.refresh();
      } else {
        toast.error(json.error ?? "Failed to revoke");
      }
    } catch {
      toast.error("Failed to revoke");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive shrink-0"
      disabled={revoking}
      onClick={handleRevoke}
    >
      {revoking ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <UserX className="h-4 w-4 mr-1" />
          Revoke
        </>
      )}
    </Button>
  );
}
