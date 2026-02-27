'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User as UserIcon, Lock, AlertCircle, Building2, TrendingUp, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
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
    const [email, setEmail] = useState(''); // Estado para recuperación
    const [view, setView] = useState<'login' | 'forgot'>('login'); // Control de vista
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
            setSuccess('Si el correo existe en nuestros registros, recibirás las instrucciones de recuperación.');
        } catch (err: any) {
            // Por seguridad, a veces es mejor no decir si falló por email no encontrado, pero aquí mostraremos error genérico o del backend
            setError(err.response?.data?.message || 'Error al procesar la solicitud.');
        } finally {
            setIsLoading(false);
        }
    };

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
                            Arquitectura de gestión académica líder para la formación especializada.
                            Soberanía tecnológica en cada proceso.
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
                            {profe?.imagen ? (
                                <img src={IMG(profe.imagen) || undefined} className="w-10 h-10 object-contain" alt="Logo" />
                            ) : (
                                <span className="text-primary font-black text-3xl">P</span>
                            )}
                        </motion.div>
                        <div className="text-center lg:text-left" suppressHydrationWarning={true}>
                            <h3 className="text-3xl font-black tracking-tighter">
                                {view === 'login' ? 'Acceso Institucional' : 'Recuperar Acceso'}
                            </h3>
                            <p className="text-muted-foreground font-medium text-sm">
                                {view === 'login'
                                    ? 'Bienvenido al sistema nacional de gestión.'
                                    : 'Ingresa tu correo institucional para restablecer tu contraseña.'}
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
                                                type="password"
                                                className="pl-12 h-14 bg-accent/20 border-transparent focus:bg-background focus:ring-primary/5 focus:border-primary/30 rounded-2xl transition-all"
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
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
                                            Verificando...
                                        </div>
                                    ) : (
                                        'Entrar al Sistema'
                                    )}
                                </Button>

                                <div className="text-center pt-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                                        ¿Quieres postularte?
                                        <Link href="/registro-profe" className="text-primary font-black ml-2 hover:underline">Registra tu perfil aquí</Link>
                                    </p>
                                </div>
                            </motion.form>
                        ) : (
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
                                    disabled={isLoading || !!success}
                                    className="w-full h-14 text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/20 rounded-2xl active:scale-[0.98] transition-all"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Enviando...
                                        </div>
                                    ) : (
                                        'Enviar Instrucciones'
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
                        )}
                    </AnimatePresence>

                    <div className="pt-8 text-center border-t border-border/40" suppressHydrationWarning={true}>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            Seguridad de Grado Institucional <br />
                            <span className="text-foreground uppercase tracking-[0.1em]">Ministerio de Educación © {new Date().getFullYear()} PROFE Bolivia</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
