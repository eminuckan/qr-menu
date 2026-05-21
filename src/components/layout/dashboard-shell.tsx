"use client";

import * as React from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { BusinessAlert } from "@/components/sections/business-alert";
import { cn } from "@/lib/utils";

export function DashboardShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    setCollapsed(document.cookie.includes("qr_sidebar_state=false"));
  }, []);

  const toggleSidebar = React.useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      document.cookie = `qr_sidebar_state=${next ? "false" : "true"}; path=/; max-age=${60 * 60 * 24 * 7}`;
      return next;
    });
  }, []);

  return (
    <div className="min-h-svh bg-background text-foreground">
      <Sidebar userEmail={userEmail} collapsed={collapsed} onToggle={toggleSidebar} />
      <main
        className={cn(
          "min-h-svh pt-14 transition-[padding] duration-200 ease-linear",
          "pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:pb-0",
          collapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        <div className="mx-auto w-full max-w-[1560px] px-4 pb-8 pt-5 sm:px-5 md:px-8 md:py-8 xl:px-16 2xl:px-20">
          <BusinessAlert />
          {children}
        </div>
      </main>
    </div>
  );
}
