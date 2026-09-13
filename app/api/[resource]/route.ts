import { handleDelete, handlePatch, handlePost } from "@/lib/crud-api";

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  return handlePost((await params).resource, request);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  return handlePatch((await params).resource, request);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  return handleDelete((await params).resource, request);
}
