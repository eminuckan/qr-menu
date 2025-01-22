import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import {Geist_Mono, Geist} from "next/font/google"


import { cn } from "@/lib/utils";


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
    <div
      className={cn("min-h-screen bg-background", geistSans.variable, "font-sans")}
    >
      <div className="flex">
        
        <Sidebar />

        {/* Ana İçerik */}
        <main className="flex-1 ml-16 lg:ml-64 transition-all duration-300">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
