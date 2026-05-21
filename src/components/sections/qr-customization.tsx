"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useForm } from "react-hook-form";
import { Tables } from "@/lib/types/supabase";
import { QRService, QRCodeFormValues } from "@/lib/services/qr-service";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import toast from "react-hot-toast";
import jsPDF from 'jspdf';
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Cancel01Icon, CloudUploadIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/ui/huge-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QRCustomizationProps {
    editingQR?: Tables<'qr_codes'> | null;
    selectedBusiness: Tables<'businesses'> | null;
    onCancel?: () => void;
    onSave?: () => void;
}

export const QRCustomization = ({ editingQR, selectedBusiness, onCancel, onSave }: QRCustomizationProps) => {
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<QRCodeFormValues>({
        defaultValues: {
            name: editingQR?.name ?? "",
            foreground_color: editingQR?.foreground_color ?? "#000000",
            background_color: editingQR?.background_color ?? "#FFFFFF",
            business_id: selectedBusiness?.id || "",
            logo_url: editingQR?.logo_url ?? "",
        },
    });

    useEffect(() => {
        if (selectedBusiness) {
            const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${selectedBusiness.id}`;
            setPreviewUrl(redirectUrl);
            form.setValue("business_id", selectedBusiness.id);
        }
    }, [selectedBusiness, form]);

    useEffect(() => {
        form.reset({
            name: editingQR?.name ?? "",
            foreground_color: editingQR?.foreground_color ?? "#000000",
            background_color: editingQR?.background_color ?? "#FFFFFF",
            business_id: selectedBusiness?.id || "",
            logo_url: editingQR?.logo_url ?? "",
        });
        setLogoPreviewUrl(editingQR?.logo_url ?? "");
        setLogoFile(null);
    }, [editingQR, selectedBusiness, form]);

    const generatePDFBlob = async () => {
        const svgElement = document.querySelector('.qr-code svg');
        if (!svgElement) return;

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = 100;
        const imgHeight = 100;
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;

        pdf.addSvgAsImage(svgString, x, y, imgWidth, imgHeight);
        return pdf.output('blob');
    };

    const handleLogoDrop = async (files: File[]) => {
        const file = files[0];
        if (file) {
            // Dosya tipi kontrolü
            if (!['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'].includes(file.type)) {
                toast.error('Sadece SVG, PNG, JPG veya JPEG formatında dosyalar yüklenebilir');
                return;
            }

            // Dosya boyutu kontrolü (2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Dosya boyutu 2MB\'dan küçük olmalıdır');
                return;
            }

            // Görüntü boyutları kontrolü
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Minimum boyut kontrolü (100x100px)
                    if (img.width < 100 || img.height < 100) {
                        toast.error('Logo en az 100x100 piksel boyutunda olmalıdır');
                        return;
                    }

                    setLogoFile(file);
                    setLogoPreviewUrl(e.target?.result as string);
                    form.setValue("logo_url", e.target?.result as string);
                };

                img.onerror = () => {
                    toast.error('Geçersiz görüntü dosyası');
                };

                img.src = e.target?.result as string;
            };

            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreviewUrl("");
        form.setValue("logo_url", "");
    };

    const onSubmit = async (values: QRCodeFormValues) => {
        if (!selectedBusiness) {
            toast.error('Lütfen bir işletme seçin');
            return;
        }

        setIsLoading(true);
        try {
            const svgElement = document.querySelector('.qr-code svg');
            if (!svgElement) {
                throw new Error("QR kod oluşturulamadı");
            }
            const svgString = new XMLSerializer().serializeToString(svgElement);

            const pdfBlob = await generatePDFBlob();
            if (!pdfBlob) {
                throw new Error("PDF oluşturulamadı");
            }

            await QRService.createQRCode(values, svgString, selectedBusiness, pdfBlob, logoFile || undefined);

            toast.success('QR kod başarıyla kaydedildi');

            // Başarılı kayıttan sonra onSave callback'ini çağır
            onSave?.();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'QR kod kaydedilirken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>QR kodu adı</FormLabel>
                                <FormControl>
                                    <Input placeholder="Örn: Ana giriş QR" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="foreground_color"
                            render={({ field }) => (
                                <ColorPicker
                                    label="QR rengi"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="background_color"
                            render={({ field }) => (
                                <ColorPicker
                                    label="Arka plan rengi"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="logo_url"
                        render={() => (
                            <FormItem className="space-y-3">
                                <FormLabel>Logo</FormLabel>
                                <FormControl>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                                        <FileDropzone
                                            onDrop={handleLogoDrop}
                                            accept={{
                                                'image/svg+xml': ['.svg'],
                                                'image/png': ['.png'],
                                                'image/jpeg': ['.jpg', '.jpeg'],
                                            }}
                                            maxSize={2 * 1024 * 1024}
                                            multiple={false}
                                            isUploading={isUploading}
                                            className="flex-1 min-h-[120px] p-4"
                                        >
                                            <div className="flex h-full flex-col items-center justify-center gap-1.5">
                                                <HugeIcon icon={CloudUploadIcon} size={22} className="text-muted-foreground" />
                                                <p className="text-sm font-medium">Logo seç veya sürükle</p>
                                                <p className="text-xs text-muted-foreground">SVG · PNG · JPEG · 2 MB</p>
                                            </div>
                                        </FileDropzone>
                                        {logoPreviewUrl ? (
                                            <div className="relative flex h-32 w-full shrink-0 items-center justify-center rounded-md bg-muted/40 sm:h-auto sm:w-32">
                                                <img
                                                    src={logoPreviewUrl}
                                                    alt="Logo"
                                                    className="max-h-full max-w-full p-2 object-contain"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveLogo}
                                                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground transition-colors hover:bg-destructive/90"
                                                    aria-label="Logoyu kaldır"
                                                >
                                                    <HugeIcon icon={Cancel01Icon} className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </FormControl>
                                <Alert>
                                    <HugeIcon icon={InformationCircleIcon} className="h-4 w-4" />
                                    <AlertDescription>
                                        SVG formatında yüklenen logolar baskıda daha keskin sonuç verir.
                                    </AlertDescription>
                                </Alert>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
                        {onCancel ? (
                            <Button type="button" variant="outline" onClick={onCancel}>
                                İptal
                            </Button>
                        ) : null}
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Kaydediliyor..." : editingQR ? "Değişiklikleri kaydet" : "QR kodu kaydet"}
                        </Button>
                    </div>
                </form>
            </Form>

            <aside className="lg:sticky lg:top-20">
                <div className="grid place-items-center gap-4 rounded-lg border border-border bg-card p-6">
                    {selectedBusiness ? (
                        <>
                            <div className="qr-code rounded-md bg-background p-3">
                                <QRCodeSVG
                                    value={previewUrl}
                                    size={232}
                                    fgColor={form.watch("foreground_color")}
                                    bgColor={form.watch("background_color")}
                                    level="H"
                                    imageSettings={
                                        logoPreviewUrl
                                            ? { src: logoPreviewUrl, height: 56, width: 56, excavate: true }
                                            : undefined
                                    }
                                />
                            </div>
                            <p className="text-center text-xs text-muted-foreground">
                                Çıktı için minimum 2.5 × 2.5 cm önerilir.
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">İşletme seçilmemiş</p>
                    )}
                </div>
            </aside>
        </div>
    );
};
