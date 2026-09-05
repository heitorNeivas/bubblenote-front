import { NextResponse } from "next/server";
import { serverApiPublic } from "@/lib/http/server";
import { setSessionCookie } from "@/lib/auth/cookies";
import { serverEnv } from "@/config/env.server";
import type { LoginResponse } from "@/types/auth";
import { isApiError } from "@/lib/http/api-error";

/**
 * POST /api/auth/login
 * Encaminha as credenciais ao Laravel (que valida). Em sucesso, grava o token
 * no cookie httpOnly e devolve só o `user`.
 *
 * `remember` NÃO é validação — controla apenas a duração do cookie de sessão.
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  const { email, password, remember } = (raw ?? {}) as {
    email?: unknown;
    password?: unknown;
    remember?: unknown;
  };

  try {
    const result = await serverApiPublic<LoginResponse>("login", {
      method: "POST",
      body: { email, password },
    });

    await setSessionCookie(
      result.token,
      remember ? serverEnv.SESSION_MAX_AGE : undefined,
    );

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