import { BusinessService } from "@/lib/services/business-service";
import { MenuService } from "@/lib/services/menu-service";
import { MenuSettingsService } from "@/lib/services/menu-settings-service";
import { notFound } from "next/navigation";
import { MenuWelcome } from "@/components/sections/menu-welcome";
import { MenuContent } from "@/components/sections/menu-content";
import { MenuProvider } from "@/contexts/menu-context";
import { Database } from "@/lib/types/supabase";

type Tables = Database['public']['Tables']

interface QRMenuPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function QRMenuPage({ params }: QRMenuPageProps) {
    const { slug } = await params;
    const business = await BusinessService.getBusinessBySlug(slug);

    if (!business) {
        notFound();
    }

    const menuSettings = await MenuSettingsService.getMenuSettings(business.id);
    const menus = await MenuService.getMenusByBusinessId(business.id);

    return (
        <MenuProvider>
            <main className="min-h-screen">
                <MenuWelcome settings={menuSettings} menus={menus} />
                <MenuContent menus={menus} businessName={business.name} />
            </main>
        </MenuProvider>
    );
}
