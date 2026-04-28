"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { financialService } from "@/services/financial.service";
import { categoriesService } from "@/services/categories.service";
import type { FinancialRecordType, SubscriberCategory } from "@/lib/types";

type Props = {
  type: FinancialRecordType;
  onClose: () => void;
  onSuccess: () => void;
};

const DEFAULT_CATEGORIES: Record<FinancialRecordType, string[]> = {
  expense: ["materials", "labor", "transport", "food", "tools", "other"],
  income: ["service", "product", "tip", "other"],
};

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function FinancialRecordModal({ type, onClose, onSuccess }: Props) {
  const t = useTranslations("financialModal");
  const tFin = useTranslations("financial");
  const tCommon = useTranslations("common");

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [recordDate, setRecordDate] = useState(todayISO());
  const [referencePerson, setReferencePerson] = useState("");
  const [customCategories, setCustomCategories] = useState<SubscriberCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load custom categories filtered by type (or 'both')
  useEffect(() => {
    let cancelled = false;
    categoriesService
      .list()
      .then((res) => {
        if (cancelled) return;
        const all = (res.data ?? []) as SubscriberCategory[];
        const filtered = all.filter(
          (c) => c.is_active && (c.type === type || c.type === "both"),
        );
        setCustomCategories(filtered);
      })
      .catch(() => {
        // Silent — fall back to defaults only
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  // ESC closes the modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const parsedAmount = parseFloat(amount.replace(",", "."));
  const isValid = Number.isFinite(parsedAmount) && parsedAmount > 0 && !!recordDate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await financialService.createRecord({
        type,
        amount: parsedAmount,
        description: description.trim() || undefined,
        category: category || undefined,
        reference_person: referencePerson.trim() || undefined,
        record_date: recordDate,
      });
      toast.success(t(type === "income" ? "incomeSuccess" : "expenseSuccess"));
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = type === "income" ? ArrowUpCircle : ArrowDownCircle;
  const accentColor = type === "income" ? "text-success" : "text-danger";
  const submitColor =
    type === "income"
      ? "bg-success hover:bg-success/90"
      : "bg-danger hover:bg-danger/90";
  const titleKey = type === "income" ? "incomeTitle" : "expenseTitle";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-5 w-5", accentColor)} />
              <h2 className="text-base font-semibold text-text-primary">
                {t(titleKey)}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-text-secondary hover:bg-background"
              aria-label={tCommon("close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 p-5">
            {/* Amount */}
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                {t("amount")} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^\d.,]/g, ""))
                  }
                  placeholder="0,00"
                  autoFocus
                  className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-base text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                {t("date")} <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                {t("category")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t("selectCategory")}</option>
                {customCategories.length > 0 && (
                  <optgroup label={t("yourCategories")}>
                    {customCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label={t("defaultCategories")}>
                  {DEFAULT_CATEGORIES[type].map((key) => (
                    <option key={key} value={key}>
                      {tFin(`categories.${key}` as never) || key}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                {t("description")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={t("descriptionPlaceholder")}
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Reference person */}
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                {t("referencePerson")}
              </label>
              <input
                type="text"
                value={referencePerson}
                onChange={(e) => setReferencePerson(e.target.value)}
                placeholder={t("referencePlaceholder")}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-background disabled:opacity-50"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50",
                submitColor,
              )}
            >
              {submitting ? t("saving") : tCommon("save")}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
