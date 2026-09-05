/**
 * Contratos genéricos da API Laravel.
 *
 * O Laravel, por padrão, retorna erros de validação no formato:
 *   { "message": "...", "errors": { "campo": ["msg1", "msg2"] } }
 * e recursos paginados via `->paginate()` no formato `LaravelPaginated`.
 */

/** Corpo de erro padrão do Laravel. */
export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}

/** Envelope de paginação do `->paginate()` do Laravel. */
export interface LaravelPaginated<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

/** Envelope simples `{ data: T }` de um Resource único. */
export interface ApiResource<T> {
  data: T;
}

/** Opções aceitas pelos helpers de request. */
export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** Objeto serializado como JSON, ou `BodyInit` cru (FormData, etc.). */
  body?: unknown;
  /** Query string a partir de um objeto simples. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Timeout específico desta chamada, em ms. */
  timeoutMs?: number;
  /** Repassado ao `fetch` do Next para cache/revalidação. */
  next?: RequestInit["next"];
}
