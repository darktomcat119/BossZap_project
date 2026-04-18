"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";

export function PricingSection() {
  const t = useTranslations("pricing");
  const tSection = useTranslations("sectionLabels");
  const tLabels = useTranslations("labels");

  const planKeys = ["starter", "pro", "business"] as const;
  const plans = planKeys.map((key) => ({
    key,
    name: t(`plans.${key}.name`),
    price: t(`plans.${key}.price`),
    tagline: t(`plans.${key}.tagline`),
    features: t.raw(`plans.${key}.features`) as string[],
    highlight: key === "pro",
  }));

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto"
        >
          <span
            className={
              "inline-block px-4 py-1.5 text-xs font-semibold " +
              "text-emerald-600 bg-emerald-50 rounded-full " +
              "uppercase tracking-wider"
            }
          >
            {tSection("pricing")}
          </span>
          <h2
            className={
              "mt-4 text-3xl md:text-5xl font-bold " +
              "text-gray-900 tracking-tight"
            }
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-gray-500 text-lg">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className={
            "mt-14 grid grid-cols-1 md:grid-cols-3 " +
            "gap-6 lg:gap-8 items-stretch"
          }
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.key}
              variants={fadeUp}
              className={cn(
                "relative flex flex-col rounded-2xl " +
                  "overflow-hidden transition-all duration-300",
                plan.highlight
                  ? "bg-white shadow-luxury ring-2 " +
                      "ring-emerald-500 md:-translate-y-4 " +
                      "md:scale-[1.02]"
                  : "bg-white border border-gray-200 shadow-sm " +
                      "hover:shadow-lg hover:-translate-y-1",
              )}
            >
              {plan.highlight && (
                <>
                  <div className="h-1.5 animate-gradient-border" />
                  <div
                    className={
                      "absolute top-4 right-4 px-3 py-1 " +
                      "text-[10px] font-bold bg-emerald-500 " +
                      "text-white rounded-full uppercase " +
                      "tracking-wider shadow-lg"
                    }
                  >
                    {tLabels("popular")}
                  </div>
                </>
              )}
              <div className="flex-1 flex flex-col p-8">
                <h3
                  className={cn(
                    "text-sm font-bold uppercase tracking-widest",
                    plan.highlight ? "text-emerald-600" : "text-gray-500",
                  )}
                >
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">{plan.tagline}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span
                    className={
                      "text-4xl md:text-5xl font-extrabold " +
                      "text-gray-900 tracking-tight"
                    }
                  >
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-base">{t("period")}</span>
                </div>
                <ul className="mt-8 space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 w-5 h-5 rounded-full " +
                            "flex items-center justify-center " +
                            "flex-shrink-0",
                          plan.highlight ? "bg-emerald-500" : "bg-emerald-100",
                        )}
                      >
                        <Check
                          className={cn(
                            "w-3 h-3",
                            plan.highlight ? "text-white" : "text-emerald-600",
                          )}
                        />
                      </div>
                      <span className={"text-sm text-gray-600 leading-relaxed"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/register?plan=${plan.key}`}
                  className={cn(
                    "group relative mt-8 flex items-center " +
                      "justify-center gap-2 w-full px-6 py-3.5 " +
                      "font-bold rounded-xl " +
                      "transition-all duration-300",
                    plan.highlight
                      ? "bg-gradient-to-r from-emerald-500 " +
                          "via-teal-500 to-emerald-600 " +
                          "text-white shadow-xl " +
                          "shadow-emerald-500/30 " +
                          "hover:shadow-2xl " +
                          "hover:shadow-emerald-500/40 " +
                          "hover:-translate-y-0.5"
                      : "bg-gray-900 text-white hover:bg-gray-800",
                  )}
                >
                  <span className="relative">{t("cta")}</span>
                  <ArrowRight
                    className={
                      "relative w-4 h-4 " +
                      "group-hover:translate-x-1 " +
                      "transition-transform"
                    }
                  />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-8 text-center text-sm text-gray-400">{t("trial")}</p>
      </div>
    </section>
  );
}
