"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  DollarSign,
  FileText,
  MessageCircle,
  Bot,
  LayoutDashboard,
  Check,
  Globe,
  Zap,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

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
      <Globe className="w-4 h-4 text-text-secondary" />
      {locales.map((loc) => (
        <button
          key={loc.code}
          onClick={() => router.replace(pathname, { locale: loc.code })}
          className="px-2 py-1 text-sm rounded-md text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}

function Navbar() {
  const tNav = useTranslations("nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-text-primary">
            BossZap
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#features"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {tNav("features")}
          </a>
          <a
            href="#pricing"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {tNav("pricing")}
          </a>
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-sm font-medium text-text-primary hover:text-primary transition-colors"
          >
            {tNav("login")}
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {tNav("register")}
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-text-secondary"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3">
          <a
            href="#features"
            onClick={() => setMobileOpen(false)}
            className="block text-sm text-text-secondary"
          >
            {tNav("features")}
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileOpen(false)}
            className="block text-sm text-text-secondary"
          >
            {tNav("pricing")}
          </a>
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            <Link
              href="/login"
              className="block text-center py-2 text-sm font-medium text-text-primary border border-border rounded-lg"
            >
              {tNav("login")}
            </Link>
            <Link
              href="/register"
              className="block text-center py-2 bg-primary text-white text-sm font-semibold rounded-lg"
            >
              {tNav("register")}
            </Link>
          </div>
          <LanguageSwitcher />
        </div>
      )}
    </header>
  );
}

function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-surface via-background to-primary/5">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-28 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.h1
            variants={fadeUp}
            className="text-4xl md:text-6xl font-extrabold text-text-primary text-balance leading-tight"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto text-balance"
          >
            {t("subtitle")}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10">
            <a
              href="#pricing"
              className="inline-block w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold text-lg rounded-xl shadow-lg shadow-primary/25 transition-colors"
            >
              {t("cta")}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const t = useTranslations("features");

  const features = [
    { key: "schedule", icon: CalendarCheck },
    { key: "finance", icon: DollarSign },
    { key: "budgets", icon: FileText },
  ] as const;

  return (
    <section id="features" className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-bold text-center text-text-primary"
        >
          {t("title")}
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map(({ key, icon: Icon }) => (
            <motion.div
              key={key}
              variants={fadeUp}
              className="bg-surface rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-text-primary">
                {t(`${key}.title`)}
              </h3>
              <p className="mt-3 text-text-secondary leading-relaxed">
                {t(`${key}.description`)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const t = useTranslations("howItWorks");

  const steps = [
    { key: "step1", icon: MessageCircle, number: "1" },
    { key: "step2", icon: Bot, number: "2" },
    { key: "step3", icon: LayoutDashboard, number: "3" },
  ] as const;

  return (
    <section className="py-16 md:py-24 bg-surface">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-bold text-center text-text-primary"
        >
          {t("title")}
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {steps.map(({ key, icon: Icon, number }) => (
            <motion.div
              key={key}
              variants={fadeUp}
              className="text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center relative">
                <Icon className="w-7 h-7 text-secondary" />
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {number}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-text-primary">
                {t(`${key}.title`)}
              </h3>
              <p className="mt-3 text-text-secondary leading-relaxed max-w-xs mx-auto">
                {t(`${key}.description`)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection() {
  const t = useTranslations("pricing");

  const features = t.raw("plan.features") as string[];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-bold text-center text-text-primary"
        >
          {t("title")}
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="mt-12 max-w-md mx-auto"
        >
          <div className="bg-surface rounded-2xl border-2 border-primary shadow-lg shadow-primary/10 p-8">
            <h3 className="text-lg font-semibold text-secondary uppercase tracking-wide">
              {t("plan.name")}
            </h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-text-primary">
                {t("plan.price")}
              </span>
              <span className="text-text-secondary text-lg">
                {t("plan.period")}
              </span>
            </div>
            <ul className="mt-8 space-y-4">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-text-primary">{feature}</span>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="mt-8 block w-full text-center px-6 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-md shadow-primary/20 transition-colors"
            >
              {t("plan.cta")}
            </a>
            <p className="mt-4 text-center text-sm text-text-secondary">
              {t("trial")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-text-primary py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-white font-bold">BossZap</span>
        </div>
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} BossZap. {t("rights")}
        </p>
      </div>
    </footer>
  );
}

function MobileStickyCTA() {
  const t = useTranslations("hero");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-surface/90 backdrop-blur-md border-t border-border md:hidden">
      <a
        href="#pricing"
        className="block w-full text-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-colors"
      >
        {t("cta")}
      </a>
    </div>
  );
}

function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const items = t.raw("items") as Array<{
    name: string;
    role: string;
    quote: string;
  }>;

  return (
    <section className="py-16 md:py-24 bg-surface">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-bold text-center text-text-primary"
        >
          {t("title")}
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="bg-background rounded-2xl p-6 border border-border"
            >
              <p className="text-text-secondary leading-relaxed italic">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="font-semibold text-text-primary">
                  {item.name}
                </p>
                <p className="text-sm text-text-muted">
                  {item.role}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FaqSection() {
  const t = useTranslations("faq");
  const items = t.raw("items") as Array<{
    question: string;
    answer: string;
  }>;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-3xl mx-auto px-4">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-bold text-center text-text-primary"
        >
          {t("title")}
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="mt-12 space-y-3"
        >
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="bg-surface rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === i ? null : i)
                }
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-text-primary pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-text-muted flex-shrink-0 transition-transform duration-200",
                    openIndex === i && "rotate-180"
                  )}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-text-secondary leading-relaxed">
                  {item.answer}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

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
