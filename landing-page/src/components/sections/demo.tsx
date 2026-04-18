"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MessageCircle, DollarSign, FileText, BarChart3 } from "lucide-react";
import { PhoneCarousel } from "@/components/shared/phone-carousel";
import { fadeUp, stagger, scaleIn } from "@/lib/motion";

const demoScreens = [
  {
    id: "demo-schedule",
    messages: [
      {
        id: 1,
        type: "sent" as const,
        text: "Tenho uma pintura amanhã às 14h na Rua Augusta 480",
        time: "09:30",
      },
      {
        id: 2,
        type: "received" as const,
        text:
          "Compromisso agendado! 📅\n" +
          '"Pintura - Rua Augusta 480"\n' +
          "Amanhã às 14:00\n" +
          "Vou te lembrar 1h antes!",
        time: "09:30",
      },
    ],
    badges: [
      {
        position: "top-left" as const,
        icon: "pdf" as const,
        title: "Agenda atualizada",
        subtitle: "Lembrete automático ativado",
        appearsAfterMessage: 1,
      },
      {
        position: "bottom-right" as const,
        icon: "revenue" as const,
        title: "3 trabalhos",
        subtitle: "Agendados esta semana",
        appearsAfterMessage: 1,
      },
    ],
  },
  {
    id: "demo-expense",
    messages: [
      {
        id: 1,
        type: "sent" as const,
        text: "Gastei R$150 em tinta e pincéis",
        time: "14:20",
      },
      {
        id: 2,
        type: "received" as const,
        text:
          "Despesa registrada! 💰\n" +
          "R$150,00 - Materiais\n" +
          "Seu lucro este mês: R$2.190,00",
        time: "14:20",
      },
    ],
    badges: [
      {
        position: "top-left" as const,
        icon: "revenue" as const,
        title: "Despesa salva",
        subtitle: "Categoria: Materiais",
        appearsAfterMessage: 1,
      },
      {
        position: "bottom-right" as const,
        icon: "revenue" as const,
        title: "R$2.190",
        subtitle: "Lucro atualizado",
        appearsAfterMessage: 1,
      },
    ],
  },
  {
    id: "demo-quote",
    messages: [
      {
        id: 1,
        type: "sent" as const,
        text: "",
        time: "11:40",
        isVoice: true,
        voiceDuration: "0:08",
      },
      {
        id: 2,
        type: "received" as const,
        text:
          "Entendi! Orçamento para reforma de banheiro " +
          "para o Sr. Silva. Gerando PDF...",
        time: "11:40",
      },
      {
        id: 3,
        type: "sent" as const,
        text: "Manda pra ele",
        time: "11:41",
      },
      {
        id: 4,
        type: "received" as const,
        text:
          "PDF enviado para Sr. Silva! 📄\n" +
          "Reforma banheiro\n" +
          "Total: R$3.200,00 ✅",
        time: "11:41",
      },
    ],
    badges: [
      {
        position: "top-left" as const,
        icon: "pdf" as const,
        title: "Áudio transcrito",
        subtitle: "IA entende sua voz",
        appearsAfterMessage: 1,
      },
      {
        position: "bottom-right" as const,
        icon: "pdf" as const,
        title: "PDF enviado",
        subtitle: "Com sua marca e logo",
        appearsAfterMessage: 3,
      },
    ],
  },
  {
    id: "demo-report",
    messages: [
      {
        id: 1,
        type: "sent" as const,
        text: "Quanto ganhei esse mês?",
        time: "18:00",
      },
      {
        id: 2,
        type: "received" as const,
        text:
          "Relatório de Abril:\n\n" +
          "📈 Receitas: R$8.500,00\n" +
          "📉 Despesas: R$2.180,00\n" +
          "💰 Lucro: R$6.320,00\n\n" +
          "+23% comparado ao mês anterior! 🎉",
        time: "18:00",
      },
    ],
    badges: [
      {
        position: "top-left" as const,
        icon: "revenue" as const,
        title: "Lucro +23%",
        subtitle: "vs. mês anterior",
        appearsAfterMessage: 1,
      },
      {
        position: "bottom-right" as const,
        icon: "revenue" as const,
        title: "R$6.320",
        subtitle: "Lucro do mês",
        appearsAfterMessage: 1,
      },
    ],
  },
];

export function DemoSection() {
  const tDemo = useTranslations("demoSection");

  return (
    <section
      id="demo"
      className={"relative py-20 md:py-28 bg-[#0a0e1a] overflow-hidden"}
    >
      <div className="absolute inset-0 mesh-gradient opacity-40" />
      <div
        className={
          "absolute top-0 left-1/2 -translate-x-1/2 " +
          "w-[800px] h-[400px] rounded-full " +
          "bg-emerald-500/[0.05] blur-[120px]"
        }
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className={"grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <PhoneCarousel screens={demoScreens} />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.span
              variants={fadeUp}
              className={
                "inline-block px-4 py-1.5 text-xs font-semibold " +
                "text-emerald-400 bg-emerald-500/10 " +
                "rounded-full uppercase tracking-wider " +
                "border border-emerald-500/20"
              }
            >
              {tDemo("badge")}
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className={
                "mt-4 text-3xl md:text-4xl font-bold " +
                "text-white tracking-tight"
              }
            >
              {tDemo("title")}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-gray-400 leading-relaxed"
            >
              {tDemo("subtitle")}
            </motion.p>

            <motion.div variants={stagger} className="mt-8 space-y-4">
              {[
                { icon: MessageCircle, text: tDemo("example1") },
                { icon: DollarSign, text: tDemo("example2") },
                { icon: FileText, text: tDemo("example3") },
                { icon: BarChart3, text: tDemo("example4") },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className={
                    "flex items-start gap-3 p-3 rounded-xl " +
                    "bg-white/[0.03] border border-white/[0.06]"
                  }
                >
                  <div
                    className={
                      "w-8 h-8 rounded-lg bg-emerald-500/10 " +
                      "flex items-center justify-center " +
                      "flex-shrink-0 mt-0.5"
                    }
                  >
                    <item.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-gray-300 text-sm italic">{item.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
