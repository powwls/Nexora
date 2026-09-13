import { NextResponse } from "next/server";
import {
  createRecord,
  deleteRecord,
  isCrudResource,
  updateRecord,
} from "@/lib/crud";

export async function handlePost(resource: string, request: Request) {
  if (!isCrudResource(resource)) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  try {
    return NextResponse.json(await createRecord(resource, await request.json()), { status: 201 });
  } catch (error) {
    console.error(`POST /api/${resource} failed`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create record" }, { status: 500 });
  }
}

export async function handlePatch(resource: string, request: Request) {
  if (!isCrudResource(resource)) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  try {
    const body = await request.json();
    const key = String(body._key ?? body[resource === "assets" ? "asset" : "id"] ?? "");
    if (!key) return NextResponse.json({ error: "Missing record key" }, { status: 400 });
    delete body._key;
    const record = await updateRecord(resource, key, body);
    return record ? NextResponse.json(record) : NextResponse.json({ error: "Record not found" }, { status: 404 });
  } catch (error) {
    console.error(`PATCH /api/${resource} failed`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update record" }, { status: 500 });
  }
}

export async function handleDelete(resource: string, request: Request) {
  if (!isCrudResource(resource)) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  try {
    const body = await request.json();
    const key = String(body.key ?? "");
    if (!key) return NextResponse.json({ error: "Missing record key" }, { status: 400 });
    const deleted = await deleteRecord(resource, key);
    return deleted ? NextResponse.json({ deleted: true }) : NextResponse.json({ error: "Record not found" }, { status: 404 });
  } catch (error) {
    console.error(`DELETE /api/${resource} failed`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete record" }, { status: 500 });
  }
}
