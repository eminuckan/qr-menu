"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Add01Icon,
  ArrowDown01Icon,
  Building03Icon,
  Check,
  DashboardSquare01Icon,
  Layers01Icon,
  Logout02Icon,
  Menu02Icon,
  PaintBoardIcon,
  QrCodeIcon,
  Settings01Icon,
  SidebarLeftIcon,
  UserGroupIcon,
  UserSettings01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeMenu } from "@/components/layout/theme-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeIcon, type HugeIconElement } from "@/components/ui/huge-icon";
import { useBusinessContext } from "@/lib/contexts/business-context";
import { cn } from "@/lib/utils";

type NavigationItem = {
  title: string;
  shortTitle?: string;
  href: string;
  group: string;
  icon: HugeIconElement;
  end?: boolean;
};

const navigationItems: NavigationItem[] = [
  { title: "Genel bakış", shortTitle: "Bakış", href: "/dashboard", group: "Yönetim", icon: DashboardSquare01Icon, end: true },
  { title: "Menüler", shortTitle: "Menü", href: "/dashboard/menu", group: "Yönetim", icon: Menu02Icon },
  { title: "Alanlar", shortTitle: "Alan", href: "/dashboard/areas", group: "Yönetim", icon: UserGroupIcon },
  { title: "Ayarlar", shortTitle: "Ayar", href: "/dashboard/settings", group: "Sistem", icon: Settings01Icon },
];

function isActivePath(pathname: string, item: NavigationItem) {
  return item.end
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function Logo({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <svg
        width="73"
        height="49"
        viewBox="0 0 73 49"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-auto"
        aria-hidden="true"
      >
        <path
          d="M46.8676 24C46.8676 36.4264 36.794 46.5 24.3676 46.5C11.9413 46.5 1.86765 36.4264 1.86765 24C1.86765 11.5736 11.9413 1.5 24.3676 1.5C36.794 1.5 46.8676 11.5736 46.8676 24Z"
          fill="#68DBFF"
        />
        <path
          d="M71.1324 24C71.1324 36.4264 61.1574 46.5 48.8529 46.5C36.5484 46.5 26.5735 36.4264 26.5735 24C26.5735 11.5736 36.5484 1.5 48.8529 1.5C61.1574 1.5 71.1324 11.5736 71.1324 24Z"
          fill="#FF7917"
        />
        <path
          d="M36.6705 42.8416C42.8109 38.8239 46.8676 31.8858 46.8676 24C46.8676 16.1144 42.8109 9.17614 36.6705 5.15854C30.5904 9.17614 26.5735 16.1144 26.5735 24C26.5735 31.8858 30.5904 38.8239 36.6705 42.8416Z"
          fill="#5D2C02"
        />
      </svg>
      {!iconOnly ? <span className="truncate text-sm font-semibold text-sidebar-foreground">QRFloww</span> : null}
    </span>
  );
}

function getInitials(value: string) {
  if (!value) return "QR";
  return value
    .split("@")[0]
    .split(/[._\-\s]/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function BusinessSwitcher({ collapsed }: { collapsed: boolean }) {
  const { businesses, selectedBusiness, selectedBusinessId, setSelectedBusinessId } =
    useBusinessContext();
  const label = selectedBusiness?.name ?? "İşletme seç";
  const initials = getInitials(label);

  if (businesses.length === 0) {
    return (
      <Button
        asChild
        variant="ghost"
        className={cn(
          "h-12 w-full justify-start gap-3 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
          collapsed && "size-10 justify-center rounded-md p-0",
        )}
      >
        <Link href="/dashboard/settings/business-settings">
          <span className="flex size-8 items-center justify-center rounded-md border border-sidebar-border bg-background text-xs font-semibold">
            <HugeIcon icon={Add01Icon} size={16} />
          </span>
          <span className={cn("min-w-0 flex-1 text-left", collapsed && "sr-only")}>
            <span className="block truncate text-sm font-medium">İşletme oluştur</span>
            <span className="block truncate text-xs text-muted-foreground">Çalışma alanı yok</span>
          </span>
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-12 w-full justify-start gap-3 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "size-10 justify-center rounded-md p-0",
          )}
        >
          <span className="flex size-8 items-center justify-center rounded-md border border-sidebar-border bg-background text-xs font-semibold">
            {initials}
          </span>
          <span className={cn("min-w-0 flex-1 text-left", collapsed && "sr-only")}>
            <span className="block truncate text-sm font-medium">{label}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {selectedBusiness?.role ?? "Çalışma alanı"}
            </span>
          </span>
          {!collapsed ? (
            <HugeIcon icon={ArrowDown01Icon} size={16} className="text-muted-foreground" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64"
        align={collapsed ? "start" : "end"}
        side={collapsed ? "right" : "top"}
      >
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          İşletmeler
        </DropdownMenuLabel>
        {businesses.map((business) => {
          const active = business.id === selectedBusinessId;
          return (
            <DropdownMenuItem
              key={business.id}
              onClick={() => setSelectedBusinessId(business.id)}
            >
              <span className="flex size-7 items-center justify-center rounded-md border bg-muted text-[11px] font-semibold">
                {getInitials(business.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{business.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{business.role}</span>
              </span>
              {active ? <HugeIcon icon={Check} size={16} /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/business-settings">
            <HugeIcon icon={Building03Icon} size={16} className="mr-2" />
            İşletme ayarları
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarNavigation({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const groups = navigationItems.reduce<Record<string, NavigationItem[]>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] ?? []), item];
    return acc;
  }, {});

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto overflow-x-hidden px-3 py-3">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group} className={cn("flex flex-col gap-1", collapsed && "items-center")}>
          {!collapsed ? (
            <div className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-accent-foreground/50">
              {group}
            </div>
          ) : null}
          <ul className={cn("flex w-full flex-col gap-0.5", collapsed && "items-center")}>
            {items.map((item) => {
              const active = isActivePath(pathname, item);
              return (
                <li key={item.href} className={cn("relative", collapsed && "w-auto")}>
                  <Link
                    href={item.href}
                    title={item.title}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-sm font-medium text-sidebar-foreground/85 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      active &&
                        "bg-sidebar-accent text-sidebar-accent-foreground",
                      collapsed && "size-9 justify-center p-0",
                    )}
                  >
                    <HugeIcon
                      icon={item.icon}
                      size={18}
                      className={cn(
                        "text-sidebar-foreground/70",
                        active && "text-sidebar-accent-foreground",
                      )}
                    />
                    <span className={cn("truncate", collapsed && "sr-only")}>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function QuickActions() {
  const { selectedBusiness } = useBusinessContext();
  const publicHref = selectedBusiness ? `/qr-menu/${selectedBusiness.slug}` : "/dashboard";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-9">
          <HugeIcon icon={Add01Icon} size={16} />
          <span className="hidden sm:inline">Yeni</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Hızlı işlemler
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/menu">
              <HugeIcon icon={Menu02Icon} size={16} className="mr-2" />
              Yeni menü oluştur
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings/qr-settings">
              <HugeIcon icon={QrCodeIcon} size={16} className="mr-2" />
              Yeni QR kod
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings/business-settings">
              <HugeIcon icon={Building03Icon} size={16} className="mr-2" />
              Yeni işletme
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Kısayollar
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={publicHref} target="_blank">
              <HugeIcon icon={ViewIcon} size={16} className="mr-2" />
              Müşteri görünümü
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings/menu-settings">
              <HugeIcon icon={PaintBoardIcon} size={16} className="mr-2" />
              Menü görünümü
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/menu">
              <HugeIcon icon={Layers01Icon} size={16} className="mr-2" />
              Kategorileri yönet
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ userEmail, collapsed }: { userEmail: string; collapsed?: boolean }) {
  const initials = getInitials(userEmail);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-9 gap-2 px-2 text-sidebar-foreground",
            collapsed ? "size-9 justify-center rounded-md p-0" : "justify-start",
          )}
        >
          <Avatar className="size-7">
            <AvatarImage src={userEmail ? `https://avatar.vercel.sh/${userEmail}` : ""} alt="" />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <span className="min-w-0 max-w-[140px] truncate text-sm font-medium">{userEmail || "Kullanıcı"}</span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" side="bottom">
        <DropdownMenuLabel className="font-normal">
          <div className="grid gap-1">
            <p className="truncate text-sm font-medium">{userEmail || "Kullanıcı"}</p>
            <p className="text-xs text-muted-foreground">QRFloww yönetim</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/user-settings">
            <HugeIcon icon={UserSettings01Icon} size={16} className="mr-2" />
            Hesap ayarları
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/logout" className="text-destructive focus:text-destructive">
            <HugeIcon icon={Logout02Icon} size={16} className="mr-2" />
            Çıkış yap
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopBar({
  collapsed,
  onToggle,
  userEmail,
}: {
  collapsed: boolean;
  onToggle: () => void;
  userEmail: string;
}) {
  const pathname = usePathname();
  const current = navigationItems.find((item) => isActivePath(pathname, item));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur transition-[left] md:px-6 xl:px-10",
        collapsed ? "md:left-16" : "md:left-64",
      )}
    >
      <Button
        variant="ghost"
        size="iconMd"
        onClick={onToggle}
        className="hidden md:inline-flex"
        aria-label="Kenar çubuğunu daralt/genişlet"
      >
        <HugeIcon icon={SidebarLeftIcon} size={18} className="text-foreground/70" />
      </Button>
      <Link href="/dashboard" className="flex items-center md:hidden">
        <Logo iconOnly />
        <span className="sr-only">QRFloww</span>
      </Link>
      <div className="hidden h-6 w-px bg-border md:block" />
      <div className="min-w-0 truncate text-sm font-semibold text-foreground/90">
        {current?.title ?? "Genel bakış"}
      </div>

      <div className="flex-1" />

      <QuickActions />
      <ThemeMenu />
      <div className="hidden sm:block">
        <UserMenu userEmail={userEmail} collapsed />
      </div>
    </header>
  );
}

function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {navigationItems.map((item) => {
          const active = isActivePath(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground transition-colors",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <HugeIcon icon={item.icon} size={18} />
                <span className="truncate">{item.shortTitle ?? item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Sidebar({
  userEmail,
  collapsed,
  onToggle,
}: {
  userEmail: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden h-svh flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear md:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className={cn("flex h-14 items-center px-5", collapsed && "justify-center px-2")}>
          <Link href="/dashboard" className="flex cursor-pointer items-center">
            <Logo iconOnly={collapsed} />
            <span className="sr-only">QRFloww</span>
          </Link>
        </div>

        <SidebarNavigation collapsed={collapsed} />

        <div
          className={cn(
            "border-t border-border p-2",
            collapsed && "flex justify-center px-0 pb-4",
          )}
        >
          <BusinessSwitcher collapsed={collapsed} />
        </div>
      </aside>

      <TopBar collapsed={collapsed} onToggle={onToggle} userEmail={userEmail} />
      <MobileTabBar />
    </>
  );
}
