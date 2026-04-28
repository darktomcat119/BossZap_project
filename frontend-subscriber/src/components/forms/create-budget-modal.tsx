"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { budgetsService } from "@/services/budgets.service";
import type { BudgetItem } from "@/lib/types";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

type DraftItem = {
  description: string;
  quantity: string;
  unit_price: string;
};

const EMPTY_ITEM: DraftItem = { description: "", quantity: "1", unit_price: "" };

function todayPlusDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function parseNumber(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function CreateBudgetModal({ onClose, onSuccess }: Props) {
  const t = useTranslations("budgetModal");
  const tCommon = useTranslations("common");

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ ...EMPTY_ITEM }]);
  const [discount, setDiscount] = useState("");
  const [validUntil, setValidUntil] = useState(todayPlusDaysISO(7));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Computed totals
  const subtotal = items.reduce((sum, it) => {
    const qty = parseNumber(it.quantity);
    const price = parseNumber(it.unit_price);
    return sum + qty * price;
  }, 0);
  const discountValue = parseNumber(discount);
  const total = Math.max(0, subtotal - discountValue);

  const updateItem = (idx: number, patch: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const validItems = items.filter(
    (it) =>
      it.description.trim() &&
      parseNumber(it.quantity) > 0 &&
      parseNumber(it.unit_price) > 0,
  );
  const isValid = clientName.trim().length > 0 && validItems.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const payloadItems: BudgetItem[] = validItems.map((it) => {
        const quantity = parseNumber(it.quantity);
        const unit_price = parseNumber(it.unit_price);
        return {
          description: it.description.trim(),
          quantity,
          unit_price,
          total: quantity * unit_price,
        };
      });

      const payload: Record<string, unknown> = {
        document_type: "budget",
        client_name: clientName.trim(),
        items: payloadItems,
        valid_until: validUntil || undefined,
      };
      if (clientPhone.trim()) payload.client_phone = clientPhone.trim();
      if (clientEmail.trim()) payload.client_email = clientEmail.trim();
      if (description.trim()) payload.description = description.trim();
      if (notes.trim()) payload.notes = notes.trim();
      if (discountValue > 0) payload.discount_amount = discountValue;

      const res = await budgetsService.create(payload as never);
      const created = res.data;

      // Try to generate the PDF immediately so the user has the link.
      if (created?.id) {
        try {
          await budgetsService.generatePdf(created.id);
        } catch {
          // Non-fatal — the budget exists, PDF can be regenerated from /documents
        }
      }

      toast.success(t("createSuccess"));
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-text-primary">
                {t("title")}
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
          <div className="space-y-5 p-5">
            {/* Client section */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-text-primary">
                {t("clientSection")}
              </legend>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  {t("clientName")} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    {t("clientPhone")}
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    {t("clientEmail")}
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </fieldset>

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

            {/* Items */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-text-primary">
                {t("items")} <span className="text-danger">*</span>
              </legend>
              <div className="space-y-2">
                {items.map((it, idx) => {
                  const lineTotal =
                    parseNumber(it.quantity) * parseNumber(it.unit_price);
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 rounded-lg border border-border bg-background p-2"
                    >
                      <div className="col-span-12 sm:col-span-6">
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) =>
                            updateItem(idx, { description: e.target.value })
                          }
                          placeholder={t("itemDescription")}
                          className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(idx, {
                              quantity: e.target.value.replace(/[^\d.,]/g, ""),
                            })
                          }
                          placeholder={t("qty")}
                          className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="col-span-5 sm:col-span-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={it.unit_price}
                          onChange={(e) =>
                            updateItem(idx, {
                              unit_price: e.target.value.replace(/[^\d.,]/g, ""),
                            })
                          }
                          placeholder="0,00"
                          className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-right text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-1 flex items-center justify-end pr-1 text-xs font-medium text-text-secondary">
                        {formatBRL(lineTotal)}
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                          className="rounded-lg p-1 text-text-secondary hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                          aria-label={tCommon("delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-primary hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("addItem")}
              </button>
            </fieldset>

            {/* Discount + valid_until */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  {t("discount")}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(e.target.value.replace(/[^\d.,]/g, ""))
                    }
                    placeholder="0,00"
                    className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  {t("validUntil")}
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                {t("notes")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t("notesPlaceholder")}
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Totals */}
            <div className="rounded-lg bg-background p-3 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>{t("subtotal")}</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              {discountValue > 0 && (
                <div className="mt-1 flex justify-between text-text-secondary">
                  <span>{t("discount")}</span>
                  <span>− {formatBRL(discountValue)}</span>
                </div>
              )}
              <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
                <span className="font-semibold text-text-primary">
                  {t("total")}
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatBRL(total)}
                </span>
              </div>
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
                "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50",
              )}
            >
              {submitting ? t("creating") : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
