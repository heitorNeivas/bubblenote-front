"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";
import { cn } from "@/lib/utils/cn";

/** Editor de Markdown sem molduras (estilo Notion) + alternância de modo. */
export function NoteEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // Cresce com o conteúdo.
  useEffect(() => {
    const el = areaRef.current;
    if (!el || mode !== "write") return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, mode]);

  const tab = (id: "write" | "preview", label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setMode(id)}
      aria-pressed={mode === id}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition",
        mode === id
          ? "bg-bg-hover text-text-base"
          : "text-text-faint hover:text-text-muted",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-2 flex w-fit gap-0.5 self-end">
        {tab("write", "Escrever")}
        {tab("preview", "Visualizar")}
      </div>

      {mode === "write" ? (
        <textarea
          ref={areaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
          placeholder="Escreva em Markdown…"
          spellCheck
          className={cn(
            "w-full resize-none border-0 bg-transparent p-0 outline-none",
            "text-[1.05rem] leading-8 text-text-base placeholder:text-text-faint",
            "min-h-[55vh]",
          )}
        />
      ) : value.trim() ? (
        <MarkdownViewer content={value} className="min-h-[55vh]" />
      ) : (
        <p className="min-h-[55vh] text-[1.05rem] leading-8 text-text-faint">
          Nada escrito ainda.
        </p>
      )}
    </div>
  );
}
