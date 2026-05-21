"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useRouter } from "next/navigation";
import { SELECTED_BUSINESS_COOKIE, type ScopedBusiness } from '@/lib/business-scope.shared';

interface BusinessContextType {
    businesses: ScopedBusiness[];
    selectedBusiness: ScopedBusiness | null;
    selectedBusinessId: string | null;
    setSelectedBusinessId: (value: string) => void;
    hasBusiness: boolean;
    setHasBusiness: (value: boolean) => void;
    loading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({
    children,
    initialBusinesses,
    initialSelectedBusinessId,
}: {
    children: ReactNode;
    initialBusinesses: ScopedBusiness[];
    initialSelectedBusinessId: string | null;
}) {
    const router = useRouter();
    const [businesses, setBusinesses] = useState(initialBusinesses);
    const [selectedBusinessId, setSelectedBusinessIdState] = useState(initialSelectedBusinessId);
    const [hasBusiness, setHasBusiness] = useState(initialBusinesses.length > 0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setBusinesses(initialBusinesses);
        setSelectedBusinessIdState(initialSelectedBusinessId);
        setHasBusiness(initialBusinesses.length > 0);
        setLoading(false);
    }, [initialBusinesses, initialSelectedBusinessId]);

    const selectedBusiness = useMemo(
        () => businesses.find((business) => business.id === selectedBusinessId) ?? null,
        [businesses, selectedBusinessId],
    );

    const setSelectedBusinessId = useCallback((value: string) => {
        if (!businesses.some((business) => business.id === value)) {
            return;
        }

        setSelectedBusinessIdState(value);
        document.cookie = `${SELECTED_BUSINESS_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
        router.refresh();
    }, [businesses, router]);

    return (
        <BusinessContext.Provider
            value={{
                businesses,
                selectedBusiness,
                selectedBusinessId,
                setSelectedBusinessId,
                hasBusiness,
                setHasBusiness,
                loading,
            }}
        >
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusinessContext() {
    const context = useContext(BusinessContext);
    if (context === undefined) {
        throw new Error('useBusinessContext must be used within a BusinessProvider');
    }
    return context;
}
