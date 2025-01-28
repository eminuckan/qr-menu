import { createClient } from '@/lib/supabase/client';
import { Tables, Enums, InsertTables, UpdateTables } from '@/lib/types/database';
import { Database } from "@/lib/types/supabase";
import { ProductFormValues } from "@/lib/validations/product";
import { TablesInsert, TablesUpdate } from "@/lib/types/supabase";

export type ProductRow = Tables<'products'>;

// Nested sorgu tipi
const productQuery = createClient()
  .from('products')
  .select(`
    *,
    product_allergens(*), 
    product_tags(*),
    product_prices(*),
    product_images(*)
  `);

export type ProductWithRelations = Tables<'products'> & {
  product_allergens: Tables<'product_allergens'>[];
  product_tags: Tables<'product_tags'>[];
  product_prices: (Tables<'product_prices'> & {
    unit: Tables<'units'>;
  })[];
  product_images: Tables<'product_images'>[];
};

interface CreateProductData extends InsertTables<'products'> {
  allergens?: Enums<'allergen_type'>[];
  tags?: Enums<'product_tag_type'>[];
  prices: InsertTables<'product_prices'>[];
  color?: string;
  calories?: number;
  preparing_time?: number;
}

interface UpdateProductData extends UpdateTables<'products'> {
  allergens?: Enums<'allergen_type'>[];
  tags?: Enums<'product_tag_type'>[];
  prices?: UpdateTables<'product_prices'>[];
  color?: string;
  calories?: number;
  preparing_time?: number;
}

export class ProductService {
  private static supabase = createClient();

  static async createProduct(data: CreateProductData): Promise<ProductRow> {
    const { allergens, tags, prices, color, calories, preparing_time, ...productData } = data;

    const { data: product, error: productError } = await this.supabase
      .from('products')
      .insert({
        ...productData,
        color,
        calories,
        preparing_time
      })
      .select()
      .single();

    if (productError) throw productError;
    if (!product) throw new Error('Ürün oluşturulamadı');

    // Fiyatlar
    if (prices && prices.length > 0) {
      const pricesData = prices.map(price => ({
        ...price,
        product_id: product.id
      }));

      const { error: priceError } = await this.supabase
        .from('product_prices')
        .insert(pricesData);

      if (priceError) throw priceError;
    }

    // Alerjenler
    if (allergens && allergens.length > 0) {
      const allergensData: InsertTables<'product_allergens'>[] = allergens.map(allergen => ({
        product_id: product.id,
        allergen
      }));

      const { error: allergensError } = await this.supabase
        .from('product_allergens')
        .insert(allergensData);

      if (allergensError) throw allergensError;
    }

    // Etiketler
    if (tags && tags.length > 0) {
      const tagsData: InsertTables<'product_tags'>[] = tags.map(tag_type => ({
        product_id: product.id,
        tag_type
      }));

      const { error: tagsError } = await this.supabase
        .from('product_tags')
        .insert(tagsData);

      if (tagsError) throw tagsError;
    }

    return product;
  }

  static async updateProduct(productId: string, data: ProductFormValues): Promise<Tables<'products'>> {
    const { data: updatedProduct, error } = await this.supabase
      .from("products")
      .update({
        name: data.name,
        description: data.description,
        color: data.color,
        calories: data.calories,
        preparing_time: data.preparing_time,
        is_active: data.is_active,
        sort_order: data.sort_order,
        category_id: data.category_id,
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) throw error;
    if (!updatedProduct) throw new Error("Ürün güncellenemedi");

    // Allerjen ilişkilerini güncelle
    if (data.allergens) {
      await this.updateProductAllergens(productId, data.allergens);
    }

    // Etiket ilişkilerini güncelle
    if (data.tags) {
      await this.updateProductTags(productId, data.tags);
    }

    // Fiyat ilişkilerini güncelle
    if (data.prices) {
      await this.updateProductPrices(productId, data.prices);
    }

    return updatedProduct;
  }

  private static async updateProductAllergens(productId: string, allergens: Enums<'allergen_type'>[]) {
    // Önce mevcut allerjen ilişkilerini sil
    await this.supabase
      .from("product_allergens")
      .delete()
      .eq("product_id", productId);

    // Yeni allerjen ilişkilerini ekle
    if (allergens.length > 0) {
      const allergenData: InsertTables<'product_allergens'>[] = allergens.map(allergen => ({
        product_id: productId,
        allergen: allergen
      }));

      const { error } = await this.supabase
        .from("product_allergens")
        .insert(allergenData);

      if (error) throw error;
    }
  }

  private static async updateProductTags(productId: string, tags: Enums<'product_tag_type'>[]) {
    // Önce mevcut etiket ilişkilerini sil
    await this.supabase
      .from("product_tags")
      .delete()
      .eq("product_id", productId);

    // Yeni etiket ilişkilerini ekle
    if (tags.length > 0) {
      const tagData: InsertTables<'product_tags'>[] = tags.map(tag => ({
        product_id: productId,
        tag_type: tag
      }));

      const { error } = await this.supabase
        .from("product_tags")
        .insert(tagData);

      if (error) throw error;
    }
  }

  private static async updateProductPrices(productId: string, prices: { price: number; unit_id: string }[]) {
    // Önce mevcut fiyat ilişkilerini sil
    await this.supabase
      .from("product_prices")
      .delete()
      .eq("product_id", productId);

    // Yeni fiyat ilişkilerini ekle
    if (prices.length > 0) {
      const priceData: InsertTables<'product_prices'>[] = prices.map(price => ({
        product_id: productId,
        unit_id: price.unit_id,
        price: price.price
      }));

      const { error } = await this.supabase
        .from("product_prices")
        .insert(priceData);

      if (error) throw error;
    }
  }

  static async deleteProducts(productIds: string[]): Promise<void> {
    // İlişkili kayıtları sil
    await Promise.all([
      this.supabase.from('product_allergens').delete().in('product_id', productIds),
      this.supabase.from('product_tags').delete().in('product_id', productIds),
      this.supabase.from('product_prices').delete().in('product_id', productIds),
      this.supabase.from('product_images').delete().in('product_id', productIds)
    ]);

    // Ürünü sil
    const { error } = await this.supabase
      .from('products')
      .delete()
      .in('id', productIds);

    if (error) throw error;
  }

  static async updateProductStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  }

  static async getProductsByCategory(categoryId: string): Promise<ProductWithRelations[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        product_allergens!inner (
          allergen,
          created_at,
          id,
          product_id
        ),
        product_tags!inner (
          id,
          product_id,
          tag_type
        ),
        product_prices!inner (
          *,
          unit:units!inner (*)
        ),
        product_images!inner (*)
      `)
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as ProductWithRelations[];
  }

  static async deleteProductImage(imageId: string, imageUrl: string): Promise<void> {
    const fileName = imageUrl.split('/').pop();
    if (!fileName) throw new Error("Dosya adı bulunamadı");

    // Önce storage'dan dosyayı sil
    const { error: storageError } = await this.supabase.storage
      .from('product-images')
      .remove([fileName]);

    if (storageError) throw storageError;

    // Sonra veritabanından kaydı sil
    const { error: dbError } = await this.supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (dbError) throw dbError;
  }

  static async uploadProductImage(
    productId: string,
    file: File,
    isCover: boolean,
    sortOrder: number = 0
  ): Promise<Tables<'product_images'>> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = this.supabase.storage
      .from('product-images')
      .getPublicUrl(uploadData.path);

    const { data: imageData, error: insertError } = await this.supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url: publicUrl,
        is_cover: isCover,
        sort_order: sortOrder
      } as TablesInsert<'product_images'>)
      .select()
      .single();

    if (insertError) throw insertError;
    if (!imageData) throw new Error("Resim kaydı oluşturulamadı");

    return imageData;
  }

  static async updateProductImageCover(imageId: string, isCover: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('product_images')
      .update({ is_cover: isCover } as TablesUpdate<'product_images'>)
      .eq('id', imageId);

    if (error) throw error;
  }

  static async addUnit(name: string): Promise<Tables<'units'>> {
    const normalizedName = name.toLowerCase().trim();

    // Önce aynı isimde birim var mı kontrol et
    const { data: existingUnit } = await this.supabase
      .from('units')
      .select()
      .eq('normalized_name', normalizedName)
      .single();

    if (existingUnit) {
      return existingUnit;
    }

    // Yeni birim oluştur
    const { data: newUnit, error } = await this.supabase
      .from('units')
      .insert({
        name: name.trim(),
        normalized_name: normalizedName
      })
      .select()
      .single();

    if (error) throw error;
    if (!newUnit) throw new Error('Birim oluşturulamadı');

    return newUnit;
  }
} 