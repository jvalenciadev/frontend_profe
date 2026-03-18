'use client';

import React, { useEffect, useState } from 'react';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, Search, Filter, ArrowRight, Clock, User, 
    Calendar, Bookmark, Sparkles, Share2, BookMarked,
    TrendingUp, Award, Newspaper, Lightbulb
} from 'lucide-react';
import publicService from '@/services/publicService';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';

// --- TYPES ---
interface BlogPost {
    id: string;
    titulo: string;
    subtitulo?: string;
    contenido?: string;
    imagen?: string;
    fecha: string;
    autor?: string;
    categoria?: string;
    tags?: string[];
    isScientific?: boolean;
}

export default function BlogPage() {
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todos');

    useEffect(() => {
        // Load data
        publicService.getLandingPageData().then(data => {
            // Mapping existing landings blogs
            const formatted = (data.blogs || []).map((b: any) => ({
                ...b,
                // Mocking some data if missing for the "Scientific" feel
                categoria: b.categoria || (Math.random() > 0.5 ? 'Investigación' : 'Pedagogía'),
                isScientific: b.titulo.toLowerCase().includes('científico') || b.titulo.toLowerCase().includes('investigación') || Math.random() > 0.7
            }));
            setBlogs(formatted);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const filters = ['Todos', 'Artículos Científicos', 'Pedagogía', 'Actualidad', 'Institucional'];

    const filteredBlogs = blogs.filter(post => {
        const matchesSearch = post.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             post.subtitulo?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeFilter === 'Todos') return matchesSearch;
        if (activeFilter === 'Artículos Científicos') return matchesSearch && post.isScientific;
        return matchesSearch && (post.categoria === activeFilter);
    });

    const IMG = (src: string | undefined) => getImageUrl(src) || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80';

    return (
        <GenericPageTemplate
            title="Revista Científica & Blog"
            description="Producción intelectual, avances académicos e información relevante del Magisterio Plurinacional."
            icon={BookOpen}
        >
            <div className="space-y-24">
                
                {/* --- PREMIUM FILTER & SEARCH BAR --- */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl">
                    <div className="flex flex-wrap items-center gap-4">
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeFilter === f 
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar artículos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-8 py-5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* --- FEATURED SECTION (TOP HIGHLIGHT) --- */}
                {filteredBlogs.length > 0 && activeFilter === 'Todos' && !searchQuery && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative overflow-hidden rounded-[5rem] h-[600px] border border-primary-500/10 shadow-3xl"
                    >
                        <img 
                            src={IMG(filteredBlogs[0].imagen)} 
                            className="w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-110" 
                            alt="Featured"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-12 lg:p-24 flex flex-col justify-end gap-8">
                            <div className="space-y-6 max-w-4xl">
                                <div className="flex items-center gap-6">
                                    <span className="px-6 py-2 rounded-full bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Destacado de la Semana
                                    </span>
                                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> 8 min de lectura
                                    </span>
                                </div>
                                <h2 className="text-4xl md:text-7xl font-black text-white leading-none tracking-tighter uppercase">
                                    {filteredBlogs[0].titulo}
                                </h2>
                                <p className="text-white/70 text-lg md:text-2xl font-medium leading-relaxed line-clamp-2">
                                    {filteredBlogs[0].subtitulo}
                                </p>
                            </div>
                            <div className="flex items-center gap-8">
                                <Link 
                                    href={`/blog/${filteredBlogs[0].id}`}
                                    className="px-14 py-7 bg-white text-primary-600 rounded-full text-[11px] font-black uppercase tracking-[0.4em] hover:bg-primary-600 hover:text-white transition-all shadow-2xl"
                                >
                                    Abrir Articulo
                                </Link>
                                <button className="w-16 h-16 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white hover:text-primary-600 transition-all">
                                    <Bookmark className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- ARTICLES GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="aspect-[4/5] rounded-[4rem] bg-slate-100 dark:bg-white/5 animate-pulse" />
                            ))
                        ) : (
                            filteredBlogs.map((post, idx) => (
                                <motion.div
                                    layout
                                    key={post.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                                    className="group flex flex-col gap-10"
                                >
                                    <div className="relative aspect-[16/11] rounded-[4rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-xl">
                                        <img 
                                            src={IMG(post.imagen)} 
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                            alt={post.titulo}
                                        />
                                        <div className="absolute top-8 left-8 flex flex-col gap-4">
                                            <span className="px-5 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-primary-600 shadow-lg">
                                                {post.categoria}
                                            </span>
                                            {post.isScientific && (
                                                <span className="px-5 py-2 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                                                    <Award className="w-4 h-4" /> Journal
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform">
                                                <ArrowRight className="w-10 h-10" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 px-4">
                                        <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                            <Calendar className="w-4 h-4 text-primary-600" /> 
                                            {new Date(post.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-950 dark:text-white leading-[1.2] tracking-tight group-hover:text-primary-600 transition-colors uppercase">
                                            {post.titulo}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed line-clamp-3">
                                            {post.subtitulo}
                                        </p>
                                        <div className="pt-4 flex items-center justify-between">
                                            <Link 
                                                href={`/blog/${post.id}`}
                                                className="inline-flex items-center gap-5 text-primary-600 text-[11px] font-black uppercase tracking-[0.3em] group/link"
                                            >
                                                Seguir Leyendo 
                                                <div className="w-12 h-[2px] bg-primary-600 group-hover/link:w-20 transition-all duration-500" />
                                            </Link>
                                            <div className="flex gap-4">
                                                <button className="text-slate-300 hover:text-primary-600 transition-colors"><Bookmark className="w-5 h-5" /></button>
                                                <button className="text-slate-300 hover:text-primary-600 transition-colors"><Share2 className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* --- MAGAZINE SUBSCRIPTION CARD (INSTITUTIONAL FEEL) --- */}
                <div className="relative mt-40 rounded-[5rem] bg-slate-950 p-12 md:p-24 overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-[180px]" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px]" />
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <span className="text-primary-600 font-black text-[11px] uppercase tracking-[0.8em]">EDICIÓN IMPRESA & DIGITAL</span>
                                <h2 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter uppercase">
                                    Suscríbete a la <br /> <span className="text-primary-600">Gaceta Científica.</span>
                                </h2>
                                <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-xl">
                                    Recibe mensualmente los mejores artículos científicos, investigaciones pedagógicas y novedades del sistema educativo nacional.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <input 
                                    type="email" 
                                    placeholder="Tu correo institucional"
                                    className="px-10 py-7 rounded-full bg-white/5 border border-white/10 text-white min-w-[300px] outline-none focus:ring-4 focus:ring-primary-600/20 transition-all font-bold"
                                />
                                <button className="px-12 py-7 bg-primary-600 text-white rounded-full text-[11px] font-black uppercase tracking-[0.5em] hover:brightness-110 transition-all shadow-2xl">
                                    Unirse a la Red
                                </button>
                            </div>
                        </div>
                        <div className="relative hidden lg:block">
                            <div className="aspect-[4/5] rounded-[4rem] bg-white transform rotate-6 scale-90 opacity-10 absolute inset-0 translate-x-12 translate-y-12" />
                            <div className="aspect-[4/5] rounded-[4rem] bg-white transform -rotate-3 overflow-hidden shadow-3xl">
                                <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Magazine" />
                                <div className="absolute inset-0 bg-primary-600/40 mix-blend-multiply" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white gap-8">
                                    <BookMarked className="w-32 h-32 opacity-20" />
                                    <p className="text-3xl font-black uppercase tracking-widest leading-none">Edición Especial <br /> Soberanía Científica</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </GenericPageTemplate>
    );
}
