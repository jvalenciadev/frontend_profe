'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowRight, Sparkles, ChevronLeft, Landmark } from 'lucide-react';
import { useProfe } from '@/contexts/ProfeContext';
import { getImageUrl } from '@/lib/utils';


interface GenericPageProps {
    title: string;
    description: string;
    icon: any;
    children?: React.ReactNode;
}

export default function GenericPage({ title, description, icon: Icon, children }: GenericPageProps) {
    const { effectiveTheme } = useTheme();
    const { config } = useProfe();

    const IMG = (src: string | null | undefined) => {
        return getImageUrl(src);
    };

    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);


    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-1000 selection:bg-primary-600 selection:text-white overflow-hidden" suppressHydrationWarning>

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

                    <div className="space-y-8">

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-slate-950 dark:text-white"
                        >
                            {title.split(' ').map((word, i) => (
                                <span key={i} className={i % 2 !== 0 ? 'text-primary-500' : ''}>
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

            {/* ── FOOTER: THE IMPERIAL CONCLUSION ── */}
            <footer className="relative bg-slate-950 text-white overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-2 flex">
                        <div className="flex-1 bg-[#E12C21]" />
                        <div className="flex-1 bg-[#F9E11E]" />
                        <div className="flex-1 bg-[#009246]" />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.minedu.gob.bo/templates/images/escudo.png')] bg-no-repeat bg-center opacity-[0.03] scale-150" />
                </div>

                <div className="max-w-[1700px] mx-auto px-10 lg:px-24 pt-44 pb-20 relative z-10">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-32 mb-44">
                        <div className="xl:col-span-4 space-y-12">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 rounded-[2.5rem] bg-white text-slate-950 flex items-center justify-center p-4">
                                    <Landmark className="w-10 h-10" />
                                </div>
                                <div className="space-y-1 text-left">
                                    <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">PROFE</h3>
                                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.5em]">Excelencia Pedagógica</p>
                                </div>
                            </div>
                            <p className="text-white/60 text-base font-medium leading-relaxed max-w-sm text-left">
                                Fortaleciendo el desempeño profesional del magisterio boliviano con conciencia social y soberanía tecnológica.
                            </p>
                        </div>

                        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-24">
                            {[
                                { title: 'Institucional', links: ['Ministerio de Educación', 'Transparencia', 'Gaceta Nacional'] },
                                { title: 'Plataforma', links: ['Sedes Académicas', 'Oferta Postgrado', 'Revista Científica'] },
                                { title: 'Recursos', links: ['Repositorio', 'Aula Profe', 'Soporte'] },
                            ].map((group) => (
                                <div key={group.title} className="space-y-10 text-left">
                                    <h5 className="text-[12px] font-black uppercase tracking-[0.4em] text-white border-l-2 border-primary-600 pl-6">{group.title}</h5>
                                    <ul className="space-y-6">
                                        {group.links.map(l => (
                                            <li key={l}><a href="#" className="text-[11px] font-black text-white/60 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-4 group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-600 scale-0 group-hover:scale-100 transition-transform" /> {l}
                                            </a></li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-20 border-t border-white/5 flex flex-col xl:flex-row items-center justify-between gap-16">
                        <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.6em] text-center xl:text-left">
                            Ministerio de Educación © {new Date().getFullYear()} — Estado Plurinacional de Bolivia
                        </p>
                        <div className="flex gap-12">
                            {['Privacidad', 'Condiciones', 'Accesibilidad'].map(l => (
                                <span key={l} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white cursor-pointer transition-colors">{l}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
