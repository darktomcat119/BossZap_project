"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";

export function Navbar() {
  const tNav = useTranslations("nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={"sticky top-0 z-50 glass-dark border-b border-white/[0.04]"}
    >
      <div
        className={
          "max-w-7xl mx-auto px-4 sm:px-6 py-3 " +
          "flex items-center justify-between"
        }
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div
              className={
                "absolute inset-0 bg-emerald-500/30 blur-lg " +
                "rounded-full opacity-0 group-hover:opacity-100 " +
                "transition-opacity"
              }
            />
            <Image
              src="/bosszap_logo.png"
              alt="BossZap"
              width={40}
              height={42}
              className="relative h-10 w-auto"
            />
          </div>
          <span className={"text-xl font-bold text-white tracking-tight"}>
            BossZap
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-8">
          <a
            href="#features"
            className={
              "text-sm text-gray-400 hover:text-white " + "transition-colors"
            }
          >
            {tNav("features")}
          </a>
          <a
            href="#how-it-works"
            className={
              "text-sm text-gray-400 hover:text-white " + "transition-colors"
            }
          >
            {tNav("howItWorks")}
          </a>
          <a
            href="#demo"
            className={
              "text-sm text-gray-400 hover:text-white " + "transition-colors"
            }
          >
            {tNav("demo")}
          </a>
          <a
            href="#pricing"
            className={
              "text-sm text-gray-400 hover:text-white " + "transition-colors"
            }
          >
            {tNav("pricing")}
          </a>
          <a
            href="#faq"
            className={
              "text-sm text-gray-400 hover:text-white " + "transition-colors"
            }
          >
            {tNav("faq")}
          </a>
          <LanguageSwitcher />
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className={
              "px-4 py-2 text-sm font-medium text-gray-300 " +
              "hover:text-white transition-colors"
            }
          >
            {tNav("login")}
          </Link>
          <Link
            href="/register"
            className={
              "relative px-5 py-2.5 bg-gradient-to-r " +
              "from-emerald-500 to-emerald-600 " +
              "hover:from-emerald-400 hover:to-emerald-500 " +
              "text-white text-sm font-semibold rounded-lg " +
              "transition-all shadow-lg shadow-emerald-500/30 " +
              "hover:shadow-emerald-400/40 hover:-translate-y-0.5 " +
              "overflow-hidden group"
            }
          >
            <span
              className={
                "absolute inset-0 animate-shimmer opacity-0 " +
                "group-hover:opacity-100"
              }
            />
            <span className="relative">{tNav("register")}</span>
          </Link>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={
            "lg:hidden flex h-11 w-11 items-center " +
            "justify-center text-gray-400"
          }
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={
              "lg:hidden overflow-hidden border-t border-white/5 " +
              "bg-[#0a0e1a]/98 backdrop-blur-2xl px-4 py-4 space-y-2"
            }
          >
            {["features", "how-it-works", "demo", "pricing", "faq"].map(
              (id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setMobileOpen(false)}
                  className={"block py-3 text-sm text-gray-300 capitalize"}
                >
                  {id.replace("-", " ")}
                </a>
              ),
            )}
            <div
              className={"pt-3 border-t border-white/10 flex flex-col gap-2"}
            >
              <Link
                href="/login"
                className={
                  "block text-center py-3 text-sm font-medium " +
                  "text-white border border-white/10 rounded-lg"
                }
              >
                {tNav("login")}
              </Link>
              <Link
                href="/register"
                className={
                  "block text-center py-3 bg-emerald-500 " +
                  "text-white text-sm font-semibold rounded-lg"
                }
              >
                {tNav("register")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
