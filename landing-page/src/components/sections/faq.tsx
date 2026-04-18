"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";

export function FaqSection() {
  const t = useTranslations("faq");
  const tSection = useTranslations("sectionLabels");
  const items = t.raw("items") as Array<{
    question: string;
    answer: string;
  }>;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center"
        >
          <span
            className={
              "inline-block px-4 py-1.5 text-xs font-semibold " +
              "text-emerald-600 bg-emerald-50 rounded-full " +
              "uppercase tracking-wider"
            }
          >
            {tSection("faq")}
          </span>
          <h2
            className={
              "mt-4 text-3xl md:text-5xl font-bold " +
              "text-gray-900 tracking-tight"
            }
          >
            {t("title")}
          </h2>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mt-14 space-y-3"
        >
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className={
                "rounded-xl border border-gray-100 " +
                "bg-gray-50/50 overflow-hidden"
              }
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className={
                  "flex w-full items-center justify-between " +
                  "p-5 text-left hover:bg-gray-50 " +
                  "transition-colors"
                }
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {item.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className={"px-5 pb-5 text-gray-500 leading-relaxed"}>
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
