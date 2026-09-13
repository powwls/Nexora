import { NextResponse } from "next/server";
import { ensureDatabaseSchema, getAssets } from "@/lib/db";
import { handleDelete, handlePatch, handlePost } from "@/lib/crud-api";

export async function GET() {
  await ensureDatabaseSchema();
  return NextResponse.json({ assets: await getAssets() });
}

export function POST(request: Request) {
  return handlePost("assets", request);
}

export function PATCH(request: Request) {
  return handlePatch("assets", request);
}

export function DELETE(request: Request) {
  return handleDelete("assets", request);
}
