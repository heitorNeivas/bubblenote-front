import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Renderiza Markdown como UI. Ponto único de conversão texto -> React.
 *
 * - `remark-gfm`: tabelas, checklists, ~~strikethrough~~, autolink.
 * - Sem `rehype-raw` de propósito: HTML cru no Markdown fica inerte
 *   (defesa contra XSS em conteúdo vindo da API).
 * - Estilos via plugin `@tailwindcss/typography` (classe `prose`).
 */

const components: Components = {
  a({ href, children, ...props }) {
    const url = href ?? "#";
    const isInternal = url.startsWith("/") || url.startsWith("#");
    if (isInternal) {
      return (
        <Link href={url} {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  },
};

export interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div
      className={cn(
        "prose prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-pre:bg-bg-sidebar prose-pre:border prose-pre:border-border-base",
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-a:text-accent hover:prose-a:text-accent-hover",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
