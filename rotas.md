# Rotas

Referência de todas as rotas do front-end Granito.

## Telas (App Router)

| Rota | Acesso | Arquivo | Descrição |
|---|---|---|---|
| `/login` | pública | `src/app/login/page.tsx` | Abas **Entrar** / **Criar conta** + verificação por PIN (2FA). Usuário logado é redirecionado para `/`. |
| `/` | protegida | `src/app/page.tsx` → `src/components/bubbles/Workspace.tsx` | Workspace. Sem bolhas → convite `+ Crie sua primeira bolha!`. Com bolhas → canvas (grafo) ou lista. |
| `/bubble/[id]` | protegida | `src/app/bubble/[id]/page.tsx` → `BubbleNoteScreen` | A nota (Markdown) de uma bolha, com edição, preview e conexões. |

Rotas protegidas exigem o cookie de sessão `granito_session`; sem ele o
middleware manda para `/login?next=<rota>`.

## Middleware

| Arquivo | Função |
|---|---|
| `src/proxy.ts` | Guarda de rota no edge: checa **presença** do cookie de sessão (a validação real do token é do Laravel). |

## BFF / API interna (Next → Laravel)

Base do Laravel: `API_BASE_URL` (`.env.local`, ex.: `http://localhost:8000/api`).
O browser nunca vê o token — ele vive no cookie httpOnly e é injetado pelo BFF.

| Método | Rota | Arquivo | Encaminha para (Laravel) |
|---|---|---|---|
| `POST` | `/api/auth/login` | `src/app/api/auth/login/route.ts` | `POST /login` → grava cookie, devolve `{ user }` |
| `POST` | `/api/auth/logout` | `src/app/api/auth/logout/route.ts` | `POST /logout` → limpa cookie |
| `GET` | `/api/auth/session` | `src/app/api/auth/session/route.ts` | `GET /user` → `{ user }` ou `401` |
| `POST` | `/api/auth/register` | `src/app/api/auth/register/route.ts` | `POST /register` → cadastro pendente (sem cookie) |
| `POST` | `/api/auth/register/verify` | `src/app/api/auth/register/verify/route.ts` | `POST /register/verify` → `201` grava cookie, devolve `{ user }` |
| `POST` | `/api/auth/register/resend` | `src/app/api/auth/register/resend/route.ts` | `POST /register/resend` → `202` |
| `ANY` | `/api/[...path]` | `src/app/api/[...path]/route.ts` | Proxy genérico: repassa qualquer rota ao Laravel com `Authorization: Bearer <cookie>` |

## Dados das bolhas

Ainda **sem backend**. Estado em `localStorage` (`granito.bubbles.v1`) via
`src/lib/bubbles/bubbles-context.tsx` — é o ponto onde as ações
(`createBubble`, `updateBubble`, `linkBubbles`…) viram chamadas HTTP quando a
API existir.
