import type { Metadata } from "next";
import Image from "next/image";
import "@/app/styles/landing-theme.css";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
    title: "QR Floww - QR Menü Yönetim Sistemi",
    description: "Modern işletmeler için akıllı QR menü sistemi",
};

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen flex-col bg-landing-background">
            <Navbar />
            <main className="flex-1 pt-28">{children}</main>
            <footer className="border-t border-landing-primary/10 bg-landing-background">
                <div className="container mx-auto py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/qr-floww.svg"
                                alt="QR Floww Logo"
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                            <span className="text-sm text-landing-text/60">
                                &copy; {new Date().getFullYear()} QR Floww
                            </span>
                        </div>
                        <div className="flex items-center gap-6">
                            <a href="#features" className="text-sm text-landing-text/60 hover:text-landing-primary">
                                Özellikler
                            </a>
                            <a href="#pricing" className="text-sm text-landing-text/60 hover:text-landing-primary">
                                Fiyatlandırma
                            </a>
                            <a href="#" className="text-sm text-landing-text/60 hover:text-landing-primary">
                                Gizlilik Politikası
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
