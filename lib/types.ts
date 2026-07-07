export type Role = "owner" | "boss";

export type TaskStatus = "backlog" | "in_progress" | "review" | "done";

export type TaskCategory =
  | "bug"
  | "feature"
  | "content"
  | "design"
  | "deploy"
  | "other";

export type TaskUrgency = "urgent" | "not_urgent";

export type TaskImportance = "green" | "yellow" | "red";

export type TaskSite =
  | "store.realreality.com"
  | "fofgod.com"
  | "sacraments.fofgod.com"
  | "spiritualblueprint.com"
  | "other";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  urgency: TaskUrgency;
  importance: TaskImportance;
  site: TaskSite;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  task_id: string;
  task_title: string;
  action: string;
  details: string;
  actor: Role;
  created_at: string;
}

export interface SessionUser {
  role: Role;
  name: string;
}

export interface Comment {
  id: string;
  task_id: string;
  author: Role;
  body: string;
  parent_id: string | null;
  created_at: string;
}

export interface CommentNode extends Comment {
  replies: CommentNode[];
}

export interface TaskImage {
  id: string;
  task_id: string;
  url: string;
  filename: string;
  mime_type: string;
  uploaded_by: Role;
  created_at: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
};

export const STATUS_ORDER: TaskStatus[] = [
  "backlog",
  "in_progress",
  "review",
  "done",
];

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  bug: "Bug",
  feature: "Feature",
  content: "Content",
  design: "Design",
  deploy: "Deploy",
  other: "Other",
};

export const URGENCY_LABELS: Record<TaskUrgency, string> = {
  urgent: "Urgent",
  not_urgent: "Not urgent",
};

export const IMPORTANCE_LABELS: Record<TaskImportance, string> = {
  green: "Low",
  yellow: "Medium",
  red: "High",
};

export const SITE_LABELS: Record<TaskSite, string> = {
  "store.realreality.com": "Real Reality Store",
  "fofgod.com": "FoFGod",
  "sacraments.fofgod.com": "Sacraments",
  "spiritualblueprint.com": "Spiritual Blueprint",
  other: "Other",
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Oleksii",
  boss: "William",
};

export const TASK_SITES: TaskSite[] = [
  "store.realreality.com",
  "fofgod.com",
  "sacraments.fofgod.com",
  "spiritualblueprint.com",
  "other",
];

export const TASK_CATEGORIES: TaskCategory[] = [
  "bug",
  "feature",
  "content",
  "design",
  "deploy",
  "other",
];
