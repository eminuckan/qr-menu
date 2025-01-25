import { createClient } from "../supabase/client";
import { ProductFormValues } from "../validations/product";

export const ProductService = {
  async createProduct(data: ProductFormValues, categoryId: string) {
    const supabase = createClient();

    try {
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: data.name,
          color: data.color,
          category_id: categoryId,
          calories: data.calories,
          preparing_time: data.preparing_time,
          description: data.description,
          is_active: true,
          sort_order: 0,
        })
        .select()
        .single();

      if (productError) throw productError;

      const { error: priceError } = await supabase
        .from("product_prices")
        .insert({
          product_id: product.id,
          unit_id: data.unit_id,
          price: data.price
        });

      if (priceError) throw priceError;

      if (data.allergens?.length) {
        const { error: allergenError } = await supabase
          .from("product_allergens")
          .insert(
            data.allergens.map(allergen => ({
              product_id: product.id,
              allergen
            }))
          );

        if (allergenError) throw allergenError;
      }

      if (data.tags?.length) {
        const { error: tagError } = await supabase
          .from("product_tags")
          .insert(
            data.tags.map(tag => ({
              product_id: product.id,
              tag_type: tag
            }))
          );

        if (tagError) throw tagError;
      }

      return product;
    } catch (error) {
      console.error('Ürün ekleme hatası:', error);
      throw error;
    }
  },

  async updateProduct(productId: string, data: ProductFormValues) {
    const supabase = createClient();

    try {
      const { data: existingProduct, error: checkError } = await supabase
        .from("products")
        .select("id")
        .eq("id", productId)
        .single();

      if (checkError || !existingProduct) {
        throw new Error("Güncellenecek ürün bulunamadı");
      }

      const { error: productError } = await supabase
        .from("products")
        .update({
          name: data.name,
          color: data.color,
          calories: data.calories,
          preparing_time: data.preparing_time,
          description: data.description
        })
        .eq('id', productId);

      if (productError) throw productError;

      await supabase
        .from("product_prices")
        .delete()
        .eq('product_id', productId);

      const { error: priceError } = await supabase
        .from("product_prices")
        .insert({
          product_id: productId,
          unit_id: data.unit_id,
          price: data.price
        });

      if (priceError) throw priceError;

      await supabase
        .from("product_allergens")
        .delete()
        .eq('product_id', productId);

      if (data.allergens?.length) {
        const { error: allergenError } = await supabase
          .from("product_allergens")
          .insert(
            data.allergens.map(allergen => ({
              product_id: productId,
              allergen
            }))
          );

        if (allergenError) throw allergenError;
      }

      await supabase
        .from("product_tags")
        .delete()
        .eq('product_id', productId);

      if (data.tags?.length) {
        const { error: tagError } = await supabase
          .from("product_tags")
          .insert(
            data.tags.map(tag => ({
              product_id: productId,
              tag_type: tag
            }))
          );

        if (tagError) throw tagError;
      }

      return true;
    } catch (error) {
      console.error('Ürün güncelleme hatası:', error);
      throw error;
    }
  },

  async deleteProducts(productIds: string[]) {
    const supabase = createClient();

    try {
      if (!productIds.length || !productIds.every(id => typeof id === 'string' && id.length > 0)) {
        throw new Error('Geçersiz ürün ID\'leri');
      }

      const { data: images, error: fetchError } = await supabase
        .from('product_images')
        .select('image_url')
        .in('product_id', productIds);

      if (fetchError) throw fetchError;

      if (images && images.length > 0) {
        const fileNames = images
          .map(img => img.image_url?.split('/').pop())
          .filter(Boolean) as string[];

        if (fileNames.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('product-images')
            .remove(fileNames);

          if (storageError) throw storageError;
        }
      }

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', productIds);

      if (deleteError) throw deleteError;

      return true;
    } catch (error) {
      console.error('Ürün silme hatası:', error);
      throw new Error(error instanceof Error ? error.message : 'Ürünler silinirken bir hata oluştu');
    }
  },

  async addUnit(unitName: string) {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("units")
        .insert({
          name: unitName,
          normalized_name: unitName.toLowerCase().trim()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Birim ekleme hatası:', error);
      throw error;
    }
  }
};
