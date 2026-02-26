import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, validateAuthToken, AuthRole } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API through
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  const adminPassword = process.env.DASHBOARD_PASSWORD;
  const readOnlyPassword = process.env.READ_ONLY_PASSWORD;

  if (!adminPassword && !readOnlyPassword) {
    // No passwords configured — let everything through
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Try validating against both passwords
  let role: AuthRole | null = null;

  if (adminPassword) {
    role = await validateAuthToken(cookie, adminPassword);
  }
  if (!role && readOnlyPassword) {
    role = await validateAuthToken(cookie, readOnlyPassword);
  }

  if (!role) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Block write operations for readonly users
  if (role === "readonly") {
    const method = request.method.toUpperCase();
    if (
      (method === "POST" || method === "PUT" || method === "DELETE") &&
      pathname.startsWith("/api/garage/")
    ) {
      return NextResponse.json(
        { error: "Read-only access: write operations are not permitted" },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
