"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function createS3Client() {
  const region = process.env.NEXT_AWS_S3_REGION || process.env.AWS_S3_REGION;
  const accessKeyId = process.env.NEXT_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.NEXT_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("S3_CONFIG_INCOMPLETE");
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Upload a base64 data URL image to S3 and return the public URL.
 * Returns null if S3 is not configured or upload fails.
 */
export async function uploadScreenshotToS3(
  base64DataUrl: string,
  reportId: string
): Promise<string | null> {
  const bucketName = process.env.NEXT_AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.NEXT_AWS_S3_REGION || process.env.AWS_S3_REGION;

  if (!bucketName || !region) {
    console.error("[S3] Missing config:", { bucketName: !!bucketName, region: !!region });
    return null;
  }

  const base64Match = base64DataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!base64Match) return null;

  const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
  const base64Content = base64Match[2];
  const buffer = Buffer.from(base64Content, "base64");
  const key = `screenshots/${reportId}.${ext}`;
  const contentType = `image/${base64Match[1]}`;

  try {
    const s3Client = createS3Client();
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return `https://cdn.glitchgrab.dev/${key}?v=${Date.now()}`;
  } catch (error) {
    console.error("[S3] Upload failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
