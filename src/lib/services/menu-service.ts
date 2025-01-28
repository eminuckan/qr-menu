import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/types/supabase";
import { Menu } from "@/lib/types/menu";

type Tables = Database['public']['Tables']

export class MenuService {
    private static supabase = createClient();

    static async getMenu(id: string) {
        const { data, error } = await this.supabase
            .from('menus')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    static async getCategories(menuId: string) {
        const { data, error } = await this.supabase
            .from('categories')
            .select(`
                *,
                products (
                    id,
                    name,
                    is_active
                )
            `)
            .eq('menu_id', menuId)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data;
    }

    static async updateMenu(id: string, data: Partial<Tables['menus']['Update']>) {
        const { error } = await this.supabase
            .from('menus')
            .update(data)
            .eq('id', id);

        if (error) throw error;
    }

    static async deleteMenu(id: string) {
        const { error } = await this.supabase
            .from('menus')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    static async addCategory(data: Tables['categories']['Insert']) {
        const { data: category, error } = await this.supabase
            .from('categories')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return category;
    }

    static async updateCategoryOrder(items: Array<Partial<Tables['categories']['Update']> & Required<Pick<Tables['categories']['Update'], 'id' | 'sort_order' | 'menu_id' | 'name'>>>) {
        const { error } = await this.supabase
            .from('categories')
            .upsert(items.map(item => ({
                ...item,
                updated_at: new Date().toISOString()
            })));

        if (error) throw error;
    }

    static async updateCategoryStatus(id: string, is_active: boolean) {
        const { error } = await this.supabase
            .from('categories')
            .update({ is_active })
            .eq('id', id);

        if (error) throw error;
    }

    static async getMenusByBusinessId(businessId: string) {
        const { data, error } = await this.supabase
            .from('menus')
            .select(`
                *,
                categories (
                    *,
                    products (
                        id,
                        name,
                        is_active
                    )
                )
            `)
            .eq('business_id', businessId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data;
    }

    static async getMenuWithFullDetails(businessId: string): Promise<Menu[]> {
        const { data, error } = await this.supabase
            .from('menus')
            .select(`
                *,
                categories!menu_id (
                    *,
                    products!category_id (
                        *,
                        product_allergens!product_allergens_product_id_fkey (
                            id,
                            allergen
                        ),
                        product_tags!product_tags_product_id_fkey (
                            id,
                            tag_type
                        ),
                        product_prices!product_prices_product_id_fkey (
                            id,
                            price,
                            unit:units!product_prices_unit_id_fkey (
                                id,
                                name
                            )
                        ),
                        product_images!product_images_product_id_fkey (
                            id,
                            image_url,
                            is_cover
                        )
                    )
                )
            `)
            .eq('business_id', businessId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Menü detayları alınırken hata:', error);
            throw error;
        }

        return data as unknown as Menu[];
    }
} 
