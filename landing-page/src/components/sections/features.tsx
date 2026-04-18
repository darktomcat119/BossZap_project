"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Package,
  FileText,
  ClipboardList,
  Wallet,
  Bell,
  BarChart3,
  LayoutGrid,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";

export function FeaturesSection() {
  const tSection = useTranslations("sectionLabels");
  const tFeatSection = useTranslations("featuresSection");

  const items = [
    {
      key: "products",
      icon: Package,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      key: "pdfQuotes",
      icon: FileText,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      key: "serviceOrders",
      icon: ClipboardList,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      key: "finance",
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      key: "reminders",
      icon: Bell,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      key: "reports",
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      key: "dashboard",
      icon: LayoutGrid,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      key: "aiChat",
      icon: Bot,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
  ] as const;

  return (
    <section id="features" className="py-20 md:py-28 bg-white overflow-hidden">
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
            {tSection("features")}
          </span>
          <h2
            className={
              "mt-4 text-3xl md:text-5xl font-bold " +
              "text-gray-900 tracking-tight"
            }
          >
            {tFeatSection("title")}
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            {tFeatSection("subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className={
            "mt-14 grid grid-cols-1 sm:grid-cols-2 " + "lg:grid-cols-4 gap-6"
          }
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.key}
                variants={fadeUp}
                className={
                  "group relative rounded-2xl " +
                  "border border-gray-200/70 bg-white p-6 " +
                  "transition-all duration-300 " +
                  "hover:border-emerald-300 hover:shadow-xl " +
                  "hover:shadow-emerald-500/5 hover:-translate-y-1"
                }
              >
                <div
                  className={cn(
                    "inline-flex h-12 w-12 items-center " +
                      "justify-center rounded-xl",
                    item.bg,
                  )}
                >
                  <Icon className={cn("w-6 h-6", item.color)} />
                </div>
                <h3
                  className={
                    "mt-5 text-lg font-bold text-gray-900 " + "leading-snug"
                  }
                >
                  {tFeatSection(`grid.${item.key}.title`)}
                </h3>
                <p className={"mt-2 text-sm text-gray-500 leading-relaxed"}>
                  {tFeatSection(`grid.${item.key}.desc`)}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
