'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe, Building2, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import publicService from '@/services/publicService';

interface Departamento {
    id: string; nombre: string; abreviacion: string;
}

export default function SedesPage() {
    const [sedes, setSedes] = useState<Departamento[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        publicService.getDepartamentos()
            .then(setSedes)
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <GenericPageTemplate
            title="Sedes Nacionales"
            description="Presencia absoluta en los 9 departamentos. Una red de formación descentralizada para llegar a cada maestro de Bolivia."
            icon={MapPin}
        >
            <div className="space-y-40">

                {/* ── INTERACTIVE SEDES GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {isLoading ? (
                        [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                            <div key={i} className="h-80 rounded-[4rem] bg-slate-50 dark:bg-white/5 animate-pulse" />
                        ))
                    ) : (
                        sedes.map((sede, idx) => (
                            <motion.div
                                key={sede.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative p-12 rounded-[4rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-primary-600/10"
                            >
                                <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-8 translate-y-[-8]">
                                    <Building2 className="w-32 h-32" />
                                </div>

                                <div className="space-y-8 relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                                        <MapPin className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter uppercase">{sede.nombre}</h3>
                                        <p className="text-[11px] font-black text-primary-600 tracking-[0.5em] mt-2">JURISDICCIÓN S{sede.abreviacion}</p>
                                    </div>

                                    <Link
                                        href={`/?tenant=${sede.abreviacion}`}
                                        className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-primary-600 transition-colors"
                                    >
                                        Ver Plataforma Sede <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* ── MAJESTIC CALLOUT ── */}
                <section className="relative p-20 md:p-32 rounded-[6rem] bg-primary-950 text-white overflow-hidden text-center space-y-12">
                    <div className="absolute inset-0 bg-primary-600/10 blur-[150px] animate-pulse" />
                    <Globe className="w-32 h-32 mx-auto text-primary-600 opacity-50 animate-spin-slow" />
                    <div className="space-y-6 relative z-10">
                        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">Alcance <span className="text-primary-600">Plurinacional.</span></h2>
                        <p className="text-2xl text-white/60 max-w-3xl mx-auto font-medium leading-relaxed">
                            Desde las ciudades capitales hasta los distritos más alejados, PROFE garantiza la presencia del Estado a través de la formación de postgrado.
                        </p>
                    </div>
                    <div className="flex justify-center relative z-10">
                        <div className="px-10 py-4 rounded-full bg-white/5 border border-white/10 flex items-center gap-4">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <span className="text-[11px] font-black uppercase tracking-[0.5em]">Red de Formación más grande del país</span>
                        </div>
                    </div>
                </section>
            </div>

            <style jsx>{`
               @keyframes spin-slow {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
               }
               .animate-spin-slow {
                  animation: spin-slow 20s linear infinite;
               }
            `}</style>
        </GenericPageTemplate>
    );
}
