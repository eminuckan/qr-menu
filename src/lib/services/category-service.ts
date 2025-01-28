import { createClient } from '@/lib/supabase/client';
import { Database, Tables } from '@/lib/types/supabase';
import { ProductWithRelations } from './product-service';

type Category = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];
type Product = Database['public']['Tables']['products']['Row'];

export type CategoryWithProducts = Tables<'categories'> & {
    products: ProductWithRelations[];
};

export class CategoryService {
    private static supabase = createClient();

    static async getCategory(id: string): Promise<CategoryWithProducts> {
        try {
            const { data: category, error: categoryError } = await this.supabase
                .from('categories')
                .select(`
                    *,
                    products (
                        *,
                        product_allergens!product_allergens_product_id_fkey (
                            allergen,
                            created_at,
                            id,
                            product_id
                        ),
                        product_tags!product_tags_product_id_fkey (
                            id,
                            product_id,
                            tag_type
                        ),
                        product_prices!product_prices_product_id_fkey (
                            *,
                            unit:units!product_prices_unit_id_fkey (
                                id,
                                name,
                                normalized_name,
                                created_at,
                                updated_at
                            )
                        ),
                        product_images!product_images_product_id_fkey (
                            *
                        )
                    )
                `)
                .eq('id', id)
                .single();

            if (categoryError) {
                console.error('Kategori getirme hatası:', categoryError);
                throw categoryError;
            }
            if (!category) {
                console.error('Kategori bulunamadı:', id);
                throw new Error('Kategori bulunamadı');
            }

            return category as unknown as CategoryWithProducts;
        } catch (error) {
            console.error('CategoryService.getCategory hatası:', error);
            throw error;
        }
    }

    static async updateCategoryName(id: string, name: string): Promise<void> {
        const { error } = await this.supabase
            .from('categories')
            .update({ name })
            .eq('id', id);

        if (error) throw error;
    }

    static async updateCategoryImage(id: string, imageUrl: string): Promise<void> {
        const { error } = await this.supabase
            .from('categories')
            .update({ cover_image: imageUrl })
            .eq('id', id);

        if (error) throw error;
    }

    static async deleteCategory(id: string): Promise<void> {
        // Önce kategoriye ait ürünleri sil
        const { error: productsError } = await this.supabase
            .from('products')
            .delete()
            .eq('category_id', id);

        if (productsError) throw productsError;

        // Sonra kategoriyi sil
        const { error } = await this.supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    static async uploadCategoryImage(file: File, categoryId: string): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${categoryId}-${Date.now()}.${fileExt}`;

        const { data, error: uploadError } = await this.supabase.storage
            .from('category-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) throw uploadError;
        if (!data?.path) throw new Error('Dosya yolu alınamadı');

        const { data: { publicUrl } } = this.supabase.storage
            .from('category-images')
            .getPublicUrl(data.path);

        await this.updateCategoryImage(categoryId, publicUrl);

        return publicUrl;
    }
} 