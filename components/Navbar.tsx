'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { publicService } from '@/services/publicService';

export default function Navbar() {
    const { effectiveTheme, setTheme } = useTheme();
    const searchParams = useSearchParams();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [data, setData] = useState<any>(null);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [tiposEvento, setTiposEvento] = useState<any[]>([]);
    const tenant = searchParams?.get('tenant');

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handleScroll);

        publicService.getLandingPageData(tenant || undefined).then(res => {
            setData(res);
        }).catch(() => { });

        publicService.getDepartamentos().then(setDepartamentos).catch(() => { });
        publicService.getTiposEvento().then(setTiposEvento).catch(() => { });

        return () => window.removeEventListener('scroll', handleScroll);
    }, [tenant]);

    const institution = data?.profe || {
        nombre: 'PROFE',
        nombreAbreviado: 'PROFE',
        imagen: null,
        logoPrincipal: null
    };

    const depNombre = departamentos.find(d => d.abreviacion === tenant)?.nombre;

    const navLinks = [
        { label: 'Inicio', path: '/' },
        { label: 'Nosotros', path: '/nosotros' },
        {
            label: 'Oferta',
            path: '/oferta',
            submenu: [
                { label: 'Ciclos Formativos', path: '/oferta?tipo=ciclos' },
                { label: 'Diplomados', path: '/oferta?tipo=diplomados' },
            ]
        },
        {
            label: 'Eventos',
            path: '/eventos',
            submenu: tiposEvento.map(t => ({
                label: t.nombre,
                path: `/eventos?tipo=${t.nombre}`
            }))
        },
        {
            label: 'Multimedia',
            path: '#',
            submenu: [
                { label: 'Galerías', path: '/galerias' },
                { label: 'Comunicados', path: '/comunicados' },
            ]
        },
        { label: 'Banco de Profesionales', path: '/registro-profe' },
        {
            label: 'Legal',
            path: '#',
            submenu: [
                { label: 'Privacidad', path: '/privacidad' },
                { label: 'Términos', path: '/terminos' },
            ]
        },
    ];

    const getImgUrl = (src: string | null) => {
        if (!src) return null;
        return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    };

    return (
        <nav
            className={`fixed top-0 w-full z-[1000] transition-all duration-700 ${isScrolled
                ? 'py-4 bg-white/95 dark:bg-primary-950/95 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shadow-sm'
                : 'py-10 bg-transparent'
                }`}
            suppressHydrationWarning
        >
            <div className="max-w-[1700px] mx-auto px-10 md:px-20 flex items-center justify-between" suppressHydrationWarning>

                {/* --- MAJESTIC BRANDING HIERARCHY --- */}
                <Link href="/" className="flex items-center group gap-8 lg:gap-5">

                    {/* Primary Identity (Ministry) - MONUMENTAL & STABLE */}
                    <div className="relative h-12 md:h-14 lg:h-16 transition-all duration-700 group-hover:scale-[1.02]" suppressHydrationWarning>
                        <img
                            src={getImgUrl(institution.logoPrincipal) || '/logo-principal.png'}
                            alt="Identidad Superior"
                            className="h-full w-auto object-contain"
                        />
                    </div>

                    {/* Subtle Divider */}
                    <div className="h-8 md:h-10 w-px bg-slate-200 dark:bg-white/10" suppressHydrationWarning />

                    {/* Secondary Identity (Program) - RECTANGULAR & ELEGANT */}
                    <div className="relative h-6 md:h-8 lg:h-8 group-hover:scale-105 transition-all duration-700" suppressHydrationWarning>
                        {institution.imagen ? (
                            <img
                                src={getImgUrl(institution.imagen)!}
                                alt="Programa"
                                className="h-full w-auto object-contain"
                            />
                        ) : (
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">PROFE</span>
                        )}
                        {tenant && (
                            <div className="absolute -bottom-4 left-0 whitespace-nowrap">
                                <span className="text-[8px] font-black text-primary-600 uppercase tracking-[0.3em]">
                                    {depNombre || tenant}
                                </span>
                            </div>
                        )}
                    </div>
                </Link>

                {/* --- NAVIGATION: CLEAN & WIDE --- */}
                <div className="hidden xl:flex items-center gap-10" suppressHydrationWarning>
                    {navLinks.map((item) => (
                        <div key={item.label} className="relative group/navitem">
                            <Link
                                href={item.path}
                                className="text-[9px] font-black text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all uppercase tracking-[0.3em] relative group/link whitespace-nowrap"
                            >
                                {item.label}
                                <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-primary-600 transition-all duration-500 group-hover/link:w-full" />
                            </Link>

                            {item.submenu && (
                                <div className="absolute top-full left-0 pt-6 opacity-0 translate-y-4 pointer-events-none group-hover/navitem:opacity-100 group-hover/navitem:translate-y-0 group-hover/navitem:pointer-events-auto transition-all duration-300">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-2xl min-w-[200px] flex flex-col gap-2">
                                        {item.submenu.map(sub => (
                                            <Link
                                                key={sub.label}
                                                href={sub.path}
                                                className="px-4 py-3 text-[9px] font-black text-slate-500 dark:text-slate-400 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all uppercase tracking-widest"
                                            >
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Portal Entry */}
                    <Link
                        href="/login"
                        className="ml-4 px-10 h-12 flex items-center bg-primary-600 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] hover:brightness-110 transition-all shadow-[0_10px_30px_-10px_rgba(var(--primary-h),var(--primary-s),var(--primary-l),0.4)] group/btn shrink-0"
                    >
                        Acceso
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-3 transition-transform duration-700 ml-3" />
                    </Link>

                    {/* Theme Mode Swapper */}
                    <button
                        onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 hover:bg-white dark:hover:bg-slate-900 transition-all shrink-0"
                    >
                        {effectiveTheme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                    </button>
                </div>

                {/* Mobile Portal Navigation */}
                <button className="xl:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                </button>
            </div>

            {/* Mobile Cinematic Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 w-full bg-white dark:bg-primary-950 p-10 flex flex-col items-center gap-6 border-b border-slate-200 dark:border-white/10 lg:hidden overflow-y-auto max-h-[80vh]"
                    >
                        {navLinks.map((item) => (
                            <div key={item.label} className="flex flex-col items-center gap-4">
                                <Link href={item.path} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">{item.label}</Link>
                                {item.submenu && (
                                    <div className="flex flex-col items-center gap-3">
                                        {item.submenu.map(sub => (
                                            <Link key={sub.label} href={sub.path} onClick={() => setIsMobileMenuOpen(false)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{sub.label}</Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="mt-4 px-12 py-4 bg-primary-600 text-white rounded-full text-xs font-black uppercase tracking-widest">Acceso Portal</Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
