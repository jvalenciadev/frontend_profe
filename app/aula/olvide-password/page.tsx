'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, Sparkles, ArrowRight, BookOpen, Key, ChevronLeft, Lock, CheckCircle, Eye, EyeOff, Save } from 'lucide-react';
import { toast } from 'sonner';
import { publicService } from '@/services/publicService';

export default function AulaOlvidePasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Step 2 variables
    const [step, setStep] = useState<1 | 2>(1);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleRequestCode = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !email.includes('@')) {
            setError('Por favor, ingrese un correo válido.');
            return;
        }

        setIsLoading(true);

        try {
            await publicService.sendVerificationCode(email, 'Usuario');
            toast.success('Se ha enviado un código de verificación de 6 dígitos a su correo.');
            setStep(2);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al conectar con el servidor';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!code || code.length < 6) {
            setError('Ingrese el código de verificación completo enviado a su correo.');
            return;
        }

        if (password.length < 6) {
            setError('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);

        try {
            await publicService.resetPasswordWithCode(email, code, password);
            toast.success('¡Contraseña restablecida con éxito! Ahora puede iniciar sesión.');
            router.push('/aula/login');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al restablecer contraseña o código expirado';
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

            <div
                suppressHydrationWarning
                className="relative z-10 w-full flex flex-col lg:flex-row"
            >

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
                            <motion.div whileHover={{ y: -5 }} className="relative">
                                <img src="/logo-principal.png" alt="PROFE" className="h-20 xl:h-24 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)]" />
                            </motion.div>
                            <div className="w-px h-16 bg-slate-200 dark:bg-slate-700 mx-2" />
                            <img src="/logo.svg" alt="Minedu" className="h-10 xl:h-12 object-contain" />
                        </div>

                        <div className="pt-20 space-y-8 max-w-2xl">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border border-[var(--aula-primary)]/10 bg-[var(--aula-primary)]/5 shadow-sm"
                            >
                                <Key className="w-4 h-4 text-[var(--aula-primary)] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aula-primary)]">Gestión de Seguridad</span>
                            </motion.div>

                            <h1 className="text-6xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-[-0.05em]">
                                Recuperar <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-br from-[var(--aula-primary)] via-[var(--aula-primary)] to-[color-mix(in_srgb,var(--aula-primary)_50%,transparent)]">
                                    Acceso
                                </span>
                            </h1>

                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-md border-l-2 border-[var(--aula-primary)]/20 pl-6 py-2">
                                No se preocupe, el proceso de recuperación es rápido y seguro a través de su correo institucional.
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

                {/* ── RIGHT PANEL (STEPPED FORM) ── */}
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
                        {/* Mobile Branding */}
                        <div className="lg:hidden text-center space-y-6 mb-8">
                            <div className="flex items-center justify-center gap-4">
                                <img src="/logo-principal.png" alt="PROFE" className="h-12 object-contain" />
                                <div className="w-px h-10 bg-slate-300" />
                                <img src="/logo.svg" alt="Minedu" className="h-5 object-contain" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Recuperar <span style={{ color: 'var(--aula-primary)' }}>Clave</span></h1>
                            </div>
                        </div>

                        <div
                            suppressHydrationWarning
                            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-[40px] border border-white/40 dark:border-slate-800/40 p-8 sm:p-12 rounded-[3.5rem] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden group"
                        >
                            {/* Inner Glow Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--aula-primary)]/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-1000" />

                            <button
                                onClick={() => step === 2 ? setStep(1) : router.push('/aula/login')}
                                className="absolute top-8 left-8 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[var(--aula-primary)] transition-all z-20 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>

                            <div className="relative z-10 space-y-10 mt-6">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {step === 1 ? '¿Olvidó su clave?' : 'Nueva Clave'}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="h-px w-8" style={{ backgroundColor: 'var(--aula-primary)' }} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                            {step === 1 ? 'Paso 1: Identificación' : 'Paso 2: Restablecer'}
                                        </p>
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

                                {step === 1 ? (
                                    <motion.form
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={handleRequestCode}
                                        className="space-y-8"
                                    >
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Correo Electrónico</label>
                                            <div className="relative group/input">
                                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                                    <Mail className="w-5 h-5 text-slate-300 group-focus-within/input:text-[var(--aula-primary)] transition-colors duration-300" />
                                                </div>
                                                <input
                                                    type="email"
                                                    className="w-full h-16 pl-14 pr-6 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-[var(--aula-primary)]/50 focus:ring-8 focus:ring-[var(--aula-primary)]/5 transition-all duration-300 font-bold text-base"
                                                    placeholder="su@correo.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-16 relative group/btn overflow-hidden rounded-[2rem] disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 dark:shadow-none"
                                        >
                                            <div className="absolute inset-0 bg-slate-900 dark:bg-white transition-all duration-500 group-hover:bg-[var(--aula-primary)]" />
                                            <div className="absolute inset-0 flex items-center justify-center gap-3 text-white dark:text-slate-900 group-hover:text-white font-black uppercase tracking-[0.2em] text-[11px] z-10 transition-all duration-500">
                                                {isLoading ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                                                ) : (
                                                    <>Enviar Código <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-500" /></>
                                                )}
                                            </div>
                                        </button>
                                    </motion.form>
                                ) : (
                                    <motion.form
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onSubmit={handleResetPassword}
                                        className="space-y-7"
                                    >
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Código de Verificación</label>
                                            <div className="relative group/input">
                                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                                    <CheckCircle className="w-5 h-5 text-slate-300 group-focus-within/input:text-[var(--aula-primary)] transition-colors duration-300" />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="w-full h-16 pl-14 pr-6 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-3xl text-[var(--aula-primary)] dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-[var(--aula-primary)]/50 focus:ring-8 focus:ring-[var(--aula-primary)]/5 transition-all duration-300 font-black text-xl tracking-[0.5em] text-center"
                                                    placeholder="000000"
                                                    value={code}
                                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Nueva Contraseña</label>
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

                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Confirmar Contraseña</label>
                                            <div className="relative group/input">
                                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                                    <Lock className="w-5 h-5 text-slate-300 group-focus-within/input:text-[var(--aula-primary)] transition-colors duration-300" />
                                                </div>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="w-full h-16 pl-14 pr-6 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-[var(--aula-primary)]/50 focus:ring-8 focus:ring-[var(--aula-primary)]/5 transition-all duration-300 font-bold text-base"
                                                    placeholder="••••••••••••"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-16 relative group/btn overflow-hidden rounded-[2rem] disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 dark:shadow-none"
                                        >
                                            <div className="absolute inset-0 bg-slate-900 dark:bg-white transition-all duration-500 group-hover:bg-[var(--aula-primary)]" />
                                            <div className="absolute inset-0 flex items-center justify-center gap-3 text-white dark:text-slate-900 group-hover:text-white font-black uppercase tracking-[0.2em] text-[11px] z-10 transition-all duration-500">
                                                {isLoading ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                                                ) : (
                                                    <>Restablecer Clave <Save size={16} className="group-hover:scale-110 transition-transform duration-500" /></>
                                                )}
                                            </div>
                                        </button>
                                    </motion.form>
                                )}
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                ¿Recordó su clave?
                                <button onClick={() => router.push('/aula/login')} style={{ color: 'var(--aula-primary)' }} className="hover:opacity-80 transition-all ml-1 underline underline-offset-4 decoration-[var(--aula-primary)]/20">Iniciar Sesión</button>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
