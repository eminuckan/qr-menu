"use client";

import Link from "next/link";
import { Add01Icon, Building03Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { HugeIcon } from "@/components/ui/huge-icon";
import {
  EmptyState,
  PageHeader,
} from "@/components/ui/console-primitives";
import { MenuCustomization } from "@/components/sections/menu-customization";
import { useBusinessContext } from "@/lib/contexts/business-context";

export default function MenuSettingsPage() {
  const { selectedBusinessId, selectedBusiness, loading } = useBusinessContext();

  if (loading) {
    return (
      <div>
        <PageHeader title="Menü görünümü" />
        <div className="grid place-items-center py-16 text-sm text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (!selectedBusinessId) {
    return (
      <div>
        <PageHeader
          title="Menü görünümü"
          description="Müşterinin gördüğü karşılama ekranını kişiselleştirin."
        />
        <EmptyState
          title="İşletme seçilmemiş"
          description="Menü görünümünü düzenlemek için önce kenar çubuğundan bir işletme seçin."
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
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Menü görünümü"
        description="Müşterinin gördüğü karşılama ekranı, logo, arka plan ve buton ayarları."
        meta={
          selectedBusiness ? (
            <span className="inline-flex items-center gap-1.5">
              <HugeIcon icon={Building03Icon} size={14} />
              {selectedBusiness.name}
            </span>
          ) : null
        }
      />
      <MenuCustomization key={selectedBusinessId} businessId={selectedBusinessId} />
    </div>
  );
}
