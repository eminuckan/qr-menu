"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft01Icon, Cancel01Icon, Check, PencilEdit01Icon } from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HugeIcon, type HugeIconElement } from "@/components/ui/huge-icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

function toneToBadge(tone: Tone) {
  switch (tone) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "danger":
      return "destructive";
    case "info":
      return "accent";
    default:
      return "outline";
  }
}

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  onTitleChange,
  editable = false,
  meta,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  onTitleChange?: (next: string) => Promise<void> | void;
  editable?: boolean;
  meta?: React.ReactNode;
  className?: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(title);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setDraft(title);
  }, [title]);

  const commit = async () => {
    if (!onTitleChange || draft.trim() === title.trim() || !draft.trim()) {
      setEditing(false);
      setDraft(title);
      return;
    }
    setSaving(true);
    try {
      await onTitleChange(draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {backHref ? (
            <Link
              href={backHref}
              className="-ml-1 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Geri"
            >
              <HugeIcon icon={ArrowLeft01Icon} size={18} />
            </Link>
          ) : null}
          {editing && editable ? (
            <div className="flex flex-1 items-center gap-1">
              <Input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void commit();
                  } else if (event.key === "Escape") {
                    setEditing(false);
                    setDraft(title);
                  }
                }}
                className="h-9 max-w-md text-xl font-semibold tracking-tight"
                disabled={saving}
              />
              <Button variant="ghost" size="iconMd" onClick={() => void commit()} disabled={saving}>
                <HugeIcon icon={Check} size={16} />
                <span className="sr-only">Kaydet</span>
              </Button>
              <Button
                variant="ghost"
                size="iconMd"
                onClick={() => {
                  setEditing(false);
                  setDraft(title);
                }}
                disabled={saving}
              >
                <HugeIcon icon={Cancel01Icon} size={16} />
                <span className="sr-only">Vazgeç</span>
              </Button>
            </div>
          ) : (
            <h1 className="group inline-flex min-w-0 items-center gap-1.5 truncate text-xl font-semibold tracking-tight sm:text-2xl">
              <span className="truncate">{title}</span>
              {editable && onTitleChange ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:bg-muted hover:text-foreground"
                  aria-label="Başlığı düzenle"
                >
                  <HugeIcon icon={PencilEdit01Icon} size={14} />
                </button>
              ) : null}
            </h1>
          )}
        </div>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
        {meta ? <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function ConsoleCard({
  className,
  children,
  ...props
}: React.PropsWithChildren<{ className?: string } & React.ComponentProps<"div">>) {
  return (
    <Card className={className} {...props}>
      {children}
    </Card>
  );
}

export function ConsoleCardHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <CardHeader className="flex flex-row items-start justify-between gap-4">
      <div className="min-w-0">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </CardHeader>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground/90">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: React.PropsWithChildren<{ tone?: Tone; className?: string }>) {
  return <Badge variant={toneToBadge(tone)} className={className}>{children}</Badge>;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: HugeIconElement;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <HugeIcon icon={icon} size={20} />
        </div>
      ) : null}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function CompactButton(props: React.ComponentProps<typeof Button>) {
  return <Button size="sm" {...props} />;
}

export function EntityStack({
  title,
  subtitle,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("grid min-w-0 gap-0.5", className)}>
      <strong className="truncate text-sm font-medium leading-5">{title}</strong>
      {subtitle ? <span className="truncate text-xs leading-4 text-muted-foreground">{subtitle}</span> : null}
    </span>
  );
}

const toneAccent: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  neutral: "text-foreground",
  info: "text-info",
};

export function SummaryTile({
  label,
  value,
  detail,
  icon,
  hint,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon?: HugeIconElement;
  hint?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon ? (
          <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <HugeIcon icon={icon} size={14} />
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className={cn("truncate text-2xl font-semibold leading-8", toneAccent[tone])} title={typeof value === "string" || typeof value === "number" ? String(value) : undefined}>
          {value}
        </div>
        {detail ? <div className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</div> : null}
      </div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function Toolbar({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ListRow({
  children,
  className,
  asChild,
  ...props
}: React.PropsWithChildren<{ className?: string; asChild?: boolean } & React.ComponentProps<"div">>) {
  const Comp = asChild ? "div" : "div";
  return (
    <Comp
      className={cn(
        "flex min-h-14 flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 transition-colors hover:border-border/80 sm:flex-row sm:items-center sm:gap-4",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { CardContent, CardHeader, CardTitle, CardDescription };
