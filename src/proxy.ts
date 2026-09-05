import { NextResponse, type NextRequest } from "next/server";

/**
 * Guarda de rotas (Edge) — convenção `proxy` do Next 16 (ex-`middleware`).
 * Faz apenas a checagem barata de PRESENÇA do cookie de sessão — a
 * validação real do token contra o Laravel acontece nos Server Components
 * via `requireSession()`.
 *
 * - Sem cookie + rota privada  -> redireciona para /login?next=<rota>
 * - Com cookie + /login        -> redireciona para /
 */

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "granito_session";

/** Rotas acessíveis sem sessão. */
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);

  if (isPublic(pathname)) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Roda em tudo, EXCETO: rotas de API (cuidam da própria auth),
   * assets do Next e arquivos estáticos com extensão.
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
