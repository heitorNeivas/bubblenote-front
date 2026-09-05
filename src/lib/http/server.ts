import "server-only";
import { cookies } from "next/headers";
import { serverEnv } from "@/config/env.server";
import { createHttpClient } from "./client";
import type { RequestOptions } from "@/types/api";

/**
 * Cliente HTTP para uso NO SERVIDOR (Server Components, Route Handlers,
 * Server Actions). Fala direto com a API Laravel e injeta o `Bearer <token>`
 * lido do cookie httpOnly — o token nunca transita pelo browser.
 */

const client = createHttpClient({
  baseUrl: serverEnv.API_BASE_URL,
  timeoutMs: serverEnv.API_TIMEOUT_MS,
});

async function authHeaders(): Promise<HeadersInit> {
  const store = await cookies();
  const token = store.get(serverEnv.SESSION_COOKIE_NAME)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Chamada autenticada à API Laravel a partir do servidor. */
export async function serverApi<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const auth = await authHeaders();
  return client.request<T>(path, {
    ...options,
    headers: { ...auth, ...options.headers },
  });
}

/** Chamada SEM token (ex.: login, rotas públicas da API). */
export async function serverApiPublic<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return client.request<T>(path, options);
}

serverApi.get = <T>(path: string, options?: RequestOptions) =>
  serverApi<T>(path, { ...options, method: "GET" });
serverApi.post = <T>(path: string, body?: unknown, options?: RequestOptions) =>
  serverApi<T>(path, { ...options, method: "POST", body });
serverApi.put = <T>(path: string, body?: unknown, options?: RequestOptions) =>
  serverApi<T>(path, { ...options, method: "PUT", body });
serverApi.patch = <T>(path: string, body?: unknown, options?: RequestOptions) =>
  serverApi<T>(path, { ...options, method: "PATCH", body });
serverApi.delete = <T>(path: string, options?: RequestOptions) =>
  serverApi<T>(path, { ...options, method: "DELETE" });
