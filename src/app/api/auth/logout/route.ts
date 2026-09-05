import { NextResponse } from "next/server";
import { serverApi } from "@/lib/http/server";
import { clearSessionCookie } from "@/lib/auth/cookies";

/**
 * POST /api/auth/logout
 * Revoga o token no Laravel (best-effort) e limpa o cookie httpOnly.
 */
export async function POST() {
  try {
    await serverApi.post("logout");
  } catch {
    // Mesmo que a revogação falhe, seguimos limpando a sessão local.
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
