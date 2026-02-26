import { S3Client } from "@aws-sdk/client-s3";

export function getS3Client(
  accessKeyId: string,
  secretAccessKey: string,
  s3Endpoint: string,
  region: string,
) {
  if (!s3Endpoint) {
    throw new Error("S3 endpoint must be configured");
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3 access key and secret key are required");
  }

  return new S3Client({
    endpoint: s3Endpoint,
    region: region || "garage",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}
