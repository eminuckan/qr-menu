import Link from "next/link";
import {
  Add01Icon,
  Building03Icon,
  Location01Icon,
  QrCodeIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { HugeIcon } from "@/components/ui/huge-icon";
import {
  EmptyState,
  EntityStack,
  PageHeader,
  SectionHeader,
  StatusBadge,
  SummaryTile,
} from "@/components/ui/console-primitives";
import { createClient } from "@/lib/supabase/server";

export default async function AreasPage() {
  const supabase = await createClient();
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id,name,slug,qr_codes(id,name,is_active,qr_url,updated_at)")
    .order("name", { ascending: true });

  const totalQrCodes = businesses?.reduce((total, business) => total + business.qr_codes.length, 0) ?? 0;
  const activeQrCodes =
    businesses?.reduce(
      (total, business) => total + business.qr_codes.filter((qr) => qr.is_active).length,
      0,
    ) ?? 0;
  const businessCount = businesses?.length ?? 0;

  return (
    <div>
      <PageHeader
        title="Alanlar"
        description="QR kodlarına bağlı yayın alanlarını işletmeler üzerinden yönetin."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/settings/qr-settings">
                <HugeIcon icon={QrCodeIcon} size={16} />
                QR ayarları
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/settings/qr-settings">
                <HugeIcon icon={Add01Icon} size={16} />
                Yeni QR
              </Link>
            </Button>
          </>
        }
      />

      {error ? (
        <div className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Alan verileri alınamadı: {error.message}
        </div>
      ) : null}

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile label="İşletme" value={businessCount} detail="Alan kaynağı" icon={Building03Icon} />
        <SummaryTile label="Toplam QR" value={totalQrCodes} detail="Tüm kayıtlar" icon={QrCodeIcon} />
        <SummaryTile
          label="Aktif"
          value={activeQrCodes}
          detail="Yayında olanlar"
          tone={activeQrCodes ? "success" : "warning"}
        />
        <SummaryTile
          label="Pasif"
          value={Math.max(totalQrCodes - activeQrCodes, 0)}
          detail="Kontrol bekliyor"
          tone={totalQrCodes - activeQrCodes > 0 ? "warning" : "neutral"}
        />
      </section>

      {(businesses ?? []).length > 0 ? (
        <div className="space-y-8">
          {businesses?.map((business) => (
            <section key={business.id}>
              <SectionHeader
                title={
                  <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <HugeIcon icon={Building03Icon} size={14} />
                    {business.name}
                  </span>
                }
                description={`/qr-menu/${business.slug}`}
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/qr-menu/${business.slug}`} target="_blank">
                      <HugeIcon icon={ViewIcon} size={16} />
                      Menüyü aç
                    </Link>
                  </Button>
                }
              />
              {business.qr_codes.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {business.qr_codes.map((qr) => (
                    <li
                      key={qr.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <HugeIcon icon={Location01Icon} size={16} />
                        </span>
                        <EntityStack title={qr.name} subtitle={qr.qr_url} />
                      </div>
                      <StatusBadge tone={qr.is_active ? "success" : "neutral"}>
                        {qr.is_active ? "Aktif" : "Pasif"}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="QR kod yok"
                  description="Bu işletme için QR ayarlarından bir kod oluşturun."
                  icon={QrCodeIcon}
                  action={
                    <Button asChild size="sm">
                      <Link href="/dashboard/settings/qr-settings">
                        <HugeIcon icon={Add01Icon} size={16} />
                        QR oluştur
                      </Link>
                    </Button>
                  }
                />
              )}
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="İşletme bulunamadı"
          description="Alan yönetimi için önce bir işletme oluşturmanız gerekiyor."
          icon={Building03Icon}
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/settings/business-settings">
                <HugeIcon icon={Add01Icon} size={16} />
                İşletme oluştur
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
