'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProfe } from '@/contexts/ProfeContext';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Hammer, Clock, Settings, Activity } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const { config, isLoading } = useProfe();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    // Evitar errores de hidratación esperando a que el componente se monte en el cliente
    useEffect(() => {
        setMounted(true);
    }, []);

    const isExcluded =
        pathname?.startsWith('/dashboard') ||
        pathname?.startsWith('/login') ||
        pathname?.startsWith('/registro-profe');

    // Durante la hidratación inicial, no renderizar nada que dependa del estado del cliente
    if (!mounted) return <>{children}</>;

    if (!isLoading && config?.mantenimiento && !isExcluded) {
        return (
            <div className="fixed inset-0 z-[9999] bg-white dark:bg-[#030712] flex flex-col transition-colors duration-700">

                {/* ── CLEAN GRADIENT BACKGROUND ── */}
                <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(var(--primary-h),var(--primary-s),0.15)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
                </div>

                {/* ── MINIMALIST HEADER ── */}
                <header className="relative z-20 w-full px-8 lg:px-20 py-10 flex items-center justify-between border-b border-slate-100 dark:border-white/5 shrink-0">
                    <div className="flex items-center gap-6">
                        {config.imagen && (
                            <img
                                src={getImageUrl(config.imagen)}
                                className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-sm"
                                alt="Institutional Icon"
                            />
                        )}
                        <div className="space-y-1">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {config.nombreAbreviado || config.nombre}
                            </h2>
                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-[0.3em]">Portal Institucional</p>
                        </div>
                    </div>

                    {config.logoPrincipal && (
                        <img
                            src={getImageUrl(config.logoPrincipal)}
                            className="h-12 md:h-16 w-auto object-contain dark:brightness-[10]"
                            alt="Ministerio Logo"
                        />
                    )}
                </header>

                {/* ── HERO CONTENT (CLEAN & FAST) ── */}
                <main className="flex-1 relative z-10 flex items-center justify-center p-8">
                    <div className="max-w-4xl w-full text-center space-y-12">

                        {/* Elegant Central Icon */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-center"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-xl relative z-10">
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <Hammer className="w-16 h-16 md:w-20 md:h-20 text-primary-600" />
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Clear Message */}
                        <div className="space-y-6">
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-5xl md:text-7xl font-black text-slate-950 dark:text-white tracking-tighter uppercase italic leading-none"
                            >
                                Fase de <span className="text-primary-600">Mejora.</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed"
                            >
                                Estamos optimizando la plataforma <span className="text-slate-900 dark:text-white font-bold">{config.nombre}</span> para brindarle un servicio más ágil y eficiente.
                            </motion.p>
                        </div>

                        {/* Status Bar */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8"
                        >
                            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Optimización Activa</span>
                            </div>

                            <Link href="/login" className="text-[11px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest border-b-2 border-primary-600/20 pb-1 transition-all">
                                Acceso Institucional →
                            </Link>
                        </motion.div>
                    </div>
                </main>

                {/* ── SIMPLE FOOTER ── */}
                <footer className="relative z-20 px-8 lg:px-20 py-12 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
                        Ministerio de Educación © {new Date().getFullYear()} PROFE Bolivia
                    </p>
                    <div className="flex items-center gap-4 text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                        <Settings className="w-3 h-3" />
                        Sincronización del Sistema
                    </div>
                </footer>
            </div>
        );
    }

    return <>{children}</>;
}
