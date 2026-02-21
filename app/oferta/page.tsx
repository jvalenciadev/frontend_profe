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
}

export default function OfertaPage() {
    const searchParams = useSearchParams();
    const tipoParam = searchParams.get('tipo');
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { config } = useProfe();

    const IMG = (src: string | null) => {
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
            <div className="space-y-24">

                {/* ── SEARCH & FILTER BAR: CINEMATIC ── */}
                <div className="flex flex-col md:flex-row gap-8 items-center justify-between pb-12 border-b border-slate-100 dark:border-white/5">
                    <div className="relative w-full max-w-2xl group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-hover:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por programa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-24 pl-20 pr-10 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-xl font-bold focus:border-primary-600 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="px-8 py-4 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {filtered.length} Resultados Encontrados
                        </div>
                    </div>
                </div>

                {/* ── PROGRAMS GRID: MAJESTIC ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            /* Skeleton */
                            [1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-[550px] rounded-[4rem] bg-slate-50 dark:bg-white/5 animate-pulse" />
                            ))
                        ) : (
                            filtered.map((prog, idx) => (
                                <motion.div
                                    key={prog.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative h-[550px] rounded-[4rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-12 overflow-hidden flex flex-col justify-between shadow-2xl hover:shadow-primary-600/10 transition-all duration-700"
                                >
                                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0">
                                        {config?.imagen ? (
                                            <img src={IMG(config.imagen)!} className="w-32 h-32 object-contain grayscale" alt="" />
                                        ) : (
                                            <BookOpen className="w-32 h-32" />
                                        )}
                                    </div>

                                    <div className="space-y-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <span className="px-5 py-2 rounded-full bg-primary-600/10 text-primary-600 text-[10px] font-black uppercase tracking-widest border border-primary-600/20">
                                                {prog.tipo.nombre}
                                            </span>
                                            <span className="px-5 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                                {prog.modalidad.nombre}
                                            </span>
                                        </div>
                                        <h3 className="text-4xl font-black text-slate-950 dark:text-white leading-tight tracking-tight group-hover:text-primary-600 transition-colors">
                                            {prog.nombre}
                                        </h3>
                                    </div>

                                    <div className="space-y-10 relative z-10">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Duración</span>
                                                </div>
                                                <p className="text-xl font-bold dark:text-white">{prog.duracion.nombre}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Sede</span>
                                                </div>
                                                <p className="text-xl font-bold dark:text-white">{prog.sede.nombre}</p>
                                            </div>
                                        </div>

                                        <Link href={`/oferta/${prog.id}`} className="w-full py-7 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center gap-4 group/btn overflow-hidden relative transition-all hover:bg-primary-600 hover:text-white">
                                            <span className="text-[11px] font-black uppercase tracking-[0.4em] relative z-10 ml-[0.4em]">Ver Ficha Técnica</span>
                                            <ArrowRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-3 transition-transform duration-500" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {!isLoading && filtered.length === 0 && (
                    <div className="py-40 text-center space-y-8">
                        <div className="w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <Search className="w-12 h-12 text-slate-300" />
                        </div>
                        <p className="text-2xl font-black text-slate-400 uppercase tracking-widest">No se encontraron programas</p>
                        <button onClick={() => setSearchTerm('')} className="text-primary-600 font-black uppercase tracking-widest hover:underline">Limpiar Búsqueda</button>
                    </div>
                )}
            </div>
        </GenericPageTemplate>
    );
}
