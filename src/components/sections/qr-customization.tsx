"use client";

import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useForm } from "react-hook-form";
import { Tables } from "@/lib/types/supabase";
import { QRService, QRCodeFormValues } from "@/lib/services/qr-service";
import { BusinessService } from "@/lib/services/business-service";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jsPDF from 'jspdf';
import { FileDropzone } from "@/components/ui/file-dropzone";
import { X, UploadCloud, InfoIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Color picker komponenti
const ColorPicker = ({ color, onChange, label }: { color: string; onChange: (color: string) => void; label: string }) => {
    const [inputValue, setInputValue] = useState(color);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        // Geçerli bir hex kodu ise onChange'i çağır
        if (/^#[0-9A-F]{6}$/i.test(value)) {
            onChange(value);
        }
    };

    // Dışarıdan gelen renk değiştiğinde input değerini güncelle
    useEffect(() => {
        setInputValue(color);
    }, [color]);

    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        style={{ backgroundColor: color }}
                    >
                        <div className="w-4 h-4 rounded mr-2 border" style={{ backgroundColor: color }} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                    <div className="space-y-3">
                        <HexColorPicker color={color} onChange={onChange} />
                        <div className="flex gap-2 items-center">
                            <Input
                                value={inputValue}
                                onChange={handleInputChange}
                                placeholder="#000000"
                                className="h-8"
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </FormItem>
    );
};

// Props tipini güncelle
interface QRCustomizationProps {
    editingQR?: Tables<'qr_codes'> | null;
    selectedBusiness: Tables<'businesses'> | null;
    onCancel?: () => void;
    onSave?: () => void;
}

export const QRCustomization = ({ editingQR, selectedBusiness, onCancel, onSave }: QRCustomizationProps) => {
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);
    const [savedQRCodes, setSavedQRCodes] = useState<Tables<'qr_codes'>[]>([]);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<QRCodeFormValues>({
        defaultValues: {
            name: "",
            foreground_color: "#000000",
            background_color: "#FFFFFF",
            business_id: selectedBusiness?.id || "",
            logo_url: "",
        },
    });

    useEffect(() => {
        if (selectedBusiness) {
            // Redirect URL'i oluştur
            const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${selectedBusiness.id}`;
            setPreviewUrl(redirectUrl);
            form.setValue("business_id", selectedBusiness.id);
        }
    }, [selectedBusiness]);

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

    const handleDownload = () => {
        const svgElement = document.querySelector('.qr-code svg');
        if (!svgElement) return;

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-${selectedBusiness?.slug || 'code'}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPDF = async () => {
        if (selectedBusiness) {
            const qrCode = savedQRCodes.find(q => q.business_id === selectedBusiness.id);
            if (qrCode) {
                const qrCodeSVG = document.querySelector('.qr-code svg');
                if (qrCodeSVG) {
                    const svgString = new XMLSerializer().serializeToString(qrCodeSVG);
                    const blob = new Blob([Buffer.from(svgString, 'utf-8')], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `qr-${selectedBusiness.slug}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            }
        }
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                    {editingQR ? "QR Kodu Düzenle" : "Yeni QR Kodu Oluştur"}
                </h2>
                {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                        İptal
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>QR Kod Adı</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ana Giriş QR" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Renk seçicileri için grid container */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="foreground_color"
                                render={({ field }) => (
                                    <ColorPicker
                                        label="QR Rengi"
                                        color={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="background_color"
                                render={({ field }) => (
                                    <ColorPicker
                                        label="Arkaplan Rengi"
                                        color={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="logo_url"
                            render={({ field }) => (
                                <FormItem className="space-y-4">
                                    <FormLabel>Logo</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-4 items-stretch h-[140px]">
                                            <div className="flex-1">
                                                <FileDropzone
                                                    onDrop={handleLogoDrop}
                                                    accept={{
                                                        'image/svg+xml': ['.svg'],
                                                        'image/png': ['.png'],
                                                        'image/jpeg': ['.jpg', '.jpeg']
                                                    }}
                                                    maxSize={2 * 1024 * 1024}
                                                    multiple={false}
                                                    isUploading={isUploading}
                                                    className="h-full"
                                                >
                                                    <div className="flex flex-col items-center justify-center h-full gap-2">
                                                        <div className="rounded-full bg-muted p-2">
                                                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p>Logo yüklemek için tıklayın veya sürükleyin</p>
                                                            <p className="text-sm text-muted-foreground mt-1">SVG, PNG veya JPEG (max. 2MB)</p>
                                                        </div>
                                                    </div>
                                                </FileDropzone>
                                            </div>
                                            {/* Logo Önizleme */}
                                            <div className="w-[140px] border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/5 relative">
                                                {logoPreviewUrl ? (
                                                    <>
                                                        <img
                                                            src={logoPreviewUrl}
                                                            alt="Logo"
                                                            className="w-20 h-20 object-contain"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute -top-2 -right-2 h-6 w-6"
                                                            onClick={handleRemoveLogo}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <div className="text-center">
                                                        <p className="text-sm text-muted-foreground">Logo önizleme</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </FormControl>
                                    <Alert>
                                        <InfoIcon className="h-4 w-4" />
                                        <AlertDescription>
                                            SVG formatında logo yüklemeniz durumunda, baskı için daha yüksek kalitede çıktı alabilirsiniz.
                                        </AlertDescription>
                                    </Alert>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Kaydediliyor..." : "QR Kodu Kaydet"}
                        </Button>
                    </form>
                </Form>

                <Card className="flex items-center justify-center p-8">
                    <CardContent className="w-full h-full flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-4">
                            {selectedBusiness && (
                                <>
                                    <div className="qr-code">
                                        <QRCodeSVG
                                            value={previewUrl}
                                            size={260}
                                            fgColor={form.watch("foreground_color")}
                                            bgColor={form.watch("background_color")}
                                            level="H"
                                            imageSettings={logoPreviewUrl ? {
                                                src: logoPreviewUrl,
                                                height: 60,
                                                width: 60,
                                                excavate: true
                                            } : undefined}
                                        />
                                    </div>
                                    <Alert variant="default">
                                        <InfoIcon className="h-4 w-4" />
                                        <AlertDescription>
                                            QR kodunuzu minimum 2.5 x 2.5 cm boyutlarında çıktı alınız.
                                        </AlertDescription>
                                    </Alert>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}; 