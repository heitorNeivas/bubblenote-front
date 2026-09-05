import { requireSession } from "@/lib/auth/session";
import { Workspace } from "@/components/bubbles/Workspace";

/** Rota `/` — workspace de bolhas (protegida). */
export default async function WorkspacePage() {
  await requireSession();
  return <Workspace />;
}
