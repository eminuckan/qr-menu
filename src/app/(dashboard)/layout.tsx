import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Geist_Mono, Geist } from "next/font/google"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Store } from "lucide-react";
import { BusinessService } from "@/lib/services/business-service";
import { cn } from "@/lib/utils";
import { BusinessAlert } from "@/components/sections/business-alert";
import { BusinessProvider } from "@/lib/contexts/business-context";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard uygulaması",
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-h-screen bg-background", geistSans.variable, "font-sans")}>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-16 lg:ml-64 transition-all duration-300">
          <div className="container mx-auto p-6">
            <BusinessProvider>
              <BusinessAlert />
              {children}
            </BusinessProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
