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
    Shield
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProfe } from '@/contexts/ProfeContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const time = useClock();

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

                {/* Bell */}
                <button className="w-9 h-9 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background animate-pulse" />
                </button>

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
