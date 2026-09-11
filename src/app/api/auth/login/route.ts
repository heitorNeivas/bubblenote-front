import { NextResponse } from "next/server";
import { serverApiPublic } from "@/lib/http/server";
import { setSessionCookie } from "@/lib/auth/cookies";
import type { LoginResponse } from "@/types/auth";
import { isApiError } from "@/lib/http/api-error";

/**
 * POST /api/auth/login
 * Encaminha as credenciais ao Laravel (que valida). Em sucesso, grava o token
 * no cookie httpOnly e devolve só o `user`.
 *
 * A sessão sempre nasce com a janela de inatividade de 1h
 * (`SESSION_IDLE_TIMEOUT`) — vale para todos, sem opção de "manter conectado".
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  const { email, password } = (raw ?? {}) as {
    email?: unknown;
    password?: unknown;
  };

  try {
    const result = await serverApiPublic<LoginResponse>("login", {
      method: "POST",
      body: { email, password },
    });

    await setSessionCookie(result.token);

    return NextResponse.json({ user: result.user });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { message: error.message, errors: error.fieldErrors },
        { status: error.status || 502 },
      );
    }
    return NextResponse.json({ message: "Falha ao autenticar" }, { status: 502 });
  }
}