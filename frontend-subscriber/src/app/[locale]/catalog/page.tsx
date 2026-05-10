"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Wrench,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { productsService } from "@/services/products.service";
import type {
  Product,
  ProductType,
  CreateProductPayload,
  UpdateProductPayload,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// ── BRL formatting ───────────────────────────────────────────────────────────
const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);

type Filter = "all" | "product" | "service";

export default function CatalogPage() {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await productsService.list({
      type: filter === "all" ? undefined : filter,
      search: search.trim() || undefined,
      includeInactive: showInactive,
    });
    if (res.success && res.data) {
      setProducts(res.data);
    } else {
      toast.error(res.error?.message ?? t("loadError"));
    }
    setLoading(false);
  }, [filter, search, showInactive, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreate = () => {
    setEditingProduct(null);
    setEditorOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setEditorOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await productsService.remove(productToDelete.id);
      toast.success(t("deleteSuccess"));
      setProductToDelete(null);
      fetchProducts();
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Title + primary action */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("addProduct")}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1 rounded-xl bg-surface p-1">
          {(["all", "product", "service"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-background",
              )}
            >
              {f === "all"
                ? t("filterAll")
                : f === "product"
                  ? t("filterProducts")
                  : t("filterServices")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-border bg-surface px-9 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            {t("showInactive")}
          </label>
        </div>
      </div>

      {/* List */}
      <div className="mt-6 rounded-2xl border border-border/60 bg-surface">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-border/30"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <Package className="h-10 w-10 text-text-muted" />
            <p className="mt-3 text-sm font-medium text-text-primary">
              {t("noProducts")}
            </p>
            <p className="mt-1 max-w-sm text-xs text-text-secondary">
              {t("noProductsHint")}
            </p>
            <button
              onClick={openCreate}
              className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              {t("addProduct")}
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {products.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background/40",
                  !p.is_active && "opacity-50",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {p.type === "service" ? (
                    <Wrench className="h-5 w-5" />
                  ) : (
                    <Package className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {p.name}
                    </span>
                    {!p.is_active && (
                      <span className="rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-medium text-text-muted">
                        {t("inactive")}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="mt-0.5 truncate text-xs text-text-secondary">
                      {p.description}
                    </p>
                  )}
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-muted">
                    <span>{p.unit}</span>
                    {p.sku && <span>· {p.sku}</span>}
                    {p.type === "product" && p.stock !== null && (
                      <span>
                        · {t("stock")}: {p.stock}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-text-primary">
                    {fmtBRL(Number(p.price))}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-background hover:text-text-primary"
                    aria-label={t("editProduct")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setProductToDelete(p)}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label={tCommon("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Editor modal */}
      {editorOpen && (
        <ProductEditor
          product={editingProduct}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false);
            fetchProducts();
          }}
        />
      )}

      {/* Delete confirm */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface shadow-xl">
            <div className="px-6 pt-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-center text-base font-semibold text-text-primary">
                {t("deleteConfirmTitle")}
              </h3>
              <p className="mt-2 text-center text-sm text-text-secondary">
                {t("deleteConfirmMessage")}
              </p>
              <p className="mt-3 text-center text-sm font-medium text-text-primary">
                {productToDelete.name}
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4">
              <button
                onClick={() => setProductToDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-background disabled:opacity-60"
              >
                {tCommon("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-danger py-2.5 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:opacity-60"
              >
                {deleting ? tCommon("saving") : tCommon("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Editor modal ────────────────────────────────────────────────────────────

type EditorProps = {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
};

function ProductEditor({ product, onClose, onSaved }: EditorProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [price, setPrice] = useState<string>(
    product ? String(product.price) : "",
  );
  const [type, setType] = useState<ProductType>(product?.type ?? "product");
  const [unit, setUnit] = useState(product?.unit ?? "un");
  const [stock, setStock] = useState<string>(
    product?.stock != null ? String(product.stock) : "",
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const priceNum = parseFloat(price.replace(",", ".")) || 0;
    if (priceNum < 0) return;

    setSaving(true);
    setError("");

    const stockNum =
      type === "service" || stock === ""
        ? undefined
        : Math.max(0, parseInt(stock, 10) || 0);

    try {
      if (isEdit && product) {
        const payload: UpdateProductPayload = {
          name: name.trim(),
          description: description.trim() || undefined,
          sku: sku.trim() || undefined,
          price: priceNum,
          type,
          unit: unit.trim() || "un",
          stock: stockNum,
          is_active: isActive,
        };
        const res = await productsService.update(product.id, payload);
        if (!res.success) {
          setError(res.error?.message ?? t("saveError"));
          return;
        }
        toast.success(t("updateSuccess"));
      } else {
        const payload: CreateProductPayload = {
          name: name.trim(),
          description: description.trim() || undefined,
          sku: sku.trim() || undefined,
          price: priceNum,
          type,
          unit: unit.trim() || "un",
          stock: stockNum,
        };
        const res = await productsService.create(payload);
        if (!res.success) {
          setError(res.error?.message ?? t("saveError"));
          return;
        }
        toast.success(t("createSuccess"));
      }
      onSaved();
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h2 className="text-base font-semibold text-text-primary">
            {isEdit ? t("editProduct") : t("addProduct")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-background"
            aria-label={tCommon("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              {t("name")} *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              {t("type")} *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["product", "service"] as const).map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setType(opt)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    type === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-text-secondary hover:bg-background",
                  )}
                >
                  {opt === "product" ? (
                    <Package className="h-4 w-4" />
                  ) : (
                    <Wrench className="h-4 w-4" />
                  )}
                  {opt === "product" ? t("typeProduct") : t("typeService")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                {t("price")} *
              </label>
              <input
                required
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t("pricePlaceholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                {t("unit")}
              </label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={t("unitPlaceholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {type === "product" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                {t("stock")}
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-text-muted">
                {t("stockHint")}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              {t("sku")}
            </label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder={t("skuPlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              {t("description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={t("descriptionPlaceholder")}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              {t("active")}
            </label>
          )}

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-background disabled:opacity-60"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {saving ? tCommon("saving") : tCommon("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
