"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { ParticleCanvas } from "@/components/shared/particle-canvas";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginPage() {
  const t = useTranslations("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data?.error?.message || data?.message || "Invalid email or password",
        );
        return;
      }

      const tokens = data?.data || data;
      if (tokens.access_token) {
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
      }

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
      window.location.href = `${appUrl}/pt-BR/dashboard`;
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 " +
    "bg-white/[0.06] py-3 pl-10 pr-4 text-sm text-white " +
    "placeholder:text-white/25 transition-all " +
    "focus:border-emerald-500/60 focus:bg-white/[0.08] " +
    "focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  const iconCls =
    "pointer-events-none absolute left-3.5 top-1/2 " +
    "h-4 w-4 -translate-y-1/2 text-white/25";

  const labelCls = "mb-1.5 block text-sm font-medium text-white/50";

  return (
    <div
      className={
        "relative flex min-h-screen flex-col items-center " +
        "justify-center overflow-hidden bg-gradient-to-br " +
        "from-[#0f1628] via-[#1a1f36] to-[#12182e] px-4 py-8"
      }
    >
      <ParticleCanvas
        particleCount={50}
        color="0, 212, 170"
        maxDistance={130}
        speed={0.2}
      />

      <div className="relative z-10 w-full max-w-full sm:max-w-[420px]">
        {/* Logo */}
        <Link href="/" className="mb-6 flex justify-center">
          <div className="relative">
            <div
              className={
                "absolute -inset-4 m-auto h-32 w-32 " +
                "rounded-full bg-white/15 blur-[60px]"
              }
            />
            <Image
              src="/bosszap_logo.png"
              alt="BossZap"
              width={160}
              height={168}
              className={
                "relative h-32 w-auto " +
                "drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              }
            />
          </div>
        </Link>

        {/* Card */}
        <div
          className={
            "rounded-2xl border border-white/[0.08] " +
            "bg-gradient-to-b from-white/[0.07] " +
            "to-white/[0.03] p-6 shadow-2xl " +
            "backdrop-blur-xl sm:p-8"
          }
        >
          <h1 className="text-xl font-bold text-white/90 mb-1">
            {t("login")}
          </h1>
          <p className="text-sm text-white/40 mb-6">
            {t("dontHaveAccount")}{" "}
            <Link
              href="/register"
              className="font-medium text-emerald-400 hover:text-emerald-300"
            >
              {t("createAccount")}
            </Link>
          </p>

          {error && (
            <div
              className={
                "mb-4 rounded-xl border border-red-500/20 " +
                "bg-red-500/10 px-4 py-3 text-sm text-red-400"
              }
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>{t("email")}</label>
              <div className="relative">
                <Mail className={iconCls} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t("email")}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>{t("password")}</label>
              <div className="relative">
                <Lock className={iconCls} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t("password")}
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={
                    "absolute right-3 top-1/2 " +
                    "-translate-y-1/2 text-white/25 " +
                    "hover:text-white/50"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={
                "group relative flex w-full items-center " +
                "justify-center gap-1 overflow-hidden " +
                "rounded-xl bg-gradient-to-r " +
                "from-emerald-500 to-emerald-600 px-4 py-3 " +
                "text-sm font-semibold text-white shadow-lg " +
                "shadow-emerald-500/25 transition-all " +
                "hover:shadow-xl hover:shadow-emerald-500/30 " +
                "active:scale-[0.98] disabled:opacity-60"
              }
            >
              <span
                className={
                  "absolute inset-0 bg-gradient-to-r " +
                  "from-white/0 via-white/10 to-white/0 " +
                  "opacity-0 transition-opacity " +
                  "group-hover:opacity-100"
                }
              />
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t("login")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
