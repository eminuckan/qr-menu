"use client";

import { useState, useEffect } from "react";
import { Tables } from "@/lib/types/supabase";
import { QRService } from "@/lib/services/qr-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Download } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const QRList = ({
    onEdit,
    selectedBusinessId
}: {
    onEdit: (qr: Tables<'qr_codes'>) => void;
    selectedBusinessId: string;
}) => {
    const [qrCodes, setQRCodes] = useState<Tables<'qr_codes'>[]>([]);
    const [qrToDelete, setQrToDelete] = useState<Tables<'qr_codes'> | null>(null);

    useEffect(() => {
        if (selectedBusinessId) {
            loadQRCodes(selectedBusinessId);
        }
    }, [selectedBusinessId]);

    const loadQRCodes = async (businessId: string) => {
        try {
            const codes = await QRService.getQRCodes(businessId);
            setQRCodes(codes);
        } catch (error) {
            toast.error("QR kodları yüklenirken bir hata oluştu");
        }
    };

    const handleDelete = async () => {
        if (!qrToDelete) return;

        try {
            await QRService.deleteQRCode(qrToDelete.id);
            setQRCodes(qrCodes.filter(qr => qr.id !== qrToDelete.id));
            toast.success("QR kod başarıyla silindi");
        } catch (error) {
            toast.error("QR kod silinirken bir hata oluştu");
        } finally {
            setQrToDelete(null);
        }
    };

    const handleDownload = async (qr: Tables<'qr_codes'>, type: 'svg' | 'pdf') => {
        try {
            const fileName = `qr-${qr.name.toLowerCase().replace(/\s+/g, '-')}`;
            const path = type === 'svg' ? qr.svg_path : qr.pdf_path;

            if (!path) {
                toast.error(`${type.toUpperCase()} dosyası bulunamadı`);
                return;
            }

            // URL'den blob'a çevir
            const response = await fetch(path);
            const blob = await response.blob();

            // Blob URL oluştur
            const url = window.URL.createObjectURL(blob);

            // İndirme işlemi
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${fileName}.${type}`;

            document.body.appendChild(a);
            a.click();

            // Temizlik
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            toast.error("Dosya indirilirken bir hata oluştu");
        }
    };

    const handleDownloadSelect = (qr: Tables<'qr_codes'>, value: string) => {
        if (value === 'svg') {
            handleDownload(qr, 'svg');
        } else if (value === 'pdf') {
            handleDownload(qr, 'pdf');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {qrCodes.map((qr) => (
                    <Card key={qr.id}>
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-40 h-40">
                                    <img
                                        src={qr.svg_path || '/no-qr.svg'}
                                        alt={qr.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-medium">{qr.name}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => onEdit(qr)}
                                    >
                                        <Pencil className="h-4 w-4 mr-1" />
                                        Düzenle
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setQrToDelete(qr)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Sil
                                    </Button>
                                    <Select onValueChange={(value) => handleDownloadSelect(qr, value)}>
                                        <SelectTrigger className="w-[130px]">
                                            <Download className="h-4 w-4 mr-1" />
                                            <SelectValue placeholder="İndir" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="svg" className="cursor-pointer pr-8">
                                                SVG olarak indir
                                            </SelectItem>
                                            <SelectItem value="pdf" className="cursor-pointer pr-8">
                                                PDF olarak indir
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <AlertDialog open={!!qrToDelete} onOpenChange={() => setQrToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>QR Kodu Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu QR kodu silmek istediğinizden emin misiniz?
                            Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}; 