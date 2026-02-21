'use client';

import { motion } from 'framer-motion';
import { Users, Search, Filter, ArrowRight, UserCheck, ShieldCheck, Globe, Award, Sparkles, Building2 } from 'lucide-react';
import GenericPageTemplate from '@/components/GenericPageTemplate';

export default function BancoProfesionalesPage() {
    return (
        <GenericPageTemplate
            title="Banco de Profesionales"
            description="Nuestra red elite de facilitadores, docentes y especialistas altamente calificados para el fortalecimiento del magisterio."
            icon={Users}
        >
            <div className="space-y-40">
                {/* ── MAJESTIC HERO HERO SECTION ── */}
                <section className="relative p-12 md:p-24 rounded-[4rem] md:rounded-[6rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-20 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                        <UserCheck className="w-[400px] h-[400px] text-slate-900 dark:text-white" />
                    </div>

                    <div className="relative z-10 max-w-5xl space-y-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-primary-600/10 text-primary-600 border border-primary-600/20 text-[10px] font-black uppercase tracking-[0.5em]"
                        >
                            <Sparkles className="w-4 h-4" /> Módulo de Alta Jerarquía
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl lg:text-9xl font-black text-slate-950 dark:text-white uppercase tracking-tighter leading-[0.85]"
                        >
                            Talento <br />
                            <span className="text-primary-600">Excepcional.</span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl"
                        >
                            Estamos consolidando la base de datos de profesionales más influyente del magisterio boliviano. Un ecosistema de conocimiento diseñado para la soberanía educativa.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-8 pt-6"
                        >
                            <button className="px-12 py-7 rounded-full bg-primary-600 text-white font-black uppercase tracking-[0.4em] text-[10px] hover:brightness-110 hover:-translate-y-1 transition-all shadow-2xl shadow-primary-600/20 flex items-center gap-4 group">
                                Unirse al Banco <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                            </button>
                            <button className="px-12 py-7 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-black uppercase tracking-[0.4em] text-[10px] hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10 flex items-center gap-4">
                                <Building2 className="w-5 h-5 text-primary-600" /> Solicitar Consultoría
                            </button>
                        </motion.div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="absolute bottom-0 left-0 w-full h-2 bg-slate-100 dark:bg-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '65%' }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="h-full bg-primary-600"
                        />
                        <div className="absolute -top-12 left-[65%] -translate-x-1/2 px-4 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 text-[9px] font-black text-primary-600 uppercase tracking-widest shadow-xl">
                            Consolidando 65%
                        </div>
                    </div>
                </section>

                {/* ── STRATEGIC PILLARS ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        {
                            title: 'Verificación Digital',
                            desc: 'Perfiles auditados y verificados con tecnología de firma digital y respaldo institucional.',
                            icon: ShieldCheck,
                            accent: 'text-emerald-500'
                        },
                        {
                            title: 'Impacto Nacional',
                            desc: 'Especialistas con capacidad de despliegue en todo el territorio plurinacional.',
                            icon: Globe,
                            accent: 'text-primary-600'
                        },
                        {
                            title: 'Rigor Académico',
                            desc: 'Criterios de selección basados en producción científica y práctica pedagógica de vanguardia.',
                            icon: Award,
                            accent: 'text-amber-500'
                        }
                    ].map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-12 rounded-[4rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 space-y-8 group hover:border-primary-600 transition-all duration-700"
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center ${f.accent} group-hover:scale-110 transition-transform`}>
                                <f.icon className="w-8 h-8" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-950 dark:text-white">{f.title}</h4>
                                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── CALL TO ACTION ── */}
                <section className="text-center space-y-12 py-20">
                    <div className="space-y-6">
                        <h3 className="text-4xl md:text-6xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">¿Eres un especialista de vanguardia?</h3>
                        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-3xl mx-auto">
                            Únete al banco de datos más prestigioso de Bolivia y contribuye al fortalecimiento pedagógico del Estado.
                        </p>
                    </div>
                    <button className="px-16 py-8 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-black uppercase tracking-[0.5em] text-[11px] hover:bg-primary-600 dark:hover:bg-primary-600 hover:text-white hover:scale-105 transition-all shadow-3xl">
                        Postular Mi Perfil Ahora
                    </button>
                </section>
            </div>
        </GenericPageTemplate>
    );
}

