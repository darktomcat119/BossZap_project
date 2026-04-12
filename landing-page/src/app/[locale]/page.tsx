"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter, Link } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  CalendarCheck,
  DollarSign,
  FileText,
  MessageCircle,
  Bot,
  LayoutDashboard,
  Check,
  Globe,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Shield,
  Zap,
  Star,
  Mic,
  Clock,
  Smartphone,
  BarChart3,
  Users,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParticleCanvas } from "@/components/shared/particle-canvas";
import { PhoneCarousel } from "@/components/shared/phone-carousel";
import { Circle3DSlider } from "@/components/shared/circle-3d-slider";
import { FeatureCardStrip } from "@/components/shared/feature-card-strip";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ─── Language Switcher ─── */
function LanguageSwitcher({ dark = true }: { dark?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as string) || "es";
  const [open, setOpen] = useState(false);

  const locales = [
    { code: "es" as const, label: "Español", flag: "🇪🇸" },
    { code: "en" as const, label: "English", flag: "🇺🇸" },
    { code: "pt-BR" as const, label: "Português", flag: "🇧🇷" },
  ];

  const current = locales.find((l) => l.code === currentLocale) || locales[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
          dark
            ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
        )}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden uppercase">{current.code.split("-")[0]}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 mt-2 w-44 rounded-xl border shadow-xl z-50 overflow-hidden",
              dark
                ? "bg-[#0f1628] border-white/10"
                : "bg-white border-gray-200",
            )}
          >
            {locales.map((loc) => {
              const isActive = loc.code === currentLocale;
              return (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => {
                    router.replace(pathname, { locale: loc.code });
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left",
                    dark
                      ? "text-gray-300 hover:bg-white/5"
                      : "text-gray-700 hover:bg-gray-50",
                    isActive && (dark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"),
                  )}
                >
                  <span className="text-xl leading-none">{loc.flag}</span>
                  <span className="font-medium">{loc.label}</span>
                  {isActive && (
                    <Check className={cn("w-4 h-4 ml-auto", dark ? "text-emerald-400" : "text-emerald-600")} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  const tNav = useTranslations("nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-dark border-b border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/30 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Image src="/bosszap_logo.png" alt="BossZap" width={40} height={42} className="relative h-10 w-auto" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">BossZap</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-8">
          <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">{tNav("features")}</a>
          <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">{tNav("howItWorks")}</a>
          <a href="#demo" className="text-sm text-gray-400 hover:text-white transition-colors">{tNav("demo")}</a>
          <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">{tNav("pricing")}</a>
          <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">{tNav("faq")}</a>
          <LanguageSwitcher />
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">{tNav("login")}</Link>
          <Link href="/register" className="relative px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40 hover:-translate-y-0.5 overflow-hidden group">
            <span className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100" />
            <span className="relative">{tNav("register")}</span>
          </Link>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden flex h-11 w-11 items-center justify-center text-gray-400">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden overflow-hidden border-t border-white/5 bg-[#0a0e1a]/98 backdrop-blur-2xl px-4 py-4 space-y-2">
            {["features", "how-it-works", "demo", "pricing", "faq"].map((id) => (
              <a key={id} href={`#${id}`} onClick={() => setMobileOpen(false)} className="block py-3 text-sm text-gray-300 capitalize">{id.replace("-", " ")}</a>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link href="/login" className="block text-center py-3 text-sm font-medium text-white border border-white/10 rounded-lg">{tNav("login")}</Link>
              <Link href="/register" className="block text-center py-3 bg-emerald-500 text-white text-sm font-semibold rounded-lg">{tNav("register")}</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ─── Hero ─── */
function HeroSection() {
  const t = useTranslations("hero");
  const tLabels = useTranslations("labels");

  const chatScreens = [
    {
      id: "scheduling",
      messages: [
        { id: 1, type: "sent" as const, text: "Tenho uma pintura amanhã às 14h na Rua Augusta 480", time: "10:30" },
        { id: 2, type: "received" as const, text: "Compromisso agendado! 📅\n\"Pintura - Rua Augusta 480\"\nAmanhã às 14:00.\nVou te lembrar 1h antes!", time: "10:30" },
        { id: 3, type: "sent" as const, text: "Não, está ótimo!", time: "10:31" },
        { id: 4, type: "received" as const, text: "Perfeito! Bom trabalho! 💪", time: "10:31" },
      ],
      badges: [
        { position: "top-left" as const, icon: "pdf" as const, title: "Orçamento enviado", subtitle: "PDF gerado automaticamente", appearsAfterMessage: 1 },
        { position: "bottom-right" as const, icon: "revenue" as const, title: "+R$2.340", subtitle: "Receita do mês", appearsAfterMessage: 3 },
      ],
    },
    {
      id: "voice",
      messages: [
        { id: 1, type: "sent" as const, text: "", time: "11:40", isVoice: true, voiceDuration: "0:08" },
        { id: 2, type: "received" as const, text: "Entendi! Orçamento para pintura de sala para o Sr. Silva. Gerando PDF... ✅", time: "11:40" },
        { id: 3, type: "sent" as const, text: "Manda pra ele", time: "11:41" },
        { id: 4, type: "received" as const, text: "PDF enviado para Sr. Silva pelo WhatsApp! 📄\nTotal: R$1.850,00", time: "11:41" },
      ],
      badges: [
        { position: "top-left" as const, icon: "pdf" as const, title: "Áudio transcrito", subtitle: "IA entende sua voz", appearsAfterMessage: 1 },
        { position: "bottom-right" as const, icon: "pdf" as const, title: "PDF enviado", subtitle: "Com sua marca", appearsAfterMessage: 3 },
      ],
    },
    {
      id: "finance",
      messages: [
        { id: 1, type: "sent" as const, text: "Gastei R$150 em material", time: "14:20" },
        { id: 2, type: "received" as const, text: "Despesa registrada! 💰\nR$150,00 - Materiais", time: "14:20" },
        { id: 3, type: "sent" as const, text: "Quanto ganhei essa semana?", time: "14:21" },
        { id: 4, type: "received" as const, text: "📈 Receitas: R$3.500\n📉 Despesas: R$580\n💰 Lucro: R$2.920\n\nÓtima semana! 🎉", time: "14:21" },
      ],
      badges: [
        { position: "top-left" as const, icon: "revenue" as const, title: "Lucro +23%", subtitle: "vs. mês anterior", appearsAfterMessage: 1 },
        { position: "bottom-right" as const, icon: "revenue" as const, title: "+R$2.920", subtitle: "Lucro da semana", appearsAfterMessage: 3 },
      ],
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0a0e1a] via-[#111833] to-[#0d1229] mesh-gradient noise">
      <ParticleCanvas className="opacity-40" particleCount={80} color="0, 212, 170" maxDistance={140} speed={0.2} />
      <div className="pointer-events-none absolute top-20 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.06] blur-[150px] animate-float" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/[0.05] blur-[120px] animate-float-delay" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-500/[0.02] blur-[200px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left */}
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            {/* Logo — large and prominent */}
            <motion.div variants={fadeUp} className="mb-6">
              <div className="relative inline-block animate-float">
                <div className="absolute -inset-6 bg-emerald-500/20 blur-3xl rounded-full animate-pulse-glow" />
                <Image
                  src="/bosszap_logo.png"
                  alt="BossZap"
                  width={200}
                  height={210}
                  className="relative h-28 sm:h-36 lg:h-40 w-auto drop-shadow-[0_0_40px_rgba(0,212,170,0.4)]"
                  priority
                />
              </div>
            </motion.div>

            {/* AI badge */}
            <motion.div variants={fadeUp} className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">{tLabels("aiPoweredBadge")}</span>
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight">
              <span className="text-white">{t("title").split(" ").slice(0, -2).join(" ")} </span>
              <span className="gradient-text">{t("title").split(" ").slice(-2).join(" ")}</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 text-lg text-gray-400 leading-relaxed max-w-lg">
              {t("subtitle")}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white font-bold text-base rounded-xl shadow-emerald-glow hover:shadow-luxury-hover transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                <span className="absolute inset-0 animate-shimmer opacity-50" />
                <span className="relative">{t("cta")}</span>
                <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#demo" className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-medium text-base rounded-xl glass border border-white/10 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-0.5">
                <Smartphone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>{tLabels("seeDemo")}</span>
              </a>
            </motion.div>

            {/* Trust row */}
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500">{tLabels("lgpdCompliant")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500">{tLabels("textAndVoice")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500">{tLabels("aiAssistant247")}</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Phone carousel */}
          <motion.div initial="hidden" animate="visible" variants={scaleIn} className="hidden lg:block">
            <PhoneCarousel screens={chatScreens} interval={6000} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats Bar ─── */
function StatsBar() {
  const t = useTranslations("stats");
  const stats = [
    { icon: MessageCircle, value: t("whatsappValue"), label: t("whatsappLabel") },
    { icon: Mic, value: t("voiceValue"), label: t("voiceLabel") },
    { icon: Clock, value: t("alwaysOnValue"), label: t("alwaysOnLabel") },
    { icon: FileText, value: t("pdfValue"), label: t("pdfLabel") },
  ];
  return (
    <section className="relative bg-[#0d1229] border-y border-white/5 py-12 overflow-hidden">
      <div className="absolute inset-0 mesh-gradient opacity-50" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center group">
            <div className="relative w-12 h-12 mx-auto mb-3">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-full h-full rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <stat.icon className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Features ─── */
function FeaturesSection() {
  const t = useTranslations("features");
  const tSection = useTranslations("sectionLabels");
  const tFeatSection = useTranslations("featuresSection");

  const featureCards = [
    { image: "/images/feature-calendar.jpg", icon: CalendarCheck, iconColor: "text-emerald-600", iconBg: "bg-emerald-50", title: t("schedule.title"), description: t("schedule.description") },
    { image: "/images/feature-finance.jpg", icon: DollarSign, iconColor: "text-blue-600", iconBg: "bg-blue-50", title: t("finance.title"), description: t("finance.description") },
    { image: "/images/feature-pdf.jpg", icon: FileText, iconColor: "text-purple-600", iconBg: "bg-purple-50", title: t("budgets.title"), description: t("budgets.description") },
    { image: "/images/feature-whatsapp.jpg", icon: MessageCircle, iconColor: "text-green-600", iconBg: "bg-green-50", title: tFeatSection("whatsappAi"), description: tFeatSection("subtitle") },
    { image: "/images/feature-dashboard.jpg", icon: LayoutDashboard, iconColor: "text-orange-600", iconBg: "bg-orange-50", title: tFeatSection("dashboard"), description: tFeatSection("dashboardDesc") },
    { image: "/images/feature-ai.jpg", icon: Bot, iconColor: "text-cyan-600", iconBg: "bg-cyan-50", title: tFeatSection("aiAssistant"), description: tFeatSection("aiAssistantDesc") },
    { image: "/images/feature-reports.jpg", icon: BarChart3, iconColor: "text-rose-600", iconBg: "bg-rose-50", title: tFeatSection("reportsCsv"), description: tFeatSection("reportsCsvDesc") },
    { image: "/images/feature-team.jpg", icon: Users, iconColor: "text-indigo-600", iconBg: "bg-indigo-50", title: tFeatSection("clientTracking"), description: tFeatSection("clientTrackingDesc") },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full uppercase tracking-wider">{tSection("features")}</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">{t("title")}</h2>
          <p className="mt-4 text-gray-500 text-lg">{tFeatSection("subtitle")}</p>
        </motion.div>
      </div>

      {/* Scrolling feature cards */}
      <div className="mt-14">
        <FeatureCardStrip cards={featureCards} speed={30} direction="left" />
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorksSection() {
  const t = useTranslations("howItWorks");
  const tSection = useTranslations("sectionLabels");
  const tHowSection = useTranslations("howItWorksSection");
  const steps = [
    { key: "step1", icon: MessageCircle, number: "01" },
    { key: "step2", icon: Bot, number: "02" },
    { key: "step3", icon: LayoutDashboard, number: "03" },
  ] as const;

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full uppercase tracking-wider">{tSection("simple")}</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">{t("title")}</h2>
          <p className="mt-4 text-gray-500 text-lg">{tHowSection("subtitle")}</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200" />
          {steps.map(({ key, icon: Icon, number }) => (
            <motion.div key={key} variants={fadeUp} className="text-center relative">
              <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 relative z-10 rotate-3 hover:rotate-0 transition-transform duration-300">
                <Icon className="w-10 h-10 text-white" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-white text-emerald-600 text-sm font-bold rounded-lg flex items-center justify-center shadow-lg">{number}</span>
              </div>
              <h3 className="mt-8 text-xl font-bold text-gray-900">{t(`${key}.title`)}</h3>
              <p className="mt-3 text-gray-500 leading-relaxed max-w-xs mx-auto">{t(`${key}.description`)}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Demo / Carousel Section ─── */
function DemoSection() {
  const tDemo = useTranslations("demoSection");

  const demoScreens = [
    {
      id: "demo-schedule",
      messages: [
        { id: 1, type: "sent" as const, text: "Tenho uma pintura amanhã às 14h na Rua Augusta 480", time: "09:30" },
        { id: 2, type: "received" as const, text: "Compromisso agendado! 📅\n\"Pintura - Rua Augusta 480\"\nAmanhã às 14:00\nVou te lembrar 1h antes!", time: "09:30" },
      ],
      badges: [
        { position: "top-left" as const, icon: "pdf" as const, title: "Agenda atualizada", subtitle: "Lembrete automático ativado", appearsAfterMessage: 1 },
        { position: "bottom-right" as const, icon: "revenue" as const, title: "3 trabalhos", subtitle: "Agendados esta semana", appearsAfterMessage: 1 },
      ],
    },
    {
      id: "demo-expense",
      messages: [
        { id: 1, type: "sent" as const, text: "Gastei R$150 em tinta e pincéis", time: "14:20" },
        { id: 2, type: "received" as const, text: "Despesa registrada! 💰\nR$150,00 - Materiais\nSeu lucro este mês: R$2.190,00", time: "14:20" },
      ],
      badges: [
        { position: "top-left" as const, icon: "revenue" as const, title: "Despesa salva", subtitle: "Categoria: Materiais", appearsAfterMessage: 1 },
        { position: "bottom-right" as const, icon: "revenue" as const, title: "R$2.190", subtitle: "Lucro atualizado", appearsAfterMessage: 1 },
      ],
    },
    {
      id: "demo-quote",
      messages: [
        { id: 1, type: "sent" as const, text: "", time: "11:40", isVoice: true, voiceDuration: "0:08" },
        { id: 2, type: "received" as const, text: "Entendi! Orçamento para reforma de banheiro para o Sr. Silva. Gerando PDF...", time: "11:40" },
        { id: 3, type: "sent" as const, text: "Manda pra ele", time: "11:41" },
        { id: 4, type: "received" as const, text: "PDF enviado para Sr. Silva! 📄\nReforma banheiro\nTotal: R$3.200,00 ✅", time: "11:41" },
      ],
      badges: [
        { position: "top-left" as const, icon: "pdf" as const, title: "Áudio transcrito", subtitle: "IA entende sua voz", appearsAfterMessage: 1 },
        { position: "bottom-right" as const, icon: "pdf" as const, title: "PDF enviado", subtitle: "Com sua marca e logo", appearsAfterMessage: 3 },
      ],
    },
    {
      id: "demo-report",
      messages: [
        { id: 1, type: "sent" as const, text: "Quanto ganhei esse mês?", time: "18:00" },
        { id: 2, type: "received" as const, text: "Relatório de Abril:\n\n📈 Receitas: R$8.500,00\n📉 Despesas: R$2.180,00\n💰 Lucro: R$6.320,00\n\n+23% comparado ao mês anterior! 🎉", time: "18:00" },
      ],
      badges: [
        { position: "top-left" as const, icon: "revenue" as const, title: "Lucro +23%", subtitle: "vs. mês anterior", appearsAfterMessage: 1 },
        { position: "bottom-right" as const, icon: "revenue" as const, title: "R$6.320", subtitle: "Lucro do mês", appearsAfterMessage: 1 },
      ],
    },
  ];

  return (
    <section id="demo" className="relative py-20 md:py-28 bg-[#0a0e1a] overflow-hidden">
      <div className="absolute inset-0 mesh-gradient opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: phone carousel */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
            <PhoneCarousel screens={demoScreens} />
          </motion.div>

          {/* Right: content */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.span variants={fadeUp} className="inline-block px-4 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-full uppercase tracking-wider border border-emerald-500/20">
              {tDemo("badge")}
            </motion.span>
            <motion.h2 variants={fadeUp} className="mt-4 text-3xl md:text-4xl font-bold text-white tracking-tight">
              {tDemo("title")}
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-gray-400 leading-relaxed">
              {tDemo("subtitle")}
            </motion.p>

            <motion.div variants={stagger} className="mt-8 space-y-4">
              {[
                { icon: MessageCircle, text: tDemo("example1") },
                { icon: DollarSign, text: tDemo("example2") },
                { icon: FileText, text: tDemo("example3") },
                { icon: BarChart3, text: tDemo("example4") },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
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

/* ─── Testimonials ─── */
function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const tSection = useTranslations("sectionLabels");
  const items = t.raw("items") as Array<{ name: string; role: string; quote: string }>;
  const avatars = ["/images/professional-man.jpg", "/images/professional-woman.jpg", "/images/professional-woman-2.jpg"];

  return (
    <section className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full uppercase tracking-wider">{tSection("testimonials")}</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">{t("title")}</h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <Image src={avatars[i % avatars.length]} alt={item.name} width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
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

/* ─── Who It's For ─── */
function WhoItsForSection() {
  const t = useTranslations("categories");
  const tSection = useTranslations("sectionLabels");
  const tWho = useTranslations("whoItsFor");
  const tLabels = useTranslations("labels");

  const slides = [
    { id: "painter", image: "/images/categories/painter.png", title: t("painter.title"), subtitle: t("painter.subtitle") },
    { id: "electrician", image: "/images/categories/electrician.png", title: t("electrician.title"), subtitle: t("electrician.subtitle") },
    { id: "beauty", image: "/images/categories/beauty.png", title: t("beauty.title"), subtitle: t("beauty.subtitle") },
    { id: "gardener", image: "/images/categories/gardener.png", title: t("gardener.title"), subtitle: t("gardener.subtitle") },
    { id: "ac-service", image: "/images/categories/ac-service.png", title: t("ac_service.title"), subtitle: t("ac_service.subtitle") },
    { id: "cleaning", image: "/images/categories/cleaning.png", title: t("cleaning.title"), subtitle: t("cleaning.subtitle") },
    { id: "photographer", image: "/images/categories/photographer.png", title: t("photographer.title"), subtitle: t("photographer.subtitle") },
    { id: "chef", image: "/images/categories/chef.png", title: t("chef.title"), subtitle: t("chef.subtitle") },
    { id: "lawyer", image: "/images/categories/lawyer.png", title: t("lawyer.title"), subtitle: t("lawyer.subtitle") },
    { id: "accountant", image: "/images/categories/accountant.png", title: t("accountant.title"), subtitle: t("accountant.subtitle") },
    { id: "consultant", image: "/images/categories/consultant.jpg", title: t("consultant.title"), subtitle: t("consultant.subtitle") },
    { id: "designer", image: "/images/categories/designer.jpg", title: t("designer.title"), subtitle: t("designer.subtitle") },
    { id: "real-estate", image: "/images/categories/real-estate.jpg", title: t("real_estate.title"), subtitle: t("real_estate.subtitle") },
    { id: "doctor", image: "/images/categories/doctor.jpg", title: t("doctor.title"), subtitle: t("doctor.subtitle") },
    { id: "architect", image: "/images/categories/architect.jpg", title: t("architect.title"), subtitle: t("architect.subtitle") },
    { id: "tutor", image: "/images/categories/tutor.jpg", title: t("tutor.title"), subtitle: t("tutor.subtitle") },
  ];

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-white via-gray-50 to-white overflow-x-clip">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.04] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/[0.04] blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full uppercase tracking-wider">
            {tSection("forProfessionals")}
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
            {tWho("title")}
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            {tWho("subtitle")}
          </p>
        </motion.div>
      </div>

      {/* Slider — full width, no max-width clipping */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="mt-14 w-full"
      >
        <Circle3DSlider
          items={slides}
          rotationSpeed={6}
          featuredLabel={tLabels("featured")}
          showingLabel={tLabels("showing")}
        />
      </motion.div>
    </section>
  );
}

/* ─── Pricing ─── */
function PricingSection() {
  const t = useTranslations("pricing");
  const tSection = useTranslations("sectionLabels");
  const tLabels = useTranslations("labels");
  const features = t.raw("plan.features") as string[];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full uppercase tracking-wider">{tSection("pricing")}</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">{t("title")}</h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={scaleIn} className="mt-14 max-w-lg mx-auto">
          <div className="relative">
            <div className="absolute -inset-2 rounded-3xl animate-gradient-border opacity-30 blur-2xl" />
            <div className="absolute -inset-px rounded-2xl animate-gradient-border opacity-50" />
            <div className="relative rounded-2xl bg-white shadow-luxury overflow-hidden">
              <div className="h-1.5 animate-gradient-border" />
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest">{t("plan.name")}</h3>
                  <span className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 rounded-full">{tLabels("popular")}</span>
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">{t("plan.price")}</span>
                  <span className="text-gray-400 text-lg">{t("plan.period")}</span>
                </div>
                <ul className="mt-8 space-y-3.5">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="group relative mt-10 flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white font-bold text-lg rounded-xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                  <span className="absolute inset-0 animate-shimmer opacity-50" />
                  <span className="relative">{t("plan.cta")}</span>
                  <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="mt-4 text-center text-sm text-gray-400">{t("trial")}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FaqSection() {
  const t = useTranslations("faq");
  const tSection = useTranslations("sectionLabels");
  const items = t.raw("items") as Array<{ question: string; answer: string }>;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full uppercase tracking-wider">{tSection("faq")}</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">{t("title")}</h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="mt-14 space-y-3">
          {items.map((item, i) => (
            <motion.div key={i} variants={fadeUp} className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="flex w-full items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
                <motion.div animate={{ rotate: openIndex === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-5 pb-5 text-gray-500 leading-relaxed">{item.answer}</div>
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

/* ─── CTA Banner ─── */
function CtaBanner() {
  const t = useTranslations("hero");
  const tCta = useTranslations("ctaBanner");
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 py-16">
      <div className="absolute inset-0 bg-[url('/images/hero-business.jpg')] bg-cover bg-center opacity-10" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white">{tCta("title")}</h2>
        <p className="mt-4 text-lg text-emerald-100/80 max-w-2xl mx-auto">{tCta("subtitle")}</p>
        <Link href="/register" className="mt-8 inline-flex items-center gap-2 px-10 py-4 bg-white text-emerald-600 font-bold text-lg rounded-xl shadow-2xl transition-all hover:-translate-y-0.5">
          {t("cta")} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const t = useTranslations("footer");
  const tFs = useTranslations("footerSections");
  const tNav = useTranslations("nav");
  return (
    <footer className="bg-[#070a14] pt-16 pb-28 md:pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/bosszap_logo.png" alt="BossZap" width={36} height={38} className="h-9 w-auto" />
              <span className="text-white font-bold text-xl">BossZap</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">{tFs("tagline")}</p>
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{tFs("product")}</h4>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{tNav("features")}</a></li>
              <li><a href="#pricing" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{tNav("pricing")}</a></li>
              <li><a href="#demo" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{tNav("demo")}</a></li>
              <li><a href="#faq" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{tNav("faq")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{tFs("legal")}</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{t("terms")}</a></li>
              <li><a href="#" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{t("privacy")}</a></li>
              <li><a href="#" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{t("contact")}</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} BossZap. {t("rights")}</p>
          <p className="text-xs text-gray-700">{tFs("madeIn")}</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Mobile Sticky CTA ─── */
function MobileStickyCTA() {
  const t = useTranslations("hero");
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-[#070a14]/95 backdrop-blur-2xl border-t border-white/10 md:hidden">
      <Link href="/register" className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-colors">
        {t("cta")} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <HowItWorksSection />
        <DemoSection />
        <TestimonialsSection />
        <WhoItsForSection />
        <PricingSection />
        <FaqSection />
        <CtaBanner />
      </main>
      <Footer />
      <MobileStickyCTA />
    </>
  );
}
