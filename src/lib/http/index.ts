export { ApiError, isApiError, toUserMessage } from "./api-error";
export { createHttpClient, type HttpClient } from "./client";
// `server` e `browser` NÃO são reexportados aqui de propósito:
// importe-os pelo caminho explícito para deixar claro o ambiente de execução.
//   - Server Components / Route Handlers -> "@/lib/http/server"
//   - Client Components                  -> "@/lib/http/browser"
