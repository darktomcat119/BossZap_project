"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/routing";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const flagClass = "w-5 h-[14px] rounded-sm shadow-sm overflow-hidden block";

function FlagES() {
  return (
    <svg viewBox="0 0 3 2" className={flagClass} preserveAspectRatio="none">
      <rect width="3" height="2" fill="#c60b1e" />
      <rect y="0.5" width="3" height="1" fill="#ffc400" />
    </svg>
  );
}

function FlagUS() {
  return (
    <svg
      viewBox="0 0 7410 3900"
      className={flagClass}
      preserveAspectRatio="none"
    >
      <rect width="7410" height="3900" fill="#b22234" />
      <g fill="#fff">
        {[1, 3, 5, 7, 9, 11].map((i) => (
          <rect key={i} y={i * 300} width="7410" height="300" />
        ))}
      </g>
      <rect width="2964" height="2100" fill="#3c3b6e" />
    </svg>
  );
}

function FlagBR() {
  return (
    <svg viewBox="0 0 720 504" className={flagClass} preserveAspectRatio="none">
      <rect width="720" height="504" fill="#009b3a" />
      <polygon points="360,58 680,252 360,446 40,252" fill="#fedf00" />
      <circle cx="360" cy="252" r="108" fill="#002776" />
    </svg>
  );
}

export function LanguageSwitcher({ dark = true }: { dark?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as string) || "pt-BR";
  const [open, setOpen] = useState(false);

  const locales = [
    { code: "pt-BR" as const, label: "Português", flag: <FlagBR /> },
    { code: "es" as const, label: "Español", flag: <FlagES /> },
    { code: "en" as const, label: "English", flag: <FlagUS /> },
  ];

  const current = locales.find((l) => l.code === currentLocale) || locales[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
          "text-sm font-medium transition-all",
          dark
            ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
        )}
      >
        <span className="inline-flex leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden uppercase">
          {current.code.split("-")[0]}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "absolute right-0 mt-2 w-44 rounded-xl border",
              "shadow-xl z-50 overflow-hidden",
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
                    "flex w-full items-center gap-3 px-4 py-2.5",
                    "text-sm transition-colors text-left",
                    dark
                      ? "text-gray-300 hover:bg-white/5"
                      : "text-gray-700 hover:bg-gray-50",
                    isActive &&
                      (dark
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-emerald-50 text-emerald-600"),
                  )}
                >
                  <span className="inline-flex leading-none">{loc.flag}</span>
                  <span className="font-medium">{loc.label}</span>
                  {isActive && (
                    <Check
                      className={cn(
                        "w-4 h-4 ml-auto",
                        dark ? "text-emerald-400" : "text-emerald-600",
                      )}
                    />
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
