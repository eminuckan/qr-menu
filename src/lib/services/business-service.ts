import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/types/supabase';
import { Tables } from "../types/supabase";
import { BusinessFormValues } from "../validations/business";
import slugify from "slugify";

type Business = Database['public']['Tables']['businesses']['Row'];
type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];
type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];

export const BusinessService = {
    async getBusinesses() {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('businesses')
            .select(`
                *,
                business_users (
                    *
                )
            `);

        if (error) throw error;
        return data;
    },

    async createBusiness(values: BusinessFormValues) {
        const supabase = createClient();

        // Slug oluştur
        const slug = slugify(values.name, {
            lower: true,
            strict: true,
            locale: 'tr'
        });

        // Önce business'ı oluştur
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .insert({
                name: values.name,
                slug: values.slug || slug
            })
            .select()
            .single();

        if (businessError) throw businessError;

        // Kullanıcı bilgilerini al
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Kullanıcı bulunamadı');

        // Business user ilişkisini oluştur
        const { error: relationError } = await supabase
            .from('business_users')
            .insert({
                business_id: business.id,
                user_id: user.id,
                role: 'owner'
            });

        if (relationError) throw relationError;

        return business;
    },

    async updateBusiness(id: string, values: BusinessFormValues) {
        const supabase = createClient();

        // Slug oluştur
        const slug = slugify(values.name, {
            lower: true,
            strict: true,
            locale: 'tr'
        });

        const { data, error } = await supabase
            .from('businesses')
            .update({
                name: values.name,
                slug: values.slug || slug,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteBusiness(id: string) {
        const supabase = createClient();

        const { error } = await supabase
            .from('businesses')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async getBusinessBySlug(slug: string) {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('businesses')
            .select(`
                *,
                business_users (
                    *
                )
            `)
            .eq('slug', slug)
            .single();

        if (error) throw error;
        return data;
    }
}; 