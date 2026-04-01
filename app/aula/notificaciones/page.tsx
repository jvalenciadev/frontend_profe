'use client';

import { useAula } from '@/contexts/AulaContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    MessageSquare,
    CheckCircle2,
    Clock,
    ArrowRight,
    Trash2,
    Megaphone,
    AlertTriangle,
    BookOpen,
    Trophy,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { aulaService } from '@/services/aulaService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

// ─── Configuración de tipos de notificación ────────────────────────────────
const NOTI_CONFIG: Record<string, {
    icon: any;
    iconBg: string;
    iconShadow: string;
    badgeText: string;
    badgeBg: string;
    badgeBorder: string;
    cardBg: string;
    cardBorder: string;
    label: string;
    filterKey: string;
}> = {
    URGENTE: {
        icon: Megaphone,
        iconBg: 'bg-rose-500',
        iconShadow: 'shadow-rose-400/40',
        badgeText: 'text-rose-600',
        badgeBg: 'bg-rose-50',
        badgeBorder: 'border-rose-200',
        cardBg: 'bg-rose-50',
        cardBorder: 'border-rose-200',
        label: 'Urgente',
        filterKey: 'urgente',
    },
    ALERTA: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-500',
        iconShadow: 'shadow-amber-400/40',
        badgeText: 'text-amber-600',
        badgeBg: 'bg-amber-50',
        badgeBorder: 'border-amber-200',
        cardBg: 'bg-amber-50',
        cardBorder: 'border-amber-200',
        label: 'Alerta',
        filterKey: 'alerta',
    },
    RECORDATORIO: {
        icon: Clock,
        iconBg: 'bg-blue-500',
        iconShadow: 'shadow-blue-400/40',
        badgeText: 'text-blue-600',
        badgeBg: 'bg-blue-50',
        badgeBorder: 'border-blue-200',
        cardBg: 'bg-blue-50',
        cardBorder: 'border-blue-200',
        label: 'Recordatorio',
        filterKey: 'recordatorio',
    },
    NUEVA_ACTIVIDAD: {
        icon: BookOpen,
        iconBg: 'bg-cyan-500',
        iconShadow: 'shadow-cyan-400/40',
        badgeText: 'text-cyan-600',
        badgeBg: 'bg-cyan-50',
        badgeBorder: 'border-cyan-200',
        cardBg: 'bg-cyan-50',
        cardBorder: 'border-cyan-200',
        label: 'Nueva Actividad',
        filterKey: 'actividad',
    },
    ACTIVIDAD_CALIFICADA: {
        icon: Trophy,
        iconBg: 'bg-emerald-500',
        iconShadow: 'shadow-emerald-400/40',
        badgeText: 'text-emerald-600',
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-200',
        cardBg: 'bg-emerald-50',
        cardBorder: 'border-emerald-200',
        label: 'Calificada',
        filterKey: 'actividad',
    },
    NUEVO_POST: {
        icon: MessageSquare,
        iconBg: 'bg-violet-500',
        iconShadow: 'shadow-violet-400/40',
        badgeText: 'text-violet-600',
        badgeBg: 'bg-violet-50',
        badgeBorder: 'border-violet-200',
        cardBg: 'bg-violet-50',
        cardBorder: 'border-violet-200',
        label: 'Comunidad',
        filterKey: 'comunidad',
    },
};

const DEFAULT_CONFIG = {
    icon: Bell,
    iconBg: 'bg-slate-500',
    iconShadow: 'shadow-slate-400/20',
    badgeText: 'text-slate-500',
    badgeBg: 'bg-slate-50',
    badgeBorder: 'border-slate-200',
    cardBg: 'bg-slate-50',
    cardBorder: 'border-slate-200',
    label: 'Aviso',
    filterKey: 'todo',
};

const FILTERS = [
    { key: 'todo',         label: 'Todas',         icon: Bell },
    { key: 'urgente',      label: 'Urgente',        icon: Megaphone },
    { key: 'alerta',       label: 'Alerta',         icon: AlertTriangle },
    { key: 'recordatorio', label: 'Recordatorio',   icon: Clock },
    { key: 'actividad',    label: 'Actividades',    icon: BookOpen },
    { key: 'comunidad',    label: 'Comunidad',      icon: MessageSquare },
];

function getNotiConfig(tipo?: string) {
    if (!tipo) return DEFAULT_CONFIG;
    return NOTI_CONFIG[tipo.toUpperCase()] ?? DEFAULT_CONFIG;
}

export default function NotificacionesPage() {
    const { theme } = useAula();
    const [filter, setFilter] = useState('todo');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadNotifications = async () => {
        try {
            const data = await aulaService.getNotificaciones();
            setNotifications(data || []);
        } catch (err) {
            console.error('Error al cargar notificaciones:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadNotifications(); }, []);

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            await aulaService.leerNotificacion(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
        } catch { }
    };

    const handleMarkAllRead = async () => {
        try {
            await aulaService.marcarTodasLeidas();
            setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
            toast.success('Todas las notificaciones marcadas como leídas');
        } catch { }
    };

    const handleRemove = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await aulaService.eliminarNotificacion(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Notificación eliminada');
        } catch { }
    };

    const filtered = notifications.filter(n =>
        filter === 'todo' || getNotiConfig(n.tipo).filterKey === filter
    );

    const unreadCount = notifications.filter(n => !n.leida).length;
    const hasUrgent = notifications.some(n => n.tipo?.toUpperCase() === 'URGENTE' && !n.leida);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Sincronizando Alertas...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32">

            {/* ─── Hero ─── */}
            <header className={cn(
                "relative py-14 px-10 overflow-hidden rounded-[3rem] border shadow-2xl",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-[var(--aula-primary)] border-[var(--aula-primary)]"
            )}>
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")` }} />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                            <Bell size={28} strokeWidth={2.5} className={cn(unreadCount > 0 && "animate-wiggle")} />
                        </div>
                        <div>
                            <span className="text-white/60 font-black uppercase tracking-[0.3em] text-[9px] block">Centro de Alertas</span>
                            <h1 className="text-3xl font-black text-white">Notificaciones</h1>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        {[
                            { label: 'Pendientes', value: unreadCount },
                            { label: 'Total', value: notifications.length },
                        ].map((s, i) => (
                            <div key={i} className="px-6 py-4 rounded-2xl border border-white/20 bg-white/10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/60">{s.label}</p>
                                <p className="text-3xl font-black text-white">{s.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* ─── Urgente Banner ─── */}
            {hasUrgent && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-[2rem] bg-rose-50 border border-rose-200 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-400/40 animate-pulse shrink-0">
                        <Megaphone size={24} />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-black text-rose-700">¡Tienes actividades urgentes!</h2>
                        <p className="text-sm text-rose-500">Menos de 1 hora para el vencimiento. Actúa ahora.</p>
                    </div>
                    <button onClick={() => setFilter('urgente')}
                        className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shrink-0">
                        Ver Urgentes
                    </button>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* ─── Sidebar ─── */}
                <aside className="lg:col-span-1 space-y-6">
                    <h3 className={cn("text-[10px] font-black uppercase tracking-[0.25em]", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>
                        Filtrar por tipo
                    </h3>
                    <div className="flex flex-col gap-2">
                        {FILTERS.map(f => {
                            const count = f.key === 'todo'
                                ? notifications.length
                                : notifications.filter(n => getNotiConfig(n.tipo).filterKey === f.key).length;
                            const unread = f.key === 'todo'
                                ? unreadCount
                                : notifications.filter(n => getNotiConfig(n.tipo).filterKey === f.key && !n.leida).length;
                            const isActive = filter === f.key;
                            return (
                                <button key={f.key} onClick={() => setFilter(f.key)}
                                    className={cn(
                                        "w-full h-13 px-4 py-3 rounded-2xl flex items-center justify-between transition-all group",
                                        isActive
                                            ? "bg-primary text-white shadow-xl shadow-primary/20"
                                            : theme === 'dark'
                                                ? "bg-slate-900 border border-slate-800 text-slate-500 hover:border-slate-700"
                                                : "bg-white border border-slate-100 text-slate-400 hover:shadow-md hover:border-slate-200"
                                    )}>
                                    <div className="flex items-center gap-3">
                                        <f.icon size={15} className={isActive ? "text-white" : "text-slate-400 group-hover:text-primary transition-colors"} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">{f.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {unread > 0 && (
                                            <span className={cn("min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[8px] font-black",
                                                isActive ? "bg-white/25 text-white" : "bg-rose-100 text-rose-600"
                                            )}>{unread}</span>
                                        )}
                                        {count > 0 && (
                                            <span className={cn("min-w-[22px] h-[22px] px-1 rounded-lg flex items-center justify-center text-[9px] font-black",
                                                isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                            )}>{count}</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className={cn("p-5 rounded-2xl border space-y-4", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-lg shadow-slate-100")}>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <h4 className={cn("font-black text-sm mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>Gestión Directa</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">Limpia tu historial marcando todo de un clic.</p>
                        </div>
                        <button onClick={handleMarkAllRead}
                            className="w-full h-10 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                            Marcar Todo Leído
                        </button>
                    </div>
                </aside>

                {/* ─── Feed ─── */}
                <main className="lg:col-span-3 space-y-3">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-5 w-1 bg-primary rounded-full" />
                        <p className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                            {FILTERS.find(f => f.key === filter)?.label ?? 'Recientes'} ({filtered.length})
                        </p>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {filtered.map((notif, i) => {
                            const cfg = getNotiConfig(notif.tipo);
                            const IconComp = cfg.icon;
                            const isUrgent = notif.tipo?.toUpperCase() === 'URGENTE';

                            return (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => handleMarkAsRead(notif.id, notif.leida)}
                                    className={cn(
                                        "relative p-6 rounded-[2rem] border transition-all flex items-start gap-5 group cursor-pointer overflow-hidden",
                                        "hover:shadow-xl hover:scale-[1.005]",
                                        notif.leida
                                            ? theme === 'dark'
                                                ? "bg-slate-900/60 border-slate-800 opacity-60"
                                                : "bg-white border-slate-100 opacity-60"
                                            : theme === 'dark'
                                                ? "bg-slate-900 border-slate-700"
                                                : `${cfg.cardBg} ${cfg.cardBorder}`
                                    )}
                                >
                                    {/* Urgency pulse overlay */}
                                    {isUrgent && !notif.leida && (
                                        <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none rounded-[2rem]" />
                                    )}

                                    {/* ─── Ícono diferenciado ─── */}
                                    <div className={cn(
                                        "w-13 h-13 min-w-[52px] min-h-[52px] rounded-[1.25rem] flex items-center justify-center text-white shadow-lg relative z-10",
                                        cfg.iconBg,
                                        cfg.iconShadow,
                                        isUrgent && !notif.leida && "animate-bounce"
                                    )}>
                                        <IconComp size={22} />
                                    </div>

                                    {/* ─── Contenido ─── */}
                                    <div className="flex-1 min-w-0 relative z-10">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                <h3 className={cn(
                                                    "font-black text-base leading-tight",
                                                    theme === 'dark' ? "text-white" : "text-slate-800 group-hover:text-primary transition-colors"
                                                )}>
                                                    {notif.titulo}
                                                </h3>
                                                {/* Badge tipo */}
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border shrink-0",
                                                    cfg.badgeText, cfg.badgeBg, cfg.badgeBorder,
                                                    notif.leida && "opacity-50"
                                                )}>
                                                    {cfg.label}
                                                </span>
                                                {!notif.leida && (
                                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_6px_var(--aula-primary)] shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                                                </span>
                                                <button
                                                    onClick={(e) => handleRemove(e, notif.id)}
                                                    className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-rose-50"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className={cn("text-sm font-medium leading-relaxed", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                                            {notif.mensaje}
                                        </p>
                                        {!notif.leida && notif.linkRef && (
                                            <button
                                                onClick={() => window.location.href = notif.linkRef!}
                                                className={cn("mt-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all group/link", cfg.badgeText)}
                                            >
                                                Ir al recurso <ArrowRight size={11} className="group-hover/link:translate-x-1 transition-transform" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {filtered.length === 0 && (
                        <div className="py-24 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] space-y-4">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <Bell size={32} />
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sin notificaciones en esta categoría</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
