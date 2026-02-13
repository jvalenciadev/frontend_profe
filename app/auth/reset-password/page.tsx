'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, AlertCircle, Building2, TrendingUp, CheckCircle, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if no token
    useEffect(() => {
        if (!token) {
            setError('Token de recuperación no válido o expirado.');
        }
    }, [token]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!token) {
            setError('Token de recuperación no válido.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setIsLoading(true);

        try {
            await authService.resetPassword(token, password);
            setSuccess('Contraseña restablecida correctamente. Redirigiendo al login...');
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al restablecer la contraseña. El token puede haber expirado.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm space-y-10 relative z-10" suppressHydrationWarning={true}>
            {/* Logo Context */}
            <div className="space-y-4" suppressHydrationWarning={true}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-primary rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-primary/30 mx-auto lg:mx-0"
                    suppressHydrationWarning={true}
                >
                    P
                </motion.div>
                <div className="text-center lg:text-left" suppressHydrationWarning={true}>
                    <h3 className="text-3xl font-black tracking-tighter">Nueva Contraseña</h3>
                    <p className="text-muted-foreground font-medium text-sm">
                        Ingresa tu nueva clave maestra para recuperar el acceso.
                    </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-xs font-black flex items-center gap-3"
                        suppressHydrationWarning={true}
                    >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl text-xs font-black flex items-center gap-3"
                        suppressHydrationWarning={true}
                    >
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        {success}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.form
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
                suppressHydrationWarning={true}
            >
                <div className="space-y-5" suppressHydrationWarning={true}>
                    <div className="space-y-2" suppressHydrationWarning={true}>
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nueva Contraseña</label>
                        <div className="relative group" suppressHydrationWarning={true}>
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                            <Input
                                type="password"
                                className="pl-12 h-14 bg-accent/20 border-transparent focus:bg-background focus:ring-primary/5 focus:border-primary/30 rounded-2xl transition-all"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={!!success || !token}
                            />
                        </div>
                    </div>

                    <div className="space-y-2" suppressHydrationWarning={true}>
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                        <div className="relative group" suppressHydrationWarning={true}>
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                            <Input
                                type="password"
                                className="pl-12 h-14 bg-accent/20 border-transparent focus:bg-background focus:ring-primary/5 focus:border-primary/30 rounded-2xl transition-all"
                                placeholder="••••••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={!!success || !token}
                            />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isLoading || !!success || !token}
                    className="w-full h-14 text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/20 rounded-2xl active:scale-[0.98] transition-all"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-3" suppressHydrationWarning={true}>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" suppressHydrationWarning={true} />
                            Procesando...
                        </div>
                    ) : (
                        'Restablecer Clave'
                    )}
                </Button>

                <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="w-full flex items-center justify-center gap-2 text-[11px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors py-2"
                >
                    <ArrowLeft className="w-3 h-3" />
                    Volver al Login
                </button>
            </motion.form>

            <div className="pt-8 text-center border-t border-border/40" suppressHydrationWarning={true}>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    Seguridad de Grado Institucional <br />
                    <span className="text-foreground">PROFE Bolivia © 2026</span>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex bg-background selection:bg-primary selection:text-white" suppressHydrationWarning={true}>
            {/* Left Panel - High Performance Visual */}
            <div className="hidden lg:flex lg:w-3/5 bg-primary relative overflow-hidden items-center justify-center p-24" suppressHydrationWarning={true}>
                {/* Dynamic Background */}
                <div className="absolute inset-0 pointer-events-none" suppressHydrationWarning={true}>
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.4, 0.3],
                        }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute -top-[20%] -right-[20%] w-[100%] h-[100%] bg-white/10 rounded-full blur-[120px]"
                        suppressHydrationWarning={true}
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.1, 0.2, 0.1],
                        }}
                        transition={{ duration: 15, repeat: Infinity }}
                        className="absolute -bottom-[20%] -left-[20%] w-[80%] h-[80%] bg-black/20 rounded-full blur-[100px]"
                        suppressHydrationWarning={true}
                    />
                </div>

                <div className="relative z-10 w-full max-w-2xl space-y-12" suppressHydrationWarning={true}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                        suppressHydrationWarning={true}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em]" suppressHydrationWarning={true}>
                            <TrendingUp className="w-3 h-3" />
                            Estado Plurinacional de Bolivia
                        </div>

                        <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.9]" suppressHydrationWarning={true}>
                            PROFE <br />
                            <span className="text-white/40">v4.0 Final</span>
                        </h1>

                        <p className="text-2xl text-primary-foreground/80 font-medium leading-relaxed max-w-xl" suppressHydrationWarning={true}>
                            Sistema de Recuperación de Credenciales Segura.
                        </p>
                    </motion.div>

                    {/* Stats Bar */}
                    <div className="flex gap-12 pt-6" suppressHydrationWarning={true}>
                        <div className="space-y-1" suppressHydrationWarning={true}>
                            <p className="text-4xl font-black text-white">99.8%</p>
                            <p className="text-[10px] uppercase tracking-widest font-black text-primary-foreground/50">Eficiencia Operativa</p>
                        </div>
                        <div className="w-px h-12 bg-white/10" suppressHydrationWarning={true} />
                        <div className="space-y-1" suppressHydrationWarning={true}>
                            <p className="text-4xl font-black text-white">AES-256</p>
                            <p className="text-[10px] uppercase tracking-widest font-black text-primary-foreground/50">Cifrado de Datos</p>
                        </div>
                    </div>
                </div>

                {/* Branding Footer */}
                <div className="absolute bottom-12 left-24 flex items-center gap-4 text-white/40 grayscale opacity-60" suppressHydrationWarning={true}>
                    <Building2 className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ministerio de Educación</span>
                </div>
            </div>

            {/* Right Panel - Reset Form */}
            <div className="w-full lg:w-2/5 flex items-center justify-center p-12 bg-card relative" suppressHydrationWarning={true}>
                <Suspense fallback={<div className="text-center text-muted-foreground text-sm font-black uppercase tracking-widest">Cargando formulario...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
