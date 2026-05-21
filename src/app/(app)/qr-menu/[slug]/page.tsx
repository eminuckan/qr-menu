import { notFound } from "next/navigation";
import { MenuWelcome } from "@/components/sections/menu-welcome";
import { MenuContent } from "@/components/sections/menu-content";
import { MenuProvider } from "@/contexts/menu-context";
import { Database } from "@/lib/types/supabase";
import { Menu } from "@/lib/types/menu";
import { createClient } from "@/lib/supabase/server";

type Tables = Database['public']['Tables']

interface QRMenuPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function QRMenuPage({ params }: QRMenuPageProps) {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    if (businessError || !business) {
        notFound();
    }

    const { data: menuSettingsData } = await supabase
        .from("menu_settings")
        .select("*")
        .eq("business_id", business.id)
        .maybeSingle();

    const menuSettings: Tables["menu_settings"]["Row"] = menuSettingsData ?? {
        id: "default",
        business_id: business.id,
        welcome_title: "",
        welcome_text: "Hoş geldiniz",
        welcome_color: "#000000",
        button_text: "Menüyü İncele",
        button_color: "#000000",
        button_text_color: "#FFFFFF",
        background_type: "image",
        background_color: "",
        background_url: "",
        logo_url: "",
        loader_url: "",
        welcome_title_font: null,
        button_font: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { data: menus, error: menuError } = await supabase
        .from("menus")
        .select(`
            *,
            categories!menu_id (
                *,
                products!category_id (
                    *,
                    product_allergens!product_allergens_product_id_fkey (
                        id,
                        allergen
                    ),
                    product_tags!product_tags_product_id_fkey (
                        id,
                        tag_type
                    ),
                    product_prices!product_prices_product_id_fkey (
                        id,
                        price,
                        unit:units!product_prices_unit_id_fkey (
                            id,
                            name
                        )
                    ),
                    product_images!product_images_product_id_fkey (
                        id,
                        image_url,
                        is_cover
                    )
                )
            )
        `)
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (menuError) {
        notFound();
    }

    const [activeMenu] = (menus ?? []) as unknown as Menu[];

    if (!activeMenu) {
        notFound();
    }

    return (
        <MenuProvider>
            <main className="min-h-screen">
                <MenuWelcome settings={menuSettings} menu={activeMenu} />
                <MenuContent menu={activeMenu} businessName={business.name} />
            </main>
        </MenuProvider>
    );
}
