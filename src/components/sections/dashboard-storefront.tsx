"use client";

import * as React from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Download01Icon,
  QrCodeIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { HugeIcon } from "@/components/ui/huge-icon";
import { cn } from "@/lib/utils";

type StorefrontPanelProps = {
  businessName: string;
  menuName: string | null;
  slug: string;
  isActive: boolean;
  manageHref: string;
  qrStatus: { active: number; total: number };
  publishStatus: { menus: number; categories: number; products: number };
  lastUpdatedLabel: string;
};

export function DashboardStorefront({
  businessName,
  menuName,
  slug,
  isActive,
  manageHref,
  qrStatus,
  publishStatus,
  lastUpdatedLabel,
}: StorefrontPanelProps) {
  const [origin, setOrigin] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const path = `/qr-menu/${slug}`;
  const publicUrl = origin ? `${origin}${path}` : path;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Bağlantı kopyalandı");
    } catch {
      toast.error("Bağlantı kopyalanamadı");
    }
  };

  const downloadQr = () => {
    const svgEl = document.querySelector<SVGSVGElement>("[data-storefront-qr] svg");
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "qr"}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className="grid overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]"
      aria-label="Yayın durumu"
    >
      <div
        data-storefront-qr
        className="relative flex flex-col items-center justify-center gap-4 border-b border-border bg-muted/30 p-6 lg:border-b-0 lg:border-r"
      >
        <div className="flex items-center gap-2 self-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <HugeIcon icon={QrCodeIcon} size={14} />
          Müşteri görünümü
        </div>
        <div className="rounded-md bg-background p-3">
          <QRCodeSVG
            value={publicUrl}
            size={168}
            level="M"
            includeMargin={false}
            bgColor="transparent"
            fgColor="currentColor"
            className="block text-foreground"
          />
        </div>
        <div className="flex w-full flex-col items-center gap-1 text-center">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
              isActive
                ? "bg-success/15 text-success"
                : "bg-warning/15 text-warning-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                isActive ? "bg-success" : "bg-warning",
              )}
              aria-hidden="true"
            />
            {isActive ? "Canlı yayın" : "Yayın pasif"}
          </span>
          <span className="text-xs text-muted-foreground">{lastUpdatedLabel}</span>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5 lg:p-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Yayın adresi
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{businessName}</h2>
          {menuName ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Ana menü · <span className="text-foreground">{menuName}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-warning-foreground">
              Henüz menü yok — müşteri görünümü boş.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
          <span className="truncate">{publicUrl || path}</span>
          <button
            type="button"
            onClick={copyLink}
            className="ml-auto inline-flex h-7 items-center gap-1 rounded-sm px-2 text-xs font-medium text-foreground transition-colors hover:bg-background"
          >
            <HugeIcon icon={Copy01Icon} size={12} />
            Kopyala
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link href={path} target="_blank">
              <HugeIcon icon={ViewIcon} size={16} />
              Menüyü aç
              <HugeIcon icon={ArrowUpRight01Icon} size={12} className="opacity-60" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={downloadQr}>
            <HugeIcon icon={Download01Icon} size={16} />
            QR indir
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={manageHref}>
              <HugeIcon icon={QrCodeIcon} size={16} />
              QR ayarları
            </Link>
          </Button>
        </div>

        <dl className="grid grid-cols-3 gap-3 text-sm">
          <Metric label="Menü" value={publishStatus.menus} />
          <Metric label="Kategori" value={publishStatus.categories} />
          <Metric label="Yayındaki ürün" value={publishStatus.products} accent />
        </dl>

        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <HugeIcon icon={CheckmarkCircle02Icon} size={14} className="text-success" />
            QR kapsamı
          </span>
          <span className="font-medium">
            {qrStatus.active}/{qrStatus.total} aktif
          </span>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn("text-xl font-semibold leading-7", accent && "text-success")}>{value}</dd>
    </div>
  );
}
