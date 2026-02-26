import { GarageApiError } from "@/lib/garage-api";
import { getClusterFromRequest } from "@/lib/cluster-from-request";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ParsedMetric {
  name: string;
  labels: Record<string, string>;
  value: number;
}

function parsePrometheus(text: string): ParsedMetric[] {
  const metrics: ParsedMetric[] = [];
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    // Match: metric_name{label="val",...} value  OR  metric_name value
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{(.+?)\})?\s+(.+)$/);
    if (!match) continue;
    const name = match[1];
    const labelsStr = match[3] || "";
    const value = parseFloat(match[4]);
    if (isNaN(value)) continue;

    const labels: Record<string, string> = {};
    if (labelsStr) {
      for (const part of labelsStr.match(/([a-zA-Z_]+)="([^"]*)"/g) || []) {
        const [k, v] = part.split("=");
        labels[k] = v.replace(/^"|"$/g, "");
      }
    }
    metrics.push({ name, labels, value });
  }
  return metrics;
}

export interface GarageMetrics {
  s3: {
    totalRequests: number;
    totalErrors: number;
    operations: { endpoint: string; count: number }[];
    errors: { endpoint: string; statusCode: string; count: number }[];
  };
  blockIO: {
    bytesRead: number;
    bytesWritten: number;
  };
  admin: {
    totalRequests: number;
    operations: { endpoint: string; count: number }[];
  };
}

export async function GET(request: Request) {
  try {
    const cluster = getClusterFromRequest(request);

    const res = await fetch(`${cluster.adminUrl}/metrics`, {
      headers: { Authorization: `Bearer ${cluster.adminToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new GarageApiError(
        res.status,
        `Metrics endpoint: ${res.status} ${res.statusText}`,
      );
    }

    const text = await res.text();
    const parsed = parsePrometheus(text);

    // S3 request counts
    const s3Requests = parsed
      .filter((m) => m.name === "api_s3_request_counter")
      .map((m) => ({ endpoint: m.labels.api_endpoint || "unknown", count: m.value }))
      .sort((a, b) => b.count - a.count);

    const s3Errors = parsed
      .filter((m) => m.name === "api_s3_error_counter")
      .map((m) => ({
        endpoint: m.labels.api_endpoint || "unknown",
        statusCode: m.labels.status_code || "unknown",
        count: m.value,
      }))
      .sort((a, b) => b.count - a.count);

    // Block I/O
    const blockRead = parsed.find((m) => m.name === "block_bytes_read")?.value ?? 0;
    const blockWritten = parsed.find((m) => m.name === "block_bytes_written")?.value ?? 0;

    // Admin API
    const adminRequests = parsed
      .filter((m) => m.name === "api_admin_request_counter")
      .map((m) => ({ endpoint: m.labels.api_endpoint || "unknown", count: m.value }))
      .sort((a, b) => b.count - a.count);

    const result: GarageMetrics = {
      s3: {
        totalRequests: s3Requests.reduce((s, r) => s + r.count, 0),
        totalErrors: s3Errors.reduce((s, r) => s + r.count, 0),
        operations: s3Requests,
        errors: s3Errors,
      },
      blockIO: {
        bytesRead: blockRead,
        bytesWritten: blockWritten,
      },
      admin: {
        totalRequests: adminRequests.reduce((s, r) => s + r.count, 0),
        operations: adminRequests,
      },
    };

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof GarageApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 502 },
    );
  }
}
