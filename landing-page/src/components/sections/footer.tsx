"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { LanguageSwitcher } from "./language-switcher";

export function Footer() {
  const t = useTranslations("footer");
  const tFs = useTranslations("footerSections");
  const tNav = useTranslations("nav");
  return (
    <footer
      className={
        "bg-[#070a14] pt-16 pb-28 md:pb-12 " + "border-t border-white/5"
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={"grid grid-cols-1 md:grid-cols-4 gap-10 mb-12"}>
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/bosszap_logo.png"
                alt="BossZap"
                width={36}
                height={38}
                className="h-9 w-auto"
              />
              <span className={"text-white font-bold text-xl"}>BossZap</span>
            </div>
            <p className={"text-gray-500 text-sm leading-relaxed max-w-sm"}>
              {tFs("tagline")}
            </p>
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>
          <div>
            <h4 className={"text-white font-semibold text-sm mb-4"}>
              {tFs("product")}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#features"
                  className={
                    "text-gray-500 text-sm " +
                    "hover:text-gray-300 transition-colors"
                  }
                >
                  {tNav("features")}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className={
                    "text-gray-500 text-sm " +
                    "hover:text-gray-300 transition-colors"
                  }
                >
                  {tNav("pricing")}
                </a>
              </li>
              <li>
                <a
                  href="#demo"
                  className={
                    "text-gray-500 text-sm " +
                    "hover:text-gray-300 transition-colors"
                  }
                >
                  {tNav("demo")}
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className={
                    "text-gray-500 text-sm " +
                    "hover:text-gray-300 transition-colors"
                  }
                >
                  {tNav("faq")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className={"text-white font-semibold text-sm mb-4"}>
              {tFs("legal")}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#"
                  className={
                    "text-gray-500 text-sm " +
                    "hover:text-gray-300 transition-colors"
                  }
                >
                  {t("terms")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={
                    "text-gray-500 text-sm " +
                    "hover:text-gray-300 transition-colors"
                  }
                >
                  {t("privacy")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={
                    "text-gray-500 text-sm " +
                    "hover:text-gray-300 transition-colors"
                  }
                >
                  {t("contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div
          className={
            "pt-8 border-t border-white/5 flex flex-col " +
            "md:flex-row items-center justify-between gap-4"
          }
        >
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} BossZap. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
