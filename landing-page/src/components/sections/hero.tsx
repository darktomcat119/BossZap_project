"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Shield, Zap, Mic, Clock, Smartphone } from "lucide-react";
import { ParticleCanvas } from "@/components/shared/particle-canvas";
import { PhoneCarousel } from "@/components/shared/phone-carousel";
import { fadeUp, stagger, scaleIn } from "@/lib/motion";
import { heroChatScreens } from "@/lib/hero-chat-screens";

export function HeroSection() {
  const t = useTranslations("hero");
  const tLabels = useTranslations("labels");

  return (
    <section
      className={
        "relative overflow-hidden bg-gradient-to-b " +
        "from-[#0a0e1a] via-[#111833] to-[#0d1229] " +
        "mesh-gradient noise"
      }
    >
      <ParticleCanvas
        className="opacity-40"
        particleCount={80}
        color="0, 212, 170"
        maxDistance={140}
        speed={0.2}
      />
      <div
        className={
          "pointer-events-none absolute top-20 left-1/4 " +
          "w-[600px] h-[600px] rounded-full " +
          "bg-emerald-500/[0.06] blur-[150px] animate-float"
        }
      />
      <div
        className={
          "pointer-events-none absolute bottom-0 right-1/4 " +
          "w-[500px] h-[500px] rounded-full " +
          "bg-blue-500/[0.05] blur-[120px] animate-float-delay"
        }
      />
      <div
        className={
          "pointer-events-none absolute top-1/2 left-1/2 " +
          "-translate-x-1/2 -translate-y-1/2 " +
          "w-[800px] h-[800px] rounded-full " +
          "bg-purple-500/[0.02] blur-[200px]"
        }
      />

      <div
        className={
          "relative z-10 max-w-7xl mx-auto px-4 sm:px-6 " +
          "pt-12 pb-20 md:pt-20 md:pb-28"
        }
      >
        <div
          className={
            "grid grid-cols-1 lg:grid-cols-2 gap-12 " + "lg:gap-8 items-center"
          }
        >
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="mb-6">
              <div className="relative inline-block animate-float">
                <div
                  className={
                    "absolute -inset-6 bg-emerald-500/20 " +
                    "blur-3xl rounded-full animate-pulse-glow"
                  }
                />
                <Image
                  src="/bosszap_logo.png"
                  alt="BossZap"
                  width={200}
                  height={210}
                  className={
                    "relative h-28 sm:h-36 lg:h-40 w-auto " +
                    "drop-shadow-[0_0_40px_rgba(0,212,170,0.4)]"
                  }
                  priority
                />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="mb-6">
              <div
                className={
                  "inline-flex items-center gap-2 px-4 py-2 " +
                  "rounded-full bg-emerald-500/10 " +
                  "border border-emerald-500/30 backdrop-blur-sm"
                }
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className={"text-sm font-semibold text-emerald-400"}>
                  {tLabels("aiPoweredBadge")}
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className={
                "text-4xl sm:text-5xl lg:text-[3.5rem] " +
                "font-extrabold leading-[1.1] tracking-tight"
              }
            >
              <span className="text-white">
                {t("title").split(" ").slice(0, -2).join(" ")}{" "}
              </span>
              <span className="gradient-text">
                {t("title").split(" ").slice(-2).join(" ")}
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className={
                "mt-6 text-lg text-gray-400 leading-relaxed " + "max-w-lg"
              }
            >
              {t("subtitle")}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/register"
                className={
                  "group relative inline-flex items-center " +
                  "justify-center gap-2 px-8 py-4 " +
                  "bg-gradient-to-r from-emerald-500 " +
                  "via-emerald-400 to-emerald-500 " +
                  "bg-[length:200%_100%] " +
                  "hover:bg-[position:100%_0] text-white " +
                  "font-bold text-base rounded-xl " +
                  "shadow-emerald-glow hover:shadow-luxury-hover " +
                  "transition-all duration-500 " +
                  "hover:-translate-y-1 overflow-hidden"
                }
              >
                <span
                  className={"absolute inset-0 animate-shimmer opacity-50"}
                />
                <span className="relative">{t("cta")}</span>
                <ArrowRight
                  className={
                    "relative w-4 h-4 " +
                    "group-hover:translate-x-1 transition-transform"
                  }
                />
              </Link>
              <a
                href="#demo"
                className={
                  "group inline-flex items-center " +
                  "justify-center gap-2 px-8 py-4 text-white " +
                  "font-medium text-base rounded-xl glass " +
                  "border border-white/10 " +
                  "hover:border-emerald-500/50 " +
                  "transition-all duration-300 " +
                  "hover:-translate-y-0.5"
                }
              >
                <Smartphone
                  className={
                    "w-4 h-4 text-emerald-400 " +
                    "group-hover:scale-110 transition-transform"
                  }
                />
                <span>{tLabels("seeDemo")}</span>
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className={
                "mt-8 flex flex-wrap items-center " + "gap-x-6 gap-y-2"
              }
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500">
                  {tLabels("lgpdCompliant")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500">
                  {tLabels("textAndVoice")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500">
                  {tLabels("aiAssistant247")}
                </span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            className="hidden lg:block"
          >
            <PhoneCarousel screens={heroChatScreens} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
