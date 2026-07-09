import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { getTask } from "@/lib/db";
import { notifyProposedComplete } from "@/lib/telegram";
import { proposeComplete } from "@/lib/workflow";

const AGENT_ACTOR = "owner" as const;

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Context) {
  const auth = authenticateAgent(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { summary } = body as { summary?: string };

  if (!summary?.trim()) {
    return NextResponse.json(
      { error: "summary required — describe what was done" },
      { status: 400 }
    );
  }

  const result = await proposeComplete(id, summary, AGENT_ACTOR);
  if (!result.ok) {
    const status = result.error.code === "not_found" ? 404 : 409;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  const task = await getTask(id);
  if (task) {
    await notifyProposedComplete(task, summary);
  }

  return NextResponse.json({
    task: result.task,
    commentId: result.commentId,
  });
}
