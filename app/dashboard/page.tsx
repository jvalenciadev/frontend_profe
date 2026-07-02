'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Can } from '@/components/Can';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Users, GraduationCap, ClipboardCheck, Zap, ArrowUpRight, ArrowDownRight,
    TrendingUp, ShieldCheck, Database, Map, Calendar, BookOpen,
    Megaphone, Activity, Target, BarChart2, Building2, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AuditLogsModal } from '@/components/AuditLogsModal';

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

const actividadSemanal = [
    { dia: 'Lun', usuarios: 45, eventos: 12 },
    { dia: 'Mar', usuarios: 62, eventos: 18 },
    { dia: 'Mié', usuarios: 51, eventos: 9 },
    { dia: 'Jue', usuarios: 78, eventos: 25 },
    { dia: 'Vie', usuarios: 90, eventos: 31 },
    { dia: 'Sáb', usuarios: 34, eventos: 8 },
    { dia: 'Dom', usuarios: 21, eventos: 4 },
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
    const [activeTab, setActiveTab] = useState<'overview' | 'academy' | 'events' | 'finance'>('overview');
    const [isAuditOpen, setIsAuditOpen] = useState(false);


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

    const academicStats = metrics ? [
        { title: 'Inscritos Totales', count: metrics.stats.inscritosTotales.toString(), trend: 'Activos', isUp: true, icon: GraduationCap, subtitle: `${metrics.stats.preinscritos} preinscritos` },
        { title: 'Ofertas Académicas', count: metrics.stats.ofertasAcademicas.toString(), trend: 'Vigentes', isUp: true, icon: BookOpen, subtitle: 'Programas de postgrado' },
        { title: 'Sedes Operativas', count: metrics.stats.sedesOperativas.toString(), trend: 'Sedes', isUp: true, icon: Building2, subtitle: 'Cobertura nacional' },
        { title: 'Eventos Habilitados', count: metrics.stats.eventosTotales.toString(), trend: 'Eventos', isUp: true, icon: Calendar, subtitle: 'Agenda institucional' },
    ] : [
        { title: 'Inscritos Totales', count: '...', trend: '...', isUp: true, icon: GraduationCap, subtitle: 'Cargando...' },
        { title: 'Ofertas Académicas', count: '...', trend: '...', isUp: true, icon: BookOpen, subtitle: 'Cargando...' },
        { title: 'Sedes Operativas', count: '...', trend: '...', isUp: true, icon: Building2, subtitle: 'Cargando...' },
        { title: 'Eventos Habilitados', count: '...', trend: '...', isUp: true, icon: Calendar, subtitle: 'Cargando...' },
    ];

    const financialStats = metrics ? [
        { title: 'Total Recaudado', count: `Bs. ${metrics.stats.totalRecaudado.toLocaleString()}`, trend: 'Ingresos', isUp: true, icon: Zap, subtitle: 'Vouchers validados' },
        { title: 'Vouchers por Validar', count: metrics.stats.pagosPendientes.toString(), trend: 'Por Confirmar', isUp: false, icon: Clock, subtitle: `Bs. ${metrics.stats.montoPendiente.toLocaleString()} pendientes` },
        { title: 'Comprobantes Rechazados', count: metrics.stats.pagosRechazados.toString(), trend: 'Rechazados', isUp: false, icon: ClipboardCheck, subtitle: 'Pagos no aceptados' },
        { title: 'Inscritos Eventos', count: metrics.stats.totalInscritosEventos.toString(), trend: 'Talleres', isUp: true, icon: Users, subtitle: `${metrics.stats.asistenciaTotalEventos} asistencias registradas` },
    ] : [
        { title: 'Total Recaudado', count: '...', trend: '...', isUp: true, icon: Zap, subtitle: 'Cargando...' },
        { title: 'Vouchers por Validar', count: '...', trend: '...', isUp: false, icon: Clock, subtitle: 'Cargando...' },
        { title: 'Comprobantes Rechazados', count: '...', trend: '...', isUp: false, icon: ClipboardCheck, subtitle: 'Cargando...' },
        { title: 'Inscritos Eventos', count: '...', trend: '...', isUp: true, icon: Users, subtitle: 'Cargando...' },
    ];

    const estadosData = metrics?.estadosInscripcion?.length ? metrics.estadosInscripcion : [
        { name: 'Cargando...', valor: 1, fill: '#cbd5e1' }
    ];

    const colors = ['#10b981', '#f59e0b', '#06b6d4', '#f43f5e', '#64748b', '#8b5cf6', '#3b82f6'];
    estadosData.forEach((d: any, i: number) => {
        if (!d.fill) d.fill = colors[i % colors.length];
    });

    const topProgramas = metrics?.topProgramas || [];
    topProgramas.forEach((p: any, i: number) => {
        if (!p.color) p.color = colors[i % colors.length];
    });

    const ingresosMensuales = metrics?.ingresosMensuales || [
        { mes: 'Ene', ingresos: 0 },
        { mes: 'Feb', ingresos: 0 },
        { mes: 'Mar', ingresos: 0 },
        { mes: 'Abr', ingresos: 0 },
        { mes: 'May', ingresos: 0 },
        { mes: 'Jun', ingresos: 0 },
    ];

    const programasPorModalidad = metrics?.programasPorModalidad || [];
    programasPorModalidad.forEach((m: any, i: number) => {
        if (!m.fill) m.fill = colors[i % colors.length];
    });

    const generoData = metrics?.generoData || [];
    generoData.forEach((g: any, i: number) => {
        if (!g.color) g.color = colors[i % colors.length];
    });

    const topEventos = metrics?.eventosPopulares || [];
    topEventos.forEach((e: any, i: number) => {
        if (!e.color) e.color = colors[i % colors.length];
    });

    const kpiRadial = metrics ? [
        { name: 'Val. Pagos', value: metrics.stats.tasaValidacionPagos || 0, fill: 'hsl(var(--primary))' },
        { name: 'Asis. Eventos', value: metrics.stats.tasaAsistenciaEventos || 0, fill: 'hsl(var(--primary) / 0.65)' },
        { name: 'Conf. Alumnos', value: metrics.stats.tasaConfirmacionInscritos || 0, fill: 'hsl(var(--primary) / 0.35)' },
    ] : [
        { name: 'Val. Pagos', value: 0, fill: 'hsl(var(--primary))' },
        { name: 'Asis. Eventos', value: 0, fill: 'hsl(var(--primary) / 0.65)' },
        { name: 'Conf. Alumnos', value: 0, fill: 'hsl(var(--primary) / 0.35)' },
    ];

    const overviewStats = [
        financialStats[0],
        academicStats[0],
        financialStats[3],
        academicStats[2]
    ];

    const eventStats = metrics ? [
        { title: 'Eventos Habilitados', count: metrics.stats.eventosTotales.toString(), trend: 'Eventos', isUp: true, icon: Calendar, subtitle: 'Activos en plataforma' },
        { title: 'Inscritos Eventos', count: metrics.stats.totalInscritosEventos.toString(), trend: 'Talleres', isUp: true, icon: Users, subtitle: `${metrics.stats.asistenciaTotalEventos} asistencias` },
        { title: 'Asistencias Confirmadas', count: metrics.stats.asistenciaTotalEventos.toString(), trend: 'Confirmados', isUp: true, icon: ClipboardCheck, subtitle: `${metrics.stats.tasaAsistenciaEventos}% de asistencia` },
        { title: 'Tasa de Asistencia', count: `${metrics.stats.tasaAsistenciaEventos}%`, trend: 'Eficiencia', isUp: metrics.stats.tasaAsistenciaEventos >= 50, icon: Target, subtitle: 'Porcentaje de participación' },
    ] : [
        { title: 'Eventos Habilitados', count: '...', trend: '...', isUp: true, icon: Calendar, subtitle: 'Cargando...' },
        { title: 'Inscritos Eventos', count: '...', trend: '...', isUp: true, icon: Users, subtitle: 'Cargando...' },
        { title: 'Asistencias Confirmadas', count: '...', trend: '...', isUp: true, icon: ClipboardCheck, subtitle: 'Cargando...' },
        { title: 'Tasa de Asistencia', count: '...', trend: '...', isUp: true, icon: Target, subtitle: 'Cargando...' },
    ];

    const financeStats = metrics ? [
        { title: 'Total Recaudado', count: `Bs. ${metrics.stats.totalRecaudado.toLocaleString()}`, trend: 'Ingresos', isUp: true, icon: Zap, subtitle: 'Vouchers validados' },
        { title: 'Vouchers por Validar', count: metrics.stats.pagosPendientes.toString(), trend: 'Pendientes', isUp: false, icon: Clock, subtitle: `Bs. ${metrics.stats.montoPendiente.toLocaleString()} en espera` },
        { title: 'Comprobantes Rechazados', count: metrics.stats.pagosRechazados.toString(), trend: 'Rechazados', isUp: false, icon: ClipboardCheck, subtitle: 'Errores/Inconsistencias' },
        { title: 'Tasa de Validación', count: `${metrics.stats.tasaValidacionPagos}%`, trend: 'Validación', isUp: metrics.stats.tasaValidacionPagos >= 70, icon: Target, subtitle: 'Porcentaje de aprobación' },
    ] : [
        { title: 'Total Recaudado', count: '...', trend: '...', isUp: true, icon: Zap, subtitle: 'Cargando...' },
        { title: 'Vouchers por Validar', count: '...', trend: '...', isUp: false, icon: Clock, subtitle: 'Cargando...' },
        { title: 'Comprobantes Rechazados', count: '...', trend: '...', isUp: false, icon: ClipboardCheck, subtitle: 'Cargando...' },
        { title: 'Tasa de Validación', count: '...', trend: '...', isUp: true, icon: Target, subtitle: 'Cargando...' },
    ];

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
                    <Can action="read" subject="AuditLog">
                        <button
                            onClick={() => setIsAuditOpen(true)}
                            className="h-10 px-5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
                        >
                            <Activity className="w-3.5 h-3.5 text-primary" />
                            Auditoría
                        </button>
                    </Can>
                    <button className="h-10 px-5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-[11px] font-black uppercase tracking-widest">
                        Exportar
                    </button>
                    <button className="h-10 px-7 rounded-xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
                        Gestión Global
                    </button>
                </div>
            </motion.section>

            {/* ── Selector de Pestañas (Tabs) ── */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 border-b border-border/40 pb-5">
                {[
                    { id: 'overview', label: 'Consolidado', icon: Activity, desc: 'Vista global' },
                    { id: 'academy', label: 'Oferta Académica', icon: GraduationCap, desc: 'Inscritos y programas' },
                    { id: 'events', label: 'Seminarios y Eventos', icon: Calendar, desc: 'Eventos e inscripciones' },
                    { id: 'finance', label: 'Caja y Depósitos', icon: Zap, desc: 'Ingresos y validaciones' },
                ].map((tab: any) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300 relative text-left w-full md:w-auto",
                                isActive
                                    ? "bg-primary/5 border-primary/20 text-primary"
                                    : "bg-card border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/10"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl border transition-all shrink-0",
                                isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted/50 border-border/40"
                            )}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-wider leading-none truncate">{tab.label}</p>
                                <p className="text-[9px] font-medium tracking-wide opacity-75 mt-0.5 truncate">{tab.desc}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── CONTENIDO DINÁMICO POR PESTAÑA ── */}
            {activeTab === 'overview' && (
                <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                >
                    {/* KPI Cards Consolidados */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {overviewStats.map((s: any, i: number) => (
                            <div key={i}>
                                <StatCard {...s} />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Actividad Reciente */}
                        <div className="xl:col-span-1 bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                            <SectionHeader icon={Activity} title="Actividad Reciente" action="Ver todo" />
                            <div className="space-y-3">
                                {(metrics?.actividadReciente?.map((act: any) => {
                                    const isEnrollment = act.type === 'enrollment';
                                    return {
                                        icon: isEnrollment ? GraduationCap : Users,
                                        label: act.label,
                                        sub: act.sub,
                                        time: act.time,
                                        color: isEnrollment ? 'text-emerald-600' : 'text-primary',
                                        bg: isEnrollment ? 'bg-emerald-500/5' : 'bg-primary/5'
                                    };
                                }) || [
                                        { icon: Users, label: 'Nuevo usuario registrado', sub: 'Admin@profe.edu.bo', time: '3 min', color: 'text-primary', bg: 'bg-primary/5' },
                                        { icon: BookOpen, label: 'Programa académico actualizado', sub: 'Maestría en Educación — v2.1', time: '18 min', color: 'text-emerald-600', bg: 'bg-emerald-500/5' },
                                        { icon: ShieldCheck, label: 'Rol creado: RESPONSABLE SEDE', sub: '14 permisos asignados', time: '1h', color: 'text-violet-600', bg: 'bg-violet-500/5' },
                                        { icon: Megaphone, label: 'Comunicado publicado', sub: 'Sede La Paz · Convocatoria 2025', time: '2h', color: 'text-amber-600', bg: 'bg-amber-500/5' },
                                        { icon: Map, label: 'Nueva sede habilitada', sub: 'Tarija · Sede Sur', time: '4h', color: 'text-indigo-600', bg: 'bg-indigo-500/5' }
                                    ]).map((act: any, i: number) => (
                                        <div
                                            key={i}
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
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* KPIs de Verificación */}
                        <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                            <SectionHeader icon={Target} title="KPIs de Verificación" />
                            <ResponsiveContainer width="100%" height={180}>
                                <RadialBarChart cx="50%" cy="50%" innerRadius={28} outerRadius={88} data={kpiRadial} startAngle={90} endAngle={-270}>
                                    <RadialBar dataKey="value" cornerRadius={6} />
                                    <Tooltip content={<CustomTooltip />} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-2">
                                {kpiRadial.map((k: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: k.fill }} />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex-1">{k.name}</span>
                                        <span className="text-[11px] font-black text-foreground">{k.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Accesos rápidos */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5 mb-4">
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
                                href="/dashboard/seguridad"
                                icon={ShieldCheck}
                                label="Seguridad"
                                sub="Gestión de accesos"
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
                                href="/dashboard/evento"
                                icon={Calendar}
                                label="Eventos"
                                sub="Agenda institucional"
                                colorClass="bg-amber-500/5 hover:bg-amber-500 border-amber-500/20 text-amber-600 hover:text-white"
                                permission={{ action: 'read', subject: 'Evento' }}
                            />
                        </div>
                    </div>

                    {/* Mini-badges */}
                    <div className="grid grid-cols-3 gap-4 border-t border-border/40 pt-6">
                        {[
                            { label: 'Uptime', value: '99.9%', icon: Zap },
                            { label: 'Alertas', value: metrics?.metrics?.alertas ?? '0', icon: ShieldCheck },
                            { label: 'Logs hoy', value: metrics?.metrics?.logsHoy ?? '...', icon: Activity },
                        ].map((badge: any, i: number) => (
                            <div key={i} className="bg-card rounded-2xl p-4 text-center border border-border/40 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-primary/5 rounded-xl text-primary border border-primary/10">
                                        <badge.icon className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{badge.label}</p>
                                        <p className="text-lg font-black text-foreground mt-0.5">{badge.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {activeTab === 'academy' && (
                <motion.div
                    key="academy"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                >
                    {/* KPI Cards Académicos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {academicStats.map((s: any, i: number) => (
                            <div key={i}>
                                <StatCard {...s} />
                            </div>
                        ))}
                    </div>

                    {/* Gráficos e Históricos */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            {/* AreaChart mensual */}
                            <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                                <SectionHeader icon={TrendingUp} title="Inscritos vs. Egresados (Mensual)" action="Ver historial" />
                                <ResponsiveContainer width="100%" height={230}>
                                    <AreaChart data={metrics?.mensualData || inscripcionesData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis dataKey="mes" tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                        <Area type="monotone" dataKey="inscritos" name="Inscritos" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="hsl(var(--primary))" fillOpacity={0.15} dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }} />
                                        <Area type="monotone" dataKey="egresados" name="Preinscritos/Egresados" stroke="#10b981" strokeWidth={2.5} fill="#10b981" fillOpacity={0.1} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* TABLA: Programas Académicos con Mayor Demanda */}
                            <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm overflow-hidden">
                                <SectionHeader icon={GraduationCap} title="Programas Académicos con Mayor Demanda" />
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                <th className="pb-3 pl-2">Programa Académico</th>
                                                <th className="pb-3 text-right">Inscritos Activos</th>
                                                <th className="pb-3 text-right pr-2">Porcentaje</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30 text-xs">
                                            {topProgramas.length > 0 ? (
                                                topProgramas.map((prog: any, i: number) => {
                                                    const total = topProgramas.reduce((acc: number, p: any) => acc + p.count, 0) || 1;
                                                    const percentage = Math.round((prog.count / total) * 100);
                                                    return (
                                                        <tr key={i} className="hover:bg-muted/10 transition-colors">
                                                            <td className="py-3.5 pl-2 font-bold text-foreground">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: prog.color }} />
                                                                    <span className="truncate max-w-[280px] md:max-w-[400px]" title={prog.label}>{prog.label}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3.5 text-right font-black text-foreground">
                                                                {prog.count.toLocaleString()}
                                                            </td>
                                                            <td className="py-3.5 text-right font-black text-muted-foreground pr-2">
                                                                <div className="inline-flex items-center gap-2">
                                                                    <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden shrink-0 hidden sm:block">
                                                                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: prog.color }} />
                                                                    </div>
                                                                    <span className="w-8 shrink-0">{percentage}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="py-4 text-center text-muted-foreground font-bold">
                                                        Sin datos disponibles
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha */}
                        <div className="space-y-6">
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

                            {/* Donut: Programas por Modalidad */}
                            <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                                <SectionHeader icon={BookOpen} title="Modalidades de Estudio" />
                                {programasPorModalidad.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <PieChart>
                                                <Pie
                                                    data={programasPorModalidad}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={45}
                                                    outerRadius={65}
                                                    paddingAngle={4}
                                                    dataKey="cantidad"
                                                    nameKey="modalidad"
                                                >
                                                    {programasPorModalidad.map((entry: any, index: number) => (
                                                        <Cell key={index} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="space-y-1.5 mt-2 max-h-[100px] overflow-y-auto">
                                            {programasPorModalidad.map((m: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between text-[10px]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ background: m.fill }} />
                                                        <span className="font-bold text-muted-foreground uppercase tracking-wider">{m.modalidad}</span>
                                                    </div>
                                                    <span className="font-black text-foreground">{m.cantidad}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-48 text-xs text-muted-foreground font-bold">
                                        Sin datos de modalidades
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'events' && (
                <motion.div
                    key="events"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                >
                    {/* KPI Cards de Eventos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {eventStats.map((s: any, i: number) => (
                            <div key={i}>
                                <StatCard {...s} />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            {/* Actividad semanal / Registros */}
                            <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                                <SectionHeader icon={BarChart2} title="Inscripciones y Actividad Semanal" />
                                <ResponsiveContainer width="100%" height={230}>
                                    <BarChart data={metrics?.actividadSemanal || actividadSemanal} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barSize={10} barGap={3}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis dataKey="dia" tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="usuarios" name="Usuarios Activos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} fillOpacity={0.9} />
                                        <Bar dataKey="eventos" name="Inscritos Eventos" fill="hsl(var(--primary) / 0.35)" radius={[4, 4, 0, 0]} fillOpacity={0.9} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* TABLA: Registro y Popularidad de Eventos */}
                            <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm overflow-hidden">
                                <SectionHeader icon={Calendar} title="Popularidad y Registro de Eventos" />
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                <th className="pb-3 pl-2">Nombre del Evento</th>
                                                <th className="pb-3 text-right">Inscritos Totales</th>
                                                <th className="pb-3 text-right pr-2">Porcentaje</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30 text-xs">
                                            {topEventos.length > 0 ? (
                                                topEventos.map((e: any, i: number) => {
                                                    const total = topEventos.reduce((acc: number, x: any) => acc + x.inscritos, 0) || 1;
                                                    const percentage = Math.round((e.inscritos / total) * 100);
                                                    return (
                                                        <tr key={i} className="hover:bg-muted/10 transition-colors">
                                                            <td className="py-3.5 pl-2 font-bold text-foreground">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                                                                    <span className="truncate max-w-[280px] md:max-w-[400px]" title={e.nombre}>{e.nombre}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3.5 text-right font-black text-foreground">
                                                                {e.inscritos.toLocaleString()}
                                                            </td>
                                                            <td className="py-3.5 text-right font-black text-muted-foreground pr-2">
                                                                <div className="inline-flex items-center gap-2">
                                                                    <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden shrink-0 hidden sm:block">
                                                                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: e.color }} />
                                                                    </div>
                                                                    <span className="w-8 shrink-0">{percentage}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="py-4 text-center text-muted-foreground font-bold">
                                                        Sin datos disponibles
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Demografía & Género */}
                        <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <SectionHeader icon={Users} title="Demografía & Género" />
                                <div className="space-y-4">
                                    {generoData.length > 0 ? (
                                        generoData.map((g: any, i: number) => (
                                            <div key={i} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-muted-foreground uppercase tracking-wide">{g.genero}</span>
                                                    <span className="font-black text-foreground">{g.cantidad}</span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min((g.cantidad / (Math.max(...generoData.map((x: any) => x.cantidad), 1))) * 100, 100)}%` }}
                                                        transition={{ duration: 1, delay: i * 0.1 }}
                                                        className="h-full rounded-full"
                                                        style={{ background: g.color }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground font-bold">Sin datos demográficos registrados.</p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-border/40 pt-5 mt-5">
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Información Operativa</h4>
                                <div className="space-y-3.5 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Asistencia Registrada:</span>
                                        <span className="font-black text-foreground">{metrics?.stats?.asistenciaTotalEventos || 0} alumnos</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Tasa Promedio Asistencia:</span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400">{metrics?.stats?.tasaAsistenciaEventos || 0}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Eventos Programados:</span>
                                        <span className="font-black text-foreground">{metrics?.stats?.eventosTotales || 0} habilitados</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'finance' && (
                <motion.div
                    key="finance"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                >
                    {/* KPI Cards Financieros */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {financeStats.map((s: any, i: number) => (
                            <div key={i}>
                                <StatCard {...s} />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            {/* AreaChart ingresos */}
                            <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
                                <SectionHeader icon={TrendingUp} title="Tendencia de Recaudación Mensual (Bs.)" />
                                <ResponsiveContainer width="100%" height={230}>
                                    <AreaChart data={ingresosMensuales} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis dataKey="mes" tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="ingresos" name="Ingresos (Bs.)" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="hsl(var(--primary))" fillOpacity={0.15} dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* TABLA: Libro de Caja y Recaudación Mensual */}
                            <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm overflow-hidden">
                                <SectionHeader icon={Zap} title="Historial de Conciliación y Recaudación" />
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                <th className="pb-3 pl-2">Período / Mes</th>
                                                <th className="pb-3 text-right">Recaudación Confirmada</th>
                                                <th className="pb-3 text-right pr-2">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30 text-xs">
                                            {ingresosMensuales.map((item: any, i: number) => (
                                                <tr key={i} className="hover:bg-muted/10 transition-colors">
                                                    <td className="py-3.5 pl-2 font-bold text-foreground flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span>{item.mes}</span>
                                                    </td>
                                                    <td className="py-3.5 text-right font-black text-foreground">
                                                        Bs. {item.ingresos.toLocaleString()}
                                                    </td>
                                                    <td className="py-3.5 text-right pr-2">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                            item.ingresos > 0
                                                                ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                                                                : "bg-muted/50 text-muted-foreground border-border/50"
                                                        )}>
                                                            {item.ingresos > 0 ? 'Con ingresos' : 'Sin ingresos'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* KPIs de Caja */}
                        <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <SectionHeader icon={Target} title="KPI de Validación de Caja" />
                                <div className="text-center py-6">
                                    <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border border-primary/20 bg-primary/5 mb-4 relative">
                                        <span className="text-3xl font-black text-primary">{metrics?.stats?.tasaValidacionPagos || 0}%</span>
                                        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin duration-1000 opacity-20" />
                                    </div>
                                    <p className="text-xs font-black text-foreground uppercase tracking-wider">Tasa de Validación</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] mx-auto">Comprobantes confirmados versus total cargados en el sistema.</p>
                                </div>
                            </div>

                            <div className="border-t border-border/40 pt-5 mt-5">
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 font-black">Resumen del Estado</h4>
                                <div className="space-y-3.5 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Depósitos validados:</span>
                                        <span className="font-black text-foreground">Bs. {metrics?.stats?.totalRecaudado?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Monto por conciliar:</span>
                                        <span className="font-black text-amber-600 dark:text-amber-400">Bs. {metrics?.stats?.montoPendiente?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Vouchers observados:</span>
                                        <span className="font-black text-rose-600 dark:text-rose-400">{metrics?.stats?.pagosRechazados || 0} comprobantes</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <AuditLogsModal
                isOpen={isAuditOpen}
                onClose={() => setIsAuditOpen(false)}
            />
        </div>
    );
}

