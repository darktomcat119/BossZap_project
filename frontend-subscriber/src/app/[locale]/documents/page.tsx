"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Download, FileText, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock data ──────────────────────────────────────────────
type Document = {
  id: number;
  docNumber: string;
  type: "budget" | "service_order";
  client: string;
  amount: number;
  status: "draft" | "sent" | "approved" | "rejected";
  date: string;
};

const mockDocuments: Document[] = [
  { id: 1, docNumber: "BUD-001", type: "budget", client: "Silva Corp", amount: 5000, status: "approved", date: "2026-03-20" },
  { id: 2, docNumber: "SO-001", type: "service_order", client: "Silva Corp", amount: 5000, status: "approved", date: "2026-03-21" },
  { id: 3, docNumber: "BUD-002", type: "budget", client: "Bakery Plus", amount: 1200, status: "sent", date: "2026-03-18" },
  { id: 4, docNumber: "BUD-003", type: "budget", client: "Tech Solutions", amount: 8500, status: "draft", date: "2026-03-15" },
  { id: 5, docNumber: "SO-002", type: "service_order", client: "Gym Fit", amount: 2400, status: "approved", date: "2026-03-12" },
  { id: 6, docNumber: "BUD-004", type: "budget", client: "Maria Santos", amount: 900, status: "rejected", date: "2026-03-10" },
  { id: 7, docNumber: "SO-003", type: "service_order", client: "Bakery Plus", amount: 1200, status: "sent", date: "2026-03-08" },
];

const TYPE_BADGE: Record<string, string> = {
  budget: "bg-info/10 text-info",
  service_order: "bg-secondary/10 text-secondary",
};

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-text-muted/10 text-text-muted",
  sent: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
};

export default function DocumentsPage() {
  const t = useTranslations("documents");
  const [typeFilter, setTypeFilter] = useState<"all" | "budget" | "service_order">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "sent" | "approved" | "rejected">("all");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const filtered = useMemo(() => {
    return mockDocuments.filter((doc) => {
      if (typeFilter !== "all" && doc.type !== typeFilter) return false;
      if (statusFilter !== "all" && doc.status !== statusFilter) return false;
      return true;
    });
  }, [typeFilter, statusFilter]);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
          {t("title")}
        </h1>

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t("allTypes")}</option>
            <option value="budget">{t("budget")}</option>
            <option value="service_order">{t("serviceOrder")}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t("allStatuses")}</option>
            <option value="draft">{t("draft")}</option>
            <option value="sent">{t("sent")}</option>
            <option value="approved">{t("approved")}</option>
            <option value="rejected">{t("rejected")}</option>
          </select>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
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
        {filtered.length > 0 && (
          <div className="mt-6 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="px-3 py-3 font-medium">{t("docNumber")}</th>
                  <th className="px-3 py-3 font-medium">{t("type")}</th>
                  <th className="px-3 py-3 font-medium">{t("client")}</th>
                  <th className="px-3 py-3 text-right font-medium">{t("amount")}</th>
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
                      {doc.docNumber}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          TYPE_BADGE[doc.type]
                        )}
                      >
                        {t(doc.type)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-text-primary">{doc.client}</td>
                    <td className="px-3 py-3 text-right font-semibold text-text-primary">
                      R$ {doc.amount.toFixed(2).replace(".", ",")}
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
                    <td className="px-3 py-3 text-text-secondary">{doc.date}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-background hover:text-primary"
                          title={t("preview")}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-background hover:text-primary"
                          title={t("download")}
                        >
                          <Download className="h-4 w-4" />
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
        {filtered.length > 0 && (
          <div className="mt-6 space-y-3 md:hidden">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">
                    {doc.docNumber}
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
                      TYPE_BADGE[doc.type]
                    )}
                  >
                    {t(doc.type)}
                  </span>
                  <span className="text-sm text-text-secondary">{doc.client}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-bold text-text-primary">
                    R$ {doc.amount.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-xs text-text-muted">{doc.date}</span>
                </div>
                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-background"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t("preview")}
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-background">
                    <Download className="h-3.5 w-3.5" />
                    {t("download")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview dialog */}
        {previewDoc && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setPreviewDoc(null)}
              aria-hidden="true"
            />
            <div className="fixed inset-4 z-50 mx-auto flex max-w-lg flex-col rounded-2xl bg-surface p-6 shadow-xl md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">
                  {previewDoc.docNumber}
                </h3>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg p-1.5 text-text-secondary hover:bg-background"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t("type")}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      TYPE_BADGE[previewDoc.type]
                    )}
                  >
                    {t(previewDoc.type)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t("client")}</span>
                  <span className="font-medium text-text-primary">{previewDoc.client}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t("amount")}</span>
                  <span className="font-semibold text-text-primary">
                    R$ {previewDoc.amount.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t("status")}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_BADGE[previewDoc.status]
                    )}
                  >
                    {t(previewDoc.status)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t("date")}</span>
                  <span className="text-text-primary">{previewDoc.date}</span>
                </div>
              </div>
              <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark">
                <Download className="h-4 w-4" />
                {t("download")}
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
