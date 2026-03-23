"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function connectRepo(
  githubId: number,
  fullName: string,
  owner: string,
  name: string,
  isPrivate: boolean
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.repo.findUnique({
    where: { githubId },
  });

  if (existing) {
    throw new Error("Repo already connected");
  }

  await prisma.repo.create({
    data: {
      userId: session.user.id,
      githubId,
      fullName,
      owner,
      name,
      isPrivate,
    },
  });

  revalidatePath("/dashboard/repos");
}

export async function disconnectRepo(repoId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const repo = await prisma.repo.findUnique({
    where: { id: repoId },
  });

  if (!repo || repo.userId !== session.user.id) {
    throw new Error("Repo not found");
  }

  await prisma.repo.delete({
    where: { id: repoId },
  });

  revalidatePath("/dashboard/repos");
}
