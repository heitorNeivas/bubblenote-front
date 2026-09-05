"use client";

import { createHttpClient } from "./client";
import type { RequestOptions } from "@/types/api";

/**
 * Cliente HTTP para uso NO BROWSER (Client Components).
 *
 * NÃO fala com o Laravel diretamente. Aponta para o próprio Next
 * (`/api/...` — a camada BFF), que é same-origin: o cookie httpOnly de
 * sessão é enviado automaticamente e o Route Handler correspondente
 * repassa a chamada ao Laravel com o `Bearer <token>`.
 *
 * Ou seja: o client nunca vê nem manipula o token.
 */

const client = createHttpClient({
  baseUrl: "/api/",
  // Timeout um pouco maior: a chamada faz 2 saltos (browser -> Next -> Laravel).
  timeoutMs: 20_000,
});

/**
 * Ex.: `browserApi.get<Note>("notes/123")` -> `GET /api/notes/123`
 * que o proxy encaminha para `GET {API_BASE_URL}/notes/123`.
 */
export const browserApi = {
  request: <T>(path: string, options?: RequestOptions) =>
    client.request<T>(path, { credentials: "same-origin", ...options }),
  get: <T>(path: string, options?: RequestOptions) =>
    client.get<T>(path, { credentials: "same-origin", ...options }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    client.post<T>(path, body, { credentials: "same-origin", ...options }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    client.put<T>(path, body, { credentials: "same-origin", ...options }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    client.patch<T>(path, body, { credentials: "same-origin", ...options }),
  delete: <T>(path: string, options?: RequestOptions) =>
    client.delete<T>(path, { credentials: "same-origin", ...options }),
};
