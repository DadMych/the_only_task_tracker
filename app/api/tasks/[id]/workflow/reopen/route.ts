import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getTask } from "@/lib/db";
import { notifyReopened } from "@/lib/telegram";
import { reopenTask, type ReopenInput } from "@/lib/workflow";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Context) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as ReopenInput;

  if (!body.summary?.trim()) {
    return NextResponse.json(
      { error: "summary required — explain why the task is reopened" },
      { status: 400 }
    );
  }

  const result = await reopenTask(id, body, user.role);
  if (!result.ok) {
    const status = result.error.code === "not_found" ? 404 : 409;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  const task = await getTask(id);
  if (task) {
    await notifyReopened(task, user.role, body.summary);
  }

  return NextResponse.json({
    task: result.task,
    commentId: result.commentId,
  });
}
