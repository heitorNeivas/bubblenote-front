import "server-only";
import { z } from "zod";

/**
 * Variáveis de ambiente exclusivas do servidor (Node runtime).
 *
 * `import "server-only"` garante erro de build caso este módulo seja
 * importado por um Client Component — o token e a URL interna da API
 * nunca chegam ao browser.
 *
 * Uma env ausente/inválida quebra o boot com mensagem clara.
 */
const schema = z.object({
  /** URL base da API Laravel, ex.: https://api.meudominio.com/api */
  API_BASE_URL: z.string().url(),
  /** Nome do cookie httpOnly que guarda o token de sessão. */
  SESSION_COOKIE_NAME: z.string().min(1).default("granito_session"),
  /** Duração da sessão em segundos (default: 7 dias). */
  SESSION_MAX_AGE: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
  /**
   * Janela de inatividade em segundos: sem nenhuma atividade nesse intervalo,
   * o cookie de sessão expira e o usuário volta para o login (default: 1h).
   * É deslizante — cada requisição autenticada reinicia a contagem.
   */
  SESSION_IDLE_TIMEOUT: z.coerce.number().int().positive().default(60 * 60),
  /** Timeout padrão das requisições à API, em ms. */
  API_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = schema.safeParse({
  API_BASE_URL: process.env.API_BASE_URL,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_MAX_AGE: process.env.SESSION_MAX_AGE,
  SESSION_IDLE_TIMEOUT: process.env.SESSION_IDLE_TIMEOUT,
  API_TIMEOUT_MS: process.env.API_TIMEOUT_MS,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(`Variáveis de ambiente do servidor inválidas:\n${issues}`);
}

export const serverEnv = parsed.data;
export const isProd = serverEnv.NODE_ENV === "production";
