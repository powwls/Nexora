import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const email = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("nexora_admin_email="))
    ?.split("=")[1];

  return NextResponse.json({ email: email ? decodeURIComponent(email) : null });
}