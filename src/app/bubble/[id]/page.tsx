import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { BubbleNoteScreen } from "@/components/bubbles/BubbleNoteScreen";

export const metadata: Metadata = { title: "Nota" };

/** Rota `/bubble/[id]` — a nota escrita numa bolha (protegida). */
export default async function BubblePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  return <BubbleNoteScreen id={id} />;
}
