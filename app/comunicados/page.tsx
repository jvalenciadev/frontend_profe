'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Bell, Calendar, ChevronRight, FileText } from 'lucide-react';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import publicService from '@/services/publicService';

export default function ComunicadosPage() {
    const [comunicados, setComunicados] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        publicService.getLandingPageData()
            .then((res: any) => setComunicados(res.comunicados || []))
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <GenericPageTemplate
            title="Comunicados Oficiales"
            description="Información de interés general, instructivos y noticias de último momento de nuestra institución."
            icon={Megaphone}
        >
            <div className="space-y-12">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-40 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                    ))
                ) : comunicados.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8">
                        {comunicados.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group p-10 rounded-[2.5rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:border-primary-600 transition-all shadow-xl hover:shadow-primary-600/5"
                            >
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="w-20 h-20 rounded-2xl bg-primary-600/10 text-primary-600 flex items-center justify-center shrink-0">
                                        <Bell className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                {item.tipo || 'INFORMATIVO'}
                                            </span>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">
                                                    {new Date(item.createdAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'long' })}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight uppercase group-hover:text-primary-600 transition-colors">
                                            {item.titulo}
                                        </h3>
                                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                            {item.contenido || 'Sin contenido detallado para este comunicado.'}
                                        </p>

                                        {item.archivo && (
                                            <a href={`${process.env.NEXT_PUBLIC_API_URL}${item.archivo}`} target="_blank" className="inline-flex items-center gap-3 text-primary-600 font-black uppercase tracking-widest text-[10px] pt-4 hover:gap-5 transition-all">
                                                Ver Documento Adjunto <ChevronRight className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-40 text-center space-y-8">
                        <div className="w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <Megaphone className="w-12 h-12 text-slate-300" />
                        </div>
                        <p className="text-2xl font-black text-slate-400 uppercase tracking-widest">No hay comunicados recientes</p>
                    </div>
                )}
            </div>
        </GenericPageTemplate>
    );
}
