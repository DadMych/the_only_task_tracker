import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { getActivitySince, getRecentActivity } from "@/lib/db";

export async function GET(request: Request) {
  const auth = authenticateAgent(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const activity = since
    ? await getActivitySince(since)
    : await getRecentActivity(limit);

  return NextResponse.json({ activity, count: activity.length });
}
