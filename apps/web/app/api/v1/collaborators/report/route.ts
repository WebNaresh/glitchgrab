export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCollabSession } from "@/lib/collab-auth";
import { processReport } from "@/lib/pipeline";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const session = await getCollabSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify collaborator is still active
    const collaborator = await prisma.collaborator.findFirst({
      where: {
        id: session.collaboratorId,
        status: "ACCEPTED",
      },
      include: {
        repos: { select: { repoId: true } },
      },
    });

    if (!collaborator) {
      return NextResponse.json(
        { success: false, error: "Access revoked or expired" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const repoId = formData.get("repoId") as string;
    const description = formData.get("description") as string;
    const screenshotFiles = formData.getAll("screenshot") as File[];

    if (!repoId) {
      return NextResponse.json(
        { success: false, error: "Repo is required" },
        { status: 400 }
      );
    }

    if (!description && screenshotFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "Provide a description or screenshot" },
        { status: 400 }
      );
    }

    // Verify collaborator has access to this repo
    const hasAccess = collaborator.repos.some((r) => r.repoId === repoId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "No access to this repository" },
        { status: 403 }
      );
    }

    // Convert screenshots to base64 data URLs
    const screenshotDataUrls: string[] = [];
    for (const file of screenshotFiles) {
      if (!(file instanceof File) || file.size === 0) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const resized = await sharp(buffer)
        .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      const base64 = resized.toString("base64");
      screenshotDataUrls.push(`data:image/jpeg;base64,${base64}`);
    }

    const primaryScreenshot = screenshotDataUrls[0] ?? null;

    // Create the report with collaborator attribution
    const report = await prisma.report.create({
      data: {
        repoId,
        collaboratorId: collaborator.id,
        source: "COLLABORATOR",
        status: "PENDING",
        rawInput: description
          ? `${description}\n\n---\n> Reported by: ${session.email} via Glitchgrab`
          : `> Reported by: ${session.email} via Glitchgrab`,
        screenshot: primaryScreenshot,
        metadata: screenshotDataUrls.length > 1
          ? { extraScreenshots: screenshotDataUrls.slice(1), collaboratorEmail: session.email }
          : { collaboratorEmail: session.email },
      },
    });

    // Update last active
    await prisma.collaborator.update({
      where: { id: collaborator.id },
      data: { lastActiveAt: new Date() },
    });

    // Process with AI pipeline
    const result = await processReport(report.id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? "Pipeline failed",
          data: { reportId: report.id, status: "FAILED" },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        intent: result.intent,
        issueUrl: result.issueUrl,
        issueNumber: result.issueNumber,
        title: result.title,
        message: result.message,
        status: "CREATED",
      },
    });
  } catch (error) {
    console.error("Collaborator report error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
