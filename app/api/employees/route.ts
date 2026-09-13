import { NextResponse } from "next/server";
import { ensureDatabaseSchema, getEmployees } from "@/lib/db";
import { handleDelete, handlePatch, handlePost } from "@/lib/crud-api";

export async function GET() {
  await ensureDatabaseSchema();
  return NextResponse.json({ employees: await getEmployees() });
}

export function POST(request: Request) {
  return handlePost("employees", request);
}

export function PATCH(request: Request) {
  return handlePatch("employees", request);
}

export function DELETE(request: Request) {
  return handleDelete("employees", request);
}
