import { createClient } from "@/lib/supabase/client";
import { Business, MenuSettings } from "@/types/database";

export const menuSettingsService = {
    // İşletme oluşturma
    async createBusiness(name: string) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Kullanıcı bulunamadı");

        // Slug oluştur
        const slug = name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        // İşletme oluştur
        const { data: business, error } = await supabase
            .from('businesses')
            .insert({
                name,
                slug,
                user_id: user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Menu settings oluştur
        const { error: settingsError } = await supabase
            .from('menu_settings')
            .insert({
                business_id: business.id,
                user_id: user.id,
                business_name: name,
                business_name_font: "inter",
                button_font: "inter",
                welcome_color: "#000000",
                button_text: "Menüyü Görüntüle",
                button_color: "#000000",
                button_text_color: "#FFFFFF",
                background_type: "image"
            });

        if (settingsError) throw settingsError;

        return business;
    },

    async checkBusiness() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data } = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', user.id)
            .single();

        return data;
    },

    // Menu ayarlarını getir
    async getMenuSettings(businessId: string) {
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from('menu_settings')
                .select(`
                    *,
                    businesses (
                        id,
                        name
                    )
                `)
                .eq('business_id', businessId)
                .single();

            // Eğer kayıt bulunamazsa varsayılan değerleri dön
            if (error?.code === 'PGRST116') {
                return {
                    business_id: businessId,
                    welcome_title: "",
                    welcome_title_font: "inter",
                    welcome_text: "Hoş geldiniz",
                    welcome_color: "#000000",
                    button_text: "Menüyü Görüntüle",
                    button_font: "inter",
                    button_color: "#000000",
                    button_text_color: "#FFFFFF",
                    background_type: "image",
                    background_color: "",
                    background_url: "",
                    logo_url: "",
                    loader_url: ""
                };
            }

            if (error) throw error;

            return {
                ...data,
                welcome_title: data.welcome_title || "",
                welcome_title_font: data.welcome_title_font || "inter",
                welcome_text: data.welcome_text || "Hoş geldiniz",
                welcome_color: data.welcome_color || "#000000",
                button_text: data.button_text || "Menüyü Görüntüle",
                button_font: data.button_font || "inter",
                button_color: data.button_color || "#000000",
                button_text_color: data.button_text_color || "#FFFFFF",
                background_type: data.background_type || "image",
                background_color: data.background_color || "",
                background_url: data.background_url || "",
                logo_url: data.logo_url || "",
                loader_url: data.loader_url || ""
            };
        } catch (error) {
            console.error('Get menu settings error:', error);
            throw error;
        }
    },

    // Menu ayarlarını güncelle
    async updateMenuSettings(businessId: string, settings: Partial<MenuSettings>) {
        const supabase = createClient();

        try {
            // Önce kaydın var olup olmadığını kontrol et
            const { data: existingSettings } = await supabase
                .from('menu_settings')
                .select('id')
                .eq('business_id', businessId)
                .single();

            let result;

            if (existingSettings) {
                // Kayıt varsa güncelle
                result = await supabase
                    .from('menu_settings')
                    .update({
                        ...settings,
                        business_id: businessId // business_id'yi mutlaka ekle
                    })
                    .eq('business_id', businessId)
                    .select()
                    .single();
            } else {
                // Kayıt yoksa yeni kayıt oluştur
                result = await supabase
                    .from('menu_settings')
                    .insert({
                        ...settings,
                        business_id: businessId
                    })
                    .select()
                    .single();
            }

            if (result.error) {
                console.error('Supabase operation error:', JSON.stringify(result.error, null, 2));
                throw result.error;
            }

            return result.data;
        } catch (error) {
            console.error('Menu settings operation error:', {
                error,
                businessId,
                settings: JSON.stringify(settings, null, 2)
            });
            throw error;
        }
    },

    // Logo yükleme
    async uploadFile(businessId: string, file: File, type: string, bucket: string) {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${businessId}-${type}-${Date.now()}.${fileExt}`;

        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type === 'application/json'
                        ? 'application/json'
                        : file.type
                });

            if (error) {
                console.error('Upload error:', error);
                // Dosya tipine göre hata mesajı
                if (file.type === 'application/json' || file.type === 'image/gif') {
                    throw new Error('Animasyon dosyası yüklenirken bir hata oluştu');
                } else if (type === 'background') {
                    throw new Error('Fotoğraf yüklenirken bir hata oluştu');
                } else {
                    throw new Error('Logo yüklenirken bir hata oluştu');
                }
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Upload error:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Dosya yüklenirken bir hata oluştu');
        }
    }
}; 