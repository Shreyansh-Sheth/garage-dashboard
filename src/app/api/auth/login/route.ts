import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_MAX_AGE, createAuthToken, AuthRole } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.DASHBOARD_PASSWORD;
    const readOnlyPassword = process.env.READ_ONLY_PASSWORD;

    if (!adminPassword && !readOnlyPassword) {
      return NextResponse.json(
        { error: "No dashboard passwords configured" },
        { status: 500 },
      );
    }

    let matchedRole: AuthRole | null = null;
    let matchedPassword: string | null = null;

    if (adminPassword && password === adminPassword) {
      matchedRole = "admin";
      matchedPassword = adminPassword;
    } else if (readOnlyPassword && password === readOnlyPassword) {
      matchedRole = "readonly";
      matchedPassword = readOnlyPassword;
    }

    if (!matchedRole || !matchedPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 },
      );
    }

    const token = await createAuthToken(matchedPassword, matchedRole);

    const response = NextResponse.json({ ok: true, role: matchedRole });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
