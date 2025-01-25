import { createClient } from "../supabase/client";

export const MenuService = {
    async deleteMenu(menuId: string) {
        const supabase = createClient();

        try {
            const { data: categories, error: categoriesError } = await supabase
                .from('categories')
                .select('id, cover_image')
                .eq('menu_id', menuId);

            if (categoriesError) throw categoriesError;

            if (categories?.length) {
                const { data: products, error: productsError } = await supabase
                    .from('products')
                    .select('id')
                    .in('category_id', categories.map(c => c.id));

                if (productsError) throw productsError;

                if (products?.length) {
                    const { data: productImages, error: imagesError } = await supabase
                        .from('product_images')
                        .select('image_url')
                        .in('product_id', products.map(p => p.id));

                    if (imagesError) throw imagesError;

                    if (productImages?.length) {
                        const fileNames = productImages
                            .map(img => img.image_url?.split('/').pop())
                            .filter(Boolean) as string[];

                        if (fileNames.length > 0) {
                            const { error: storageError } = await supabase.storage
                                .from('product-images')
                                .remove(fileNames);

                            if (storageError) throw storageError;
                        }
                    }
                }


                const categoryImages = categories
                    .map(cat => cat.cover_image?.split('/').pop())
                    .filter(Boolean) as string[];

                if (categoryImages.length > 0) {
                    const { error: categoryImageError } = await supabase.storage
                        .from('category-images')
                        .remove(categoryImages);

                    if (categoryImageError) throw categoryImageError;
                }
            }

            const { error: deleteError } = await supabase
                .from('menus')
                .delete()
                .eq('id', menuId);

            if (deleteError) throw deleteError;

            return true;
        } catch (error) {
            console.error('Menü silme hatası:', error);
            throw new Error(error instanceof Error ? error.message : 'Menü silinirken bir hata oluştu');
        }
    }
}; 