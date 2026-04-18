"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";

export function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const tSection = useTranslations("sectionLabels");
  const items = t.raw("items") as Array<{
    name: string;
    role: string;
    quote: string;
  }>;
  const avatars = [
    "/images/professional-man.jpg",
    "/images/professional-woman.jpg",
    "/images/professional-woman-2.jpg",
  ];

  return (
    <section className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
            {tSection("testimonials")}
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
          className={"mt-14 grid grid-cols-1 md:grid-cols-3 gap-6"}
        >
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className={
                "bg-white rounded-2xl p-7 " +
                "border border-gray-100 shadow-sm " +
                "hover:shadow-lg transition-all"
              }
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className={"w-4 h-4 text-yellow-500 fill-yellow-500"}
                  />
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Image
                  src={avatars[i % avatars.length]}
                  alt={item.name}
                  width={44}
                  height={44}
                  className={"w-11 h-11 rounded-full object-cover"}
                />
                <div>
                  <p className={"font-semibold text-gray-900 text-sm"}>
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
