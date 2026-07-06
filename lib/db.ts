import { createClient, type Client } from "@libsql/client";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type {
  Activity,
  Comment,
  Role,
  Task,
  TaskCategory,
  TaskImportance,
  TaskSite,
  TaskStatus,
  TaskUrgency,
} from "./types";
import {
  CATEGORY_LABELS,
  IMPORTANCE_LABELS,
  SITE_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
} from "./types";

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

function getClient(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    client = createClient({ url, authToken });
  } else {
    const dataDir = path.join(process.cwd(), "data");
    fs.mkdirSync(dataDir, { recursive: true });
    client = createClient({
      url: `file:${path.join(dataDir, "tracker.db")}`,
    });
  }

  return client;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = initSchema();
  }
  await schemaReady;
}

async function initSchema(): Promise<void> {
  const db = getClient();

  await db.batch([
    `CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'backlog',
      category TEXT NOT NULL DEFAULT 'other',
      urgency TEXT NOT NULL DEFAULT 'not_urgent',
      importance TEXT NOT NULL DEFAULT 'yellow',
      site TEXT NOT NULL DEFAULT 'fofgod.com',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      task_title TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      actor TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      parent_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    )`,
    "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)",
    "CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id, created_at ASC)",
  ]);

  await migrateLegacySchema(db);
}

async function migrateLegacySchema(db: Client): Promise<void> {
  const columns = await db.execute("PRAGMA table_info(tasks)");
  const names = new Set(columns.rows.map((r) => r.name as string));

  const migrations: string[] = [];
  if (!names.has("category")) {
    migrations.push(
      "ALTER TABLE tasks ADD COLUMN category TEXT NOT NULL DEFAULT 'other'"
    );
  }
  if (!names.has("urgency")) {
    migrations.push(
      "ALTER TABLE tasks ADD COLUMN urgency TEXT NOT NULL DEFAULT 'not_urgent'"
    );
  }
  if (!names.has("importance")) {
    migrations.push(
      "ALTER TABLE tasks ADD COLUMN importance TEXT NOT NULL DEFAULT 'yellow'"
    );
  }
  if (!names.has("site")) {
    migrations.push(
      "ALTER TABLE tasks ADD COLUMN site TEXT NOT NULL DEFAULT 'fofgod.com'"
    );
  }

  if (migrations.length > 0) {
    await db.batch(migrations);
  }
}

function now(): string {
  return new Date().toISOString();
}

function rowToTask(row: Record<string, unknown>): Task {
  return row as unknown as Task;
}

async function logActivity(
  taskId: string,
  taskTitle: string,
  action: string,
  details: string,
  actor: Role
): Promise<Activity> {
  await ensureSchema();
  const activity: Activity = {
    id: uuidv4(),
    task_id: taskId,
    task_title: taskTitle,
    action,
    details,
    actor,
    created_at: now(),
  };

  await getClient().execute({
    sql: `INSERT INTO activity (id, task_id, task_title, action, details, actor, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      activity.id,
      activity.task_id,
      activity.task_title,
      activity.action,
      activity.details,
      activity.actor,
      activity.created_at,
    ],
  });

  return activity;
}

export async function getAllTasks(): Promise<Task[]> {
  await ensureSchema();
  const result = await getClient().execute(`
    SELECT * FROM tasks ORDER BY
      CASE status
        WHEN 'in_progress' THEN 0
        WHEN 'review' THEN 1
        WHEN 'backlog' THEN 2
        WHEN 'done' THEN 3
      END,
      CASE urgency WHEN 'urgent' THEN 0 ELSE 1 END,
      CASE importance WHEN 'red' THEN 0 WHEN 'yellow' THEN 1 ELSE 2 END,
      updated_at DESC
  `);
  return result.rows.map((r) => rowToTask(r as Record<string, unknown>));
}

export async function getTask(id: string): Promise<Task | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: "SELECT * FROM tasks WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? rowToTask(row as Record<string, unknown>) : undefined;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  category: TaskCategory;
  urgency: TaskUrgency;
  importance: TaskImportance;
  site: TaskSite;
}

export async function createTask(
  input: CreateTaskInput,
  actor: Role
): Promise<{ task: Task; activity: Activity }> {
  await ensureSchema();
  const id = uuidv4();
  const timestamp = now();
  const task: Task = {
    id,
    title: input.title,
    description: input.description,
    status: "backlog",
    category: input.category,
    urgency: input.urgency,
    importance: input.importance,
    site: input.site,
    created_at: timestamp,
    updated_at: timestamp,
  };

  await getClient().execute({
    sql: `INSERT INTO tasks
          (id, title, description, status, category, urgency, importance, site, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      task.id,
      task.title,
      task.description,
      task.status,
      task.category,
      task.urgency,
      task.importance,
      task.site,
      task.created_at,
      task.updated_at,
    ],
  });

  const details = [
    `Site: ${SITE_LABELS[task.site]}`,
    `Category: ${CATEGORY_LABELS[task.category]}`,
    `Urgency: ${URGENCY_LABELS[task.urgency]}`,
    `Importance: ${IMPORTANCE_LABELS[task.importance]}`,
  ].join("; ");

  const activity = await logActivity(id, task.title, "created", details, actor);
  return { task, activity };
}

export async function updateTask(
  id: string,
  updates: Partial<
    Pick<
      Task,
      | "title"
      | "description"
      | "status"
      | "category"
      | "urgency"
      | "importance"
      | "site"
    >
  >,
  actor: Role
): Promise<{ task: Task; activity: Activity | null } | null> {
  const existing = await getTask(id);
  if (!existing) return null;

  const next: Task = {
    ...existing,
    ...updates,
    updated_at: now(),
  };

  await getClient().execute({
    sql: `UPDATE tasks
          SET title = ?, description = ?, status = ?, category = ?,
              urgency = ?, importance = ?, site = ?, updated_at = ?
          WHERE id = ?`,
    args: [
      next.title,
      next.description,
      next.status,
      next.category,
      next.urgency,
      next.importance,
      next.site,
      next.updated_at,
      id,
    ],
  });

  const changes: string[] = [];
  if (updates.title && updates.title !== existing.title) {
    changes.push(`Title: "${existing.title}" → "${updates.title}"`);
  }
  if (
    updates.description !== undefined &&
    updates.description !== existing.description
  ) {
    changes.push("Description updated");
  }
  if (updates.status && updates.status !== existing.status) {
    changes.push(
      `Status: ${STATUS_LABELS[existing.status]} → ${STATUS_LABELS[updates.status]}`
    );
  }
  if (updates.category && updates.category !== existing.category) {
    changes.push(
      `Category: ${CATEGORY_LABELS[existing.category]} → ${CATEGORY_LABELS[updates.category]}`
    );
  }
  if (updates.urgency && updates.urgency !== existing.urgency) {
    changes.push(
      `Urgency: ${URGENCY_LABELS[existing.urgency]} → ${URGENCY_LABELS[updates.urgency]}`
    );
  }
  if (updates.importance && updates.importance !== existing.importance) {
    changes.push(
      `Importance: ${IMPORTANCE_LABELS[existing.importance]} → ${IMPORTANCE_LABELS[updates.importance]}`
    );
  }
  if (updates.site && updates.site !== existing.site) {
    changes.push(
      `Site: ${SITE_LABELS[existing.site]} → ${SITE_LABELS[updates.site]}`
    );
  }

  let activity: Activity | null = null;
  if (changes.length > 0) {
    activity = await logActivity(
      id,
      next.title,
      "updated",
      changes.join("; "),
      actor
    );
  }

  return { task: next, activity };
}

export async function deleteTask(
  id: string,
  actor: Role
): Promise<{ ok: true; activity: Activity } | { ok: false }> {
  const existing = await getTask(id);
  if (!existing) return { ok: false };

  const activity = await logActivity(id, existing.title, "deleted", "", actor);
  await getClient().execute({
    sql: "DELETE FROM tasks WHERE id = ?",
    args: [id],
  });
  return { ok: true, activity };
}

export async function getRecentActivity(limit = 20): Promise<Activity[]> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: "SELECT * FROM activity ORDER BY created_at DESC LIMIT ?",
    args: [limit],
  });
  return result.rows as unknown as Activity[];
}

export async function getActivitySince(since: string): Promise<Activity[]> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: "SELECT * FROM activity WHERE created_at > ? ORDER BY created_at ASC",
    args: [since],
  });
  return result.rows as unknown as Activity[];
}

export async function getStats(): Promise<Record<TaskStatus, number>> {
  await ensureSchema();
  const result = await getClient().execute(
    "SELECT status, COUNT(*) as count FROM tasks GROUP BY status"
  );

  const stats: Record<TaskStatus, number> = {
    backlog: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  };

  for (const row of result.rows) {
    stats[row.status as TaskStatus] = Number(row.count);
  }

  return stats;
}

export async function getTaskComments(taskId: string): Promise<Comment[]> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: "SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC",
    args: [taskId],
  });
  return result.rows as unknown as Comment[];
}

export async function getComment(id: string): Promise<Comment | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: "SELECT * FROM comments WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? (row as unknown as Comment) : undefined;
}

export async function createComment(
  taskId: string,
  body: string,
  author: Role,
  parentId?: string | null
): Promise<Comment | null> {
  await ensureSchema();

  const task = await getTask(taskId);
  if (!task) return null;

  if (parentId) {
    const parent = await getComment(parentId);
    if (!parent || parent.task_id !== taskId) return null;
  }

  const comment: Comment = {
    id: uuidv4(),
    task_id: taskId,
    author,
    body: body.trim(),
    parent_id: parentId ?? null,
    created_at: now(),
  };

  await getClient().execute({
    sql: `INSERT INTO comments (id, task_id, author, body, parent_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      comment.id,
      comment.task_id,
      comment.author,
      comment.body,
      comment.parent_id,
      comment.created_at,
    ],
  });

  await logActivity(
    taskId,
    task.title,
    "commented",
    parentId ? `Reply: ${body.trim().slice(0, 80)}` : body.trim().slice(0, 80),
    author
  );

  return comment;
}
