import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * GET /api/auth/session
 * Usado por Client Components para saber quem está logado sem expor o token.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: session.user });
}
