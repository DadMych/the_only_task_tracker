import type { Activity, Task } from "./types";
import {
  CATEGORY_LABELS,
  IMPORTANCE_LABELS,
  ROLE_LABELS,
  SITE_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
} from "./types";

const IMPORTANCE_EMOJI = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
} as const;

const ACTION_LABELS = {
  created: "🆕 New task",
  updated: "✏️ Update",
  deleted: "🗑 Deleted",
} as const;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function taskSummary(task: Task): string {
  return [
    `<b>${escapeHtml(task.title)}</b>`,
    `🌐 ${SITE_LABELS[task.site]}`,
    `${IMPORTANCE_EMOJI[task.importance]} ${IMPORTANCE_LABELS[task.importance]}`,
    task.urgency === "urgent" ? "⚡ Urgent" : "⏳ Not urgent",
    `📂 ${CATEGORY_LABELS[task.category]}`,
    `📋 ${STATUS_LABELS[task.status]}`,
  ].join("\n");
}

export async function notifyTaskCreated(task: Task, actor: Activity["actor"]) {
  await sendMessage(
    `${ACTION_LABELS.created}\n\n${taskSummary(task)}\n\n👤 ${ROLE_LABELS[actor]}`
  );
}

export async function notifyTaskUpdated(
  task: Task,
  activity: Activity,
  actor: Activity["actor"]
) {
  await sendMessage(
    `${ACTION_LABELS.updated}\n\n${taskSummary(task)}\n\n📝 ${escapeHtml(activity.details)}\n👤 ${ROLE_LABELS[actor]}`
  );
}

export async function notifyTaskDeleted(
  taskTitle: string,
  actor: Activity["actor"]
) {
  await sendMessage(
    `${ACTION_LABELS.deleted}\n\n<b>${escapeHtml(taskTitle)}</b>\n👤 ${ROLE_LABELS[actor]}`
  );
}

async function sendMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID_OWNER;

  if (!token || !chatId) return;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      console.error("Telegram API error:", await res.text());
    }
  } catch (err) {
    console.error("Telegram send failed:", err);
  }
}
