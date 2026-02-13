'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ConfigPanel } from '@/components/config/ConfigPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Infinity as InfinityIcon } from 'lucide-react';
import { GlobalErrorModal } from '@/components/GlobalErrorModal';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading } = useAuth();
    const { isSidebarCollapsed } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative" suppressHydrationWarning>
                {/* Dynamic Ambient Background */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.4, 0.3],
                            rotate: [0, 45, 0]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.2, 0.3, 0.2],
                            rotate: [0, -45, 0]
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-primary/5 blur-[150px] rounded-full"
                    />
                </div>

                {/* Main Content */}
                <div className="relative z-10 flex flex-col items-center">
                    {/* Minimalist Liquid Loader */}
                    <div className="relative mb-12">
                        {/* Outer Glow */}
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
                        />

                        {/* Central Icon Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative w-28 h-28 bg-card border border-border/50 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center shadow-2xl overflow-hidden group"
                        >
                            {/* Animated Background inside the card */}
                            <motion.div
                                animate={{
                                    y: [0, -20, 0],
                                    rotate: 360
                                }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/10 opacity-50"
                            />

                            <motion.div
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="relative z-10"
                            >
                                <InfinityIcon className="w-14 h-14 text-primary" strokeWidth={1.5} />
                            </motion.div>

                            {/* Internal Pulse */}
                            <motion.div
                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                className="absolute inset-0 bg-primary/10 rounded-full"
                            />
                        </motion.div>

                        {/* Orbiting Particles */}
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4 + i, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-20px] pointer-events-none"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
                                    transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full blur-[1px]"
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Sophisticated Text Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-center space-y-6"
                    >
                        <div className="space-y-2">
                            <h3 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-3">
                                <span>Programa</span>
                                <span className="relative">
                                    <span className="relative z-10 text-primary">PROFE</span>
                                    <motion.span
                                        animate={{ height: ['0%', '30%', '0%'] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="absolute bottom-1 left-0 right-0 bg-primary/20 -z-0 rounded-full"
                                    />
                                </span>
                            </h3>
                            <div className="flex items-center justify-center gap-2 text-muted-foreground/60">
                                <span className="h-[1px] w-8 bg-border" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Plataforma de Formación</span>
                                <span className="h-[1px] w-8 bg-border" />
                            </div>
                        </div>

                        {/* Minimal Progress Indicator */}
                        <div className="relative w-48 h-1 bg-muted rounded-full overflow-hidden mx-auto">
                            <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
                            />
                        </div>

                        <motion.p
                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-[9px] font-medium uppercase tracking-[0.8em] text-primary"
                        >
                            Cargando Ecosistema
                        </motion.p>
                    </motion.div>
                </div>

                {/* Aesthetic Detail: Grainy Overlay */}
                <div className="absolute inset-0 bg-repeat opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-background flex selection:bg-primary selection:text-white" suppressHydrationWarning>
            <Sidebar />

            <div className={cn(
                "flex-1 flex flex-col transition-all duration-500 ease-in-out",
                "pl-0 md:pl-0", // base mobile
                isSidebarCollapsed ? "md:pl-24" : "md:pl-80"
            )} suppressHydrationWarning>
                <Header />

                <main className="flex-1 px-8 py-8 max-w-[1920px] mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>

                <footer className="px-10 py-8 flex items-center justify-between border-t border-border/10 text-muted-foreground/30 mt-auto">
                    <p className="text-[10px] font-bold uppercase tracking-widest">PROFE OS v4.5.0 | Secure Infrastructure</p>
                    <div className="flex items-center gap-6">
                        <span className="text-[9px] font-bold uppercase tracking-widest">Bolivia 2026</span>
                    </div>
                </footer>

                <ConfigPanel />
                <GlobalErrorModal />
            </div>
        </div>
    );
}
