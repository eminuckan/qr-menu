import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/types/supabase';

type Tables = Database['public']['Tables']

export class MenuSettingsService {
    private static supabase = createClient();

    static async getMenuSettings(businessId: string): Promise<Tables['menu_settings']['Row']> {
        const { data, error } = await this.supabase
            .from('menu_settings')
            .select('*')
            .eq('business_id', businessId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Eğer kayıt bulunamazsa, varsayılan ayarları oluştur
                return this.createDefaultSettings(businessId);
            }
            throw error;
        }

        return data;
    }

    static async createDefaultSettings(businessId: string): Promise<Tables['menu_settings']['Row']> {
        const defaultSettings: Tables['menu_settings']['Insert'] = {
            business_id: businessId,
            welcome_title: "",
            welcome_text: "Hoş geldiniz",
            welcome_color: "#000000",
            button_text: "Menüyü İncele",
            button_color: "#000000",
            button_text_color: "#FFFFFF",
            background_type: "image",
            background_color: "",
            background_url: "",
            logo_url: "",
            loader_url: "",
        };

        const { data, error } = await this.supabase
            .from('menu_settings')
            .insert(defaultSettings)
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error('Menu settings could not be created');

        return data;
    }

    static async updateMenuSettings(businessId: string, settings: Partial<Tables['menu_settings']['Update']>): Promise<Tables['menu_settings']['Row']> {
        const { data, error } = await this.supabase
            .from('menu_settings')
            .update(settings)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error('Menu settings could not be updated');

        return data;
    }

    static async uploadFile(
        businessId: string,
        file: File,
        type: string,
        bucket: string
    ): Promise<string> {
        const fileExt = file.name.split(".").pop();
        const fileName = `${businessId}/${type}-${Date.now()}.${fileExt}`;

        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: "3600",
                upsert: true,
            });

        if (error) throw error;

        const { data: { publicUrl } } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return publicUrl;
    }
} 