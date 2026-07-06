import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  createComment,
  getComment,
  getTask,
  getTaskComments,
} from "@/lib/db";
import { notifyTaskComment } from "@/lib/telegram";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const task = await getTask(id);
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comments = await getTaskComments(id);
  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: Context) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { text, parent_id } = body as { text?: string; parent_id?: string };

  if (!text?.trim()) {
    return NextResponse.json({ error: "Text required" }, { status: 400 });
  }

  const comment = await createComment(
    id,
    text.trim(),
    user.role,
    parent_id ?? null
  );

  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const task = await getTask(id);
  if (task) {
    const parent = comment.parent_id
      ? await getComment(comment.parent_id)
      : undefined;
    await notifyTaskComment(task, comment, user.role, parent);
  }

  return NextResponse.json({ comment }, { status: 201 });
}
