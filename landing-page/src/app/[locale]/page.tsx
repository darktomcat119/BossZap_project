"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParticleCanvas } from "@/components/shared/particle-canvas";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

/* ─── Language Switcher ─── */
function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locales = [
    { code: "es" as const, label: "ES" },
    { code: "en" as const, label: "EN" },
    { code: "pt-BR" as const, label: "PT" },
  ];

  return (
    <div className="flex items-center gap-1">
      <Globe className="w-4 h-4 text-gray-400" />
      {locales.map((loc) => (
        <button
          key={loc.code}
          onClick={() => router.replace(pathname, { locale: loc.code })}
          className="px-2 py-1 text-sm rounded-md text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  const tNav = useTranslations("nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0f1628]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/bosszap_logo.png" alt="BossZap" width={32} height={34} className="h-8 w-auto" />
          <span className="text-xl font-bold text-white">BossZap</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
            {tNav("features")}
          </a>
          <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
            {tNav("pricing")}
          </a>
          <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">
            FAQ
          </a>
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-sm font-medium text-white hover:text-emerald-400 transition-colors"
          >
            {tNav("login")}
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            {tNav("register")}
          </Link>
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex h-11 w-11 items-center justify-center text-gray-400"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-white/5 bg-[#0f1628]/95 backdrop-blur-xl px-4 py-4 space-y-3"
          >
            <a href="#features" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-gray-300">
              {tNav("features")}
            </a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-gray-300">
              {tNav("pricing")}
            </a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-gray-300">
              FAQ
            </a>
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/login"
                className="block text-center py-2 text-sm font-medium text-white border border-white/10 rounded-lg"
              >
                {tNav("login")}
              </Link>
              <Link
                href="/register"
                className="block text-center py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg"
              >
                {tNav("register")}
              </Link>
            </div>
            <LanguageSwitcher />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ─── Hero ─── */
function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1628] via-[#1a1f36] to-[#12182e] min-h-[80vh] flex items-center">
      <ParticleCanvas className="pointer-events-auto opacity-60" particleCount={60} color="0, 212, 170" maxDistance={130} speed={0.25} />

      {/* White glow behind logo area */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 md:py-32 text-center w-full">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full scale-150" />
              <Image src="/bosszap_logo.png" alt="BossZap" width={80} height={84} className="relative h-20 w-auto drop-shadow-2xl" />
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight"
          >
            {t("title")}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10">
            <Link
              href="/register"
              className="inline-block px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-xl shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              {t("cta")}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function FeaturesSection() {
  const t = useTranslations("features");
  const features = [
    { key: "schedule", icon: CalendarCheck, gradient: "from-emerald-500/10 to-teal-500/5" },
    { key: "finance", icon: DollarSign, gradient: "from-blue-500/10 to-indigo-500/5" },
    { key: "budgets", icon: FileText, gradient: "from-purple-500/10 to-pink-500/5" },
  ] as const;

  return (
    <section id="features" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}
          className="text-3xl md:text-4xl font-bold text-center text-gray-900"
        >
          {t("title")}
        </motion.h2>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}
          className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map(({ key, icon: Icon, gradient }) => (
            <motion.div
              key={key}
              variants={fadeUp}
              className="group relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300", gradient)} />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Icon className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">{t(`${key}.title`)}</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">{t(`${key}.description`)}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorksSection() {
  const t = useTranslations("howItWorks");
  const steps = [
    { key: "step1", icon: MessageCircle, number: "1" },
    { key: "step2", icon: Bot, number: "2" },
    { key: "step3", icon: LayoutDashboard, number: "3" },
  ] as const;

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}
          className="text-3xl md:text-4xl font-bold text-center text-gray-900"
        >
          {t("title")}
        </motion.h2>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}
          className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative"
        >
          {/* Dashed connector line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] border-t-2 border-dashed border-emerald-200" />

          {steps.map(({ key, icon: Icon, number }) => (
            <motion.div key={key} variants={fadeUp} className="text-center relative">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 relative z-10">
                <Icon className="w-8 h-8 text-white" />
                <span className="absolute -top-1 -right-1 w-7 h-7 bg-white text-emerald-600 text-sm font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-emerald-100">
                  {number}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">{t(`${key}.title`)}</h3>
              <p className="mt-3 text-gray-600 leading-relaxed max-w-xs mx-auto">{t(`${key}.description`)}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const items = t.raw("items") as Array<{ name: string; role: string; quote: string }>;

  return (
    <section className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}
          className="text-3xl md:text-4xl font-bold text-center text-gray-900"
        >
          {t("title")}
        </motion.h2>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}
          className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-gray-600 leading-relaxed italic text-[15px]">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  {item.name.charAt(0)}
                </div>
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

/* ─── Pricing ─── */
function PricingSection() {
  const t = useTranslations("pricing");
  const features = t.raw("plan.features") as string[];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}
          className="text-3xl md:text-4xl font-bold text-center text-gray-900"
        >
          {t("title")}
        </motion.h2>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}
          className="mt-14 max-w-md mx-auto"
        >
          <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 shadow-2xl shadow-emerald-500/20">
            <div className="bg-white rounded-[14px] p-8">
              <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-widest">
                {t("plan.name")}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-gray-900">{t("plan.price")}</span>
                <span className="text-gray-500 text-lg">{t("plan.period")}</span>
              </div>
              <ul className="mt-8 space-y-4">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block w-full text-center px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                {t("plan.cta")}
              </Link>
              <p className="mt-4 text-center text-sm text-gray-500">{t("trial")}</p>
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
  const items = t.raw("items") as Array<{ question: string; answer: string }>;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <motion.h2
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}
          className="text-3xl md:text-4xl font-bold text-center text-gray-900"
        >
          {t("title")}
        </motion.h2>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}
          className="mt-14 space-y-3"
        >
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors"
              >
                <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
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
                    <div className="px-5 pb-5 text-gray-600 leading-relaxed">{item.answer}</div>
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

/* ─── Footer ─── */
function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-[#0b0f1e] py-10 pb-24 md:pb-10 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Image src="/bosszap_logo.png" alt="BossZap" width={24} height={25} className="h-6 w-auto" />
          <span className="text-white font-bold">BossZap</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <a href="#" className="hover:text-gray-300 transition-colors">{t("terms")}</a>
          <a href="#" className="hover:text-gray-300 transition-colors">{t("privacy")}</a>
          <a href="#" className="hover:text-gray-300 transition-colors">{t("contact")}</a>
        </div>
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} BossZap. {t("rights")}
        </p>
      </div>
    </footer>
  );
}

/* ─── Mobile Sticky CTA ─── */
function MobileStickyCTA() {
  const t = useTranslations("hero");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-[#0f1628]/95 backdrop-blur-xl border-t border-white/10 md:hidden">
      <Link
        href="/register"
        className="block w-full text-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-colors"
      >
        {t("cta")}
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
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
      </main>
      <Footer />
      <MobileStickyCTA />
    </>
  );
}
