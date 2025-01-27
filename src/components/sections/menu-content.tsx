"use client";

import { Menu } from "@/types/database";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { HandPlatter } from "lucide-react";
import { useMenu } from "@/contexts/menu-context";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface MenuContentProps {
    menus: Menu[];
}

export function MenuContent({ menus }: MenuContentProps) {
    const { isDrawerOpen, setDrawerOpen } = useMenu();

    if (!menus.length) return null;

    const activeMenu = menus[0];

    // Kategorileri sort_order'a göre sırala
    const sortedCategories = [...(activeMenu.categories || [])].sort(
        (a, b) => a.sort_order - b.sort_order
    );

    return (
        <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent className="h-[85vh] mt-[5vh]">
                <DrawerHeader className="sr-only">
                    <VisuallyHidden>
                        <DrawerTitle>{activeMenu.name}</DrawerTitle>
                    </VisuallyHidden>
                </DrawerHeader>
                <div className="overflow-auto h-full p-3">
                    <div className="grid grid-cols-2 gap-3">
                        {sortedCategories.map((category) => (
                            <div
                                key={category.id}
                                className="flex flex-col items-center"
                            >
                                {category.cover_image ? (
                                    <div className="w-36 aspect-square rounded-lg overflow-hidden">
                                        <img
                                            src={category.cover_image}
                                            alt={category.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-36 aspect-square rounded-lg bg-[#3b8044] flex items-center justify-center">
                                        <HandPlatter className="w-8 h-8 text-white" />
                                    </div>
                                )}
                                <span className="mt-2 text-sm font-semibold text-center">
                                    {category.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
} 