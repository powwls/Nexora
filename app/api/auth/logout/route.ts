import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE, "", { expires: new Date(0), path: "/" });
  response.cookies.set("nexora_admin_email", "", { expires: new Date(0), path: "/" });
  return response;
}
