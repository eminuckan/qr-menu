"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Add01Icon,
  ArrowLeft01Icon,
  Building03Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { HugeIcon } from "@/components/ui/huge-icon";
import {
  EmptyState,
  PageHeader,
} from "@/components/ui/console-primitives";
import { QRCustomization } from "@/components/sections/qr-customization";
import { QRList } from "@/components/sections/qr-list";
import { useBusinessContext } from "@/lib/contexts/business-context";
import type { Tables } from "@/lib/types/supabase";

export default function QRSettingsPage() {
  const { selectedBusiness, selectedBusinessId, loading } = useBusinessContext();
  const [showCustomization, setShowCustomization] = useState(false);
  const [editingQR, setEditingQR] = useState<Tables<"qr_codes"> | null>(null);

  const toggleCustomization = () => {
    setShowCustomization((prev) => {
      const next = !prev;
      if (!next) setEditingQR(null);
      return next;
    });
  };

  const handleEdit = (qr: Tables<"qr_codes">) => {
    setEditingQR(qr);
    setShowCustomization(true);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="QR tasarımı" />
        <div className="grid place-items-center py-16 text-sm text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (!selectedBusinessId || !selectedBusiness) {
    return (
      <div>
        <PageHeader
          title="QR tasarımı"
          description="Müşterilerin tarayacağı QR kodlarını oluşturun, kişiselleştirin ve indirin."
        />
        <EmptyState
          title="İşletme seçilmemiş"
          description="QR kodlarını yönetmek için önce kenar çubuğundan bir işletme seçin."
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
        title={showCustomization ? (editingQR ? "QR kodunu düzenle" : "Yeni QR kodu") : "QR tasarımı"}
        description={
          showCustomization
            ? "Renkleri, logoyu ve adı düzenleyin; kaydet butonuyla yayına alın."
            : "Bu işletmeye ait QR kodlarını yönetin."
        }
        meta={
          <span className="inline-flex items-center gap-1.5">
            <HugeIcon icon={Building03Icon} size={14} />
            {selectedBusiness.name}
          </span>
        }
        actions={
          showCustomization ? (
            <Button variant="outline" size="sm" onClick={toggleCustomization}>
              <HugeIcon icon={ArrowLeft01Icon} size={16} />
              Geri dön
            </Button>
          ) : (
            <Button size="sm" onClick={toggleCustomization}>
              <HugeIcon icon={Add01Icon} size={16} />
              Yeni QR kodu
            </Button>
          )
        }
      />

      {showCustomization ? (
        <QRCustomization
          editingQR={editingQR}
          selectedBusiness={selectedBusiness as unknown as Tables<"businesses">}
          onSave={() => {
            setShowCustomization(false);
            setEditingQR(null);
          }}
        />
      ) : (
        <QRList onEdit={handleEdit} selectedBusinessId={selectedBusinessId} />
      )}
    </div>
  );
}
