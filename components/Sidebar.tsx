'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAbility } from '@/hooks/useAbility';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageUrl } from '@/lib/utils';
import {
    LayoutDashboard,
    Map,
    GraduationCap,
    Users,
    ShieldCheck,
    ChevronDown,
    LogOut,
    Infinity as InfinityIcon,
    Circle,
    X,
    ChevronLeft,
    ChevronRight,
    Shield,
    Key,
    User as UserIcon,
    LayoutGrid,
    BookOpen,
    Calendar,
    Megaphone,
    Bell,
    ClipboardCheck,
    Settings,
    Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useProfe } from '@/contexts/ProfeContext';

interface MenuItem {
    title: string;
    href: string;
    icon?: React.ElementType;
    permission?: { action: string; subject: string };
    children?: MenuItem[];
    badge?: string;
}

const menuItems: MenuItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
        title: 'Mi Ficha (Banco)',
        href: '/dashboard/mi-ficha',
        icon: UserIcon,
        permission: { action: 'read', subject: 'bp_posgrado' }
    },
    {
        title: 'Territorial',
        href: '/dashboard/territorial',
        icon: Map,
        children: [
            { title: 'Departamentos', href: '/dashboard/territorial/departamentos', permission: { action: 'read', subject: 'Departamento' }, },
            { title: 'Provincias', href: '/dashboard/territorial/provincias', permission: { action: 'read', subject: 'Provincia' }, },
            { title: 'Sedes', href: '/dashboard/territorial/sedes', permission: { action: 'read', subject: 'Sede' }, },
            { title: 'Galerías', href: '/dashboard/territorial/galerias', permission: { action: 'read', subject: 'Galeria' }, },
            { title: 'Distritos', href: '/dashboard/territorial/distritos', permission: { action: 'read', subject: 'Distrito' }, },
            { title: 'Unidades Académicas', href: '/dashboard/territorial/unidades-academicas', permission: { action: 'read', subject: 'UnidadEducativa' }, },
        ],
    },
    {
        title: 'Académico',
        href: '/dashboard/academico',
        icon: GraduationCap,
        permission: { action: 'read', subject: 'Academic' },
        children: [
            { title: 'Programas Maestro', href: '/dashboard/programas-maestro' },
            { title: 'Ofertas Académicas', href: '/dashboard/ofertas-academicas' },
            { title: 'Inscripciones', href: '/dashboard/academico/inscripciones' },
            { title: 'Configuración Académica', href: '/dashboard/academico/configuracion' },
        ],
    },
    {
        title: 'Comunicación',
        href: '/dashboard/comunicacion',
        icon: Megaphone,
        permission: { action: 'read', subject: 'Territorial' },
        children: [
            { title: 'Eventos', href: '/dashboard/eventos', icon: Calendar },
            { title: 'Blogs', href: '/dashboard/blogs', icon: LayoutGrid },
            { title: 'Comunicados', href: '/dashboard/comunicados', icon: Bell },
        ]
    },
    {
        title: 'RRHH',
        href: '/dashboard/rrhh',
        icon: Users,
        permission: { action: 'read', subject: 'RRHH' },
        children: [
            { title: 'Cargos', href: '/dashboard/rrhh/cargos' },
            { title: 'Banco Profesional', href: '/dashboard/rrhh/banco' },
        ],
    },
    {
        title: 'Evaluaciones',
        href: '/dashboard/evaluaciones',
        icon: ClipboardCheck,
        // permission: { action: 'read', subject: 'EvaluacionAdmins' },
        children: [
            {
                title: 'Periodos',
                href: '/dashboard/evaluaciones/periodos',
                permission: { action: 'read', subject: 'EvaluacionPeriodo' }
            },
            {
                title: 'Hoja de Concepto',
                href: '/dashboard/evaluaciones/hoja-concepto',
                permission: { action: 'read', subject: 'EvaluacionPuntaje' }
            },
        ],
    },
    {
        title: 'Administración PROFE',
        href: '/dashboard/profe',
        icon: Shield,
        permission: { action: 'manage', subject: 'all' },
        children: [
            { title: 'Datos Institucionales', href: '/dashboard/profe/configuracion' },
        ],
    },
    {
        title: 'Gestión de Accesos',
        href: '/dashboard/accesos',
        icon: ShieldCheck,

        children: [
            { title: 'Usuarios', href: '/dashboard/usuarios', permission: { action: 'read', subject: 'User' }, },
            { title: 'Roles', href: '/dashboard/roles', permission: { action: 'read', subject: 'Role' }, },
            { title: 'Permisos', href: '/dashboard/permisos', permission: { action: 'read', subject: 'Permission' }, },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { can, isSuperAdmin, logout, user, hasRole } = useAbility();
    const {
        isSidebarCollapsed: isCollapsed,
        setSidebarCollapsed: setIsCollapsed,
        isMobileSidebarOpen: isMobileOpen,
        setMobileSidebarOpen: setIsMobileOpen
    } = useTheme();
    const { config: profe } = useProfe();

    const isPostulante = hasRole('POSTULACION_PROFE');

    const filteredMenuItems = useMemo(() => {
        // Si es SuperAdmin, ve todo
        if (isSuperAdmin) return menuItems;

        // Si es Postulante, SOLO ve Dashboard y Mi Ficha
        if (isPostulante) {
            return menuItems.filter(item =>
                item.href === '/dashboard/mi-ficha'
            );
        }

        // Para otros roles, usamos la lógica de filtrado recursiva
        const filterItems = (items: MenuItem[]): MenuItem[] => {
            return items
                .filter(item => {
                    // Si el ítem tiene un permiso explícito, lo validamos
                    if (item.permission) {
                        return can(item.permission.action, item.permission.subject);
                    }
                    // Si no tiene permiso pero TIENE hijos, se mantiene temporalmente para filtrar sus hijos
                    if (item.children) return true;
                    // Si no tiene permiso ni hijos, es un ítem de nivel superior (como Dashboard) sin protección
                    return true;
                })
                .map(item => ({
                    ...item,
                    children: item.children ? filterItems(item.children) : undefined
                }))
                // SEGUNDA PASADA: Limpiar padres que se quedaron vacíos después del filtro
                .filter(item => {
                    // Si el ítem original tenía hijos pero el filtrado los dejó en 0, lo ocultamos
                    // A menos que sea un ítem que sea válido por sí mismo (como Mi Ficha)
                    const originalItem = menuItems.find(m => m.title === item.title);
                    const hadChildren = originalItem?.children && originalItem.children.length > 0;

                    if (hadChildren && (!item.children || item.children.length === 0)) {
                        return false;
                    }
                    return true;
                });
        };

        return filterItems(menuItems);
    }, [isPostulante, isSuperAdmin, can]);

    const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    // Persist open submenus and handle auto-open active part
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('sidebar-submenus');
        if (stored) {
            try {
                setOpenSubmenus(JSON.parse(stored));
            } catch (e) {
                console.error('Error parsing stored submenus');
            }
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('sidebar-submenus', JSON.stringify(openSubmenus));
        }
    }, [openSubmenus, mounted]);

    // Auto-open submenu for current path on load
    useEffect(() => {
        if (mounted && !isCollapsed) {
            const activeParent = menuItems.find(item =>
                item.children?.some(child => pathname.startsWith(child.href))
            );
            if (activeParent && !openSubmenus.includes(activeParent.title)) {
                setOpenSubmenus(prev => [...prev, activeParent.title]);
            }
        }
    }, [pathname, mounted, isCollapsed]);

    // Close all submenus when collapsing sidebar for a cleaner look
    useEffect(() => {
        if (isCollapsed) setOpenSubmenus([]);
    }, [isCollapsed]);

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    const toggleSubmenu = (title: string) => {
        if (isCollapsed) {
            setIsCollapsed(false);
            setOpenSubmenus([title]);
            return;
        }

        setOpenSubmenus(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title] // Allow multiple open (more creative/flexible) or change to [title] for strict accordion
        );
    };

    const canViewItem = (item: MenuItem): boolean => {
        if (isSuperAdmin) return true;
        if (!item.permission) return true;
        return can(item.permission.action, item.permission.subject);
    };

    const getRoleName = () => {
        const roles = user?.roles || [];
        const firstRole = roles[0];
        if (!firstRole) return 'Especialista';
        if (typeof firstRole === 'string') return firstRole;
        if (firstRole && 'role' in firstRole) return (firstRole as any).role.name || 'Especialista';
        return (firstRole as any).name || 'Especialista';
    };

    const NavContent = () => (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Background Decorative Blur */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[20%] bg-primary/5 blur-[80px] pointer-events-none rounded-full" suppressHydrationWarning />

            {/* Brand Header */}
            <div className="h-20 flex items-center px-5 border-b border-border/40 bg-card/30 backdrop-blur-md sticky top-0 z-20">
                <div className={cn(
                    "flex items-center gap-2.5 transition-all duration-500",
                    isCollapsed && !isMobileOpen && "mx-auto"
                )}>
                    <Link href="/dashboard">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/5 shrink-0 cursor-pointer overflow-hidden border border-border/50"
                        >
                            {profe?.imagen ? (
                                <img
                                    src={(profe.imagen && profe.imagen.startsWith('http')) ? profe.imagen : `${process.env.NEXT_PUBLIC_API_URL}${profe.imagen?.startsWith('/') ? '' : '/'}${profe.imagen}`}
                                    alt="Logo"
                                    className="w-full h-full object-contain p-1.5"
                                />
                            ) : (
                                <img src="/logo.svg" className="w-7 h-7" alt="PROFE" />
                            )}
                        </motion.div>
                    </Link>
                    {(!isCollapsed || isMobileOpen) && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col overflow-hidden"
                        >
                            <span className="text-xl font-black tracking-tighter whitespace-nowrap uppercase leading-none truncate max-w-[180px]">
                                {profe?.nombreAbreviado ? (
                                    <>
                                        {profe.nombreAbreviado.split(' ')[0]} <span className="text-primary">{profe.nombreAbreviado.split(' ').slice(1).join(' ')}</span>
                                    </>
                                ) : profe?.nombre ? (
                                    <>
                                        {profe.nombre.split(' ')[0]} <span className="text-primary">{profe.nombre.split(' ').slice(1).join(' ')}</span>
                                    </>
                                ) : (
                                    <>PROGRAMA <span className="text-primary">PROFE</span></>
                                )}
                            </span>
                            <span className="text-[7px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-0.5 whitespace-nowrap opacity-60">Dirección Nacional</span>
                        </motion.div>
                    )}
                </div>

                {isMobileOpen && (
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden ml-auto p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded-xl transition-colors bg-accent/20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Scrollable Navigation Area */}
            <nav className="flex-1 py-8 px-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent hover:scrollbar-thumb-primary/20 transition-all">
                <LayoutGroup>
                    {filteredMenuItems.map((item) => {
                        const active = isActive(item.href);
                        const hasChildren = item.children && item.children.length > 0;
                        const isOpen = openSubmenus.includes(item.title) || (active && !isCollapsed && !isMobileOpen && openSubmenus.length === 0);

                        return (
                            <div key={item.href} className="relative">
                                {hasChildren ? (
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => toggleSubmenu(item.title)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-300 relative group",
                                                (active || isOpen) ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                                                isCollapsed && !isMobileOpen && "justify-center px-0 shrink-0"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-1.5 rounded-xl transition-colors duration-300",
                                                    active ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]" : "bg-transparent group-hover:bg-accent"
                                                )}>
                                                    {item.icon && <item.icon className={cn("w-4.5 h-4.5", active ? "scale-110" : "group-hover:scale-110 transition-transform")} />}
                                                </div>
                                                {(!isCollapsed || isMobileOpen) && (
                                                    <span className="text-[12px] font-bold tracking-tight">{item.title}</span>
                                                )}
                                            </div>
                                            {(!isCollapsed || isMobileOpen) && (
                                                <div className="flex items-center gap-2">
                                                    {item.badge && (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-primary text-white text-[8px] font-black uppercase tracking-tighter">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    <ChevronDown className={cn(
                                                        "w-4 h-4 transition-transform duration-500 opacity-40",
                                                        isOpen && "rotate-180 opacity-100"
                                                    )} />
                                                </div>
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {(!isCollapsed || isMobileOpen) && isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0, y: -5 }}
                                                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                                                    exit={{ height: 0, opacity: 0, y: -5 }}
                                                    transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                                                    className="overflow-hidden flex flex-col gap-1 ml-4 pl-7 border-l-2 border-primary/10 mt-1"
                                                >
                                                    {item.children!.map((child) => {
                                                        const childActive = pathname === child.href;
                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={() => setIsMobileOpen(false)}
                                                                className={cn(
                                                                    "flex items-center gap-3 py-2.5 px-4 rounded-xl text-[12px] font-bold transition-all relative group/child",
                                                                    childActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                                                                )}
                                                            >
                                                                {childActive && (
                                                                    <motion.div
                                                                        layoutId="activeChild"
                                                                        className="absolute left-[-29px] w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]"
                                                                    />
                                                                )}
                                                                <span className="truncate">{child.title}</span>
                                                                <ChevronRight className={cn(
                                                                    "w-3 h-3 ml-auto opacity-0 -translate-x-2 transition-all group-hover/child:opacity-30 group-hover/child:translate-x-0"
                                                                )} />
                                                            </Link>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsMobileOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group relative",
                                            active
                                                ? "bg-primary text-white shadow-[0_10px_25px_rgba(var(--primary-rgb),0.2)] scale-[1.01]"
                                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                                            isCollapsed && !isMobileOpen && "justify-center px-0 shrink-0"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-1.5 rounded-xl transition-colors duration-300",
                                            active ? "bg-white/20" : "bg-transparent group-hover:bg-accent"
                                        )}>
                                            {item.icon && <item.icon className={cn("w-4.5 h-4.5", active ? "scale-110" : "group-hover:scale-110 transition-transform")} />}
                                        </div>
                                        {(!isCollapsed || isMobileOpen) && (
                                            <span className="text-[12px] font-black tracking-tight uppercase whitespace-nowrap">{item.title}</span>
                                        )}
                                        {active && !isCollapsed && (
                                            <motion.div
                                                layoutId="activeOuter"
                                                className="absolute inset-0 border-2 border-primary/20 rounded-2xl pointer-events-none"
                                            />
                                        )}
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </LayoutGroup>
            </nav>

            {/* User Footer Account & Logout */}
            <div className="p-3 border-t border-border/40 bg-card/50 backdrop-blur-md mt-auto">
                {(!isCollapsed || isMobileOpen) ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all border border-transparent hover:border-border/50 cursor-pointer group/user shadow-sm">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs overflow-hidden border border-primary/10 group-hover/user:border-primary/30 transition-all">
                                {user?.imagen ? (
                                    <img
                                        src={getImageUrl(user.imagen)}
                                        className="w-full h-full object-cover group-hover/user:scale-110 transition-all"
                                        alt="Avatar"
                                    />
                                ) : (
                                    <div className="w-full h-full p-2 flex items-center justify-center bg-white dark:bg-card">
                                        {profe?.imagen ? (
                                            <img src={getImageUrl(profe.imagen)} className="w-full h-full object-contain opacity-40 grayscale" alt="Logo" />
                                        ) : (
                                            <span className="text-sm">{user?.nombre?.charAt(0)}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Link href="/dashboard/mi-ficha" className="flex-1 overflow-hidden">
                                <p className="text-[13px] font-black text-foreground truncate group-hover/user:text-primary transition-colors leading-tight">{user?.nombre}</p>
                                <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] truncate leading-tight mt-0.5">{user?.cargo || getRoleName()}</p>
                            </Link>
                            <Settings className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/user:rotate-90 transition-all group-hover/user:text-primary" />
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all duration-300 text-[9px] font-black uppercase tracking-[0.2em] group"
                        >
                            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            Cerrar Sesión
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/10 overflow-hidden cursor-pointer hover:border-primary/50 transition-all">
                            {user?.imagen ? (
                                <img
                                    src={getImageUrl(user.imagen)}
                                    className="w-full h-full object-cover"
                                    alt="Avatar"
                                />
                            ) : (
                                <div className="w-full h-full p-2 flex items-center justify-center bg-white dark:bg-card text-primary font-black text-xs">
                                    {profe?.imagen ? (
                                        <img src={getImageUrl(profe.imagen)} className="w-full h-full object-contain opacity-40 grayscale" alt="Logo" />
                                    ) : (
                                        <span className="flex items-center justify-center h-full w-full">{user?.nombre?.charAt(0)}</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={logout}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all duration-300"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* High-End Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[240] md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Main Container */}
            <aside
                className={cn(
                    "h-screen fixed top-0 z-[250] bg-card/80 backdrop-blur-xl border-r border-border transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col shadow-2xl overflow-visible",
                    isMobileOpen ? "left-0 w-[280px]" : "-left-[280px] w-[280px]",
                    "md:left-0",
                    isCollapsed ? "md:w-[80px]" : "md:w-[280px]"
                )}
            >
                {mounted && <NavContent />}

                {/* Desktop Dynamic Toggle Tab - Outside overflow-hidden */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        "hidden md:flex absolute -right-4 top-24 w-8 h-12 rounded-r-2xl bg-primary items-center justify-center text-white hover:translate-x-1 transition-all duration-500 shadow-[10px_0_20px_rgba(var(--primary-rgb),0.2)] z-50 group border-y border-r border-white/20",
                        isCollapsed ? "opacity-100" : "opacity-40 hover:opacity-100"
                    )}
                >
                    <div className="flex flex-col items-center gap-0.5">
                        <div className="w-1 h-4 bg-white/20 rounded-full group-hover:bg-white/40 mb-1" />
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </div>
                </button>
            </aside>
        </>
    );
}
