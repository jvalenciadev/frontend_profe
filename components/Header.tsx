'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePathname } from 'next/navigation';
import {
    Bell,
    Search,
    Sparkles,
    Globe,
    Menu,
    User as UserIcon,
    Settings2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Header() {
    const { user } = useAuth();
    const { setMobileSidebarOpen } = useTheme();
    const pathname = usePathname();

    const section = pathname.split('/').pop() || 'Dashboard';
    const displaySection = section.charAt(0).toUpperCase() + section.slice(1);

    return (
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 transition-all duration-300 bg-background/60 backdrop-blur-md border-b border-border/50">
            <div className="flex items-center gap-4 lg:gap-10 flex-1">
                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="md:hidden p-2.5 rounded-xl bg-card border border-border shadow-sm text-muted-foreground hover:text-primary active:scale-95 transition-all"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="hidden sm:flex flex-col">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">Core / {displaySection}</span>
                    </div>
                    <h2 className="text-xl font-black tracking-tighter text-foreground truncate">
                        {displaySection === 'Dashboard' ? 'Operaciones' : displaySection}
                    </h2>
                </div>

                {/* Global Search */}
                <div className="max-w-xs lg:max-w-md w-full relative group hidden sm:block">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full h-10 pl-11 pr-4 rounded-xl bg-muted/30 border border-transparent focus:border-primary/20 focus:bg-background transition-all outline-none text-xs font-medium placeholder:text-muted-foreground/40"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">Operativo</span>
                </div>

                <div className="flex items-center gap-1.5 lg:gap-2">
                    {[
                        { icon: Globe, label: 'Portal' },
                        { icon: Bell, label: 'Mensajes', badge: true },
                        { icon: Settings2, label: 'Ajustes' }
                    ].map((item, i) => (
                        <button
                            key={i}
                            className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all relative group"
                        >
                            <item.icon className="w-4 h-4" />
                            {item.badge && (
                                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background" />
                            )}
                        </button>
                    ))}
                </div>

                <Link
                    href="/dashboard/perfil"
                    className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20 cursor-pointer hover:bg-primary hover:text-white transition-colors overflow-hidden group/avatar"
                >
                    {user?.imagen ? (
                        <img src={user.imagen} alt="Profile" className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform" />
                    ) : (
                        user?.nombre?.charAt(0) || 'U'
                    )}
                </Link>
            </div>
        </header>
    );
}
