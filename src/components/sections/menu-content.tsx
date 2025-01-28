"use client";

import { Database } from "@/lib/types/supabase";
import { Menu as MenuType, Category } from "@/lib/types/menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { HandPlatter, ArrowLeft } from "lucide-react";
import { useMenu } from "@/contexts/menu-context";
import { useState, useMemo } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ProductService, ProductWithRelations } from "@/lib/services/product-service";

type Tables = Database['public']['Tables']

interface MenuContentProps {
    menu: MenuType;
    businessName: string;
}

export function MenuContent({ menu, businessName }: MenuContentProps) {
    const { isDrawerOpen, setDrawerOpen } = useMenu();
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);

    const activeCategories = useMemo(() => {
        return menu.categories
            .filter(category => category.is_active)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }, [menu.categories]);

    const activeProducts = useMemo(() => {
        if (!selectedCategory?.products) return [];
        return selectedCategory.products
            .filter(product => product.is_active)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }, [selectedCategory]);

    const handleCategoryClick = (category: Category) => {
        setSelectedCategory(category);
    };

    const handleProductClick = (product: ProductWithRelations) => {
        setSelectedProduct(product);
    };

    return (
        <>
            {/* Ana Menü Drawer */}
            <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent className="h-[85vh] mt-[5vh]">
                    <VisuallyHidden>
                        <DrawerTitle>Menü İçeriği</DrawerTitle>
                    </VisuallyHidden>

                    <div className="overflow-auto h-full p-3">
                        <div className="grid grid-cols-2 gap-3">
                            {activeCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex flex-col items-center cursor-pointer"
                                    onClick={() => handleCategoryClick(category)}
                                >
                                    <div
                                        className={`w-36 aspect-square rounded-lg flex items-center justify-center overflow-hidden ${!category.cover_image ? 'bg-[#3b8044]' : ''}`}
                                    >
                                        {category.cover_image ? (
                                            <img
                                                src={category.cover_image}
                                                alt={category.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <HandPlatter className="w-8 h-8 text-white" />
                                        )}
                                    </div>
                                    <span className="mt-2 text-sm font-semibold text-center">
                                        {category.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Kategori Ürünleri Drawer */}
            <Drawer open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
                <DrawerContent className="h-[85vh] mt-[5vh]">
                    <VisuallyHidden>
                        <DrawerTitle>Kategori Ürünleri</DrawerTitle>
                    </VisuallyHidden>

                    <div className="flex items-center justify-between p-4 border-b">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Geri
                        </button>
                        <h2 className="text-lg font-semibold">{selectedCategory?.name}</h2>
                        <div className="w-[76px]"></div>
                    </div>

                    {selectedCategory?.cover_image && (
                        <div className="p-4 border-b">
                            <div className="w-full h-32 relative rounded-lg overflow-hidden">
                                <img
                                    src={selectedCategory.cover_image}
                                    alt={selectedCategory.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20"></div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-auto flex-1 p-4">
                        <div className="space-y-4">
                            {activeProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex gap-4 p-4 bg-card rounded-lg shadow-sm border cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => handleProductClick(product)}
                                >
                                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                        {product.product_images?.find(img => img.is_cover)?.image_url ? (
                                            <img
                                                src={product.product_images.find(img => img.is_cover)?.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#3b8044] flex items-center justify-center">
                                                <HandPlatter className="w-8 h-8 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className="font-medium">{product.name}</h3>
                                            {product.product_tags && product.product_tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 justify-end">
                                                    {product.product_tags.map(tag => (
                                                        <span
                                                            key={tag.id}
                                                            className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-medium"
                                                        >
                                                            {tag.tag_type}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {product.product_prices?.[0] && (
                                            <div className="font-medium text-primary mb-1.5">
                                                {product.product_prices[0].price} ₺
                                                {product.product_prices[0].unit?.name && (
                                                    <span className="text-sm text-muted-foreground ml-1">
                                                        / {product.product_prices[0].unit.name}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {product.description && (
                                            <div
                                                className="text-sm text-muted-foreground line-clamp-2"
                                                dangerouslySetInnerHTML={{ __html: product.description }}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Ürün Detay Drawer */}
            <Drawer open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DrawerContent className="h-[85vh] mt-[5vh]">
                    <VisuallyHidden>
                        <DrawerTitle>Ürün Detayları</DrawerTitle>
                    </VisuallyHidden>

                    <div className="flex items-center justify-between p-4 border-b">
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Geri
                        </button>
                        <h2 className="text-lg font-semibold">{selectedProduct?.name}</h2>
                        <div className="w-[76px]"></div>
                    </div>

                    <div className="overflow-auto flex-1 p-4">
                        <div className="relative">
                            {selectedProduct?.product_tags && selectedProduct.product_tags.length > 0 && (
                                <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1.5 max-w-[70%] justify-end">
                                    {selectedProduct.product_tags.map(tag => (
                                        <span
                                            key={tag.id}
                                            className="px-2 py-1 bg-white/90 backdrop-blur text-primary rounded-lg text-xs font-medium shadow-sm"
                                        >
                                            {tag.tag_type}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
                                {selectedProduct?.product_images?.find(img => img.is_cover)?.image_url ? (
                                    <img
                                        src={selectedProduct.product_images.find(img => img.is_cover)?.image_url}
                                        alt={selectedProduct.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#3b8044] flex items-center justify-center">
                                        <HandPlatter className="w-12 h-12 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedProduct?.product_prices?.[0] && (
                            <div className="bg-primary/5 rounded-lg p-4 mb-6 flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Fiyat</span>
                                <div className="text-xl font-semibold text-primary">
                                    {selectedProduct.product_prices[0].price} ₺
                                    {selectedProduct.product_prices[0].unit?.name && (
                                        <span className="text-sm text-muted-foreground ml-1">
                                            / {selectedProduct.product_prices[0].unit.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedProduct?.description && (
                            <div className="bg-muted/30 rounded-lg p-4 mb-6">
                                <div
                                    className="text-base leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                                />
                            </div>
                        )}

                        {selectedProduct?.product_allergens && selectedProduct.product_allergens.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">Alerjenler</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProduct.product_allergens.map(allergen => (
                                        <span
                                            key={allergen.id}
                                            className="px-3 py-1.5 bg-muted rounded-lg text-sm"
                                        >
                                            {allergen.allergen}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    );
} 