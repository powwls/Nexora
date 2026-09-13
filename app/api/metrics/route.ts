import { NextResponse } from "next/server";
import {
  ensureDatabaseSchema,
  getActivities,
  getDashboardSummary,
} from "@/lib/db";

export async function GET() {
  await ensureDatabaseSchema();
  const [activities, summary] = await Promise.all([
    getActivities(),
    getDashboardSummary(),
  ]);
  return NextResponse.json({ activities, summary });
}
