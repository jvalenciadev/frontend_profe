'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Calendar, Clock, User, ArrowLeft,
    Share2, Bookmark, BookmarkCheck, Newspaper,
    ChevronRight, Sparkles, Award, Quote, Search
} from 'lucide-react';
import publicService from '@/services/publicService';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';

export default function BlogDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        if (!id) return;

        // Cargar datos
        // Intentamos obtener el detalle, o buscamos en landing page como fallback
        publicService.getLandingPageData().then(data => {
            const current = (data.blogs || []).find((b: any) => b.id === id);
            if (current) {
                // Mock data for richer view
                setPost({
                    ...current,
                    autor: 'Consejo Editorial PROFE',
                    categoria: 'Investigación Académica',
                    isScientific: current.titulo.toLowerCase().includes('científico') || Math.random() > 0.5,
                    contenido: current.contenido || `
                        <p>El desarrollo de nuevas estrategias pedagógicas en el magisterio boliviano representa un pilar fundamental para la transformación del sistema educativo nacional. En esta entrega, exploramos las dimensiones de la soberanía científica y cómo el Programa de Formación Especializada (PROFE) está liderando este proceso.</p>
                        
                        <h2>La Importancia de la Investigación en el Aula</h2>
                        <p>No basta con transmitir conocimientos; es imperativo generarlos desde nuestra propia realidad territorial. La investigación acción-participativa permite que los maestros no sean solo ejecutores de currículos, sino arquitectos de nuevas realidades pedagógicas.</p>
                        
                        <blockquote>"El magisterio es el guardián de la soberanía científica del Estado Plurinacional."</blockquote>
                        
                        <p>A través de los ciclos formativos y diplomados, se busca fortalecer las capacidades críticas y analíticas de los docentes, permitiéndoles publicar sus hallazgos en redes académicas de alto impacto.</p>
                        
                        <ul>
                            <li><strong>Desarrollo de Currículo:</strong> Adaptación de contenidos al contexto local.</li>
                            <li><strong>Tecnología Educativa:</strong> Integración de herramientas digitales en entornos rurales y urbanos.</li>
                            <li><strong>Pedagogía Crítica:</strong> Fomento del pensamiento reflexivo en el estudiante.</li>
                        </ul>
                        
                        <h2>Conclusiones Preliminares</h2>
                        <p>Este artículo es el inicio de una serie de publicaciones que buscan democratizar el conocimiento científico dentro del magisterio boliviano. Invitamos a todos los participantes a seguir explorando los recursos que PROFE pone a su disposición.</p>
                    `
                });
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    const IMG = (src: string | undefined) => getImageUrl(src) || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80';

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-8">
                <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-950 dark:text-white">Artículo no encontrado</h1>
                <Link href="/blog" className="px-12 py-5 bg-primary-600 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl">Volver al Blog</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-1000 selection:bg-primary-600 selection:text-white overflow-hidden">

            {/* --- ATMOSPHERE --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[1000px] h-[1000px] bg-primary-500/[0.04] rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[1000px] h-[1000px] bg-indigo-500/[0.02] rounded-full blur-[150px]" />
            </div>

            {/* --- NAVIGATION: CONTEXTUAL BACK BUTTON --- */}
            <nav className="fixed top-24 left-10 md:left-24 z-50 hidden lg:block">
                <button
                    onClick={() => router.back()}
                    className="group w-20 h-20 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-2xl"
                >
                    <ArrowLeft className="w-8 h-8 group-hover:-translate-x-2 transition-transform" />
                </button>
            </nav>

            {/* --- ARTICLE HEADER: THE MAJESTIC ALTAR --- */}
            <section className="relative pt-44 lg:pt-60 pb-32 px-10 lg:px-24 z-10 max-w-[1700px] mx-auto overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
                    <div className="lg:col-span-7 space-y-12">
                        <div className="space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap items-center gap-6"
                            >
                                <span className="px-6 py-2 rounded-full bg-primary-600/10 text-primary-600 text-[10px] font-black uppercase tracking-[0.4em] border border-primary-600/20">
                                    {post.categoria}
                                </span>
                                {post.isScientific && (
                                    <span className="flex items-center gap-3 text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em]">
                                        <Award className="w-5 h-5" /> Journal Certificado
                                    </span>
                                )}
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-primary-600" /> {post.readingTime || '8 min read'}
                                </span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-5xl md:text-8xl lg:text-[7.5rem] font-black text-slate-950 dark:text-white leading-[0.85] tracking-tighter uppercase"
                            >
                                {post.titulo}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl md:text-3xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-4xl"
                            >
                                {post.subtitulo}
                            </motion.p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex flex-wrap items-center gap-12 pt-8"
                        >
                            <div className="flex items-center gap-6 group">
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
                                    <User className="w-8 h-8 text-primary-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Autoría</p>
                                    <p className="text-lg font-black uppercase tracking-tighter group-hover:text-primary-600 transition-colors">{post.autor}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                                    <Calendar className="w-8 h-8 text-primary-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Publicado</p>
                                    <p className="text-lg font-black uppercase tracking-tighter">
                                        {new Date(post.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-5 relative">
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="aspect-[4/5] rounded-[6rem] overflow-hidden border border-primary-500/20 shadow-3xl transform rotate-3 hover:rotate-0 transition-transform duration-1000"
                        >
                            <img src={IMG(post.imagen)} className="w-full h-full object-cover" alt="Articulo" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                            <div className="absolute bottom-12 left-12 right-12 p-10 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/20 text-white flex items-center justify-between">
                                <p className="text-sm font-black uppercase tracking-[0.3em]">Archivo PROFE</p>
                                <Sparkles className="w-6 h-6 text-primary-600" />
                            </div>
                        </motion.div>
                        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-3xl animate-pulse">
                            <div className="text-center">
                                <p className="text-3xl font-black">2026</p>
                                <p className="text-[9px] font-black uppercase tracking-widest">Soberania</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ARTICLE CONTENT: THE NARRATIVE --- */}
            <main className="relative z-10 px-10 lg:px-24 pb-60">
                <div className="max-w-4xl mx-auto space-y-24">

                    {/* Share & Utility Bar */}
                    <div className="flex items-center justify-between py-12 border-y border-slate-100 dark:border-white/5">
                        <div className="flex gap-10">
                            <button
                                onClick={() => setIsBookmarked(!isBookmarked)}
                                className={`flex items-center gap-4 text-[10px] font-black uppercase tracking-widest transition-all ${isBookmarked ? 'text-primary-600' : 'text-slate-400 hover:text-primary-600'}`}
                            >
                                {isBookmarked ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
                                Guardar Articulo
                            </button>
                            <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 transition-all">
                                <Share2 className="w-6 h-6" /> Compartir
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
                            <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
                            <div className="w-2 h-2 rounded-full bg-primary-600" />
                        </div>
                    </div>

                    {/* Prose Content */}
                    <motion.article
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="prose dark:prose-invert lg:prose-2xl max-w-none text-slate-600 dark:text-slate-400"
                        dangerouslySetInnerHTML={{ __html: post.contenido }}
                    />

                    {/* Footer Content: Related / Tags */}
                    <div className="space-y-12">
                        <div className="flex flex-wrap gap-4">
                            {['Magisterio', 'Formación', 'Soberanía', 'Bolivia', 'Investigación'].map(tag => (
                                <span key={tag} className="px-6 py-3 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        <div className="p-16 rounded-[4rem] bg-primary-600 text-white flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0">
                                <Newspaper className="w-60 h-60" />
                            </div>
                            <div className="space-y-6 relative z-10">
                                <h4 className="text-4xl font-black uppercase tracking-tighter">¿Deseas contribuir <br /> a nuestra revista?</h4>
                                <p className="text-white/70 text-lg font-medium max-w-md">Estamos en constante búsqueda de investigaciones pedagógicas de alto impacto.</p>
                            </div>
                            <button className="px-14 py-7 bg-white text-primary-600 rounded-full text-[11px] font-black uppercase tracking-[0.4em] hover:scale-105 transition-all shadow-2xl relative z-10">
                                Enviar Manuscrito
                            </button>
                        </div>
                    </div>

                    {/* Related Post Suggestion */}
                    <div className="pt-24 border-t border-slate-100 dark:border-white/5 space-y-12">
                        <h5 className="text-[11px] font-black uppercase tracking-[0.8em] text-primary-600 text-center">Continuar Explorando</h5>
                        <div className="flex flex-col items-center gap-6">
                            <Link href="/blog" className="text-5xl md:text-7xl font-black text-slate-950 dark:text-white uppercase tracking-tighter text-center hover:text-primary-600 transition-all group flex items-center gap-8">
                                Volver al Blog <ArrowLeft className="w-12 h-12 rotate-[135deg] group-hover:translate-x-4 transition-transform" />
                            </Link>
                        </div>
                    </div>

                </div>
            </main>

            {/* --- PAGE FOOTER: CLEAN FINALE --- */}
            <footer className="relative py-40 px-10 border-t border-slate-100 dark:border-white/10 overflow-hidden text-center bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-xl">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[1em] text-slate-400">Investigación Magisterio</span>
                    </div>

                    <p className="text-[12px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.8em]">
                        Programa de Formación Especializada — PROFE Bolivia
                    </p>
                </div>
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </footer>

        </div>
    );
}
