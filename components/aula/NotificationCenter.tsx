'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    Bell,
    X,
    Circle,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    Trash2,
    Calendar,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
            setUnreadCount(data.filter((n: any) => !n.leido).length);
        } catch (err) { }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await aulaService.leerNotificacion(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, leido: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { }
    };

    const deleteNoti = async (id: string) => {
        try {
            await aulaService.eliminarNotificacion(id);
            loadNotifications();
        } catch (err) { }
    };

    const stats = {
        pendientes: unreadCount,
        total: notifications.length,
        leidas: notifications.length - unreadCount
    };

    return (
        <div className="relative">
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
                        {unreadCount}
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
                                "absolute right-0 mt-6 w-[450px] max-h-[700px] flex flex-col rounded-[3.5rem] shadow-2xl z-[101] overflow-hidden border backdrop-blur-3xl",
                                theme === 'dark' ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-100"
                            )}
                        >
                            {/* Header Superior Creativo */}
                            <header className="p-8 pb-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--aula-primary)]/5 rounded-full -translate-y-16 translate-x-16 blur-3xl" />
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[var(--aula-primary)]" />
                                            <h3 className={cn("text-xs font-black uppercase tracking-[0.2em]", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>Centro de Alertas</h3>
                                        </div>
                                        <h2 className={cn("text-2xl font-black leading-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                            Lo que ha pasado<br />
                                            <span className="text-[var(--aula-primary)]">mientras no estabas.</span>
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all hover:rotate-90"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </header>

                            {/* Stats Cards - Rediseñados de forma vibrante */}
                            <div className="px-8 mb-6 grid grid-cols-3 gap-3">
                                <div className={cn(
                                    "p-4 rounded-3xl space-y-1 transition-all hover:scale-105 border",
                                    theme === 'dark' 
                                        ? "bg-rose-500/10 border-rose-500/20 shadow-[0_10px_30px_rgba(244,63,94,0.1)]" 
                                        : "bg-rose-50 border-rose-100 shadow-[0_8px_20px_rgba(244,63,94,0.05)]"
                                )}>
                                    <p className={cn("text-[8px] font-black uppercase tracking-widest", theme === 'dark' ? "text-rose-400" : "text-rose-500")}>Pendientes</p>
                                    <p className={cn("text-xl font-black", theme === 'dark' ? "text-rose-400" : "text-rose-600")}>{stats.pendientes}</p>
                                </div>
                                <div className={cn(
                                    "p-4 rounded-3xl space-y-1 transition-all hover:scale-105 border",
                                    theme === 'dark' 
                                        ? "bg-primary/20 border-primary/30 shadow-[0_10px_30px_rgba(var(--aula-primary-rgb),0.1)]" 
                                        : "bg-primary/5 border-primary/10 shadow-[0_8px_20px_rgba(var(--aula-primary-rgb),0.05)]"
                                )}>
                                    <p className={cn("text-[8px] font-black uppercase tracking-widest", theme === 'dark' ? "text-primary" : "text-primary")}>Total</p>
                                    <p className={cn("text-xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>{stats.total}</p>
                                </div>
                                <div className={cn(
                                    "p-4 rounded-3xl space-y-1 transition-all hover:scale-105 border",
                                    theme === 'dark' 
                                        ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_10px_30px_rgba(16,185,129,0.1)]" 
                                        : "bg-emerald-50 border-emerald-100 shadow-[0_8px_20px_rgba(16,185,129,0.05)]"
                                )}>
                                    <p className={cn("text-[8px] font-black uppercase tracking-widest", theme === 'dark' ? "text-emerald-400" : "text-emerald-500")}>Leídas</p>
                                    <p className={cn("text-xl font-black", theme === 'dark' ? "text-emerald-400" : "text-emerald-600")}>{stats.leidas}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar pb-6 px-4">
                                {notifications.map((noti) => (
                                    <motion.div
                                        key={noti.id}
                                        layout
                                        onClick={() => markAsRead(noti.id)}
                                        className={cn(
                                            "mb-2 p-5 rounded-[2rem] flex gap-5 transition-all cursor-pointer group relative border",
                                            !noti.leido
                                                ? (theme === 'dark' ? "bg-primary/10 border-primary/20" : "bg-primary/5 border-primary/10 shadow-sm")
                                                : (theme === 'dark' ? "bg-transparent border-transparent hover:bg-slate-800/50" : "bg-transparent border-transparent hover:bg-slate-50")
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all group-hover:scale-110",
                                            noti.tipo === 'info' ? "bg-blue-500/10 text-blue-500" :
                                                noti.tipo === 'success' ? "bg-emerald-500/10 text-emerald-500" :
                                                    "bg-primary/10 text-primary"
                                        )}>
                                            {noti.tipo === 'success' ? <CheckCircle2 size={20} /> :
                                                noti.tipo === 'warning' ? <AlertCircle size={20} /> :
                                                    <Activity size={20} />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className={cn("text-xs font-black uppercase tracking-tight", theme === 'dark' ? "text-slate-200" : "text-slate-800")}>{noti.titulo}</p>
                                                {!noti.leido && <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/40 animate-pulse" />}
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">{noti.mensaje}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                    <Clock size={10} />
                                                    {formatDistanceToNow(new Date(noti.createdAt), { addSuffix: true, locale: es })}
                                                </p>
                                                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">{noti.tipo || 'Evento'}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteNoti(noti.id); }}
                                            className="absolute -right-1 -top-1 w-8 h-8 bg-rose-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-75 hover:scale-100 flex items-center justify-center translate-x-2 -translate-y-2"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </motion.div>
                                ))}

                                {notifications.length === 0 && (
                                    <div className="py-24 text-center space-y-6">
                                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200 dark:text-slate-700 relative">
                                            <Bell size={40} className="animate-wiggle" />
                                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary shadow-xl" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Todo está bajo control</p>
                                            <p className="text-slate-300 text-[10px] font-medium max-w-[200px] mx-auto leading-relaxed italic">No tienes alertas pendientes por el momento.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <footer className="p-10 bg-gradient-to-t from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border-t border-slate-100 dark:border-slate-800 relative">
                                <button className="w-full h-14 rounded-3xl bg-[var(--aula-primary)] text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:translate-y-[-2px] hover:scale-[1.02] active:scale-95 transition-all">
                                    Historial Completo
                                </button>
                                <p className="text-center text-[8px] font-bold text-slate-400 mt-4 uppercase tracking-[0.3em] opacity-50">Aula Profe • Hub de Notificaciones</p>
                            </footer>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
