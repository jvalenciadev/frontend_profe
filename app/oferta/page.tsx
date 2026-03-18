'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, Clock, MapPin, Search, Filter, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import publicService from '@/services/publicService';
import { useSearchParams } from 'next/navigation';
import { useProfe } from '@/contexts/ProfeContext';

interface Programa {
    id: string;
    nombre: string;
    tipo: { nombre: string };
    modalidad: { nombre: string };
    duracion: { nombre: string };
    sede: { nombre: string };
    costo: number;
    afiche?: string;
    banner?: string;
    codigo?: string;
    hasMultipleSedes?: boolean;
}

export default function OfertaPage() {
    const searchParams = useSearchParams();
    const tipoParam = searchParams.get('tipo');
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { config } = useProfe();

    const IMG = (src: string | null | undefined) => {
        if (!src) return null;
        return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    };

    useEffect(() => {
        publicService.getLandingPageData()
            .then((res: any) => {
                setProgramas(res.programas || []);
            })
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, []);

    const filtered = programas.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !tipoParam || p.tipo.nombre.toLowerCase().includes(tipoParam.toLowerCase()) ||
            (tipoParam === 'ciclos' && p.tipo.nombre.toLowerCase().includes('ciclo')) ||
            (tipoParam === 'diplomados' && p.tipo.nombre.toLowerCase().includes('diplomado'));
        return matchesSearch && matchesType;
    });

    return (
        <GenericPageTemplate
            title="Oferta Académica"
            description="Explora la vanguardia del postgrado educativo. Programas de alta especialización diseñados para el magisterio de excelencia."
            icon={GraduationCap}
        >
            <div className="space-y-16">

                {/* ── SEARCH & FILTER: CINEMATIC ── */}
                <div className="sticky top-20 z-40 py-8 bg-background/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 mx-[-2rem] px-[2rem]">
                    <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                        <div className="relative w-full max-w-2xl group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Escribe el nombre del programa para filtrar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-16 pl-16 pr-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-lg font-bold focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none placeholder:text-slate-300"
                            />
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-2 px-6 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                                <Filter size={14} className="text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {filtered.length} Programas Activos
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── PROGRAMS GRID: MAJESTIC ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            Array(12).fill(0).map((_, i) => (
                                <div key={i} className="h-[480px] rounded-[3rem] bg-slate-50 dark:bg-white/5 animate-pulse" />
                            ))
                        ) : (
                            filtered.map((prog, idx) => (
                                <motion.div
                                    key={prog.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                                    className="group relative h-[520px] rounded-[3rem] bg-card border border-border/40 overflow-hidden flex flex-col shadow-sm hover:shadow-3xl hover:shadow-primary/10 transition-all duration-500"
                                >
                                    {/* Poster / Cover */}
                                    <div className="h-2/3 relative overflow-hidden">
                                        {prog.afiche ? (
                                            <img
                                                src={IMG(prog.afiche)!}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                alt={prog.nombre}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                                <BookOpen size={64} className="text-primary/20" />
                                            </div>
                                        )}
                                        {/* Overlay Gradients */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

                                        {/* Badges on Img */}
                                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                                            <div className="flex flex-col gap-2">
                                                <span className="px-4 h-7 flex items-center rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 border border-white/10">
                                                    {prog.tipo.nombre}
                                                </span>
                                                <span className="px-4 h-7 flex items-center rounded-full bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                                                    {prog.modalidad.nombre}
                                                </span>
                                            </div>
                                            {prog.codigo && (
                                                <div className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10">
                                                    <span className="text-[10px] font-black text-white/80 tabular-nums">#{prog.codigo}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Title on Img Footer */}
                                        <div className="absolute bottom-6 left-8 right-8 pointer-events-none">
                                            <h3 className="text-xl font-black text-white leading-tight tracking-tight line-clamp-2 uppercase">
                                                {prog.nombre}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Info Body */}
                                    <div className="p-8 flex-1 flex flex-col justify-between">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Clock size={12} className="text-primary/60" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Duración</span>
                                                </div>
                                                <p className="text-xs font-black text-foreground truncate " title={prog.duracion.nombre}>
                                                    {prog.duracion.nombre}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <MapPin size={12} className="text-primary/60" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Sede</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-black text-foreground truncate max-w-full" title={prog.hasMultipleSedes ? 'Disponible en varias sedes' : (prog.sede?.nombre || 'Sede Central')}>
                                                        {prog.hasMultipleSedes ? 'Nacional' : (prog.sede?.nombre || 'Sede Central')}
                                                    </p>
                                                    {prog.hasMultipleSedes && (
                                                        <span className="px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-[8px] font-black uppercase tracking-tighter shrink-0">
                                                            + Sedes
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/oferta/${prog.id}`}
                                            className="group/btn h-14 rounded-2xl bg-primary text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
                                                {prog.hasMultipleSedes ? 'Ver Sedes Disponibles' : 'Conocer más'}
                                            </span>
                                            <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {!isLoading && filtered.length === 0 && (
                    <div className="py-40 text-center space-y-8 animate-in fade-in zoom-in">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200 dark:border-white/10">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xl font-black text-foreground uppercase tracking-widest">Sin resultados</p>
                            <p className="text-sm text-muted-foreground font-medium">Prueba con otros términos de búsqueda.</p>
                        </div>
                        <button onClick={() => setSearchTerm('')} className="px-8 h-12 rounded-full border border-primary text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                            Limpiar Filtros
                        </button>
                    </div>
                )}
            </div>
        </GenericPageTemplate>
    );
}

