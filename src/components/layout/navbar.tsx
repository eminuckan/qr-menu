"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

function NavbarButtons() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isAuthenticated) {
        return (
            <Link
                href="/dashboard"
                className="rounded-full bg-landing-primary px-6 py-2.5 text-base font-semibold text-landing-primary-foreground shadow-md transition-all hover:scale-105"
            >
                Yönetim Paneli
            </Link>
        );
    }

    return (
        <>
            <Link
                href="/login"
                className="text-base font-semibold text-landing-text transition-colors hover:text-landing-primary"
            >
                Giriş Yap
            </Link>
            <Link
                href="/register"
                className="rounded-full bg-landing-primary px-6 py-2.5 text-base font-semibold text-landing-primary-foreground shadow-md transition-all hover:scale-105"
            >
                Ücretsiz Başla
            </Link>
        </>
    );
}

export function Navbar() {
    return (
        <header className="fixed w-full z-50 bg-landing-background/90 backdrop-blur-md py-6">
            <div className="container mx-auto">
                <div className="flex h-16 items-center justify-between rounded-full border border-landing-primary/10 bg-landing-background/90 backdrop-blur-md px-4 shadow-lg">
                    <div className="flex items-center gap-8 md:gap-10">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="flex items-center">
                                <Image
                                    src="/qr-floww.svg"
                                    alt="QR Floww Logo"
                                    width={36}
                                    height={36}
                                    className="w-9 h-9"
                                />
                            </div>
                        </Link>
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
                        <NavbarButtons />
                    </div>
                </div>
            </div>
        </header>
    );
} 