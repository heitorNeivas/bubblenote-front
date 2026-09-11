/** Usuário autenticado, conforme retornado pelo endpoint `/user` do Laravel. */
export interface User {
  id: number | string;
  name: string;
  email: string;
  email_verified?: boolean;
  avatar_url?: string | null;
  created_at?: string;
}

/**
 * Estado do formulário de login. Apenas tipagem — a validação é 100% do
 * Laravel; o front só encaminha e renderiza os erros que voltarem.
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Estado do formulário de registro. Segue a convenção do Laravel
 * (`password_confirmation` + regra `confirmed`).
 */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/** Resposta esperada do Laravel ao autenticar (ajuste conforme sua API). */
export interface LoginResponse {
  token: string;
  user: User;
}

/** Sessão resolvida no servidor a partir do cookie httpOnly. */
export interface Session {
  user: User;
}