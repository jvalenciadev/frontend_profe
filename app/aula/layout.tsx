'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getImageUrl } from '@/lib/utils';
import { GraduationCap, BookOpen, User, LogOut, LayoutDashboard, Trophy, Bell, Search, MoreVertical } from 'lucide-react';

import { AulaProvider, useAula } from '@/contexts/AulaContext';
import { ChevronLeft } from 'lucide-react';
import { AuthProvider } from '@/contexts/AuthContext';
import { useProfe } from '@/contexts/ProfeContext';
import { aulaService } from '../../services/aulaService';
import { LogoAula } from '@/components/aula/LogoAula';
import PushNotificationManager from '@/components/aula/PushNotificationManager';

export default function AulaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider namespace="aula">
            <AulaProvider>
                <AulaContent>{children}</AulaContent>
            </AulaProvider>
        </AuthProvider>
    );
}

function AulaContent({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth();
    const { toggleTheme, theme, isFacilitator } = useAula();
    const { config, isLoading: configLoading } = useProfe();
    const isLoading = authLoading || configLoading;
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const isAuthPage = pathname === '/aula/login' || pathname === '/aula/olvide-password' || pathname === '/aula/reset-password';

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const hasToken = !!Cookies.get('aula_token');

        if (!isLoading) {
            if (!isAuthenticated && !hasToken && pathname !== '/aula/login' && pathname !== '/aula/olvide-password') {
                router.push('/aula/login');
            } else if (isAuthenticated && (user as any)?.requiresPasswordChange && pathname !== '/aula/reset-password') {
                router.push('/aula/reset-password');
            }
        }
    }, [isAuthenticated, isLoading, pathname, router, user]);

    if (!mounted || isLoading) {
        return (
            <div
                suppressHydrationWarning
                className={cn(
                    "min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500",
                    theme === 'dark' ? "bg-slate-950" : "bg-slate-50"
                )}
            >
                <motion.div
                    suppressHydrationWarning
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-8"
                >
                    <div className="relative" suppressHydrationWarning>
                        <div
                            suppressHydrationWarning
                            className="h-24 px-8 rounded-[2rem] flex items-center justify-center bg-white shadow-2xl overflow-hidden"
                        >
                            <LogoAula size="lg" showText={false} />
                        </div>
                        <div className="absolute -inset-4 border-2 border-primary/20 rounded-[2.5rem] animate-[spin_4s_linear_infinite]" suppressHydrationWarning />
                    </div>
                    <div className="text-center space-y-2" suppressHydrationWarning>
                        <h1 suppressHydrationWarning className={cn("text-3xl font-black tracking-tighter", theme === 'dark' ? "text-white" : "text-slate-900")}>
                            Aula <span suppressHydrationWarning className="text-primary">PROFE</span>
                        </h1>
                    </div>
                </motion.div>
            </div>
        );
    }

    const menuItems = [
        {
            icon: LayoutDashboard,
            label: 'Mi Aula',
            href: '/aula'
        },
        ...(isFacilitator ? [{ icon: GraduationCap, label: 'Docencia', href: '/aula/docencia' }] : []),
        { icon: BookOpen, label: 'Mis Cursos', href: '/aula/cursos' },
        { icon: GraduationCap, label: 'Calificaciones', href: '/aula/calificaciones' },
        { icon: Bell, label: 'Notificaciones', href: '/aula/notificaciones' },
        { icon: User, label: 'Perfil', href: '/aula/perfil' },
    ];


    return (
        <div
            suppressHydrationWarning
            className={cn(
                "min-h-screen flex font-outfit transition-colors duration-500 overflow-hidden",
                theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-slate-900"
            )}
        >
            {isAuthenticated && !isAuthPage && <PushNotificationManager />}
            {/* Ultra-Premium Collapsible Sidebar - Hidden on Auth Pages */}
            {!isAuthPage && (
                <motion.aside
                    suppressHydrationWarning
                    initial={false}
                    animate={{
                        width: sidebarCollapsed ? 80 : 280,
                    }}
                    className={cn(
                        "hidden md:flex flex-col h-screen sticky top-0 z-[50] transition-colors duration-500 border-r relative group/sidebar",
                        theme === 'dark' ? "bg-slate-900/80 border-slate-800/60" : "bg-white/80 border-slate-200/60",
                        "backdrop-blur-2xl"
                    )}
                >
                    {/* Toggle Button - Creative Floating Design */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={cn(
                            "absolute -right-3 top-10 w-6 h-6 rounded-full border flex items-center justify-center z-50 transition-all hover:scale-110 shadow-lg cursor-pointer",
                            theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-600"
                        )}
                    >
                        <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }}>
                            <ChevronLeft size={10} />
                        </motion.div>
                    </button>

                    <div className={cn("p-6 mb-4 flex items-center overflow-hidden", sidebarCollapsed ? "justify-center" : "gap-4")}>
                        <LogoAula
                            size={sidebarCollapsed ? "sm" : "md"}
                            showText={!sidebarCollapsed}
                            className="transition-all duration-500"
                        />
                    </div>

                    {/* Navigation Scrollable */}
                    <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto scrollbar-none">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => router.push(item.href)}
                                    title={sidebarCollapsed ? item.label : ""}
                                    className={cn(
                                        "w-full flex items-center rounded-2xl transition-all duration-300 group relative overflow-hidden h-12",
                                        sidebarCollapsed ? "justify-center" : "gap-4 px-4",
                                        isActive
                                            ? "font-black"
                                            : theme === 'dark' ? "text-slate-500 hover:bg-slate-800/40 hover:text-white" : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900"
                                    )}
                                    style={isActive ? {
                                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        color: 'var(--aula-primary)'
                                    } : {}}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill-side"
                                            className="absolute left-0 w-1 h-6 rounded-r-full"
                                            style={{ backgroundColor: 'var(--aula-primary)' }}
                                        />
                                    )}
                                    <item.icon size={20} className={cn(
                                        "transition-all duration-300",
                                        isActive ? "scale-110" : "opacity-60 group-hover:opacity-100 group-hover:scale-110"
                                    )} style={isActive ? { color: 'var(--aula-primary)' } : {}} />
                                    {!sidebarCollapsed && (
                                        <div className="flex-1 flex items-center justify-between overflow-hidden">
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-[11px] font-bold uppercase tracking-widest truncate"
                                            >
                                                {item.label}
                                            </motion.span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Bottom Controls */}
                    <div className={cn("p-4 border-t transition-all duration-500", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
                        <button
                            onClick={toggleTheme}
                            className={cn(
                                "w-full flex items-center h-12 rounded-2xl transition-all mb-4 overflow-hidden",
                                sidebarCollapsed ? "justify-center" : "px-4 gap-4",
                                theme === 'dark' ? "bg-slate-800 text-amber-400" : "bg-slate-50"
                            )}
                            style={theme === 'dark' ? {} : { color: 'var(--aula-primary)' }}
                        >
                            {theme === 'dark' ? <Bell size={18} /> : <div className="w-4 h-4 rounded-full shadow-xl" style={{ backgroundColor: 'var(--aula-primary)' }} />}
                            {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">{theme === 'dark' ? 'Modo Luz' : 'Oscuro'}</span>}
                        </button>

                        <div className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl transition-all mb-4 relative",
                            sidebarCollapsed ? "justify-center" : "bg-slate-100/50 dark:bg-slate-800/40"
                        )}>
                            <div className="w-10 h-10 rounded-xl border-2 border-white dark:border-slate-800 bg-slate-100 overflow-hidden shrink-0 shadow-sm">
                                {user?.imagen ? (
                                    <img src={getImageUrl(user.imagen)} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-white" style={{ backgroundColor: 'var(--aula-primary)' }}>
                                        {user?.nombre?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0">
                                    <p className={cn("text-[10px] font-black truncate leading-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>{user?.nombre}</p>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter truncate">
                                        {typeof user?.roles?.[0] === 'string' ? user?.roles?.[0] : (user?.roles?.[0] as any)?.role?.name || 'Usuario'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => logout()}
                            className={cn(
                                "w-full flex items-center rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all h-12",
                                sidebarCollapsed ? "justify-center" : "px-4 gap-4"
                            )}
                        >
                            <LogOut size={18} />
                            {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Salir</span>}
                        </button>
                    </div>
                </motion.aside>
            )}

            {/* Mobile Navbar Overlay (for smaller screens) - Hidden on Auth Pages */}
            {!isAuthPage && (
                <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100]">
                    <div className={cn(
                        "flex items-center justify-around h-16 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl border transition-colors",
                        theme === 'dark' ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"
                    )}>
                        {menuItems.slice(0, 4).map((item) => (
                            <button key={item.href} onClick={() => router.push(item.href)} className={cn("p-4 transition-transform active:scale-90", pathname === item.href ? "text-[var(--aula-primary)]" : "text-slate-400")}>
                                <item.icon size={20} />
                            </button>
                        ))}
                        <button onClick={() => setMobileOpen(!mobileOpen)} className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 h-screen overflow-y-auto relative scrollbar-none">
                {/* Responsive Visual Grains and Accents */}
                <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] pointer-events-none rounded-full" />
                <div className="fixed bottom-0 left-0 w-[600px] h-[600px] blur-[120px] pointer-events-none rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--aula-primary), transparent 95%)' }} />
                <div className="p-4 md:p-4 max-w-1xl mx-auto w-full relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
