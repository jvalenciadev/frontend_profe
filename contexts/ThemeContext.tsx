'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProfe } from './ProfeContext';

export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export interface HSL {
    h: number;
    s: number;
    l: number;
}

export interface ColorPreset extends HSL {
    name: string;
}

export const ColorPresets: Record<string, ColorPreset> = {
    profe: { name: 'PROFE', h: 200, s: 78, l: 37 },
    indigo: { name: 'Indigo', h: 239, s: 84, l: 60 },
    rose: { name: 'Rose', h: 350, s: 89, l: 60 },
    amber: { name: 'Amber', h: 38, s: 92, l: 50 },
    emerald: { name: 'Emerald', h: 142, s: 70, l: 45 },
    violet: { name: 'Violet', h: 262, s: 52, l: 47 },
    slate: { name: 'Slate', h: 215, s: 25, l: 40 },
    gold: { name: 'Gold', h: 45, s: 90, l: 45 },
};

export const TypographyPresets = [
    { id: 'Inter', name: 'Inter (Sans)', variable: '--font-inter' },
    { id: 'Outfit', name: 'Outfit (Modern)', variable: '--font-outfit' },
    { id: 'Urbanist', name: 'Urbanist (Clean)', variable: '--font-urbanist' },
    { id: 'Raleway', name: 'Raleway (Elegant)', variable: '--font-raleway' },
    { id: 'Space Grotesk', name: 'Space (Tech)', variable: '--font-space' },
    { id: 'Manrope', name: 'Manrope (Clean)', variable: '--font-manrope' },
    { id: 'Syne', name: 'Syne (Artistic)', variable: '--font-syne' },
    { id: 'Kanit', name: 'Kanit (Bold)', variable: '--font-kanit' },
    { id: 'JetBrains Mono', name: 'JetBrains (Mono)', variable: '--font-jetbrains' },
    { id: 'Fraunces', name: 'Fraunces (Serif)', variable: '--font-fraunces' },
    { id: 'Poppins', name: 'Poppins', variable: '--font-poppins' },
    { id: 'Montserrat', name: 'Montserrat', variable: '--font-montserrat' },
];

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    effectiveTheme: EffectiveTheme;
    primaryColor: string;
    setPrimaryColor: (colorKey: string) => void;
    typography: string;
    setTypography: (fontId: string) => void;
    isSidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    isMobileSidebarOpen: boolean;
    setMobileSidebarOpen: (open: boolean) => void;
    customHex: string;
    setCustomHex: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToHSL(hex: string): HSL {
    let r = 0, g = 0, b = 0;
    if (!hex.startsWith('#')) hex = '#' + hex;
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
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('light');
    const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('light');
    const [primaryColor, setPrimaryColorState] = useState<string>('profe');
    const [customHex, setCustomHexState] = useState<string>('#1474a6');
    const [typography, setTypographyState] = useState<string>('Urbanist');
    const [isSidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(false);
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState(false);
    const { config } = useProfe();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as ThemeMode;
        const savedColor = localStorage.getItem('primaryColor');
        const savedHex = localStorage.getItem('customHex');
        const savedFont = localStorage.getItem('typography');
        const savedSidebar = localStorage.getItem('sidebarCollapsed');

        if (savedTheme) setThemeState(savedTheme);
        if (savedColor) setPrimaryColorState(savedColor);
        if (savedHex) setCustomHexState(savedHex);
        if (savedFont) setTypographyState(savedFont);
        if (savedSidebar !== null) setSidebarCollapsedState(savedSidebar === 'true');
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const update = () => setEffectiveTheme(theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme as EffectiveTheme);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, [theme, isMounted]);

    useEffect(() => {
        if (!isMounted) return;
        const root = document.documentElement;
        root.setAttribute('data-theme', effectiveTheme);
        root.setAttribute('data-font', typography);

        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        let hsl: HSL = ColorPresets.profe;
        if (primaryColor === 'profe' && config?.color) {
            hsl = hexToHSL(config.color);
        } else if (primaryColor === 'custom' && customHex) {
            hsl = hexToHSL(customHex);
        } else if (ColorPresets[primaryColor]) {
            hsl = ColorPresets[primaryColor];
        }

        root.style.setProperty('--primary-h', hsl.h.toString());
        root.style.setProperty('--primary-s', `${hsl.s}%`);
        root.style.setProperty('--primary-l', `${hsl.l}%`);

        localStorage.setItem('theme', theme);
        localStorage.setItem('primaryColor', primaryColor);
        localStorage.setItem('customHex', customHex);
        localStorage.setItem('typography', typography);
        localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
    }, [effectiveTheme, theme, primaryColor, customHex, typography, isSidebarCollapsed, isMounted, config]);

    return (
        <ThemeContext.Provider value={{
            theme, setTheme: setThemeState,
            effectiveTheme, primaryColor, setPrimaryColor: setPrimaryColorState,
            typography, setTypography: setTypographyState,
            isSidebarCollapsed, setSidebarCollapsed: setSidebarCollapsedState,
            isMobileSidebarOpen, setMobileSidebarOpen,
            customHex, setCustomHex: setCustomHexState
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}
