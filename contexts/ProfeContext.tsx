'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProfeApi } from '@/features/profe/infrastructure/ProfeApi';
import { Profe } from '@/features/profe/domain/Profe';

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
            const responseData: any = await ProfeApi.get();
            if (responseData) {
                // 1. Array directo
                if (Array.isArray(responseData) && responseData.length > 0) {
                    setConfig(responseData[0]);
                }
                // 2. Respuesta paginada
                else if (responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
                    setConfig(responseData.data[0]);
                }
                // 3. Objeto directo
                else if (responseData.id) {
                    setConfig(responseData);
                } else {
                    setConfig(null);
                }
            } else {
                setConfig(null);
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
