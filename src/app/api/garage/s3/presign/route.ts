import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client } from "@/lib/s3-client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const accessKey = request.headers.get("x-s3-access-key");
    const secretKey = request.headers.get("x-s3-secret-key");

    if (!accessKey || !secretKey) {
      return NextResponse.json(
        { error: "S3 credentials are required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { bucket, key, expiresIn } = body;

    if (!bucket || !key) {
      return NextResponse.json(
        { error: "bucket and key are required" },
        { status: 400 },
      );
    }

    const ttl = Math.min(Math.max(Number(expiresIn) || 3600, 60), 604800); // 1min to 7days

    const s3 = getS3Client(accessKey, secretKey);
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: ttl });

    return NextResponse.json({ url, expiresIn: ttl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
