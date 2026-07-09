import {
  createComment,
  getTask,
  updateTask,
  type CreateTaskInput,
} from "./db";
import type { Role, Task, TaskStatus } from "./types";

const PROPOSE_FROM: TaskStatus[] = ["in_progress"];
const CONFIRM_FROM: TaskStatus[] = ["review"];
const REJECT_FROM: TaskStatus[] = ["review"];
const REOPEN_FROM: TaskStatus[] = ["review", "done"];

export type WorkflowError = { code: "not_found" | "invalid_state"; message: string };

export async function proposeComplete(
  taskId: string,
  summary: string,
  actor: Role
): Promise<
  | { ok: true; task: Task; commentId: string }
  | { ok: false; error: WorkflowError }
> {
  const task = await getTask(taskId);
  if (!task) {
    return { ok: false, error: { code: "not_found", message: "Task not found" } };
  }
  if (!PROPOSE_FROM.includes(task.status)) {
    return {
      ok: false,
      error: {
        code: "invalid_state",
        message: `Task must be in_progress to propose complete (current: ${task.status})`,
      },
    };
  }

  const result = await updateTask(taskId, { status: "review" }, actor);
  if (!result) {
    return { ok: false, error: { code: "not_found", message: "Task not found" } };
  }

  const comment = await createComment(
    taskId,
    `[Proposed complete]\n${summary.trim()}`,
    actor
  );

  return {
    ok: true,
    task: result.task,
    commentId: comment?.id ?? "",
  };
}

export async function confirmComplete(
  taskId: string,
  note: string | undefined,
  actor: Role
): Promise<
  | { ok: true; task: Task; commentId: string | null }
  | { ok: false; error: WorkflowError }
> {
  const task = await getTask(taskId);
  if (!task) {
    return { ok: false, error: { code: "not_found", message: "Task not found" } };
  }
  if (!CONFIRM_FROM.includes(task.status)) {
    return {
      ok: false,
      error: {
        code: "invalid_state",
        message: `Task must be in review to confirm (current: ${task.status})`,
      },
    };
  }

  const result = await updateTask(taskId, { status: "done" }, actor);
  if (!result) {
    return { ok: false, error: { code: "not_found", message: "Task not found" } };
  }

  let commentId: string | null = null;
  if (note?.trim()) {
    const comment = await createComment(
      taskId,
      `[Confirmed]\n${note.trim()}`,
      actor
    );
    commentId = comment?.id ?? null;
  }

  return { ok: true, task: result.task, commentId };
}

export async function rejectComplete(
  taskId: string,
  feedback: string,
  actor: Role
): Promise<
  | { ok: true; task: Task; commentId: string }
  | { ok: false; error: WorkflowError }
> {
  const task = await getTask(taskId);
  if (!task) {
    return { ok: false, error: { code: "not_found", message: "Task not found" } };
  }
  if (!REJECT_FROM.includes(task.status)) {
    return {
      ok: false,
      error: {
        code: "invalid_state",
        message: `Task must be in review to reject (current: ${task.status})`,
      },
    };
  }

  const result = await updateTask(taskId, { status: "in_progress" }, actor);
  if (!result) {
    return { ok: false, error: { code: "not_found", message: "Task not found" } };
  }

  const comment = await createComment(
    taskId,
    `[Rejected — needs more work]\n${feedback.trim()}`,
    actor
  );

  return {
    ok: true,
    task: result.task,
    commentId: comment?.id ?? "",
  };
}

export interface ReopenInput {
  summary: string;
  title?: string;
  description?: string;
  category?: CreateTaskInput["category"];
  urgency?: CreateTaskInput["urgency"];
  importance?: CreateTaskInput["importance"];
  site?: CreateTaskInput["site"];
}

export async function reopenTask(
  taskId: string,
  input: ReopenInput,
  actor: Role
): Promise<
  | { ok: true; task: Task; commentId: string }
  | { ok: false; error: WorkflowError }
> {
  const task = await getTask(taskId);
  if (!task) {
    return { ok: false, error: { code: "not_found", message: "Task not found" } };
  }
  if (!REOPEN_FROM.includes(task.status)) {
    return {
      ok: false,
      error: {
        code: "invalid_state",
        message: `Task must be in review or done to reopen (current: ${task.status})`,
      },
    };
  }

  const { summary, ...fieldUpdates } = input;
  const updates = Object.fromEntries(
    Object.entries(fieldUpdates).filter(([, v]) => v !== undefined)
  );

  const result = await updateTask(
    taskId,
    { status: "in_progress", ...updates },
    actor
  );
  if (!result) {
    return { ok: false, error: { code: "not_found", message: "Task not found" } };
  }

  const comment = await createComment(
    taskId,
    `[Reopened]\n${summary.trim()}`,
    actor
  );

  return {
    ok: true,
    task: result.task,
    commentId: comment?.id ?? "",
  };
}
