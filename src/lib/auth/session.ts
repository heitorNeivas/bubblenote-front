import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { serverApi } from "@/lib/http/server";
import { getSessionToken } from "./cookies";
import { isApiError } from "@/lib/http/api-error";
import type { Session, User } from "@/types/auth";

/**
 * Resolução de sessão no servidor.
 *
 * `getSession()` é memoizado por request (`react.cache`), então pode ser
 * chamado em vários Server Components / no layout sem refetch.
 */

export const getSession = cache(async (): Promise<Session | null> => {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    // Ajuste o endpoint conforme sua API (ex.: Sanctum expõe `/user`).
    const user = await serverApi.get<User>("user");
    return { user };
  } catch (error) {
    // Não conseguimos VERIFICAR a sessão (token inválido/expirado, API fora,
    // 5xx…): tratamos como deslogado em vez de derrubar o render. O Laravel
    // continua sendo a autoridade na próxima requisição.
    if (isApiError(error)) {
      console.warn(
        `[getSession] não foi possível verificar a sessão (status ${error.status}): ${error.message}`,
      );
      return null;
    }
    throw error;
  }
});

/** Garante sessão; caso contrário redireciona para o login. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Inverso: usado na página de login para expulsar quem já está logado. */
export async function redirectIfAuthenticated(to = "/") {
  const session = await getSession();
  if (session) redirect(to);
}
