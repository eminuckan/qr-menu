import { BusinessService } from "@/lib/services/business-service";
import { MenuService } from "@/lib/services/menu-service";
import { MenuSettingsService } from "@/lib/services/menu-settings-service";
import { notFound } from "next/navigation";
import { MenuWelcome } from "@/components/sections/menu-welcome";
import { MenuContent } from "@/components/sections/menu-content";
import { MenuProvider } from "@/contexts/menu-context";
import { Database } from "@/lib/types/supabase";
import { Menu } from "@/lib/types/menu";

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
    const [activeMenu] = await MenuService.getMenuWithFullDetails(business.id);

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
