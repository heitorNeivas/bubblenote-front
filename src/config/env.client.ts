import { z } from "zod";

/**
 * Variáveis públicas (prefixo `NEXT_PUBLIC_`), embutidas no bundle do browser.
 * Nunca coloque segredos aqui.
 */
const schema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Granito"),
  /**
   * Espelho de `SESSION_IDLE_TIMEOUT` (segundos) para o cliente conseguir
   * fazer o redirect proativo antes do cookie httpOnly expirar. Mantenha os
   * dois valores em sincronia — o servidor continua sendo a autoridade.
   */
  NEXT_PUBLIC_SESSION_IDLE_TIMEOUT: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_SESSION_IDLE_TIMEOUT: process.env.NEXT_PUBLIC_SESSION_IDLE_TIMEOUT,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(`Variáveis de ambiente públicas inválidas:\n${issues}`);
}

export const clientEnv = parsed.data;
