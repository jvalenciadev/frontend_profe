'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User as UserIcon, Lock, AlertCircle, Building2, TrendingUp, Mail, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useProfe } from '@/contexts/ProfeContext';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const { config: profe } = useProfe();

    const IMG = (src: string | null) => {
        if (!src) return null;
        return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    };
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // Para reset
    const [email, setEmail] = useState(''); // Estado para recuperación
    const [token, setToken] = useState(''); // El código de 6 dígitos
    const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login'); // Control de vista
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    if (isAuthenticated) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const authResponse = await authService.login({ username, password });
            const userProfile = await authService.getProfile(authResponse.access_token);
            login(authResponse.access_token, userProfile);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Credenciales inválidas o error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);
        try {
            await authService.forgotPassword(email);
            setSuccess('Se ha enviado un código de 6 dígitos a su correo institucional.');
            setView('reset');
        } catch (err: any) {
            // Por seguridad, a veces es mejor no decir si falló por email no encontrado, pero aquí mostraremos error genérico o del backend
            setError(err.response?.data?.message || 'Error al procesar la solicitud.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (token.length < 6) {
            setError('El código debe ser de 6 dígitos');
            return;
        }

        setIsLoading(true);
        try {
            await authService.resetPassword(token, password);
            setSuccess('Contraseña actualizada correctamente. Ya puede iniciar sesión.');
            setView('login');
            setPassword('');
            setConfirmPassword('');
            setToken('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Código inválido o expirado.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background selection:bg-primary selection:text-white" suppressHydrationWarning={true}>
            {/* Left Panel - High Performance Institutional Visual */}
            <div className="hidden lg:flex lg:w-3/5 bg-slate-950 relative overflow-hidden items-center justify-center p-32" suppressHydrationWarning={true}>
                {/* Dynamic Background & National Seal */}
                <div className="absolute inset-0 pointer-events-none" suppressHydrationWarning={true}>
                    <div className="absolute top-0 left-0 w-full h-3 flex">
                        <div className="flex-1 bg-[#E12C21]" />
                        <div className="flex-1 bg-[#F9E11E]" />
                        <div className="flex-1 bg-[#009246]" />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.minedu.gob.bo/templates/images/escudo.png')] bg-no-repeat bg-center opacity-[0.05] scale-150" />
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.15, 0.1],
                        }}
                        transition={{ duration: 15, repeat: Infinity }}
                        className="absolute -top-[10%] -right-[10%] w-[80%] h-[80%] bg-primary-600 rounded-full blur-[150px]"
                        suppressHydrationWarning={true}
                    />
                </div>

                <div className="relative z-10 w-full max-w-2xl space-y-16" suppressHydrationWarning={true}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-10"
                        suppressHydrationWarning={true}
                    >
                        <div className="inline-flex items-center gap-4 px-8 py-3 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.5em]" suppressHydrationWarning={true}>
                            <ShieldCheck className="w-4 h-4 text-primary-600" /> Acceso de Grado Gubernamental
                        </div>

                        <h1 className="text-8xl font-black text-white tracking-tighter leading-[0.8] uppercase" suppressHydrationWarning={true}>
                            Sistema <br />
                            <span className="text-primary-600">Nacional.</span>
                        </h1>

                        <p className="text-2xl text-white/50 font-medium leading-relaxed max-w-xl border-l-[3px] border-primary-600 pl-8 py-2" suppressHydrationWarning={true}>
                            Plataforma centralizada para la gestión de la formación especializada.
                        </p>
                    </motion.div>


                </div>

                {/* Branding Footer */}
                <div className="absolute bottom-16 left-32 flex items-center gap-6" suppressHydrationWarning={true}>
                    <img src="/logo-principal.png" alt="Minedu" className="h-10 w-auto opacity-40 grayscale brightness-[10]" />
                    <div className="w-px h-8 bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Estado Plurinacional de Bolivia</span>
                </div>
            </div>

            {/* Right Panel - Access Form */}
            <div className="w-full lg:w-2/5 flex items-center justify-center p-12 bg-card relative" suppressHydrationWarning={true}>
                <div className="w-full max-w-sm space-y-10" suppressHydrationWarning={true}>
                    {/* Logo Context */}
                    <div className="space-y-4" suppressHydrationWarning={true}>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 bg-white dark:bg-card rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 mx-auto lg:mx-0 overflow-hidden border border-border/50"
                            suppressHydrationWarning={true}
                        >
                            {mounted && profe?.imagen ? (
                                <img src={IMG(profe.imagen) || undefined} className="w-10 h-10 object-contain" alt="Logo" />
                            ) : (
                                <span className="text-primary font-black text-3xl">P</span>
                            )}
                        </motion.div>
                        <div className="text-center lg:text-left" suppressHydrationWarning={true}>
                            <h3 className="text-3xl font-black tracking-tighter">
                                {view === 'login' ? 'Acceso Institucional' : view === 'forgot' ? 'Recuperar Acceso' : 'Verificar Código'}
                            </h3>
                            <p className="text-muted-foreground font-medium text-sm">
                                {view === 'login'
                                    ? 'Bienvenido al sistema nacional de gestión.'
                                    : view === 'forgot'
                                        ? 'Ingresa tu correo institucional para recibir un código de recuperación.'
                                        : 'Ingresa el código de 6 dígitos enviado a tu correo y tu nueva contraseña.'}
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

                    <AnimatePresence mode="wait">
                        {view === 'login' ? (
                            <motion.form
                                key="login-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                                suppressHydrationWarning={true}
                            >
                                <div className="space-y-5" suppressHydrationWarning={true}>
                                    <div className="space-y-2" suppressHydrationWarning={true}>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Identificador</label>
                                        <div className="relative group" suppressHydrationWarning={true}>
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                                            <Input
                                                className="pl-12 h-14 bg-accent/20 border-transparent focus:bg-background focus:ring-primary/5 focus:border-primary/30 rounded-2xl transition-all"
                                                placeholder="Usuario"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2" suppressHydrationWarning={true}>
                                        <div className="flex justify-between items-center px-1" suppressHydrationWarning={true}>
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Clave Maestra</label>
                                            <button
                                                type="button"
                                                onClick={() => { setView('forgot'); setError(null); setSuccess(null); }}
                                                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                            >
                                                ¿Olvidaste tu contraseña?
                                            </button>
                                        </div>
                                        <div className="relative group" suppressHydrationWarning={true}>
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                className="pl-12 pr-12 h-14 bg-accent/20 border-transparent focus:bg-background focus:ring-primary/5 focus:border-primary/30 rounded-2xl transition-all"
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/20 rounded-2xl active:scale-[0.98] transition-all"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Verificando...
                                        </div>
                                    ) : (
                                        'Entrar al Sistema'
                                    )}
                                </Button>

                                <div className="text-center pt-2" suppressHydrationWarning>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                                        ¿Quieres ser parte del Programa - PROFE?
                                        <Link href="/registro-profe" className="text-primary font-black ml-2 hover:underline">Registra tu perfil aquí</Link>
                                    </p>
                                </div>
                            </motion.form>
                        ) : view === 'forgot' ? (
                            <motion.form
                                key="forgot-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleForgotSubmit}
                                className="space-y-6"
                                suppressHydrationWarning={true}
                            >
                                <div className="space-y-5" suppressHydrationWarning={true}>
                                    <div className="space-y-2" suppressHydrationWarning={true}>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Correo Institucional</label>
                                        <div className="relative group" suppressHydrationWarning={true}>
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                                            <Input
                                                type="email"
                                                className="pl-12 h-14 bg-accent/20 border-transparent focus:bg-background focus:ring-primary/5 focus:border-primary/30 rounded-2xl transition-all"
                                                placeholder="ejemplo@profe.bo"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/20 rounded-2xl active:scale-[0.98] transition-all"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Enviando...
                                        </div>
                                    ) : (
                                        'Enviar Código'
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => { setView('login'); setError(null); setSuccess(null); }}
                                    className="w-full flex items-center justify-center gap-2 text-[11px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors py-2"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    Volver al Acceso
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="reset-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleResetSubmit}
                                className="space-y-6"
                                suppressHydrationWarning={true}
                            >
                                <div className="space-y-4" suppressHydrationWarning={true}>
                                    <div className="space-y-2" suppressHydrationWarning={true}>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Código de 6 dígitos</label>
                                        <div className="relative group" suppressHydrationWarning={true}>
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                                            <Input
                                                className="pl-12 h-14 bg-accent/20 border-transparent focus:bg-background focus:ring-primary/5 focus:border-primary/30 rounded-2xl transition-all font-black tracking-[1em] text-center"
                                                placeholder="000000"
                                                maxLength={6}
                                                value={token}
                                                onChange={(e) => setToken(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2" suppressHydrationWarning={true}>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                        <div className="relative group" suppressHydrationWarning={true}>
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                className="pl-12 pr-12 h-14 bg-accent/20 border-transparent focus:bg-background focus:ring-primary/5 focus:border-primary/30 rounded-2xl transition-all"
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2" suppressHydrationWarning={true}>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                                        <div className="relative group" suppressHydrationWarning={true}>
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                className="pl-12 pr-12 h-14 bg-accent/20 border-transparent focus:bg-background focus:ring-primary/5 focus:border-primary/30 rounded-2xl transition-all"
                                                placeholder="••••••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/20 rounded-2xl active:scale-[0.98] transition-all"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Verificando...
                                        </div>
                                    ) : (
                                        'Actualizar Contraseña'
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => { setView('forgot'); setError(null); setSuccess(null); }}
                                    className="w-full flex items-center justify-center gap-2 text-[11px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors py-2"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    No recibí el código
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="pt-8 text-center border-t border-border/40" suppressHydrationWarning={true}>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]" suppressHydrationWarning>
                            Seguridad de Grado Institucional <br />
                            <span className="text-foreground uppercase tracking-[0.1em]">Ministerio de Educación © {mounted ? new Date().getFullYear() : '2026'} PROFE Bolivia</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
