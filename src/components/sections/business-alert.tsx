"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Store01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/ui/huge-icon";
import { useBusinessContext } from "@/lib/contexts/business-context";

export function BusinessAlert() {
    const { hasBusiness, loading } = useBusinessContext();

    if (loading || hasBusiness) return null;

    return (
        <Alert variant="warning" className="mb-4">
            <HugeIcon icon={Store01Icon} className="h-5 w-5" />
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
