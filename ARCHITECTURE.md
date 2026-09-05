# Arquitetura

Front-end **desacoplado** do backend Laravel. O Next.js atua como
**BFF (Backend-for-Frontend)**: o browser nunca vê o token de autenticação.

## Fluxo de autenticação (stateless, cookie httpOnly)

```
┌─────────┐  POST /api/auth/login   ┌──────────────┐  POST {API}/login  ┌─────────┐
│ Browser │ ──────────────────────▶ │ Next (BFF)   │ ─────────────────▶ │ Laravel │
│         │                         │ Route Handler│ ◀───────────────── │  API    │
│         │ ◀────────────────────── │              │   { token, user }  └─────────┘
└─────────┘   Set-Cookie: httpOnly  └──────────────┘
              { user }  (sem token)   grava token no
                                      cookie de sessão
```

- **Login** (`src/app/api/auth/login/route.ts`): valida input com Zod, chama
  o Laravel, grava o `token` num cookie `httpOnly` + `Secure` (prod) +
  `SameSite=Lax`. Devolve só o `user`.
- **Logout** (`.../logout/route.ts`): revoga no Laravel (best-effort) e limpa o cookie.
- **Sessão** (`.../session/route.ts`): devolve o `user` atual para Client Components.
- **`proxy.ts`** (ex-`middleware.ts`): checagem barata de presença do cookie,
  redireciona rotas privadas para `/login?next=…`.

## Camadas HTTP (`src/lib/http/`)

| Módulo         | Ambiente                         | Função |
|----------------|----------------------------------|--------|
| `client.ts`    | agnóstico                        | núcleo do `fetch`: URL+query, JSON, timeout (`AbortController`), normalização de erro em `ApiError` |
| `server.ts`    | Server Components / Route Handlers / Server Actions | fala **direto com o Laravel**, injeta `Bearer` lido do cookie httpOnly (`import "server-only"`) |
| `browser.ts`   | Client Components                 | fala com o **próprio Next** (`/api/...`), same-origin; o cookie vai junto automaticamente |
| `api-error.ts` | agnóstico                        | classe `ApiError` (`status`, `fieldErrors`, helpers `isUnauthorized`…) + `toUserMessage()` |

Chamadas do client a recursos sem Route Handler dedicado caem no **proxy
genérico** `src/app/api/[...path]/route.ts`, que reencaminha ao Laravel com o
`Bearer` do cookie.

```
Client Component ──▶ browserApi.get("notes")
                     └─▶ GET /api/notes  (Next)
                         └─▶ [...path]/route.ts  +Authorization: Bearer <cookie>
                             └─▶ GET {API_BASE_URL}/notes  (Laravel)
```

## Estado no client (enxuto)

- `SessionProvider` (`src/lib/auth/session-context.tsx`): guarda **apenas** o
  `user` (nunca o token). Semeado pelo servidor via `layout.tsx` → sem flash.
- `ToastProvider` (`src/components/feedback/toast.tsx`): feedback visual de
  falhas de API — `toast.error(err)` extrai a mensagem amigável do `ApiError`.
- Boundaries: `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`.

## Renderização de Markdown

`src/components/markdown/MarkdownViewer.tsx` — único ponto de conversão
texto → UI. `react-markdown` + `remark-gfm`, **sem `rehype-raw`** (HTML cru
fica inerte: defesa contra XSS em conteúdo da API). Estilo via
`@tailwindcss/typography` (`prose prose-invert`).

## Estrutura de pastas

```
src/
├── app/
│   ├── api/
│   │   ├── auth/{login,logout,session}/route.ts   # BFF de autenticação
│   │   └── [...path]/route.ts                     # proxy genérico → Laravel
│   ├── login/page.tsx                             # rota pública
│   ├── page.tsx                                   # workspace (protegida)
│   ├── layout.tsx · providers.tsx
│   ├── error.tsx · global-error.tsx · not-found.tsx
│   └── globals.css                                # tema dark minimalista (tokens)
├── components/
│   ├── auth/{LoginForm,LogoutButton}.tsx
│   ├── feedback/toast.tsx
│   └── markdown/MarkdownViewer.tsx
├── config/
│   ├── env.server.ts                              # envs do servidor (Zod, server-only)
│   └── env.client.ts                              # envs públicas (NEXT_PUBLIC_)
├── lib/
│   ├── auth/{cookies,session,session-context}.ts(x)
│   ├── http/{client,server,browser,api-error,index}.ts
│   └── utils/cn.ts
├── types/{api,auth,note,index}.ts
└── proxy.ts                                       # guarda de rotas (Edge)
```

## Variáveis de ambiente

Ver `.env.example`. Servidor: `API_BASE_URL`, `SESSION_COOKIE_NAME`,
`SESSION_MAX_AGE`, `API_TIMEOUT_MS`. Público: `NEXT_PUBLIC_APP_NAME`.
Validadas no boot — env faltando quebra com mensagem explícita.

## Próximos passos

Sidebar (árvore de pastas/notas) · EditorCentral (edição Markdown) ·
integração com endpoints `/notes` e `/folders` do Laravel.
