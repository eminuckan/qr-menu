import Link from "next/link";
import {
  Layers01Icon,
  QrCodeIcon,
  Settings01Icon,
  SpoonAndForkIcon,
} from "@hugeicons/core-free-icons";

import { HugeIcon, type HugeIconElement } from "@/components/ui/huge-icon";
import { cn } from "@/lib/utils";

export type ActivityEntry = {
  id: string;
  kind: "menu" | "category" | "product" | "qr" | "settings";
  title: string;
  subtitle?: string;
  href?: string;
  updatedAt: string | null;
  status?: "active" | "inactive";
};

const iconByKind: Record<ActivityEntry["kind"], HugeIconElement> = {
  menu: SpoonAndForkIcon,
  category: Layers01Icon,
  product: Layers01Icon,
  qr: QrCodeIcon,
  settings: Settings01Icon,
};

const labelByKind: Record<ActivityEntry["kind"], string> = {
  menu: "Menü",
  category: "Kategori",
  product: "Ürün",
  qr: "QR",
  settings: "Ayar",
};

function relative(value: string | null) {
  if (!value) return "—";
  const diffMs = Date.now() - new Date(value).getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < hour) return `${Math.max(1, Math.round(diffMs / minute))} dk önce`;
  if (diffMs < day) return `${Math.max(1, Math.round(diffMs / hour))} sa önce`;
  if (diffMs < 14 * day) return `${Math.max(1, Math.round(diffMs / day))} gün önce`;
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(
    new Date(value),
  );
}

export function DashboardActivity({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Henüz hareket yok. İlk değişikliğin burada görünecek.
      </div>
    );
  }

  return (
    <ol className="grid divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {entries.map((entry) => {
        const content = (
          <>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <HugeIcon icon={iconByKind[entry.kind]} size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {labelByKind[entry.kind]}
                </span>
                {entry.status ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs",
                      entry.status === "active" ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        entry.status === "active" ? "bg-success" : "bg-muted-foreground/60",
                      )}
                    />
                    {entry.status === "active" ? "Aktif" : "Pasif"}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-sm font-medium">{entry.title}</p>
              {entry.subtitle ? (
                <p className="truncate text-xs text-muted-foreground">{entry.subtitle}</p>
              ) : null}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{relative(entry.updatedAt)}</span>
          </>
        );

        return (
          <li key={entry.id}>
            {entry.href ? (
              <Link href={entry.href} className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/40 sm:px-4">
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-3 py-3 transition-colors sm:px-4">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
