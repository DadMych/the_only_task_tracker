import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getTask } from "@/lib/db";
import { notifyConfirmedComplete } from "@/lib/telegram";
import { confirmComplete } from "@/lib/workflow";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Context) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { note } = body as { note?: string };

  const result = await confirmComplete(id, note, user.role);
  if (!result.ok) {
    const status = result.error.code === "not_found" ? 404 : 409;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  const task = await getTask(id);
  if (task) {
    await notifyConfirmedComplete(task, user.role, note);
  }

  return NextResponse.json({
    task: result.task,
    commentId: result.commentId,
  });
}
