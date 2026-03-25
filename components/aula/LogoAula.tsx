'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function LogoAula({ className, showText = true, size = 'md' }: LogoProps) {
    const sizes = {
        sm: { icon: 18, text: 'text-lg', container: 'gap-2' },
        md: { icon: 24, text: 'text-2xl', container: 'gap-3' },
        lg: { icon: 32, text: 'text-4xl', container: 'gap-4' },
        xl: { icon: 48, text: 'text-6xl', container: 'gap-6' },
    };

    const currentSize = sizes[size];

    return (
        <div suppressHydrationWarning className={cn("flex items-center", currentSize.container, className)}>
            <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className={cn(
                    "relative flex items-center justify-center rounded-2xl bg-white shadow-lg border border-slate-100 dark:border-slate-800 dark:bg-slate-950",
                    size === 'sm' ? "w-8 h-8 rounded-xl" :
                    size === 'md' ? "w-12 h-12" :
                    size === 'lg' ? "w-16 h-16" : "w-24 h-24 rounded-[2rem]"
                )}
            >
                {/* Subtle Inner Glow */}
                <div suppressHydrationWarning className="absolute inset-0 rounded-[inherit] bg-[var(--aula-primary)]/5 blur-md" />
                
                {/* Shadow/Glow Effect */}
                <div suppressHydrationWarning className={cn(
                    "absolute -inset-1 bg-[var(--aula-primary)]/10 rounded-[inherit] blur-xl opacity-0 group-hover:opacity-100 transition-opacity",
                    "group-hover:animate-pulse"
                )} />

                <GraduationCap 
                    size={currentSize.icon} 
                    className="text-[var(--aula-primary)] relative z-10" 
                    strokeWidth={2.5}
                />

                {/* Decorative Sparkle */}
                {size !== 'sm' && (
                    <motion.div
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute -top-1 -right-1 text-amber-400"
                    >
                        <Sparkles size={currentSize.icon / 2} fill="currentColor" />
                    </motion.div>
                )}
            </motion.div>

            {showText && (
                <div className="flex flex-col">
                    <motion.h1 
                        className={cn(
                            "font-black tracking-tighter leading-none dark:text-white text-slate-900",
                            currentSize.text
                        )}
                    >
                        Aula <span className="text-[var(--aula-primary)]">Profe</span>
                    </motion.h1>
                    {size !== 'sm' && (
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 mt-0.5">
                            Excelencia Académica
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
