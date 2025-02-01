import type { Metadata } from "next";
import Image from "next/image";
import "@/app/styles/landing-theme.css";

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
            <header className="fixed w-full z-50 bg-landing-background/90 backdrop-blur-md py-6">
                <div className="container">
                    <div className="flex h-16 items-center justify-between rounded-full border border-landing-primary/10 bg-landing-background/90 backdrop-blur-md px-8 shadow-lg">
                        <div className="flex items-center gap-8 md:gap-10">
                            <a href="#" className="flex items-center space-x-2">
                                <div className="flex items-center">
                                    <Image
                                        src="/qr-floww.svg"
                                        alt="QR Floww Logo"
                                        width={36}
                                        height={36}
                                        className="w-9 h-9"
                                    />
                                </div>
                            </a>
                            <nav className="hidden md:flex gap-10">
                                <a href="#features" className="text-base text-landing-text transition-colors hover:text-landing-primary">
                                    Özellikler
                                </a>
                                <a href="#pricing" className="text-base text-landing-text transition-colors hover:text-landing-primary">
                                    Fiyatlandırma
                                </a>
                                <a href="#testimonials" className="text-base text-landing-text transition-colors hover:text-landing-primary">
                                    Referanslar
                                </a>
                            </nav>
                        </div>
                        <div className="flex items-center gap-6">
                            <a
                                href="#"
                                className="text-base font-semibold text-landing-text transition-colors hover:text-landing-primary"
                            >
                                Giriş Yap
                            </a>
                            <a
                                href="#"
                                className="rounded-full bg-landing-primary px-6 py-2.5 text-base font-semibold text-landing-primary-foreground shadow-md transition-all hover:scale-105"
                            >
                                Ücretsiz Başla
                            </a>
                        </div>
                    </div>
                </div>
            </header>
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
