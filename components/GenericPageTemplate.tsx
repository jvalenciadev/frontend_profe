'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowRight, Sparkles, ChevronLeft, Landmark } from 'lucide-react';
import { useProfe } from '@/contexts/ProfeContext';

interface GenericPageProps {
    title: string;
    description: string;
    icon: any;
    children?: React.ReactNode;
}

export default function GenericPage({ title, description, icon: Icon, children }: GenericPageProps) {
    const { effectiveTheme } = useTheme();
    const { config } = useProfe();

    const IMG = (src: string | null) => {
        if (!src) return null;
        return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-1000 selection:bg-primary-600 selection:text-white overflow-hidden">

            {/* ── ATMOSPHERE ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[1000px] h-[1000px] bg-primary-500/[0.04] rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[1000px] h-[1000px] bg-indigo-500/[0.02] rounded-full blur-[150px]" />
            </div>

            {/* ── NAVIGATION BACK ── */}
            <div className="fixed top-32 left-10 md:left-20 z-[100] hidden lg:block">
                <Link
                    href="/"
                    className="group flex items-center gap-4 px-8 py-4 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-slate-950 transition-all shadow-xl"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                    Volver
                </Link>
            </div>

            {/* ── PAGE HEADER: MAJESTIC STAGE ── */}
            <section className="relative pt-52 pb-20 px-10 lg:px-24 z-10">
                <div className="max-w-[1500px] mx-auto text-center space-y-12">

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-[2.5rem] bg-primary-600 text-white flex items-center justify-center shadow-2xl relative group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        {config?.imagen ? (
                            <img src={IMG(config.imagen)!} className="w-12 h-12 md:w-14 md:h-14 relative z-10 object-contain brightness-0 invert" alt="Logo" />
                        ) : (
                            <Icon className="w-8 h-8 md:w-10 md:h-10 relative z-10" />
                        )}
                    </motion.div>

                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-[0.5em] text-slate-500"
                        >
                            <Sparkles className="w-4 h-4 text-emerald-500" /> División Nacional
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-slate-950 dark:text-white"
                        >
                            {title.split(' ').map((word, i) => (
                                <span key={i} className={i % 2 !== 0 ? 'text-primary-600' : ''}>
                                    {word}{' '}
                                </span>
                            ))}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-4xl mx-auto font-medium leading-relaxed"
                        >
                            {description}
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* ── PAGE CONTENT RECEPTACLE ── */}
            <main className="relative z-10 max-w-[1700px] mx-auto px-10 lg:px-24 pb-60">
                {children ? (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        {children}
                    </motion.div>
                ) : (
                    /* Placeholder Skeleton with High-End Feel */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i + 0.6 }}
                                className="h-[500px] rounded-[4rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center space-y-8"
                            >
                                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 animate-pulse" />
                                <div className="space-y-4 text-center">
                                    <div className="w-48 h-4 bg-slate-100 dark:bg-white/5 rounded-full mx-auto" />
                                    <div className="w-32 h-3 bg-slate-50 dark:bg-white/5 rounded-full mx-auto" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* ── FOOTER: CLEAN FINALE ── */}
            <footer className="relative py-40 px-10 border-t border-slate-100 dark:border-white/10 overflow-hidden text-center bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white">
                            <ArrowRight className="w-6 h-6 rotate-[-45deg]" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[1em] text-slate-400">Excelencia Institucional</span>
                    </div>

                    <p className="text-[12px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.8em]">
                        Forjando el futuro pedagógico del Estado Plurinacional
                    </p>

                    <Link href="/" className="inline-flex items-center gap-4 px-12 py-6 rounded-full bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:scale-105 transition-all shadow-xl shadow-primary-600/20">
                        Volver al Eje Central <ArrowRight className="w-5 h-5" />
                    </Link>

                    <div className="pt-20 space-y-4">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.5em]">
                            Ministerio de Educación © {new Date().getFullYear()} PROFE Bolivia
                        </p>
                        <p className="text-[8px] font-bold text-slate-300 dark:text-slate-800 uppercase tracking-[0.3em]">
                            Estado Plurinacional de Bolivia
                        </p>
                    </div>
                </div>

                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </footer>
        </div>
    );
}
