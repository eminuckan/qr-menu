"use client";

import { Database } from "@/lib/types/supabase";
import { Menu } from "@/lib/types/menu";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useMenu } from "@/contexts/menu-context";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

type Tables = Database["public"]["Tables"];

interface MenuWelcomeProps {
    settings: Tables["menu_settings"]["Row"];
    menu: Menu;
}

export function MenuWelcome({ settings, menu }: MenuWelcomeProps) {
    const router = useRouter();
    const { setDrawerOpen } = useMenu();
    const [showLoader, setShowLoader] = useState(true);
    const [loaderAnimation, setLoaderAnimation] = useState<any>(null);

    useEffect(() => {
        // Loader animasyonu varsa ve JSON ise yükle
        if (settings.loader_url?.endsWith('.json')) {
            fetch(settings.loader_url)
                .then(res => res.json())
                .then(data => setLoaderAnimation(data))
                .catch(error => {
                    console.error('Loader animasyonu yüklenirken hata:', error);
                    setShowLoader(false);
                });
        }

        // 2 saniye sonra loader'ı kaldır
        const timer = setTimeout(() => {
            setShowLoader(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [settings.loader_url]);

    if (showLoader && (settings.loader_url || loaderAnimation)) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white">
                {settings.loader_url?.endsWith('.json') && loaderAnimation ? (
                    <Lottie
                        animationData={loaderAnimation}
                        loop
                        className="w-48 h-48"
                    />
                ) : (
                    <img
                        src={settings.loader_url || ''}
                        alt="Loading..."
                        className="w-48 h-48 object-contain"
                    />
                )}
            </div>
        );
    }

    const backgroundStyle = settings.background_type === 'color'
        ? { backgroundColor: settings.background_color || '#FFFFFF' }
        : { backgroundImage: `url(${settings.background_url || ''})` };

    // Font class'ını al
    const getFontVariable = (fontName: string | null) => {
        switch (fontName) {
            case 'inter': return 'var(--font-inter)';
            case 'poppins': return 'var(--font-poppins)';
            case 'roboto': return 'var(--font-roboto)';
            case 'montserrat': return 'var(--font-montserrat)';
            case 'raleway': return 'var(--font-raleway)';
            default: return 'var(--font-montserrat)';
        }
    };

    const titleFont = getFontVariable(settings.welcome_title_font);
    const buttonFont = getFontVariable(settings.button_font);

    return (
        <div
            className={`min-h-screen flex flex-col items-center justify-center p-6 text-center bg-cover bg-center bg-no-repeat`}
            style={{
                ...backgroundStyle,
                fontFamily: titleFont
            }}
        >
            {settings.logo_url ? (
                <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="h-24 w-auto mb-8 object-contain"
                />
            ) : (
                <h1
                    className={`text-3xl font-bold mb-6`}
                    style={{ color: settings.welcome_color || '#000000' }}
                    dangerouslySetInnerHTML={{ __html: settings.welcome_title || '' }}
                />
            )}

            {settings.welcome_text && (
                <div
                    className={`mb-8 text-sm`}
                    style={{ color: settings.welcome_color || '#000000' }}
                    dangerouslySetInnerHTML={{ __html: settings.welcome_text }}
                />
            )}

            <button
                onClick={() => setDrawerOpen(true)}
                className="px-8 py-3 rounded-lg transition-all text-sm"
                style={{
                    backgroundColor: settings.button_color || '#000000',
                    color: settings.button_text_color || '#FFFFFF',
                    fontFamily: buttonFont
                }}
            >
                {settings.button_text || 'Menüyü İncele'}
            </button>
        </div>
    );
} 