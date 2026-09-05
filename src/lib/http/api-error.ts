import type { ApiErrorBody } from "@/types/api";

/**
 * Erro normalizado de qualquer chamada HTTP.
 * Toda a app trata falha de rede/servidor a partir desta classe.
 */
export class ApiError extends Error {
  /** Status HTTP (0 = falha de rede / timeout / offline). */
  readonly status: number;
  /** Erros de validação por campo (formato Laravel). */
  readonly fieldErrors?: Record<string, string[]>;
  /** Corpo cru da resposta, para debug. */
  readonly body?: unknown;

  constructor(
    message: string,
    status: number,
    options: { fieldErrors?: Record<string, string[]>; body?: unknown } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = options.fieldErrors;
    this.body = options.body;
  }

  get isNetworkError() {
    return this.status === 0;
  }
  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isValidationError() {
    return this.status === 422;
  }
  get isServerError() {
    return this.status >= 500;
  }

  /** Constrói a partir de um `Response` com corpo já lido. */
  static fromResponse(response: Response, body: unknown): ApiError {
    const parsed = body as Partial<ApiErrorBody> | null;
    const message =
      (parsed && typeof parsed.message === "string" && parsed.message) ||
      response.statusText ||
      `Erro ${response.status}`;
    return new ApiError(message, response.status, {
      fieldErrors: parsed?.errors,
      body,
    });
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Mensagem amigável para exibir ao usuário. */
export function toUserMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.isNetworkError)
      return "Não foi possível conectar ao servidor. Verifique sua conexão.";
    if (error.isUnauthorized) return "Sua sessão expirou. Faça login novamente.";

    // Preferimos a mensagem que o backend mandou. Só caímos no texto genérico
    // de 5xx quando a resposta não trouxe nada útil (ex.: 502 de rede).
    const hasBackendMessage =
      error.message && !/^erro \d+$/i.test(error.message);
    if (error.isServerError && !hasBackendMessage)
      return "O servidor encontrou um erro. Tente novamente em instantes.";

    return error.message;
  }
  return "Ocorreu um erro inesperado.";
}
