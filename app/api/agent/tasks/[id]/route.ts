import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import {
  deleteTask,
  getTask,
  getTaskComments,
  getTaskImages,
  updateTask,
} from "@/lib/db";
import {
  notifyAgentAction,
  notifyTaskDeleted,
  notifyTaskUpdated,
} from "@/lib/telegram";
import type {
  TaskCategory,
  TaskImportance,
  TaskSite,
  TaskStatus,
  TaskUrgency,
} from "@/lib/types";

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

  const [comments, images] = await Promise.all([
    getTaskComments(id),
    getTaskImages(id),
  ]);

  return NextResponse.json({ task, comments, images });
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = authenticateAgent(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { title, description, status, category, urgency, importance, site } =
    body as {
      title?: string;
      description?: string;
      status?: TaskStatus;
      category?: TaskCategory;
      urgency?: TaskUrgency;
      importance?: TaskImportance;
      site?: TaskSite;
    };

  const result = await updateTask(
    id,
    { title, description, status, category, urgency, importance, site },
    AGENT_ACTOR
  );

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (result.activity) {
    await notifyTaskUpdated(result.task, result.activity, AGENT_ACTOR);
    await notifyAgentAction(result.task, "Updated task", result.activity.details);
  }

  return NextResponse.json({ task: result.task });
}

export async function DELETE(request: Request, { params }: Context) {
  const auth = authenticateAgent(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await getTask(id);
  const result = await deleteTask(id, AGENT_ACTOR);

  if (!result.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing) {
    await notifyTaskDeleted(existing.title, AGENT_ACTOR);
    await notifyAgentAction(existing, "Deleted task");
  }

  return NextResponse.json({ ok: true });
}
