import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Locale-aware tab title + meta description. Previously these were
// hardcoded in pt-BR, so es and en visitors saw Portuguese in their
// browser tab — flagged as a brand-consistency issue by the client.
const META_BY_LOCALE: Record<
  string,
  { title: string; description: string }
> = {
  "pt-BR": {
    title: "BossZap - Seu negócio, sob controle total",
    description:
      "O assistente virtual com IA que gerencia sua agenda, " +
      "finanças e orçamentos pelo WhatsApp",
  },
  es: {
    title: "BossZap - Tu negocio, bajo control total",
    description:
      "El asistente virtual con IA que gestiona tu agenda, " +
      "finanzas y presupuestos por WhatsApp",
  },
  en: {
    title: "BossZap - Your business, fully under control",
    description:
      "The AI virtual assistant that manages your schedule, " +
      "finances and quotes through WhatsApp",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = META_BY_LOCALE[locale] ?? META_BY_LOCALE["pt-BR"];
  return {
    title: meta.title,
    description: meta.description,
    icons: {
      icon: [{ url: "/favicon.png", type: "image/png" }],
      apple: [{ url: "/favicon.png" }],
    },
  };
}

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen font-sans">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
