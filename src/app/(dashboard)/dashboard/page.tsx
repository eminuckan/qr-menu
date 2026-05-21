import Link from "next/link";
import {
  Add01Icon,
  Alert02Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Building03Icon,
  SpoonAndForkIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { HugeIcon } from "@/components/ui/huge-icon";
import {
  EmptyState,
  EntityStack,
  PageHeader,
  SectionHeader,
} from "@/components/ui/console-primitives";
import { DashboardStorefront } from "@/components/sections/dashboard-storefront";
import {
  DashboardActivity,
  type ActivityEntry,
} from "@/components/sections/dashboard-activity";
import { getBusinessScope } from "@/lib/business-scope";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function relativeOrDate(value: string | null | undefined) {
  if (!value) return "—";
  const then = new Date(value).getTime();
  const diff = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))} dk önce`;
  if (diff < day) return `${Math.max(1, Math.round(diff / hour))} sa önce`;
  if (diff < 14 * day) return `${Math.max(1, Math.round(diff / day))} gün önce`;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function latestDate(values: Array<string | null | undefined>) {
  const stamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime());
  if (!stamps.length) return null;
  return new Date(Math.max(...stamps)).toISOString();
}

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const {
    businesses,
    selectedBusiness,
    selectedBusinessId,
    error: scopeError,
  } = await getBusinessScope(supabase, user.id);

  if (!selectedBusinessId || !selectedBusiness) {
    return (
      <div>
        <PageHeader
          title="Genel bakış"
          description="Verileri görmek için bir işletme seçilmeli."
        />
        <EmptyState
          title="İşletme bulunamadı"
          description="Başlamak için önce bir işletme oluşturun ya da bir işletmeye davet edilin."
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

  const [menusResult, qrCodesResult, menuSettingsResult] = await Promise.all([
    supabase
      .from("menus")
      .select("id,name,is_active,updated_at,business_id")
      .eq("business_id", selectedBusinessId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("qr_codes")
      .select("id,name,is_active,updated_at,qr_url")
      .eq("business_id", selectedBusinessId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("menu_settings")
      .select("id,updated_at")
      .eq("business_id", selectedBusinessId)
      .maybeSingle(),
  ]);

  const menus = menusResult.data ?? [];
  const menuIds = menus.map((menu) => menu.id);
  const categoriesResult = menuIds.length
    ? await supabase
        .from("categories")
        .select("id,name,is_active,updated_at,menu_id")
        .in("menu_id", menuIds)
    : { data: [], error: null };

  const categories = categoriesResult.data ?? [];
  const categoryIds = categories.map((category) => category.id);
  const productsResult = categoryIds.length
    ? await supabase
        .from("products")
        .select("id,name,is_active,updated_at,category_id,categories(name,menus(id,name))")
        .in("category_id", categoryIds)
        .order("updated_at", { ascending: false })
    : { data: [], error: null };

  const readError =
    scopeError ??
    menusResult.error ??
    qrCodesResult.error ??
    menuSettingsResult.error ??
    categoriesResult.error ??
    productsResult.error;

  const products = productsResult.data ?? [];
  const qrCodes = qrCodesResult.data ?? [];
  const activeMenus = menus.filter((menu) => menu.is_active);
  const primaryMenu = activeMenus[0] ?? menus[0] ?? null;
  const activeProducts = products.filter((product) => product.is_active);
  const activeQrCodes = qrCodes.filter((qr) => qr.is_active);
  const activeCategories = categories.filter((category) => category.is_active);

  const lastUpdated = latestDate([
    selectedBusiness.updated_at,
    ...menus.map((menu) => menu.updated_at),
    ...categories.map((category) => category.updated_at),
    ...products.map((product) => product.updated_at),
    ...qrCodes.map((qr) => qr.updated_at),
    menuSettingsResult.data?.updated_at,
  ]);

  const emptyCategories = categories.filter(
    (category) => !products.some((product) => product.category_id === category.id),
  );
  const inactiveProducts = products.filter((product) => !product.is_active);
  const inactiveQr = qrCodes.filter((qr) => !qr.is_active);

  type Attention = {
    id: string;
    title: string;
    description: string;
    href: string;
    tone: "warning" | "danger" | "info";
  };

  const attention: Attention[] = [];
  if (menus.length === 0) {
    attention.push({
      id: "no-menu",
      title: "Menü yok",
      description: "Müşteri görünümü boş — ilk menüyü oluştur.",
      href: "/dashboard/menu",
      tone: "danger",
    });
  } else if (!primaryMenu?.is_active) {
    attention.push({
      id: "menu-inactive",
      title: "Hiçbir menü yayında değil",
      description: "Yayına almak için bir menüyü aktifleştir.",
      href: "/dashboard/menu",
      tone: "warning",
    });
  }
  if (qrCodes.length === 0) {
    attention.push({
      id: "no-qr",
      title: "QR kod yok",
      description: "Müşterilere bağlanacak QR kodu oluştur.",
      href: "/dashboard/settings/qr-settings",
      tone: "warning",
    });
  } else if (inactiveQr.length > 0) {
    attention.push({
      id: "inactive-qr",
      title: `${inactiveQr.length} QR pasif`,
      description: "Kontrol et veya yeniden yayına al.",
      href: "/dashboard/areas",
      tone: "info",
    });
  }
  if (emptyCategories.length > 0) {
    attention.push({
      id: "empty-cat",
      title: `${emptyCategories.length} kategoride ürün yok`,
      description: "Boş kategoriler müşteri görünümünde boş gözükür.",
      href: primaryMenu ? `/dashboard/menu/${primaryMenu.id}` : "/dashboard/menu",
      tone: "info",
    });
  }
  if (inactiveProducts.length > 0) {
    attention.push({
      id: "inactive-prod",
      title: `${inactiveProducts.length} ürün gizli`,
      description: "Yayına almak istediklerini aktifleştir.",
      href: primaryMenu ? `/dashboard/menu/${primaryMenu.id}` : "/dashboard/menu",
      tone: "info",
    });
  }
  if (!menuSettingsResult.data) {
    attention.push({
      id: "no-settings",
      title: "Menü görünümü ayarlanmadı",
      description: "Logo, arka plan ve giriş ekranını özelleştir.",
      href: "/dashboard/settings/menu-settings",
      tone: "info",
    });
  }

  const recentActivity: ActivityEntry[] = [
    ...menus.map(
      (menu): ActivityEntry => ({
        id: `menu-${menu.id}`,
        kind: "menu",
        title: menu.name,
        subtitle: "Menü",
        updatedAt: menu.updated_at,
        href: `/dashboard/menu/${menu.id}`,
        status: menu.is_active ? "active" : "inactive",
      }),
    ),
    ...categories.map(
      (category): ActivityEntry => ({
        id: `cat-${category.id}`,
        kind: "category",
        title: category.name,
        subtitle: "Kategori",
        updatedAt: category.updated_at,
        href: `/dashboard/menu/category/${category.id}`,
        status: category.is_active ? "active" : "inactive",
      }),
    ),
    ...products.map(
      (product): ActivityEntry => ({
        id: `prod-${product.id}`,
        kind: "product",
        title: product.name,
        subtitle: product.categories?.name
          ? `${product.categories.name}${
              product.categories.menus?.name ? ` · ${product.categories.menus.name}` : ""
            }`
          : "Ürün",
        updatedAt: product.updated_at,
        href: product.categories?.menus?.id
          ? `/dashboard/menu/${product.categories.menus.id}`
          : "/dashboard/menu",
        status: product.is_active ? "active" : "inactive",
      }),
    ),
    ...qrCodes.map(
      (qr): ActivityEntry => ({
        id: `qr-${qr.id}`,
        kind: "qr",
        title: qr.name,
        subtitle: qr.qr_url,
        updatedAt: qr.updated_at,
        href: "/dashboard/settings/qr-settings",
        status: qr.is_active ? "active" : "inactive",
      }),
    ),
    ...(menuSettingsResult.data
      ? [
          {
            id: "settings",
            kind: "settings" as const,
            title: "Menü görünümü güncellendi",
            subtitle: "Logo, arka plan, giriş ekranı",
            updatedAt: menuSettingsResult.data.updated_at,
            href: "/dashboard/settings/menu-settings",
          },
        ]
      : []),
  ]
    .filter((entry) => entry.updatedAt)
    .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
    .slice(0, 10);

  const productsByMenu = new Map<string, { active: number; total: number }>();
  for (const product of products) {
    const menuId = product.categories?.menus?.id;
    if (!menuId) continue;
    const entry = productsByMenu.get(menuId) ?? { active: 0, total: 0 };
    entry.total += 1;
    if (product.is_active) entry.active += 1;
    productsByMenu.set(menuId, entry);
  }
  const categoriesByMenu = menus.reduce<Map<string, number>>((map, menu) => {
    map.set(menu.id, categories.filter((category) => category.menu_id === menu.id).length);
    return map;
  }, new Map());

  return (
    <div>
      <PageHeader
        title={selectedBusiness.name}
        description={
          businesses.length > 1
            ? `${businesses.length} işletme içinde seçili çalışma alanı.`
            : "Bu çalışma alanının canlı durumu."
        }
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <HugeIcon icon={Building03Icon} size={14} />
              {selectedBusiness.role}
            </span>
            <span>{businesses.length > 1 ? `${businesses.length} işletme` : "Tek işletme"}</span>
            <span>Son güncelleme · {relativeOrDate(lastUpdated)}</span>
          </>
        }
        actions={
          <Button asChild size="sm">
            <Link href="/dashboard/menu">
              <HugeIcon icon={Add01Icon} size={16} />
              Menüyü yönet
            </Link>
          </Button>
        }
      />

      {readError ? (
        <div className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Veriler alınamadı: {readError.message}
        </div>
      ) : null}

      <div className="mb-6">
        <DashboardStorefront
          businessName={selectedBusiness.name}
          menuName={primaryMenu?.name ?? null}
          slug={selectedBusiness.slug}
          isActive={Boolean(primaryMenu?.is_active)}
          manageHref="/dashboard/settings/qr-settings"
          qrStatus={{ active: activeQrCodes.length, total: qrCodes.length }}
          publishStatus={{
            menus: activeMenus.length,
            categories: activeCategories.length,
            products: activeProducts.length,
          }}
          lastUpdatedLabel={`Son güncelleme · ${relativeOrDate(lastUpdated)}`}
        />
      </div>

      {attention.length > 0 ? (
        <section className="mb-8">
          <SectionHeader
            title="Önerilen aksiyonlar"
            description={`${attention.length} öğe yayına almadan önce kontrol edilmeli`}
            action={
              <span className="inline-flex items-center gap-1 text-xs text-warning-foreground">
                <HugeIcon icon={Alert02Icon} size={14} className="text-warning" />
                Sağlık kontrolü
              </span>
            }
          />
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {attention.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors",
                    item.tone === "danger" &&
                      "border-destructive/40 bg-destructive/10 hover:bg-destructive/15",
                    item.tone === "warning" &&
                      "border-warning/40 bg-warning/10 hover:bg-warning/15",
                    item.tone === "info" &&
                      "border-border bg-card hover:bg-muted/40",
                  )}
                >
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        item.tone === "danger" && "text-destructive",
                        item.tone === "warning" && "text-warning-foreground",
                      )}
                    >
                      {item.title}
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <HugeIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-8">
        <SectionHeader
          title="Menüler"
          description="Tüm menülerinizin durumu ve içerik özeti."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/menu">
                Yönet
                <HugeIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </Button>
          }
        />
        {menus.length === 0 ? (
          <EmptyState
            title="Menü yok"
            description="İlk menünüzü oluşturarak yayını başlatın."
            icon={SpoonAndForkIcon}
            action={
              <Button asChild size="sm">
                <Link href="/dashboard/menu">
                  <HugeIcon icon={Add01Icon} size={16} />
                  Menü oluştur
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {menus.map((menu) => {
              const products = productsByMenu.get(menu.id) ?? { active: 0, total: 0 };
              const categoryCount = categoriesByMenu.get(menu.id) ?? 0;
              return (
                <li key={menu.id}>
                  <Link
                    href={`/dashboard/menu/${menu.id}`}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:grid-cols-[auto_minmax(0,1.4fr)_repeat(3,minmax(80px,1fr))_auto]"
                  >
                    <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <HugeIcon icon={SpoonAndForkIcon} size={16} />
                    </span>
                    <EntityStack
                      title={menu.name}
                      subtitle={
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs",
                              menu.is_active ? "text-success" : "text-muted-foreground",
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                menu.is_active ? "bg-success" : "bg-muted-foreground/60",
                              )}
                            />
                            {menu.is_active ? "Yayında" : "Taslak"}
                          </span>
                          <span>·</span>
                          <span>{relativeOrDate(menu.updated_at)}</span>
                        </span>
                      }
                    />
                    <Stat label="Kategori" value={categoryCount} />
                    <Stat label="Ürün" value={products.total} />
                    <Stat label="Yayında" value={products.active} tone="success" />
                    <HugeIcon
                      icon={ArrowUpRight01Icon}
                      size={16}
                      className="text-muted-foreground"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader
          title="Son hareketler"
          description="Menü, kategori, ürün ve QR kodlarındaki en son değişiklikler."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/menu">
                Menüye git
                <HugeIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </Button>
          }
        />
        <DashboardActivity entries={recentActivity} />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success";
}) {
  return (
    <div className="hidden flex-col items-end text-right sm:flex">
      <span className={cn("text-base font-semibold leading-6", tone === "success" && "text-success")}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
