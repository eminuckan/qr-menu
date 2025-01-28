"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuCustomization } from "@/components/sections/menu-customization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MenuSettingsService } from "@/lib/services/menu-settings-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tables } from "@/lib/types/supabase";
import { BusinessService } from "@/lib/services/business-service";
import { Loading } from "@/components/ui/loading";

export default function MenuSettingsPage() {
    const [businesses, setBusinesses] = useState<Tables<'businesses'>[]>([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const checkBusinesses = async () => {
            try {
                const businesses = await BusinessService.getBusinesses();
                setBusinesses(businesses);

                if (businesses.length === 0) {
                    // İşletme yoksa business-settings sayfasına yönlendir
                    router.push("/dashboard/settings/business-settings");
                    return;
                }

                // Varsayılan olarak ilk işletmeyi seç
                setSelectedBusinessId(businesses[0].id);
            } catch (error) {
                toast({
                    title: "Hata",
                    description: "İşletme bilgileri alınırken bir hata oluştu",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        checkBusinesses();
    }, [router, toast]);

    // Business değiştiğinde komponenti yeniden render et
    const handleBusinessChange = (businessId: string) => {
        try {
            setSelectedBusinessId(businessId);
        } catch (error) {
            toast({
                title: "Hata",
                description: "İşletme değiştirilirken bir hata oluştu",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return <Loading className="min-h-[200px]" />;
    }

    if (businesses.length === 0) {
        return null; // Yönlendirme yapıldığı için boş dön
    }

    return (
        <div className="min-h-screen pb-20">
            <div className="flex items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold">Menü Ayarları</h1>
                <Select
                    value={selectedBusinessId || undefined}
                    onValueChange={handleBusinessChange}
                >
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="İşletme seçin" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[300px]">
                        {businesses.map((business) => (
                            <SelectItem key={business.id} value={business.id}>
                                {business.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedBusinessId && (
                <MenuCustomization
                    key={selectedBusinessId} // Key ekleyerek komponentin yeniden oluşturulmasını sağlıyoruz
                    businessId={selectedBusinessId}
                />
            )}
        </div>
    );
} 