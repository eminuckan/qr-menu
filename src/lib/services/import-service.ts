import { createClient } from "../supabase/client";
import { Database } from "@/lib/types/supabase";

type Tables = Database['public']['Tables']

// Adisyo API Tipleri
interface AdisyoProduct {
    productName: string;
    productUnits: {
        unitName: string;
        prices: {
            price: number;
            orderType: number;
        }[];
        isDefault: boolean;
    }[];
    taxRate: number;
}

interface AdisyoCategory {
    categoryName: string;
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

const RATE_LIMIT_DURATION = 180; // 3 dakika

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

        try {
            // Temel ürün bilgilerini karşılaştır
            const updates: Partial<Tables['products']['Update']> = {};

            // Sadece değişen alanları güncelle
            if (existingProduct.name !== adisyoProduct.productName) {
                console.log(`Ürün adı güncelleniyor: ${existingProduct.name} -> ${adisyoProduct.productName}`);
                updates.name = adisyoProduct.productName;
            }

            if (existingProduct.kdv_rate !== adisyoProduct.taxRate) {
                console.log(`KDV oranı güncelleniyor: ${existingProduct.kdv_rate} -> ${adisyoProduct.taxRate}`);
                updates.kdv_rate = adisyoProduct.taxRate;
            }

            // Eğer güncellenecek alan varsa güncelle
            if (Object.keys(updates).length > 0) {
                console.log(`Ürün güncelleniyor (${existingProduct.id}):`, updates);
                const { error } = await this.supabase
                    .from('products')
                    .update(updates)
                    .eq('id', existingProduct.id);

                if (error) {
                    console.error('Ürün güncelleme hatası:', error);
                    throw error;
                }
                updated = true;
            }

            // Fiyat kontrolü ve güncelleme
            const defaultUnit = adisyoProduct.productUnits.find(u => u.isDefault);
            if (defaultUnit) {
                const unitId = await this.findOrCreateUnit(defaultUnit.unitName);
                const defaultPrice = defaultUnit.prices.find(p => p.orderType === 1);
                const newPrice = defaultPrice?.price || 0;

                console.log(`Fiyat kontrolü yapılıyor - Ürün: ${existingProduct.name}, Birim: ${defaultUnit.unitName}`);

                // Mevcut fiyatları getir
                const { data: existingPrices, error: priceError } = await this.supabase
                    .from('product_prices')
                    .select('*')
                    .eq('product_id', existingProduct.id);

                if (priceError) {
                    console.error('Fiyat sorgulama hatası:', priceError);
                    throw priceError;
                }

                // Aynı birime ait fiyat var mı kontrol et
                const existingPrice = existingPrices?.find(p => p.unit_id === unitId);

                if (existingPrice) {
                    // Fiyat değişmişse güncelle
                    if (existingPrice.price !== newPrice) {
                        console.log(`Fiyat güncelleniyor - Ürün: ${existingProduct.name}`);
                        console.log(`Eski fiyat: ${existingPrice.price}, Yeni fiyat: ${newPrice}`);

                        const { error } = await this.supabase
                            .from('product_prices')
                            .update({ price: newPrice })
                            .eq('id', existingPrice.id);

                        if (error) {
                            console.error('Fiyat güncelleme hatası:', error);
                            throw error;
                        }
                        priceUpdated = true;
                    } else {
                        console.log(`Fiyat değişmemiş - Ürün: ${existingProduct.name}, Fiyat: ${newPrice}`);
                    }
                } else {
                    // Yeni fiyat ekle
                    console.log(`Yeni fiyat ekleniyor - Ürün: ${existingProduct.name}, Fiyat: ${newPrice}`);
                    const { error } = await this.supabase
                        .from('product_prices')
                        .insert({
                            product_id: existingProduct.id,
                            unit_id: unitId,
                            price: newPrice
                        });

                    if (error) {
                        console.error('Yeni fiyat ekleme hatası:', error);
                        throw error;
                    }
                    priceUpdated = true;
                }
            }

            return { updated, priceUpdated };
        } catch (error) {
            console.error('Ürün güncelleme işlemi sırasında hata:', error);
            throw error;
        }
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
                // Rate limit kontrolü
                console.log(response);
                if (response.status === 601) {
                    throw new Error(`rate_limit:${RATE_LIMIT_DURATION}`);
                }
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
                console.log('Mevcut menü ID yok, Adisyo menüsü aranıyor...');

                // Önce mevcut Adisyo menüsünü ara
                const { data: existingMenus, error: menuSearchError } = await this.supabase
                    .from('menus')
                    .select()
                    .eq('business_id', businessId);

                if (menuSearchError) {
                    console.error('Menü arama hatası:', menuSearchError);
                    throw menuSearchError;
                }

                console.log('Bulunan menüler:', existingMenus);

                // Adisyo Menü ismini normalize et ve karşılaştır
                const adisyoMenu = existingMenus?.find(menu =>
                    menu.name.toLowerCase().trim() === 'adisyo menü'
                );

                if (adisyoMenu) {
                    console.log('Mevcut Adisyo menüsü bulundu:', adisyoMenu);
                    menuId = adisyoMenu.id;
                    context.menuId = menuId;
                } else {
                    console.log('Mevcut Adisyo menüsü bulunamadı, yeni oluşturuluyor...');
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

                    if (menuError) {
                        console.error('Menü oluşturma hatası:', menuError);
                        throw menuError;
                    }

                    console.log('Yeni menü oluşturuldu:', menu);
                    menuId = menu.id;
                    context.menuId = menuId;
                }
            } else {
                console.log('Mevcut menü ID kullanılıyor:', menuId);
            }

            // Kategorileri ve ürünleri işle
            for (const category of adisyoData.data) {
                // Abort kontrolü
                if (context.aborted) {
                    console.log('Import işlemi kullanıcı tarafından iptal edildi');
                    break;
                }

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
                        // Abort kontrolü
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
            if (error instanceof Error && error.message.startsWith('rate_limit:')) {
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
