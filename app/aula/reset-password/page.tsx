'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User as UserIcon, AlertCircle, CheckCircle, Save, ShieldAlert, Key, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AulaResetPasswordPage() {
    const { user, updateUser } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || user?.correo || '',
        password: '',
        confirmPassword: '',
        verificationCode: ''
    });

    const [error, setError] = useState<string | null>(null);
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    const isEmailDifferent = formData.email !== (user?.email || user?.correo);

    useEffect(() => {
        if (!(user as any)?.requiresPasswordChange) {
            router.push('/aula'); // Redirect if password change is not required
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
            setError('Debes ingresar el código de verificación enviado al correo');
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

            // Actualizar el contexto con el perfil que ya no requiere cambio de contraseña
            updateUser(updatedProfile);

            toast.success('¡Perfil actualizado correctamente! Bienvenido.');
            router.push('/aula');
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.message || 'Error al actualizar las credenciales');
        } finally {
            setIsLoading(false);
        }
    };

    if (!(user as any)?.requiresPasswordChange) return null;

    return (
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center p-4 z-50 overflow-y-auto w-full h-full min-h-screen">
            {/* Background blur overlay just in case it's nested */}
            <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-xl z-0" />

            <div className="w-full max-w-4xl relative z-10 py-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Security Alert Header */}
                    <div className="bg-primary-500/10 border border-primary-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 backdrop-blur-xl">
                        <div className="p-4 bg-primary-600 text-white rounded-2xl shadow-xl shadow-primary-500/20">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <div className="text-center md:text-left space-y-1">
                            <h2 className="text-xl font-black uppercase tracking-tight text-primary-700">Acción Requerida de Seguridad</h2>
                            <p className="text-xs font-bold text-primary-700/70 uppercase tracking-widest leading-relaxed">
                                Estas ingresando con una clave generada por sistema. <br />
                                <span className="text-primary-600 font-black italic">Debes configurar una nueva clave permanente para continuar en Aula Profe.</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 to-transparent pointer-events-none" />
                        <div className="p-8 md:p-12 space-y-10 relative z-10">
                            <div className="space-y-6 text-center md:text-left">
                                <img src="/logo_aula.svg" alt="Aula Profe" className="h-14 lg:h-16 object-contain mb-4 mx-auto md:mx-0" />
                                <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">Configurar Credenciales</h1>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Asegura tu cuenta de Aula Profe</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-xs font-black flex items-center gap-3"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Link Identity */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">
                                            <Key className="w-3 h-3" />
                                            <span>Validar Identidad</span>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuario</label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                <input
                                                    type="text"
                                                    className="w-full h-12 pl-12 pr-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none text-[13px] font-black text-slate-900"
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico (Para enviar código)</label>
                                            <div className="relative flex gap-2">
                                                <div className="relative flex-1">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                    <input
                                                        type="email"
                                                        className="w-full h-12 pl-12 pr-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none text-[13px] font-black text-slate-900"
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
                                                            className="h-12 px-6 rounded-2xl bg-primary-100 text-primary-700 text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white disabled:bg-slate-200 disabled:text-slate-500 transition-all flex items-center gap-2 whitespace-nowrap"
                                                        >
                                                            {isSendingVerification ? (
                                                                <div className="w-3 h-3 border-2 border-primary-600/30 border-t-primary-600 disabled:border-t-slate-500 rounded-full animate-spin" />
                                                            ) : countdown > 0 ? (
                                                                `${countdown}s`
                                                            ) : (
                                                                'Verificar'
                                                            )}
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            {isEmailDifferent && <p className="text-[10px] text-orange-500 ml-1 font-bold mt-1">Ha cambiado su correo. Haga clic en Verificar.</p>}
                                        </div>

                                        <div className="space-y-1.5 group bg-primary-50 p-4 rounded-3xl border border-primary-100/50">
                                            <label className="text-[10px] font-black text-primary-700 uppercase tracking-widest ml-1">Código de Verificación</label>
                                            <div className="relative">
                                                <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-600 group-focus-within:text-primary-600 transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Ej: 123456"
                                                    className="w-full h-12 pl-12 pr-5 rounded-2xl bg-white border border-primary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none text-[13px] font-black text-primary-800 tracking-[0.2em]"
                                                    value={formData.verificationCode}
                                                    onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            {!formData.verificationCode && <p className="text-[10px] text-slate-500 italic">Enviado a tu correo.</p>}
                                        </div>
                                    </div>

                                    {/* Security Update */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">
                                            <Lock className="w-3 h-3" />
                                            <span>Nueva Contraseña Permanente</span>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nueva Clave</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="w-full h-12 pl-12 pr-12 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none text-[13px] font-black text-slate-900"
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Clave</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="w-full h-12 pl-12 pr-12 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none text-[13px] font-black text-slate-900"
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
                                    className="w-full h-14 rounded-2xl bg-primary-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:bg-primary-700 hover:shadow-primary-600/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Actualizando...
                                        </div>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Guardar y Continuar
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
