"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Download,
  FileText,
  AlertCircle,
  Trash2,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { budgetsService } from "@/services/budgets.service";
import { CreateBudgetModal } from "@/components/forms/create-budget-modal";
import type { Budget, BudgetStatus } from "@/lib/types";

// ── Constants ───────────────────────────────────────────────

const PAGE_SIZE = 20;

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

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `R$ ${(num || 0).toFixed(2).replace(".", ",")}`;
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  const ts = iso.length > 10 ? iso : `${iso}T00:00:00`;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function handleDownload(pdfUrl: string | null): void {
  if (!pdfUrl) return;
  window.open(pdfUrl, "_blank", "noopener");
}

// ── Page ────────────────────────────────────────────────────

export default function DocumentsPage() {
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<DocTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [docToDelete, setDocToDelete] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await budgetsService.getAll({ page, limit: PAGE_SIZE });
      if (res.success) {
        const raw = res.data as any;
        const list = Array.isArray(raw) ? raw : (raw?.budgets ?? []);
        setBudgets(list);
        // Backend returns { budgets, total, page, limit, totalPages }
        const t = Number(raw?.total ?? list.length);
        setTotal(t);
        setTotalPages(
          Number(raw?.totalPages ?? Math.max(1, Math.ceil(t / PAGE_SIZE))),
        );
      } else {
        setError(res.error?.message ?? t("loadError"));
      }
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, page]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Reset to page 1 when filters change so we never land on a phantom page
  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter]);

  const confirmDelete = useCallback(async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      const res = await budgetsService.delete(docToDelete.id);
      if (res.success) {
        setBudgets((prev) => prev.filter((b) => b.id !== docToDelete.id));
        toast.success(t("deleteSuccess"));
        setDocToDelete(null);
      } else {
        toast.error(res.error?.message ?? t("deleteError"));
      }
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setDeleting(false);
    }
  }, [docToDelete, t]);

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
              {tCommon("retry")}
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              {t("createFirstBudget")}
            </button>
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
                      <div className="flex items-center gap-1">
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
                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-red-50 hover:text-red-500"
                          title={t("delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                  <button
                    onClick={() => handleDownload(doc.pdf_url)}
                    disabled={!doc.pdf_url}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium transition-colors",
                      doc.pdf_url
                        ? "text-text-secondary hover:bg-background"
                        : "cursor-not-allowed text-text-muted/40"
                    )}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t("downloadPdf")}
                  </button>
                  <button
                    onClick={() => setDocToDelete(doc)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-text-muted">
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, total)} / {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label={tCommon("previous")}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-text-primary tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label={tCommon("next")}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create-budget modal (used by empty-state CTA) */}
      {showCreateModal && (
        <CreateBudgetModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchDocuments();
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {docToDelete && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => !deleting && setDocToDelete(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">
                      {t("deleteTitle")}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {t("deleteMessage", {
                        doc:
                          docToDelete.document_number ??
                          (docToDelete.client_name ?? ""),
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !deleting && setDocToDelete(null)}
                  className="rounded-lg p-1 text-text-muted hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setDocToDelete(null)}
                  disabled={deleting}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background disabled:opacity-50"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? tCommon("loading") : t("delete")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
