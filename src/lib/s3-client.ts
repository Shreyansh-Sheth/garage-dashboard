import { S3Client } from "@aws-sdk/client-s3";

const S3_ENDPOINT = process.env.NEXT_PUBLIC_GARAGE_S3_ENDPOINT;
const S3_REGION = process.env.NEXT_PUBLIC_GARAGE_REGION || "garage";

export function getS3Client(accessKeyId: string, secretAccessKey: string) {
  if (!S3_ENDPOINT) {
    throw new Error("NEXT_PUBLIC_GARAGE_S3_ENDPOINT must be set in .env.local");
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3 access key and secret key are required");
  }

  return new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}
