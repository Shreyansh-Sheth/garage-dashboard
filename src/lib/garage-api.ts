const ADMIN_URL = process.env.GARAGE_ADMIN_URL;
const ADMIN_TOKEN = process.env.GARAGE_ADMIN_TOKEN;

export class GarageApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function garageApi<T = unknown>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<T> {
  if (!ADMIN_URL || !ADMIN_TOKEN) {
    throw new GarageApiError(
      500,
      "GARAGE_ADMIN_URL and GARAGE_ADMIN_TOKEN must be set in .env.local",
    );
  }

  const url = `${ADMIN_URL}${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GarageApiError(
      res.status,
      `Garage API ${method} ${endpoint}: ${res.status} ${res.statusText} ${text}`,
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text() as unknown as T;
}
