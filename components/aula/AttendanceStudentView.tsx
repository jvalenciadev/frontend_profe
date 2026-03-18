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

    const percentage = stats.total > 0 ? (stats.P / stats.total) * 100 : 0;

    if (loading) return (
        <div className="p-20 flex justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={Target}
                    label="Asistencia Total"
                    value={`${Math.round(percentage)}%`}
                    color="indigo"
                    theme={theme}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Presentes"
                    value={stats.P}
                    color="emerald"
                    theme={theme}
                />
                <StatCard
                    icon={XCircle}
                    label="Faltas"
                    value={stats.F}
                    color="rose"
                    theme={theme}
                />
                <StatCard
                    icon={Clock}
                    label="Tardanzas"
                    value={stats.T}
                    color="amber"
                    theme={theme}
                />
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
                                    "flex items-center justify-between p-6 rounded-3xl border transition-all",
                                    theme === 'dark' ? "bg-slate-800/20 border-slate-700/50" : "bg-slate-50 border-slate-100"
                                )}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex flex-col items-center justify-center shadow-lg">
                                        <span className="text-[10px] font-black uppercase text-slate-400">
                                            {reg.fecha ? format(new Date(reg.fecha), 'MMM', { locale: es }) : '---'}
                                        </span>
                                        <span className={cn("text-xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                            {reg.fecha ? format(new Date(reg.fecha), 'dd') : '--'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className={cn("font-black text-sm", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                            {reg.fecha ? format(new Date(reg.fecha), "EEEE, dd 'de' MMMM", { locale: es }) : 'Fecha no disponible'}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {reg.fecha ? `Sesión programada para las ${format(new Date(reg.fecha), 'hh:mm a')}` : 'Sin datos de hora'}
                                        </p>
                                    </div>
                                </div>

                                <StatusBadge estado={reg.estado} />
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
        P: { label: 'Presente', bg: 'bg-emerald-500', icon: CheckCircle2 },
        F: { label: 'Falta', bg: 'bg-rose-500', icon: XCircle },
        L: { label: 'Licencia', bg: 'bg-amber-500', icon: AlertCircle },
        T: { label: 'Tardanza', bg: 'bg-blue-500', icon: Clock },
    };
    const { label, bg, icon: Icon } = config[estado] || config.P;

    return (
        <div className={cn("flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-black/5", bg)}>
            <Icon size={14} />
            {label}
        </div>
    );
}
