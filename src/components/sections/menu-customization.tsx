"use client";

import { FileDropzone } from "@/components/ui/file-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircleIcon, Cancel01Icon, CloudUploadIcon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/ui/huge-icon";
import { SectionHeader } from "@/components/ui/console-primitives";
import { useState, useEffect } from "react";
import { ColorPicker } from "@/components/ui/color-picker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { menuSettingsSchema } from "@/lib/validations/menu-settings";
import { MenuSettingsService } from "@/lib/services/menu-settings-service";
import { useRouter } from "next/navigation";
import IPhoneMockup from "../ui/iphone-mockup";
import { FontSelect, defaultFont, getFontClassName } from "@/components/ui/font-select";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import { useLottie } from "lottie-react";
import { Loading } from "@/components/ui/loading";
import { Database } from "@/lib/types/supabase";
import { z } from "zod";
import toast from "react-hot-toast";

type Tables = Database['public']['Tables']
type MenuSettingsFormValues = z.infer<typeof menuSettingsSchema>;

const colorOptions = [
    { value: "#000000", label: "Siyah" },
    { value: "#FFFFFF", label: "Beyaz" },
    { value: "#FFB3B3", label: "Pastel Kırmızı" },
    { value: "#B3FFB3", label: "Pastel Yeşil" },
    { value: "#B3B3FF", label: "Pastel Mavi" },
    { value: "#FFE4B3", label: "Pastel Turuncu" },
    { value: "#FFB3FF", label: "Pastel Pembe" },
];

interface BackgroundSelectorProps {
    value: string;
    onImageChange: (file: File) => void;
    onColorChange: (color: string) => void;
    backgroundColor: string;
    onTypeChange: (type: 'color' | 'image') => void;
    type: 'color' | 'image';
}

const BackgroundSelector = ({ value, onImageChange, onColorChange, backgroundColor, onTypeChange, type }: BackgroundSelectorProps) => {
    const [useColor, setUseColor] = useState(type === "color");

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="relative h-56 w-full overflow-hidden rounded-md sm:h-72 sm:w-44 md:w-52">
                <img
                    src={value || "https://auvcgbdzyhbuwekgkhsb.supabase.co/storage/v1/object/public/menu-settings/menu-default-bg-min.jpg"}
                    alt="Arkaplan"
                    className="h-full w-full object-cover"
                />
                <FileDropzone
                    onDrop={async (files) => {
                        if (files[0]) onImageChange(files[0]);
                    }}
                    maxSize={5 * 1024 * 1024}
                    accept={{ "image/*": [".jpeg", ".jpg", ".png"] }}
                    multiple={false}
                    minWidth={350}
                    minHeight={350}
                    className="absolute inset-0 flex items-center justify-center rounded-md bg-black/45 p-3 text-center text-white opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100"
                >
                    <span className="text-sm">Yeni görsel yükle</span>
                </FileDropzone>
            </div>

            <div className="flex-1 space-y-4">
                <RadioGroup
                    value={useColor ? "color" : "image"}
                    onValueChange={(val) => {
                        setUseColor(val === "color");
                        onTypeChange(val as 'color' | 'image');
                    }}
                    className="grid gap-2"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="image" id="image" />
                        <Label htmlFor="image">Arkaplan görseli</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="color" id="color" />
                        <Label htmlFor="color">Düz renk</Label>
                    </div>
                </RadioGroup>

                {useColor && (
                    <ColorPicker value={backgroundColor} onChange={onColorChange} />
                )}

                <Alert>
                    <HugeIcon icon={AlertCircleIcon} className="h-4 w-4" />
                    <AlertDescription>
                        Mobil görünüm için dikey (portrait) bir fotoğraf önerilir.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
};

// Lottie'yi client-side'da dinamik olarak import et
const Lottie = dynamic(() => import('lottie-react'), {
    ssr: false, // Server-side rendering'i devre dışı bırak
});

// LoaderPreview bileşenini düzenleyelim
const LoaderPreview = dynamic(() => Promise.resolve(({ file, url }: { file: File | null, url: string | undefined }) => {
    const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // useEffect hook'unu en üstte tutuyoruz ve koşullu çağırmıyoruz
    useEffect(() => {
        const loadAnimation = async () => {
            if (!file && !url) return;

            setIsLoading(true);
            try {
                if (file?.type === "application/json") {
                    const text = await file.text();
                    const json = JSON.parse(text) as Record<string, unknown>;
                    setAnimationData(json);
                    setError(null);
                } else if (url?.endsWith('.json')) {
                    const response = await fetch(url);
                    const data = await response.json() as Record<string, unknown>;
                    setAnimationData(data);
                    setError(null);
                }
            } catch (err) {
                setError('Animasyon dosyası yüklenirken bir hata oluştu');
                console.error('Animation load error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadAnimation();
    }, [file, url]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <HugeIcon icon={Loading03Icon} className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-sm text-destructive text-center p-2">
                {error}
            </div>
        );
    }

    // GIF dosyası
    if (file?.type === "image/gif") {
        return (
            <img
                src={URL.createObjectURL(file)}
                alt="Loader Animation"
                className="max-w-full max-h-full p-2 object-contain"
            />
        );
    }

    // JSON animasyonu
    if ((file?.type === "application/json" || url?.endsWith('.json')) && animationData) {
        return (
            <Lottie
                animationData={animationData}
                loop
                className="w-full h-full p-2"
            />
        );
    }

    // Mevcut URL (GIF için)
    if (url && !url.endsWith('.json')) {
        return (
            <img
                src={url}
                alt="Loader Animation"
                className="max-w-full max-h-full p-2 object-contain"
            />
        );
    }

    return null;
}), {
    ssr: false
});

interface MenuCustomizationProps {
    businessId: string;
}

export const MenuCustomization = ({ businessId }: MenuCustomizationProps) => {
    const router = useRouter();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
    const [selectedLoader, setSelectedLoader] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<MenuSettingsFormValues>({
        resolver: zodResolver(menuSettingsSchema),
        defaultValues: async () => {
            try {
                setIsLoading(true);
                const settings = await MenuSettingsService.getMenuSettings(businessId);
                return {
                    business_id: businessId,
                    welcome_title: settings.welcome_title || "",
                    welcome_title_font: settings.welcome_title_font || defaultFont.value,
                    welcome_text: settings.welcome_text || "Hoş geldiniz",
                    welcome_color: settings.welcome_color || "#000000",
                    button_text: settings.button_text || "Menüyü İncele",
                    button_font: settings.button_font || defaultFont.value,
                    button_color: settings.button_color || "#000000",
                    button_text_color: settings.button_text_color || "#FFFFFF",
                    background_type: (settings.background_type || "image") as "color" | "image",
                    background_color: settings.background_color || "",
                    background_url: settings.background_url || "",
                    logo_url: settings.logo_url || "",
                    loader_url: settings.loader_url || "",
                };
            } catch (error) {
                toast.error("Menu ayarları yüklenirken bir hata oluştu");
                return {
                    business_id: businessId,
                    welcome_title: "",
                    welcome_title_font: defaultFont.value,
                    welcome_text: "Hoş geldiniz",
                    welcome_color: "#000000",
                    button_text: "Menüyü İncele",
                    button_font: defaultFont.value,
                    button_color: "#000000",
                    button_text_color: "#FFFFFF",
                    background_type: "image",
                    background_color: "",
                    background_url: "",
                    logo_url: "",
                    loader_url: "",
                };
            } finally {
                setIsLoading(false);
            }
        }
    });

    if (isLoading) {
        return <Loading className="min-h-[200px]" />;
    }

    const onSubmit = async (data: MenuSettingsFormValues) => {
        try {
            // Dosya yüklemeleri
            if (selectedLogo) {
                const logoUrl = await MenuSettingsService.uploadFile(
                    businessId,
                    selectedLogo,
                    "logo",
                    "menu-settings"
                );
                data.logo_url = logoUrl;
            }

            if (selectedLoader) {
                const loaderUrl = await MenuSettingsService.uploadFile(
                    businessId,
                    selectedLoader,
                    "loader",
                    "menu-settings"
                );
                data.loader_url = loaderUrl;
            }

            // Sadece image tipinde background_url güncelle
            if (selectedFile && data.background_type === "image") {
                const backgroundUrl = await MenuSettingsService.uploadFile(
                    businessId,
                    selectedFile,
                    "background",
                    "menu-settings"
                );
                data.background_url = backgroundUrl;
            } else if (data.background_type === "color") {
                data.background_url = ""; // Color tipinde URL'yi temizle
            }

            // business_id'yi ekleyerek ayarları güncelle
            const updatedSettings = await MenuSettingsService.updateMenuSettings(businessId, {
                ...data,
                business_id: businessId
            });

            if (updatedSettings) {
                // Form state'ini güncelle
                form.reset({
                    business_id: businessId,
                    welcome_title: updatedSettings.welcome_title || "",
                    welcome_title_font: updatedSettings.welcome_title_font || defaultFont.value,
                    welcome_text: updatedSettings.welcome_text || "Hoş geldiniz",
                    welcome_color: updatedSettings.welcome_color || "#000000",
                    button_text: updatedSettings.button_text || "Menüyü İncele",
                    button_font: updatedSettings.button_font || defaultFont.value,
                    button_color: updatedSettings.button_color || "#000000",
                    button_text_color: updatedSettings.button_text_color || "#FFFFFF",
                    background_type: (updatedSettings.background_type || "image") as "color" | "image",
                    background_color: updatedSettings.background_color || "",
                    background_url: updatedSettings.background_url || "",
                    logo_url: updatedSettings.logo_url || "",
                    loader_url: updatedSettings.loader_url || "",
                });

                toast.success("Menü ayarları başarıyla kaydedildi.");

                // Form state'ini resetle
                setSelectedFile(null);
                setSelectedLogo(null);
                setSelectedLoader(null);
            }
        } catch (error) {
            console.error('Form submit error:', error);
            toast.error("Menü ayarları güncellenirken bir hata oluştu");
        }
    };

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <form onSubmit={form.handleSubmit(onSubmit)} className="divide-y divide-border">
                <section className="space-y-5 pb-8">
                    <SectionHeader
                        title="Logo ve yükleme animasyonu"
                        description="Müşteri menüyü açtığında ilk göreceği marka unsurları."
                    />
                    <div className="grid gap-5">
                        <div className="space-y-2">
                            <Label>Logo</Label>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                                <FileDropzone
                                    onDrop={async (files) => {
                                        if (files[0]) setSelectedLogo(files[0]);
                                    }}
                                    maxSize={2 * 1024 * 1024}
                                    accept={{ "image/*": [".jpeg", ".jpg", ".png"] }}
                                    multiple={false}
                                    className="flex-1 min-h-[120px] p-4"
                                >
                                    <div className="flex h-full flex-col items-center justify-center gap-1.5">
                                        <HugeIcon icon={CloudUploadIcon} size={22} className="text-muted-foreground" />
                                        <p className="text-sm font-medium">Logo seç veya sürükle</p>
                                        <p className="text-xs text-muted-foreground">PNG · JPG · 2 MB</p>
                                    </div>
                                </FileDropzone>

                                {(selectedLogo || form.watch("logo_url")) && (
                                    <div className="relative flex h-32 w-full shrink-0 items-center justify-center rounded-md bg-muted/40 sm:h-auto sm:w-44">
                                        <img
                                            src={selectedLogo ? URL.createObjectURL(selectedLogo) : form.watch("logo_url")}
                                            alt="Logo"
                                            className="max-h-full max-w-full p-2 object-contain"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedLogo(null);
                                                form.setValue("logo_url", "");
                                            }}
                                            className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground transition-colors hover:bg-destructive/90"
                                            aria-label="Logoyu kaldır"
                                        >
                                            <HugeIcon icon={Cancel01Icon} className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Yükleme animasyonu</Label>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                                <FileDropzone
                                    onDrop={async (files) => {
                                        if (files[0]) setSelectedLoader(files[0]);
                                    }}
                                    maxSize={1 * 1024 * 1024}
                                    accept={{
                                        "application/json": [".json"],
                                        "image/gif": [".gif"]
                                    }}
                                    multiple={false}
                                    className="flex-1 min-h-[120px] p-4"
                                    fileType="animation"
                                >
                                    <div className="flex h-full flex-col items-center justify-center gap-1.5">
                                        <HugeIcon icon={CloudUploadIcon} size={22} className="text-muted-foreground" />
                                        <p className="text-sm font-medium">Animasyon seç veya sürükle</p>
                                        <p className="text-xs text-muted-foreground">Lottie JSON · GIF · 1 MB</p>
                                    </div>
                                </FileDropzone>

                                {(selectedLoader || form.watch("loader_url")) && (
                                    <div className="relative flex h-32 w-full shrink-0 items-center justify-center rounded-md bg-white sm:h-auto sm:w-44 [&_>_div]:h-[120px]">
                                        <div className="h-full w-full p-2">
                                            <LoaderPreview
                                                file={selectedLoader}
                                                url={form.watch("loader_url") || undefined}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedLoader(null);
                                                form.setValue("loader_url", "");
                                            }}
                                            className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground transition-colors hover:bg-destructive/90"
                                            aria-label="Animasyonu kaldır"
                                        >
                                            <HugeIcon icon={Cancel01Icon} className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-5 py-8">
                    <SectionHeader
                        title="Genel görünüm"
                        description="Karşılama ekranının arka planı."
                    />
                    <div>
                        <Label>Arkaplan</Label>
                            <BackgroundSelector
                                value={selectedFile ? URL.createObjectURL(selectedFile) : (form.watch("background_url") || "")}
                                backgroundColor={form.watch("background_color") || ""}
                                type={form.watch("background_type") || "image"}
                                onImageChange={(file) => {
                                    setSelectedFile(file);
                                    form.setValue("background_color", "");
                                    form.setValue("background_type", "image");
                                    form.setValue("background_url", "");
                                }}
                                onColorChange={(color) => {
                                    form.setValue("background_color", color);
                                    form.setValue("background_type", "color");
                                    setSelectedFile(null);
                                    form.setValue("background_url", "");
                                }}
                                onTypeChange={(type) => {
                                    form.setValue("background_type", type);
                                    if (type === "color") {
                                        setSelectedFile(null);
                                        form.setValue("background_url", "");
                                    } else {
                                        form.setValue("background_color", "");
                                    }
                                }}
                            />
                    </div>
                </section>

                <section className="space-y-5 py-8">
                    <SectionHeader
                        title="Giriş ekranı"
                        description="Karşılama başlığı, metin ve tipografi seçimleri."
                    />
                    <div className="grid gap-4">
                        <div>
                            <Label>Giriş başlığı</Label>
                            <TiptapEditor
                                value={form.watch("welcome_title") || ""}
                                onChange={(content) => form.setValue("welcome_title", content)}
                            />
                        </div>

                        <div>
                            <Label>Giriş metni</Label>
                            <TiptapEditor
                                value={form.watch("welcome_text") || ""}
                                onChange={(content) => form.setValue("welcome_text", content)}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FontSelect
                                label="Başlık fontu"
                                value={form.watch("welcome_title_font")}
                                onChange={(value) => form.setValue("welcome_title_font", value)}
                            />
                            <ColorPicker
                                label="Metin rengi"
                                value={form.watch("welcome_color") || ""}
                                onChange={(color) => form.setValue("welcome_color", color)}
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-5 py-8">
                    <SectionHeader
                        title="Buton ayarları"
                        description="“Menüyü incele” butonunun metni, fontu ve renkleri."
                    />
                    <div className="grid gap-4">
                        <div>
                            <Label>Buton metni</Label>
                            <Input
                                value={form.watch("button_text") || ""}
                                onChange={(e) => form.setValue("button_text", e.target.value)}
                            />
                        </div>
                        <FontSelect
                            label="Buton fontu"
                            value={form.watch("button_font")}
                            onChange={(value) => form.setValue("button_font", value)}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <ColorPicker
                                label="Buton rengi"
                                value={form.watch("button_color") || ""}
                                onChange={(color) => form.setValue("button_color", color)}
                            />
                            <ColorPicker
                                label="Buton metin rengi"
                                value={form.watch("button_text_color") || ""}
                                onChange={(color) => form.setValue("button_text_color", color)}
                            />
                        </div>
                    </div>
                </section>

                <div className="flex justify-end pt-6">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={form.formState.isSubmitting}
                        className="min-w-[200px]"
                    >
                        {form.formState.isSubmitting ? (
                            <>
                                <HugeIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                                Kaydediliyor
                            </>
                        ) : (
                            'Ayarları Kaydet'
                        )}
                    </Button>
                </div>
            </form>

            <div className="hidden lg:block pt-8">
                <div className="sticky top-8">
                    <IPhoneMockup
                        background={{
                            type: form.watch("background_type") || 'image',
                            value: (form.watch("background_type") === "color"
                                ? form.watch("background_color")
                                : (selectedFile ? URL.createObjectURL(selectedFile) : form.watch("background_url"))) ||
                                'https://auvcgbdzyhbuwekgkhsb.supabase.co/storage/v1/object/public/menu-settings/menu-default-bg-min.jpg'
                        }}
                        className="mx-auto"
                    >
                        <div className="flex flex-col items-center justify-center h-full p-2 text-center">
                            {(selectedLogo || form.watch("logo_url")) ? (
                                <img
                                    src={selectedLogo ? URL.createObjectURL(selectedLogo) : form.watch("logo_url")}
                                    alt="Logo"
                                    className="h-24 w-auto mb-2 object-contain"
                                />
                            ) : (
                                <h1
                                    className={`text-3xl font-bold mb-4 ${getFontClassName(form.watch("welcome_title_font"))}`}
                                    style={{ color: form.watch("welcome_color") || '#000000' }}
                                    dangerouslySetInnerHTML={{
                                        __html: form.watch("welcome_title") || "Giriş Başlığı"
                                    }}
                                />
                            )}

                            <div
                                className="mb-6 text-sm"
                                style={{ color: form.watch("welcome_color") || '#000000' }}
                                dangerouslySetInnerHTML={{
                                    __html: form.watch("welcome_text") || "Hoş geldiniz"
                                }}
                            />

                            <button
                                className={`px-6 py-3 rounded-lg transition-all ${getFontClassName(form.watch("button_font"))} text-sm`}
                                style={{
                                    backgroundColor: form.watch("button_color") || '#000000',
                                    color: form.watch("button_text_color") || '#FFFFFF',
                                }}
                            >
                                {form.watch("button_text") || "Menüyü İncele"}
                            </button>
                        </div>
                    </IPhoneMockup>
                </div>
            </div>
        </div>
    );
};
