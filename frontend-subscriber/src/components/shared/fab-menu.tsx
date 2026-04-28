"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FabAction = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

type FabMenuProps = {
  actions: FabAction[];
};

export function FabMenu({ actions }: FabMenuProps) {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3 md:hidden">
      {/* Action buttons */}
      {actions.map((action, idx) => (
        <div
          key={idx}
          className={cn(
            "flex items-center gap-2 transition-all duration-200",
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          )}
          style={{ transitionDelay: open ? `${idx * 50}ms` : "0ms" }}
        >
          <span className="rounded-lg bg-surface px-3 py-1.5 text-sm font-medium text-text-primary shadow-md">
            {action.label}
          </span>
          <button
            onClick={() => {
              action.onClick();
              setOpen(false);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-dark"
          >
            <action.icon className="h-5 w-5" />
          </button>
        </div>
      ))}

      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-200 hover:bg-primary-dark",
          open && "rotate-45"
        )}
        aria-label={t("quickActions")}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 -z-10 bg-black/20"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
