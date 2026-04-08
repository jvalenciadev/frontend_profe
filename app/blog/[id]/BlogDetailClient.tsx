'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Calendar, User, ArrowLeft,
    Newspaper, Award, Megaphone,
    PlayCircle, Bell
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('es-BO', options || { day: '2-digit', month: '2-digit', year: 'numeric' });
}
import Link from 'next/link';

interface BlogDetailClientProps {
    post: any;
    profe?: any;
}

const TIPO_STYLES: Record<string, { color: string, icon: any, label: string, accent: string }> = {
    'noticia': { color: 'bg-blue-600', icon: Megaphone, label: 'Noticia Oficial', accent: 'border-blue-600/20 text-blue-600' },
    'evento': { color: 'bg-emerald-600', icon: Calendar, label: 'Evento Académico', accent: 'border-emerald-600/20 text-emerald-600' },
    'tutorial': { color: 'bg-amber-500', icon: PlayCircle, label: 'Tutorial Pedagógico', accent: 'border-amber-600/20 text-amber-600' },
    'comunicado': { color: 'bg-rose-600', icon: Bell, label: 'Comunicado Urgente', accent: 'border-rose-600/20 text-rose-600' },
    'investigacion': { color: 'bg-purple-600', icon: Award, label: 'Investigación Científica', accent: 'border-purple-600/20 text-purple-600' },
    'default': { color: 'bg-slate-600', icon: Newspaper, label: 'Artículo de Opinión', accent: 'border-slate-600/20 text-slate-600' }
};

export default function BlogDetailClient({ post: initialPost, profe }: BlogDetailClientProps) {
    const router = useRouter();
    const brandColor = profe?.color || '#0f172a';

    const post = React.useMemo(() => {
        if (!initialPost) return null;
        
        let mainImage = '';
        if (initialPost.imagenes) {
            const getPath = (item: any) => typeof item === 'string' ? item : (item?.path || '');
            if (Array.isArray(initialPost.imagenes) && initialPost.imagenes.length > 0) {
                mainImage = getPath(initialPost.imagenes[0]);
            } else if (typeof initialPost.imagenes === 'string' && initialPost.imagenes.length > 0) {
                try {
                    const parsed = JSON.parse(initialPost.imagenes);
                    if (Array.isArray(parsed) && parsed.length > 0) mainImage = getPath(parsed[0]);
                    else mainImage = initialPost.imagenes;
                } catch {
                    mainImage = initialPost.imagenes;
                }
            }
        }

        const tipoRaw = (initialPost.tipo || '').toLowerCase();
        const tipoKey = TIPO_STYLES[tipoRaw] ? tipoRaw : 'default';

        return {
            ...initialPost,
            imagen: mainImage || initialPost.imagen,
            tipoKey: tipoKey,
            autor: initialPost.autor,
            categoria: TIPO_STYLES[tipoKey].label,
        };
    }, [initialPost]);

    const IMG = (src: string | undefined) => getImageUrl(src) || 'https://images.unsplash.com/photo-1512428559083-a40ce7ba6e6f?auto=format&fit=crop&q=80';

    if (!post) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-8">
                <Newspaper className="w-16 h-16 text-slate-300" />
                <h1 className="text-4xl font-black uppercase font-fraunces">Artículo no encontrado</h1>
                <Link href="/blog" className="px-12 py-5 bg-slate-950 text-white font-black uppercase tracking-widest">Volver al Blog</Link>
            </div>
        );
    }

    const tStyle = TIPO_STYLES[post.tipoKey] || TIPO_STYLES.default;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white pb-32 font-inter">

            {/* --- TOP HUD: DISCREET & FUNCTIONAL --- */}
            <nav className="fixed top-8 left-8 md:left-16 z-50 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-md"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="h-4 w-px bg-slate-200 mx-2" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{formatDate(post.fecha)}</span>
            </nav>

            {/* --- ADAPTIVE HEADER: BOLDER & MORE PROMINENT --- */}
            <header className="pt-28 lg:pt-40 px-8 lg:px-16 max-w-[1600px] mx-auto overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center">
                    
                    {/* TEXT & INFO: 7 columns */}
                    <div className="lg:col-span-7 space-y-10 order-2 lg:order-1">
                        <div className="space-y-6">
                            <span className="inline-block px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white" style={{ backgroundColor: brandColor }}>
                                {post.tipo || tStyle.label}
                            </span>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-950 dark:text-white leading-[0.95] tracking-tighter uppercase font-fraunces">
                                {post.titulo}
                            </h1>
                            <p className="text-xl md:text-2xl text-slate-500 font-serif leading-relaxed italic border-l-4 border-slate-100 pl-8">
                                {post.subtitulo || post.descripcion}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-10 pt-10 border-t border-slate-100 dark:border-white/10">
                            {post.autor && (
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-950 flex items-center justify-center text-white p-2">
                                        <User className="w-full h-full" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-950">{post.autor}</span>
                                </div>
                            )}
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">ID REGISTRO: {post.id}</div>
                        </div>
                    </div>

                    {/* IMAGE CONTAINER: 5 columns (Bigger than before) */}
                    <div className="lg:col-span-5 order-1 lg:order-2">
                        <div className="relative aspect-square overflow-hidden border-[12px] border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-[550px] mx-auto">
                            <img 
                                src={IMG(post.imagen)} 
                                className="w-full h-full object-cover" 
                                alt="News Article" 
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* --- CONTENT BODY --- */}
            <main className="relative z-10 px-8 lg:px-16 mt-20">
                <div className="max-w-4xl mx-auto py-16 border-t-2 border-slate-50">
                    <article
                        className="prose prose-slate dark:prose-invert lg:prose-xl max-w-none prose-p:font-serif prose-p:leading-relaxed prose-headings:font-black prose-p:text-slate-700 dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: post.contenido }}
                    />
                </div>
            </main>

        </div>
    );
}
