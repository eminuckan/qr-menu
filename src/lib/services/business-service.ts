import { createClient } from "../supabase/client";
import { BusinessFormValues } from "../validations/business";
import slugify from "slugify";

export const BusinessService = {
    async hasAnyBusiness() {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.log('No user found');
                return false;
            }

            const businesses = await this.getBusinesses();
            console.log('Businesses:', businesses); // Debug için log ekleyelim

            const hasBusiness = businesses.length > 0;
            console.log('Has business:', hasBusiness); // Debug için log ekleyelim

            return hasBusiness;
        } catch (error) {
            console.error('Error checking businesses:', error);
            return false;
        }
    },

    async createBusiness(values: BusinessFormValues) {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("Kullanıcı bulunamadı");

            // Slug oluştur ve benzersiz olmasını sağla
            let slug = slugify(values.name, {
                lower: true,
                strict: true,
                trim: true
            });

            // Slug'ın benzersiz olup olmadığını kontrol et
            const { count: slugExists } = await supabase
                .from('businesses')
                .select('*', { count: 'exact', head: true })
                .eq('slug', slug);

            if (slugExists) {
                // Eğer slug varsa sonuna random bir string ekle
                slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
            }

            // İşletme oluştur
            const { data: business, error: businessError } = await supabase
                .from('businesses')
                .insert({
                    name: values.name,
                    slug
                })
                .select()
                .single();

            if (businessError) {
                console.error('Business creation error:', businessError);
                throw new Error(businessError.message);
            }

            if (!business) {
                throw new Error("İşletme oluşturulamadı");
            }

            // Business user ilişkisini oluştur
            const { error: relationError } = await supabase
                .from('business_users')
                .insert({
                    business_id: business.id,
                    user_id: user.id,
                    role: 'owner'
                });

            if (relationError) {
                console.error('Business user relation error:', relationError);
                // İşletmeyi sil
                await supabase
                    .from('businesses')
                    .delete()
                    .eq('id', business.id);
                throw new Error(relationError.message);
            }

            return business;
        } catch (error) {
            console.error('Business service error:', error);
            throw error;
        }
    },

    async getBusinesses() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Kullanıcı bulunamadı");

        const { data, error } = await supabase
            .from('businesses')
            .select(`
                id,
                name,
                slug,
                created_at,
                updated_at,
                business_users!inner (
                    role
                )
            `)
            .eq('business_users.user_id', user.id);

        if (error) throw error;
        return data;
    },

    async updateBusiness(id: string, values: BusinessFormValues) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Kullanıcı bulunamadı");

        // Slug oluştur
        const slug = slugify(values.name, {
            lower: true,
            strict: true,
            trim: true
        });

        const { data, error } = await supabase
            .from('businesses')
            .update({
                name: values.name,
                slug,
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

        try {
            // Önce storage'daki dosyaları sil
            const { data: productImages } = await supabase
                .from('product_images')
                .select('image_url')
                .eq('products.categories.menus.business_id', id);

            if (productImages) {
                for (const image of productImages) {
                    if (image.image_url) {
                        const path = image.image_url.split('/').pop();
                        if (path) {
                            await supabase.storage
                                .from('product-images')
                                .remove([path]);
                        }
                    }
                }
            }

            // Kategori görsellerini sil
            const { data: categories } = await supabase
                .from('categories')
                .select('cover_image')
                .eq('menus.business_id', id);

            if (categories) {
                for (const category of categories) {
                    if (category.cover_image) {
                        const path = category.cover_image.split('/').pop();
                        if (path) {
                            await supabase.storage
                                .from('category-images')
                                .remove([path]);
                        }
                    }
                }
            }

            // Menu ayarları görsellerini sil
            const { data: menuSettings } = await supabase
                .from('menu_settings')
                .select('logo_url, background_url')
                .eq('business_id', id);

            if (menuSettings) {
                for (const settings of menuSettings) {
                    if (settings.logo_url) {
                        const path = settings.logo_url.split('/').pop();
                        if (path) {
                            await supabase.storage
                                .from('menu-settings')
                                .remove([path]);
                        }
                    }
                    if (settings.background_url) {
                        const path = settings.background_url.split('/').pop();
                        if (path) {
                            await supabase.storage
                                .from('menu-settings')
                                .remove([path]);
                        }
                    }
                }
            }

            // İşletmeyi sil (cascade ile diğer veriler otomatik silinecek)
            const { error } = await supabase
                .from('businesses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting business:', error);
            throw error;
        }
    }
}; 