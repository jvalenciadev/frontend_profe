'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePathname } from 'next/navigation';
import {
    Bell,
    Search,
    Sun,
    Moon,
    Menu,
    ChevronRight,
    Clock,
    Wifi,
    Shield,
    Megaphone,
    CheckCheck,
    AlertCircle,
    Building2,
    X,
    Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { cn, getImageUrl } from '@/lib/utils';
import { useProfe } from '@/contexts/ProfeContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ComunicadoApi } from '@/features/comunicado/infrastructure/ComunicadoApi';
import { Comunicado } from '@/features/comunicado/domain/Comunicado';

const BREADCRUMB_LABELS: Record<string, string> = {
    dashboard: 'Inicio',
    usuarios: 'Usuarios',
    roles: 'Roles',
    permisos: 'Permisos',
    territorial: 'Territorial',
    departamentos: 'Departamentos',
    provincias: 'Provincias',
    sedes: 'Sedes',
    distritos: 'Distritos',
    galerias: 'Galerías',
    academico: 'Académico',
    'programas-maestro': 'Programas Maestro',
    'ofertas-academicas': 'Ofertas Académicas',
    comunicacion: 'Comunicación',
    eventos: 'Eventos',
    blogs: 'Blogs',
    comunicados: 'Comunicados',
    rrhh: 'RRHH',
    cargos: 'Cargos',
    evaluaciones: 'Evaluaciones',
    periodos: 'Periodos',
    profe: 'Administración',
    configuracion: 'Configuración',
    accesos: 'Accesos',
    'mi-ficha': 'Mi Ficha',
    'map-personas': 'Mapeo Institucional',
};

function useClock() {
    const [time, setTime] = useState('');
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, []);
    return time;
}

export function Header() {
    const { user } = useAuth();
    const { setMobileSidebarOpen, theme, toggleTheme } = useTheme();
    const { config: profe } = useProfe();
    const pathname = usePathname();
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState<Comunicado | null>(null);
    const [comunicados, setComunicados] = useState<Comunicado[]>([]);
    const [readIds, setReadIds] = useState<string[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);
    const time = useClock();

    useEffect(() => {
        try {
            const saved = localStorage.getItem('comunicados_read_ids');
            if (saved) setReadIds(JSON.parse(saved));
        } catch (e) { }

        const fetchComunicados = async () => {
            try {
                const params: any = { limit: 6 };
                if (user?.tenantId) params.tenantId = user.tenantId;
                const data = await ComunicadoApi.getAll(params);
                setComunicados(data || []);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };
        fetchComunicados();
    }, [user?.tenantId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = (id?: string) => {
        if (!id) {
            const allIds = comunicados.map(c => c.id);
            setReadIds(allIds);
            try { localStorage.setItem('comunicados_read_ids', JSON.stringify(allIds)); } catch (e) { }
        } else if (!readIds.includes(id)) {
            const updated = [...readIds, id];
            setReadIds(updated);
            try { localStorage.setItem('comunicados_read_ids', JSON.stringify(updated)); } catch (e) { }
        }
    };

    const unreadItems = comunicados.filter(c => !readIds.includes(c.id));
    const unreadCount = unreadItems.length;
    const hasUrgent = unreadItems.some(c => (c.importancia || '').toUpperCase() === 'URGENTE');
    const hasImportant = unreadItems.some(c => (c.importancia || '').toUpperCase() === 'IMPORTANTE');

    const IMG = (src: string | null) => {
        if (!src) return null;
        return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    };

    // Breadcrumb from pathname
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = segments.map((seg, i) => ({
        label: BREADCRUMB_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
        href: '/' + segments.slice(0, i + 1).join('/'),
    }));

    const pageTitle = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Dashboard';

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // ── Portal modal institucional (renderiza en document.body para evitar clipping por z-index/overflow) ──
    const modalContent = mounted && selectedNotif ? (() => {
        const n = selectedNotif;
        const imp = (n.importancia || 'normal').toUpperCase();
        const isAdminType = n.tipo === 'ADMINISTRATIVO';

        const impColor = imp === 'URGENTE'
            ? { bg: '#b91c1c', border: '#ef4444', label: 'URGENTE' }
            : imp === 'IMPORTANTE'
                ? { bg: '#b45309', border: '#f59e0b', label: 'IMPORTANTE' }
                : isAdminType
                    ? { bg: '#6d28d9', border: '#8b5cf6', label: 'ADMINISTRATIVO' }
                    : { bg: '#1e40af', border: '#3b82f6', label: 'GENERAL' };

        return createPortal(
            <AnimatePresence>
                <motion.div
                    key="notif-modal-portal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedNotif(null)}
                >
                    <motion.div
                        initial={{ scale: 0.94, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.94, opacity: 0, y: 16 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        onClick={e => e.stopPropagation()}
                        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-card-foreground flex flex-col max-h-[85vh]"
                    >
                        {/* Header institucional */}
                        <div
                            className="px-6 py-4 flex items-start gap-3.5 relative text-white shrink-0 shadow-md z-10"
                            style={{ background: impColor.bg }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                                {imp === 'URGENTE' ? (
                                    <AlertCircle className="w-5 h-5 text-white" />
                                ) : imp === 'IMPORTANTE' || isAdminType ? (
                                    <Shield className="w-5 h-5 text-white" />
                                ) : (
                                    <Megaphone className="w-5 h-5 text-white" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 pr-8">
                                <div className="flex flex-wrap gap-1.5 mb-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                                        {impColor.label}
                                    </span>
                                    {n.tipo && n.tipo !== impColor.label && (
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                                            {n.tipo}
                                        </span>
                                    )}
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 border border-emerald-400/30">
                                        {n.tenant ? n.tenant.nombre : 'Global'}
                                    </span>
                                </div>
                                <h3 className="text-base font-black uppercase italic tracking-tight text-white leading-snug">
                                    {n.nombre}
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedNotif(null)}
                                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Cuerpo deslizable / Scrollable body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {/* Imagen institucional completa si existe */}
                            {n.imagen && (
                                <div className="w-full bg-slate-950 dark:bg-black border-b border-border flex items-center justify-center p-3 min-h-[200px] max-h-[380px]">
                                    <img
                                        src={getImageUrl(n.imagen)}
                                        alt={n.nombre}
                                        className="w-full h-full max-h-[360px] object-contain rounded-lg"
                                        onError={e => {
                                            const parent = (e.target as HTMLImageElement).parentElement;
                                            if (parent) parent.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            {/* Detalle / Contenido */}
                            <div className="p-6 space-y-4">
                                {n.descripcion && (
                                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium">
                                        {n.descripcion}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 pt-3 border-t border-border/60 text-xs font-semibold text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                                    <span>
                                        {n.createdAt
                                            ? new Date(n.createdAt).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })
                                            : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer modal fijo */}
                        <div className="px-6 py-3.5 bg-muted/40 border-t border-border flex items-center justify-between shrink-0 z-10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                                <Bell className="w-3.5 h-3.5" /> Comunicado Oficial
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedNotif(null)}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-white rounded-xl transition-opacity hover:opacity-90 active:scale-95 shadow-sm"
                                style={{ background: impColor.bg }}
                            >
                                Entendido
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>,
            document.body
        );
    })() : null;

    return (
        <>
            <header className="h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-all duration-300 bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm">
                {/* Left: Menu + Breadcrumb */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="md:hidden p-2 rounded-xl bg-card border border-border shadow-sm text-muted-foreground hover:text-primary active:scale-95 transition-all shrink-0"
                    >
                        <Menu className="w-4.5 h-4.5" />
                    </button>

                    {/* Breadcrumb */}
                    <nav className="hidden sm:flex items-center gap-1.5 min-w-0">
                        {breadcrumbs.map((crumb, i) => (
                            <div key={crumb.href} className="flex items-center gap-1.5 min-w-0">
                                {i < breadcrumbs.length - 1 ? (
                                    <>
                                        <Link
                                            href={crumb.href}
                                            className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider truncate"
                                        >
                                            {crumb.label}
                                        </Link>
                                        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                                    </>
                                ) : (
                                    <span className="text-[11px] font-black text-foreground uppercase tracking-wider truncate">
                                        {crumb.label}
                                    </span>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Mobile: Just the page title */}
                    <span className="sm:hidden text-sm font-black tracking-tight text-foreground uppercase truncate">
                        {pageTitle}
                    </span>

                    {/* Search bar */}
                    <div className={cn(
                        "relative ml-2 transition-all duration-500",
                        searchFocused ? "w-64 lg:w-80" : "w-36 lg:w-52"
                    )}>
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className={cn("w-3.5 h-3.5 transition-colors", searchFocused ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            placeholder="Buscar..."
                            className="w-full h-9 pl-9 pr-4 rounded-xl bg-muted/40 border border-transparent focus:border-primary/30 focus:bg-card transition-all outline-none text-xs font-medium placeholder:text-muted-foreground/50"
                        />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 lg:gap-2 shrink-0 ml-2">
                    {/* Server Status */}
                    <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Online</span>
                        </div>
                        <div className="w-px h-3 bg-emerald-500/20" />
                        <Wifi className="w-3 h-3 text-emerald-500" />
                    </div>

                    {/* Clock */}
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/50">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-black tabular-nums text-foreground">{time}</span>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={theme}
                                initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </motion.div>
                        </AnimatePresence>
                    </button>

                    {/* Bell & Notifications Popover */}
                    <div className="relative flex items-center gap-2" ref={notifRef}>
                        {/* Floating attention pill when there are unread notifications */}
                        {!isNotifOpen && unreadCount > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8, x: 5 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => setIsNotifOpen(true)}
                                className={cn(
                                    "hidden sm:flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95",
                                    hasUrgent
                                        ? "bg-red-600 ring-2 ring-red-400/50 shadow-red-500/30 animate-pulse"
                                        : hasImportant
                                            ? "bg-amber-600 ring-2 ring-amber-400/50 shadow-amber-500/30"
                                            : "bg-primary ring-2 ring-primary/30"
                                )}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                {hasUrgent ? '🚨 Urgente' : hasImportant ? '⚠️ Importante' : '📢 Comunicado'}
                            </motion.button>
                        )}

                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className={cn(
                                "w-9 h-9 rounded-xl border flex items-center justify-center transition-all relative",
                                isNotifOpen
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                    : hasUrgent
                                        ? "bg-card border-red-500/60 text-red-600 ring-2 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                        : hasImportant
                                            ? "bg-card border-amber-500/60 text-amber-600 ring-2 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                            : unreadCount > 0
                                                ? "bg-card border-primary/50 text-primary ring-2 ring-primary/30 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                                                : "bg-card border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30"
                            )}
                            title="Comunicados y Notificaciones"
                        >
                            <motion.div
                                animate={
                                    hasUrgent
                                        ? { rotate: [0, -22, 22, -18, 18, -10, 10, 0] }
                                        : hasImportant
                                            ? { rotate: [0, -14, 14, -8, 8, 0] }
                                            : unreadCount > 0
                                                ? { y: [0, -2, 0] }
                                                : {}
                                }
                                transition={{
                                    repeat: Infinity,
                                    repeatDelay: hasUrgent ? 1.5 : hasImportant ? 2.5 : 4,
                                    duration: 0.7,
                                }}
                            >
                                <Bell className={cn("w-4 h-4", hasUrgent ? "text-red-600" : hasImportant ? "text-amber-600" : unreadCount > 0 ? "text-primary" : "")} />
                            </motion.div>

                            {/* Badge counter with radar ping effect */}
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center">
                                    <span className={cn(
                                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                        hasUrgent ? "bg-red-500" : hasImportant ? "bg-amber-500" : "bg-primary"
                                    )} />
                                    <span className={cn(
                                        "relative inline-flex rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] text-white font-black text-[9px] items-center justify-center shadow-md ring-2 ring-background",
                                        hasUrgent ? "bg-red-600" : hasImportant ? "bg-amber-600" : "bg-primary"
                                    )}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                </span>
                            )}
                        </button>

                        {/* Popover Menu */}
                        <AnimatePresence>
                            {isNotifOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 12, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-3 w-80 sm:w-96 bg-card border border-border/80 rounded-3xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl"
                                >
                                    {/* Header */}
                                    <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/30">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                <Bell className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Comunicados</h4>
                                                <p className="text-[10px] font-bold text-muted-foreground">{unreadCount} no leídos</p>
                                            </div>
                                        </div>

                                        {unreadCount > 0 && (
                                            <button
                                                onClick={() => markAsRead()}
                                                className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                                            >
                                                <CheckCheck className="w-3.5 h-3.5" />
                                                Marcar vistos
                                            </button>
                                        )}
                                    </div>

                                    {/* Comunicados List */}
                                    <div className="max-h-80 overflow-y-auto divide-y divide-border/40 custom-scrollbar">
                                        {comunicados.length === 0 ? (
                                            <div className="p-8 text-center text-muted-foreground">
                                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Sin comunicados recientes</p>
                                            </div>
                                        ) : (
                                            comunicados.map(c => {
                                                const isRead = readIds.includes(c.id);
                                                const imp = (c.importancia || 'normal').toUpperCase();
                                                const isUrgent = imp === 'URGENTE';
                                                const isImportante = imp === 'IMPORTANTE';
                                                const isAdminType = c.tipo === 'ADMINISTRATIVO';

                                                return (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => {
                                                            markAsRead(c.id);
                                                            setSelectedNotif(c);
                                                            setIsNotifOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left p-4 flex gap-3 hover:bg-muted/50 transition-all group relative",
                                                            !isRead && "bg-primary/5"
                                                        )}
                                                    >
                                                        {/* Unread indicator dot */}
                                                        {!isRead && (
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                        )}

                                                        {/* Icon badge */}
                                                        <div className={cn(
                                                            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black shadow-sm",
                                                            isUrgent
                                                                ? "bg-red-500/10 text-red-600 border border-red-200 dark:border-red-900/50"
                                                                : isImportante
                                                                    ? "bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-900/50"
                                                                    : isAdminType
                                                                        ? "bg-purple-500/10 text-purple-600 border border-purple-200 dark:border-purple-900/50"
                                                                        : "bg-primary/10 text-primary border border-primary/20"
                                                        )}>
                                                            {isUrgent ? (
                                                                <AlertCircle className="w-4 h-4" />
                                                            ) : isImportante ? (
                                                                <Shield className="w-4 h-4" />
                                                            ) : isAdminType ? (
                                                                <Shield className="w-4 h-4" />
                                                            ) : (
                                                                <Megaphone className="w-4 h-4" />
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                                {/* Importancia badge */}
                                                                <span className={cn(
                                                                    "text-[7px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest",
                                                                    isUrgent
                                                                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                                                        : isImportante
                                                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                                                            : "bg-muted text-muted-foreground"
                                                                )}>
                                                                    {imp}
                                                                </span>
                                                                {/* Tipo badge */}
                                                                <span className={cn(
                                                                    "text-[7px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest",
                                                                    isAdminType
                                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                                                        : "bg-muted text-muted-foreground"
                                                                )}>
                                                                    {c.tipo || 'GENERAL'}
                                                                </span>
                                                                <span className="text-[7px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                                                    {c.tenant ? c.tenant.nombre : 'Global'}
                                                                </span>
                                                            </div>

                                                            <h5 className="text-xs font-black uppercase italic tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                                                {c.nombre}
                                                            </h5>

                                                            <p className="text-[11px] text-muted-foreground font-medium line-clamp-2 mt-0.5 leading-snug">
                                                                {c.descripcion}
                                                            </p>

                                                            <p className="text-[9px] font-bold text-muted-foreground/60 mt-1.5 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="p-3 bg-muted/40 border-t border-border/60 text-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1.5 py-1">
                                            <Bell className="w-3 h-3" /> {comunicados.length} comunicado{comunicados.length !== 1 ? 's' : ''} reciente{comunicados.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Security Badge */}
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
                        <Shield className="w-3 h-3 text-primary" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">Seguro</span>
                    </div>

                    {/* Avatar */}
                    <Link
                        href="/dashboard/mi-ficha"
                        className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20 cursor-pointer hover:bg-primary hover:text-white transition-all overflow-hidden group/avatar ml-1"
                    >
                        {user?.imagen ? (
                            <img
                                src={user.imagen.startsWith('http') ? user.imagen : `${process.env.NEXT_PUBLIC_API_URL}${user.imagen.startsWith('/') ? '' : '/'}${user.imagen}`}
                                alt="Profile"
                                className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform"
                            />
                        ) : (
                            <div className="w-full h-full p-2.5 flex items-center justify-center bg-white dark:bg-card">
                                {profe?.imagen ? (
                                    <img src={IMG(profe.imagen) || undefined} className="w-full h-full object-contain opacity-40 grayscale" alt="Logo" />
                                ) : (
                                    <span className="text-sm font-black text-primary">{user?.nombre?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                        )}
                    </Link>
                </div>
            </header>
            {modalContent}
        </>
    );
}
