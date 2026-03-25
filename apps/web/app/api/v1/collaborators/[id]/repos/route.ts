export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface UpdateReposBody {
  repoIds: string[];
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateReposBody;
    const { repoIds } = body;

    if (!repoIds?.length) {
      return NextResponse.json(
        { success: false, error: "At least one repo is required" },
        { status: 400 }
      );
    }

    const collaborator = await prisma.collaborator.findFirst({
      where: { id, invitedById: session.user.id },
    });

    if (!collaborator) {
      return NextResponse.json(
        { success: false, error: "Collaborator not found" },
        { status: 404 }
      );
    }

    // Verify all repos belong to this user
    const repos = await prisma.repo.findMany({
      where: { id: { in: repoIds }, userId: session.user.id },
    });

    if (repos.length !== repoIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more repos not found" },
        { status: 404 }
      );
    }

    // Replace all repo access
    await prisma.collaboratorRepo.deleteMany({
      where: { collaboratorId: id },
    });

    await prisma.collaboratorRepo.createMany({
      data: repoIds.map((repoId) => ({
        collaboratorId: id,
        repoId,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update collaborator repos error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
