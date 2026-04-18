"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { ParticleCanvas } from "@/components/shared/particle-canvas";

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const TOTAL_STEPS = 4;

const PLAN_KEYS = ["starter", "pro", "business"] as const;
type PlanKey = (typeof PLAN_KEYS)[number];

export default function RegisterPage() {
  const t = useTranslations("register");
  const tPricing = useTranslations("pricing");
  const searchParams = useSearchParams();
  const initialPlan = (searchParams?.get("plan") as PlanKey) || "pro";
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(
    PLAN_KEYS.includes(initialPlan) ? initialPlan : "pro",
  );
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError("");
  };

  const validateStep1 = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "required";
    if (!form.phone.trim()) e.phone = "required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Partial<FormData> = {};
    if (form.password.length < 8) e.password = "min";
    if (form.password !== form.confirmPassword) e.confirmPassword = "mismatch";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const registerAccount = async () => {
    setStep(4);
    setApiError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          phone: form.phone,
          owner_name: form.name,
          plan: selectedPlan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(
          data?.error?.message || data?.message || "Registration failed",
        );
        setStep(3);
        return;
      }

      // Store tokens
      const tokens = data?.data || data;
      if (tokens.access_token) {
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
      }

      // Redirect to Stripe checkout if URL provided, otherwise dashboard
      if (tokens.checkout_url) {
        window.location.href = tokens.checkout_url;
      } else {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
        window.location.href = `${appUrl}/pt-BR/dashboard`;
      }
    } catch {
      setApiError("Connection error. Please try again.");
      setStep(3);
    }
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3) {
      registerAccount();
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const back = () => setStep((s) => Math.max(s - 1, 1));

  const features = tPricing.raw(`plans.${selectedPlan}.features`) as string[];

  const inputCls = (hasError: boolean) => {
    const border = hasError ? "border-red-500/50" : "border-white/10";
    return (
      "w-full rounded-xl border " +
      border +
      " bg-white/[0.06] py-3 pl-10 pr-4 text-sm text-white " +
      "placeholder:text-white/25 transition-all " +
      "focus:border-emerald-500/60 focus:bg-white/[0.08] " +
      "focus:outline-none focus:ring-2 " +
      "focus:ring-emerald-500/20"
    );
  };

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

        {/* Progress */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 <= step ? "w-10 bg-emerald-500" : "w-10 bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div
          className={
            "rounded-2xl border border-white/[0.08] " +
            "bg-gradient-to-b from-white/[0.07] " +
            "to-white/[0.03] p-6 shadow-2xl " +
            "backdrop-blur-xl sm:p-8"
          }
        >
          <h1 className="text-xl font-bold text-white/90 mb-1">{t("title")}</h1>
          <p className="text-sm text-white/40 mb-6">
            {step <= 3
              ? t(`step${step}` as "step1" | "step2" | "step3")
              : t("step4")}
          </p>

          {apiError && (
            <div
              className={
                "mb-4 rounded-xl border border-red-500/20 " +
                "bg-red-500/10 px-4 py-3 text-sm text-red-400"
              }
            >
              {apiError}
            </div>
          )}

          {/* Step 1: Personal info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>{t("name")}</label>
                <div className="relative">
                  <User className={iconCls} />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={inputCls(!!errors.name)}
                    placeholder={t("name")}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>{t("email")}</label>
                <div className="relative">
                  <Mail className={iconCls} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={inputCls(!!errors.email)}
                    placeholder={t("email")}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>{t("phone")}</label>
                <div className="relative">
                  <Phone className={iconCls} />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className={inputCls(!!errors.phone)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>{t("password")}</label>
                <div className="relative">
                  <Lock className={iconCls} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    className={`${inputCls(!!errors.password)} pr-11`}
                    placeholder={t("passwordHint")}
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
                <p className="mt-1 text-xs text-white/30">
                  {t("passwordHint")}
                </p>
              </div>
              <div>
                <label className={labelCls}>{t("confirmPassword")}</label>
                <div className="relative">
                  <Lock className={iconCls} />
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    className={inputCls(!!errors.confirmPassword)}
                    placeholder={t("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">
                    {t("passwordMismatch")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Plan selection */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {PLAN_KEYS.map((key) => {
                  const isActive = key === selectedPlan;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPlan(key)}
                      className={
                        "rounded-xl border p-3 text-left " +
                        "transition-all " +
                        (isActive
                          ? "border-emerald-500 " + "bg-emerald-500/10"
                          : "border-white/10 " +
                            "bg-white/[0.04] " +
                            "hover:bg-white/[0.08]")
                      }
                    >
                      <div
                        className={
                          "text-[10px] font-bold " +
                          "text-white/50 uppercase tracking-wider"
                        }
                      >
                        {tPricing(`plans.${key}.name`)}
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">
                        {tPricing(`plans.${key}.price`)}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div
                className={
                  "rounded-xl border border-emerald-500/30 " +
                  "bg-emerald-500/5 p-5"
                }
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">
                    {tPricing(`plans.${selectedPlan}.price`)}
                  </span>
                  <span className="text-white/40">{tPricing("period")}</span>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  {tPricing(`plans.${selectedPlan}.tagline`)}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-white/70"
                    >
                      <Check
                        className={
                          "mt-0.5 w-4 h-4 text-emerald-400 " + "flex-shrink-0"
                        }
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-white/30 text-center">
                  {t("trialInfo")}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {step === 4 && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="mt-4 text-white/50">{t("redirectingToPayment")}</p>
            </div>
          )}

          {/* Actions */}
          {step < 4 && (
            <div className="mt-6 flex gap-3">
              {step > 1 && (
                <button
                  onClick={back}
                  className={
                    "flex items-center gap-1 rounded-xl " +
                    "border border-white/10 px-4 py-3 " +
                    "text-sm font-medium text-white/60 " +
                    "transition-colors hover:bg-white/5"
                  }
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("back")}
                </button>
              )}
              <button
                onClick={next}
                className={
                  "group relative flex-1 flex items-center " +
                  "justify-center gap-1 overflow-hidden " +
                  "rounded-xl bg-gradient-to-r " +
                  "from-emerald-500 to-emerald-600 px-4 py-3 " +
                  "text-sm font-semibold text-white shadow-lg " +
                  "shadow-emerald-500/25 transition-all " +
                  "hover:shadow-xl hover:shadow-emerald-500/30 " +
                  "active:scale-[0.98]"
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
                {step === 3 ? t("createAccount") : t("continue")}
                {step < 3 && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Login link */}
          {step < 4 && (
            <p className="mt-6 text-center text-sm text-white/40">
              {t("alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-emerald-400 hover:text-emerald-300"
              >
                {t("login")}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
