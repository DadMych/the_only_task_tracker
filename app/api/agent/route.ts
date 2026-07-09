import { NextResponse } from "next/server";
import {
  CATEGORY_LABELS,
  IMPORTANCE_LABELS,
  SITE_LABELS,
  STATUS_LABELS,
  TASK_CATEGORIES,
  TASK_SITES,
  URGENCY_LABELS,
} from "@/lib/types";

const AGENT_ACTOR = "owner" as const;

export async function GET() {
  return NextResponse.json({
    name: "TFP Task Tracker Agent API",
    version: "1",
    auth: {
      type: "bearer",
      header: "Authorization: Bearer <AGENT_API_TOKEN>",
    },
    docs: "/docs/AI_AGENT_API.md",
    workflow: {
      summary:
        "Agent moves tasks through review. Human confirms or rejects in the UI.",
      steps: [
        "Create/update tasks via agent API (status: backlog or in_progress)",
        "When work is done: POST .../propose-complete → status becomes review",
        "Human confirms (UI) → done, or rejects → in_progress with feedback",
        "After reject or later changes: POST .../reopen with summary + field updates",
      ],
    },
    enums: {
      status: Object.entries(STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      category: TASK_CATEGORIES.map((value) => ({
        value,
        label: CATEGORY_LABELS[value],
      })),
      urgency: Object.entries(URGENCY_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      importance: Object.entries(IMPORTANCE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      site: TASK_SITES.map((value) => ({
        value,
        label: SITE_LABELS[value],
      })),
    },
    endpoints: [
      { method: "GET", path: "/api/agent", auth: false, description: "This manifest" },
      {
        method: "GET",
        path: "/api/agent/tasks",
        auth: true,
        description: "List all tasks, stats, recent activity",
      },
      {
        method: "POST",
        path: "/api/agent/tasks",
        auth: true,
        description: "Create a task",
      },
      {
        method: "GET",
        path: "/api/agent/tasks/:id",
        auth: true,
        description: "Get task with comments and screenshots",
      },
      {
        method: "PATCH",
        path: "/api/agent/tasks/:id",
        auth: true,
        description: "Update task fields",
      },
      {
        method: "DELETE",
        path: "/api/agent/tasks/:id",
        auth: true,
        description: "Delete a task",
      },
      {
        method: "GET",
        path: "/api/agent/tasks/:id/comments",
        auth: true,
        description: "List comments on a task",
      },
      {
        method: "POST",
        path: "/api/agent/tasks/:id/comments",
        auth: true,
        description: "Add a comment (optional parent_id for reply)",
      },
      {
        method: "POST",
        path: "/api/agent/tasks/:id/propose-complete",
        auth: true,
        description: "Signal work is done → moves to review",
      },
      {
        method: "POST",
        path: "/api/agent/tasks/:id/reopen",
        auth: true,
        description: "Reopen a review/done task with summary and optional updates",
      },
      {
        method: "GET",
        path: "/api/agent/activity",
        auth: true,
        description: "Recent activity feed (?limit=N, ?since=ISO)",
      },
    ],
    actor: AGENT_ACTOR,
  });
}
