"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Zap, Loader2 } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // In production: call auth API, then redirect
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!res.ok) {
        setError("Invalid email or password");
        return;
      }

      const data = await res.json();
      localStorage.setItem(
        "access_token",
        data.data.accessToken,
      );
      localStorage.setItem(
        "refresh_token",
        data.data.refreshToken,
      );

      // Redirect to subscriber dashboard
      window.location.href =
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3001";
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Zap className="w-7 h-7 text-primary" />
        <span className="text-2xl font-bold text-text-primary">
          BossZap
        </span>
      </Link>

      <div className="w-full max-w-md bg-surface rounded-2xl shadow-lg p-6 md:p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          {t("login")}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              {t("email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              {t("password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {t("login")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          {t("alreadyHaveAccount").replace("?", "")}{" "}
          <Link
            href="/register"
            className="text-primary font-medium hover:underline"
          >
            {t("createAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
}
