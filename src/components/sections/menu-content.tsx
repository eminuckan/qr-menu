"use client";

import { Database } from "@/lib/types/supabase";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { HandPlatter, ArrowLeft } from "lucide-react";
import { useMenu } from "@/contexts/menu-context";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ProductService, ProductWithRelations } from "@/lib/services/product-service";

type Tables = Database['public']['Tables']
type Menu = Tables['menus']['Row'] & {
    categories: Array<Tables['categories']['Row']>;
};

interface MenuContentProps {
    menus: Menu[];
    businessName: string;
}

export function MenuContent({ menus, businessName }: MenuContentProps) {
    const { isDrawerOpen, setDrawerOpen } = useMenu();
    const [selectedCategory, setSelectedCategory] = useState<Tables['categories']['Row'] & { products?: ProductWithRelations[] } | null>(null);
    const [showProducts, setShowProducts] = useState(false);

    if (!menus.length) return null;
    const activeMenu = menus[0];

    const sortedCategories = [...(activeMenu.categories || [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );

    const handleCategoryClick = async (category: Tables['categories']['Row']) => {
        const products = await ProductService.getProductsByCategory(category.id);
        setSelectedCategory({ ...category, products });
        setShowProducts(true);
    };

    const handleBackClick = () => {
        setSelectedCategory(null);
    };

    return (
        <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent className="h-[85vh] mt-[5vh]">
                <VisuallyHidden>
                    <DrawerTitle>Menü İçeriği</DrawerTitle>
                </VisuallyHidden>

                {selectedCategory ? (
                    <>
                        <div className="border-b">
                            <button
                                onClick={handleBackClick}
                                className="p-4 flex items-center gap-2 text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Kategoriler
                            </button>
                        </div>

                        {/* Kategori Başlığı */}
                        <div className="p-4 border-b">
                            <h2 className="text-xl font-semibold">{selectedCategory.name}</h2>
                        </div>

                        {/* Ürünler Listesi */}
                        <div className="overflow-auto flex-1 p-4">
                            <div className="space-y-4">
                                {selectedCategory.products?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex gap-4 p-4 bg-card rounded-lg shadow-sm"
                                    >
                                        {product.product_images?.find(img => img.is_cover)?.image_url && (
                                            <img
                                                src={product.product_images.find(img => img.is_cover)?.image_url || ''}
                                                alt={product.name}
                                                className="w-24 h-24 rounded-lg object-cover"
                                            />
                                        )}
                                        <div>
                                            <h3 className="font-medium">{product.name}</h3>
                                            {product.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {product.description}
                                                </p>
                                            )}
                                            {product.product_prices?.[0] && (
                                                <div className="mt-2 font-medium">
                                                    {product.product_prices[0].price} ₺
                                                    {product.product_prices[0].unit?.name && (
                                                        <span className="text-sm text-muted-foreground ml-1">
                                                            / {product.product_prices[0].unit.name}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="overflow-auto h-full p-3">
                        <div className="grid grid-cols-2 gap-3">
                            {sortedCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex flex-col items-center cursor-pointer"
                                    onClick={() => handleCategoryClick(category)}
                                >
                                    <div className="w-36 aspect-square rounded-lg bg-[#3b8044] flex items-center justify-center">
                                        <HandPlatter className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="mt-2 text-sm font-semibold text-center">
                                        {category.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DrawerContent>
        </Drawer>
    );
} 