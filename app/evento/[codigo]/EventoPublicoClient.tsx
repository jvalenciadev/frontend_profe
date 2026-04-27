'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Clock, Users, CheckCircle2, AlertCircle,
    Download, Timer, Wifi, WifiOff, ChevronRight, ChevronLeft,
    Trophy, Star, FileText, RefreshCw, User, Hash, ArrowRight, ArrowLeft,
    QrCode, CreditCard, Lock, Unlock, AlertTriangle, Info,
    ChevronDown, Check, X, ClipboardList, Play, Video, RotateCcw,
    PartyPopper, Zap, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { eventoPublicoService } from '@/services/eventoPublicoService';
import publicService from '@/services/publicService';
import Link from 'next/link';
import { getImageUrl, cn, stripHtml } from '@/lib/utils';
import YouTube from 'react-youtube';

// ─── TYPES ─────────────────────────────────────────────────────────────────
type TipoPreg = 'SINGLE' | 'MULTIPLE' | 'TRUE_FALSE' | 'TEXTO';

interface Opcion { id: string; texto: string; }
interface Pregunta { id: string; texto: string; tipo: TipoPreg; puntos: number; obligatorio: boolean; opciones: Opcion[]; }
interface Cuestionario { id: string; titulo: string; descripcion: string; fechaInicio: string; fechaFin: string; tiempoMaximo: number | null; puntosMaximos: number | null; estado: string; preguntas: Pregunta[]; orden: number; esObligatorio: boolean; esEvaluativo: boolean; urlVideo?: string | null; limiteIntentos?: number | null; esAleatorio?: boolean; cantidadPreguntas?: number | null; }
interface Evento { id: string; nombre: string; codigo: string; descripcion: string; banner: string; afiche: string; fecha: string; lugar: string; inscripcionAbierta: boolean; asistencia: boolean | null; codigoAsistencia: string | null; tipo: any; cuestionarios: Cuestionario[]; modalidadIds: string; camposExtras: any[]; tenantId?: string; urlVideo?: string | null; }

// ─── YOUTUBE HELPER ─────────────────────────────────────────────────────────
function extractYouTubeId(url: string): string {
    if (!url) return url;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pat of patterns) {
        const m = url.match(pat);
        if (m) return m[1];
    }
    return url;
}

function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('es-BO', options || { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Hook de online/offline
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

function useOnlineStatus() {
    // ─── UTILS ───
    const [online, setOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
    useEffect(() => {
        const on = () => setOnline(true);
        const off = () => setOnline(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
    }, []);
    return online;
}

// ─── TIMER COMPONENT ────────────────────────────────────────────────────────
// ─── TIMER COMPONENT ROBUSTO ───────────────────────────────────────────────
function Timer_Cuestionario({ segundos, startTime, onExpire }: { segundos: number; startTime: number; onExpire: () => void }) {
    const [restantes, setRestantes] = useState(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        return Math.max(0, segundos - elapsed);
    });
    const intervalRef = useRef<any>(null);
    const expired = useRef(false);

    useEffect(() => {
        if (restantes <= 0) {
            onExpire();
            return;
        }

        intervalRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const left = Math.max(0, segundos - elapsed);

            setRestantes(left);
            if (left <= 0) {
                clearInterval(intervalRef.current);
                if (!expired.current) {
                    expired.current = true;
                    onExpire();
                }
            }
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [segundos, startTime, onExpire]);

    const mins = Math.floor(restantes / 60);
    const secs = restantes % 60;
    const pct = (restantes / segundos) * 100;
    const critical = restantes < 60;

    return (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-black text-sm transition-all ${critical ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-card border border-border text-foreground'}`}>
            <Timer className="w-4 h-4 shrink-0" />
            <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${critical ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─── DESCARGO COMPONENT CON QR Y BARCODE ────────────────────────────────────
function Descargo({ tipo, persona, evento, resultado, inscripcionId }: any) {
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
    const fecha = new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });
    const hora = new Date().toLocaleTimeString('es-BO');

    const tipoConfig = {
        inscripcion: {
            label: 'Comprobante de Inscripción',
            icon: <CheckCircle2 className="w-7 h-7 text-blue-600 dark:text-blue-500" />,
            bgColor: 'bg-blue-600',
            bgLight: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            textColor: 'text-blue-600 dark:text-blue-500',
            printHex: '#2563eb',
            printBgHex: '#eff6ff'
        },
        asistencia: {
            label: 'Comprobante de Asistencia',
            icon: <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-500" />,
            bgColor: 'bg-emerald-600',
            bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
            borderColor: 'border-emerald-200 dark:border-emerald-800',
            textColor: 'text-emerald-600 dark:text-emerald-500',
            printHex: '#059669',
            printBgHex: '#f0fdf4'
        },
        cuestionario: {
            label: 'Certificado de Evaluación',
            icon: <Trophy className="w-7 h-7 text-amber-600 dark:text-amber-500" />,
            bgColor: 'bg-amber-600',
            bgLight: 'bg-amber-50 dark:bg-amber-900/20',
            borderColor: 'border-amber-200 dark:border-amber-800',
            textColor: 'text-amber-600 dark:text-amber-500',
            printHex: '#d97706',
            printBgHex: '#fffbeb'
        }
    };

    const config = tipoConfig[tipo as keyof typeof tipoConfig] || tipoConfig.inscripcion;
    const tipoLabel = config.label;

    const urlVerificacion = typeof window !== 'undefined'
        ? `${window.location.origin}/evento/${evento?.codigo || evento?.id}`
        : '';

    // Generar QR en canvas
    useEffect(() => {
        if (!qrCanvasRef.current || !urlVerificacion) return;
        import('qrcode').then(QRCode => {
            QRCode.toCanvas(qrCanvasRef.current, urlVerificacion, {
                width: 120,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' }
            });
        });
    }, [urlVerificacion]);

    // Generar Barcode (CI) en canvas
    useEffect(() => {
        if (!barcodeCanvasRef.current || !persona?.ci) return;
        import('jsbarcode').then(({ default: JsBarcode }) => {
            JsBarcode(barcodeCanvasRef.current, String(persona.ci), {
                format: 'CODE128',
                width: 1.8,
                height: 50,
                displayValue: true,
                fontSize: 12,
                textMargin: 4,
                margin: 8,
                background: '#ffffff',
                lineColor: '#000000',
            });
        });
    }, [persona?.ci]);

    const handlePrint = () => {
        const el = document.getElementById('descargo-print');
        if (!el) return;

        // Capturar los canvas como imágenes base64 ANTES de abrir la ventana
        const qrCanvas = qrCanvasRef.current;
        const barcodeCanvas = barcodeCanvasRef.current;
        const qrDataUrl = qrCanvas ? qrCanvas.toDataURL('image/png') : '';
        const barcodeDataUrl = barcodeCanvas ? barcodeCanvas.toDataURL('image/png') : '';

        // Reemplazar los <canvas> por <img> con su dataURL
        // (los canvas no se imprimen en ventanas nuevas)
        const win = window.open('', '_blank', 'width=800,height=900');
        if (!win) { window.print(); return; }

        win.document.documentElement.innerHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="color-scheme" content="light">
  <title>Comprobante PROFE - ${tipoLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { font-family: 'Arial', sans-serif; background: white !important; color: #111 !important; padding: 32px; max-width: 700px; margin: 0 auto; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .icon-box { width: 52px; height: 52px; background: ${config.printBgHex}; border: 1px solid ${config.printHex}33; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: ${config.printHex}; }
    .title { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; color: ${config.printHex}; }
    .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; text-transform: uppercase; font-weight: bold; }
    .qr-img { width: 90px; height: 90px; border: 1px solid #e2e8f0; border-radius: 10px; }
    .qr-label { font-size: 8px; text-align: center; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-top: 4px; font-weight: 700; }
    .participante-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; }
    .label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; }
    .value { font-weight: 800; color: #0f172a; margin-top: 3px; font-size: 14px; }
    .value.big { font-size: 18px; text-transform: uppercase; color: #000; }
    .value.mono { font-family: monospace; font-size: 24px; font-weight: 900; letter-spacing: -1px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
    .field { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
    .aprobado { color: #16a34a; font-size: 20px; font-weight: 900; margin-top: 3px; }
    .reprobado { color: #dc2626; font-size: 20px; font-weight: 900; margin-top: 3px;}
    .barcode-section { border-top: 2px dashed #cbd5e1; padding-top: 20px; text-align: center; margin-top: 24px; }
    .barcode-img { max-width: 100%; height: auto; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px; background: white; }
    .footer { text-align: center; font-size: 10px; color: #64748b; margin-top: 16px; line-height: 1.6; }
    .footer-highlight { font-weight: bold; color: ${config.printHex}; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="icon-box">✓</div>
      <div>
        <div class="title">${tipoLabel}</div>
        <div class="subtitle">Sistema de Gestión Académica - PROFE</div>
      </div>
    </div>
    ${qrDataUrl ? `<div><img class="qr-img" src="${qrDataUrl}" alt="QR"/><div class="qr-label">Verificar</div></div>` : ''}
  </div>

  <div class="participante-box">
    <div class="label">Participante / Titular</div>
    <div class="value big">${(persona?.nombre1 || '')} ${(persona?.nombre2 || '')} ${(persona?.apellido1 || '')} ${(persona?.apellido2 || '')}</div>
  </div>

  <div class="grid">
    <div class="field"><div class="label">Cédula de Identidad</div><div class="value mono">${persona?.ci || ''}</div></div>
    <div class="field"><div class="label">Evento</div><div class="value">${evento?.nombre || ''}</div></div>
    <div class="field"><div class="label">Categoría de Evento</div><div class="value" style="color: ${config.printHex}; font-weight: 900;">${evento?.tipo?.nombre || 'Evento'}</div></div>
    <div class="field"><div class="label">Fecha del evento</div><div class="value">${formatDate(evento?.fecha)}</div></div>
    ${resultado && !resultado.offline ? `
    <div class="field"><div class="label">Puntaje / Desempeño</div><div class="value mono">${resultado.puntaje} de ${resultado.puntajeMaximo} puntos</div></div>
    <div class="field"><div class="label">Nota Final</div><div class="value" style="font-size: 20px; font-weight: 900;">${resultado.nota} / 100</div></div>
    ` : ''}
    <div class="field"><div class="label">Fecha de Emisión</div><div class="value">${fecha} · ${hora}</div></div>
    ${inscripcionId ? `<div class="field"><div class="label">Código de Verificación</div><div class="value" style="font-size:11px;word-break:break-all; font-family: monospace;">${inscripcionId}</div></div>` : ''}
  </div>

  ${barcodeDataUrl ? `
  <div class="barcode-section">
    <div class="label" style="margin-bottom:12px">Identificación Única de Titular (Código de Barras)</div>
    <img class="barcode-img" src="${barcodeDataUrl}" alt="Barcode CI" />
  </div>` : ''}

  <div class="footer">
    Este documento es un comprobante oficial generado automáticamente.<br/>
    Escanea el código QR para validar la autenticidad de este documento en la plataforma <span class="footer-highlight">PROFE</span>.
  </div>

  <script>window.onload = function() { window.print(); }<\/script>
</body>
            </html>`;
        win.document.close();
    };

    return (
        <div className="space-y-6">
            <div
                id="descargo-print"
                className={`bg-card border-2 ${config.borderColor} rounded-3xl p-8 space-y-6 shadow-xl shadow-black/5 print:border-slate-300 print:bg-white print:rounded-none print:shadow-none transition-colors duration-500`}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-4 border-b border-border pb-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl ${config.bgLight} border ${config.borderColor} flex items-center justify-center`}>
                            {config.icon}
                        </div>
                        <div>
                            <h2 className={`text-xl font-black uppercase tracking-tight ${config.textColor}`}>
                                {tipoLabel}
                            </h2>
                            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1">PROFE — Sistema de Gestión Académica</p>
                        </div>
                    </div>
                    {/* QR code */}
                    <div className="shrink-0 text-center bg-white p-1.5 rounded-xl border border-border shadow-sm">
                        <canvas ref={qrCanvasRef} className="w-[90px] h-[90px] rounded-xl border border-border bg-white" />
                        <p className="text-[8px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Verificar</p>
                    </div>
                </div>

                {/* Datos principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                    <div className="md:col-span-2 p-4 rounded-2xl bg-muted/30 border border-border">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Participante</span>
                        <p className="font-black text-foreground uppercase text-lg mt-0.5">
                            {persona?.nombre1} {persona?.nombre2} {persona?.apellido1} {persona?.apellido2}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">C.I.</span>
                        <p className="font-black text-foreground text-2xl font-mono">{persona?.ci}</p>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Evento</span>
                        <p className="font-bold text-foreground">{evento?.nombre}</p>
                    </div>

                    <div className="space-y-1 bg-muted/30 p-3 rounded-xl border border-border">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Tipo de Comprobante</span>
                        <p className={`font-black uppercase text-sm ${config.textColor}`}>{tipoLabel}</p>
                    </div>

                    <div className="space-y-1 bg-muted/30 p-3 rounded-xl border border-border">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Fecha del evento</span>
                        <p className="font-bold text-foreground text-sm">{formatDate(evento?.fecha)}</p>
                    </div>

                    {tipo === 'cuestionario' && resultado && resultado.puntaje !== null && (
                        <>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Puntaje / Respuestas</span>
                                <p className="font-black text-2xl text-primary">{Math.min(resultado.puntaje ?? 0, resultado.puntajeMaximo ?? 0)} / {resultado.puntajeMaximo} pts</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/20 space-y-1">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Nota de Evaluación</span>
                                <p className="font-black text-2xl text-slate-600 dark:text-slate-400">
                                    {Math.min(resultado.nota ?? 0, 100)}/100
                                </p>
                            </div>
                        </>
                    )}

                    <div className="space-y-1 bg-muted/30 p-3 rounded-xl border border-border">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Emitido el</span>
                        <p className="font-bold text-foreground text-sm">{fecha} · {hora}</p>
                    </div>

                    {inscripcionId && (
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-muted-foreground">Código de verificación</span>
                            <p className="font-black text-foreground font-mono text-[11px] break-all">{inscripcionId}</p>
                        </div>
                    )}
                </div>

                {/* Barcode del CI */}
                {persona?.ci && (
                    <div className="border-t border-border pt-5 flex flex-col items-center gap-2">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3" />
                            Código de barras — Cédula de Identidad
                        </p>
                        <div className="bg-white rounded-xl p-2 border border-border">
                            <canvas ref={barcodeCanvasRef} />
                        </div>
                    </div>
                )}

                <div className="border-t border-border pt-4 text-center text-[11px] text-muted-foreground leading-relaxed">
                    Este documento es un comprobante oficial generado automáticamente por el Sistema PROFE Bolivia.
                    Escanea el código QR para verificar el evento en línea.
                </div>
            </div>

            <button
                onClick={handlePrint}
                className={`w-full h-14 rounded-2xl ${config.bgColor} text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-black/10`}
            >
                <Download className="w-4 h-4" />
                Imprimir / Guardar PDF
            </button>
        </div>
    );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function EventoPublicoPage() {
    const params = useParams();
    const codigo = params?.codigo as string;
    const searchParams = useSearchParams();
    const router = useRouter();
    const online = useOnlineStatus();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSavedStatus, setLastSavedStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // States
    const [evento, setEvento] = useState<Evento | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'info' | 'identificacion' | 'inscripcion' | 'preview' | 'asistencia' | 'cuestionario' | 'resultado' | 'descargo'>('info');

    // Formulario identificación
    const [form, setForm] = useState({
        ci: '',
        fechaNacimiento: '',
        nombre1: '',
        nombre2: '',
        apellido1: '',
        apellido2: '',
        correo: '',
        celular: '',
        expedido: 'LP',
        complemento: '',
        generoId: '1',
        departamentoId: '',
        modalidadId: '',
        codigoAsistencia: '',
        respuestasExtras: {} as Record<string, any>
    });

    // Handle query params
    useEffect(() => {
        const stepParam = searchParams.get('step');
        const codeParam = searchParams.get('code');

        if (stepParam === 'asistencia') {
            setStep('asistencia');
            if (codeParam) {
                setForm(prev => ({ ...prev, codigoAsistencia: codeParam.toUpperCase() }));
            }
        }
    }, [searchParams]);
    const [persona, setPersona] = useState<any>(null);
    const [inscripcion, setInscripcion] = useState<any>(null);
    const [progreso, setProgreso] = useState<any[]>([]);
    const [resultado, setResultado] = useState<any>(null);
    const [cuestionarioActivo, setCuestionarioActivo] = useState<Cuestionario | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [respuestas, setRespuestas] = useState<Record<string, any>>({});
    const [preguntaIdx, setPreguntaIdx] = useState(0);
    const [timerExpired, setTimerExpired] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [offlineQueue, setOfflineQueue] = useState<any>(null); // guardado offline
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [allModalidades, setAllModalidades] = useState<any[]>([]);
    const [localVideosVistos, setLocalVideosVistos] = useState<Record<string, boolean>>({});
    const videoTimersRef = useRef<Record<string, { totalTime: number, lastStart: number | null }>>({});
    const [videoWarningModal, setVideoWarningModal] = useState(false);
    const [yaRegistradaModal, setYaRegistradaModal] = useState(false);
    const [isPersonaExistente, setIsPersonaExistente] = useState(false);
    const [confirmInscripcionModal, setConfirmInscripcionModal] = useState(false);


    // Helper centralizado para determinar si un paso está completado (Senior Pattern: Single Source of Truth)
    const isStepFinished = useCallback((cId: string) => {
        const c = evento?.cuestionarios.find((x: any) => x.id === cId);
        if (!c) return false;
        const p = progreso?.find((x: any) => x.id === cId);
        const sinPreguntas = !c.preguntas || c.preguntas.length === 0;
        
        // Un paso se considera terminado si:
        // 1. El backend dice que está finalizado
        // 2. O es solo video y ya se vio localmente
        const isFinishedBackend = !!p?.finalizado;
        const isVideoFinished = (p?.videoCompletado || localVideosVistos[cId]);
        
        if (sinPreguntas) return isVideoFinished || isFinishedBackend;
        
        // Si tiene preguntas, verificamos si está aprobado o alcanzó el límite
        const isAprobado = !!p?.aprobado;
        const isPerfect = (p?.nota ?? 0) >= 100 || isAprobado;
        const hasReachedLimit = c.limiteIntentos != null && (p?.numeroIntentos || 0) >= c.limiteIntentos;
        
        return isFinishedBackend && (isPerfect || hasReachedLimit || !c.esEvaluativo);
    }, [evento, progreso, localVideosVistos]);

    const checkCanStartCuestionario = useCallback((cuestionarioId: string, customProgress?: any[]) => {
        const prog = customProgress || progreso;
        if (!evento?.cuestionarios) return true;

        const index = evento.cuestionarios.findIndex((c: any) => c.id === cuestionarioId);
        if (index === -1 || index === 0) return true;

        // Verificar anteriores obligatorios
        for (let i = 0; i < index; i++) {
            const prev = evento.cuestionarios[i];
            if (prev.esObligatorio) {
                if (!isStepFinished(prev.id)) return false;
            }
        }
        return true;
    }, [evento, isStepFinished]);
    
    const generos = [
        { id: '1', nombre: 'MASCULINO' },
        { id: '2', nombre: 'FEMENINO' }
    ];

    const [errores, setErrores] = useState<Record<string, boolean>>({});

    // ─── RESET COMPLETO PARA NUEVA PERSONA ───────────────────────────────────
    const handleReset = (eventoId?: string) => {
        setStep('info');
        setPersona(null);
        setInscripcion(null);
        setResultado(null);
        setCuestionarioActivo(null);
        setRespuestas({});
        setPreguntaIdx(0);
        setTimerExpired(false);
        setStartTime(null);
        setOfflineQueue(null);
        setLocalVideosVistos({});
        setErrores({});
        setForm({
            ci: '',
            fechaNacimiento: '',
            nombre1: '',
            nombre2: '',
            apellido1: '',
            apellido2: '',
            correo: '',
            celular: '',
            expedido: 'LP',
            complemento: '',
            generoId: '1',
            departamentoId: '',
            modalidadId: '',
            respuestasExtras: {},
            codigoAsistencia: ''
        });
        setIsPersonaExistente(false);
        setConfirmInscripcionModal(false);

        // Limpiar todas las claves relacionadas
        const id = eventoId || evento?.id;
        if (id) {
            localStorage.removeItem(`cuestionario_session_${id}`);
        }
        setProgreso([]);
        localStorage.removeItem('cuestionario_pendiente');
        setError('');
        toast.info('Formulario restablecido para un nuevo registro.');
    };

    // Cargar datos iniciales
    useEffect(() => {
        if (!codigo || codigo === 'undefined') {
            setLoading(false);
            setError('Código de evento no especificado.');
            return;
        }

        Promise.all([
            eventoPublicoService.getEvento(codigo),
            publicService.getDepartamentos(),
            publicService.getModalidades()
        ]).then(([evt, deps, mods]) => {
            setEvento(evt);
            setDepartamentos(deps);
            setAllModalidades(mods);
            // Pre-seleccionar el departamento del evento si existe
            if (evt.tenantId) setForm(fp => ({ ...fp, departamentoId: evt.tenantId }));

            // ─── RECUPERAR SESIÓN GUARDADA ───
            const saved = localStorage.getItem(`cuestionario_session_${evt.id}`);
            if (saved) {
                try {
                    const session = JSON.parse(saved);
                    setPersona(session.persona);
                    setForm({ ...session.form, respuestasExtras: session.form?.respuestasExtras || {} });
                    // No restauramos el Step para que siempre inicie en 'info' (detalle)
                    // setStep(session.step);
                    setCuestionarioActivo(session.cuestionarioActivo);
                    setRespuestas(session.respuestas || {});
                    setPreguntaIdx(session.preguntaIdx || 0);
                    setStartTime(session.startTime);
                    setProgreso(session.progreso || []);
                    setInscripcion(session.inscripcion || null);
                    setResultado(session.resultado || null);
                    if (session.localVideosVistos) setLocalVideosVistos(session.localVideosVistos);

                    if (session.step === 'cuestionario' && session.startTime && session.cuestionarioActivo?.tiempoMaximo) {
                        const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
                        const totalSecs = session.cuestionarioActivo.tiempoMaximo * 60;
                        if (elapsed >= totalSecs) {
                            setTimerExpired(true);
                        }
                    }
                } catch (e) {
                    console.error("Error recuperando sesión:", e);
                }
            }

            // ─── RECUPERAR PENDIENTES OFFLINE ───
            const pendienteRaw = localStorage.getItem('cuestionario_pendiente');
            if (pendienteRaw) {
                try {
                    const p = JSON.parse(pendienteRaw);
                    if (p.eventoId === evt.id) {
                        setOfflineQueue(p.data);
                        // Si ya tenemos el resultado en el envío anterior pero no se confirmó, 
                        // podríamos estar en un estado inconsistente. Por ahora solo lo cargamos.
                    }
                } catch { }
            }
        }).catch(() => {
            setError('Error al cargar la información del evento.');
        }).finally(() => {
            setLoading(false);
        });
    }, [codigo]);

    // ─── GUARDAR SESIÓN AUTOMÁTICAMENTE ───
    useEffect(() => {
        if (evento && (step !== 'info' || Object.keys(localVideosVistos).length > 0)) {
            const session = {
                persona, form, step, cuestionarioActivo, respuestas, preguntaIdx, startTime, progreso,
                inscripcion, resultado, localVideosVistos, isPersonaExistente
            };
            localStorage.setItem(`cuestionario_session_${evento.id}`, JSON.stringify(session));
            setLastSavedStatus('saved');
        }
    }, [evento, step, persona, form, cuestionarioActivo, respuestas, preguntaIdx, startTime, progreso, inscripcion, resultado, localVideosVistos]);

    // Auto-envío cuando el timer expira
    useEffect(() => {
        if (timerExpired && step === 'cuestionario') {
            // Un pequeño delay para que el usuario no se asuste
            const t = setTimeout(() => {
                handleEnviarCuestionario();
            }, 1500);
            return () => clearTimeout(t);
        }
    }, [timerExpired, step]);

    // Intentar re-envío cuando vuelve Internet
    useEffect(() => {
        if (online && offlineQueue) {
            handleEnviarCuestionario(offlineQueue);
        }
    }, [online]);

    const handleBuscarPersona = async () => {
        if (!form.ci || !form.fechaNacimiento) return;

        let ciLimpio = form.ci;
        let compLimpio = form.complemento;

        if (form.ci.includes('-')) {
            const [ci, comp] = form.ci.split('-');
            ciLimpio = ci;
            compLimpio = comp;
        }

        setSubmitting(true);
        try {
            const result = await eventoPublicoService.buscarPersona(ciLimpio, form.fechaNacimiento);
            const check = await eventoPublicoService.verificarInscripcion(evento!.id, ciLimpio, form.fechaNacimiento);

            if (check.inscrito) {
                setPersona(check.persona);
                setInscripcion(check.inscripcion);

                // Cargar progreso real del backend
                try {
                    const prog = await eventoPublicoService.getProgreso(evento!.id, ciLimpio, form.fechaNacimiento);
                    setProgreso(prog.progress);

                    // SINCRONIZAR VIDEOS VISTOS LOCALMENTE
                    const videosLocales = Object.keys(localVideosVistos);
                    for (const cueId of videosLocales) {
                        const yaEnBackend = prog.progress.find((p: any) => p.id === cueId)?.videoCompletado;
                        if (!yaEnBackend) {
                            await eventoPublicoService.marcarVideoVisto(evento!.id, cueId, ciLimpio, form.fechaNacimiento).catch(() => { });
                        }
                    }
                } catch (e) {
                    console.error("Error cargando progreso:", e);
                }

                if (cuestionarioActivo) {
                    // Validar si puede hacer el cuestionario seleccionado
                    const progCheck = await eventoPublicoService.getProgreso(evento!.id, ciLimpio, form.fechaNacimiento);
                    const canDo = checkCanStartCuestionario(cuestionarioActivo.id, progCheck.progress);
                    if (canDo) {
                        handleEmpezarCuestionario(cuestionarioActivo);
                        toast.success('Identidad verificada. Preparando cuestionario...');
                    } else {
                        toast.error('Debes completar los cuestionarios anteriores primero.');
                        setStep('info');
                    }
                } else {
                    setStep('info');
                    toast.success('Bienvenido de nuevo. Aquí puedes ver tu progreso.');
                }
                return;
            }

            // Si intenta hacer cuestionario sin estar inscrito
            if (cuestionarioActivo) {
                toast.error('Debes estar inscrito para realizar esta evaluación.');
                // No retornamos aquí para dejar que siga al flujo de inscripción abajo
            }

            if (result.found) {
                setPersona(result.persona);
                setForm({
                    ci: ciLimpio,
                    fechaNacimiento: form.fechaNacimiento,
                    complemento: compLimpio || result.persona.complemento || '',
                    nombre1: result.persona.nombre1 || '',
                    nombre2: result.persona.nombre2 || '',
                    apellido1: result.persona.apellido1 || '',
                    apellido2: result.persona.apellido2 || '',
                    correo: result.persona.correo || '',
                    celular: result.persona.celular || '',
                    generoId: result.persona.generoId?.toString() || '1',
                    expedido: result.persona.expedido || 'LP',
                    departamentoId: evento?.tenantId || '',
                    modalidadId: '',
                    codigoAsistencia: '',
                    respuestasExtras: {}
                });
            } else {
                setForm({
                    ci: ciLimpio,
                    fechaNacimiento: form.fechaNacimiento,
                    complemento: compLimpio,
                    nombre1: '',
                    nombre2: '',
                    apellido1: '',
                    apellido2: '',
                    correo: '',
                    celular: '',
                    generoId: '1',
                    expedido: 'LP',
                    departamentoId: evento?.tenantId || '',
                    modalidadId: '',
                    codigoAsistencia: '',
                    respuestasExtras: {}
                });
            }
            setIsPersonaExistente(result.found);
            setStep('inscripcion');
        } catch (error) {
            console.error("Error identificando:", error);
            toast.error('Ocurrió un error al verificar tus datos.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInscribirse = async () => {
        if (!evento) return;

        const nuevosErrores: Record<string, boolean> = {};

        // Validar campos base
        if (!form.nombre1) nuevosErrores.nombre1 = true;
        if (!form.apellido1) nuevosErrores.apellido1 = true;
        if (!form.modalidadId) nuevosErrores.modalidadId = true;
        if (!form.departamentoId) nuevosErrores.departamentoId = true;

        // Validar campos extras
        const missingExtras = (evento.camposExtras || []).filter(campo => {
            if (!campo.esObligatorio) return false;
            const valor = form.respuestasExtras[campo.id];

            let esVacio = false;
            if (campo.tipo === 'MULTIPLE_SELECT') {
                esVacio = !valor || valor.length === 0;
            } else if (campo.tipo === 'BOOLEAN') {
                esVacio = valor === undefined || valor === null;
            } else {
                esVacio = !valor || String(valor).trim() === '';
            }

            if (esVacio) nuevosErrores[campo.id] = true;
            return esVacio;
        });

        setErrores(nuevosErrores);

        if (Object.keys(nuevosErrores).length > 0) {
            toast.error('Por favor completa todos los campos marcados en rojo.');
            return;
        }

        setStep('preview');
    };

    const handleConfirmarFinalInscripcion = () => {
        setConfirmInscripcionModal(true);
    };

    const handleInscribirseAction = async () => {
        const evt = evento;
        if (!evt) return;
        setConfirmInscripcionModal(false);
        setSubmitting(true);
        try {
            // Limpieza de CI por si acaso quedó con guión
            const ciLimpio = form.ci.includes('-') ? form.ci.split('-')[0] : form.ci;

            const result = await eventoPublicoService.inscribirse(evt.id, {
                ...form,
                ci: ciLimpio,
                departamentoId: form.departamentoId,
                modalidadId: form.modalidadId,
                respuestasExtras: Object.entries(form.respuestasExtras).map(([campoId, valor]) => ({ campoId, valor }))
            });

            setPersona(result.persona);
            setInscripcion(result.inscripcion);

            // Sincronizar videos vistos al inscribirse
            const videosLocales = Object.keys(localVideosVistos);
            for (const cueId of videosLocales) {
                await eventoPublicoService.marcarVideoVisto(evt.id, cueId, ciLimpio, form.fechaNacimiento).catch(() => { });
            }

            if (cuestionarioActivo) {
                handleEmpezarCuestionario(cuestionarioActivo);
                toast.success('¡Inscripción exitosa! Iniciando evaluación...');
            } else {
                setStep('info');
                toast.success('¡Registro completado con éxito! Ya puedes realizar tus evaluaciones.');
            }
        } catch (e: any) {
            if (e?.response?.data?.message?.includes('inscrito')) {
                // Ya inscrito
                setInscripcion({ id: 'existente' });
                setStep('descargo');
            } else {
                alert(e?.response?.data?.message || 'Error al inscribirse');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegistrarAsistencia = async () => {
        if (!evento) return;

        if (!form.ci || !form.fechaNacimiento || !form.codigoAsistencia) {
            toast.error('Por favor completa los datos de identificación y el código de asistencia.');
            return;
        }

        setSubmitting(true);
        try {
            const result = await eventoPublicoService.registrarAsistencia(evento.id, form.ci, form.fechaNacimiento, form.codigoAsistencia);
            setPersona(result.persona);
            setInscripcion({ id: result.inscripcion });
            if (result.yaRegistrada) {
                setYaRegistradaModal(true);
            }
            setStep('descargo');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Error al registrar asistencia');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEnviarCuestionario = useCallback(async (queuedData?: any) => {
        const evt = evento;
        if (!evt || !cuestionarioActivo || !persona) return;
        setSubmitting(true);
        setLastSavedStatus('saving');

        const payload = queuedData || {
            ci: form.ci,
            fechaNacimiento: form.fechaNacimiento,
            respuestas: Object.entries(respuestas).map(([preguntaId, val]) => {
                if (Array.isArray(val)) return { preguntaId, opciones: val };
                return { preguntaId, opcionId: val, texto: val };
            }),
        };

        if (!online) {
            // Guardar en localStorage para reintento automático
            localStorage.setItem('cuestionario_pendiente', JSON.stringify({
                eventoId: evt.id,
                cuestionarioId: cuestionarioActivo.id,
                data: payload
            }));
            setOfflineQueue(payload);
            setStep('resultado');
            setResultado({
                offline: true,
                mensaje: 'Sin conexión. Tus respuestas se han guardado localmente y se enviarán automáticamente cuando recuperes la señal.'
            });
            setSubmitting(false);
            setLastSavedStatus('error');
            return;
        }

        // Intento de envío con reintento (Senior pattern)
        let attempt = 0;
        const maxAttempts = 3;

        while (attempt < maxAttempts) {
            try {
                const result = await eventoPublicoService.responderCuestionario(evt.id, cuestionarioActivo.id, payload);
                setResultado(result);
                setStep('resultado');
                setLastSavedStatus('saved');

                // Actualizar progreso localmente
                try {
                    const prog = await eventoPublicoService.getProgreso(evt.id, form.ci, form.fechaNacimiento);
                    setProgreso(prog.progress);
                } catch { }

                localStorage.removeItem(`cuestionario_session_${evt.id}`);
                localStorage.removeItem('cuestionario_pendiente');
                setOfflineQueue(null);
                break; // Éxito
            } catch (e: any) {
                attempt++;
                console.error(`Error enviando cuestionario (Intento ${attempt}):`, e);

                if (e?.response?.status === 409 || e?.response?.status === 403 || attempt >= maxAttempts) {
                    setLastSavedStatus('error');
                    if (e?.response?.status === 409) {
                        handleReset();
                        toast.error('Ya has respondido este cuestionario con esta persona.');
                    } else if (e?.response?.status === 403) {
                        const msg = e?.response?.data?.message || 'Has superado el límite de intentos permitidos.';
                        toast.error(msg);
                        setStep('info');
                    } else {
                        localStorage.setItem('cuestionario_pendiente', JSON.stringify({
                            eventoId: evento.id,
                            cuestionarioId: cuestionarioActivo.id,
                            data: payload
                        }));
                        setOfflineQueue(payload);
                        alert("Hubo un problema al conectar con el servidor. Tus respuestas se han guardado localmente e intentaremos enviarlas de nuevo en un momento.");
                    }
                    break;
                }
                // Esperar antes de reintentar
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
        setSubmitting(false);
    }, [evento, cuestionarioActivo, persona, respuestas, form, online]);

    const handleEmpezarCuestionario = useCallback((cues: any) => {
        if (!cues) return;

        // PREPARAR PREGUNTAS (Aleatorio y Límite)
        let pregs = [...cues.preguntas];
        if (cues.esAleatorio) {
            pregs = shuffleArray(pregs).map(p => ({
                ...p,
                opciones: shuffleArray(p.opciones)
            }));
        }
        if (cues.cantidadPreguntas && cues.cantidadPreguntas > 0) {
            pregs = pregs.slice(0, cues.cantidadPreguntas);
        }

        setCuestionarioActivo({ ...cues, preguntas: pregs });
        setRespuestas({});
        setPreguntaIdx(0);
        setTimerExpired(false);
        setStartTime(Date.now());
        setStep('cuestionario');
        setResultado(null);
    }, [evento]);

    const handleCompletarSinPreguntas = async (c: any) => {
        if (!form.ci || !form.fechaNacimiento) {
            toast.error("Debes identificarte para guardar tu progreso");
            return;
        }
        
        try {
            setLoading(true);
            // Sincronización Senior: Primero marcamos el video y luego completamos el paso enviando un cuestionario vacío
            await eventoPublicoService.marcarVideoVisto(evento!.id, c.id, form.ci, form.fechaNacimiento);
            
            const payload = {
                ci: form.ci,
                fechaNacimiento: form.fechaNacimiento,
                respuestas: [],
            };
            await eventoPublicoService.responderCuestionario(evento!.id, c.id, payload);
            
            // Forzamos la actualización del progreso global
            const progUpdate = await eventoPublicoService.getProgreso(evento!.id, form.ci, form.fechaNacimiento);
            setProgreso(progUpdate.progress);
            
            toast.success(`¡Paso "${c.titulo}" completado con éxito!`);
        } catch (e) {
            console.error("Error al completar paso sin preguntas:", e);
            toast.error("No se pudo guardar el progreso. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handleReintentar = () => {
        if (!cuestionarioActivo) return;
        const originalCues = evento?.cuestionarios?.find(c => c.id === cuestionarioActivo.id);
        if (originalCues) {
            handleEmpezarCuestionario(originalCues);
            toast.info('Iniciando nuevo intento. ¡Esta vez tú puedes!');
        }
    };



    const sortedCuestionarios = [...(evento?.cuestionarios || [])].sort((a, b) => a.orden - b.orden);

    const visibleCuestionarios = useMemo(() => {
        const result: any[] = [];
        if (!sortedCuestionarios.length) return result;

        for (let i = 0; i < sortedCuestionarios.length; i++) {
            const c = sortedCuestionarios[i];
            result.push(c);
            
            // Si es obligatorio y no está terminado, no mostramos los siguientes
            if (c.esObligatorio && !isStepFinished(c.id)) {
                break;
            }
        }
        return result;
    }, [sortedCuestionarios, isStepFinished]);

    const cuestionarioVigente = sortedCuestionarios.find(c => {
        const now = new Date();
        const isInRange = new Date(c.fechaInicio) <= now && new Date(c.fechaFin) >= now;
        return c.estado === 'activo' && isInRange && checkCanStartCuestionario(c.id);
    });

    // ── RENDER ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 flex items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-black uppercase text-foreground mb-4">Evento no encontrado</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                El evento con el código <span className="text-primary font-bold">"{codigo}"</span> no existe o no se encuentra disponible actualmente. Verifica el enlace o contacta con el administrador.
            </p>
            <button onClick={() => window.location.href = '/evento'}
                className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all">
                Ver todos los eventos
            </button>
        </div>
    );

    if (!evento) return null;

    const fechaEvento = formatDate(evento.fecha, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <>
            <div className="min-h-screen bg-background">
                {/* Offline banner */}
                <AnimatePresence>
                    {!online && (
                        <motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }}
                            className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black py-2 px-4 text-center text-xs font-black flex items-center justify-center gap-2">
                            <WifiOff className="w-4 h-4" />
                            Sin conexión a Internet — Tus respuestas se guardan localmente
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── DESKTOP BANNER (Hidden on Mobile) ─── */}
                <div className="hidden md:block relative h-[35rem] overflow-hidden bg-slate-950 mt-32 rounded-3xl mx-8 mb-8 shadow-2xl">
                    {evento.banner ? (
                        <>
                            <div className="absolute inset-0 scale-110 blur-3xl opacity-40">
                                <img src={getImageUrl(evento.banner)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <img src={getImageUrl(evento.banner)} alt={evento.nombre} className="relative w-full h-full object-contain" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-indigo-600" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                    <button onClick={() => router.back()} className="absolute top-8 left-8 z-30 w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/80 hover:scale-105 transition-all shadow-2xl">
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-12 z-20">
                        <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                            {evento.tipo?.nombre || 'Evento'}
                        </span>
                        <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-white mt-4 uppercase leading-[0.9] drop-shadow-2xl">
                            {evento.nombre}
                        </h1>
                    </div>
                </div>

                {/* ─── MOBILE HEADER (Clean & Professional) ─── */}
                <div className="md:hidden pt-32 pb-8 px-6 bg-slate-50 dark:bg-slate-900 border-b border-border">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                {evento.tipo?.nombre || 'Evento'}
                            </span>
                            <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground active:scale-95 transition-all">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase leading-[1.1]">
                            {evento.nombre}
                        </h1>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
                    {/* Info badges */}
                    <div className="flex flex-wrap gap-6 bg-card border border-border p-6 rounded-[2.5rem] shadow-sm">
                        <div className="flex items-center gap-3 text-sm text-foreground">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">Fecha</p>
                                <span className="font-bold capitalize">{fechaEvento}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-foreground">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">Lugar</p>
                                <span className="font-bold">{evento.lugar}</span>
                            </div>
                        </div>
                        {evento.modalidadIds && (
                            <div className="flex items-center gap-3 text-sm text-foreground">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">Modalidad</p>
                                    <span className="font-bold">
                                        {(evento.modalidadIds || '').split(',').map(id => {
                                            return allModalidades.find(m => m.id === id.trim())?.nombre;
                                        }).filter(Boolean).join(', ') || evento.modalidadIds}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content switcher */}
                    <AnimatePresence mode="wait">

                        {/* ── STEP INFO ── */}
                        {step === 'info' && (
                            <motion.div key="info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                <div className="bg-card border border-border rounded-3xl p-8">
                                    <h2 className="text-lg font-black uppercase text-foreground mb-3">Descripción</h2>
                                    <div className="text-muted-foreground leading-relaxed italic prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: evento.descripcion }} />
                                </div>




                                {/* ── PORTAL DE EVALUACIÓN (GATED) ── */}
                                {(evento.cuestionarios?.length || 0) > 0 && (
                                    !persona ? (() => {
                                        const firstCues = sortedCuestionarios[0];
                                        const firstStart = firstCues ? new Date(firstCues.fechaInicio) : null;
                                        const isWaiting = firstStart && firstStart > new Date();
                                        const dateStr = firstStart?.toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' });

                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="relative group"
                                            >
                                                {/* Decorative background elements (Monochromatic) */}
                                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
                                                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] animate-pulse delay-700" />

                                                <div className="relative overflow-hidden p-[2px] rounded-[3.5rem] bg-gradient-to-br from-primary/40 via-primary/5 to-primary/30 shadow-2xl transition-all duration-500 group-hover:shadow-primary/20 group-hover:scale-[1.01]">
                                                    <div className="relative p-12 rounded-[3.4rem] bg-card/95 backdrop-blur-3xl flex flex-col items-center text-center gap-10">

                                                        {/* Icon Composition (Monochromatic) */}
                                                        <div className="relative">
                                                            <motion.div
                                                                animate={{ rotate: [0, 5, -5, 0] }}
                                                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                                                className="relative z-10 w-28 h-28 rounded-[2.5rem] bg-primary shadow-xl shadow-primary/40 flex items-center justify-center text-white"
                                                            >
                                                                <ClipboardList className="w-14 h-14" />

                                                                {/* Floating micro-icons */}
                                                                <motion.div
                                                                    animate={{ y: [0, -10, 0] }}
                                                                    transition={{ duration: 3, repeat: Infinity }}
                                                                    className="absolute -top-4 -right-4 w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-primary"
                                                                >
                                                                    <Star className="w-5 h-5 fill-current" />
                                                                </motion.div>
                                                            </motion.div>

                                                            {/* Background rings */}
                                                            <div className="absolute inset-0 border-2 border-primary/20 rounded-[2.5rem] scale-125 animate-ping opacity-20" />
                                                        </div>

                                                        {/* Text Content */}
                                                        <div className="space-y-6 max-w-lg">
                                                            <div className="space-y-2">
                                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Módulo de Participante</span>
                                                                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                                                                    Portal de Evaluación
                                                                </h2>
                                                            </div>

                                                            <p className="text-base text-muted-foreground font-medium leading-relaxed">
                                                                Accede a tu panel personalizado para completar cuestionarios, monitorear tu avance en tiempo real y obtener tu certificado oficial.
                                                            </p>

                                                            {isWaiting && (
                                                                <div className="relative overflow-hidden px-8 py-4 rounded-3xl bg-primary/5 border border-primary/10 group/alert">
                                                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <div className="flex items-center gap-2 text-primary/80">
                                                                            <Clock className="w-4 h-4 animate-spin-slow" />
                                                                            <span className="text-[11px] font-black uppercase tracking-widest">Apertura Próximamente</span>
                                                                        </div>
                                                                        <span className="text-sm font-black text-foreground/80 uppercase">Disponible el {dateStr}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Action Section */}
                                                        <div className="w-full max-w-sm space-y-6">
                                                            <button
                                                                onClick={() => setStep('identificacion')}
                                                                className="group/btn relative w-full h-20 rounded-[2.2rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                                                            >
                                                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <span className="relative flex items-center justify-center gap-4">
                                                                    Acceder a mis Evaluaciones
                                                                    <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                                                                </span>
                                                            </button>

                                                            {/* Trust Badges */}
                                                            <div className="grid grid-cols-3 gap-4">
                                                                {[
                                                                    { icon: CheckCircle2, label: 'Seguro' },
                                                                    { icon: Zap, label: 'Rápido' },
                                                                    { icon: ShieldCheck, label: 'Oficial' }
                                                                ].map((badge, i) => (
                                                                    <div key={i} className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                                                                        <badge.icon className="w-5 h-5 text-primary" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">{badge.label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })() : (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-6 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                    <User className="w-7 h-7 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">Participante Identificado</p>
                                                    <h3 className="font-black text-foreground uppercase tracking-tight">{persona.nombre1} {persona.apellido1}</h3>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <button
                                                    onClick={() => setStep('descargo')}
                                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-colors flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/20"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Descargar Comprobante
                                                </button>
                                                <button
                                                    onClick={() => handleReset()}
                                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-50"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Cambiar de Usuario
                                                </button>
                                            </div>
                                        </motion.div>
                                    )
                                )}

                                {/* Transmisión en Vivo o Video del Evento */}
                                {evento.urlVideo && (() => {
                                    const ytId = extractYouTubeId(evento.urlVideo);
                                    return (
                                        <div className="bg-card border-2 border-primary/30 rounded-3xl overflow-hidden">
                                            <div className="px-6 py-4 bg-primary/10 flex items-center gap-3 border-b border-primary/20">
                                                <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
                                                    <Play className="w-5 h-5 text-red-500" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black uppercase text-sm text-foreground tracking-widest">Transmisión / Video del Evento</h3>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Evento Virtual</p>
                                                </div>
                                            </div>
                                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                                <YouTube
                                                    videoId={ytId}
                                                    className="absolute inset-0 w-full h-full"
                                                    iframeClassName="w-full h-full"
                                                    opts={{ height: '100%', width: '100%', playerVars: { rel: 0 } }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}


                                {persona && (evento.cuestionarios?.length || 0) > 0 && (
                                    <div className="space-y-8 pt-4">
                                        <div className="flex items-center justify-between border-b border-border pb-6">
                                            <h2 className="text-xl font-black uppercase text-foreground flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-primary" />
                                                </div>
                                                Tus Evaluaciones
                                            </h2>
                                            {progreso.length > 0 && (
                                                <div className="flex items-center gap-3 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/20">
                                                    <Trophy className="w-5 h-5 text-amber-500" />
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Progreso Total</p>
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                                                            {evento.cuestionarios.filter(c => isStepFinished(c.id)).length} de {evento.cuestionarios.length} Pasos
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 relative">
                                            {/* Timeline line */}
                                            <div className="absolute left-[2.25rem] top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent hidden md:block" />

                                            {visibleCuestionarios.map((c: any, idx: number) => {
                                                const originalIdx = sortedCuestionarios.findIndex(sc => sc.id === c.id);
                                                const now = new Date();
                                                const start = new Date(c.fechaInicio);
                                                const end = new Date(c.fechaFin);
                                                const isActive = c.estado === 'activo' && start <= now && end >= now;
                                                const isUpcoming = start > now;
                                                const prog = progreso.find(p => p.id === c.id);
                                                const canStart = checkCanStartCuestionario(c.id);

                                                const pVal = Number(prog?.puntaje ?? prog?.puntos ?? prog?.score ?? 0);
                                                const totalPuntos = c.preguntas?.reduce((acc: number, q: any) => acc + (q.puntos || 0), 0) || 0;
                                                const tVal = Number((prog?.puntajeMaximo ?? prog?.puntosMaximo ?? totalPuntos) || 0);
                                                const limitValue = prog?.limiteIntentos ?? c.limiteIntentos;
                                                const hasReachedLimit = limitValue != null && (prog?.numeroIntentos || 0) >= limitValue;

                                                return (
                                                    <motion.div
                                                        key={c.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="relative pl-0 md:pl-16"
                                                    >
                                                        {/* Step indicator */}
                                                        <div className={cn(
                                                            "absolute left-6 top-8 w-6 h-6 rounded-full border-4 border-background hidden md:flex items-center justify-center z-10",
                                                            isStepFinished(c.id) ? "bg-green-500" : isActive && canStart ? "bg-primary animate-pulse" : "bg-muted"
                                                        )}>
                                                            {isStepFinished(c.id) && <Check className="w-3 h-3 text-white" />}
                                                        </div>

                                                        <div className={cn(
                                                            "p-8 rounded-[2.5rem] border-2 transition-all flex flex-col gap-8 group",
                                                            isActive && canStart ? "bg-card border-primary/20 shadow-2xl shadow-primary/5 hover:border-primary/40" : "bg-muted/10 border-border/50 opacity-80"
                                                        )}>
                                                            <div className="space-y-4">
                                                                <div className="flex items-center flex-wrap gap-3">
                                                                    <span className="text-[10px] font-black uppercase text-primary/60 tracking-[0.2em]">Paso {originalIdx + 1}</span>
                                                                    <h3 className="font-black uppercase text-foreground tracking-tight text-xl">{c.titulo}</h3>

                                                                    {prog?.finalizado ? (() => {
                                                                        const pVal = Number(prog.puntaje ?? prog.puntos ?? prog.score ?? 0);
                                                                        const tVal = Number((prog.puntajeMaximo ?? prog.puntosMaximo ?? c.preguntas?.reduce((acc: number, q: any) => acc + (q.puntos || 0), 0)) || 0);
                                                                        return (
                                                                            <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-2">
                                                                                {c.esEvaluativo ? `Puntaje: ${Math.min(pVal, tVal > 0 ? tVal : pVal)}/${tVal}` : "Completado ✓"}
                                                                            </div>
                                                                        );
                                                                    })() : isActive && canStart ? (
                                                                        <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 animate-pulse">Disponible</span>
                                                                    ) : c.esObligatorio && (
                                                                        <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-2">
                                                                            <Lock className="w-3 h-3" /> Obligatorio
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: c.descripcion }} />

                                                                {/* Metadata row */}
                                                                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-muted-foreground tracking-widest uppercase">
                                                                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                                                                        <div className="flex items-center gap-2">
                                                                            <Calendar className="w-3.5 h-3.5 text-primary/60" />
                                                                            {start.toLocaleString('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                        <ArrowRight className="w-3 h-3 opacity-30" />
                                                                        <div className="flex items-center gap-2">
                                                                            <Clock className="w-3.5 h-3.5 text-primary/60" />
                                                                            {end.toLocaleString('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    </div>
                                                                    {prog?.limiteIntentos != null && (
                                                                        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border",
                                                                            (prog?.numeroIntentos || 0) >= prog.limiteIntentos
                                                                                ? "bg-red-500/10 border-red-500/20 text-red-500"
                                                                                : "bg-muted/30 border-border/50")}>
                                                                            <RotateCcw className="w-3 h-3" />
                                                                            {prog?.numeroIntentos || 0}/{prog.limiteIntentos} intentos
                                                                        </div>
                                                                    )}
                                                                    {!prog?.limiteIntentos && (prog?.numeroIntentos || 0) > 0 && (
                                                                        <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                                                                            <RotateCcw className="w-3 h-3" />
                                                                            {prog?.numeroIntentos || 0} intento{(prog?.numeroIntentos || 0) !== 1 ? 's' : ''}
                                                                        </div>
                                                                    )}
                                                                    {c.urlVideo && (
                                                                        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border",
                                                                            (prog?.videoCompletado || localVideosVistos[c.id])
                                                                                ? "bg-green-500/10 border-green-500/20 text-green-500"
                                                                                : "bg-red-500/10 border-red-500/20 text-red-400")}>
                                                                            <Video className="w-3 h-3" />
                                                                            {(prog?.videoCompletado || localVideosVistos[c.id]) ? 'Video Visto ✓' : 'Ver Video Primero'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Video del Cuestionario Embed */}
                                                            {c.urlVideo && (
                                                                <div className={cn(
                                                                    "w-full rounded-2xl overflow-hidden border-2 mb-2 transition-all shadow-lg",
                                                                    (prog?.videoCompletado || localVideosVistos[c.id]) ? "border-green-500/30" : "border-primary/20"
                                                                )}>
                                                                    <div className={cn(
                                                                        "px-4 py-2 flex items-center justify-between gap-3",
                                                                        (prog?.videoCompletado || localVideosVistos[c.id]) ? "bg-green-500/10" : "bg-primary/5"
                                                                    )}>
                                                                        <div className="flex items-center gap-2">
                                                                            <Video className={cn("w-4 h-4", (prog?.videoCompletado || localVideosVistos[c.id]) ? "text-green-500" : "text-primary")} />
                                                                            <span className={cn("text-[9px] font-black uppercase tracking-widest", (prog?.videoCompletado || localVideosVistos[c.id]) ? "text-green-500" : "text-primary")}>
                                                                                {(prog?.videoCompletado || localVideosVistos[c.id]) ? 'Vídeo completado' : 'Mira este vídeo para habilitar la evaluación'}
                                                                            </span>
                                                                        </div>
                                                                        {(prog?.videoCompletado || localVideosVistos[c.id]) && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                                    </div>
                                                                    <div className="relative w-full aspect-video">
                                                                        <YouTube
                                                                            videoId={extractYouTubeId(c.urlVideo)}
                                                                            className="absolute inset-0 w-full h-full"
                                                                            iframeClassName="w-full h-full"
                                                                            opts={{ height: '100%', width: '100%', playerVars: { rel: 0, modestbranding: 1 } }}
                                                                            onStateChange={(event) => {
                                                                                const timer = videoTimersRef.current[c.id] || { totalTime: 0, lastStart: null };
                                                                                if (event.data === 1) { timer.lastStart = Date.now(); }
                                                                                else if (timer.lastStart) {
                                                                                    timer.totalTime += (Date.now() - timer.lastStart) / 1000;
                                                                                    timer.lastStart = null;
                                                                                }
                                                                                videoTimersRef.current[c.id] = timer;
                                                                            }}
                                                                            onEnd={async (event) => {
                                                                                const timer = videoTimersRef.current[c.id] || { totalTime: 0, lastStart: null };
                                                                                if (timer.lastStart) {
                                                                                    timer.totalTime += (Date.now() - timer.lastStart) / 1000;
                                                                                    timer.lastStart = null;
                                                                                }
                                                                                const duration = event.target.getDuration();
                                                                                if (timer.totalTime < duration * 0.9) {
                                                                                    setVideoWarningModal(true);
                                                                                    videoTimersRef.current[c.id] = { totalTime: 0, lastStart: null };
                                                                                    event.target.seekTo(0);
                                                                                    return;
                                                                                }
                                                                                
                                                                                setLocalVideosVistos(prev => ({ ...prev, [c.id]: true }));
                                                                                
                                                                                try {
                                                                                    if (!c.preguntas || c.preguntas.length === 0) {
                                                                                        await handleCompletarSinPreguntas(c);
                                                                                    } else {
                                                                                        await eventoPublicoService.marcarVideoVisto(evento!.id, c.id, form.ci, form.fechaNacimiento);
                                                                                        const progUpdate = await eventoPublicoService.getProgreso(evento!.id, form.ci, form.fechaNacimiento);
                                                                                        setProgreso(progUpdate.progress);
                                                                                    }
                                                                                } catch (e) {
                                                                                    console.error("Error marking video seen:", e);
                                                                                }
                                                                                
                                                                                toast.success('¡Vídeo completado! ' + ((!c.preguntas || c.preguntas.length === 0) ? 'Paso finalizado.' : 'Evaluación habilitada.'));
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="w-full">
                                                                {(() => {
                                                                    const pVal = Number(prog?.puntaje ?? prog?.puntos ?? prog?.score ?? 0);
                                                                    const totalPuntosReal = c.preguntas?.reduce((acc: number, q: any) => acc + (q.puntos || 0), 0) || 0;
                                                                    let maxEsperado = totalPuntosReal;
                                                                    if (c.cantidadPreguntas && c.cantidadPreguntas > 0 && c.preguntas?.length > 0) {
                                                                        const puntosPromedio = totalPuntosReal / c.preguntas.length;
                                                                        maxEsperado = Math.round(puntosPromedio * c.cantidadPreguntas);
                                                                    }
                                                                    const tVal = Number((prog?.puntajeMaximo ?? prog?.puntosMaximo ?? maxEsperado) || 0);
                                                                    const nMin = c.notaMinima || (c.esEvaluativo ? Math.ceil(tVal * 0.75) : 0); // Default 75% si es evaluativo
                                                                    const isFinished = isStepFinished(c.id);
                                                                    const isAprobado = !!prog?.aprobado;
                                                                    const isPerfect = (prog?.nota ?? 0) >= 100 || isAprobado;
                                                                    const limitValue = prog?.limiteIntentos ?? c.limiteIntentos;
                                                                    const hasReachedLimit = limitValue != null && (prog?.numeroIntentos || 0) >= limitValue;

                                                                    // ==========================================
                                                                    // BLOQUE MAESTRO: PASO FINALIZADO (Video o Cuestionario)
                                                                    // ==========================================
                                                                    if (isFinished) {
                                                                        const isAprobado = !!prog?.aprobado;
                                                                        const isPerfect = (prog?.nota ?? 0) >= 100 || isAprobado;
                                                                        const sinPreguntas = !c.preguntas || c.preguntas.length === 0;
                                                                        const nMin = 75; // Nota mínima estándar

                                                                        return (
                                                                            <div className="flex flex-col gap-4">
                                                                                <div className={cn(
                                                                                    "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3",
                                                                                    sinPreguntas || isAprobado 
                                                                                        ? "bg-green-500/5 border-green-500/10 text-green-500" 
                                                                                        : "bg-amber-500/5 border-amber-500/10 text-amber-600"
                                                                                )}>
                                                                                    <div className={cn(
                                                                                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                                                                                        sinPreguntas || isAprobado ? "bg-green-500/10" : "bg-amber-500/10"
                                                                                    )}>
                                                                                        {sinPreguntas || isAprobado ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                                                                                    </div>
                                                                                    
                                                                                    <div className="text-center space-y-1">
                                                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                                                                                            {sinPreguntas ? 'Paso Completado' : (isAprobado ? 'Evaluación Aprobada' : 'Evaluación Pendiente')}
                                                                                        </p>
                                                                                        {!sinPreguntas && (
                                                                                            <p className="text-xl font-black tracking-tight">
                                                                                                {pVal} puntos de {tVal}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>

                                                                                    {!sinPreguntas && !isAprobado && !hasReachedLimit && (
                                                                                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 text-center max-w-[200px]">
                                                                                            Necesitas {nMin} puntos para aprobar. Tienes intentos disponibles.
                                                                                        </p>
                                                                                    )}
                                                                                </div>

                                                                                {/* Acciones para pasos finalizados */}
                                                                                <div className="flex flex-col gap-3">
                                                                                    {!sinPreguntas && !isPerfect && !hasReachedLimit && (
                                                                                        <button
                                                                                            onClick={() => handleEmpezarCuestionario(c)}
                                                                                            className="w-full h-14 rounded-2xl bg-amber-500 text-black font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-amber-500/30 hover:scale-[1.02] hover:bg-amber-400 transition-all flex items-center justify-center gap-3"
                                                                                        >
                                                                                            <RotateCcw className="w-4 h-4" />
                                                                                            Reintentar Evaluación
                                                                                        </button>
                                                                                    )}

                                                                                    {/* Botón de navegación al siguiente paso (Siempre visible si está terminado) */}
                                                                                    {idx < sortedCuestionarios.length - 1 && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const nextEl = document.getElementById(`step-${sortedCuestionarios[idx + 1].id}`);
                                                                                                nextEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                                            }}
                                                                                            className="w-full h-14 rounded-2xl bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center justify-center gap-2 border border-primary/20"
                                                                                        >
                                                                                            Continuar al siguiente paso
                                                                                            <ArrowRight className="w-4 h-4" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    // PRIORIDAD SENIOR: Si es el paso activo y se puede empezar, MOSTRAR BOTÓN SIEMPRE
                                                                    if (isActive && canStart && !hasReachedLimit) {
                                                                        const hasVideo = !!c.urlVideo;
                                                                        const sinPreguntas = !c.preguntas || c.preguntas.length === 0;
                                                                        const videoPendiente = hasVideo && !prog?.videoCompletado && !localVideosVistos[c.id];

                                                                        if (sinPreguntas && hasVideo && videoPendiente) {
                                                                            return (
                                                                                <div className="p-6 rounded-3xl bg-primary/[0.03] border border-dashed border-primary/20 flex flex-col items-center text-center gap-4">
                                                                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center rotate-3">
                                                                                        <Video className="w-7 h-7 text-primary" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs font-black uppercase text-primary tracking-[0.2em]">Video</p>
                                                                                        <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase leading-relaxed max-w-[200px]">Visualiza el contenido completo para desbloquear el siguiente módulo</p>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }

                                                                        const showPreview = !hasVideo && !sinPreguntas;

                                                                        return (
                                                                            <div className="flex flex-col gap-4 w-full">
                                                                                {showPreview && (
                                                                                    <div className="p-4 rounded-[1.5rem] bg-muted/20 border border-border/40 flex items-center gap-4">
                                                                                        <div className="w-10 h-10 rounded-xl bg-background shadow-sm flex items-center justify-center text-primary">
                                                                                            <FileText className="w-5 h-5" />
                                                                                        </div>
                                                                                        <div className="flex-1 text-left">
                                                                                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Resumen de Evaluación</p>
                                                                                            <p className="text-[11px] font-bold text-foreground/80 uppercase">
                                                                                                {c.preguntas?.length || 0} Preguntas • {c.limiteIntentos ? `${c.limiteIntentos} Intentos` : 'Intentos Ilimitados'}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                <button
                                                                                    disabled={!!videoPendiente}
                                                                                    onClick={() => sinPreguntas ? handleCompletarSinPreguntas(c) : handleEmpezarCuestionario(c)}
                                                                                    className={cn(
                                                                                        "w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-4",
                                                                                        videoPendiente
                                                                                            ? "bg-muted text-muted-foreground border-2 border-dashed border-border shadow-none opacity-50 cursor-not-allowed"
                                                                                            : isFinished
                                                                                                ? "bg-amber-500 text-black shadow-amber-500/30 hover:scale-[1.02] hover:bg-amber-400"
                                                                                                : "bg-primary text-white shadow-primary/30 hover:scale-[1.02] hover:bg-primary-500"
                                                                                    )}
                                                                                >
                                                                                    {videoPendiente 
                                                                                        ? (sinPreguntas ? 'Ver video para avanzar' : 'Ver video para evaluar') 
                                                                                        : (sinPreguntas ? 'Completar este paso' : (isFinished ? 'Reintentar Evaluación' : 'Realizar Evaluación'))}
                                                                                    {videoPendiente ? <Lock className="w-4 h-4 opacity-50" /> : <ArrowRight className="w-5 h-5" />}
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    if (!isFinished) {
                                                                        return (
                                                                            <div className="flex flex-col items-center gap-3">
                                                                                <div className="w-16 h-16 rounded-[1.5rem] bg-muted/50 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground/30">
                                                                                    {!canStart ? <Lock className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                                                                                </div>
                                                                                <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                                                                                    {!canStart ? "Bloqueado" : isUpcoming ? "Próximamente" : "Finalizado"}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}

                                            {(() => {
                                                const allMandatoryFinished = sortedCuestionarios.every(c => {
                                                    if (!c.esObligatorio) return true;
                                                    const prog = progreso.find(p => p.id === c.id);
                                                    const sinPreguntas = !c.preguntas || c.preguntas.length === 0;
                                                    const isPerfect = !c.esEvaluativo || (!!prog?.finalizado && (prog?.aprobado));
                                                    const hasReachedLimit = c.limiteIntentos != null && (prog?.numeroIntentos || 0) >= c.limiteIntentos;
                                                    return (prog?.finalizado && (isPerfect || hasReachedLimit)) || (sinPreguntas && (prog?.videoCompletado || localVideosVistos[c.id]));
                                                });
                                                if (allMandatoryFinished && sortedCuestionarios.length > 0) {
                                                    return (
                                                        <div className="mt-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20 relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                                <Trophy className="w-24 h-24 text-green-500 -rotate-12" />
                                                            </div>
                                                            <div className="relative z-10 flex flex-col items-center text-center gap-4">
                                                                <div className="w-20 h-20 rounded-[2rem] bg-green-500 shadow-xl shadow-green-500/40 flex items-center justify-center text-white animate-bounce">
                                                                    <PartyPopper className="w-10 h-10" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-xl font-black uppercase tracking-tighter text-green-600">¡Evento Completado!</h3>
                                                                    <p className="text-xs text-muted-foreground font-bold mt-1 uppercase max-w-[240px]">Has cumplido con todos los requisitos y evaluaciones del evento.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                )}{/* Afiche Principal */}
                                {evento.afiche && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-px flex-1 bg-border" />
                                            <h2 className="text-sm font-black uppercase text-muted-foreground tracking-widest">Información Visual</h2>
                                            <div className="h-px flex-1 bg-border" />
                                        </div>
                                        <div className="relative group rounded-[3rem] overflow-hidden border border-border shadow-2xl bg-black/50 backdrop-blur-sm p-4 md:p-8">
                                            <img src={getImageUrl(evento.afiche)} alt="Afiche del evento" className="w-full h-auto mx-auto max-w-[600px] rounded-2xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]" />
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    {evento.inscripcionAbierta && (
                                        <button onClick={() => setStep(inscripcion ? 'descargo' : 'identificacion')}
                                            className="group p-8 bg-card border border-border rounded-3xl font-black uppercase tracking-wide hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-start gap-5 shadow-sm hover:shadow-lg">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                                                {inscripcion ? <CheckCircle2 className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                                            </div>
                                            <div className="text-left text-foreground">
                                                <div className="text-xl group-hover:text-primary transition-colors tracking-tight">
                                                    {inscripcion ? 'Ver mi Comprobante' : 'Inscripción Oficial'}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-medium normal-case mt-1 max-w-[90%] tracking-normal">
                                                    {inscripcion ? 'Ya te encuentras registrado. Haz clic para ver tu certificado.' : 'Garantiza tu participación en esta actividad académica.'}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 self-end text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    )}
                                    {evento.asistencia && (
                                        <button onClick={() => setStep('asistencia')}
                                            className="group p-8 bg-card border border-border rounded-3xl font-black uppercase tracking-wide hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-start gap-5 shadow-sm hover:shadow-lg">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <div className="text-left text-foreground">
                                                <div className="text-xl group-hover:text-primary transition-colors tracking-tight">Registro de Asistencia</div>
                                                <div className="text-xs text-muted-foreground font-medium normal-case mt-1 max-w-[90%] tracking-normal">Valida y confirma tu asistencia mediante código oficial.</div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 self-end text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    )}

                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP IDENTIFICACION ── */}
                        {step === 'identificacion' && (
                            <motion.div key="id" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-2xl mx-auto">
                                <div className="bg-card border border-border rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
                                    {/* Decorative gradient background */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

                                    <div className="relative z-10 space-y-10">
                                        <div className="text-center space-y-3">
                                            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                                <User className="w-10 h-10 text-primary" />
                                            </div>
                                            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Inscripción</h2>
                                            <p className="text-muted-foreground max-w-md mx-auto">Valida tus datos para continuar con la inscripción.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4 text-primary" />
                                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Documento de Identidad</label>
                                                </div>
                                                <div className="relative group">
                                                    <input
                                                        type="text"
                                                        placeholder="Ej. 1234567"
                                                        value={form.ci}
                                                        onChange={e => setForm(p => ({ ...p, ci: e.target.value }))}
                                                        className="w-full h-16 px-6 pt-2 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary focus:bg-card outline-none font-black text-xl text-foreground transition-all group-hover:bg-muted/50"
                                                    />
                                                    <div className="absolute top-2 left-6 text-[9px] font-bold text-muted-foreground/50 uppercase">Nro. Carnet</div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Fecha de Nacimiento</label>
                                                </div>
                                                <div className="relative group">
                                                    <input
                                                        type="date"
                                                        value={form.fechaNacimiento}
                                                        onChange={e => setForm(p => ({ ...p, fechaNacimiento: e.target.value }))}
                                                        className="w-full h-16 px-6 pt-2 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary focus:bg-card outline-none font-black text-lg text-foreground transition-all group-hover:bg-muted/50"
                                                    />
                                                    <div className="absolute top-2 left-6 text-[9px] font-bold text-muted-foreground/50 uppercase">Día / Mes / Año</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                            <button
                                                onClick={() => setStep('info')}
                                                className="h-16 px-8 rounded-2xl border-2 border-border font-black uppercase text-xs tracking-widest text-muted-foreground hover:bg-muted/20 transition-all flex items-center justify-center gap-3"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleBuscarPersona}
                                                disabled={!form.ci || !form.fechaNacimiento || submitting}
                                                className="flex-1 h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                            >
                                                {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                                                    <>
                                                        Validar y Continuar
                                                        <ArrowRight className="w-5 h-5" />
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3 justify-center p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                                            <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                            <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-tight text-center">Asegúrate de ingresar tus datos correctamente para recuperar tu progreso.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP INSCRIPCION ── */}
                        {step === 'inscripcion' && (
                            <motion.div key="insc" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-card border border-border rounded-3xl p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Datos del Participante</h2>
                                        <p className="text-sm text-muted-foreground mt-1">{persona ? 'Tus datos fueron encontrados. Verifica o actualiza.' : 'Completa tus datos para inscribirte.'}</p>
                                    </div>
                                    <div className="px-4 py-2 rounded-2xl bg-primary/5 border border-primary/20 text-right">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Identificación</p>
                                        <p className="font-black text-primary">{form.ci}{form.complemento ? `-${form.complemento}` : ''}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nombre 1 <span className="text-red-500">*</span></label>
                                        <input type="text" placeholder="Primer nombre" value={form.nombre1}
                                            onChange={e => {
                                                setForm(p => ({ ...p, nombre1: e.target.value }));
                                                if (errores.nombre1) setErrores(prev => ({ ...prev, nombre1: false }));
                                            }}
                                            className={cn(
                                                "w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 outline-none font-bold text-foreground uppercase transition-all",
                                                errores.nombre1 ? "border-red-500 bg-red-500/5" : "border-transparent focus:border-primary"
                                            )} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nombre 2</label>
                                        <input type="text" placeholder="Segundo nombre (opcional)" value={form.nombre2}
                                            onChange={e => setForm(p => ({ ...p, nombre2: e.target.value }))}
                                            className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-bold text-foreground uppercase transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Apellido 1 <span className="text-red-500">*</span></label>
                                        <input type="text" placeholder="Primer apellido" value={form.apellido1}
                                            onChange={e => {
                                                setForm(p => ({ ...p, apellido1: e.target.value }));
                                                if (errores.apellido1) setErrores(prev => ({ ...prev, apellido1: false }));
                                            }}
                                            className={cn(
                                                "w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 outline-none font-bold text-foreground uppercase transition-all",
                                                errores.apellido1 ? "border-red-500 bg-red-500/5" : "border-transparent focus:border-primary"
                                            )} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Apellido 2</label>
                                        <input type="text" placeholder="Segundo apellido (opcional)" value={form.apellido2}
                                            onChange={e => setForm(p => ({ ...p, apellido2: e.target.value }))}
                                            className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-bold text-foreground uppercase transition-all" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Género</label>
                                        <select value={form.generoId} onChange={e => setForm(p => ({ ...p, generoId: e.target.value }))}
                                            className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all">
                                            {generos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Modalidad de Participación <span className="text-red-500">*</span></label>
                                        <select value={form.modalidadId}
                                            onChange={e => {
                                                setForm(p => ({ ...p, modalidadId: e.target.value }));
                                                if (errores.modalidadId) setErrores(prev => ({ ...prev, modalidadId: false }));
                                            }}
                                            className={cn(
                                                "w-full h-14 px-6 rounded-2xl bg-primary/5 border-2 focus:border-primary outline-none font-bold text-primary transition-all",
                                                errores.modalidadId ? "border-red-500 bg-red-500/5" : "border-primary/20"
                                            )}>
                                            <option value="">Seleccionar modalidad...</option>
                                            {allModalidades
                                                .filter(m => (evento?.modalidadIds || '').includes(m.id))
                                                .map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)
                                            }
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Correo electrónico</label>
                                        <input type="email" placeholder="correo@ejemplo.com" value={form.correo}
                                            onChange={e => setForm(p => ({ ...p, correo: e.target.value }))}
                                            className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Celular</label>
                                        <input type="tel" placeholder="70000000" value={form.celular}
                                            onChange={e => setForm(p => ({ ...p, celular: e.target.value }))}
                                            className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all" />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Departamento origen (Inscripción) <span className="text-red-500">*</span></label>
                                        <select value={form.departamentoId}
                                            onChange={e => {
                                                setForm(p => ({ ...p, departamentoId: e.target.value }));
                                                if (errores.departamentoId) setErrores(prev => ({ ...prev, departamentoId: false }));
                                            }}
                                            className={cn(
                                                "w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 outline-none font-bold text-foreground transition-all",
                                                errores.departamentoId ? "border-red-500 bg-red-500/5" : "border-transparent focus:border-primary"
                                            )}>
                                            <option value="">Seleccionar departamento...</option>
                                            {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                        </select>
                                    </div>

                                    {/* CAMPOS EXTRAS */}
                                    {evento.camposExtras?.map((campo: any) => (
                                        <div key={campo.id} className="md:col-span-2 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <ClipboardList className="w-4 h-4 text-primary" />
                                                </div>
                                                <label className="text-[11px] font-black uppercase text-foreground tracking-widest pl-1">
                                                    {campo.label} {campo.esObligatorio && <span className="text-red-500">*</span>}
                                                </label>
                                            </div>

                                            {campo.tipo === 'TEXTO' && (
                                                <div className="relative group">
                                                    <input
                                                        type="text"
                                                        placeholder={`Ingrese ${campo.label.toLowerCase()}...`}
                                                        value={(form.respuestasExtras ?? {})[campo.id] || ''}
                                                        onChange={e => {
                                                            setForm(f => ({
                                                                ...f,
                                                                respuestasExtras: { ...f.respuestasExtras, [campo.id]: e.target.value }
                                                            }));
                                                            if (errores[campo.id]) setErrores(prev => ({ ...prev, [campo.id]: false }));
                                                        }}
                                                        className={cn(
                                                            "w-full h-14 px-6 rounded-2xl bg-muted/40 border-2 outline-none font-bold text-foreground transition-all group-hover:bg-muted/60",
                                                            errores[campo.id] ? "border-red-500 bg-red-500/5" : "border-transparent focus:border-primary/50"
                                                        )}
                                                    />
                                                </div>
                                            )}

                                            {campo.tipo === 'BOOLEAN' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {[
                                                        { val: true, label: 'SÍ', icon: Check },
                                                        { val: false, label: 'NO', icon: X }
                                                    ].map(item => {
                                                        const isSel = (form.respuestasExtras ?? {})[campo.id] === item.val;
                                                        return (
                                                            <button
                                                                key={item.label}
                                                                onClick={() => {
                                                                    setForm(f => ({
                                                                        ...f,
                                                                        respuestasExtras: { ...f.respuestasExtras, [campo.id]: item.val }
                                                                    }));
                                                                    if (errores[campo.id]) setErrores(prev => ({ ...prev, [campo.id]: false }));
                                                                }}
                                                                className={cn(
                                                                    "h-14 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                                                                    isSel ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" :
                                                                        errores[campo.id] ? "border-red-500 bg-red-500/5 text-red-500" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/30"
                                                                )}
                                                            >
                                                                <item.icon className={cn("w-4 h-4", isSel ? "text-white" : "text-muted-foreground")} />
                                                                {item.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {(campo.tipo === 'SINGLE_SELECT' || campo.tipo === 'MULTIPLE_SELECT') && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {(() => {
                                                        let opts: string[] = [];
                                                        try {
                                                            const raw = campo.opciones;
                                                            if (typeof raw === 'string') {
                                                                const parsed = JSON.parse(raw);
                                                                // Si lo parcial sigue siendo un string (caso double stringify), intentamos de nuevo
                                                                if (typeof parsed === 'string') {
                                                                    opts = JSON.parse(parsed);
                                                                } else if (Array.isArray(parsed)) {
                                                                    opts = parsed;
                                                                }
                                                            } else if (Array.isArray(raw)) {
                                                                opts = raw;
                                                            }
                                                        } catch (e) {
                                                            // Si no es JSON válido, intentar separar por comas como respaldo
                                                            if (typeof campo.opciones === 'string') {
                                                                opts = campo.opciones.split(',').map((o: string) => o.trim()).filter((o: string) => o !== '');
                                                            }
                                                        }

                                                        if (!Array.isArray(opts)) opts = [];

                                                        return opts.map((opt: string) => {
                                                            const isSelected = campo.tipo === 'SINGLE_SELECT'
                                                                ? (form.respuestasExtras ?? {})[campo.id] === opt
                                                                : ((form.respuestasExtras ?? {})[campo.id] || []).includes(opt);
                                                            return (
                                                                <button
                                                                    key={opt}
                                                                    onClick={() => {
                                                                        setForm(f => {
                                                                            if (campo.tipo === 'SINGLE_SELECT') {
                                                                                return { ...f, respuestasExtras: { ...f.respuestasExtras, [campo.id]: opt } };
                                                                            }
                                                                            const current = Array.isArray(f.respuestasExtras[campo.id]) ? f.respuestasExtras[campo.id] : [];
                                                                            const next = current.includes(opt) ? current.filter((x: any) => x !== opt) : [...current, opt];
                                                                            return { ...f, respuestasExtras: { ...f.respuestasExtras, [campo.id]: next } };
                                                                        });
                                                                        if (errores[campo.id]) setErrores(prev => ({ ...prev, [campo.id]: false }));
                                                                    }}
                                                                    className={cn(
                                                                        "px-5 py-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group",
                                                                        isSelected ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20" :
                                                                            errores[campo.id] ? "border-red-500 bg-red-500/5" : "border-border bg-muted/10 text-muted-foreground hover:border-primary/20"
                                                                    )}
                                                                >
                                                                    <span className={cn("text-xs font-bold", isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>{opt}</span>
                                                                    {isSelected ? (
                                                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                                            <Check className="w-3 h-3 text-white" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-5 h-5 rounded-full border-2 border-border group-hover:border-primary/30" />
                                                                    )}
                                                                </button>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setStep('identificacion')} className="h-14 px-6 rounded-2xl text-xs font-black uppercase text-muted-foreground hover:text-foreground transition-all">
                                        Volver
                                    </button>
                                    <button onClick={handleInscribirse} disabled={!form.nombre1 || !form.apellido1 || !form.modalidadId || !form.departamentoId || submitting}
                                        className="flex-1 h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                                        Vista Previa
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP PREVIEW ── */}
                        {step === 'preview' && (
                            <motion.div key="prev" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-2xl mx-auto space-y-6">
                                <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24" />

                                    <div className="relative z-10 space-y-8">
                                        <div className="text-center space-y-2">
                                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                                <ClipboardList className="w-8 h-8 text-primary" />
                                            </div>
                                            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Vista Previa</h2>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Revisa tus datos antes de confirmar</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Nombre Completo</span>
                                                    <p className="font-bold text-foreground uppercase">{form.nombre1} {form.nombre2} {form.apellido1} {form.apellido2}</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Cédula de Identidad</span>
                                                    <p className="font-bold text-foreground font-mono">{form.ci} {form.complemento ? ` - ${form.complemento}` : ''} {form.expedido}</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Contacto</span>
                                                    <p className="font-bold text-foreground">{form.celular} • {form.correo || 'S/N'}</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Modalidad</span>
                                                    <p className="font-bold text-primary">
                                                        {allModalidades.find(m => m.id === form.modalidadId)?.nombre || 'No seleccionada'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Campos extras preview */}
                                            {(evento?.camposExtras?.length ?? 0) > 0 && (
                                                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                                                    <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                                        <Info className="w-3 h-3" /> Información Adicional
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {evento?.camposExtras?.map((campo: any) => {
                                                            const valor = form.respuestasExtras[campo.id];
                                                            let displayValor = valor;
                                                            if (Array.isArray(valor)) displayValor = valor.join(', ');
                                                            if (typeof valor === 'boolean') displayValor = valor ? 'SÍ' : 'NO';

                                                            return (
                                                                <div key={campo.id} className="flex flex-col border-b border-primary/5 pb-2 last:border-0">
                                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{campo.label}</span>
                                                                    <p className="font-bold text-foreground text-sm uppercase">{displayValor || '—'}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button
                                                onClick={() => setStep('inscripcion')}
                                                className="h-14 px-8 rounded-2xl border-2 border-border font-black uppercase text-xs tracking-widest text-muted-foreground hover:bg-muted/20 transition-all flex items-center justify-center gap-3"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Corregir Datos
                                            </button>
                                            <button
                                                onClick={handleConfirmarFinalInscripcion}
                                                className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                                            >
                                                Confirmar y Guardar
                                                <CheckCircle2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP ASISTENCIA ── */}
                        {step === 'asistencia' && (
                            <motion.div key="asist" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-card border border-border rounded-3xl p-8 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Registrar Asistencia</h2>
                                    <p className="text-sm text-muted-foreground mt-1">Ingresa tu CI, fecha de nacimiento y el código que te dieron en la transmisión</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">CI</label>
                                        <input type="text" placeholder="12345678" value={form.ci}
                                            onChange={e => setForm(p => ({ ...p, ci: e.target.value }))}
                                            className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-black text-foreground transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Fecha de Nacimiento</label>
                                        <input type="date" value={form.fechaNacimiento}
                                            onChange={e => setForm(p => ({ ...p, fechaNacimiento: e.target.value }))}
                                            className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-black text-foreground transition-all" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Código de Asistencia</label>
                                        <input type="text" placeholder="Ej. PROFE2024" value={form.codigoAsistencia}
                                            onChange={e => setForm(p => ({ ...p, codigoAsistencia: e.target.value.toUpperCase() }))}
                                            className="w-full h-16 px-8 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-black text-xl text-center tracking-[0.4em] text-foreground transition-all uppercase" />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setStep('info')} className="h-14 px-6 rounded-2xl text-xs font-black uppercase text-muted-foreground hover:text-foreground transition-all">
                                        Volver
                                    </button>
                                    <button onClick={handleRegistrarAsistencia} disabled={!form.ci || !form.fechaNacimiento || !form.codigoAsistencia || submitting}
                                        className="flex-1 h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                                        {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Registrar Asistencia
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP CUESTIONARIO ── */}
                        {step === 'cuestionario' && cuestionarioActivo && (
                            <motion.div key="cues" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                {/* Header cuestionario */}
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h2 className="text-2xl font-black uppercase text-foreground">{cuestionarioActivo.titulo}</h2>
                                        <p className="text-sm text-muted-foreground mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                            <span className="font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md">
                                                {persona?.nombre1} {persona?.nombre2} {persona?.apellido1} {persona?.apellido2}
                                            </span>
                                            <span className="hidden sm:inline opacity-50">•</span>
                                            <span className="font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md">{cuestionarioActivo.preguntas.length} preguntas</span>
                                        </p>
                                    </div>
                                    {cuestionarioActivo.tiempoMaximo && (
                                        <Timer_Cuestionario
                                            segundos={cuestionarioActivo.tiempoMaximo * 60}
                                            startTime={startTime || Date.now()}
                                            onExpire={() => setTimerExpired(true)}
                                        />
                                    )}
                                </div>

                                {/* ── VIDEO OBLIGATORIO ── */}
                                {cuestionarioActivo.urlVideo && (() => {
                                    const ytId = extractYouTubeId(cuestionarioActivo.urlVideo);
                                    const progCues = progreso?.find((p: any) => p.id === cuestionarioActivo.id);
                                    const videoVisto = progCues?.videoCompletado || localVideosVistos[cuestionarioActivo.id];

                                    // Si ya se vio, no lo mostramos de nuevo para no estorbar
                                    if (videoVisto) return null;

                                    const handleVideoEnd = async () => {
                                        if (videoVisto) return;
                                        try {
                                            await eventoPublicoService.marcarVideoVisto(
                                                evento!.id,
                                                cuestionarioActivo.id,
                                                form.ci,
                                                form.fechaNacimiento
                                            );
                                            const prog = await eventoPublicoService.getProgreso(evento!.id, form.ci, form.fechaNacimiento);
                                            setProgreso(prog.progress);
                                            
                                            // Lógica Senior: Si no hay preguntas, el paso se completa al ver el video
                                            if (!cuestionarioActivo.preguntas || cuestionarioActivo.preguntas.length === 0) {
                                                await handleCompletarSinPreguntas(cuestionarioActivo);
                                                setStep('info'); // Regresar a la lista con el siguiente paso desbloqueado
                                            } else {
                                                toast.success('¡Video completado! Ya puedes responder el cuestionario.');
                                            }
                                        } catch (e) {
                                            console.error('Error marcando video visto:', e);
                                        }
                                    };

                                    return (
                                        <div className={cn(
                                            "bg-card border-2 rounded-3xl overflow-hidden",
                                            videoVisto ? "border-green-500/30" : "border-primary/40"
                                        )}>
                                            <div className={cn(
                                                "px-6 py-3 flex items-center justify-between gap-4",
                                                videoVisto ? "bg-green-500/10" : "bg-primary/10"
                                            )}>
                                                <div className="flex items-center gap-3">
                                                    <Video className={cn("w-5 h-5", videoVisto ? "text-green-500" : "text-primary")} />
                                                    <span className={cn("text-xs font-black uppercase tracking-widest", videoVisto ? "text-green-500" : "text-primary")}>
                                                        {videoVisto ? '✓ Video Visto — Cuestionario Desbloqueado' : 'Ve el video completo para continuar'}
                                                    </span>
                                                </div>
                                                {videoVisto && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                                            </div>
                                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                                <YouTube
                                                    videoId={ytId}
                                                    className="absolute inset-0 w-full h-full"
                                                    iframeClassName="w-full h-full"
                                                    opts={{ height: '100%', width: '100%', playerVars: { rel: 0 } }}
                                                    onEnd={handleVideoEnd}
                                                />
                                            </div>
                                            {!videoVisto && (
                                                <div className="px-6 py-3 bg-amber-500/10 border-t border-amber-500/20 text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                                    Debes terminar de ver el video para acceder al cuestionario
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Pregunta actual — solo si no hay video obligatorio pendiente */}
                                {(() => {
                                    const progCues = progreso?.find((p: any) => p.id === cuestionarioActivo.id);
                                    const videoVisto = !cuestionarioActivo.urlVideo || progCues?.videoCompletado || localVideosVistos[cuestionarioActivo.id];
                                    if (!videoVisto) return (
                                        <div className="text-center py-10 text-muted-foreground font-bold text-sm">
                                            Termina de ver el video de arriba para acceder a las preguntas.
                                        </div>
                                    );
                                    return null;
                                })()}

                                {/* Pregunta actual */}
                                {(() => {
                                    const progCues = progreso?.find((p: any) => p.id === cuestionarioActivo.id);
                                    const videoVisto = !cuestionarioActivo.urlVideo || progCues?.videoCompletado || localVideosVistos[cuestionarioActivo.id];
                                    if (!videoVisto) return null;
                                    return cuestionarioActivo.preguntas.length > 0 && (() => {
                                        const preg = cuestionarioActivo.preguntas[preguntaIdx];
                                        return (
                                            <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">Pregunta {preguntaIdx + 1} de {cuestionarioActivo.preguntas.length} • {preg.puntos} pt{preg.puntos !== 1 ? 's' : ''}</span>
                                                        <div className="text-xl font-bold text-foreground mt-2 prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: preg.texto }} />
                                                    </div>
                                                </div>

                                                {/* Opciones según tipo */}
                                                <div className="space-y-3">
                                                    {(preg.tipo === 'SINGLE' || preg.tipo === 'TRUE_FALSE') && preg.opciones.map(opt => (
                                                        <button key={opt.id} onClick={() => setRespuestas(r => ({ ...r, [preg.id]: opt.id }))}
                                                            className={`w-full flex items-center gap-4 px-6 h-14 rounded-2xl border-2 font-bold text-sm text-left transition-all ${respuestas[preg.id] === opt.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/20 text-foreground hover:border-primary/40'}`}>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${respuestas[preg.id] === opt.id ? 'border-primary' : 'border-muted-foreground'}`}>
                                                                {respuestas[preg.id] === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                            </div>
                                                            {opt.texto}
                                                        </button>
                                                    ))}

                                                    {preg.tipo === 'MULTIPLE' && preg.opciones.map(opt => {
                                                        const selected: string[] = respuestas[preg.id] || [];
                                                        const isChecked = selected.includes(opt.id);
                                                        return (
                                                            <button key={opt.id} onClick={() => setRespuestas(r => ({ ...r, [preg.id]: isChecked ? selected.filter(x => x !== opt.id) : [...selected, opt.id] }))}
                                                                className={`w-full flex items-center gap-4 px-6 h-14 rounded-2xl border-2 font-bold text-sm text-left transition-all ${isChecked ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/20 text-foreground hover:border-primary/40'}`}>
                                                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 ${isChecked ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                                                    {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                                </div>
                                                                {opt.texto}
                                                            </button>
                                                        );
                                                    })}

                                                    {preg.tipo === 'TEXTO' && (
                                                        <textarea placeholder="Escribe tu respuesta aquí..."
                                                            value={respuestas[preg.id] || ''}
                                                            onChange={e => setRespuestas(r => ({ ...r, [preg.id]: e.target.value }))}
                                                            className="w-full p-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none text-foreground font-medium resize-none h-32 transition-all"
                                                        />
                                                    )}
                                                </div>

                                                {/* Navegación */}
                                                <div className="flex flex-col gap-6 pt-4 border-t border-border">
                                                    {/* Sync Status Mobile/Desktop */}
                                                    <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-muted/30">
                                                        <div className="flex items-center gap-2">
                                                            {lastSavedStatus === 'saved' ? (
                                                                <>
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Respuestas seguras en este dispositivo</span>
                                                                </>
                                                            ) : lastSavedStatus === 'saving' ? (
                                                                <>
                                                                    <RefreshCw size={10} className="text-primary animate-spin" />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">Sincronizando...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/80">Esperando cambios...</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">Local Storage Active</span>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <button onClick={() => setPreguntaIdx(i => Math.max(0, i - 1))} disabled={preguntaIdx === 0}
                                                            className="flex items-center gap-2 h-12 px-6 rounded-2xl bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 font-bold text-xs uppercase transition-all">
                                                            <ChevronLeft className="w-4 h-4" /> Anterior
                                                        </button>

                                                        {/* Progress dots */}
                                                        <div className="hidden sm:flex gap-1.5">
                                                            {cuestionarioActivo.preguntas.map((_, i) => (
                                                                <button key={i} onClick={() => setPreguntaIdx(i)}
                                                                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === preguntaIdx ? 'bg-primary w-5' : respuestas[cuestionarioActivo.preguntas[i].id] ? 'bg-primary/40' : 'bg-muted'}`} />
                                                            ))}
                                                        </div>

                                                        {preguntaIdx < cuestionarioActivo.preguntas.length - 1 ? (
                                                            <button onClick={() => setPreguntaIdx(i => i + 1)}
                                                                className="flex items-center gap-2 h-12 px-6 rounded-2xl bg-primary text-white font-bold text-xs uppercase hover:opacity-90 transition-all">
                                                                Siguiente <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleEnviarCuestionario()} disabled={submitting}
                                                                className="flex items-center gap-2 h-14 md:h-12 px-8 rounded-2xl bg-green-600 text-white font-black text-xs uppercase hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-green-600/20">
                                                                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                                Enviar Todo
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                })()}
                            </motion.div>
                        )}

                        {/* ── STEP RESULTADO ── */}
                        {step === 'resultado' && resultado && (
                            <motion.div key="res" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                {resultado.offline ? (
                                    <div className="p-8 rounded-3xl text-center space-y-4 bg-amber-500/10 border-2 border-amber-500/30">
                                        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-amber-500/20">
                                            <WifiOff className="w-10 h-10 text-amber-500" />
                                        </div>
                                        <h2 className="text-2xl font-black text-foreground">Guardado Localmente</h2>
                                        <p className="text-sm text-muted-foreground">{resultado.mensaje}</p>
                                        <div className="flex items-center justify-center gap-2 text-amber-500 font-bold animate-pulse">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Esperando conexión...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={cn(
                                            "p-8 rounded-3xl text-center space-y-4 border-2 transition-all duration-500",
                                            (resultado.puntaje ?? 0) >= (resultado.puntajeMaximo ?? 1)
                                                ? "bg-primary/5 border-primary/20 shadow-2xl shadow-primary/5"
                                                : "bg-amber-500/5 border-amber-500/20"
                                        )}>
                                            <div className={cn(
                                                "w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-colors",
                                                resultado.esEvaluativo === false
                                                    ? "bg-primary/10"
                                                    : (resultado.puntaje ?? 0) >= (resultado.puntajeMaximo ?? 1) ? "bg-primary/10" : "bg-amber-500/10"
                                            )}>
                                                {(resultado.puntaje ?? 0) >= (resultado.puntajeMaximo ?? 1) ? (
                                                    <Trophy className="w-10 h-10 text-primary" />
                                                ) : (
                                                    <AlertTriangle className="w-10 h-10 text-amber-500" />
                                                )}
                                            </div>
                                            <h2 className="text-4xl font-black text-foreground">
                                                {resultado.esEvaluativo === false ? 'Completado' : `${Math.min(resultado.nota ?? 0, 100)}/100`}
                                            </h2>
                                            <p className={cn(
                                                "text-xl font-black uppercase tracking-widest",
                                                resultado.esEvaluativo === false
                                                    ? "text-primary"
                                                    : (resultado.puntaje ?? 0) >= (resultado.puntajeMaximo ?? 1) ? "text-primary" : "text-amber-500"
                                            )}>
                                                {resultado.esEvaluativo === false
                                                    ? '\u00a1Formulario Enviado!'
                                                    : (resultado.nota ?? 0) >= 75 ? '\u00a1Aprobado!' : 'Evaluaci\u00f3n Pendiente'}
                                            </p>
                                            {resultado.esEvaluativo !== false && (
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-muted-foreground font-bold font-mono">
                                                        {Math.min(resultado.puntaje ?? 0, (resultado.puntajeMaximo || 1) > 0 ? resultado.puntajeMaximo! : (resultado.puntaje ?? 0))} puntos de {(resultado.puntajeMaximo ?? 0)}
                                                    </p>
                                                    {(resultado.nota ?? 0) < 75 && (
                                                        <p className="text-[11px] text-amber-600 font-black uppercase tracking-tight bg-amber-500/10 py-2 px-4 rounded-xl mt-2 animate-pulse">
                                                            Debes obtener al menos 75/100 puntos para obtener tu comprobante
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6 bg-card border border-border rounded-2xl space-y-3">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] border-b border-border pb-2">Información del Cuestionario</p>
                                            <div className="text-sm text-foreground leading-relaxed prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: cuestionarioActivo?.descripcion || '' }} />
                                        </div>

                                        {resultado.esEvaluativo !== false && (resultado.nota ?? 0) >= 75 ? (
                                            <button
                                                onClick={() => setStep('descargo')}
                                                className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                            >
                                                <Download className="w-4 h-4" /> Descargar Comprobante
                                            </button>
                                        ) : resultado.esEvaluativo === false ? (
                                            // Formulario no evaluativo completado exitosamente
                                            <button
                                                onClick={() => setStep('descargo')}
                                                className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                            >
                                                <Download className="w-4 h-4" /> Descargar Comprobante
                                            </button>
                                        ) : (() => {
                                            const progCues = progreso?.find((p: any) => p.id === cuestionarioActivo?.id);
                                            const limitValue = progCues?.limiteIntentos ?? cuestionarioActivo?.limiteIntentos;
                                            const hasReachedLimit = limitValue != null && (progCues?.numeroIntentos || 0) >= limitValue;

                                            if (hasReachedLimit) {
                                                return (
                                                    <div className="flex flex-col items-center gap-3 p-6 bg-red-500/5 rounded-2xl border-2 border-dashed border-red-500/20">
                                                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                                            <AlertCircle className="w-6 h-6" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em] text-center">
                                                            Intentos Agotados para esta Evaluación
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <button
                                                    onClick={handleReintentar}
                                                    className="w-full h-14 rounded-2xl bg-amber-500 text-black font-black text-xs uppercase tracking-widest hover:bg-amber-400 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20"
                                                >
                                                    <RefreshCw className="w-4 h-4" /> Reintentar Evaluación {limitValue != null && `(${(limitValue ?? 0) - (progCues?.numeroIntentos || 0)} restantes)`}
                                                </button>
                                            );
                                        })()}
                                    </>
                                )}


                                <button
                                    onClick={() => setStep('info')}
                                    className="w-full h-14 rounded-2xl bg-muted text-muted-foreground font-black text-xs uppercase hover:text-foreground transition-all flex items-center justify-center gap-2"
                                >
                                    <Info className="w-4 h-4" /> Ver Detalles del Evento
                                </button>

                                <button onClick={() => handleReset()} className="w-full h-14 rounded-2xl border-2 border-dashed border-border text-muted-foreground/60 font-black text-xs uppercase hover:text-foreground hover:border-foreground/20 transition-all">
                                    Registrar otra persona
                                </button>
                            </motion.div>
                        )}

                        {/* ── STEP DESCARGO ── */}
                        {step === 'descargo' && (
                            <motion.div key="desc" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <Descargo
                                    tipo={resultado ? 'cuestionario' : evento.asistencia ? 'asistencia' : 'inscripcion'}
                                    persona={persona}
                                    evento={evento}
                                    resultado={resultado}
                                    inscripcionId={inscripcion?.id}
                                />
                                <div className="flex flex-col gap-3 mt-6">
                                    <button
                                        onClick={() => setStep('info')}
                                        className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Volver al Inicio del Evento
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleReset()}
                                            className="flex-1 h-14 rounded-2xl bg-muted text-muted-foreground font-black text-xs uppercase hover:text-foreground transition-all"
                                        >
                                            Registrar otro
                                        </button>
                                        <button
                                            onClick={() => router.back()}
                                            className="px-8 h-14 rounded-2xl bg-muted/40 text-muted-foreground font-black text-xs uppercase hover:text-foreground transition-all"
                                        >
                                            Salir
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* ── MODAL: Confirmación de Inscripción ── */}
                    <AnimatePresence>
                        {confirmInscripcionModal && (
                            <motion.div
                                key="confirm-inscripcion"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
                                onClick={() => setConfirmInscripcionModal(false)}
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.85, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, y: 20 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                    className="bg-card border-2 border-primary/30 rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl shadow-primary/10 space-y-8 text-center"
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                    <div className="w-20 h-20 rounded-[1.8rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto">
                                        <AlertTriangle className="w-10 h-10 text-primary" />
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
                                            {isPersonaExistente ? '¿Confirmar Edición?' : '¿Confirmar Inscripción?'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {isPersonaExistente ? (
                                                <>¿Estás seguro de <strong>{'\u00e9'}ditar</strong> tus datos? Revisa bien antes de continuar por si te equivocaste.</>
                                            ) : (
                                                <>¿Estás seguro de confirmar? Una vez finalizado <strong>no se podr{'\u00e1'} editar</strong> posteriormente tus datos personales.</>
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleInscribirseAction}
                                            disabled={submitting}
                                            className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                                        >
                                            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Sí, Confirmar Registro
                                        </button>
                                        <button
                                            onClick={() => setConfirmInscripcionModal(false)}
                                            className="w-full h-14 rounded-2xl bg-muted text-muted-foreground font-black text-xs uppercase hover:text-foreground transition-all flex items-center justify-center gap-2"
                                        >
                                            No, Volver a Revisar
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>


            </div >

            {/* ── MODAL: No puedes adelantar el video ── */}
            <AnimatePresence>
                {videoWarningModal && (
                    <motion.div
                        key="video-warning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
                        onClick={() => setVideoWarningModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 20 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                            className="bg-card border-2 border-red-500/30 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl shadow-red-500/10 space-y-6 text-center"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <div className="w-20 h-20 rounded-[1.5rem] bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mx-auto">
                                <Video className="w-9 h-9 text-red-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
                                    Video Incompleto
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    <strong className="text-red-400">No puedes adelantar el v&iacute;deo.</strong><br />
                                    Debes verlo completo para habilitar la evaluaci&oacute;n. El v&iacute;deo se ha reiniciado desde el principio.
                                </p>
                            </div>
                            <button
                                onClick={() => setVideoWarningModal(false)}
                                className="w-full h-12 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-400 transition-all"
                            >
                                Entendido, ver&eacute; el v&iacute;deo completo
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── MODAL: Asistencia ya registrada ── */}
            <AnimatePresence>
                {yaRegistradaModal && (
                    <motion.div
                        key="already-registered"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
                        onClick={() => setYaRegistradaModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 20 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                            className="bg-card border-2 border-primary/30 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl shadow-primary/10 space-y-6 text-center"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-9 h-9 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
                                    Asistencia Verificada
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    ¡Hola <strong className="text-foreground">{persona?.nombre1}</strong>!
                                    Tu asistencia ya se encontraba registrada correctamente de forma previa.
                                </p>
                            </div>
                            <button
                                onClick={() => setYaRegistradaModal(false)}
                                className="w-full h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Generar Comprobante
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
