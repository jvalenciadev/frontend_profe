'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { aulaService } from '@/services/aulaService';
import { useAuth } from '@/contexts/AuthContext';
import { useAula } from '@/contexts/AulaContext';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, QrCode, GraduationCap, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AsistenciaQRPage() {
    return (
        <Suspense fallback={<LoadingContent />}>
            <AsistenciaQRContent />
        </Suspense>
    );
}

function LoadingContent() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
            <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 rounded-full animate-spin" style={{ borderTopColor: 'var(--aula-primary)' }} />
        </div>
    );
}

function AsistenciaQRContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const { theme } = useAula();
    const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'error' | 'already'>('loading');
    const [message, setMessage] = useState('Procesando su registro de asistencia...');

    // Nuevo protocolo: recibe ?token=... (base64url firmado con HMAC)
    const token = searchParams.get('token');

    // Decodificar expiración del token para mostrarla (sin verificar firma en client)
    const getExpiry = (): number | null => {
        if (!token) return null;
        try {
            const raw = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
            const parts = raw.split('|');
            // formato: sesionId|turnoId|sedeId|expiry|sig
            if (parts.length === 5) return parseInt(parts[3], 10);
        } catch { }
        return null;
    };

    const expiry = getExpiry();
    const isClientExpired = expiry !== null && Date.now() > expiry;

    useEffect(() => {
        if (!isAuthenticated) return;

        const processAttendance = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Enlace de asistencia inválido. No se encontró el token QR.');
                return;
            }

            // Validar expiración en cliente (feedback rápido)
            if (isClientExpired) {
                setStatus('expired');
                setMessage('El código QR ha expirado. Solicite uno nuevo al facilitador.');
                return;
            }

            try {
                const result = await aulaService.marcarAsistenciaQR(token);
                if (result.alreadyRegistered) {
                    setStatus('already');
                    setMessage('Tu asistencia ya estaba registrada en esta sesión.');
                    toast.info('Asistencia ya registrada');
                } else {
                    setStatus('success');
                    setMessage('¡Asistencia registrada correctamente!');
                    toast.success('Asistencia confirmada');
                }
            } catch (err: any) {
                const errorMsg = err.response?.data?.message || 'Error al registrar asistencia';
                if (errorMsg.toLowerCase().includes('expir')) {
                    setStatus('expired');
                } else if (errorMsg.toLowerCase().includes('turno') || errorMsg.toLowerCase().includes('inscrito')) {
                    setStatus('error');
                } else {
                    setStatus('error');
                }
                setMessage(errorMsg);
            }
        };

        processAttendance();
    }, [isAuthenticated, token, isClientExpired]);

    // ─── No autenticado ──────────────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] p-12 text-center shadow-2xl space-y-8"
                >
                    <div className="w-20 h-20 bg-amber-500/10 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
                        <QrCode size={40} />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-2xl font-black dark:text-white">Inicie Sesión</h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Debe estar autenticado en la plataforma para registrar su asistencia vía QR.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push(`/aula/login?redirect=${encodeURIComponent(window.location.href)}`)}
                        className="w-full h-16 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                        style={{ backgroundColor: 'var(--aula-primary)', boxShadow: '0 20px 25px -5px var(--aula-primary)33' }}
                    >
                        Iniciar Sesión
                    </button>
                </motion.div>
            </div>
        );
    }

    // ─── Estado visual ───────────────────────────────────────────────────────
    const statusConfig = {
        loading: {
            icon: null,
            color: '',
            title: 'Procesando...',
            bg: ''
        },
        success: {
            icon: CheckCircle2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10 shadow-emerald-500/10',
            title: '¡Logrado!'
        },
        already: {
            icon: CheckCircle2,
            color: 'text-sky-500',
            bg: 'bg-sky-500/10 shadow-sky-500/10',
            title: 'Ya registrado'
        },
        expired: {
            icon: Clock,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10 shadow-amber-500/10',
            title: 'Código expirado'
        },
        error: {
            icon: XCircle,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10 shadow-rose-500/10',
            title: 'Atención'
        },
    };

    const cfg = statusConfig[status];
    const Icon = cfg.icon;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "max-w-md w-full rounded-[3.5rem] p-12 text-center shadow-2xl space-y-10 relative overflow-hidden",
                    theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white"
                )}
            >
                {/* Accent top bar */}
                <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: 'var(--aula-primary)' }} />

                <div className="flex flex-col items-center gap-6">
                    {/* Icon */}
                    {status === 'loading' ? (
                        <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 animate-spin" style={{ borderTopColor: 'var(--aula-primary)' }} />
                    ) : Icon ? (
                        <div className={cn("w-24 h-24 rounded-full flex items-center justify-center shadow-lg", cfg.bg, cfg.color)}>
                            <Icon size={56} />
                        </div>
                    ) : null}

                    {/* Title & message */}
                    <div className="space-y-3">
                        <h2 className={cn("text-3xl font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>
                            {cfg.title}
                        </h2>
                        <p className="text-slate-400 font-bold text-sm leading-relaxed">{message}</p>
                    </div>
                </div>

                {/* User info si fue bien */}
                {(status === 'success' || status === 'already') && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificado como:</p>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                            <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--aula-primary)' }}>
                                <GraduationCap size={20} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-sm font-black dark:text-white truncate">{user?.nombre} {(user as any)?.apellidos}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Estudiante</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mensaje de expirado: instrucción extra */}
                {status === 'expired' && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-left">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                            Pide a tu facilitador que genere un nuevo código QR desde la sección de asistencia.
                        </p>
                    </div>
                )}

                <button
                    onClick={() => router.push('/aula')}
                    className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                    Ir a Mi Aula
                </button>
            </motion.div>
        </div>
    );
}
