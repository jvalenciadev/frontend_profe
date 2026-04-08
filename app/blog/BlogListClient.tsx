'use client';

import React, { useState, useMemo } from 'react';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import { 
    BookOpen, Search, ArrowRight, User, 
    Calendar, Share2, BookMarked,
    Newspaper, PlayCircle, Megaphone, Bell, Award, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';

function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('es-BO', options || { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// --- TYPES ---
interface BlogPost {
    id: string;
    titulo: string;
    subtitulo?: string;
    descripcion?: string; 
    contenido?: string;   
    imagen?: string;      
    imagenes?: any;       
    fecha: string;
    autor?: string;
    categoria?: string;
    tipo?: string;
}

interface ProfeData {
    color?: string;
    colorSecundario?: string;
    nombre?: string;
}

interface BlogListClientProps {
    initialBlogs: BlogPost[];
    profe?: ProfeData;
}

const TIPO_MAP: Record<string, { label: string, colorClass: string }> = {
    'noticia': { label: 'Noticia', colorClass: 'text-blue-600' },
    'evento': { label: 'Evento', colorClass: 'text-emerald-600' },
    'tutorial': { label: 'Tutorial', colorClass: 'text-amber-600' },
    'comunicado': { label: 'Comunicado', colorClass: 'text-rose-600' },
    'investigacion': { label: 'Investigación', colorClass: 'text-purple-600' },
    'default': { label: 'Artículo', colorClass: 'text-slate-600' }
};

export default function BlogListClient({ initialBlogs, profe }: BlogListClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeType, setActiveType] = useState('Todos');

    const brandColor = profe?.color || '#0f172a'; // Color institucional del backend

    const processedBlogs = useMemo(() => {
        return initialBlogs.map(b => {
            let mainImage = '';
            if (b.imagenes) {
                const getPath = (item: any) => typeof item === 'string' ? item : (item?.path || '');
                if (Array.isArray(b.imagenes) && b.imagenes.length > 0) {
                    mainImage = getPath(b.imagenes[0]);
                } else if (typeof b.imagenes === 'string' && b.imagenes.length > 0) {
                    try {
                        const parsed = JSON.parse(b.imagenes);
                        if (Array.isArray(parsed) && parsed.length > 0) mainImage = getPath(parsed[0]);
                        else mainImage = b.imagenes;
                    } catch {
                        mainImage = b.imagenes;
                    }
                }
            }
            return { ...b, imagen: mainImage || b.imagen };
        });
    }, [initialBlogs]);

    const filteredBlogs = processedBlogs.filter(post => {
        const matchesSearch = post.titulo.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeType === 'Todos') return matchesSearch;
        return matchesSearch && (post.tipo?.toLowerCase() === activeType.toLowerCase());
    });

    const categories = ['Todos', 'Noticia', 'Evento', 'Tutorial', 'Comunicado'];
    const IMG = (src: string | undefined) => getImageUrl(src) || 'https://images.unsplash.com/photo-1512428559083-a40ce7ba6e6f?auto=format&fit=crop&q=80';

    return (
        <GenericPageTemplate
            title="Publicaciones & Prensa"
            description="Archivo histórico y científico del Sistema Educativo Plurinacional."
            icon={Newspaper}
        >
            <div className="max-w-[1400px] mx-auto space-y-12">
                
                {/* --- HEADER: INSTITUTIONAL COLOR LINE --- */}
                <div className="border-b-4 pb-8" style={{ borderColor: brandColor }}>
                    <div className="flex flex-col lg:flex-row items-end justify-between gap-10">
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.6em] opacity-40">FILTRAR HEMEROTECA</h2>
                            <div className="flex flex-wrap gap-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveType(cat)}
                                        className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                            activeType === cat 
                                            ? 'text-white border-transparent' 
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                        }`}
                                        style={activeType === cat ? { backgroundColor: brandColor } : {}}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="BUSCAR POR TÍTULO..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-b-2 border-slate-200 focus:border-slate-900 outline-none text-[11px] font-bold tracking-widest uppercase"
                            />
                        </div>
                    </div>
                </div>

                {/* --- CONTENT GRID: BALANCED & SHARP --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* FEATURED: Always in color, sharp corners */}
                    {filteredBlogs.length > 0 && activeType === 'Todos' && !searchQuery && (
                        <div className="lg:col-span-8 group">
                            <Link href={`/blog/${filteredBlogs[0].id}`} className="block space-y-8">
                                <div className="relative aspect-[21/9] overflow-hidden border border-slate-200 shadow-sm">
                                    <img 
                                        src={IMG(filteredBlogs[0].imagen)} 
                                        className="w-full h-full object-cover" 
                                        alt="Featured" 
                                    />
                                    <div className="absolute top-0 left-0 text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: brandColor }}>
                                        DESTACADO
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span style={{ color: brandColor }}>{TIPO_MAP[filteredBlogs[0].tipo?.toLowerCase() || 'default'].label}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span>{formatDate(filteredBlogs[0].fecha)}</span>
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black text-slate-950 leading-tight uppercase font-fraunces tracking-tight hover:opacity-80 transition-opacity">
                                        {filteredBlogs[0].titulo}
                                    </h1>
                                    <p className="text-lg text-slate-600 font-serif leading-relaxed max-w-4xl border-l-4 border-slate-200 pl-8">
                                        {filteredBlogs[0].subtitulo || filteredBlogs[0].descripcion}
                                    </p>
                                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100 max-w-xs">
                                        <div className="w-8 h-8 rounded-none border border-slate-200 flex items-center justify-center text-slate-400"><User className="w-4 h-4" /></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-950">{filteredBlogs[0].autor || 'Consejo Editorial'}</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* SIDEBAR: Simple, high density */}
                    <div className="lg:col-span-4 space-y-12">
                        <div className="bg-slate-50 p-8 border-t-4" style={{ borderColor: brandColor }}>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8" style={{ color: brandColor }}>Últimas Noticias</h3>
                            <div className="space-y-8">
                                {filteredBlogs.slice(activeType === 'Todos' && !searchQuery ? 1 : 0, 8).map((post) => (
                                    <Link key={post.id} href={`/blog/${post.id}`} className="group block space-y-2 pb-6 border-b border-slate-200 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>{formatDate(post.fecha)}</span>
                                            <span style={{ color: brandColor }}>{TIPO_MAP[post.tipo?.toLowerCase() || 'default'].label}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:opacity-70 font-fraunces uppercase">
                                            {post.titulo}
                                        </h4>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CARDS GRID: Always color, sharp --- */}
                <div className="pt-16 border-t-2 border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-3">
                        {filteredBlogs.slice(activeType === 'Todos' && !searchQuery ? 8 : 0).map((post) => (
                            <div key={post.id} className="group border border-slate-100 p-8 hover:bg-slate-50 transition-all">
                                <Link href={`/blog/${post.id}`} className="space-y-6 block">
                                    <div className="aspect-video overflow-hidden border border-slate-200 mb-4">
                                        <img src={IMG(post.imagen)} className="w-full h-full object-cover" alt="Article" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                            <span>{formatDate(post.fecha)}</span>
                                            <span style={{ color: brandColor }}>{TIPO_MAP[post.tipo?.toLowerCase() || 'default'].label}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 leading-tight uppercase font-fraunces group-hover:opacity-70 transition-opacity line-clamp-2">
                                            {post.titulo}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-serif line-clamp-2 leading-relaxed">
                                            {post.subtitulo || post.descripcion}
                                        </p>
                                    </div>
                                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                            Leer Artículo <ChevronRight className="w-3 h-3" />
                                        </span>
                                        <Share2 className="w-4 h-4 text-slate-300 hover:opacity-100 transition-opacity" />
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </GenericPageTemplate>
    );
}
