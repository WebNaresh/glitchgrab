import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { createCollabToken, getCollabCookieName } from "@/lib/collab-auth";
import { cookies } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface AcceptPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptPage({ searchParams }: AcceptPageProps) {
  const { token: rawToken } = await searchParams;

  if (!rawToken) {
    return (
      <ErrorCard
        title="Missing invitation token"
        message="The invitation link appears to be incomplete. Please check the link from your email."
      />
    );
  }

  const tokenHash = hashToken(rawToken);

  const collaborator = await prisma.collaborator.findUnique({
    where: { tokenHash },
    include: { invitedBy: { select: { id: true, name: true } } },
  });

  if (!collaborator) {
    return (
      <ErrorCard
        title="Invalid invitation"
        message="This invitation link is invalid or has already been used."
      />
    );
  }

  if (collaborator.status === "REVOKED") {
    return (
      <ErrorCard
        title="Invitation revoked"
        message="This invitation has been revoked by the repository owner."
      />
    );
  }

  if (collaborator.expiresAt < new Date()) {
    return (
      <ErrorCard
        title="Invitation expired"
        message="This invitation has expired. Please ask the repository owner to send a new one."
      />
    );
  }

  // Mark as accepted
  await prisma.collaborator.update({
    where: { id: collaborator.id },
    data: {
      status: "ACCEPTED",
      lastActiveAt: new Date(),
    },
  });

  // Create session token and set cookie
  const sessionToken = createCollabToken({
    collaboratorId: collaborator.id,
    email: collaborator.email,
    ownerId: collaborator.invitedById,
  });

  const cookieStore = await cookies();
  cookieStore.set(getCollabCookieName(), sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  redirect("/collaborate");
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </CardContent>
    </Card>
  );
}
