'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { aulaService } from '@/services/aulaService';
import { LogoAula } from '@/components/aula/LogoAula';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap,
    User as UserIcon,
    Lock,
    AlertCircle,
    Sparkles,
    ArrowRight,
    BookOpen,
    Eye,
    EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function AulaLoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isAuthenticated) {
            router.push('/aula');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await aulaService.login({ username, password });
            // El login del AuthContext (ahora con namespace 'aula') se encarga de las cookies
            login(response.access_token, response.user);
            toast.success('¡Bienvenido a Aula Profe!');
            router.push('/aula');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al conectar con Aula Profe';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div
            suppressHydrationWarning
            className="fixed inset-0 bg-slate-50 flex overflow-hidden selection:bg-[var(--aula-primary)]/30"
        >
            {/* ── HIGH-FIDELITY BACKGROUND ── */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Dynamic Gradient Orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--aula-primary)]/10 blur-[150px] rounded-full mix-blend-screen"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        x: [0, -40, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full mix-blend-screen"
                />

                {/* Studio Mesh Texture */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="relative z-10 w-full flex flex-col lg:flex-row">

                {/* ── LEFT PANEL (BRANDING STUDIO) ── */}
                <div
                    suppressHydrationWarning
                    className="hidden lg:flex w-1/2 lg:w-[55%] flex-col justify-between p-16 lg:p-24 relative overflow-hidden"
                >
                    {/* Creative Glass Base */}
                    <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl" />
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className="relative z-10 space-y-12"
                    >
                        {/* Logos with Shadow Depth */}
                        <div className="flex items-center gap-10">
                            <LogoAula size="lg" />
                        </div>

                        <div className="pt-20 space-y-8 max-w-2xl">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border border-[var(--aula-primary)]/10 bg-[var(--aula-primary)]/5 shadow-sm"
                            >
                                <Sparkles className="w-4 h-4 text-[var(--aula-primary)] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aula-primary)]">Plataforma Educativa</span>
                            </motion.div>

                            <h1 className="text-6xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-[-0.05em]">
                                Aula <br />
                                <span style={{ color: 'var(--aula-primary)' }}>
                                    PROFE
                                </span>
                            </h1>

                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-md border-l-2 border-[var(--aula-primary)]/20 pl-6 py-2">
                                Forjando el futuro de la educación digital con herramientas de vanguardia y excelencia académica.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="relative z-10 flex items-center gap-4 text-slate-400 group cursor-default"
                    >
                        <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:border-[var(--aula-primary)]/30 transition-colors">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.4em]">Programa de Formación Especializada</span>
                    </motion.div>
                </div>

                {/* ── RIGHT PANEL (LOGIN FORM) ── */}
                <div
                    suppressHydrationWarning
                    className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 lg:p-20 relative"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                        className="w-full max-w-[420px] space-y-8"
                    >
                        {/* Mobile Branding (only visible on small screens) */}
                        <div className="lg:hidden text-center space-y-6 mb-8 flex flex-col items-center">
                            <LogoAula size="lg" />
                            <div>
                                <p className="text-slate-500 text-sm mt-2">Ingrese sus credenciales de acceso</p>
                            </div>
                        </div>

                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-[40px] border border-white/40 dark:border-slate-800/40 p-8 sm:p-12 rounded-[3.5rem] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:shadow-[0_32px_100px_-20px_rgba(0,0,0,0.15)] transition-all duration-700">
                            {/* Inner Glow Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--aula-primary)]/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-1000" />

                            <div className="relative z-10 space-y-10">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Iniciar Sesión</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="h-px w-8" style={{ backgroundColor: 'var(--aula-primary)' }} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Panel Académico</p>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-5 rounded-3xl text-sm flex items-start gap-4"
                                        >
                                            <AlertCircle className="w-6 h-6 shrink-0" />
                                            <p className="font-bold leading-snug">{error}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSubmit} className="space-y-7">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Usuario / Credencial</label>
                                        <div className="relative group/input">
                                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                                <UserIcon className="w-5 h-5 text-slate-300 group-focus-within/input:text-[var(--aula-primary)] transition-colors duration-300" />
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full h-16 pl-14 pr-6 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-[var(--aula-primary)]/50 focus:ring-8 focus:ring-[var(--aula-primary)]/5 transition-all duration-300 font-bold text-base"
                                                placeholder="Nombre de usuario"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between mx-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Contraseña</label>
                                            <a href="/aula/olvide-password"
                                                style={{ color: 'var(--aula-primary)' }}
                                                className="text-[9px] font-black hover:opacity-80 transition-all uppercase tracking-widest border-b border-[var(--aula-primary)]/20 pb-0.5">
                                                ¿Olvidó su contraseña?
                                            </a>
                                        </div>
                                        <div className="relative group/input">
                                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                                <Lock className="w-5 h-5 text-slate-300 group-focus-within/input:text-[var(--aula-primary)] transition-colors duration-300" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="w-full h-16 pl-14 pr-14 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-[var(--aula-primary)]/50 focus:ring-8 focus:ring-[var(--aula-primary)]/5 transition-all duration-300 font-bold text-base"
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-300 hover:text-[var(--aula-primary)] transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-16 relative group/btn overflow-hidden rounded-[2rem] disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 dark:shadow-none"
                                        >
                                            {/* Final color is handled via class or style but let's stick to consistent primary */}
                                            <div className="absolute inset-0 bg-slate-900 dark:bg-white transition-all duration-500 group-hover:bg-[var(--aula-primary)]" />
                                            <div className="absolute inset-0 flex items-center justify-center gap-3 text-white dark:text-slate-900 group-hover:text-white font-black uppercase tracking-[0.2em] text-[11px] z-10 transition-all duration-500">
                                                {isLoading ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                    />
                                                ) : (
                                                    <>Acceder al Sistema <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-500" /></>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                                ¿Problemas de acceso?
                                <a href="#" style={{ color: 'var(--aula-primary)' }} className="hover:opacity-80 transition-all ml-1 underline underline-offset-4 decoration-[var(--aula-primary)]/20">Soporte Académico</a>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
