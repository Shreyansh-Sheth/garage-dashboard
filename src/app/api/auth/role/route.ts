import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, validateAuthToken, AuthRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) {
    return NextResponse.json({ role: null });
  }

  let role: AuthRole | null = null;

  const adminPassword = process.env.DASHBOARD_PASSWORD;
  const readOnlyPassword = process.env.READ_ONLY_PASSWORD;

  if (adminPassword) {
    role = await validateAuthToken(cookie, adminPassword);
  }
  if (!role && readOnlyPassword) {
    role = await validateAuthToken(cookie, readOnlyPassword);
  }

  return NextResponse.json({ role });
}
