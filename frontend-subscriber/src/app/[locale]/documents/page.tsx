"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Download, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { budgetsService } from "@/services/budgets.service";
import type { Budget, BudgetStatus } from "@/lib/types";

// ── Constants ───────────────────────────────────────────────

type DocTypeFilter = "all" | "budget" | "service_order";
type StatusFilter = "all" | BudgetStatus;

const STATUS_BADGE: Record<BudgetStatus, string> = {
  draft: "bg-gray-500/10 text-gray-500",
  sent: "bg-blue-500/10 text-blue-500",
  accepted: "bg-green-500/10 text-green-500",
  rejected: "bg-red-500/10 text-red-500",
};

const TYPE_BADGE: Record<string, string> = {
  budget: "bg-info/10 text-info",
  service_order: "bg-secondary/10 text-secondary",
};

// ── Skeleton rows ───────────────────────────────────────────

function SkeletonTable() {
  return (
    <div className="mt-6 hidden md:block">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-3 py-3">
            <div className="h-4 w-20 animate-pulse rounded bg-border" />
            <div className="h-4 w-16 animate-pulse rounded bg-border" />
            <div className="h-4 w-28 animate-pulse rounded bg-border" />
            <div className="ml-auto h-4 w-20 animate-pulse rounded bg-border" />
            <div className="h-4 w-16 animate-pulse rounded bg-border" />
            <div className="h-4 w-20 animate-pulse rounded bg-border" />
            <div className="h-4 w-10 animate-pulse rounded bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="mt-6 space-y-3 md:hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-border" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-border" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-5 w-16 animate-pulse rounded-full bg-border" />
            <div className="h-4 w-28 animate-pulse rounded bg-border" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="h-5 w-24 animate-pulse rounded bg-border" />
            <div className="h-4 w-20 animate-pulse rounded bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `R$ ${amount.toFixed(2).replace(".", ",")}`;
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function handleDownload(pdfUrl: string | null): void {
  if (!pdfUrl) return;
  window.open(pdfUrl, "_blank", "noopener");
}

// ── Page ────────────────────────────────────────────────────

export default function DocumentsPage() {
  const t = useTranslations("documents");

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<DocTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await budgetsService.getAll({ page: 1, limit: 20 });
      if (res.success) {
        setBudgets(res.data);
      } else {
        setError(res.error?.message ?? t("loadError"));
      }
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filtered = useMemo(() => {
    return budgets.filter((doc) => {
      if (typeFilter !== "all" && doc.document_type !== typeFilter) return false;
      if (statusFilter !== "all" && doc.status !== statusFilter) return false;
      return true;
    });
  }, [budgets, typeFilter, statusFilter]);

  // ── Render ──────────────────────────────────────────────

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
          {t("title")}
        </h1>

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DocTypeFilter)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t("allTypes")}</option>
            <option value="budget">{t("budget")}</option>
            <option value="service_order">{t("serviceOrder")}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t("allStatuses")}</option>
            <option value="draft">{t("draft")}</option>
            <option value="sent">{t("sent")}</option>
            <option value="accepted">{t("accepted")}</option>
            <option value="rejected">{t("rejected")}</option>
          </select>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <>
            <SkeletonTable />
            <SkeletonCards />
          </>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
              <AlertCircle className="h-8 w-8 text-danger" />
            </div>
            <p className="mt-4 text-base font-medium text-text-secondary">
              {error}
            </p>
            <button
              onClick={fetchDocuments}
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              {t("loadError")}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background">
              <FileText className="h-8 w-8 text-text-muted" />
            </div>
            <p className="mt-4 text-base font-medium text-text-secondary">
              {t("noDocuments")}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {t("noDocumentsHint")}
            </p>
          </div>
        )}

        {/* Desktop table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="mt-6 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="px-3 py-3 font-medium">{t("docNumber")}</th>
                  <th className="px-3 py-3 font-medium">{t("type")}</th>
                  <th className="px-3 py-3 font-medium">{t("client")}</th>
                  <th className="px-3 py-3 text-right font-medium">
                    {t("amount")}
                  </th>
                  <th className="px-3 py-3 font-medium">{t("status")}</th>
                  <th className="px-3 py-3 font-medium">{t("date")}</th>
                  <th className="px-3 py-3 font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-border transition-colors hover:bg-background"
                  >
                    <td className="px-3 py-3 font-medium text-text-primary">
                      {doc.document_number ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          TYPE_BADGE[doc.document_type] ?? TYPE_BADGE.budget
                        )}
                      >
                        {doc.document_type === "service_order"
                          ? t("serviceOrder")
                          : t("budget")}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-text-primary">
                      {doc.client_name ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-text-primary">
                      {formatCurrency(doc.total_amount)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          STATUS_BADGE[doc.status]
                        )}
                      >
                        {t(doc.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-text-secondary">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleDownload(doc.pdf_url)}
                        disabled={!doc.pdf_url}
                        className={cn(
                          "rounded-lg p-1.5 transition-colors",
                          doc.pdf_url
                            ? "text-text-secondary hover:bg-background hover:text-primary"
                            : "cursor-not-allowed text-text-muted/40"
                        )}
                        title={t("downloadPdf")}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile card layout */}
        {!loading && !error && filtered.length > 0 && (
          <div className="mt-6 space-y-3 md:hidden">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">
                    {doc.document_number ?? "—"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_BADGE[doc.status]
                    )}
                  >
                    {t(doc.status)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      TYPE_BADGE[doc.document_type] ?? TYPE_BADGE.budget
                    )}
                  >
                    {doc.document_type === "service_order"
                      ? t("serviceOrder")
                      : t("budget")}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {doc.client_name ?? "—"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-bold text-text-primary">
                    {formatCurrency(doc.total_amount)}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatDate(doc.created_at)}
                  </span>
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <button
                    onClick={() => handleDownload(doc.pdf_url)}
                    disabled={!doc.pdf_url}
                    className={cn(
                      "flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium transition-colors",
                      doc.pdf_url
                        ? "text-text-secondary hover:bg-background"
                        : "cursor-not-allowed text-text-muted/40"
                    )}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t("downloadPdf")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
