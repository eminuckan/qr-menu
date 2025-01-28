import { createClient } from "../supabase/client";
import { Tables } from "../types/supabase";
import { jsPDF } from "jspdf";

export interface QRCodeFormValues {
    name: string;
    foreground_color: string;
    background_color: string;
    business_id: string;
    logo_url?: string;
}

export const QRService = {
    async uploadLogo(businessId: string, file: File) {
        const supabase = createClient();
        const logoFileName = `${businessId}/${Date.now()}-logo.${file.name.split('.').pop()}`;

        const { data, error } = await supabase.storage
            .from('qr-codes')
            .upload(logoFileName, file, {
                contentType: file.type,
                upsert: true
            });

        if (error) throw error;
        return data.path;
    },

    async createQRCode(
        values: QRCodeFormValues,
        svgString: string,
        selectedBusiness: Tables<'businesses'>,
        pdfBlob?: Blob,
        logoFile?: File
    ) {
        const supabase = createClient();
        const timestamp = Date.now();

        try {
            // SVG'yi yükle ve public URL al
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
            const svgFileName = `${values.business_id}/${timestamp}-qr.svg`;
            const { data: svgData, error: svgError } = await supabase.storage
                .from('qr-codes')
                .upload(svgFileName, svgBlob, {
                    contentType: 'image/svg+xml',
                    upsert: true
                });
            if (svgError) throw svgError;

            const { data: svgPublicUrl } = supabase.storage
                .from('qr-codes')
                .getPublicUrl(svgFileName);

            // PDF oluştur ve yükle
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

            // SVG'yi yüksek çözünürlüklü canvas'a çevir
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // SVG'yi canvas'a çiz
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(null);
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
                });

                // Canvas'ı PDF'e ekle
                const imgData = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
            }

            // PDF'i yükle
            const pdfFileName = `${values.business_id}/${timestamp}-qr.pdf`;
            const pdfBlob = pdf.output('blob');
            const { data: pdfData, error: pdfError } = await supabase.storage
                .from('qr-codes')
                .upload(pdfFileName, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                });
            if (pdfError) throw pdfError;

            const { data: pdfPublicUrl } = supabase.storage
                .from('qr-codes')
                .getPublicUrl(pdfFileName);

            // Logo varsa yükle ve public URL al
            let logoPublicUrl = null;
            if (logoFile) {
                const logoFileName = `${values.business_id}/${timestamp}-logo.${logoFile.name.split('.').pop()}`;
                const { data: logoData, error: logoError } = await supabase.storage
                    .from('qr-codes')
                    .upload(logoFileName, logoFile, {
                        contentType: logoFile.type,
                        upsert: true
                    });
                if (logoError) throw logoError;

                const { data: logoUrl } = supabase.storage
                    .from('qr-codes')
                    .getPublicUrl(logoFileName);
                logoPublicUrl = logoUrl.publicUrl;
            }

            // QR kodu veritabanına kaydet
            const { data, error } = await supabase
                .from('qr_codes')
                .insert({
                    business_id: values.business_id,
                    name: values.name,
                    foreground_color: values.foreground_color,
                    background_color: values.background_color,
                    svg_path: svgPublicUrl.publicUrl,
                    pdf_path: pdfPublicUrl.publicUrl,
                    logo_url: logoPublicUrl,
                    qr_url: `${process.env.NEXT_PUBLIC_APP_URL}/qr-menu/${selectedBusiness.slug}`,
                    is_active: true
                } satisfies Omit<Tables<'qr_codes'>, 'id' | 'created_at' | 'updated_at'>)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('QR kod oluşturma hatası:', error);
            throw error;
        }
    },

    async getPublicUrl(path: string) {
        const supabase = createClient();
        const { data } = supabase.storage
            .from('qr-codes')
            .getPublicUrl(path);
        return data.publicUrl;
    },

    async getQRCodes(businessId: string): Promise<Tables<'qr_codes'>[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getQRCode(id: string): Promise<Tables<'qr_codes'>> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async updateQRCode(id: string, values: Partial<QRCodeFormValues>): Promise<Tables<'qr_codes'>> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('qr_codes')
            .update({
                ...values,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteQRCode(id: string) {
        const supabase = createClient();

        try {
            // Önce QR kodunun bilgilerini al
            const { data: qr, error: fetchError } = await supabase
                .from('qr_codes')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // Storage'dan dosyaları sil
            if (qr) {
                const filesToDelete = [];

                // SVG dosyasının path'ini al
                if (qr.svg_path) {
                    const svgPath = new URL(qr.svg_path).pathname.split('/').pop();
                    if (svgPath) filesToDelete.push(`${qr.business_id}/${svgPath}`);
                }

                // PDF dosyasının path'ini al
                if (qr.pdf_path) {
                    const pdfPath = new URL(qr.pdf_path).pathname.split('/').pop();
                    if (pdfPath) filesToDelete.push(`${qr.business_id}/${pdfPath}`);
                }

                // Logo dosyasının path'ini al
                if (qr.logo_url) {
                    const logoPath = new URL(qr.logo_url).pathname.split('/').pop();
                    if (logoPath) filesToDelete.push(`${qr.business_id}/${logoPath}`);
                }

                // Dosyaları sil
                if (filesToDelete.length > 0) {
                    const { error: storageError } = await supabase.storage
                        .from('qr-codes')
                        .remove(filesToDelete);

                    if (storageError) throw storageError;
                }
            }

            // QR kodu veritabanından sil
            const { error: deleteError } = await supabase
                .from('qr_codes')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            return true;
        } catch (error) {
            console.error('QR kod silme hatası:', error);
            throw error;
        }
    }
}; 