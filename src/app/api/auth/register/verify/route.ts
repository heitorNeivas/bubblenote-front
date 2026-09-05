import { NextResponse } from "next/server";
import { serverApiPublic } from "@/lib/http/server";
import { setSessionCookie } from "@/lib/auth/cookies";
import type { LoginResponse } from "@/types/auth";
import { isApiError } from "@/lib/http/api-error";

/**
 * POST /api/auth/register/verify
 * Encaminha `{ email, code }` ao Laravel (`POST /register/verify`). Em `201` a
 * conta é ativada e o token é emitido — grava no cookie httpOnly e devolve só
 * o `user`. Erros (`422` código inválido / expirado, `409` já ativa, `429`)
 * voltam com a mensagem do Laravel.
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  try {
    const result = await serverApiPublic<LoginResponse>("register/verify", {
      method: "POST",
      body: raw,
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
    return NextResponse.json(
      { message: "Falha ao verificar o código" },
      { status: 502 },
    );
  }
}
