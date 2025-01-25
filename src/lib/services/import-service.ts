import { createClient } from "../supabase/client";

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

interface ImportStats {
    totalCategories: number;
    importedCategories: number;
    totalProducts: number;
    importedProducts: number;
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

const RATE_LIMIT_DURATION = 180; // saniye cinsinden
let lastRequestTime: number | null = null;

export const ImportService = {
    async importMenuFromAdisyo(
        context: ImportContext,
        onProgress?: (progress: ImportProgress) => void
    ) {
        const supabase = createClient();
        let abortController = new AbortController();
        let isCleaningUp = false; // Cleanup durumunu takip etmek için

        const checkAbort = async () => {
            if (context.aborted && !isCleaningUp) {
                console.log("İçe aktarma iptal edildi");
                abortController.abort();
                isCleaningUp = true;
                await cleanup();
                return true;
            }
            return false;
        };

        const cleanup = async () => {
            if (!context.menuId || isCleaningUp) return; // Zaten temizlik yapılıyorsa çık

            try {
                console.log("Cleanup başlatılıyor...");

                // Tüm silme işlemlerini tek bir transaction içinde yap
                const { error } = await supabase.rpc('cleanup_import', {
                    menu_id: context.menuId,
                    category_ids: context.categoryIds
                });

                if (error) {
                    console.error("Cleanup sırasında hata:", error);
                    return;
                }

                console.log("Cleanup tamamlandı");
            } catch (error) {
                console.error("Cleanup sırasında hata:", error);
            } finally {
                isCleaningUp = false;
            }
        };

        const stats: ImportStats = {
            totalCategories: 0,
            importedCategories: 0,
            totalProducts: 0,
            importedProducts: 0,
            failedItems: {
                categories: [],
                products: []
            }
        };

        try {
            if (await checkAbort()) return { success: false, aborted: true, stats };

            // Önce "Adisyo Menü" var mı kontrol et
            const { data: existingMenu } = await supabase
                .from('menus')
                .select('*')
                .eq('name', 'Adisyo Menü')
                .single();

            if (await checkAbort()) return { success: false, aborted: true, stats };

            // API isteği öncesi zamanı kaydet
            lastRequestTime = Date.now();

            // API'den veriyi al
            const response = await fetch('https://ext.adisyo.com/api/External/v2/Products', {
                headers: {
                    'x-api-key': '25b80b3556ca3a15353dd2fd312062fad27adcf5a1de51b75bdadea1fa8214ab',
                    'x-api-secret': 'e2c87e86-268f-4b47-98ee-d457cdda3d3d',
                    'x-api-consumer': 'lavincafe'
                },
                signal: abortController.signal // Abort controller'ı ekle
            });

            console.log('API yanıt durumu:', response.status);
            console.log('API yanıt başlıkları:', Object.fromEntries(response.headers.entries()));

            const responseData = await response.json();
            console.log('API yanıtı:', responseData);

            // Rate limit kontrolü (429 veya status 601)
            if (response.status === 429 || responseData.status === 601) {
                lastRequestTime = Date.now(); // Rate limit yenileme zamanını güncelle
                throw new Error(`API rate limit aşıldı. Lütfen ${RATE_LIMIT_DURATION} saniye bekleyin ve tekrar deneyin.`);
            }

            if (!response.ok) {
                console.error('API hata detayları:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: responseData
                });
                throw new Error(`Adisyo API'den veri alınamadı: ${response.status} ${response.statusText}`);
            }

            const adisyoData: AdisyoResponse = responseData;
            if (adisyoData.status !== 100) {
                console.error('API geçersiz yanıt:', adisyoData);
                throw new Error(adisyoData.message || 'Adisyo API\'den geçersiz yanıt');
            }

            // İstatistikleri hazırla
            stats.totalCategories = adisyoData.data.length;
            stats.totalProducts = adisyoData.data.reduce((sum, category) => sum + category.products.length, 0);

            let menuId: string;
            if (existingMenu) {
                menuId = existingMenu.id;
                context.menuId = menuId;
            } else {
                // Yeni menü oluştur
                const { data: menu, error: menuError } = await supabase
                    .from('menus')
                    .insert({
                        name: 'Adisyo Menü',
                        is_active: true,
                        sort_order: 0,
                        color: '#ffffff'
                    })
                    .select()
                    .single();

                if (menuError) throw new Error('Menü oluşturulurken hata: ' + menuError.message);
                menuId = menu.id;
                context.menuId = menuId;
            }

            // Kategorileri ve ürünleri içe aktar
            for (const [categoryIndex, category] of adisyoData.data.entries()) {
                if (await checkAbort()) return { success: false, aborted: true, stats };

                try {
                    onProgress?.({
                        currentCategory: category.categoryName,
                        currentProduct: '',
                        stats
                    });

                    // Her kategori işlemi öncesi kontrol
                    if (await checkAbort()) return { success: false, aborted: true, stats };

                    // Mevcut kategoriyi kontrol et
                    const { data: existingCategory } = await supabase
                        .from('categories')
                        .select('*')
                        .eq('menu_id', menuId)
                        .eq('name', category.categoryName)
                        .single();

                    let categoryId: string;
                    if (existingCategory) {
                        // Kategoriyi güncelle
                        const { data: updatedCategory, error: updateError } = await supabase
                            .from('categories')
                            .update({
                                sort_order: categoryIndex,
                            })
                            .eq('id', existingCategory.id)
                            .select()
                            .single();

                        if (updateError) throw new Error(updateError.message);
                        categoryId = existingCategory.id;
                    } else {
                        // Yeni kategori oluştur
                        const { data: newCategory, error: categoryError } = await supabase
                            .from('categories')
                            .insert({
                                menu_id: menuId,
                                name: category.categoryName,
                                is_active: true,
                                sort_order: categoryIndex,
                                color: '#ffffff'
                            })
                            .select()
                            .single();

                        if (categoryError) throw new Error(categoryError.message);
                        categoryId = newCategory.id;
                    }

                    stats.importedCategories++;
                    context.categoryIds.push(categoryId);

                    // Ürünleri içe aktar
                    for (const [productIndex, product] of category.products.entries()) {
                        if (await checkAbort()) return { success: false, aborted: true, stats };

                        try {
                            onProgress?.({
                                currentCategory: category.categoryName,
                                currentProduct: product.productName,
                                stats
                            });

                            // Her ürün işlemi öncesi kontrol
                            if (await checkAbort()) return { success: false, aborted: true, stats };

                            // Mevcut ürünü kontrol et
                            const { data: existingProduct } = await supabase
                                .from('products')
                                .select('*')
                                .eq('category_id', categoryId)
                                .eq('name', product.productName)
                                .single();

                            let productId: string;
                            if (existingProduct) {
                                // Ürünü güncelle
                                const { data: updatedProduct, error: updateError } = await supabase
                                    .from('products')
                                    .update({
                                        kdv_rate: product.taxRate,
                                        sort_order: productIndex,
                                    })
                                    .eq('id', existingProduct.id)
                                    .select()
                                    .single();

                                if (updateError) throw new Error(updateError.message);
                                productId = existingProduct.id;
                            } else {
                                // Yeni ürün oluştur
                                const { data: newProduct, error: productError } = await supabase
                                    .from('products')
                                    .insert({
                                        category_id: categoryId,
                                        name: product.productName,
                                        description: null,
                                        color: '#ffffff',
                                        kdv_rate: product.taxRate,
                                        calories: null,
                                        preparing_time: null,
                                        is_active: true,
                                        sort_order: productIndex
                                    })
                                    .select()
                                    .single();

                                if (productError) throw new Error(productError.message);
                                productId = newProduct.id;
                            }

                            // Varsayılan birimi ve fiyatı güncelle/ekle
                            const defaultUnit = product.productUnits.find(u => u.isDefault);
                            if (defaultUnit) {
                                try {
                                    console.log(`Unit işlemi başlıyor: ${defaultUnit.unitName}`);
                                    let unitId = await this._findOrCreateUnit(defaultUnit.unitName);

                                    // OrderType 1 olan fiyatı al (yoksa 0)
                                    const price = defaultUnit.prices.find(p => p.orderType === 1)?.price || 0;
                                    console.log(`Fiyat ayarlanıyor: ${price} - Unit: ${defaultUnit.unitName}`);

                                    // Mevcut fiyatı kontrol et
                                    const { data: existingPrice } = await supabase
                                        .from('product_prices')
                                        .select('*')
                                        .eq('product_id', productId)
                                        .eq('unit_id', unitId)
                                        .single();

                                    if (existingPrice) {
                                        // Fiyat değişmişse güncelle
                                        if (existingPrice.price !== price) {
                                            console.log(`Fiyat güncelleniyor: ${existingPrice.price} -> ${price}`);
                                            const { error: updateError } = await supabase
                                                .from('product_prices')
                                                .update({ price })
                                                .eq('id', existingPrice.id);

                                            if (updateError) throw new Error(updateError.message);
                                        }
                                    } else {
                                        // Yeni fiyat ekle
                                        console.log(`Yeni fiyat ekleniyor: ${price}`);
                                        const { error: priceError } = await supabase
                                            .from('product_prices')
                                            .insert({
                                                product_id: productId,
                                                unit_id: unitId,
                                                price: price
                                            });

                                        if (priceError) throw new Error(priceError.message);
                                    }
                                } catch (error) {
                                    console.error(`Birim/fiyat işlemi sırasında hata: ${error}`);
                                    throw error;
                                }
                            }

                            stats.importedProducts++;
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

        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                return { success: false, aborted: true, stats };
            }
            // Rate limit hatası durumunda tam süreyi gönder
            if (error instanceof Error && error.message.includes('rate limit')) {
                throw new Error(`API rate limit aşıldı. Lütfen ${RATE_LIMIT_DURATION} saniye bekleyin ve tekrar deneyin.`);
            }
            // Rate limit hatası değilse lastRequestTime'ı sıfırla
            if (error instanceof Error && !error.message.includes('rate limit')) {
                lastRequestTime = null;
            }
            console.error('API çağrısı sırasında hata:', error);
            if (error instanceof Error) {
                console.error('Hata stack:', error.stack);
            }
            await cleanup();
            throw error;
        } finally {
            if (context.aborted && !isCleaningUp) {
                await cleanup();
            }
        }
    },

    async _findOrCreateUnit(unitName: string): Promise<string> {
        const supabase = createClient();
        const normalizedName = unitName.toLowerCase().trim();

        try {
            // Önce mevcut birimi ara
            const { data: existingUnit, error: searchError } = await supabase
                .from('units')
                .select()
                .eq('normalized_name', normalizedName)
                .single();

            if (!searchError && existingUnit) {
                console.log(`Mevcut unit bulundu: ${unitName}`);
                return existingUnit.id;
            }

            // Mevcut birim bulunamazsa yeni birim oluştur
            console.log(`Yeni unit oluşturuluyor: ${unitName}`);
            const { data: newUnit, error: createError } = await supabase
                .from('units')
                .insert({
                    name: unitName,
                    normalized_name: normalizedName,
                    is_active: true
                })
                .select()
                .single();

            if (createError) {
                console.error(`Unit oluşturma hatası: ${createError.message}`);
                throw new Error(`Birim oluşturulurken hata: ${createError.message}`);
            }

            console.log(`Yeni unit oluşturuldu: ${unitName}`);
            return newUnit.id;
        } catch (error) {
            console.error(`Unit işlemi sırasında hata: ${error}`);
            throw error;
        }
    },

    abortImport(context: ImportContext) {
        context.aborted = true;
    }
}; 