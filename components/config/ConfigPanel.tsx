'use client';

import React, { useState, useEffect } from 'react';
import { useTheme, ColorPresets, TypographyPresets } from '@/contexts/ThemeContext';
import {
    X, Palette, Type, Check,
    Settings, Hash, Layout,
    Monitor, Sun, Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function ConfigPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const {
        theme, setTheme,
        primaryColor, setPrimaryColor,
        typography, setTypography,
        customHex, setCustomHex
    } = useTheme();

    const [hexInput, setHexInput] = useState(customHex);

    useEffect(() => {
        setHexInput(customHex);
    }, [customHex]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setHexInput(val);
        if (/^#[0-9A-F]{6}$/i.test(val)) {
            setPrimaryColor('custom');
            setCustomHex(val);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-foreground text-background shadow-lg hover:scale-110 active:scale-95 transition-all z-[160] flex items-center justify-center border border-white/10"
            >
                <Settings className="w-5 h-5 animate-spin-slow" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[170]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-80 bg-background border-l border-border z-[180] flex flex-col shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-6 flex items-center justify-between border-b">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest">Ajustes de Tema</h3>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Personalización del Entorno</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
                                {/* 1. Modo */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <Layout className="w-3.5 h-3.5" /> Interfaz
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { val: 'light', icon: Sun },
                                            { val: 'dark', icon: Moon },
                                            { val: 'system', icon: Monitor }
                                        ].map((opt) => (
                                            <button
                                                key={opt.val}
                                                onClick={() => setTheme(opt.val as any)}
                                                className={cn(
                                                    "flex items-center justify-center p-3 rounded-xl border transition-all",
                                                    theme === opt.val ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                                                )}
                                            >
                                                <opt.icon className="w-4 h-4" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Color (COMPACT) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <Palette className="w-3.5 h-3.5" /> Color Principal
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        {Object.entries(ColorPresets).map(([key, preset]) => (
                                            <button
                                                key={key}
                                                onClick={() => setPrimaryColor(key)}
                                                className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all relative",
                                                    primaryColor === key ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"
                                                )}
                                                style={{ backgroundColor: `hsl(${preset.h} ${preset.s}% ${preset.l}%)` }}
                                            >
                                                {primaryColor === key && <Check className="w-4 h-4 text-white" />}
                                            </button>
                                        ))}
                                    </div>

                                    {/* MINI Hex Input */}
                                    <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg relative overflow-hidden shrink-0 border border-white/10">
                                            <input
                                                type="color"
                                                value={hexInput}
                                                onChange={(e) => {
                                                    setHexInput(e.target.value);
                                                    setPrimaryColor('custom');
                                                    setCustomHex(e.target.value);
                                                }}
                                                className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-0"
                                            />
                                            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: hexInput }} />
                                        </div>
                                        <div className="flex-1 flex items-center gap-2">
                                            <Hash className="w-3 h-3 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={hexInput.replace('#', '')}
                                                onChange={(e) => handleHexChange({ target: { value: '#' + e.target.value } } as any)}
                                                className="bg-transparent border-none outline-none text-xs font-bold uppercase w-full"
                                                placeholder="HEX"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Typography (COMPACT LIST) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <Type className="w-3.5 h-3.5" /> Tipografía ({TypographyPresets.length})
                                    </div>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {TypographyPresets.map((font) => (
                                            <button
                                                key={font.id}
                                                onClick={() => setTypography(font.id)}
                                                className={cn(
                                                    "w-full px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between group",
                                                    typography === font.id
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-transparent hover:bg-muted text-muted-foreground"
                                                )}
                                                style={{ fontFamily: `var(${font.variable})` }}
                                            >
                                                <span className="text-[13px] font-medium">{font.name}</span>
                                                {typography === font.id && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t bg-muted/20">
                                <p className="text-[9px] font-black uppercase text-center text-muted-foreground tracking-[0.2em]">Build Core v4.5.1</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
