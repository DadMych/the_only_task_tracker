import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import { getTask } from "@/lib/db";
import { notifyReopened } from "@/lib/telegram";
import { reopenTask, type ReopenInput } from "@/lib/workflow";

const AGENT_ACTOR = "owner" as const;

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Context) {
  const auth = authenticateAgent(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as ReopenInput;

  if (!body.summary?.trim()) {
    return NextResponse.json(
      { error: "summary required — explain why the task is reopened and what changed" },
      { status: 400 }
    );
  }

  const result = await reopenTask(id, body, AGENT_ACTOR);
  if (!result.ok) {
    const status = result.error.code === "not_found" ? 404 : 409;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  const task = await getTask(id);
  if (task) {
    await notifyReopened(task, AGENT_ACTOR, body.summary);
  }

  return NextResponse.json({
    task: result.task,
    commentId: result.commentId,
  });
}
