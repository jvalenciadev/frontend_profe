'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { aulaService } from '@/services/aulaService';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAula } from '@/contexts/AulaContext';
import {
    GraduationCap,
    TrendingUp,
    Award,
    CheckCircle2,
    ChevronRight,
    Search,
    BookOpen,
    Download,
    Clock
} from 'lucide-react';

export default function CalificacionesPage() {
    const { theme } = useAula();
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadGrades() {
            try {
                const data = await aulaService.getMisCursos();
                setCourses(data.estudiante || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        loadGrades();
    }, []);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--aula-primary)' }} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Calculando Rendimiento...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="space-y-2">
                    <h1 className={cn("text-5xl font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                        Mis <span style={{ color: 'var(--aula-primary)' }}>Calificaciones</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Historial académico detallado y progreso por programa.</p>
                </div>
                <button
                    className="flex items-center gap-3 px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all hover:scale-105"
                    style={{ backgroundColor: 'var(--aula-primary)', color: 'white', boxShadow: '0 10px 15px -3px var(--aula-primary)44' }}
                >
                    <Download size={18} />
                    Exportar Record
                </button>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: 'Promedio Global', value: (courses.reduce((acc, c) => acc + (c.notaFinal || 0), 0) / (courses.length || 1)).toFixed(1), sub: '%', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Aprobados', value: courses.filter(c => (c.notaFinal || 0) > (c.notaReprobacion || 60)).length.toString().padStart(2, '0'), sub: 'Módulos', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Insignias', value: '03', sub: 'Logros', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Horas Totales', value: (courses.length * 40).toString(), sub: 'H. Académicas', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                            "p-8 rounded-[2.5rem] border transition-all",
                            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                        )}
                    >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner", stat.bg)}>
                            <stat.icon size={22} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-1">
                                <span className={cn("text-3xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>{stat.value}</span>
                                <span className="text-xs font-bold text-slate-400">{stat.sub}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Table */}
            <div className={cn(
                "rounded-[3.5rem] border overflow-hidden transition-all",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
            )}>
                <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <h2 className={cn("text-2xl font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>Resumen por Módulos</h2>
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" style={{ color: undefined } as any} size={20} />
                        <input
                            type="text"
                            placeholder="Buscar en el registro..."
                            className={cn(
                                "w-full h-14 pl-14 pr-8 border shadow-sm transition-all font-bold text-sm rounded-2xl focus:outline-none focus:ring-4",
                                theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"
                            )}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={cn(theme === 'dark' ? "bg-slate-800/50" : "bg-slate-50/50")}>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Programa / Módulo</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Modalidad</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Avance</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Calificación</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {courses.map((program) => (
                                <React.Fragment key={program.id}>
                                    {/* Program Header Row */}
                                    <tr style={{ backgroundColor: 'color-mix(in srgb, var(--aula-primary), transparent 95%)' }}>
                                        <td colSpan={5} className="px-10 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--aula-primary)] flex items-center justify-center text-white shadow-sm">
                                                    <GraduationCap size={16} />
                                                </div>
                                                <span className="font-black text-xs uppercase tracking-[0.1em] text-[var(--aula-primary)]">
                                                    {program.nombre} <span className="text-slate-400 mx-2">|</span> {program.tipo}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Modules Rows */}
                                    {(program.modulos || []).map((module: any) => (
                                        <tr key={module.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="space-y-1">
                                                    <p className={cn("text-lg font-black leading-tight transition-colors", theme === 'dark' ? "text-white" : "text-slate-800")} style={{ '--hover-color': 'var(--aula-primary)' } as any}>{module.nombre}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{module.codigo || program.codigo}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Módulo Académico</span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className={cn("w-32 h-2 rounded-full overflow-hidden p-0.5", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")}>
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                                            style={{ width: `${module.progreso?.porcentaje || 0}%`, backgroundColor: 'var(--aula-primary)' }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400">{module.progreso?.porcentaje || 0}%</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center min-w-[220px]">
                                                <div className="flex flex-col items-center">
                                                    <div className={cn(
                                                        "px-6 py-3 rounded-3xl flex flex-col items-center mb-3 transition-all group-hover:scale-110",
                                                        (module.notaFinal || 0) >= (program.notaReprobacion || 60)
                                                            ? "bg-emerald-500/10 text-emerald-500"
                                                            : "bg-rose-500/10 text-rose-500"
                                                    )}>
                                                        <span className="text-3xl font-black">
                                                            {module.notaFinal ?? '--'}
                                                        </span>
                                                        <span className="text-[9px] font-black uppercase opacity-70 tracking-[0.2em]">Puntos</span>
                                                    </div>

                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Sobre {program.notaMaxima || 100} PTS</span>

                                                    {/* Breakdown por categorías (Dinámico por mod_tipo_calificacion_config) */}
                                                    {module.notaDetalle && module.notaDetalle.length > 0 && (
                                                        <div className={cn(
                                                            "w-full p-4 rounded-2xl space-y-3 border border-dashed",
                                                            theme === 'dark' ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"
                                                        )}>
                                                            {module.notaDetalle.map((det: any, idx: number) => (
                                                                <div key={idx} className="space-y-1.5">
                                                                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                                                                        <span className="truncate max-w-[110px] text-slate-400">{det.nombre}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-500">{det.peso}%</span>
                                                                            <span className={cn("font-black", det.promedio >= 70 ? "text-emerald-500" : "text-slate-500")}>
                                                                                {Math.round(det.promedio)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${det.promedio}%` }}
                                                                            className={cn(
                                                                                "h-full rounded-full",
                                                                                det.promedio >= 70 ? "bg-emerald-500" : "bg-slate-400"
                                                                            )}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                {(() => {
                                                    const now = new Date();
                                                    const start = module.fechaInicio ? new Date(module.fechaInicio) : null;
                                                    const isLocked = start && now < start;

                                                    if (isLocked) return (
                                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-300">
                                                            <Clock size={18} />
                                                        </div>
                                                    );

                                                    return (
                                                        <button
                                                            onClick={() => router.push(`/aula/curso/${module.id}`)}
                                                            className={cn(
                                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border group-hover/row:scale-110",
                                                                theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white" : "bg-white border-slate-100 text-slate-400 hover:shadow-lg"
                                                            )}
                                                        >
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {courses.length === 0 && (
                    <div className="p-32 text-center space-y-6">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <BookOpen size={48} />
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Sin registros de calificación disponibles</p>
                    </div>
                )}
            </div>
        </div>
    );
}
