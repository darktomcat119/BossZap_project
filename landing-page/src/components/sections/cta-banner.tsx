"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  const t = useTranslations("hero");
  const tCta = useTranslations("ctaBanner");
  return (
    <section
      className={
        "relative overflow-hidden bg-gradient-to-r " +
        "from-emerald-600 via-teal-600 to-emerald-700 py-16"
      }
    >
      <div
        className={
          "absolute inset-0 bg-[url('/images/hero-business.jpg')] " +
          "bg-cover bg-center opacity-10"
        }
      />
      <div
        className={"relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center"}
      >
        <h2 className={"text-3xl md:text-4xl font-bold text-white"}>
          {tCta("title")}
        </h2>
        <p className={"mt-4 text-lg text-emerald-100/80 max-w-2xl mx-auto"}>
          {tCta("subtitle")}
        </p>
        <Link
          href="/register"
          className={
            "mt-8 inline-flex items-center gap-2 px-10 py-4 " +
            "bg-white text-emerald-600 font-bold text-lg " +
            "rounded-xl shadow-2xl transition-all " +
            "hover:-translate-y-0.5"
          }
        >
          {t("cta")} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
