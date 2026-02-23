'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Sparkles, ArrowRight, Bell } from 'lucide-react';
import Link from 'next/link';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import publicService from '@/services/publicService';
import { getImageUrl } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

export default function EventosPage() {
    const searchParams = useSearchParams();
    const tipoParam = searchParams.get('tipo');
    const [eventos, setEventos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        publicService.getLandingPageData()
            .then((res: any) => setEventos(res.eventos || []))
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, []);

    const filtered = eventos.filter(e => {
        if (!tipoParam) return true;
        const typeName = e.tipo?.nombre?.toLowerCase() || '';
        return typeName.includes(tipoParam.toLowerCase()) ||
            (tipoParam === 'conversatorios' && typeName.includes('conversatorio')) ||
            (tipoParam === 'webinars' && typeName.includes('webinar'));
    });

    return (
        <GenericPageTemplate
            title="Agenda Nacional"
            description="Cronograma oficial de seminarios, talleres y eventos de alto nivel académico del magisterio boliviano."
            icon={Calendar}
        >
            <div className="space-y-40">

                {/* ── EVENTS TIMELINE/GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {isLoading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-96 rounded-[4rem] bg-slate-50 dark:bg-white/5 animate-pulse" />
                        ))
                    ) : filtered.length > 0 ? (
                        filtered.map((evt, idx) => {
                            const cuestionarioActivo = evt.cuestionarios?.some((c: any) => {
                                const now = new Date();
                                return c.estado === 'activo' && new Date(c.fechaInicio) <= now && new Date(c.fechaFin) >= now;
                            });

                            return (
                                <motion.div
                                    key={evt.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    className="group relative rounded-[3rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
                                >
                                    {/* Image Section */}
                                    <div className="relative h-64 overflow-hidden">
                                        {evt.banner ? (
                                            <img src={getImageUrl(evt.banner)} alt={evt.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center">
                                                <Calendar className="w-16 h-16 text-white/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                        {/* Badges on image */}
                                        <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                                            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                                                {evt.tipo?.nombre || 'Evento'}
                                            </span>
                                            {cuestionarioActivo && (
                                                <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                    Evaluación Disponible
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-10 space-y-6">
                                        <div className="flex items-center gap-4 text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {new Date(evt.fecha).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">
                                                    {evt.lugar || 'Nacional'}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight leading-tight group-hover:text-primary-600 transition-colors">
                                            {evt.nombre}
                                        </h3>

                                        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                                            {evt.descripcion || 'Únete a la vanguardia educativa nacional en este evento exclusivo para el magisterio.'}
                                        </p>

                                        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                                            <Link href={`/eventos/${evt.codigo || evt.id}`}
                                                className="flex items-center justify-between w-full text-[11px] font-black uppercase tracking-[0.3em] text-primary-600 hover:text-primary-700 transition-all">
                                                <span>Participar Ahora</span>
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-40 text-center space-y-8">
                            <div className="w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                <Bell className="w-12 h-12 text-slate-300" />
                            </div>
                            <p className="text-2xl font-black text-slate-400 uppercase tracking-widest">No hay eventos programados en este momento</p>
                        </div>
                    )}
                </div>

                {/* ── NOTIFICATIONS CALLOUT ── */}
                <section className="relative p-20 rounded-[4rem] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <Sparkles className="w-32 h-32 text-slate-900" />
                    </div>
                    <div className="space-y-4 text-center lg:text-left">
                        <h4 className="text-3xl font-black uppercase tracking-tighter text-slate-950 dark:text-white">¿Deseas recibir alertas nacionales?</h4>
                        <p className="text-lg text-slate-500 font-medium">Suscríbete para estar al tanto de cada nueva oportunidad académica.</p>
                    </div>
                    <div className="flex gap-4 w-full lg:w-auto">
                        <input type="email" placeholder="tu@correo.com" className="flex-1 lg:w-80 h-16 px-8 rounded-2xl bg-white dark:bg-primary-900 border border-slate-200 dark:border-white/10 outline-none focus:border-primary-600 transition-all" />
                        <button className="px-10 h-16 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-700 transition-all shadow-xl">Suscribir</button>
                    </div>
                </section>
            </div>
        </GenericPageTemplate>
    );
}
