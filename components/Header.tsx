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
    Building2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProfe } from '@/contexts/ProfeContext';
import { useState, useEffect, useRef } from 'react';
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
    const [comunicados, setComunicados] = useState<Comunicado[]>([]);
    const [readIds, setReadIds] = useState<string[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);
    const time = useClock();

    useEffect(() => {
        try {
            const saved = localStorage.getItem('comunicados_read_ids');
            if (saved) setReadIds(JSON.parse(saved));
        } catch (e) {}

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
            try { localStorage.setItem('comunicados_read_ids', JSON.stringify(allIds)); } catch (e) {}
        } else if (!readIds.includes(id)) {
            const updated = [...readIds, id];
            setReadIds(updated);
            try { localStorage.setItem('comunicados_read_ids', JSON.stringify(updated)); } catch (e) {}
        }
    };

    const unreadCount = comunicados.filter(c => !readIds.includes(c.id)).length;

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

    return (
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
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={cn(
                            "w-9 h-9 rounded-xl border flex items-center justify-center transition-all relative",
                            isNotifOpen
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                : "bg-card border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30"
                        )}
                        title="Comunicados y Notificaciones"
                    >
                        <Bell className={cn("w-4 h-4", unreadCount > 0 && "animate-bounce")} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-red-600 text-white font-black text-[9px] rounded-full flex items-center justify-center ring-2 ring-background shadow-md">
                                {unreadCount > 9 ? '9+' : unreadCount}
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
                                            const isUrgent = c.importancia === 'urgente';
                                            const isAdminType = c.tipo === 'ADMINISTRATIVO';

                                            return (
                                                <Link
                                                    key={c.id}
                                                    href="/dashboard/comunicados"
                                                    onClick={() => {
                                                        markAsRead(c.id);
                                                        setIsNotifOpen(false);
                                                    }}
                                                    className={cn(
                                                        "p-4 flex gap-3 hover:bg-muted/50 transition-all group relative",
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
                                                        isAdminType
                                                            ? "bg-purple-500/10 text-purple-600 border border-purple-200 dark:border-purple-900/50"
                                                            : isUrgent
                                                                ? "bg-red-500/10 text-red-600 border border-red-200 dark:border-red-900/50"
                                                                : "bg-primary/10 text-primary border border-primary/20"
                                                    )}>
                                                        {isAdminType ? (
                                                            <Shield className="w-4 h-4" />
                                                        ) : isUrgent ? (
                                                            <AlertCircle className="w-4 h-4" />
                                                        ) : (
                                                            <Megaphone className="w-4 h-4" />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                            <span className={cn(
                                                                "text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider",
                                                                isAdminType
                                                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                                                    : "bg-muted text-muted-foreground"
                                                            )}>
                                                                {c.tipo || 'GENERAL'}
                                                            </span>
                                                            <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
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
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-3 bg-muted/40 border-t border-border/60 text-center">
                                    <Link
                                        href="/dashboard/comunicados"
                                        onClick={() => setIsNotifOpen(false)}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center justify-center gap-1.5 py-1"
                                    >
                                        Ver todos los comunicados <ChevronRight className="w-3 h-3" />
                                    </Link>
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
    );
}
