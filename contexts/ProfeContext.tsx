'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { profeService, Profe } from '@/services/profeService';

interface ProfeContextType {
    config: Profe | null;
    isLoading: boolean;
    refreshConfig: () => Promise<void>;
}

const ProfeContext = createContext<ProfeContextType | undefined>(undefined);

export function ProfeProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<Profe | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshConfig = async () => {
        try {
            const data = await profeService.get();
            if (data) {
                const configData = Array.isArray(data) ? data[0] : data;
                setConfig(configData);
            }
        } catch (error) {
            console.error('Error fetching profe config:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshConfig();
    }, []);

    return (
        <ProfeContext.Provider value={{ config, isLoading, refreshConfig }}>
            {children}
        </ProfeContext.Provider>
    );
}

export function useProfe() {
    const context = useContext(ProfeContext);
    if (context === undefined) {
        throw new Error('useProfe must be used within a ProfeProvider');
    }
    return context;
}
