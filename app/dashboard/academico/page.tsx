'use client';

import { GraduationCap, Layers, Clock, History, Globe, Tag, Activity, ArrowRight, BookOpen, Settings2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AcademicoDashboard() {
    const modules = [
        {
            title: 'Programas Maestro',
            description: 'Definición de programas base, áreas de conocimiento y mallas curriculares.',
            icon: BookOpen,
            href: '/dashboard/programas-maestro',
            color: 'bg-indigo-500/10 text-indigo-600',
            border: 'hover:border-indigo-200'
        },
        {
            title: 'Ofertas Académicas',
            description: 'Gestión de convocatorias, versiones vigentes y periodos de inscripción.',
            icon: GraduationCap,
            href: '/dashboard/ofertas-academicas',
            color: 'bg-emerald-500/10 text-emerald-600',
            border: 'hover:border-emerald-200'
        },
        {
            title: 'Inscripciones',
            description: 'Seguimiento de estudiantes, validación de requisitos y estados de pago.',
            icon: Activity,
            href: '/dashboard/academico/inscripciones',
            color: 'bg-amber-500/10 text-amber-600',
            border: 'hover:border-amber-200'
        },
        {
            title: 'Configuración Académica',
            description: 'Gestión de parámetros globales: Turnos, Modalidades, Duraciones y Versiones.',
            icon: Settings2,
            href: '/dashboard/academico/configuracion',
            color: 'bg-slate-500/10 text-slate-600',
            border: 'hover:border-slate-200'
        }
    ];

    return (
        <div className="space-y-10">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                    <GraduationCap className="w-4 h-4" />
                    <span>Gestión Académica</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Módulo Académico</h1>
                <p className="text-sm font-medium text-muted-foreground max-w-lg">
                    Administración centralizada de la oferta educativa, programas y procesos de inscripción.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modules.map((module, idx) => (
                    <motion.div
                        key={module.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Link href={module.href}>
                            <Card className={`p-8 hover:shadow-2xl transition-all h-full border-border/40 group ${module.border}`}>
                                <div className="space-y-6">
                                    <div className={`w-14 h-14 rounded-2xl ${module.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <module.icon className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-black tracking-tighter uppercase">{module.title}</h3>
                                        <p className="text-[10px] font-medium text-muted-foreground leading-relaxed italic">
                                            {module.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-primary pt-4 group-hover:translate-x-2 transition-transform">
                                        Gestionar <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
