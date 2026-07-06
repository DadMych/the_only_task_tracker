import { cookies } from "next/headers";
import type { Role, SessionUser } from "./types";

const SESSION_COOKIE = "tfp_session";

function getTokens(): Record<Role, string> {
  const owner = process.env.ACCESS_TOKEN_OWNER;
  const boss = process.env.ACCESS_TOKEN_BOSS;

  if (!owner || !boss) {
    throw new Error(
      "ACCESS_TOKEN_OWNER and ACCESS_TOKEN_BOSS must be set in .env.local"
    );
  }

  return { owner, boss };
}

export function resolveRoleFromToken(token: string): Role | null {
  const tokens = getTokens();
  if (token === tokens.owner) return "owner";
  if (token === tokens.boss) return "boss";
  return null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get(SESSION_COOKIE)?.value as Role | undefined;

  if (role !== "owner" && role !== "boss") return null;

  return {
    role,
    name: role === "owner" ? "Oleksii" : "William",
  };
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function canEdit(role: Role): boolean {
  return role === "owner" || role === "boss";
}
