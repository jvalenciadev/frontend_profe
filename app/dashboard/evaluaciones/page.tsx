'use client';

import {
    ClipboardCheck,
    CalendarDays,
    ClipboardSignature,
    ArrowRight,
    Users,
    FileSpreadsheet,
    Award,
    Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function EvaluacionesDashboard() {
    const modules = [
        {
            title: 'Periodos de Evaluación',
            description: 'Configuración de gestiones, semestres, fechas límite y activación de ciclos de evaluación.',
            icon: CalendarDays,
            href: '/dashboard/evaluaciones/periodos',
            color: 'bg-primary/10 text-primary',
            border: 'hover:border-primary/40',
        },
        {
            title: 'Cuestionarios por Cargo',
            description: 'Creación de formularios con banco de indicadores, pesos, tiempos límite e intentos por cargo.',
            icon: FileSpreadsheet,
            href: '/dashboard/evaluaciones/cuestionarios',
            color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
            border: 'hover:border-indigo-400/40',
        },
        {
            title: 'Asignación de Evaluadores',
            description: 'Un evaluador puede calificar a muchos funcionarios. Un funcionario puede recibir evaluación de múltiples evaluadores. Asignación individual y masiva por cargo.',
            icon: Users,
            href: '/dashboard/evaluaciones/asignaciones',
            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            border: 'hover:border-amber-400/40',
        },
        {
            title: 'Evaluar Personal (Mis Asignaciones)',
            description: 'Accede a la lista de funcionarios asignados para calificar con escala Likert (100, 80, 60, 40, 20), temporizador y consolidado.',
            icon: ClipboardSignature,
            href: '/dashboard/evaluaciones/evaluar',
            color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            border: 'hover:border-emerald-400/40',
        },
    ];

    return (
        <div className="space-y-10 max-w-[1600px] mx-auto p-6 md:p-10">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Control de Calidad & Desempeño</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                    Módulo de Evaluaciones
                </h1>
                <p className="text-sm font-medium text-muted-foreground max-w-2xl">
                    Sistema integral para la administración de periodos, cuestionarios segmentados por cargo, matriz de evaluadores y cálculo de promedios consolidados.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modules.map((module, idx) => (
                    <motion.div
                        key={module.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                    >
                        <Link href={module.href}>
                            <Card className={cn(
                                "p-7 hover:shadow-2xl transition-all h-full border-border/40 group relative flex flex-col justify-between rounded-3xl",
                                module.border
                            )}>
                                <div className="space-y-5">
                                    <div className={`w-14 h-14 rounded-2xl ${module.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner`}>
                                        <module.icon className="w-7 h-7" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-base font-black tracking-tight uppercase leading-tight text-foreground group-hover:text-primary transition-colors">
                                            {module.title}
                                        </h3>
                                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                            {module.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-primary pt-6 group-hover:translate-x-2 transition-transform">
                                    Acceder <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
