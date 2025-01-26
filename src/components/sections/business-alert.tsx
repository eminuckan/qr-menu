"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Store } from "lucide-react";
import { BusinessService } from "@/lib/services/business-service";

export function BusinessAlert() {
    const [hasBusiness, setHasBusiness] = useState(true); // Başlangıçta alert'i gösterme
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkBusiness = async () => {
            try {
                const result = await BusinessService.hasAnyBusiness();
                setHasBusiness(result);
            } catch (error) {
                console.error('Error checking business:', error);
            } finally {
                setLoading(false);
            }
        };

        checkBusiness();
    }, []);

    if (loading || hasBusiness) return null;

    return (
        <Alert variant="warning" className="mb-4">
            <Store className="h-5 w-5" />
            <AlertTitle className="text-amber-800 font-semibold text-[15px]">
                İşletme Bulunamadı
            </AlertTitle>
            <AlertDescription className="text-amber-700 mt-1">
                Herhangi bir işlem yapabilmek için önce bir işletme oluşturmanız gerekmektedir. İşletme oluşturmak için{" "}
                <a href="/dashboard/settings/business-settings" className="font-medium underline underline-offset-4">
                    buraya tıklayın
                </a>.
            </AlertDescription>
        </Alert>
    );
} 