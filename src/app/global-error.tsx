"use client";

/** Último recurso: captura erros no próprio layout raiz. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
          background: "#2d3135",
          color: "#e7e8ea",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Erro inesperado
        </h1>
        <p style={{ color: "#a4aab2", fontSize: "0.875rem" }}>
          {error.digest ? `Referência: ${error.digest}` : "Tente recarregar a página."}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: "1px solid #525963",
            borderRadius: "0.375rem",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
