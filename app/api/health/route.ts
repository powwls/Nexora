import { NextResponse } from "next/server";
import { ensureDatabaseSchema } from "@/lib/db";

export async function GET() {
  try {
    await ensureDatabaseSchema();
    return NextResponse.json({ connected: true, database: "postgresql" });
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: error instanceof Error ? error.message : "Database connection failed." },
      { status: 503 },
    );
  }
}
