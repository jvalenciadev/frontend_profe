'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Calendar,
    Zap,
    Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AttendanceStudentViewProps {
    moduloId: string;
    theme: 'light' | 'dark';
}

export default function AttendanceStudentView({ moduloId, theme }: AttendanceStudentViewProps) {
    const [historial, setHistorial] = useState<any[]>([]);
    const [stats, setStats] = useState({ P: 0, F: 0, L: 0, T: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await aulaService.getMiAsistencia(moduloId);
                setHistorial(data);

                const s = data.reduce((acc: any, curr: any) => {
                    const estado = curr.estado || 'F';
                    if (acc[estado] !== undefined) acc[estado]++;
                    acc.total++;
                    return acc;
                }, { P: 0, F: 0, L: 0, T: 0, total: 0 });
                setStats(s);
            } catch (err) {
                // error
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [moduloId]);

    const percentage = stats.total > 0
        ? ((stats.P * 100 + stats.T * 80 + stats.L * 50) / stats.total)
        : 0;

    if (loading) return (
        <div className="p-20 flex justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={Target}
                    label="Asistencia Promedio"
                    value={`${Math.round(percentage)}%`}
                    color="indigo"
                    theme={theme}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Presentes (100%)"
                    value={stats.P}
                    color="emerald"
                    theme={theme}
                />
                <StatCard
                    icon={XCircle}
                    label="Faltas (0%)"
                    value={stats.F}
                    color="rose"
                    theme={theme}
                />
                <StatCard
                    icon={Clock}
                    label="Tardanzas (80%)"
                    value={stats.T}
                    color="amber"
                    theme={theme}
                />
            </div>

            {/* Leyenda de Ponderaciones Premium */}
            <div className={cn(
                "p-8 rounded-[2.5rem] border flex flex-col lg:flex-row items-center justify-between gap-6",
                theme === 'dark' ? "bg-slate-900/40 border-slate-800/80" : "bg-slate-50 border-slate-100"
            )}>
                <div className="flex items-center gap-4">
                    <Zap size={22} className="text-primary animate-pulse shrink-0" />
                    <div>
                        <p className={cn("text-xs font-black uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-800")}>Sistema de Calificación de Asistencia</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">El promedio total se calcula multiplicando cada estado de asistencia por su respectivo porcentaje de nota:</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                    <span className="px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Presente: 100%</span>
                    <span className="px-4 py-2 rounded-2xl bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Atraso: 80%</span>
                    <span className="px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Licencia: 50%</span>
                    <span className="px-4 py-2 rounded-2xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">Falta: 0%</span>
                </div>
            </div>

            {/* Attendance List */}
            <div className={cn(
                "rounded-[3rem] border overflow-hidden",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl"
            )}>
                <header className="p-10 border-b border-slate-100 dark:border-slate-800">
                    <h3 className={cn("text-xl font-black uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-800")}>Registro Detallado</h3>
                </header>

                <div className="p-4 md:p-10">
                    <div className="grid grid-cols-1 gap-4">
                        {historial.map((reg) => (
                            <div
                                key={reg.id}
                                className={cn(
                                    "flex items-center justify-between p-5 rounded-[2.5rem] border transition-all relative overflow-hidden",
                                    reg.esPresencial 
                                        ? (theme === 'dark' ? "bg-slate-800/20 border-slate-700/50 hover:border-emerald-500/50" : "bg-white border-slate-100 shadow-sm hover:border-emerald-500/30")
                                        : (theme === 'dark' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:border-indigo-500/50 backdrop-blur-sm" : "bg-indigo-50/50 border-indigo-100 text-indigo-600 hover:border-indigo-400/30 backdrop-blur-sm")
                                )}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 w-full">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={cn(
                                            "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg shrink-0",
                                            reg.esPresencial ? "bg-emerald-500/10 text-emerald-600" : "bg-indigo-500/10 text-indigo-500"
                                        )}>
                                            <span className="text-[8px] font-black uppercase mb-0.5">
                                                {reg.fecha ? format(new Date(reg.fecha), 'MMM', { locale: es }) : '---'}
                                            </span>
                                            <span className="text-lg sm:text-xl font-black leading-none">
                                                {reg.fecha ? format(new Date(reg.fecha), 'dd') : '--'}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                <p className={cn("font-black text-xs sm:text-sm uppercase tracking-tight truncate", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                                    {reg.fecha ? format(new Date(reg.fecha), "EEEE, dd 'de' MMMM", { locale: es }) : 'Fecha no disponible'}
                                                </p>
                                                <div className={cn("px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                                                    reg.esPresencial ? "bg-emerald-500/10 text-emerald-600" : "bg-indigo-500/10 text-indigo-500"
                                                )}>
                                                    {reg.esPresencial ? 'Presencial' : 'Virtual'}
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">
                                                {reg.fecha ? `Sesión programada • ${format(new Date(reg.fecha), 'HH:mm')}` : 'Sin datos de hora'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex justify-end sm:justify-start">
                                        <StatusBadge estado={reg.estado} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {historial.length === 0 && (
                            <div className="p-20 text-center space-y-4">
                                <Calendar size={48} className="mx-auto text-slate-200" />
                                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Sin registros de asistencia aún</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, theme }: any) {
    const colors: any = {
        indigo: "text-primary bg-primary/10",
        emerald: "text-emerald-600 bg-emerald-50",
        rose: "text-rose-600 bg-rose-50",
        amber: "text-amber-600 bg-amber-50"
    };

    return (
        <div className={cn(
            "p-8 rounded-[2.5rem] border transition-all hover:scale-105",
            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
        )}>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", colors[color])}>
                <Icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className={cn("text-4xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>{value}</p>
        </div>
    );
}

function StatusBadge({ estado }: { estado: string }) {
    const config: any = {
        P: { label: 'Presente (100%)', bg: 'bg-emerald-500', icon: CheckCircle2 },
        F: { label: 'Falta (0%)', bg: 'bg-rose-500', icon: XCircle },
        L: { label: 'Licencia (50%)', bg: 'bg-amber-500', icon: AlertCircle },
        T: { label: 'Atraso (80%)', bg: 'bg-blue-500', icon: Clock },
    };
    const { label, bg, icon: Icon } = config[estado] || config.P;

    return (
        <div className={cn("flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-black/5", bg)}>
            <Icon size={14} />
            {label}
        </div>
    );
}
