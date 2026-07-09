import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getTask } from "@/lib/db";
import { notifyRejectedComplete } from "@/lib/telegram";
import { rejectComplete } from "@/lib/workflow";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Context) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { feedback } = body as { feedback?: string };

  if (!feedback?.trim()) {
    return NextResponse.json(
      { error: "feedback required — explain what still needs to be done" },
      { status: 400 }
    );
  }

  const result = await rejectComplete(id, feedback, user.role);
  if (!result.ok) {
    const status = result.error.code === "not_found" ? 404 : 409;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  const task = await getTask(id);
  if (task) {
    await notifyRejectedComplete(task, user.role, feedback);
  }

  return NextResponse.json({
    task: result.task,
    commentId: result.commentId,
  });
}
