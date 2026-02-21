'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User as UserIcon, AlertCircle, CheckCircle, Save, ShieldAlert, Key, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';

export default function ResetPasswordPage() {
    const { user, updateUser } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        password: '',
        confirmPassword: '',
        verificationCode: ''
    });

    const [error, setError] = useState<string | null>(null);
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    const isEmailDifferent = formData.email !== user?.correo;

    useEffect(() => {
        if (!user?.requiresPasswordChange) {
            router.push('/dashboard');
        }
    }, [user, router]);

    // Timer para el reenvío de código
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendVerification = async () => {
        if (!formData.email || !formData.email.includes('@')) {
            toast.error('Ingresa un correo válido antes de verificar');
            return;
        }

        setIsSendingVerification(true);
        try {
            await userService.requestEmailVerification(formData.email);
            toast.success(`Código enviado a ${formData.email}`);
            setCountdown(60); // Bloquear reenvío por 60 segundos
        } catch (err: any) {
            toast.error('Error al enviar el código de verificación');
        } finally {
            setIsSendingVerification(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (!formData.verificationCode) {
            setError('Debes ingresar el código de verificación enviado a tu correo institucional');
            return;
        }

        setIsLoading(true);
        try {
            const updatedProfile = await userService.updateProfile({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                verificationCode: formData.verificationCode
            } as any);

            // Actualizar el contexto de auth y las cookies con el nuevo perfil
            updateUser(updatedProfile);

            toast.success('Perfil actualizado correctamente. Ya puedes acceder al dashboard.');
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.message || 'Error al actualizar el perfil institucional');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user?.requiresPasswordChange) return null;

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Security Alert Header */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 backdrop-blur-xl">
                        <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-500/20">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <div className="text-center md:text-left space-y-1">
                            <h2 className="text-xl font-black uppercase tracking-tight text-amber-600">Acción Requerida: Seguridad</h2>
                            <p className="text-xs font-bold text-amber-700/70 uppercase tracking-widest leading-relaxed">
                                Tu contraseña ha sido reseteada por un administrador. <br />
                                <span className="text-amber-600 font-black italic">Debes actualizar tus credenciales para continuar usando la plataforma.</span>
                            </p>
                        </div>
                    </div>

                    <Card className="border-border/40 bg-card/50 backdrop-blur-2xl shadow-2xl overflow-hidden p-0">
                        <div className="p-8 md:p-12 space-y-10">
                            <div className="space-y-2 text-center md:text-left">
                                <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground">Configurar Identidad</h1>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Personaliza tu acceso al núcleo del sistema PROFE</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-xs font-black flex items-center gap-3"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Link Identity */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                                            <Key className="w-3 h-3" />
                                            <span>Credenciales</span>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Username de Enlace</label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    className="w-full h-12 pl-12 pr-5 rounded-2xl bg-muted/30 border border-border/50 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black"
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Correo Institucional</label>
                                            <div className="relative flex gap-2">
                                                <div className="relative flex-1">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="email"
                                                        className="w-full h-12 pl-12 pr-5 rounded-2xl bg-muted/30 border border-border/50 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        required
                                                    />
                                                </div>

                                                <AnimatePresence>
                                                    {isEmailDifferent && (
                                                        <motion.button
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20 }}
                                                            type="button"
                                                            onClick={handleSendVerification}
                                                            disabled={isSendingVerification || countdown > 0}
                                                            className="h-12 px-6 rounded-2xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white disabled:bg-muted disabled:text-muted-foreground transition-all flex items-center gap-2 whitespace-nowrap"
                                                        >
                                                            {isSendingVerification ? (
                                                                <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                            ) : countdown > 0 ? (
                                                                `${countdown}s`
                                                            ) : (
                                                                'Verificar Correo'
                                                            )}
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 group bg-primary/5 p-4 rounded-3xl border border-primary/10">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Código de Verificación (Enviado al correo)</label>
                                            <div className="relative">
                                                <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Ej: 123456"
                                                    className="w-full h-12 pl-12 pr-5 rounded-2xl bg-white border border-primary/20 focus:border-primary focus:ring-8 focus:ring-primary/10 transition-all outline-none text-[13px] font-black text-primary tracking-[0.2em]"
                                                    value={formData.verificationCode}
                                                    onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Update */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                                            <Lock className="w-3 h-3" />
                                            <span>Nueva Contraseña</span>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nueva Clave Maestra</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="w-full h-12 pl-12 pr-12 rounded-2xl bg-muted/30 border border-border/50 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black"
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirmar Clave</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="w-full h-12 pl-12 pr-12 rounded-2xl bg-muted/30 border border-border/50 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black"
                                                    placeholder="••••••••"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sincronizando...
                                        </div>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Sincronizar nuevas credenciales
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        <div className="bg-muted/30 p-4 text-center border-t border-border/40">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                Esta acción es requerida para garantizar la integridad institucional de tu cuenta.
                            </p>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
