"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface BreadcrumbContextType {
    extraContent: ReactNode | null;
    setExtraContent: (content: ReactNode | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
    extraContent: null,
    setExtraContent: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [extraContent, setExtraContent] = useState<ReactNode | null>(null);

    return (
        <BreadcrumbContext.Provider value={{ extraContent, setExtraContent }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useBreadcrumb() {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
    }
    return context;
}

export function BreadcrumbSlot() {
    const { extraContent } = useBreadcrumb();
    return <>{extraContent}</>;
}

export function PortalToBreadcrumb({ children }: { children: ReactNode }) {
    const { setExtraContent } = useBreadcrumb();
    
    // Use an effect to safely update the parent state from the child component
    useEffect(() => {
        setExtraContent(children);
        // Clean up when the component unmounts
        return () => setExtraContent(null);
    }, [children, setExtraContent]);

    return null;
}
