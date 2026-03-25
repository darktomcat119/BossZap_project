"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Zap, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const TOTAL_STEPS = 4;

export default function RegisterPage() {
  const t = useTranslations("register");
  const tPricing = useTranslations("pricing");
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Partial<FormData>>({});
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
  };

  const validateStep1 = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "required";
    if (!form.email.trim() || !form.email.includes("@"))
      e.email = "required";
    if (!form.phone.trim()) e.phone = "required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Partial<FormData> = {};
    if (form.password.length < 8) e.password = "min";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "mismatch";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3) {
      setStep(4);
      // In production: call API to create account + Stripe checkout
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const back = () => setStep((s) => Math.max(s - 1, 1));

  const features = tPricing.raw("plan.features") as string[];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 mb-8"
      >
        <Zap className="w-7 h-7 text-primary" />
        <span className="text-2xl font-bold text-text-primary">
          BossZap
        </span>
      </Link>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i + 1 <= step
                ? "w-10 bg-primary"
                : "w-10 bg-border"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-lg p-6 md:p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {step <= 3
            ? t(`step${step}` as "step1" | "step2" | "step3")
            : t("step4")}
        </p>

        {/* Step 1: Personal info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {t("name")}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.name
                    ? "border-danger"
                    : "border-border"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {t("email")}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  update("email", e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.email
                    ? "border-danger"
                    : "border-border"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {t("phone")}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  update("phone", e.target.value)
                }
                placeholder="+55 11 99999-9999"
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.phone
                    ? "border-danger"
                    : "border-border"
                }`}
              />
            </div>
          </div>
        )}

        {/* Step 2: Password */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {t("password")}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  update("password", e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.password
                    ? "border-danger"
                    : "border-border"
                }`}
              />
              <p className="mt-1 text-xs text-text-muted">
                {t("passwordHint")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {t("confirmPassword")}
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  update("confirmPassword", e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.confirmPassword
                    ? "border-danger"
                    : "border-border"
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-danger">
                  {t("passwordMismatch")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Plan selection */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="border-2 border-primary rounded-xl p-5">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-text-primary">
                  {tPricing("plan.price")}
                </span>
                <span className="text-text-muted">
                  {tPricing("plan.period")}
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {features.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-text-primary"
                  >
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-text-muted text-center">
                {t("trialInfo")}
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Redirecting */}
        {step === 4 && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="mt-4 text-text-secondary">
              {t("redirectingToPayment")}
            </p>
          </div>
        )}

        {/* Actions */}
        {step < 4 && (
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button
                onClick={back}
                className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-background transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("back")}
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 flex items-center justify-center gap-1 px-4 py-3 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {step === 3 ? t("createAccount") : t("continue")}
              {step < 3 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Login link */}
        {step < 4 && (
          <p className="mt-6 text-center text-sm text-text-muted">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              {t("login")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
