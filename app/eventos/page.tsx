'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Sparkles, ArrowRight, Bell } from 'lucide-react';
import Link from 'next/link';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import publicService from '@/services/publicService';

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
                        filtered.map((evt, idx) => (
                            <motion.div
                                key={evt.id}
                                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                className="group relative p-12 rounded-[4rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 overflow-hidden transition-all duration-700 hover:shadow-2xl"
                            >
                                <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
                                    <div className="flex-shrink-0 w-32 h-32 rounded-3xl bg-primary-600 text-white flex flex-col items-center justify-center space-y-1 shadow-2xl">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Evento</span>
                                        <Calendar className="w-8 h-8" />
                                    </div>

                                    <div className="space-y-6 flex-1">
                                        <div className="flex items-center justify-center md:justify-start gap-4">
                                            <span className="px-4 py-1.5 rounded-full bg-primary-600/10 text-primary-600 text-[10px] font-black uppercase tracking-widest border border-primary-600/20">
                                                Oficial PROFE
                                            </span>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Próximamente</span>
                                            </div>
                                        </div>
                                        <h3 className="text-4xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">{evt.nombre || 'Seminario de Alta Especialización'}</h3>
                                        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">Únete a la vanguardia educativa nacional en este evento exclusivo para el magisterio.</p>

                                        <button className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.4em] text-primary-600 hover:gap-6 transition-all">
                                            Confirmar Asistencia <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
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
