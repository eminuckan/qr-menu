"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BusinessService } from '@/lib/services/business-service';

interface BusinessContextType {
    hasBusiness: boolean;
    setHasBusiness: (value: boolean) => void;
    loading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
    const [hasBusiness, setHasBusiness] = useState(true);
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

    return (
        <BusinessContext.Provider value={{ hasBusiness, setHasBusiness, loading }}>
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