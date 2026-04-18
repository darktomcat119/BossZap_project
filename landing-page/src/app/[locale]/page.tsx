"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { HeroSection } from "@/components/sections/hero";
import { StatsBar } from "@/components/sections/stats-bar";
import { FeaturesSection } from "@/components/sections/features";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { DemoSection } from "@/components/sections/demo";
import { TestimonialsSection } from "@/components/sections/testimonials";
import { PricingSection } from "@/components/sections/pricing";
import { FaqSection } from "@/components/sections/faq";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Footer } from "@/components/sections/footer";

function MobileStickyCTA() {
  const t = useTranslations("hero");
  return (
    <div
      className={
        "fixed bottom-0 left-0 right-0 z-40 p-3 " +
        "bg-[#070a14]/95 backdrop-blur-2xl " +
        "border-t border-white/10 md:hidden"
      }
    >
      <Link
        href="/register"
        className={
          "flex items-center justify-center gap-2 w-full " +
          "py-3.5 bg-emerald-500 hover:bg-emerald-400 " +
          "text-white font-bold rounded-xl shadow-lg " +
          "shadow-emerald-500/30 transition-colors"
        }
      >
        {t("cta")} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

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
        <PricingSection />
        <FaqSection />
        <CtaBanner />
      </main>
      <Footer />
      <MobileStickyCTA />
    </>
  );
}
