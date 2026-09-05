import { NextResponse } from "next/server";
import { serverApiPublic } from "@/lib/http/server";
import { isApiError } from "@/lib/http/api-error";

/**
 * POST /api/auth/register/resend
 * Reenvia o código de verificação — encaminha `{ email }` ao Laravel
 * (`POST /register/resend`, sempre `202`).
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  try {
    await serverApiPublic("register/resend", { method: "POST", body: raw });
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status || 502 },
      );
    }
    return NextResponse.json(
      { message: "Falha ao reenviar o código" },
      { status: 502 },
    );
  }
}
