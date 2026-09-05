import { NextResponse } from "next/server";
import { serverApiPublic } from "@/lib/http/server";
import { isApiError } from "@/lib/http/api-error";

/**
 * POST /api/auth/register
 * Encaminha o cadastro ao Laravel, que valida tudo (`required`, `email`,
 * `confirmed`, `unique`…) e cria um cadastro PENDENTE — dispara o código de
 * verificação por e-mail e NÃO devolve token.
 *
 * A sessão só é criada em `POST /api/auth/register/verify`, após o PIN.
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  try {
    const result = await serverApiPublic<unknown>("register", {
      method: "POST",
      body: raw,
    });
    return NextResponse.json(result ?? { ok: true });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { message: error.message, errors: error.fieldErrors },
        { status: error.status || 502 },
      );
    }
    return NextResponse.json({ message: "Falha ao registrar" }, { status: 502 });
  }
}
