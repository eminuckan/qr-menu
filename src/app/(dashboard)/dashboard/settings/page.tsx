import Link from "next/link";
import {
  ArrowRight01Icon,
  Building03Icon,
  DatabaseSync01Icon,
  PaintBoardIcon,
  QrCodeIcon,
} from "@hugeicons/core-free-icons";

import { HugeIcon, type HugeIconElement } from "@/components/ui/huge-icon";
import {
  PageHeader,
  SectionHeader,
} from "@/components/ui/console-primitives";

type SettingsItem = {
  title: string;
  description: string;
  href: string;
  icon: HugeIconElement;
  group: "Görünüm" | "Yayın" | "Hesap" | "Entegrasyon";
};

const settingsItems: SettingsItem[] = [
  {
    title: "Menü görünümü",
    description: "Logo, yükleme animasyonu, arka plan ve giriş ekranı.",
    href: "/dashboard/settings/menu-settings",
    icon: PaintBoardIcon,
    group: "Görünüm",
  },
  {
    title: "QR tasarımı",
    description: "QR kodu özelleştirme, renkler ve indirilebilir çıktılar.",
    href: "/dashboard/settings/qr-settings",
    icon: QrCodeIcon,
    group: "Yayın",
  },
  {
    title: "İşletmeler",
    description: "İşletme kayıtları, slug ve sahiplik bilgileri.",
    href: "/dashboard/settings/business-settings",
    icon: Building03Icon,
    group: "Hesap",
  },
  {
    title: "Adisyo bağlantısı",
    description: "POS API anahtarlarını yönet ve katalog senkronunu kontrol et.",
    href: "/dashboard/settings/adisyo-settings",
    icon: DatabaseSync01Icon,
    group: "Entegrasyon",
  },
];

export default function SettingsPage() {
  const grouped = settingsItems.reduce<Record<string, SettingsItem[]>>((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Ayarlar"
        description="Yayın deneyimini etkileyen işletme, QR ve menü ayarlarını yönetin."
      />

      <div className="space-y-8">
        {Object.entries(grouped).map(([group, items]) => (
          <section key={group}>
            <SectionHeader title={group} />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/30 hover:bg-muted/40"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground/80 transition-colors group-hover:bg-foreground group-hover:text-background">
                    <HugeIcon icon={item.icon} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <HugeIcon
                        icon={ArrowRight01Icon}
                        size={16}
                        className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                      />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
