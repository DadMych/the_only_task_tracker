import type { Activity, Comment, Role, Task } from "./types";
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
  comment: "💬 Comment",
  reply: "↩️ Reply",
  agent: "🤖 AI Agent",
  proposed: "✅ Proposed complete",
  confirmed: "🎉 Confirmed done",
  rejected: "↩️ Rejected",
  reopened: "🔁 Reopened",
} as const;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function taskSummary(task: Task): string {
  const lines = [
    `<b>${escapeHtml(task.title)}</b>`,
    `🌐 ${SITE_LABELS[task.site]}`,
    `${IMPORTANCE_EMOJI[task.importance]} ${IMPORTANCE_LABELS[task.importance]}`,
    task.urgency === "urgent" ? "⚡ Urgent" : "⏳ Not urgent",
    `📂 ${CATEGORY_LABELS[task.category]}`,
    `📋 ${STATUS_LABELS[task.status]}`,
  ];

  if (task.description.trim()) {
    lines.push(`\n📄 ${escapeHtml(task.description.trim())}`);
  }

  return lines.join("\n");
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

export async function notifyTaskComment(
  task: Task,
  comment: Comment,
  actor: Role,
  parent?: Comment
) {
  const isReply = !!comment.parent_id;
  const header = isReply ? ACTION_LABELS.reply : ACTION_LABELS.comment;
  const lines = [
    `${header} on <b>${escapeHtml(task.title)}</b>`,
    "",
    escapeHtml(comment.body),
  ];

  if (parent) {
    lines.push("", `↩️ Re: ${escapeHtml(parent.body.trim())}`);
  }

  lines.push("", `👤 ${ROLE_LABELS[actor]}`);

  await sendMessage(lines.join("\n"));
}

export async function notifyAgentAction(
  task: Task,
  action: string,
  details?: string
) {
  const lines = [
    `${ACTION_LABELS.agent}: ${action}`,
    "",
    taskSummary(task),
  ];
  if (details?.trim()) {
    lines.push("", escapeHtml(details.trim()));
  }
  await sendMessage(lines.join("\n"));
}

export async function notifyProposedComplete(task: Task, summary: string) {
  await sendMessage(
    `${ACTION_LABELS.proposed}\n\n${taskSummary(task)}\n\n📋 ${escapeHtml(summary.trim())}\n\n👤 AI Agent`
  );
}

export async function notifyConfirmedComplete(
  task: Task,
  actor: Role,
  note?: string
) {
  const lines = [
    `${ACTION_LABELS.confirmed}\n\n${taskSummary(task)}`,
  ];
  if (note?.trim()) {
    lines.push("", escapeHtml(note.trim()));
  }
  lines.push("", `👤 ${ROLE_LABELS[actor]}`);
  await sendMessage(lines.join("\n"));
}

export async function notifyRejectedComplete(
  task: Task,
  actor: Role,
  feedback: string
) {
  await sendMessage(
    `${ACTION_LABELS.rejected}\n\n${taskSummary(task)}\n\n📝 ${escapeHtml(feedback.trim())}\n\n👤 ${ROLE_LABELS[actor]}`
  );
}

export async function notifyReopened(
  task: Task,
  actor: Role,
  summary: string
) {
  await sendMessage(
    `${ACTION_LABELS.reopened}\n\n${taskSummary(task)}\n\n📋 ${escapeHtml(summary.trim())}\n\n👤 ${actor === "owner" ? "AI Agent" : ROLE_LABELS[actor]}`
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
