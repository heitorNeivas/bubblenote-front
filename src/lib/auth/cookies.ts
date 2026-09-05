import "server-only";
import { cookies } from "next/headers";
import { serverEnv, isProd } from "@/config/env.server";

/**
 * Manipulação do cookie httpOnly de sessão.
 * Só pode ser chamado em Route Handlers e Server Actions
 * (Server Components não podem escrever cookies).
 */

const COOKIE_NAME = serverEnv.SESSION_COOKIE_NAME;

const baseOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

export async function setSessionCookie(token: string, maxAgeSeconds?: number) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    ...baseOptions,
    maxAge: maxAgeSeconds ?? serverEnv.SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { ...baseOptions, maxAge: 0 });
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}
