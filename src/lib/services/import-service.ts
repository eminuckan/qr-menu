import { createClient } from "../supabase/client";
import { Database } from "@/lib/types/supabase";

type Tables = Database['public']['Tables']

// Adisyo API Tipleri
interface AdisyoProduct {
    productName: string;
    productCode: string | null;
    productUnits: {
        unitName: string;
        prices: {
            price: number;
            orderType: number;
        }[];
        productUnitId: number;
        isDefault: boolean;
    }[];
    productId: number;
    taxRate: number;
}

interface AdisyoCategory {
    categoryName: string;
    categoryId: number;
    products: AdisyoProduct[];
}

interface AdisyoResponse {
    data: AdisyoCategory[];
    status: number;
    message: string;
}

// İçe Aktarma İstatistikleri
interface ImportStats {
    totalCategories: number;
    importedCategories: number;
    updatedCategories: number;
    totalProducts: number;
    importedProducts: number;
    updatedProducts: number;
    updatedPrices: number;
    failedItems: {
        categories: Array<{ name: string; error: string }>;
        products: Array<{ name: string; category: string; error: string }>;
    };
}

interface ImportProgress {
    currentCategory: string;
    currentProduct: string;
    stats: ImportStats;
}

export interface ImportContext {
    menuId: string | null;
    categoryIds: string[];
    aborted: boolean;
    paused: boolean;
}

const RATE_LIMIT_DURATION = 180;


const API_KEY = process.env.NEXT_PUBLIC_ADISYO_API_KEY;
const API_SECRET = process.env.NEXT_PUBLIC_ADISYO_API_SECRET;
const API_CONSUMER = process.env.NEXT_PUBLIC_ADISYO_API_CONSUMER;

if (!API_KEY || !API_SECRET || !API_CONSUMER) {
    throw new Error('Adisyo API bilgileri eksik. Lütfen .env dosyasını kontrol edin.');
}

export class ImportService {
    private static supabase = createClient();

    private static async findOrCreateUnit(unitName: string): Promise<string> {
        const normalizedName = unitName.toLowerCase().trim();

        const { data: existingUnit, error: searchError } = await this.supabase
            .from('units')
            .select()
            .eq('normalized_name', normalizedName)
            .single();

        if (!searchError && existingUnit) {
            return existingUnit.id;
        }

        const { data: newUnit, error: createError } = await this.supabase
            .from('units')
            .insert({
                name: unitName,
                normalized_name: normalizedName
            })
            .select()
            .single();

        if (createError) throw createError;
        if (!newUnit) throw new Error('Birim oluşturulamadı');

        return newUnit.id;
    }

    private static async compareAndUpdateProduct(
        existingProduct: Tables['products']['Row'],
        adisyoProduct: AdisyoProduct,
        categoryId: string
    ): Promise<{ updated: boolean; priceUpdated: boolean }> {
        let updated = false;
        let priceUpdated = false;

        // Temel ürün bilgilerini karşılaştır
        const updates: Partial<Tables['products']['Update']> = {};
        if (existingProduct.name !== adisyoProduct.productName) updates.name = adisyoProduct.productName;
        if (existingProduct.kdv_rate !== adisyoProduct.taxRate) updates.kdv_rate = adisyoProduct.taxRate;

        // Eğer güncellenecek alan varsa güncelle
        if (Object.keys(updates).length > 0) {
            const { error } = await this.supabase
                .from('products')
                .update(updates)
                .eq('id', existingProduct.id);

            if (error) throw error;
            updated = true;
        }

        // Fiyat kontrolü ve güncelleme
        const defaultUnit = adisyoProduct.productUnits.find(u => u.isDefault);
        if (defaultUnit) {
            const unitId = await this.findOrCreateUnit(defaultUnit.unitName);
            const price = defaultUnit.prices.find(p => p.orderType === 1)?.price || 0;

            const { data: existingPrice } = await this.supabase
                .from('product_prices')
                .select()
                .eq('product_id', existingProduct.id)
                .eq('unit_id', unitId)
                .single();

            if (existingPrice && existingPrice.price !== price) {
                const { error } = await this.supabase
                    .from('product_prices')
                    .update({ price })
                    .eq('id', existingPrice.id);

                if (error) throw error;
                priceUpdated = true;
            } else if (!existingPrice) {
                const { error } = await this.supabase
                    .from('product_prices')
                    .insert({
                        product_id: existingProduct.id,
                        unit_id: unitId,
                        price
                    });

                if (error) throw error;
                priceUpdated = true;
            }
        }

        return { updated, priceUpdated };
    }

    static async importMenuFromAdisyo(
        context: ImportContext,
        businessId: string,
        onProgress?: (progress: ImportProgress) => void
    ) {
        const stats: ImportStats = {
            totalCategories: 0,
            importedCategories: 0,
            updatedCategories: 0,
            totalProducts: 0,
            importedProducts: 0,
            updatedProducts: 0,
            updatedPrices: 0,
            failedItems: {
                categories: [],
                products: []
            }
        };

        try {
            // API'den veri çek
            const response = await fetch('https://ext.adisyo.com/api/External/v2/Products', {
                headers: {
                    'x-api-key': API_KEY || '',
                    'x-api-secret': API_SECRET || '',
                    'x-api-consumer': API_CONSUMER || ''
                }
            });

            if (!response.ok) {
                throw new Error(`API Hatası: ${response.status} ${response.statusText}`);
            }

            const adisyoData: AdisyoResponse = await response.json();
            if (adisyoData.status !== 100) {
                throw new Error(adisyoData.message || 'Geçersiz API yanıtı');
            }

            // İstatistikleri güncelle
            stats.totalCategories = adisyoData.data.length;
            stats.totalProducts = adisyoData.data.reduce((sum, cat) => sum + cat.products.length, 0);

            // Menüyü bul veya oluştur
            let menuId = context.menuId;
            if (!menuId) {
                const { data: menu, error: menuError } = await this.supabase
                    .from('menus')
                    .insert({
                        name: 'Adisyo Menü',
                        is_active: true,
                        business_id: businessId,
                        color: '#ffffff'
                    })
                    .select()
                    .single();

                if (menuError) throw menuError;
                menuId = menu.id;
                context.menuId = menuId;
            }

            // Kategorileri ve ürünleri işle
            for (const category of adisyoData.data) {
                if (context.aborted) break;

                try {
                    onProgress?.({
                        currentCategory: category.categoryName,
                        currentProduct: '',
                        stats
                    });

                    // Kategoriyi bul veya oluştur
                    const { data: existingCategory } = await this.supabase
                        .from('categories')
                        .select()
                        .eq('menu_id', menuId)
                        .eq('name', category.categoryName)
                        .single();

                    let categoryId: string;
                    if (existingCategory) {
                        categoryId = existingCategory.id;
                        stats.updatedCategories++;
                    } else {
                        const { data: newCategory, error: categoryError } = await this.supabase
                            .from('categories')
                            .insert({
                                menu_id: menuId,
                                name: category.categoryName,
                                is_active: true,
                                color: '#ffffff'
                            })
                            .select()
                            .single();

                        if (categoryError) throw categoryError;
                        categoryId = newCategory.id;
                        stats.importedCategories++;
                    }

                    context.categoryIds.push(categoryId);

                    // Ürünleri işle
                    for (const product of category.products) {
                        if (context.aborted) break;

                        try {
                            onProgress?.({
                                currentCategory: category.categoryName,
                                currentProduct: product.productName,
                                stats
                            });

                            // Ürünü bul veya oluştur
                            const { data: existingProduct } = await this.supabase
                                .from('products')
                                .select()
                                .eq('category_id', categoryId)
                                .eq('name', product.productName)
                                .single();

                            if (existingProduct) {
                                // Mevcut ürünü güncelle
                                const { updated, priceUpdated } = await this.compareAndUpdateProduct(
                                    existingProduct,
                                    product,
                                    categoryId
                                );

                                if (updated) stats.updatedProducts++;
                                if (priceUpdated) stats.updatedPrices++;
                            } else {
                                // Yeni ürün oluştur
                                const { data: newProduct, error: productError } = await this.supabase
                                    .from('products')
                                    .insert({
                                        category_id: categoryId,
                                        name: product.productName,
                                        kdv_rate: product.taxRate,
                                        is_active: true
                                    })
                                    .select()
                                    .single();

                                if (productError) throw productError;

                                // Varsayılan birim ve fiyat ekle
                                const defaultUnit = product.productUnits.find(u => u.isDefault);
                                if (defaultUnit) {
                                    const unitId = await this.findOrCreateUnit(defaultUnit.unitName);
                                    const price = defaultUnit.prices.find(p => p.orderType === 1)?.price || 0;

                                    const { error: priceError } = await this.supabase
                                        .from('product_prices')
                                        .insert({
                                            product_id: newProduct.id,
                                            unit_id: unitId,
                                            price
                                        });

                                    if (priceError) throw priceError;
                                }

                                stats.importedProducts++;
                            }
                        } catch (error) {
                            stats.failedItems.products.push({
                                name: product.productName,
                                category: category.categoryName,
                                error: error instanceof Error ? error.message : 'Bilinmeyen hata'
                            });
                        }
                    }
                } catch (error) {
                    stats.failedItems.categories.push({
                        name: category.categoryName,
                        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
                    });
                }
            }

            return {
                success: true,
                menuId,
                stats
            };

        } catch (error) {
            if (error instanceof Error && error.message.includes('rate limit')) {
                throw new Error(`API rate limit aşıldı. Lütfen ${RATE_LIMIT_DURATION} saniye bekleyin.`);
            }
            throw error;
        }
    }

    static async cleanup(context: ImportContext) {
        if (!context.menuId) return;

        const { error } = await this.supabase.rpc('cleanup_import', {
            menu_id: context.menuId,
            category_ids: context.categoryIds
        });

        if (error) throw error;
    }

    static abortImport(context: ImportContext) {
        context.aborted = true;
    }
} 
