import { createClient } from "../supabase/client";

export const CategoryService = {
    async deleteCategory(categoryId: string) {
        const supabase = createClient();

        try {
            // 1. Kategoriye ait ürünlerin fotoğraflarını al
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id')
                .eq('category_id', categoryId);

            if (productsError) throw productsError;

            if (products?.length) {
                // 2. Ürünlerin fotoğraflarını al
                const { data: productImages, error: imagesError } = await supabase
                    .from('product_images')
                    .select('image_url')
                    .in('product_id', products.map(p => p.id));

                if (imagesError) throw imagesError;

                // 3. Storage'dan ürün fotoğraflarını sil
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

            // 4. Kategori fotoğrafını sil
            const { data: category, error: categoryError } = await supabase
                .from('categories')
                .select('cover_image')
                .eq('id', categoryId)
                .single();

            if (categoryError) throw categoryError;

            if (category?.cover_image) {
                const fileName = category.cover_image.split('/').pop();
                if (fileName) {
                    await supabase.storage
                        .from('category-images')
                        .remove([fileName]);
                }
            }

            // 5. Kategoriyi sil (cascade ile ilişkili tüm veriler silinecek)
            const { error: deleteError } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

            if (deleteError) throw deleteError;

            return true;
        } catch (error) {
            console.error('Kategori silme hatası:', error);
            throw new Error(error instanceof Error ? error.message : 'Kategori silinirken bir hata oluştu');
        }
    }
}; 