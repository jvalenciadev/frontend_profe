'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { aulaService } from '@/services/aulaService';
import { useAula } from '@/contexts/AulaContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    QrCode, RefreshCw, Printer, Clock, CheckCircle2,
    AlertTriangle, X, ChevronLeft, Shield, Wifi
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const QR_TTL_MS = 60 * 60 * 1000; // 60 min

export default function QrAsistenciaPage() {
    return (
        <Suspense fallback={<Loading />}>
            <QrContent />
        </Suspense>
    );
}

function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--aula-primary)' }} />
        </div>
    );
}

function QrContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { theme } = useAula();

    const sesionId = searchParams.get('sesionId');
    const moduloNombre = searchParams.get('modulo') || 'Módulo';
    const fecha = searchParams.get('fecha') || new Date().toLocaleDateString('es-BO');

    const [qrData, setQrData] = useState<{
        token: string; expiry: number; turnoId: string; sedeId: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [remaining, setRemaining] = useState(0); // segundos restantes
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const BASE_URL = typeof window !== 'undefined'
        ? `${window.location.origin}/aula/asistencia/marcar`
        : '/aula/asistencia/marcar';

    const qrUrl = qrData
        ? `${BASE_URL}?token=${encodeURIComponent(qrData.token)}`
        : '';

    const pct = remaining > 0 ? (remaining / (QR_TTL_MS / 1000)) * 100 : 0;
    const isWarning = remaining < 300; // menos de 5 min
    const isDanger = remaining < 60;  // menos de 1 min

    // ─── Generar / Renovar token ────────────────────────────────────────────
    const fetchToken = useCallback(async (isConfirmed = false) => {
        let currentSesionId = sesionId;
        
        // Si el ID es 'hoy', primero aseguramos que la sesión existe
        if (sesionId === 'hoy') {
            if (!isConfirmed) {
                setShowConfirm(true);
                return;
            }
            const mId = searchParams.get('moduloId');
            const tId = searchParams.get('turnoId') || undefined;
            if (!mId) {
                toast.error('Falta el ID del módulo para generar la sesión de hoy');
                return;
            }
            setLoading(true);
            try {
                const hoyStr = new Date().toISOString().split('T')[0];
                const sesion = await aulaService.crearSesionAsistencia(mId, { fecha: hoyStr, turnoId: tId });
                currentSesionId = sesion.id;
            } catch (err: any) {
                toast.error('Error al crear/obtener la sesión de hoy');
                setLoading(false);
                setShowConfirm(false);
                return;
            }
            setShowConfirm(false);
        }

        if (!currentSesionId) return;
        setLoading(true);
        try {
            const data = await aulaService.getQrToken(currentSesionId);
            setQrData({ token: data.token, expiry: data.expiry, turnoId: data.turnoId, sedeId: data.sedeId });
            setRemaining(Math.floor((data.expiry - Date.now()) / 1000));
            toast.success('Código QR generado — válido por 60 minutos');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al generar el QR');
        } finally {
            setLoading(false);
        }
    }, [sesionId, searchParams]);

    // Generar al montar
    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    // Countdown
    useEffect(() => {
        if (remaining <= 0) return;
        timerRef.current = setInterval(() => {
            setRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current!);
    }, [remaining]);

    // ─── Imprimir ────────────────────────────────────────────────────────────
    const handlePrint = () => {
        if (!qrData || remaining <= 0) {
            toast.error('El código QR ha expirado, genera uno nuevo antes de imprimir');
            return;
        }
        window.print();
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (!sesionId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <AlertTriangle size={48} className="text-amber-500 mx-auto" />
                    <h1 className="text-xl font-black">Parámetro faltante</h1>
                    <p className="text-slate-500">No se proporcionó el ID de sesión.</p>
                    <button onClick={() => router.back()} className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ── Contenido normal (se oculta al imprimir) ────────────────── */}
            <div className={cn('min-h-screen p-4 md:p-8 no-print', theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900')}>
                {/* Header */}
                <div className="max-w-2xl mx-auto mb-6 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className={cn(
                            'w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105',
                            theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 shadow'
                        )}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black leading-tight">Código QR de Asistencia</h1>
                        <p className="text-xs text-slate-400 font-medium">{moduloNombre} · {fecha}</p>
                    </div>
                </div>

                {/* Card principal */}
                <div className="max-w-2xl mx-auto">
                    <div className={cn(
                        'rounded-[2.5rem] overflow-hidden shadow-2xl border',
                        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                    )}>
                        {/* Accent Bar */}
                        <div className="h-1.5 w-full" style={{ backgroundColor: 'var(--aula-primary)' }} />

                        <div className="p-8 md:p-12 space-y-8">
                            {/* Título */}
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--aula-primary), transparent 88%)', color: 'var(--aula-primary)' }}>
                                    <Shield size={12} />
                                    Token firmado · Turno específico
                                </div>
                                <h2 className="text-2xl font-black">Escanee para registrar asistencia</h2>
                                <p className={cn('text-sm font-medium', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                                    Use su dispositivo móvil y la app Aula PROFE
                                </p>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center">
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="w-64 h-64 flex items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="w-12 h-12 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--aula-primary)' }} />
                                        </motion.div>
                                    ) : remaining <= 0 ? (
                                        <motion.div
                                            key="expired"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="w-64 h-64 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800"
                                        >
                                            <X size={48} className="text-rose-500" />
                                            <p className="text-rose-500 font-black text-sm text-center">Código expirado</p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="qr"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={cn(
                                                'p-5 rounded-3xl shadow-lg border',
                                                isDanger
                                                    ? 'border-rose-300 dark:border-rose-700'
                                                    : isWarning
                                                        ? 'border-amber-300 dark:border-amber-700'
                                                        : 'border-slate-100 dark:border-slate-700'
                                            )}
                                        >
                                            <QRCodeSVG
                                                value={qrUrl}
                                                size={220}
                                                level="H"
                                                includeMargin={false}
                                                fgColor={theme === 'dark' ? '#ffffff' : '#0f172a'}
                                                bgColor={theme === 'dark' ? '#0f172a' : '#ffffff'}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Timer */}
                            {!loading && remaining > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5 text-slate-400">
                                            <Clock size={12} />
                                            Validez del código
                                        </span>
                                        <span className={cn(
                                            'font-mono text-lg',
                                            isDanger ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'
                                        )}>
                                            {formatTime(remaining)}
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full transition-colors duration-500"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: isDanger ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--aula-primary)'
                                            }}
                                            transition={{ duration: 1, ease: 'linear' }}
                                        />
                                    </div>
                                    <p className={cn('text-xs text-center font-medium', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>
                                        El código expirará automáticamente al terminar el tiempo
                                    </p>
                                </div>
                            )}

                            {/* Info de seguridad */}
                            {qrData && remaining > 0 && (
                                <div className={cn('rounded-2xl p-4 space-y-2 text-xs', theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50')}>
                                    <p className="font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                        <Shield size={10} />
                                        Restricciones de seguridad
                                    </p>
                                    <ul className={cn('space-y-1 font-medium', theme === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                                        <li>• Solo válido para <span className="font-black">este turno y esta sede</span></li>
                                        <li>• Expira en 60 minutos desde su generación</li>
                                        <li>• Cada escaneo registra al estudiante una sola vez</li>
                                        <li>• Firma criptográfica previene falsificación</li>
                                    </ul>
                                </div>
                            )}

                            {/* Acciones */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => fetchToken()}
                                    disabled={loading}
                                    className={cn(
                                        'h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border',
                                        theme === 'dark'
                                            ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                                    )}
                                >
                                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                    {remaining <= 0 ? 'Nuevo QR' : 'Renovar'}
                                </button>
                                <button
                                    onClick={handlePrint}
                                    disabled={!qrData || remaining <= 0}
                                    className="h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                                    style={{
                                        backgroundColor: 'var(--aula-primary)',
                                        boxShadow: '0 8px 20px -4px var(--aula-primary)55'
                                    }}
                                >
                                    <Printer size={16} />
                                    Imprimir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Hoja de impresión ────────────────────────────────────────── */}
            <div className="print-only hidden print:block print-page" ref={printRef}>
                <style>{`
                    @media print {
                        @page { size: A4; margin: 1.5cm; }
                        .no-print { display: none !important; }
                        .print-only { display: block !important; }
                        body { background: white !important; }
                    }
                `}</style>
                <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
                    {/* Encabezado impresión */}
                    <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '3px solid #1e293b', paddingBottom: '16px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>
                            CÓDIGO QR DE ASISTENCIA
                        </h1>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0', fontWeight: '600' }}>
                            {moduloNombre} · {fecha}
                        </p>
                    </div>

                    {/* QR grande para imprimir */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        {qrData && remaining > 0 ? (
                            <QRCodeSVG
                                value={qrUrl}
                                size={300}
                                level="H"
                                includeMargin={true}
                                fgColor="#0f172a"
                                bgColor="#ffffff"
                            />
                        ) : (
                            <div style={{ width: 300, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>
                                <p style={{ color: '#ef4444', fontWeight: '900' }}>QR EXPIRADO</p>
                            </div>
                        )}
                    </div>

                    {/* Info de validez */}
                    <div style={{ textAlign: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: '#475569' }}>
                            Validez del Código
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>60 minutos</p>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                            El código expirará automáticamente al terminar el tiempo
                        </p>
                    </div>

                    {/* Advertencias */}
                    <div style={{ border: '2px solid #fbbf24', borderRadius: '12px', padding: '14px', backgroundColor: '#fffbeb' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', color: '#92400e' }}>
                            ⚠ Instrucciones de uso
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#78350f', lineHeight: '1.8' }}>
                            <li>Escanee el código con su dispositivo móvil</li>
                            <li>Este código es válido <strong>únicamente para este turno y sede</strong></li>
                            <li>No comparta este código con estudiantes de otros turnos</li>
                            <li>Imprima un nuevo código en cada sesión</li>
                        </ul>
                    </div>

                    {/* Footer impresión */}
                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                        <p>Impreso el: {new Date().toLocaleString('es-BO')} · Sistema Aula PROFE</p>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmación */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={cn(
                                "max-w-sm w-full rounded-[2.5rem] p-10 text-center space-y-8 relative overflow-hidden shadow-2xl",
                                theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white"
                            )}
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />
                            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                                <QrCode size={40} />
                            </div>
                            <div className="space-y-3">
                                <h3 className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>¿Generar Código QR?</h3>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    Se creará una nueva sesión de asistencia para hoy y se generará el token de acceso.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => router.back()}
                                    className={cn("h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest", theme === 'dark' ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100")}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => fetchToken(true)}
                                    className="h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    Sí, Generar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
