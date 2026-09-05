import type { RequestOptions } from "@/types/api";
import { ApiError } from "./api-error";

/**
 * Núcleo de transporte HTTP — agnóstico de ambiente.
 *
 * Responsabilidades:
 *  - montar URL + query string
 *  - serializar body JSON (ou passar `FormData` cru)
 *  - aplicar timeout via `AbortController`
 *  - normalizar QUALQUER falha em `ApiError`
 *  - devolver o corpo já parseado (JSON, texto ou `undefined` p/ 204)
 *
 * NÃO sabe nada sobre token/cookies. Quem injeta `Authorization` são os
 * wrappers `server.ts` (lê cookie httpOnly) e `browser.ts` (via BFF do Next).
 */

function buildUrl(base: string, path: string, query?: RequestOptions["query"]): string {
  const isAbsolute = /^https?:\/\//i.test(base);
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`;
  const relPath = path.replace(/^\//, "");

  // `new URL(url, base)` exige um `base` absoluto. Para uma base relativa
  // (ex.: "/api/" no browser -> BFF same-origin) resolvemos contra a origin
  // atual e devolvemos apenas caminho+query, sem embutir a origin.
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = isAbsolute
    ? new URL(relPath, baseWithSlash)
    : new URL(`${baseWithSlash}${relPath}`.replace(/^\/+/, "/"), origin);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return isAbsolute ? url.toString() : url.pathname + url.search;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => undefined);
  }
  return response.text().catch(() => undefined);
}

export interface CoreRequestConfig {
  /** URL base absoluta (Laravel no server, ou origin do Next no browser). */
  baseUrl: string;
  /** Timeout padrão em ms. */
  timeoutMs: number;
  /** Headers aplicados a toda requisição (ex.: Authorization). */
  defaultHeaders?: HeadersInit;
}

export function createHttpClient(config: CoreRequestConfig) {
  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      body,
      query,
      timeoutMs = config.timeoutMs,
      headers,
      ...rest
    } = options;

    let url: string;
    try {
      url = buildUrl(config.baseUrl, path, query);
    } catch (cause) {
      throw new ApiError(`URL inválida para "${path}"`, 0, { body: cause });
    }
    const finalHeaders = new Headers({
      Accept: "application/json",
      ...config.defaultHeaders,
      ...headers,
    });

    let payload: BodyInit | undefined;
    if (body instanceof FormData || body instanceof Blob || typeof body === "string") {
      payload = body;
    } else if (body !== undefined) {
      payload = JSON.stringify(body);
      if (!finalHeaders.has("Content-Type")) {
        finalHeaders.set("Content-Type", "application/json");
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        ...rest,
        headers: finalHeaders,
        body: payload,
        signal: options.signal ?? controller.signal,
      });
    } catch (cause) {
      clearTimeout(timeout);
      const aborted = cause instanceof Error && cause.name === "AbortError";
      throw new ApiError(
        aborted ? `Tempo limite excedido (${timeoutMs}ms)` : "Falha de rede ao contatar a API",
        0,
        { body: cause },
      );
    }
    clearTimeout(timeout);

    const parsed = await parseBody(response);
    if (!response.ok) {
      throw ApiError.fromResponse(response, parsed);
    }
    return parsed as T;
  }

  return {
    request,
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "POST", body }),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "PUT", body }),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "PATCH", body }),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "DELETE" }),
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
