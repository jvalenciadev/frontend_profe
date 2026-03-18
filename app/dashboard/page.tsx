'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Can } from '@/components/Can';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Users, GraduationCap, ClipboardCheck, Zap, ArrowUpRight, ArrowDownRight,
    TrendingUp, ShieldCheck, Database, Map, Calendar, BookOpen,
    Megaphone, Activity, Target, BarChart2, PieChart as PieChartIcon,
    Star, Award, Globe, Building2, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar
} from 'recharts';

// ──────────────────────────── Mock de datos estadísticos ────────────────────────────
const inscripcionesData = [
    { mes: 'Sep', inscritos: 120, egresados: 95 },
    { mes: 'Oct', inscritos: 185, egresados: 140 },
    { mes: 'Nov', inscritos: 210, egresados: 165 },
    { mes: 'Dic', inscritos: 160, egresados: 120 },
    { mes: 'Ene', inscritos: 290, egresados: 215 },
    { mes: 'Feb', inscritos: 340, egresados: 270 },
    { mes: 'Mar', inscritos: 410, egresados: 330 },
];

const departamentosData = [
    { name: 'La Paz', valor: 38, fill: 'hsl(var(--primary))' },
    { name: 'Cbba', valor: 25, fill: 'hsl(var(--primary) / 0.75)' },
    { name: 'SCZ', valor: 18, fill: 'hsl(var(--primary) / 0.55)' },
    { name: 'Oruro', valor: 9, fill: 'hsl(var(--primary) / 0.40)' },
    { name: 'Otros', valor: 10, fill: 'hsl(var(--primary) / 0.25)' },
];

const actividadSemanal = [
    { dia: 'Lun', usuarios: 45, eventos: 12 },
    { dia: 'Mar', usuarios: 62, eventos: 18 },
    { dia: 'Mié', usuarios: 51, eventos: 9 },
    { dia: 'Jue', usuarios: 78, eventos: 25 },
    { dia: 'Vie', usuarios: 90, eventos: 31 },
    { dia: 'Sáb', usuarios: 34, eventos: 8 },
    { dia: 'Dom', usuarios: 21, eventos: 4 },
];

const kpiRadial = [
    { name: 'Cumplimiento', value: 87, fill: 'hsl(var(--primary))' },
    { name: 'Capacidad', value: 72, fill: 'hsl(var(--primary) / 0.6)' },
    { name: 'Satisfacción', value: 94, fill: 'hsl(var(--primary) / 0.35)' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border/60 rounded-xl p-3 shadow-xl text-xs">
                <p className="font-black text-foreground mb-2 uppercase tracking-widest text-[10px]">{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-muted-foreground font-bold">{p.name}:</span>
                        <span className="font-black text-foreground">{p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// StatCard reutilizable
function StatCard({ title, count, trend, isUp, icon: Icon, subtitle }: any) {
    return (
        <div className="bg-card rounded-2xl border border-border/40 p-6 hover:border-primary/30 transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-primary/5">
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-primary/5 rounded-xl border border-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary/0 transition-all duration-300">
                    <Icon className="w-5 h-5" />
                </div>
                <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    isUp
                        ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                        : "bg-rose-500/5 text-rose-600 border-rose-500/20 dark:text-rose-400"
                )}>
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-black tracking-tighter text-foreground">{count}</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">{title}</p>
                {subtitle && <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

// Section header
function SectionHeader({ icon: Icon, title, action }: any) {
    return (
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/5 rounded-xl border border-primary/10 text-primary">
                    <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{title}</h3>
            </div>
            {action && (
                <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">{action}</button>
            )}
        </div>
    );
}

// Quick action card
function QuickCard({ href, icon: Icon, label, sub, colorClass, permission }: any) {
    const content = (
        <Link href={href}>
            <div className={cn(
                "group flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
                colorClass
            )}>
                <div className="p-3 rounded-xl bg-current/[0.07] group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-sm uppercase tracking-wide leading-none truncate">{label}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-1">{sub}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
            </div>
        </Link>
    );

    if (permission) {
        return <Can action={permission.action} subject={permission.subject}>{content}</Can>;
    }
    return content;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const { data } = await api.get('/metrics');
                setMetrics(data);
            } catch (err) {
                console.error("Error fetching dashboard metrics:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    const stats = metrics ? [
        { title: 'Personal Activo', count: metrics.stats.personalActivo.toString(), trend: '+4% mes', isUp: true, icon: Users, subtitle: 'Docentes y gestores' },
        { title: 'Inscritos Totales', count: metrics.stats.inscritosTotales.toString(), trend: 'Activos', isUp: true, icon: GraduationCap, subtitle: 'Total participantes' },
        { title: 'Preinscritos', count: metrics.stats.preinscritos.toString(), trend: 'Pendientes', isUp: false, icon: Clock, subtitle: 'Por validar pago' },
        { title: 'Sedes Operativas', count: metrics.stats.sedesOperativas.toString(), trend: 'Nacional', isUp: true, icon: Building2, subtitle: 'A nivel nacional' },
    ] : [
        { title: 'Personal Activo', count: '...', trend: '...', isUp: true, icon: Users, subtitle: 'Docentes y gestores' },
        { title: 'Inscritos Totales', count: '...', trend: '...', isUp: true, icon: GraduationCap, subtitle: 'Total participantes' },
        { title: 'Preinscritos', count: '...', trend: '...', isUp: false, icon: Clock, subtitle: 'Por validar pago' },
        { title: 'Sedes Operativas', count: '...', trend: '...', isUp: true, icon: Building2, subtitle: 'A nivel nacional' },
    ];

    const estadosData = metrics?.estadosInscripcion?.length ? metrics.estadosInscripcion : [
        { name: 'Cargando...', valor: 1, fill: '#cbd5e1' }
    ];
    
    // Asignar colores vibrantes dinámicamente
    const colors = ['#10b981', '#f59e0b', '#06b6d4', '#f43f5e', '#64748b', '#8b5cf6', '#3b82f6'];
    estadosData.forEach((d: any, i: number) => {
        if (!d.fill) d.fill = colors[i % colors.length];
    });

    const topProgramas = metrics?.topProgramas || [];
    topProgramas.forEach((p: any, i: number) => {
        if (!p.color) p.color = colors[i % colors.length];
    });

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="space-y-8 pb-10">
            {/* ── Header de bienvenida ── */}
            <motion.section
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2"
            >
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.3em] border border-primary/10">
                        <Activity className="w-3 h-3 fill-primary" />
                        Sistema Centralizado — Activo
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                        Centro de <span className="text-primary">Mando</span>
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-lg">
                        Bienvenido, <span className="font-black text-foreground">{user?.nombre}</span>.
                        Aquí tienes el pulso en tiempo real de la infraestructura educativa.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button className="h-10 px-5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-[11px] font-black uppercase tracking-widest">
                        Exportar
                    </button>
                    <button className="h-10 px-7 rounded-xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
                        Gestión Global
                    </button>
                </div>
            </motion.section>

            {/* ── KPI Cards ── */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
            >
                {stats.map((s, i) => (
                    <motion.div key={i} variants={item}>
                        <StatCard {...s} />
                    </motion.div>
                ))}
            </motion.div>

            {/* ── Fila 1: Área chart + Pie chart ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Área de inscripciones */}
                <div className="xl:col-span-2 bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                    <SectionHeader icon={TrendingUp} title="Inscritos vs. Egresados" action="Ver historial" />
                    <ResponsiveContainer width="100%" height={230}>
                        <AreaChart data={inscripcionesData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradInscritos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradEgresados" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="mes" tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                            <Area type="monotone" dataKey="inscritos" name="Inscritos" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#gradInscritos)" dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }} />
                            <Area type="monotone" dataKey="egresados" name="Egresados" stroke="#10b981" strokeWidth={2.5} fill="url(#gradEgresados)" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie: Estado de Inscripciones */}
                <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                    <SectionHeader icon={ClipboardCheck} title="Estado de Inscripciones" />
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={estadosData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={78}
                                paddingAngle={3}
                                dataKey="valor"
                            >
                                {estadosData.map((entry: any, index: number) => (
                                    <Cell key={index} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Legend manual */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 overflow-y-auto max-h-[80px]">
                        {estadosData.map((d: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                                    <span className="font-bold text-muted-foreground uppercase tracking-wider truncate max-w-[80px]" title={d.name}>{d.name}</span>
                                </div>
                                <span className="font-black text-foreground">{d.valor}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Fila 2: Barras actividad + KPI radial + Accesos rápidos ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Bar chart: actividad semanal */}
                <div className="xl:col-span-1 bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                    <SectionHeader icon={BarChart2} title="Actividad Semanal" />
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={actividadSemanal} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barSize={10} barGap={3}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="dia" tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="usuarios" name="Usuarios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} fillOpacity={0.9} />
                            <Bar dataKey="eventos" name="Eventos" fill="hsl(var(--primary) / 0.35)" radius={[4, 4, 0, 0]} fillOpacity={0.9} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Radial KPI */}
                <div className="xl:col-span-1 bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                    <SectionHeader icon={Target} title="KPIs Institucionales" />
                    <ResponsiveContainer width="100%" height={180}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius={28} outerRadius={88} data={kpiRadial} startAngle={90} endAngle={-270}>
                            <RadialBar dataKey="value" cornerRadius={6} />
                            <Tooltip content={<CustomTooltip />} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                        {kpiRadial.map((k, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: k.fill }} />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex-1">{k.name}</span>
                                <span className="text-[11px] font-black text-foreground">{k.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Accesos rápidos */}
                <div className="xl:col-span-1 space-y-2">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="p-2 bg-primary/5 rounded-xl border border-primary/10 text-primary">
                            <Zap className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Accesos Rápidos</h3>
                    </div>

                    <QuickCard
                        href="/dashboard/usuarios"
                        icon={Users}
                        label="Usuarios"
                        sub="Gestión de acceso"
                        colorClass="bg-primary/5 hover:bg-primary border-primary/20 text-primary hover:text-white"
                        permission={{ action: 'read', subject: 'User' }}
                    />
                    <QuickCard
                        href="/dashboard/roles"
                        icon={ShieldCheck}
                        label="Roles"
                        sub="Matriz de privilegios"
                        colorClass="bg-card hover:bg-foreground border-border/50 text-foreground hover:text-background"
                        permission={{ action: 'read', subject: 'Role' }}
                    />
                    <QuickCard
                        href="/dashboard/territorial/sedes"
                        icon={Map}
                        label="Sedes"
                        sub="Estructura territorial"
                        colorClass="bg-violet-500/5 hover:bg-violet-600 border-violet-500/20 text-violet-600 hover:text-white"
                        permission={{ action: 'read', subject: 'Sede' }}
                    />
                    <QuickCard
                        href="/dashboard/eventos"
                        icon={Calendar}
                        label="Eventos"
                        sub="Agenda institucional"
                        colorClass="bg-amber-500/5 hover:bg-amber-500 border-amber-500/20 text-amber-600 hover:text-white"
                        permission={{ action: 'read', subject: 'Evento' }}
                    />
                    <QuickCard
                        href="/dashboard/map-personas"
                        icon={Database}
                        label="Mapeo Institucional"
                        sub="Catálogos y migración"
                        colorClass="bg-indigo-500/5 hover:bg-indigo-600 border-indigo-500/20 text-indigo-600 hover:text-white"
                        permission={{ action: 'manage', subject: 'all' }}
                    />
                </div>
            </div>

            {/* ── Fila 3: Actividad reciente + Métricas del módulo ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Actividad reciente */}
                <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                    <SectionHeader icon={Activity} title="Actividad Reciente" action="Ver todo" />
                    <div className="space-y-3">
                        {[
                            { icon: Users, label: 'Nuevo usuario registrado', sub: 'Admin@profe.edu.bo', time: '3 min', color: 'text-primary', bg: 'bg-primary/5' },
                            { icon: BookOpen, label: 'Programa académico actualizado', sub: 'Maestría en Educación — v2.1', time: '18 min', color: 'text-emerald-600', bg: 'bg-emerald-500/5' },
                            { icon: ShieldCheck, label: 'Rol creado: RESPONSABLE SEDE', sub: '14 permisos asignados', time: '1h', color: 'text-violet-600', bg: 'bg-violet-500/5' },
                            { icon: Megaphone, label: 'Comunicado publicado', sub: 'Sede La Paz · Convocatoria 2025', time: '2h', color: 'text-amber-600', bg: 'bg-amber-500/5' },
                            { icon: Map, label: 'Nueva sede habilitada', sub: 'Tarija · Sede Sur', time: '4h', color: 'text-indigo-600', bg: 'bg-indigo-500/5' },
                        ].map((act, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors group cursor-pointer"
                            >
                                <div className={cn("p-2.5 rounded-xl shrink-0", act.bg)}>
                                    <act.icon className={cn("w-4 h-4", act.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{act.label}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{act.sub}</p>
                                </div>
                                <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest shrink-0">{act.time}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Inscritos por Programa */}
                <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                    <SectionHeader icon={GraduationCap} title="Inscritos por Programa" />
                    <div className="space-y-3">
                        {topProgramas.length > 0 ? topProgramas.map((prog: any, i: number) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide truncate max-w-[200px]" title={prog.label}>{prog.label}</span>
                                    <span className="text-[11px] font-black text-foreground">{prog.count}</span>
                                </div>
                                <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((prog.count / (Math.max(...topProgramas.map((p: any) => p.count), 1))) * 100, 100)}%` }}
                                        transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                                        className="h-full rounded-full"
                                        style={{ background: prog.color }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-xs text-muted-foreground">No hay datos suficientes.</p>
                        )}
                    </div>

                    {/* Mini-badges */}
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        {[
                            { label: 'Uptime', value: '99.9%', icon: Zap },
                            { label: 'Alertas', value: metrics?.metrics?.alertas ?? '0', icon: ShieldCheck },
                            { label: 'Logs hoy', value: metrics?.metrics?.logsHoy ?? '...', icon: Activity },
                        ].map((badge, i) => (
                            <div key={i} className="bg-muted/30 rounded-xl p-3 text-center border border-border/30">
                                <badge.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                                <p className="text-sm font-black text-foreground">{badge.value}</p>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{badge.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
