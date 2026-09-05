"use client";

import { useEffect } from "react";

/** Boundary de erro para as rotas do segmento raiz. */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-lg font-semibold">Algo deu errado</h1>
      <p className="max-w-md text-sm text-text-muted">
        Não conseguimos carregar esta página. O erro foi registrado.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-border-strong px-4 py-2 text-sm transition hover:bg-bg-hover"
      >
        Tentar novamente
      </button>
    </div>
  );
}
