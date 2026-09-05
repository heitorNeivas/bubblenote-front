import { z } from "zod";

/**
 * Variáveis públicas (prefixo `NEXT_PUBLIC_`), embutidas no bundle do browser.
 * Nunca coloque segredos aqui.
 */
const schema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Granito"),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(`Variáveis de ambiente públicas inválidas:\n${issues}`);
}

export const clientEnv = parsed.data;
