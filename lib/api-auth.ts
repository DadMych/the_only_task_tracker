import { NextResponse } from "next/server";

export function authenticateAgent(
  request: Request
): { ok: true } | { ok: false; response: NextResponse } {
  const token = process.env.AGENT_API_TOKEN;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Agent API not configured" },
        { status: 503 }
      ),
    };
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${token}`) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true };
}
