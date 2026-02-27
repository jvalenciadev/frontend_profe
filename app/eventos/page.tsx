'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Users, ArrowRight, Search,
    Zap, Clock, Tag, Filter, SlidersHorizontal, ChevronDown,
    Globe, BookOpen, Star
} from 'lucide-react';
import Link from 'next/link';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import publicService from '@/services/publicService';
import { getImageUrl } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function EventoCard({ evento, index }: { evento: any; index: number }) {
    const tipoNombre = evento.tipo?.nombre || '';
    const hasEval = evento.cuestionarios?.some((c: any) => {
        const now = new Date();
        return c.estado === 'activo' && new Date(c.fechaInicio) <= now && new Date(c.fechaFin) >= now;
    });

    return (
        <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.07 }}
            className="group relative bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
        >
            {/* Image / Banner */}
            <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-black/40">
                {evento.banner ? (
                    <img
                        src={getImageUrl(evento.banner)}
                        alt={evento.nombre}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-slate-400 dark:text-slate-600" strokeWidth={1} />
                    </div>
                )}

                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Badges flotantes */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {tipoNombre && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border backdrop-blur-sm bg-primary border-primary text-white shadow-md">
                            <Tag className="w-3 h-3" />
                            {tipoNombre}
                        </span>
                    )}
                    {hasEval && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-black text-[11px] font-black animate-pulse">
                            <Zap className="w-3 h-3" />
                            Evaluación activa
                        </span>
                    )}
                </div>

                {/* Fecha bottom-left */}
                <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 text-white/90 text-[11px] font-black">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(evento.fecha)}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                        {evento.nombre}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {evento.descripcion || 'Evento académico del magisterio boliviano.'}
                    </p>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-500">
                    {evento.lugar && (
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {evento.lugar}
                        </span>
                    )}
                    {evento.totalInscritos > 0 && (
                        <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {evento.totalInscritos} inscritos
                        </span>
                    )}
                    {evento.tenant?.nombre && (
                        <span className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            {evento.tenant.nombre}
                        </span>
                    )}
                </div>

                {/* CTA */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                    <Link
                        href={`/eventos/${evento.codigo || evento.id}`}
                        className="flex items-center justify-between w-full group/btn"
                    >
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                            Ver y Participar
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-white transition-all">
                            <ArrowRight className="w-4 h-4 text-primary group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" />
                        </div>
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}

function EventosContent() {
    const searchParams = useSearchParams();
    const tipoParam = searchParams.get('tipo');
    const [eventos, setEventos] = useState<any[]>([]);
    const [tipos, setTipos] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedTipo, setSelectedTipo] = useState(tipoParam || '');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        Promise.all([
            publicService.getLandingPageData(),
            publicService.getTiposEvento()
        ])
            .then(([resPage, resTipos]) => {
                setEventos(resPage.eventos || []);
                const tiposDb = resTipos.map((t: any) => t.nombre).filter(Boolean);
                // Asegurarse de quitar duplicados por si acaso, usando mayúsculas o minúsculas no importa,
                // Pero guardaremos los nombres en el formato original de la DB
                setTipos(Array.from(new Set(tiposDb)));
            })
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, []);

    const filtered = eventos.filter(e => {
        const matchSearch = !search ||
            (e.nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (e.descripcion?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (e.lugar?.toLowerCase() || '').includes(search.toLowerCase());
        const matchTipo = !selectedTipo || (e.tipo?.nombre || '').toLowerCase().includes(selectedTipo.toLowerCase());
        return matchSearch && matchTipo;
    });

    const statsData = [
        { label: 'Eventos activos', val: eventos.filter(e => e.estado === 'activo').length, icon: Zap, color: 'text-primary' },
        { label: 'Participantes', val: eventos.reduce((a, e) => a + (e.totalInscritos || 0), 0), icon: Users, color: 'text-blue-500' },
        { label: 'Categorías', val: tipos.length, icon: Tag, color: 'text-amber-500' },
        { label: 'Total eventos', val: eventos.length, icon: BookOpen, color: 'text-purple-500' },
    ];

    return (
        <GenericPageTemplate
            title="Agenda Nacional"
            description="Cronograma oficial de seminarios, talleres y eventos de alto nivel académico del magisterio boliviano."
            icon={Calendar}
        >
            <div className="space-y-16">

                {/* ── PRESENTATION BANNER & STATS ── */}
                <div className="relative w-full rounded-[2.5rem] bg-slate-950 overflow-hidden shadow-2xl border border-slate-800">
                    {/* Placeholder Banner Image - El user puede cambiar esto luego */}
                    <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                        <img
                            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"
                            alt="Banner Eventos"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Dark gradient for text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />

                    <div className="relative z-10 p-10 md:p-16 lg:p-20 flex flex-col xl:flex-row gap-12 items-center justify-between">

                        {/* Texto del Banner */}
                        <div className="max-w-2xl text-center xl:text-left">
                            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-4">
                                Plataforma de <span className="text-primary">Capacitación</span>
                            </h2>
                            <p className="text-slate-400 text-sm md:text-base max-w-lg leading-relaxed mx-auto xl:mx-0">
                                Accede al catálogo nacional especializado de formación continua. Espacio destinado a futuros banners promocionales institucionales.
                            </p>
                        </div>

                        {/* Stats Row integradas al Banner */}
                        {!isLoading && eventos.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-2 w-full xl:w-auto shrink-0">
                                {statsData.map((s, i) => (
                                    <motion.div
                                        key={s.label}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.08 }}
                                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center shadow-2xl hover:bg-white/10 transition-colors"
                                    >
                                        <s.icon className={`w-6 h-6 mx-auto mb-3 ${s.color} drop-shadow-md`} />
                                        <p className="text-3xl font-black text-white">{s.val}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── FILTROS ────────────────────────────────────────────── */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar eventos..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-primary transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>

                        {/* Tipo filter */}
                        <div className="relative">
                            <select
                                value={selectedTipo}
                                onChange={e => setSelectedTipo(e.target.value)}
                                className="h-14 pl-5 pr-10 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-primary transition-all text-sm font-bold text-slate-900 dark:text-white appearance-none min-w-[180px]"
                            >
                                <option value="">Todos los tipos</option>
                                {tipos.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Tipos como pills */}
                    {tipos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedTipo('')}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${!selectedTipo ? 'bg-primary border border-primary text-white shadow-lg' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-primary/40 focus:outline-none'}`}
                            >
                                Todos
                            </button>
                            {tipos.map(t => {
                                const active = selectedTipo === t;
                                return (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedTipo(active ? '' : t)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${active ? 'bg-primary border border-primary text-white shadow-lg scale-105' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-primary/40 focus:outline-none'}`}
                                    >
                                        {t.toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Contador de resultados */}
                    {!isLoading && (
                        <p className="text-sm text-slate-400 font-medium">
                            {filtered.length === eventos.length
                                ? `${eventos.length} eventos encontrados`
                                : `${filtered.length} de ${eventos.length} eventos`}
                        </p>
                    )}
                </div>

                {/* ── GRID DE EVENTOS ───────────────────────────────────── */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-80 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filtered.map((evt, idx) => (
                                <EventoCard key={evt.id} evento={evt} index={idx} />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-32 text-center space-y-6"
                    >
                        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto">
                            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-xl font-black uppercase tracking-widest text-slate-400">Sin eventos disponibles</p>
                            <p className="text-sm text-slate-400 mt-2">No se encontraron eventos con los filtros seleccionados.</p>
                        </div>
                        {(search || selectedTipo) && (
                            <button
                                onClick={() => { setSearch(''); setSelectedTipo(''); }}
                                className="px-6 py-3 rounded-2xl bg-primary text-white text-sm font-black hover:opacity-90 transition-all"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </motion.div>
                )}

                {/* ── SECCIÓN INFORMATIVA ────────────────────────────────── */}
                {!isLoading && (
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:to-primary/5 border border-primary/20 rounded-[3rem] p-12 md:p-16"
                    >
                        {/* Decorative blobs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10">
                            <div className="space-y-4 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                                    <Star className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-black uppercase tracking-widest text-primary">Formación Continua</span>
                                </div>
                                <h4 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                    Sé parte del cambio<br />
                                    <span className="text-primary">educativo nacional</span>
                                </h4>
                                <p className="text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                                    Inscríbete en los eventos académicos del Programa de Formación de Educadores y
                                    fortalece tus competencias profesionales.
                                </p>
                            </div>
                            <div className="flex flex-col gap-4 w-full lg:w-auto">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href="/registro-profe"
                                        className="px-8 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all text-center whitespace-nowrap"
                                    >
                                        Registrarse en PROFE
                                    </Link>
                                    <Link
                                        href="/"
                                        className="px-8 py-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-black uppercase tracking-widest text-xs hover:border-primary/40 transition-all text-center text-slate-900 dark:text-white whitespace-nowrap"
                                    >
                                        Más información
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}
            </div>
        </GenericPageTemplate>
    );
}

export default function EventosPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <EventosContent />
        </React.Suspense>
    );
}
