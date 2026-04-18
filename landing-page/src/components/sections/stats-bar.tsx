"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MessageCircle, Mic, Clock, FileText } from "lucide-react";

export function StatsBar() {
  const t = useTranslations("stats");
  const stats = [
    {
      icon: MessageCircle,
      value: t("whatsappValue"),
      label: t("whatsappLabel"),
    },
    { icon: Mic, value: t("voiceValue"), label: t("voiceLabel") },
    {
      icon: Clock,
      value: t("alwaysOnValue"),
      label: t("alwaysOnLabel"),
    },
    { icon: FileText, value: t("pdfValue"), label: t("pdfLabel") },
  ];
  return (
    <section
      className={
        "relative bg-[#0d1229] border-y border-white/5 " +
        "py-12 overflow-hidden"
      }
    >
      <div className="absolute inset-0 mesh-gradient opacity-50" />
      <div
        className={
          "relative max-w-7xl mx-auto px-4 sm:px-6 " +
          "grid grid-cols-2 md:grid-cols-4 gap-8"
        }
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center group"
          >
            <div className="relative w-12 h-12 mx-auto mb-3">
              <div
                className={
                  "absolute inset-0 bg-emerald-500/20 " +
                  "blur-xl rounded-full opacity-0 " +
                  "group-hover:opacity-100 transition-opacity"
                }
              />
              <div
                className={
                  "relative w-full h-full rounded-xl " +
                  "bg-emerald-500/10 border border-emerald-500/20 " +
                  "flex items-center justify-center " +
                  "group-hover:scale-110 transition-transform"
                }
              >
                <stat.icon className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <p className={"text-xl md:text-2xl font-bold text-white"}>
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
