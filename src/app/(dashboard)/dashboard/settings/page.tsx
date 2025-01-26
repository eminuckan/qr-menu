"use client";

import React from 'react';
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const settingsItems = [
  {
    title: "Menü Kişiselleştirme",
    description: "Logo, yükleme animasyonu, arkaplan ve yazı tipi ayarlarını düzenleyin",
    href: "/dashboard/settings/menu-settings"
  },
  {
    title: "QR Kodu Kişiselleştirme",
    description: "QR kodunuzun görünümünü ve içeriğini özelleştirin",
    href: "/dashboard/settings/qr-settings"
  },
  {
    title: "İşletme Ayarları",
    description: "İşletme bilgilerini düzenleyin",
    href: "/dashboard/settings/business-settings"
  }
];

const SettingsPage = () => {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Ayarlar</h1>

      <div className={`grid gap-4 ${settingsItems.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col justify-between p-4 rounded-lg border hover:bg-muted transition-colors ${settingsItems.length === 1 ? 'md:col-span-2' : ''}`}
          >
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="text-base text-muted-foreground">{item.description}</p>
            </div>
            <div className="flex justify-end mt-4">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
