'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Can } from '@/components/Can';
import Link from 'next/link';
import {
    Users,
    GraduationCap,
    ClipboardCheck,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    PlusCircle,
    FileText,
    UserCircle,
    Zap,
    Layout,
    ExternalLink,
    TrendingUp,
    ShieldCheck,
    Infinity as InfinityIcon
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const { user } = useAuth();

    const stats = [
        {
            title: 'Personal Operativo',
            count: '1,284',
            trend: '+12.4%',
            isUp: true,
            icon: Users,
            color: 'text-primary'
        },
        {
            title: 'Oferta Académica',
            count: '42',
            trend: '+4',
            isUp: true,
            icon: GraduationCap,
            color: 'text-primary'
        },
        {
            title: 'Fichas Generadas',
            count: '156',
            trend: '+28%',
            isUp: true,
            icon: ClipboardCheck,
            color: 'text-primary'
        },
        {
            title: 'Latencia Núcleo',
            count: '14ms',
            trend: '-2ms',
            isUp: false,
            icon: Zap,
            color: 'text-primary'
        }
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Strategy Header */}
            <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-4">
                <div className="space-y-2">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.3em] border border-primary/10"
                    >
                        <Zap className="w-3 h-3 fill-primary" />
                        Sistema Centralizado v4.5 Stable
                    </motion.div>
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-foreground uppercase">
                            Dashboard <span className="text-primary opacity-40">Operativo</span>
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium max-w-xl">
                            Bienvenido, <span className="text-foreground font-bold">{user?.nombre}</span>. Monitoreo en tiempo real de la infraestructura educativa nacional.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-11 px-6 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-all text-[11px] font-black uppercase tracking-widest shadow-sm">
                        Exportar Reporte
                    </button>
                    <button className="h-11 px-8 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
                        Gestión Global
                    </button>
                </div>
            </section>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-8 group bg-card transition-all duration-500 rounded-2xl border-border/40 hover:border-primary/30 shadow-xl shadow-black/[0.02]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div className={cn(
                                    "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1",
                                    stat.isUp
                                        ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20"
                                        : "bg-rose-500/5 text-rose-600 border-rose-500/20"
                                )}>
                                    {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {stat.trend}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.title}</p>
                                <h3 className="text-3xl font-black tracking-tighter text-foreground">{stat.count}</h3>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Content Logic */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Evolution Wall */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h3 className="text-xl font-black tracking-tight uppercase">Actividad del Núcleo</h3>
                        </div>
                        <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
                            Historial Completo
                        </button>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((id) => (
                            <Card key={id} className="p-6 border-border/40 hover:border-primary/20 bg-card transition-all duration-300 rounded-2xl group shadow-sm">
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                                        <PlusCircle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">Descriptor de Infraestructura v{id}.5.0</h4>
                                            <span className="text-[9px] font-black text-muted-foreground bg-muted/30 px-3 py-1 rounded-full uppercase tracking-widest">T-{id * 15} MIN</span>
                                        </div>
                                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                                            Sincronización de parámetros regionales detectada en la <span className="font-bold text-foreground">Sede Territorial {id}</span>. El despliegue de permisos se ha completado sin errores de latencia.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Tactical Actions */}
                <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-xl font-black tracking-tight uppercase px-2">Accesos Directos</h3>
                    <div className="flex flex-col gap-3">
                        <Can action="read" subject="User">
                            <Link href="/dashboard/usuarios">
                                <Card className="p-6 bg-primary/5 hover:bg-primary border-primary/20 group rounded-2xl transition-all duration-500 shadow-lg shadow-primary/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-primary group-hover:text-white">
                                            <div className="p-3 bg-white/20 rounded-xl shadow-inner border border-white/10 group-hover:rotate-6 transition-all">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-widest">Operadores</p>
                                                <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest">Gestión de Acceso</p>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-primary group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </div>
                                </Card>
                            </Link>
                        </Can>

                        <Can action="read" subject="Role">
                            <Link href="/dashboard/roles">
                                <Card className="p-6 bg-card hover:bg-foreground border-border/40 group rounded-2xl transition-all duration-500 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-foreground group-hover:text-background font-bold transition-all">
                                            <div className="p-3 bg-muted rounded-xl transition-all group-hover:bg-background group-hover:text-foreground">
                                                <ShieldCheck className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-widest leading-none mb-1">Privilegios</p>
                                                <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest">Matriz de Roles</p>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-background group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </div>
                                </Card>
                            </Link>
                        </Can>

                        <Link href="/dashboard/academico/programas">
                            <Card className="p-6 bg-card hover:bg-foreground border-border/40 group rounded-2xl transition-all duration-500 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-foreground group-hover:text-background font-bold transition-all">
                                        <div className="p-3 bg-muted rounded-xl transition-all group-hover:bg-background group-hover:text-foreground">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-widest leading-none mb-1">Programas</p>
                                            <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest text-center">Gestión Académica</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-background group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                </div>
                            </Card>
                        </Link>
                    </div>

                    {/* Meta Card */}
                    <Card className="p-8 border-dashed border-2 border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                            <InfinityIcon className="w-20 h-20" />
                        </div>
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                            <Layout className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-black text-base tracking-tighter uppercase">Tecnología PROFE</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed font-bold uppercase">
                                Infraestructura Soberana v4.5
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
