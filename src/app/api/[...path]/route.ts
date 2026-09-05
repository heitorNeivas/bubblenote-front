import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/config/env.server";
import { getSessionToken } from "@/lib/auth/cookies";

/**
 * Proxy BFF genérico: qualquer `/(GET|POST|PUT|PATCH|DELETE) /api/<x>` que
 * NÃO tenha um Route Handler dedicado cai aqui e é reencaminhado para
 * `{API_BASE_URL}/<x>` com o header `Authorization: Bearer <token>` lido
 * do cookie httpOnly.
 *
 * Assim o Client Component nunca toca no token e a app continua
 * "stateless" no browser.
 */

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function proxy(request: NextRequest, segments: string[]): Promise<Response> {
  const token = await getSessionToken();

  const base = serverEnv.API_BASE_URL.endsWith("/")
    ? serverEnv.API_BASE_URL
    : `${serverEnv.API_BASE_URL}/`;
  const target = new URL(segments.map(encodeURIComponent).join("/"), base);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("Accept", request.headers.get("accept") ?? "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  else headers.delete("Authorization");

  const hasBody = !["GET", "HEAD"].includes(request.method);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      // @ts-expect-error — `duplex` é exigido pelo runtime ao enviar body.
      duplex: "half",
    });
  } catch {
    return NextResponse.json(
      { message: "Falha ao contatar a API." },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase()) && key.toLowerCase() !== "set-cookie") {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path ?? []);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
