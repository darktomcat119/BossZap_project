"use client";

import { useEffect } from "react";

/**
 * Receives tokens from a cross-origin redirect (e.g. the landing login
 * page on bosszap.com.br) via the URL fragment, persists them to this
 * app's own localStorage, and bounces to the final destination.
 *
 * Fragments are never sent to the server, so access tokens don't end
 * up in nginx access logs or referrer headers.
 *
 * Expected hash shape:
 *   #access_token=...&refresh_token=...&next=/pt-BR/dashboard
 */
export default function AuthBridgePage() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawHash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(rawHash);
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    const next = params.get("next") || "/pt-BR/dashboard";

    if (access) {
      localStorage.setItem("access_token", access);
    }
    if (refresh) {
      localStorage.setItem("refresh_token", refresh);
    }

    // Clean hash from URL before navigating so tokens aren't in history
    window.history.replaceState(null, "", window.location.pathname);
    window.location.replace(next);
  }, []);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-text-secondary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm">Carregando…</p>
      </div>
    </div>
  );
}
