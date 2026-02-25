import { NextResponse } from "next/server";
import { COOKIE_NAME, computeAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const expected = process.env.DASHBOARD_PASSWORD;
    if (!expected) {
      return NextResponse.json(
        { error: "Dashboard password not configured" },
        { status: 500 },
      );
    }

    if (!password || password !== expected) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 },
      );
    }

    const token = await computeAuthToken(expected);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
