import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/auth/cookies";

/**
 * POST /api/auth/touch
 * Heartbeat de sessão: chamado pelo cliente enquanto há atividade do usuário
 * (mesmo sem chamadas à API) para deslizar a janela de inatividade.
 *
 * - Sessão válida  -> re-emite o cookie httpOnly (novo `maxAge`) e responde 204.
 * - Sessão inválida -> limpa o cookie e responde 401 (o cliente redireciona).
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    await clearSessionCookie();
    return new NextResponse(null, { status: 401 });
  }

  const token = await getSessionToken();
  if (token) await setSessionCookie(token);

  return new NextResponse(null, { status: 204 });
}
