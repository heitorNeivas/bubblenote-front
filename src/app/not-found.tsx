import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-mono text-text-faint">404</p>
      <h1 className="text-lg font-semibold">Página não encontrada</h1>
      <Link
        href="/"
        className="rounded-md border border-border-strong px-4 py-2 text-sm transition hover:bg-bg-hover"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
