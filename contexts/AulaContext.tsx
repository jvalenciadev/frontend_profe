'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProfe } from './ProfeContext';
import { useAuth } from './AuthContext';

interface AulaContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    primaryColor: string;
    secondaryColor: string;
    isFacilitator: boolean;
}

const AulaContext = createContext<AulaContextType | undefined>(undefined);

export function AulaProvider({ children }: { children: ReactNode }) {
    const { config } = useProfe();
    const { user } = useAuth();
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Cargar preferencia tema
    useEffect(() => {
        const savedTheme = localStorage.getItem('aula_theme') as 'light' | 'dark';
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('aula_theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const primaryColor = config?.color || '#4f46e5';
    const secondaryColor = config?.colorSecundario || '#1474a6';

    const isFacilitator = user?.roles?.some((r: any) =>
        (typeof r === 'string' ? r : r.role?.name)?.toUpperCase() === 'FACILITADOR' ||
        (typeof r === 'string' ? r : r.role?.name)?.toUpperCase() === 'DOCENTE' ||
        (typeof r === 'string' ? r : r.role?.name)?.toUpperCase() === 'ADMIN'
    ) || false;

    // Aplicar colores y clases al DOM
    // NOTA: --aula-primary => colorSecundario (es el acento principal del Aula)
    //        --aula-secondary => color (color principal de la institución)
    // Función para convertir hex a HSL (necesario para las variables de Tailwind)
    const hexToHSL = (hex: string) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        r /= 255; g /= 255; b /= 255;
        let cmin = Math.min(r, g, b),
            cmax = Math.max(r, g, b),
            delta = cmax - cmin,
            h = 0, s = 0, l = 0;

        if (delta == 0) h = 0;
        else if (cmax == r) h = ((g - b) / delta) % 6;
        else if (cmax == g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        if (h < 0) h += 360;
        l = (cmax + cmin) / 2;
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);

        return { h, s, l };
    };

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');

        const activeColor = config ? secondaryColor : '#1474a6';

        // Actualizar variables personalizadas puras
        root.style.setProperty('--aula-primary', activeColor);
        root.style.setProperty('--aula-secondary', config ? primaryColor : '#4f46e5');
        root.style.setProperty('--aula-accent', activeColor);

        // Actualizar variables de Tailwind para que clases bg-primary funcionen con el color activo
        const hsl = hexToHSL(activeColor);
        root.style.setProperty('--primary-h', `${hsl.h}`);
        root.style.setProperty('--primary-s', `${hsl.s}%`);
        root.style.setProperty('--primary-l', `${hsl.l}%`);
        root.style.setProperty('--primary', `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`);

    }, [theme, config, primaryColor, secondaryColor]);

    return (
        <AulaContext.Provider value={{
            theme,
            toggleTheme,
            primaryColor,
            secondaryColor,
            isFacilitator
        }}>
            {children}
        </AulaContext.Provider>
    );
}

export function useAula() {
    const context = useContext(AulaContext);
    if (context === undefined) {
        throw new Error('useAula must be used within an AulaProvider');
    }
    return context;
}
