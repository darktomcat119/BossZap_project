"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  X,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Check,
  Ban,
  Loader2,
  AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { eventsService } from "@/services/events.service";
import type { CalendarEvent } from "@/lib/types";
import { STATUS_PALETTE, relativeDayLabel } from "./utils";

type Props = {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
  onChanged: (event?: CalendarEvent) => void;
  onDeleted: () => void;
};

type Pending = "complete" | "cancel" | "delete" | null;

export function EventDetailDrawer({
  event,
  onClose,
  onEdit,
  onChanged,
  onDeleted,
}: Props) {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const [pending, setPending] = useState<Pending>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const palette = STATUS_PALETTE[event.status];

  const handleComplete = async () => {
    setPending("complete");
    setError(null);
    const res = await eventsService.complete(event.id);
    setPending(null);
    if (res.success) onChanged(res.data);
    else setError(res.error?.message ?? t("actionError"));
  };

  const handleCancel = async () => {
    setPending("cancel");
    setError(null);
    const res = await eventsService.cancel(event.id);
    setPending(null);
    if (res.success) onChanged(res.data);
    else setError(res.error?.message ?? t("actionError"));
  };

  const handleDelete = async () => {
    setPending("delete");
    setError(null);
    const res = await eventsService.remove(event.id);
    setPending(null);
    if (res.success) onDeleted();
    else setError(res.error?.message ?? t("actionError"));
  };

  const dateLabel = relativeDayLabel(event.event_date.slice(0, 10), new Date(), {
    today: t("today"),
    tomorrow: t("tomorrow"),
    yesterday: t("yesterday"),
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-surface shadow-2xl">
        <div className="flex items-start justify-between border-b border-border/60 px-5 py-4">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", palette.dot)} />
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  palette.chip,
                )}
              >
                {t(event.status)}
              </span>
            </div>
            <h2 className="mt-2 break-words text-lg font-semibold leading-tight text-text-primary">
              {event.title}
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">{dateLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-background"
            aria-label={tCommon("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {event.event_time && (
            <Row icon={<Clock className="h-4 w-4" />}>
              {event.event_time.slice(0, 5)}
            </Row>
          )}
          {event.location && (
            <Row icon={<MapPin className="h-4 w-4" />}>{event.location}</Row>
          )}
          {event.description && (
            <Row icon={<AlignLeft className="h-4 w-4" />}>
              <p className="whitespace-pre-wrap text-sm text-text-primary">
                {event.description}
              </p>
            </Row>
          )}

          {!event.event_time && !event.location && !event.description && (
            <p className="text-sm text-text-muted">{t("noExtraDetails")}</p>
          )}

          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 bg-background/40 px-5 py-3">
          {confirmingDelete ? (
            <div className="space-y-2">
              <p className="text-sm text-text-primary">
                {t("deleteConfirmMessage")}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  disabled={pending !== null}
                  className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={pending !== null}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-danger py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:opacity-60"
                >
                  {pending === "delete" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {tCommon("delete")}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                onClick={onEdit}
                disabled={pending !== null}
                icon={<Pencil className="h-4 w-4" />}
              >
                {tCommon("edit")}
              </ActionButton>
              {event.status === "scheduled" ? (
                <ActionButton
                  onClick={handleComplete}
                  disabled={pending !== null}
                  loading={pending === "complete"}
                  variant="success"
                  icon={<Check className="h-4 w-4" />}
                >
                  {t("markComplete")}
                </ActionButton>
              ) : (
                <ActionButton
                  onClick={() => setConfirmingDelete(true)}
                  disabled={pending !== null}
                  variant="danger"
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  {tCommon("delete")}
                </ActionButton>
              )}
              {event.status === "scheduled" && (
                <>
                  <ActionButton
                    onClick={handleCancel}
                    disabled={pending !== null}
                    loading={pending === "cancel"}
                    icon={<Ban className="h-4 w-4" />}
                  >
                    {t("cancelEvent")}
                  </ActionButton>
                  <ActionButton
                    onClick={() => setConfirmingDelete(true)}
                    disabled={pending !== null}
                    variant="danger"
                    icon={<Trash2 className="h-4 w-4" />}
                  >
                    {tCommon("delete")}
                  </ActionButton>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-text-muted">{icon}</span>
      <div className="min-w-0 flex-1 text-sm text-text-primary">{children}</div>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  loading,
  icon,
  children,
  variant = "default",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "success" | "danger";
}) {
  const variantClasses = {
    default:
      "border border-border text-text-secondary hover:bg-background hover:text-text-primary",
    success: "bg-success text-white hover:bg-success/90",
    danger: "bg-danger text-white hover:bg-danger/90",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-60",
        variantClasses,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
