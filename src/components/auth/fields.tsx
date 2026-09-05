import { cn } from "@/lib/utils/cn";

/** Estilo base de input compartilhado entre os formulários de auth. */
export const inputClass = cn(
  "w-full rounded-md border border-border-strong bg-bg-elevated px-3 py-2 text-sm",
  "outline-none transition focus:border-accent",
);

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      {children}
      {error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}
    </div>
  );
}
