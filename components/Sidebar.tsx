'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAbility } from '@/hooks/useAbility';
import { useTheme } from '@/contexts/ThemeContext';
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
    Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
    title: string;
    href: string;
    icon?: React.ElementType;
    permission?: { action: string; subject: string };
    children?: MenuItem[];
}

const menuItems: MenuItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
        title: 'Territorial',
        href: '/dashboard/territorial',
        icon: Map,
        permission: { action: 'read', subject: 'Territorial' },
        children: [
            { title: 'Departamentos', href: '/dashboard/territorial/departamentos' },
            { title: 'Provincias', href: '/dashboard/territorial/provincias' },
            { title: 'Sedes', href: '/dashboard/territorial/sedes' },
            { title: 'Galerías', href: '/dashboard/territorial/galerias' },
            { title: 'Distritos', href: '/dashboard/territorial/distritos' },
            { title: 'Unidades Académicas', href: '/dashboard/territorial/unidades-academicas' },
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
        children: [
            { title: 'Eventos', href: '/dashboard/eventos', icon: Calendar },
            { title: 'Blogs', href: '/dashboard/blogs', icon: LayoutGrid },
            { title: 'Comunicados', href: '/dashboard/comunicados', icon: Bell },
        ]
    },
    {
        title: 'Gestión de Accesos',
        href: '/dashboard/accesos',
        icon: ShieldCheck,
        permission: { action: 'read', subject: 'User' },
        children: [
            { title: 'Usuarios', href: '/dashboard/usuarios' },
            { title: 'Roles', href: '/dashboard/roles' },
            { title: 'Permisos', href: '/dashboard/permisos' },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { can, isSuperAdmin, logout, user } = useAbility();
    const {
        isSidebarCollapsed: isCollapsed,
        setSidebarCollapsed: setIsCollapsed,
        isMobileSidebarOpen: isMobileOpen,
        setMobileSidebarOpen: setIsMobileOpen
    } = useTheme();

    const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

    // Auto-close submenus when collapsing sidebar
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
        } else {
            setOpenSubmenus(prev =>
                prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
            );
        }
    };

    const canViewItem = (item: any): boolean => {
        // Superadmin bypass total
        if (isSuperAdmin) return true;

        // Si no hay permiso definido, el item es público (dashborad base)
        if (!item.permission) return true;

        // Validación dinámica de CASL
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
        <div className="flex flex-col h-full relative">
            {/* Brand Header */}
            <div className="h-24 flex items-center px-6 border-b border-border/40">
                <div className={cn(
                    "flex items-center gap-3 transition-all duration-300",
                    isCollapsed && !isMobileOpen && "mx-auto"
                )}>
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                        <InfinityIcon className="w-6 h-6" />
                    </div>
                    {(!isCollapsed || isMobileOpen) && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col overflow-hidden">
                            <span className="text-xl font-black tracking-tighter whitespace-nowrap">PROFE <span className="text-primary">OS</span></span>
                            <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-muted-foreground -mt-1 whitespace-nowrap">Management</span>
                        </motion.div>
                    )}
                </div>

                {/* Mobile Close Button */}
                {isMobileOpen && (
                    <button onClick={() => setIsMobileOpen(false)} className="md:hidden ml-auto p-2 text-muted-foreground hover:bg-accent rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Main Nav */}
            <nav className="flex-1 py-8 px-4 space-y-1.5 overflow-y-auto scrollbar-none">
                {menuItems.map((item) => {
                    if (!canViewItem(item)) return null;

                    const active = isActive(item.href);
                    const hasChildren = item.children && item.children.length > 0;
                    const isOpen = openSubmenus.includes(item.title) || (active && !isCollapsed && !isMobileOpen);

                    return (
                        <div key={item.href} className="space-y-1">
                            {hasChildren ? (
                                <>
                                    <button
                                        onClick={() => toggleSubmenu(item.title)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3.5 rounded-xl transition-all group",
                                            active || isOpen ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                                            isCollapsed && !isMobileOpen && "justify-center px-0"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            {item.icon && <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active && "text-primary")} />}
                                            {(!isCollapsed || isMobileOpen) && <span className="text-[13px] font-semibold tracking-tight">{item.title}</span>}
                                        </div>
                                        {(!isCollapsed || isMobileOpen) && (
                                            <ChevronDown className={cn("w-4 h-4 transition-transform duration-300 opacity-40", isOpen && "rotate-180")} />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {(!isCollapsed || isMobileOpen) && isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden pl-11 space-y-1 mt-1"
                                            >
                                                {item.children!.map((child) => {
                                                    const childActive = pathname === child.href;
                                                    return (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            onClick={() => setIsMobileOpen(false)}
                                                            className={cn(
                                                                "flex items-center gap-4 py-2.5 px-4 rounded-lg text-xs font-medium transition-all relative",
                                                                childActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute left-0 w-1 h-3 rounded-full transition-all",
                                                                childActive ? "bg-primary scale-110" : "bg-transparent"
                                                            )} />
                                                            {child.title}
                                                        </Link>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            ) : (
                                <Link
                                    href={item.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 p-3.5 rounded-xl transition-all group",
                                        active ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                                        isCollapsed && !isMobileOpen && "justify-center px-0"
                                    )}
                                >
                                    {item.icon && <item.icon className="w-5 h-5" />}
                                    {(!isCollapsed || isMobileOpen) && <span className="text-[13px] font-semibold tracking-tight">{item.title}</span>}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* User Actions */}
            <div className="p-4 border-t border-border mt-auto">
                {(!isCollapsed || isMobileOpen) ? (
                    <div className="bg-accent/40 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                {user?.nombre?.charAt(0)}
                            </div>
                            <Link href="/dashboard/perfil" className="flex-1 overflow-hidden group/user">
                                <p className="text-sm font-bold text-foreground truncate leading-none mb-1 group-hover/user:text-primary transition-colors">{user?.nombre}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{getRoleName()}</p>
                            </Link>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-background border border-border text-muted-foreground hover:bg-destructive hover:text-white transition-all text-[11px] font-bold uppercase tracking-widest shadow-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={logout}
                        className="w-12 h-12 mx-auto flex items-center justify-center rounded-xl bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Desktop Floating Toggle (Floating Pill on the edge) */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                    "hidden md:flex absolute -right-4 top-24 w-8 h-8 rounded-full bg-background border border-border items-center justify-center text-muted-foreground hover:text-primary hover:scale-110 shadow-lg z-50 transition-all duration-300",
                    isCollapsed ? "rotate-0" : "rotate-0"
                )}
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
        </div>
    );

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[240] md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "h-screen fixed top-0 z-[250] bg-card border-r border-border transition-all duration-500 ease-in-out flex flex-col",
                    // Mobile positions
                    isMobileOpen ? "left-0 w-80" : "-left-80 w-80",
                    // Desktop positions
                    "md:left-0",
                    isCollapsed ? "md:w-24" : "md:w-80"
                )}
            >
                <NavContent />
            </aside>
        </>
    );
}
