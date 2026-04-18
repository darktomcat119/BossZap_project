"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MessageCircle, Bot, LayoutDashboard } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";

export function HowItWorksSection() {
  const t = useTranslations("howItWorks");
  const tSection = useTranslations("sectionLabels");
  const tHowSection = useTranslations("howItWorksSection");
  const steps = [
    { key: "step1", icon: MessageCircle, number: "01" },
    { key: "step2", icon: Bot, number: "02" },
    { key: "step3", icon: LayoutDashboard, number: "03" },
  ] as const;

  return (
    <section
      id="how-it-works"
      className={"py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white"}
    >
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
            {tSection("simple")}
          </span>
          <h2
            className={
              "mt-4 text-3xl md:text-5xl font-bold " +
              "text-gray-900 tracking-tight"
            }
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            {tHowSection("subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className={"mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative"}
        >
          <div
            className={
              "hidden md:block absolute top-16 " +
              "left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] " +
              "h-0.5 bg-gradient-to-r from-emerald-200 " +
              "via-emerald-300 to-emerald-200"
            }
          />
          {steps.map(({ key, icon: Icon, number }) => (
            <motion.div
              key={key}
              variants={fadeUp}
              className="text-center relative"
            >
              <div
                className={
                  "mx-auto w-24 h-24 rounded-2xl " +
                  "bg-gradient-to-br from-emerald-500 " +
                  "to-teal-600 flex items-center " +
                  "justify-center shadow-xl " +
                  "shadow-emerald-500/20 relative z-10 " +
                  "rotate-3 hover:rotate-0 " +
                  "transition-transform duration-300"
                }
              >
                <Icon className="w-10 h-10 text-white" />
                <span
                  className={
                    "absolute -top-2 -right-2 w-8 h-8 bg-white " +
                    "text-emerald-600 text-sm font-bold " +
                    "rounded-lg flex items-center " +
                    "justify-center shadow-lg"
                  }
                >
                  {number}
                </span>
              </div>
              <h3 className={"mt-8 text-xl font-bold text-gray-900"}>
                {t(`${key}.title`)}
              </h3>
              <p
                className={
                  "mt-3 text-gray-500 leading-relaxed " + "max-w-xs mx-auto"
                }
              >
                {t(`${key}.description`)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
