import { NextResponse } from "next/server";
import { ensureDatabaseSchema, getNetworkDevices } from "@/lib/db";
import { handleDelete, handlePatch, handlePost } from "@/lib/crud-api";

export async function GET() {
  await ensureDatabaseSchema();
  return NextResponse.json({ devices: await getNetworkDevices() });
}

export function POST(request: Request) {
  return handlePost("network-devices", request);
}

export function PATCH(request: Request) {
  return handlePatch("network-devices", request);
}

export function DELETE(request: Request) {
  return handleDelete("network-devices", request);
}
