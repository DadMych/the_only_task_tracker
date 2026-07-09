import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api-auth";
import {
  createTask,
  getAllTasks,
  getRecentActivity,
  getStats,
  updateTask,
} from "@/lib/db";
import { notifyAgentAction, notifyTaskCreated } from "@/lib/telegram";
import type {
  TaskCategory,
  TaskImportance,
  TaskSite,
  TaskUrgency,
} from "@/lib/types";

const AGENT_ACTOR = "owner" as const;

export async function GET(request: Request) {
  const auth = authenticateAgent(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let tasks = await getAllTasks();
  if (status) {
    tasks = tasks.filter((t) => t.status === status);
  }

  const [activity, stats] = await Promise.all([
    getRecentActivity(30),
    getStats(),
  ]);

  return NextResponse.json({ tasks, activity, stats });
}

export async function POST(request: Request) {
  const auth = authenticateAgent(request);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { title, description, category, urgency, importance, site, status } =
    body as {
      title?: string;
      description?: string;
      category?: TaskCategory;
      urgency?: TaskUrgency;
      importance?: TaskImportance;
      site?: TaskSite;
      status?: "backlog" | "in_progress";
    };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const { task, activity } = await createTask(
    {
      title: title.trim(),
      description: description?.trim() ?? "",
      category: category ?? "other",
      urgency: urgency ?? "not_urgent",
      importance: importance ?? "yellow",
      site: site ?? "fofgod.com",
    },
    AGENT_ACTOR
  );

  if (status === "in_progress" && task.status !== "in_progress") {
    const updated = await updateTask(task.id, { status: "in_progress" }, AGENT_ACTOR);
    if (updated) {
      await notifyAgentAction(updated.task, "Created task (in progress)");
      return NextResponse.json({ task: updated.task, activity }, { status: 201 });
    }
  }

  await notifyTaskCreated(task, AGENT_ACTOR);
  await notifyAgentAction(task, "Created task");

  return NextResponse.json({ task, activity }, { status: 201 });
}
