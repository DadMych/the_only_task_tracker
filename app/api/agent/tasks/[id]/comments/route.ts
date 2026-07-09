import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import {
  createComment,
  getComment,
  getTask,
  getTaskComments,
} from "@/lib/db";
import { notifyAgentAction, notifyTaskComment } from "@/lib/telegram";

const AGENT_ACTOR = "owner" as const;

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Context) {
  const auth = authenticateAgent(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const task = await getTask(id);
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comments = await getTaskComments(id);
  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: Context) {
  const auth = authenticateAgent(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { body: text, parent_id } = body as {
    body?: string;
    parent_id?: string;
  };

  if (!text?.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  const comment = await createComment(
    id,
    text.trim(),
    AGENT_ACTOR,
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
    await notifyTaskComment(task, comment, AGENT_ACTOR, parent);
    await notifyAgentAction(task, "Added comment", text.trim());
  }

  return NextResponse.json({ comment }, { status: 201 });
}
