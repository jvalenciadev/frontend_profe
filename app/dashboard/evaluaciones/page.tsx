'use client';

import { ClipboardCheck, CalendarDays, ClipboardSignature, ArrowRight, Star, History } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EvaluacionesDashboard() {
    const modules = [
        {
            title: 'Periodos de Evaluación',
            description: 'Configuración de gestiones, semestres y criterios de calificación globales.',
            icon: CalendarDays,
            href: '/dashboard/evaluaciones/periodos',
            color: 'bg-primary/10 text-primary',
            border: 'hover:border-primary/30'
        },
        {
            title: 'Hoja de Concepto',
            description: 'Evaluación de personal por departamento, seguimiento de puntajes y firmas digitales.',
            icon: ClipboardSignature,
            href: '/dashboard/evaluaciones/hoja-concepto',
            color: 'bg-emerald-500/10 text-emerald-600',
            border: 'hover:border-emerald-200'
        },
        {
            title: 'Historial de Evaluaciones',
            description: 'Consulta de evaluaciones pasadas, reportes comparativos y métricas de desempeño.',
            icon: History,
            href: '#',
            color: 'bg-indigo-500/10 text-indigo-600',
            border: 'opacity-50 cursor-not-allowed',
            soon: true
        }
    ];

    return (
        <div className="space-y-10">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Control de Calidad</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Evaluaciones</h1>
                <p className="text-sm font-medium text-muted-foreground max-w-lg">
                    Gestión integral de la evaluación de desempeño y calificación de personal administrativo y facilitadores.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {modules.map((module, idx) => (
                    <motion.div
                        key={module.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Link href={module.href}>
                            <Card className={cn(
                                "p-8 hover:shadow-2xl transition-all h-full border-border/40 group relative",
                                module.border
                            )}>
                                {module.soon && (
                                    <span className="absolute top-4 right-4 bg-muted px-2 py-0.5 rounded text-[8px] font-black uppercase">Próximamente</span>
                                )}
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
                                        Acceder al Módulo <ArrowRight className="w-3 h-3" />
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

import { cn } from '@/lib/utils';
