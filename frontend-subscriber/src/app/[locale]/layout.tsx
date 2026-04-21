import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/hooks/use-auth";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "BossZap",
  description: "Plataforma SaaS para MEIs brasileiros",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png" }],
  },
};

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen bg-background font-sans">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
