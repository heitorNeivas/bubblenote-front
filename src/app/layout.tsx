import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getSession } from "@/lib/auth/session";
import { clientEnv } from "@/config/env.client";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: clientEnv.NEXT_PUBLIC_APP_NAME,
    template: `%s · ${clientEnv.NEXT_PUBLIC_APP_NAME}`,
  },
  description: "Gestão de conhecimento em Markdown.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Resolvido no servidor -> sem flash de "deslogado" no primeiro paint.
  const session = await getSession();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-text-base">
        <Providers initialUser={session?.user ?? null}>{children}</Providers>
      </body>
    </html>
  );
}
