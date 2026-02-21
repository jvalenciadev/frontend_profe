'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Trophy, Globe, Award, Users, ArrowRight, ShieldCheck, History, Target, Sparkles, Quote } from 'lucide-react';
import Link from 'next/link';
import GenericPageTemplate from '@/components/GenericPageTemplate';

export default function NosotrosPage() {
    const { effectiveTheme } = useTheme();

    return (
        <GenericPageTemplate
            title="Nuestra Identidad"
            description="El Programa de Formación Especializada (PROFE) es el epicentro de la transformación educativa en el Estado Plurinacional de Bolivia."
            icon={History}
        >
            <div className="space-y-60 pt-20">

                {/* ── MISSION & VISION: THE MONUMENTAL SPLIT ── */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                    <motion.div
                        whileHover={{ y: -10 }}
                        className="relative p-16 md:p-24 rounded-[5rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-2xl overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-16 opacity-5">
                            <Target className="w-40 h-40 text-primary-600" />
                        </div>
                        <div className="relative z-10 space-y-10">
                            <div className="w-20 h-20 rounded-3xl bg-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-600/30">
                                <Trophy className="w-10 h-10" />
                            </div>
                            <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">Nuestra <br /><span className="text-primary-600">Misión.</span></h3>
                            <p className="text-2xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                Transformar el sistema educativo nacional mediante procesos de formación postgradual de la más alta exigencia académica, fortaleciendo el desempeño profesional del magisterio boliviano con conciencia social y soberanía tecnológica.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -10 }}
                        className="relative p-16 md:p-24 rounded-[5rem] bg-primary-950 text-white dark:bg-primary-600/10 border border-transparent dark:border-primary-500/20 shadow-2xl overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-16 opacity-10">
                            <Globe className="w-40 h-40 text-white" />
                        </div>
                        <div className="relative z-10 space-y-10">
                            <div className="w-20 h-20 rounded-3xl bg-white text-slate-950 flex items-center justify-center shadow-xl">
                                <ShieldCheck className="w-10 h-10" />
                            </div>
                            <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">Nuestra <br /><span className="text-primary-600 dark:text-white">Visión.</span></h3>
                            <p className="text-2xl text-white/70 dark:text-slate-300 leading-relaxed font-medium">
                                Consolidarnos como el referente continental en formación docente especializada, siendo el motor del desarrollo científico y pedagógico que sustenta la soberanía integral de nuestro Estado Plurinacional.
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* ── VALUES: THE LUXURY GRID ── */}
                <section className="space-y-32">
                    <div className="text-center space-y-6">
                        <span className="text-primary-600 font-black text-[11px] uppercase tracking-[0.8em]">LOS PILARES DE PROFE</span>
                        <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter">Nuestros Valores <span className="text-primary-600">Fundamentales.</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { title: 'Excelencia Académica', icon: Award, desc: 'Compromiso innegociable con los más altos estándares educativos globales.' },
                            { title: 'Inclusión Territorial', icon: Users, desc: 'Presencia absoluta en cada rincón de nuestro estado, democratizando el saber.' },
                            { title: 'Soberanía Tecnológica', icon: Globe, desc: 'Liderazgo en la creación y aplicación de nuevas fronteras del conocimiento.' }
                        ].map((v, idx) => (
                            <motion.div
                                key={v.title}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-16 rounded-[4rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 group hover:bg-primary-950 hover:text-white dark:hover:bg-white dark:hover:text-slate-950 transition-all duration-700"
                            >
                                <v.icon className="w-12 h-12 text-primary-600 mb-10 transition-transform group-hover:scale-110" />
                                <h4 className="text-3xl font-black uppercase mb-6 tracking-tight">{v.title}</h4>
                                <p className="text-lg text-slate-500 dark:text-slate-400 group-hover:text-white/70 dark:group-hover:text-slate-900 leading-relaxed">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── FINAL QUOTE: THE CINEMATIC CLOSURE ── */}
                <section className="relative h-[600px] flex items-center justify-center rounded-[6rem] overflow-hidden group">
                    <img
                        src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5000ms] group-hover:scale-110"
                        alt="Institución"
                    />
                    <div className="absolute inset-0 bg-primary-950/80 backdrop-blur-sm" />

                    <div className="relative z-10 max-w-5xl text-center px-10 space-y-12">
                        <Quote className="w-20 h-20 text-primary-600 mx-auto opacity-50" />
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight uppercase tracking-tight">
                            "La formación docente es el alma de la revolución educativa boliviana."
                        </h2>
                        <div className="w-24 h-1 bg-primary-600 mx-auto rounded-full" />
                        <p className="text-primary-600 font-black text-[12px] uppercase tracking-[1em]">Dirección Nacional PROFE</p>
                    </div>
                </section>
            </div>
        </GenericPageTemplate>
    );
}
