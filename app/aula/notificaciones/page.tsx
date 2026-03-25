'use client';

import { useAula } from '@/contexts/AulaContext';
import { motion } from 'framer-motion';
import {
    Bell,
    MessageSquare,
    FileText,
    Calendar,
    Info,
    CheckCircle2,
    Search,
    Filter,
    Clock,
    ArrowRight,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { aulaService } from '@/services/aulaService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function NotificacionesPage() {
    const { theme } = useAula();
    const [filter, setFilter] = useState<'todo' | 'tareas' | 'comunidad' | 'alertas'>('todo');
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

    useEffect(() => {
        loadNotifications();
    }, []);

    const getNotifStyle = (tipo: string) => {
        const t = tipo?.toUpperCase() || '';
        
        if (t.startsWith('RECORDATORIO')) {
            if (t.includes('_1H')) {
                return { icon: Clock, color: 'from-rose-600 to-pink-600', label: 'alertas', flash: true };
            }
            if (t.includes('_1D')) {
                return { icon: Clock, color: 'from-orange-500 to-amber-600', label: 'alertas' };
            }
            return { icon: Calendar, color: 'from-blue-500 to-cyan-600', label: 'alertas' };
        }

        switch (t) {
            case 'NUEVA_ACTIVIDAD':
                return { icon: FileText, color: 'from-violet-500 to-purple-600', label: 'tareas' };
            case 'ENTREGA_CALIFICADA':
                return { icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', label: 'tareas' };
            case 'NUEVO_POST':
                return { icon: MessageSquare, color: 'from-primary to-blue-500', label: 'comunidad' };
            case 'INSIGNIA':
                return { icon: Info, color: 'from-amber-400 to-yellow-600', label: 'alertas' };
            default:
                return { icon: Bell, color: 'from-slate-500 to-slate-700', label: 'todo' };
        }
    };

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            await aulaService.leerNotificacion(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await aulaService.marcarTodasLeidas();
            setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
            toast.success('Todas las notificaciones marcadas como leídas');
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemove = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await aulaService.eliminarNotificacion(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Notificación eliminada');
        } catch (err) {
            console.error(err);
        }
    };

    const stats = [
        { label: 'Pendientes', value: notifications.filter(n => !n.leida).length.toString(), color: 'text-rose-500' },
        { label: 'Total', value: notifications.length.toString(), color: 'text-primary' },
        { label: 'Leídas', value: notifications.filter(n => n.leida).length.toString(), color: 'text-slate-400' },
    ];

    const mappedNotifications = notifications.map(n => {
        const style = getNotifStyle(n.tipo);
        return {
            ...n,
            ...style,
            time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es }),
        };
    });

    const filtered = mappedNotifications.filter(n => filter === 'todo' ? true : n.label === filter);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Sincronizando Alertas...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-32">
            {/* ─── Hero Header Rediseñado - Sin Degradados ─── */}
            <header className={cn(
                "relative py-20 px-12 overflow-hidden rounded-[4rem] border shadow-2xl transition-all duration-500 hover:shadow-primary/20 group",
                theme === 'dark' 
                    ? "bg-slate-900 border-slate-800" 
                    : "bg-[var(--aula-primary)] border-[var(--aula-primary)]"
            )}>
                {/* Abstract Pattern Background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} 
                />

                {/* Creative Floating Elements */}
                <div className="absolute top-10 right-20 w-4 h-4 bg-white/20 rounded-full animate-ping" />
                <div className="absolute bottom-10 left-1/3 w-2 h-2 bg-white/40 rounded-full" />
                <div className="absolute top-1/2 right-1/4 w-20 h-20 border-4 border-white/10 rounded-full scale-150" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-[2rem] bg-white flex items-center justify-center text-[var(--aula-primary)] shadow-2xl group-hover:rotate-12 transition-transform">
                                <Bell size={32} strokeWidth={2.5} className={cn(notifications.some(n => !n.leida) && "animate-wiggle")} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-white font-black uppercase tracking-[0.4em] text-[10px] block opacity-70">Sincronizado</span>
                                <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs">Centro de Alertas</h3>
                            </div>
                        </div>
                        <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tighter">
                            Lo que ha pasado <br />
                            <span className="text-white/40">mientras no estabas.</span>
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.map((s, i) => (
                            <div key={i} className={cn(
                                "p-6 rounded-[2.5rem] border backdrop-blur-md transition-all hover:scale-105 hover:translate-y-[-4px]",
                                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white/10 border-white/20 shadow-xl"
                            )}>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">{s.label}</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-4xl font-black text-white">{s.value}</p>
                                    <span className="text-[10px] text-white/40 font-black uppercase">Noti</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 px-2">
                {/* ─── Modern Sidebar Filters ─── */}
                <aside className="lg:col-span-1 space-y-10">
                    <div className="space-y-6">
                        <h3 className={cn("text-xs font-black uppercase tracking-[0.2em]", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>Filtrar por</h3>
                        <div className="flex flex-col gap-2">
                            <FilterItem active={filter === 'todo'} onClick={() => setFilter('todo')} label="Todas" icon={Bell} count={notifications.length} />
                            <FilterItem active={filter === 'tareas'} onClick={() => setFilter('tareas')} label="Actividades" icon={FileText} count={notifications.filter(n => getNotifStyle(n.tipo).label === 'tareas').length} />
                            <FilterItem active={filter === 'comunidad'} onClick={() => setFilter('comunidad')} label="Comunidad" icon={MessageSquare} count={notifications.filter(n => getNotifStyle(n.tipo).label === 'comunidad').length} />
                            <FilterItem active={filter === 'alertas'} onClick={() => setFilter('alertas')} label="Alertas" icon={Clock} count={notifications.filter(n => getNotifStyle(n.tipo).label === 'alertas').length} />
                        </div>
                    </div>

                    <div className={cn("p-8 rounded-[2.5rem] border space-y-6", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50")}>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Calendar size={20} />
                        </div>
                        <div className="space-y-2">
                            <h4 className={cn("font-black text-sm", theme === 'dark' ? "text-white" : "text-slate-900")}>Gestión Directa</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">¿Necesitas limpiar tu historial? Puedes marcar todo como leído en un clic.</p>
                        </div>
                        <button
                            onClick={handleMarkAllRead}
                            className="w-full h-11 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                        >
                            Marcar Todo Leído
                        </button>
                    </div>
                </aside>

                {/* ─── Creative Notifications Feed ─── */}
                <main className="lg:col-span-3 space-y-8">
                    {/* Creative Summary Widget */}
                    {filtered.some(n => n.flash) && (
                        <div className="relative p-10 rounded-[3rem] bg-gradient-to-br from-rose-500/10 to-orange-500/5 border border-rose-500/20 overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[60px] -mr-32 -mt-32" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                <div className="w-20 h-20 rounded-3xl bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/40 animate-pulse">
                                    <Clock size={40} />
                                </div>
                                <div className="flex-1 text-center md:text-left space-y-2">
                                    <h2 className="text-2xl font-black text-white">¡Aviso de Último Minuto!</h2>
                                    <p className="text-slate-400 font-medium">Tienes actividades a punto de expirar. No permitas que el tiempo gane esta vez.</p>
                                </div>
                                <button 
                                    onClick={() => setFilter('alertas')}
                                    className="px-8 py-4 rounded-2xl bg-white text-rose-500 font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl"
                                >
                                    Ver Urgentes
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-1 bg-primary rounded-full" />
                            <p className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                                Recientes ({filtered.length})
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filtered.map((notif, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={notif.id}
                                onClick={() => handleMarkAsRead(notif.id, notif.leida)}
                                className={cn(
                                    "relative p-8 rounded-[3rem] border transition-all flex items-start gap-8 group cursor-pointer overflow-hidden",
                                    notif.leida ? "opacity-60 grayscale-[0.2]" : "",
                                    theme === 'dark'
                                        ? "bg-slate-900 border-slate-800 hover:border-primary/40"
                                        : "bg-white border-slate-100 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20"
                                )}
                            >
                                {/* Priority Glow */}
                                {!notif.leida && (
                                    <div className={cn(
                                        "absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-10 pointer-events-none transition-all group-hover:opacity-20 bg-primary"
                                    )} />
                                )}

                                {notif.flash && (
                                    <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none" />
                                )}

                                {/* Icon Plate */}
                                <div className={cn(
                                    "w-16 h-16 rounded-[1.5rem] bg-gradient-to-br flex items-center justify-center text-white shadow-lg shadow-black/10 shrink-0 relative z-10",
                                    notif.color,
                                    notif.flash && "animate-bounce"
                                )}>
                                    <notif.icon size={26} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-3 min-w-0">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className={cn("text-xl font-black leading-none", theme === 'dark' ? "text-white" : "text-slate-800 group-hover:text-primary transition-colors")}>
                                                {notif.titulo}
                                            </h3>
                                            {!notif.leida && <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--aula-primary)]" />}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{notif.time}</span>
                                            <button
                                                onClick={(e) => handleRemove(e, notif.id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className={cn("text-base font-medium leading-relaxed max-w-2xl", theme === 'dark' ? "text-slate-400" : "text-slate-500 font-inter")}>
                                        {notif.mensaje}
                                    </p>

                                    {!notif.leida && notif.linkRef && (
                                        <div className="pt-4">
                                            <button
                                                onClick={() => window.location.href = notif.linkRef!}
                                                className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:gap-3 transition-all group/btn"
                                            >
                                                Ir al recurso <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {filtered.length === 0 && (
                            <div className="py-32 text-center space-y-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3.5rem]">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                    <Bell size={40} />
                                </div>
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No hay notificaciones en esta categoría</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

function FilterItem({ active, onClick, label, icon: Icon, count }: any) {
    const { theme } = useAula();
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full h-14 px-6 rounded-2xl flex items-center justify-between transition-all group",
                active
                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02] z-10"
                    : theme === 'dark' ? "bg-slate-900 border border-slate-800 text-slate-500 hover:border-slate-700" : "bg-white border border-slate-50 text-slate-400 hover:shadow-lg"
            )}
        >
            <div className="flex items-center gap-4">
                <Icon size={18} className={cn(active ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            {count > 0 && (
                <span className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                    active ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}
