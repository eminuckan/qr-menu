"use client";

import { createContext, useContext, useState } from "react";

interface MenuContextType {
    isDrawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
    const [isDrawerOpen, setDrawerOpen] = useState(false);

    return (
        <MenuContext.Provider value={{ isDrawerOpen, setDrawerOpen }}>
            {children}
        </MenuContext.Provider>
    );
}

export function useMenu() {
    const context = useContext(MenuContext);
    if (!context) throw new Error("useMenu must be used within MenuProvider");
    return context;
} 