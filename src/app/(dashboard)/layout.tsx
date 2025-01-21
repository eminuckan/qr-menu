import type { Metadata } from "next";
import { Inter as FontInter } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";

import { cn } from "@/lib/utils";

const inter = FontInter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      className={cn("min-h-screen bg-background", inter.variable, "font-sans")}
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
