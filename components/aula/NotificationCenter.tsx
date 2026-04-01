'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    Bell, X, Clock, Trash2,
    Megaphone, AlertTriangle, BookOpen, Trophy, MessageSquare, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

// ─── Tipos centralizados (igual que en la página de notificaciones) ────────
const NOTI_CONFIG: Record<string, {
    icon: any;
    iconBg: string;
    iconText: string;
    cardBg: string;
    cardBorder: string;
    badgeText: string;
    label: string;
}> = {
    URGENTE: {
        icon: Megaphone,
        iconBg: 'bg-rose-500/10',
        iconText: 'text-rose-500',
        cardBg: 'bg-rose-50',
        cardBorder: 'border-rose-100',
        badgeText: 'text-rose-500',
        label: 'Urgente',
    },
    ALERTA: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-500/10',
        iconText: 'text-amber-500',
        cardBg: 'bg-amber-50',
        cardBorder: 'border-amber-100',
        badgeText: 'text-amber-500',
        label: 'Alerta',
    },
    RECORDATORIO: {
        icon: Clock,
        iconBg: 'bg-blue-500/10',
        iconText: 'text-blue-500',
        cardBg: 'bg-blue-50',
        cardBorder: 'border-blue-100',
        badgeText: 'text-blue-500',
        label: 'Recordatorio',
    },
    NUEVA_ACTIVIDAD: {
        icon: BookOpen,
        iconBg: 'bg-cyan-500/10',
        iconText: 'text-cyan-500',
        cardBg: 'bg-cyan-50',
        cardBorder: 'border-cyan-100',
        badgeText: 'text-cyan-500',
        label: 'Nueva Act.',
    },
    ACTIVIDAD_CALIFICADA: {
        icon: Trophy,
        iconBg: 'bg-emerald-500/10',
        iconText: 'text-emerald-500',
        cardBg: 'bg-emerald-50',
        cardBorder: 'border-emerald-100',
        badgeText: 'text-emerald-500',
        label: 'Calificada',
    },
    NUEVO_POST: {
        icon: MessageSquare,
        iconBg: 'bg-violet-500/10',
        iconText: 'text-violet-500',
        cardBg: 'bg-violet-50',
        cardBorder: 'border-violet-100',
        badgeText: 'text-violet-500',
        label: 'Comunidad',
    },
};

const DEFAULT_CONFIG = {
    icon: Bell,
    iconBg: 'bg-slate-500/10',
    iconText: 'text-slate-500',
    cardBg: 'bg-slate-50',
    cardBorder: 'border-slate-100',
    badgeText: 'text-slate-400',
    label: 'Aviso',
};

function getNotiConfig(tipo?: string) {
    if (!tipo) return DEFAULT_CONFIG;
    return NOTI_CONFIG[tipo.toUpperCase()] ?? DEFAULT_CONFIG;
}

interface NotificationCenterProps {
    theme: 'light' | 'dark';
}

export default function NotificationCenter({ theme }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = async () => {
        try {
            const data = await aulaService.getNotificaciones();
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.leida).length);
        } catch { }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await aulaService.leerNotificacion(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { }
    };

    const deleteNoti = async (id: string) => {
        try {
            await aulaService.eliminarNotificacion(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { }
    };

    const stats = {
        pendientes: unreadCount,
        total: notifications.length,
        leidas: notifications.filter(n => n.leida).length,
    };

    return (
        <div className="relative">
            {/* ─── Bell Button ─── */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all group hover:scale-105 active:scale-95",
                    theme === 'dark'
                        ? "bg-slate-800 text-slate-400 hover:text-white"
                        : "bg-white text-slate-500 hover:text-[var(--aula-primary)] shadow-xl shadow-slate-200/50"
                )}
            >
                <Bell size={20} className={cn("transition-transform group-hover:rotate-12", unreadCount > 0 && "animate-wiggle")} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-lg shadow-rose-500/20">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className={cn(
                                "absolute right-0 mt-6 w-[420px] max-h-[680px] flex flex-col rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden border backdrop-blur-3xl",
                                theme === 'dark' ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-100"
                            )}
                        >
                            {/* ─── Header ─── */}
                            <header className="p-6 pb-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--aula-primary)]/5 rounded-full -translate-y-16 translate-x-16 blur-3xl" />
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[var(--aula-primary)]" />
                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                                                Centro de Alertas
                                            </p>
                                        </div>
                                        <h2 className={cn("text-xl font-black leading-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                            Notificaciones
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all hover:rotate-90"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </header>

                            {/* ─── Stats ─── */}
                            <div className="px-6 mb-4 grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Pendientes', value: stats.pendientes, cls: theme === 'dark' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600' },
                                    { label: 'Total', value: stats.total, cls: theme === 'dark' ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-primary/5 border-primary/10 text-primary' },
                                    { label: 'Leídas', value: stats.leidas, cls: theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                                ].map((s, i) => (
                                    <div key={i} className={cn("p-3 rounded-2xl border space-y-0.5 transition-all hover:scale-105", s.cls)}>
                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-70">{s.label}</p>
                                        <p className="text-lg font-black">{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* ─── List ─── */}
                            <div className="flex-1 overflow-y-auto no-scrollbar pb-4 px-3 space-y-1.5">
                                {notifications.map((noti) => {
                                    const cfg = getNotiConfig(noti.tipo);
                                    const IconComp = cfg.icon;
                                    const isUrgent = noti.tipo?.toUpperCase() === 'URGENTE';

                                    return (
                                        <motion.div
                                            key={noti.id}
                                            layout
                                            onClick={() => markAsRead(noti.id)}
                                            className={cn(
                                                "p-4 rounded-[1.5rem] flex gap-4 transition-all cursor-pointer group relative border overflow-hidden",
                                                !noti.leida
                                                    ? `${cfg.cardBg} ${cfg.cardBorder} shadow-md`
                                                    : theme === 'dark'
                                                        ? "bg-transparent border-transparent hover:bg-slate-800/50 opacity-50"
                                                        : "bg-transparent border-transparent hover:bg-slate-50 opacity-50",
                                            )}
                                        >
                                            {/* Colored left accent for unread */}
                                            {!noti.leida && (
                                                <div className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-1 rounded-l-[1.5rem]",
                                                    noti.tipo?.toUpperCase() === 'URGENTE' ? "bg-rose-500" :
                                                        noti.tipo?.toUpperCase() === 'ALERTA' ? "bg-amber-500" :
                                                            noti.tipo?.toUpperCase() === 'NUEVA_ACTIVIDAD' ? "bg-cyan-500" :
                                                                noti.tipo?.toUpperCase() === 'ACTIVIDAD_CALIFICADA' ? "bg-emerald-500" :
                                                                    noti.tipo?.toUpperCase() === 'RECORDATORIO' ? "bg-blue-500" :
                                                                        "bg-primary"
                                                )} />
                                            )}
                                            {/* Urgency pulse overlay */}
                                            {isUrgent && !noti.leida && (
                                                <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none rounded-[1.5rem]" />
                                            )}

                                            {/* ─── Ícono ─── */}
                                            <div className={cn(
                                                "w-10 h-10 min-w-[40px] rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 relative z-10",
                                                cfg.iconBg, cfg.iconText,
                                                isUrgent && !noti.leida && "animate-bounce"
                                            )}>
                                                <IconComp size={17} />
                                            </div>

                                            {/* ─── Texto ─── */}
                                            <div className="flex-1 min-w-0 relative z-10">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className={cn("text-xs font-black leading-snug flex-1 min-w-0 truncate", theme === 'dark' ? "text-slate-200" : "text-slate-800")}>
                                                        {noti.titulo}
                                                    </p>
                                                    {!noti.leida && (
                                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                                                    {noti.mensaje}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                                        <Clock size={9} />
                                                        {formatDistanceToNow(new Date(noti.createdAt), { addSuffix: true, locale: es })}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                    <span className={cn("text-[9px] font-black uppercase tracking-wider", cfg.badgeText)}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Delete */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteNoti(noti.id); }}
                                                className="absolute -right-1 -top-1 w-7 h-7 bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-75 hover:scale-100 flex items-center justify-center"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        </motion.div>
                                    );
                                })}

                                {notifications.length === 0 && (
                                    <div className="py-16 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200 dark:text-slate-700">
                                            <Bell size={32} />
                                        </div>
                                        <p className="text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">Todo está bajo control</p>
                                        <p className="text-slate-300 text-[10px] font-medium max-w-[180px] mx-auto leading-relaxed italic">No tienes alertas pendientes.</p>
                                    </div>
                                )}
                            </div>

                            {/* ─── Footer ─── */}
                            <footer className="p-5 border-t border-slate-100 dark:border-slate-800">
                                <Link
                                    href="/aula/notificaciones"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center w-full h-12 rounded-2xl bg-[var(--aula-primary)] text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Ver Historial Completo
                                </Link>
                            </footer>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
