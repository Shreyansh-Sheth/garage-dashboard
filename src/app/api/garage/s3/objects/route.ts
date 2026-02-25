import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getS3Client } from "@/lib/s3-client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bucket = searchParams.get("bucket");
  const prefix = searchParams.get("prefix") || "";
  const continuationToken = searchParams.get("continuationToken") || undefined;

  const accessKey = request.headers.get("x-s3-access-key");
  const secretKey = request.headers.get("x-s3-secret-key");

  if (!bucket) {
    return NextResponse.json(
      { error: "bucket query parameter is required" },
      { status: 400 },
    );
  }

  if (!accessKey || !secretKey) {
    return NextResponse.json(
      { error: "S3 credentials are required" },
      { status: 401 },
    );
  }

  try {
    const s3 = getS3Client(accessKey, secretKey);
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: "/",
      MaxKeys: 200,
      ContinuationToken: continuationToken,
    });

    const response = await s3.send(command);

    return NextResponse.json({
      objects: (response.Contents ?? []).map((obj) => ({
        key: obj.Key!,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified?.toISOString() ?? null,
        etag: obj.ETag ?? null,
        storageClass: obj.StorageClass ?? null,
      })),
      prefixes: (response.CommonPrefixes ?? []).map((p) => p.Prefix!),
      isTruncated: response.IsTruncated ?? false,
      nextContinuationToken: response.NextContinuationToken ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
