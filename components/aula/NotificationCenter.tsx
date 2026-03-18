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
        } catch (err) {
            // silent fail
        }
    };

    useEffect(() => {
        loadNotifications();
        // Polling cada minuto
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
            setNotifications(notifications.filter(n => n.id !== id));
            loadNotifications();
        } catch (err) { }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all group hover:scale-105 active:scale-95",
                    theme === 'dark' ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-white text-slate-500 hover:text-primary shadow-xl shadow-slate-200/50"
                )}
            >
                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
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
                                "absolute right-0 mt-6 w-[420px] max-h-[600px] flex flex-col rounded-[3rem] shadow-2xl z-[101] overflow-hidden border backdrop-blur-xl",
                                theme === 'dark' ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-100"
                            )}
                        >
                            <header className="p-8 pb-6 flex justify-between items-center bg-gradient-to-b from-primary/5 to-transparent">
                                <div>
                                    <h3 className={cn("text-sm font-black uppercase tracking-[0.2em]", theme === 'dark' ? "text-white" : "text-slate-800")}>Mensajes</h3>
                                    <p className="text-[10px] font-black italic text-primary mt-1 uppercase tracking-widest">Sincronizado ahora</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </header>

                            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                                {notifications.map((noti) => (
                                    <div
                                        key={noti.id}
                                        onClick={() => markAsRead(noti.id)}
                                        className={cn(
                                            "mx-4 mb-2 p-5 rounded-3xl flex gap-5 transition-all cursor-pointer group relative border border-transparent",
                                            !noti.leido
                                                ? (theme === 'dark' ? "bg-primary/10 border-primary/20" : "bg-primary/5 border-primary/10")
                                                : (theme === 'dark' ? "hover:bg-slate-800/80" : "hover:bg-slate-50")
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
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
                                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">{noti.tipo || 'Sistema'}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteNoti(noti.id); }}
                                            className="absolute -right-2 -top-2 w-8 h-8 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-75 hover:scale-100 flex items-center justify-center"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}

                                {notifications.length === 0 && (
                                    <div className="py-24 text-center space-y-6">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200 dark:text-slate-800">
                                            <Bell size={40} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Bandeja de entrada vacía</p>
                                            <p className="text-slate-300 text-[10px] font-medium max-w-[200px] mx-auto">Te avisaremos cuando haya actualizaciones importantes.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <footer className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-md">
                                <button className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all active:scale-95">
                                    Historial Completo
                                </button>
                            </footer>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
