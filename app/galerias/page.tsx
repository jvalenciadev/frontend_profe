'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Camera, Search, Bell } from 'lucide-react';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import publicService from '@/services/publicService';

export default function GaleriasPage() {
    const [galerias, setGalerias] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        publicService.getLandingPageData()
            .then((res: any) => setGalerias(res.galerias || []))
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, []);

    const IMG = (src: string) => {
        if (!src) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80';
        return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    };

    return (
        <GenericPageTemplate
            title="Galerías Institucionales"
            description="Un recorrido visual por las actividades, ferias y momentos memorables del magisterio boliviano."
            icon={ImageIcon}
        >
            <div className="space-y-24">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="aspect-square rounded-[3rem] bg-slate-100 dark:bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : galerias.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {galerias.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative aspect-square rounded-[3rem] overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                            >
                                <img src={IMG(item.imagen)} alt={item.titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-10 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <h4 className="text-xl font-black text-white uppercase tracking-tighter">{item.titulo}</h4>
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-2">{item.descripcion || 'Registro Institucional'}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-40 text-center space-y-8">
                        <div className="w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <Camera className="w-12 h-12 text-slate-300" />
                        </div>
                        <p className="text-2xl font-black text-slate-400 uppercase tracking-widest">No se encontraron galerías</p>
                    </div>
                )}
            </div>
        </GenericPageTemplate>
    );
}
