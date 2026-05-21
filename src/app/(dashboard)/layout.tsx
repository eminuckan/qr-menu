import type { Metadata } from "next";
import { Geist } from "next/font/google"
import { redirect } from "next/navigation";

import { cn } from "@/lib/utils";
import { BusinessProvider } from "@/lib/contexts/business-context";
import { getBusinessScope } from "@/lib/business-scope";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard uygulaması",
};


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { businesses, selectedBusinessId } = await getBusinessScope(supabase, user.id);

  return (
    <div className={cn(geistSans.variable, "font-sans")}>
      <BusinessProvider initialBusinesses={businesses} initialSelectedBusinessId={selectedBusinessId}>
        <DashboardShell userEmail={user.email ?? ""}>{children}</DashboardShell>
      </BusinessProvider>
    </div>
  );
}
