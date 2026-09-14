import { NextResponse } from "next/server";
import { ensureDatabaseSchema, getMaintenance } from "@/lib/db";
import { handleDelete, handlePatch, handlePost } from "@/lib/crud-api";

export async function GET() {
  await ensureDatabaseSchema();
  return NextResponse.json({ maintenance: await getMaintenance() });
}

export function POST(request: Request) {
  return handlePost("maintenance", request);
}

export function PATCH(request: Request) {
  return handlePatch("maintenance", request);
}

export function DELETE(request: Request) {
  return handleDelete("maintenance", request);
}
