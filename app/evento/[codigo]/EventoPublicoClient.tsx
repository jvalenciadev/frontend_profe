'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Clock, Users, CheckCircle2, AlertCircle,
    Timer, Wifi, WifiOff, ChevronRight, ChevronLeft,
    Trophy, Star, FileText, RefreshCw, User, Hash, ArrowRight, ArrowLeft,
    QrCode, CreditCard, Lock, Unlock, AlertTriangle, Info,
    ChevronDown, Check, X, ClipboardList, Play, Video, RotateCcw,
    PartyPopper, Zap, ShieldCheck,
    Edit2, LogOut, ExternalLink, Award, Download,
    Globe, LayoutGrid
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
interface Cuestionario { id: string; titulo: string; descripcion: string; fechaInicio: string; fechaFin: string; tiempoMaximo: number | null; puntosMaximos: number | null; estado: string; preguntas: Pregunta[]; orden: number; esObligatorio: boolean; esEvaluativo: boolean; urlVideo?: string | null; limiteIntentos?: number | null; esAleatorio?: boolean; cantidadPreguntas?: number | null; puntajeMinimo?: number; }
interface Evento { id: string; nombre: string; codigo: string; descripcion: string; banner: string; afiche: string; fecha: string; lugar: string; estado: string; inscripcionAbierta: boolean; asistencia: boolean | null; codigoAsistencia: string | null; tipo: any; cuestionarios: Cuestionario[]; modalidadIds: string; camposExtras: any[]; tenantId?: string; urlVideo?: string | null; }

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
function Descargo({ tipo, persona, evento, resultado, inscripcionId, cuestionarioActivo }: any) {
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
                        <div className="md:col-span-2 p-6 rounded-[2rem] bg-primary/5 border-2 border-primary/10 flex flex-col items-center gap-2 text-center">
                            <div className="mb-2">
                                <span className="text-[9px] font-black uppercase text-primary/50 tracking-[0.2em]">Cuestionario:</span>
                                <p className="text-xs font-black uppercase text-primary tracking-tight">{resultado?.titulo || cuestionarioActivo?.titulo || 'Evaluación'}</p>
                            </div>
                            <span className="text-[10px] font-black uppercase text-primary/60 tracking-[0.2em]">Resultado de Evaluación</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-primary">{Math.min(resultado.nota ?? 0, 100)}</span>
                                <span className="text-xl font-bold text-primary/40">/ 100</span>
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                {resultado.puntaje} puntos obtenidos de un total de {resultado.puntajeMaximo}
                            </p>
                        </div>
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
    const [timeOffset, setTimeOffset] = useState(0);

    // Reloj sincronizado con el servidor
    const getSyncNow = useCallback(() => {
        return new Date(Date.now() + timeOffset);
    }, [timeOffset]);

    const formatTimeRemaining = useCallback((endDate: Date) => {
        if (!endDate || isNaN(endDate.getTime())) return null;
        const now = getSyncNow();
        const diff = endDate.getTime() - now.getTime();

        // Si ya pasó la fecha pero el estado sigue activo, no mostramos cuenta regresiva negativa
        if (diff <= 0) return { text: 'Cerrado', full: 'Plazo vencido', priority: 'high' };

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return { text: `${days} d`, full: `${days} día${days > 1 ? 's' : ''}`, priority: 'low' };
        }
        if (hours > 0) {
            return { text: `${hours}h`, full: `${hours} hrs`, priority: 'medium' };
        }
        return { text: `${minutes}m`, full: `${minutes} min`, priority: 'high' };
    }, [getSyncNow]);

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

    const [localVideosVistos, setLocalVideosVistos] = useState<Record<string, boolean>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('local_videos_vistos');
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    });

    useEffect(() => {
        localStorage.setItem('local_videos_vistos', JSON.stringify(localVideosVistos));
    }, [localVideosVistos]);

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
    const progCues = progreso?.find((p: any) => p.id === cuestionarioActivo?.id);
    const isAprobado = resultado
        ? (resultado.aprobado !== undefined
            ? !!resultado.aprobado
            : (resultado.nota !== null && resultado.nota !== undefined
                ? resultado.nota >= (cuestionarioActivo?.puntajeMinimo || 75)
                : !!progCues?.aprobado))
        : false;
    const [submitting, setSubmitting] = useState(false);
    const [respuestas, setRespuestas] = useState<Record<string, any>>({});
    const [preguntaIdx, setPreguntaIdx] = useState(0);
    const [mostrarMapaPreguntas, setMostrarMapaPreguntas] = useState(false);
    const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [mobileTab, setMobileTab] = useState<'modules' | 'content'>('content');
    const [timerExpired, setTimerExpired] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [offlineQueue, setOfflineQueue] = useState<any>(null); // guardado offline
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [allModalidades, setAllModalidades] = useState<any[]>([]);
    const videoTimersRef = useRef<Record<string, { totalTime: number, lastStart: number | null, lastRate?: number }>>({});
    const videoPlaybackRef = useRef<Record<string, { maxTime: number, intervalId: any }>>({});
    const moduleListRef = useRef<HTMLDivElement | null>(null);
    const moduleItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    useEffect(() => {
        return () => {
            if (videoPlaybackRef.current) {
                Object.values(videoPlaybackRef.current).forEach((record: any) => {
                    if (record?.intervalId) {
                        clearInterval(record.intervalId);
                    }
                });
            }
        };
    }, []);

    // ─── AUTO-SCROLL AL MÓDULO ACTIVO EN LA LISTA ────────────────────────────
    useEffect(() => {
        if (!selectedModuleId) return;

        let attempts = 0;
        const scroll = () => {
            const el = moduleItemRefs.current[selectedModuleId];
            const container = moduleListRef.current;
            if (el && container) {
                const containerRect = container.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const containerHeight = container.clientHeight;

                // If the container or element is hidden or has no size yet, retry later
                if (containerRect.height === 0 || elRect.height === 0) {
                    if (attempts < 8) {
                        attempts++;
                        setTimeout(scroll, 150);
                    }
                    return;
                }

                const relativeTop = elRect.top - containerRect.top;
                const scrollTarget = container.scrollTop + relativeTop - (containerHeight / 2) + (elRect.height / 2);

                container.scrollTo({
                    top: Math.max(0, scrollTarget),
                    behavior: 'smooth'
                });
            }
        };

        // Run immediately and schedule multiple intervals to handle page rendering and dynamic content loading shifts
        scroll();
        const t1 = setTimeout(scroll, 100);
        const t2 = setTimeout(scroll, 300);
        const t3 = setTimeout(scroll, 600);
        const t4 = setTimeout(scroll, 1000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, [selectedModuleId, mobileTab]);
    // ─────────────────────────────────────────────────────────────────────────

    const [videoWarningModal, setVideoWarningModal] = useState(false);
    const [yaRegistradaModal, setYaRegistradaModal] = useState(false);
    const [isPersonaExistente, setIsPersonaExistente] = useState(false);
    const [confirmInscripcionModal, setConfirmInscripcionModal] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [inscripcionCerradaModal, setInscripcionCerradaModal] = useState(false);


    // Helper centralizado para determinar si un paso está completado (Senior Pattern: Single Source of Truth)
    const isStepFinished = useCallback((cId: string) => {
        const c = evento?.cuestionarios.find((x: any) => x.id === cId);
        if (!c) return false;
        const p = progreso?.find((x: any) => x.id === cId);
        const sinPreguntas = (!c.cantidadPreguntas || c.cantidadPreguntas === 0) && (!c.preguntas || c.preguntas.length === 0);

        // Un paso se considera terminado si:
        // 1. El backend dice que está finalizado
        // 2. O es solo video y ya se vio localmente
        const isFinishedBackend = !!p?.finalizado;
        const isVideoFinished = (p?.videoCompletado || localVideosVistos[cId]);

        if (sinPreguntas) return isVideoFinished || isFinishedBackend;

        // Si tiene preguntas, verificamos si está aprobado o alcanzó el límite
        const isAprobado = !!p?.aprobado || (p?.nota !== null && p?.nota !== undefined && p?.nota >= (c.puntajeMinimo || 75));
        const isPerfect = (p?.nota ?? 0) >= 100 || isAprobado;
        const hasReachedLimit = c.limiteIntentos != null && (p?.numeroIntentos || 0) >= c.limiteIntentos;

        return isFinishedBackend && (isPerfect || hasReachedLimit || !c.esEvaluativo);
    }, [evento, progreso, localVideosVistos]);

    const checkCanStartCuestionario = useCallback((cuestionarioId: string, customProgress?: any[]) => {
        const prog = customProgress || progreso;
        if (!evento?.cuestionarios) return true;

        const sorted = [...evento.cuestionarios]
            .filter((c: any) => c.estado !== 'eliminado')
            .sort((a: any, b: any) => a.orden - b.orden);

        const index = sorted.findIndex((c: any) => c.id === cuestionarioId);
        if (index === -1 || index === 0) return true;

        // Verificar anteriores obligatorios usando el progreso proporcionado
        for (let i = 0; i < index; i++) {
            const prev = sorted[i];
            if (!prev.esObligatorio) continue;

            const p = prog?.find((x: any) => x.id === prev.id);
            const sinPreguntas = !prev.preguntas || prev.preguntas.length === 0;

            let prevDone = false;
            if (sinPreguntas) {
                prevDone = !!(p?.videoCompletado || p?.finalizado || localVideosVistos[prev.id]);
            } else {
                const isAprobado = !!p?.aprobado || (p?.nota !== null && p?.nota !== undefined && p?.nota >= (prev.puntajeMinimo || 75));
                prevDone = !!(p?.finalizado && (isAprobado || !prev.esEvaluativo));
            }

            if (!prevDone) return false;
        }
        return true;
    }, [evento, progreso, localVideosVistos]);

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

            // Calcular desfase con el servidor
            if (evt.serverTime) {
                const sTime = new Date(evt.serverTime).getTime();
                const lTime = Date.now();
                setTimeOffset(sTime - lTime);
                console.log(`[Senior Debug] Clock Sync: Offset de ${sTime - lTime}ms con el servidor.`);
            }
            // Pre-seleccionar el departamento del evento si existe
            if (evt.tenantId) setForm(fp => ({ ...fp, departamentoId: evt.tenantId }));

            // ─── RECUPERAR SESIÓN GUARDADA ───
            const saved = localStorage.getItem(`cuestionario_session_${evt.id}`);
            if (saved) {
                try {
                    const session = JSON.parse(saved);
                    setPersona(session.persona);
                    setForm({ ...session.form, respuestasExtras: session.form?.respuestasExtras || {} });
                    setCuestionarioActivo(session.cuestionarioActivo);
                    setRespuestas(session.respuestas || {});
                    setPreguntaIdx(session.preguntaIdx || 0);
                    if (session.selectedModuleId) setSelectedModuleId(session.selectedModuleId);
                    else if (session.cuestionarioActivo?.id) setSelectedModuleId(session.cuestionarioActivo.id);
                    setStartTime(session.startTime);
                    setInscripcion(session.inscripcion || null);

                    // LOGICA SENIOR: Refrescar progreso desde el servidor inmediatamente
                    if (session.persona?.ci && session.persona?.fechaNacimiento) {
                        eventoPublicoService.getProgreso(evt.id, session.persona.ci, session.persona.fechaNacimiento)
                            .then(progUpdate => {
                                setProgreso(progUpdate.progress);
                                console.log("[Senior Sync] Progreso refrescado satisfactoriamente.");
                            })
                            .catch(err => console.error("[Senior Sync] Error al refrescar progreso:", err));
                    } else {
                        setProgreso(session.progreso || []);
                    }
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
                inscripcion, resultado, localVideosVistos, isPersonaExistente, selectedModuleId
            };
            localStorage.setItem(`cuestionario_session_${evento.id}`, JSON.stringify(session));
            setLastSavedStatus('saved');
        }
    }, [evento, step, persona, form, cuestionarioActivo, respuestas, preguntaIdx, startTime, progreso, inscripcion, resultado, localVideosVistos, selectedModuleId]);

    // Inicializar selectedModuleId con el primer módulo incompleto
    useEffect(() => {
        if (evento?.cuestionarios && !selectedModuleId) {
            const sorted = [...evento.cuestionarios]
                .filter(c => c.estado !== 'eliminado')
                .sort((a, b) => a.orden - b.orden);
            const firstIncomplete = sorted.find(c => !isStepFinished(c.id)) || sorted[0];
            if (firstIncomplete) {
                setSelectedModuleId(firstIncomplete.id);
            }
        }
    }, [evento, progreso, isStepFinished, selectedModuleId]);

    // Cargar / preparar automáticamente el módulo seleccionado si está disponible e incompleto
    useEffect(() => {
        if (selectedModuleId && evento?.cuestionarios) {
            const c = evento.cuestionarios.find((x: any) => x.id === selectedModuleId);
            if (c && !isStepFinished(c.id) && checkCanStartCuestionario(c.id)) {
                if (cuestionarioActivo?.id !== c.id) {
                    let pregs = [...c.preguntas];
                    if (c.esAleatorio) {
                        pregs = shuffleArray(pregs).map(p => ({
                            ...p,
                            opciones: shuffleArray(p.opciones)
                        }));
                    }
                    if (c.cantidadPreguntas && c.cantidadPreguntas > 0) {
                        pregs = pregs.slice(0, c.cantidadPreguntas);
                    }

                    const savedRaw = localStorage.getItem(`cuestionario_session_${evento.id}`);
                    let restoredRespuestas = {};
                    let restoredPregIdx = -1;
                    let restoredStartTime = null;

                    if (savedRaw) {
                        try {
                            const session = JSON.parse(savedRaw);
                            if (session.cuestionarioActivo?.id === c.id) {
                                restoredRespuestas = session.respuestas || {};
                                restoredPregIdx = session.preguntaIdx;
                                restoredStartTime = session.startTime;
                            }
                        } catch { }
                    }

                    setCuestionarioActivo({ ...c, preguntas: pregs });
                    setRespuestas(restoredRespuestas);

                    let hasVideo = false;
                    let alreadyWatched = false;

                    if (restoredPregIdx !== -1) {
                        setPreguntaIdx(restoredPregIdx);
                        hasVideo = !!c.urlVideo;
                        const progC = progreso?.find((p: any) => p.id === c.id);
                        alreadyWatched = progC?.videoCompletado || localVideosVistos[c.id];
                    } else {
                        hasVideo = !!c.urlVideo;
                        const hasPreguntas = pregs.length > 0;
                        const progC = progreso?.find((p: any) => p.id === c.id);
                        alreadyWatched = progC?.videoCompletado || localVideosVistos[c.id];

                        if (hasVideo && alreadyWatched && hasPreguntas) {
                            setPreguntaIdx(1);
                        } else {
                            setPreguntaIdx(0);
                        }
                    }
                    setTimerExpired(false);
                    setStartTime(restoredStartTime || null);
                    setResultado(null);
                }
            }
        }
    }, [selectedModuleId, evento, progreso, isStepFinished, checkCanStartCuestionario]);

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
                // ── OBTENER PROGRESO FRESCO (una sola llamada) ────────────────────
                let progActualizado: any[] = [];
                try {
                    const prog = await eventoPublicoService.getProgreso(evento!.id, ciLimpio, form.fechaNacimiento);
                    progActualizado = prog.progress;
                    setProgreso(progActualizado);

                    // SINCRONIZAR VIDEOS VISTOS LOCALMENTE
                    const videosLocales = Object.keys(localVideosVistos);
                    for (const cueId of videosLocales) {
                        const yaEnBackend = progActualizado.find((p: any) => p.id === cueId)?.videoCompletado;
                        if (!yaEnBackend) {
                            await eventoPublicoService.marcarVideoVisto(evento!.id, cueId, ciLimpio, form.fechaNacimiento).catch(() => { });
                        }
                    }
                } catch (e) {
                    console.error("Error cargando progreso:", e);
                }

                // ── LÓGICA SENIOR DE REANUDACIÓN ─────────────────────────────────

                // 1) Si hay cuestionarioActivo (usuario entró desde un módulo específico), validar y retomar
                if (cuestionarioActivo) {
                    const canDo = checkCanStartCuestionario(cuestionarioActivo.id, progActualizado);
                    if (canDo) {
                        handleEmpezarCuestionario(cuestionarioActivo, progActualizado);
                        toast.success('Identidad verificada. Reanudando cuestionario...');
                    } else {
                        toast.error('Debes completar los cuestionarios anteriores primero.');
                        setStep('info');
                    }
                } else {
                    // 2) Sin cuestionarioActivo: buscar dónde se quedó el usuario
                    //    Primero revisar si localStorage tiene un cuestionario activo guardado
                    const savedRaw = localStorage.getItem(`cuestionario_session_${evento!.id}`);
                    let savedCuestionarioId: string | null = null;
                    if (savedRaw) {
                        try {
                            const session = JSON.parse(savedRaw);
                            // Solo reanudar si era la misma persona
                            if (session.cuestionarioActivo?.id && session.persona?.ci === ciLimpio) {
                                savedCuestionarioId = session.cuestionarioActivo.id;
                            }
                        } catch { }
                    }

                    // Buscar el cuestionario candidato
                    const sorted = [...(evento!.cuestionarios || [])]
                        .filter((c: any) => c.estado !== 'eliminado')
                        .sort((a: any, b: any) => a.orden - b.orden);

                    let candidato: any = null;

                    // Helper: determinar si un cuestionario tiene el límite de intentos agotado
                    const limiteAgotadoPara = (c: any) => {
                        const progC = progActualizado.find((p: any) => p.id === c.id);
                        const lim = progC?.limiteIntentos ?? c.limiteIntentos;
                        return lim != null && (progC?.numeroIntentos || 0) >= lim;
                    };

                    // Prioridad 1: el cuestionario que tenía activo localmente (si límite no agotado)
                    if (savedCuestionarioId) {
                        const saved = sorted.find((c: any) => c.id === savedCuestionarioId);
                        if (saved && checkCanStartCuestionario(saved.id, progActualizado) && !limiteAgotadoPara(saved)) {
                            const progSaved = progActualizado.find((p: any) => p.id === saved.id);
                            if (!progSaved?.finalizado) {
                                candidato = saved;
                            }
                        }
                    }

                    // Prioridad 2: primer cuestionario incompleto que puede hacer (y no tiene límite agotado)
                    if (!candidato) {
                        candidato = sorted.find((c: any) => {
                            const progC = progActualizado.find((p: any) => p.id === c.id);
                            const completado = !!progC?.finalizado && (!!progC?.aprobado || !c.esEvaluativo);
                            return !completado && !limiteAgotadoPara(c) && checkCanStartCuestionario(c.id, progActualizado);
                        });
                    }

                    if (candidato) {
                        setSelectedModuleId(candidato.id);
                        handleEmpezarCuestionario(candidato, progActualizado);
                        toast.success('Identidad verificada. Retomando desde donde lo dejaste...');
                    } else {
                        // Todo completado o no hay módulos disponibles → ir a info
                        setStep('info');
                        toast.success('¡Bienvenido de nuevo! Aquí puedes ver tu progreso.');
                    }
                }
                // ───────────────────────────────────────────────────────────────────
                return;
            }

            if (!evento?.inscripcionAbierta) {
                setInscripcionCerradaModal(true);
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
        if (!isEditingProfile) {
            if (!form.modalidadId) nuevosErrores.modalidadId = true;
            if (!form.departamentoId) nuevosErrores.departamentoId = true;
        }

        // Validar campos extras (solo si no es edición)
        if (!isEditingProfile) {
            (evento.camposExtras || []).forEach(campo => {
                if (!campo.esObligatorio) return;
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
            });
        }

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
                respuestasExtras: Object.entries(form.respuestasExtras).map(([campoId, valor]) => ({ campoId, valor })),
                isEditingProfile
            });

            setPersona(result.persona);
            setInscripcion(result.inscripcion);

            // Sincronizar videos vistos al inscribirse
            const videosLocales = Object.keys(localVideosVistos);
            for (const cueId of videosLocales) {
                await eventoPublicoService.marcarVideoVisto(evt.id, cueId, ciLimpio, form.fechaNacimiento).catch(() => { });
            }

            if (cuestionarioActivo && !isEditingProfile) {
                handleEmpezarCuestionario(cuestionarioActivo);
                toast.success('¡Inscripción exitosa! Iniciando evaluación...');
            } else {
                setStep('info');
                toast.success(isEditingProfile ? '¡Tus datos han sido actualizados con éxito!' : '¡Registro completado con éxito! Ya puedes realizar tus evaluaciones.');
            }
            if (isEditingProfile) setIsEditingProfile(false);
        } catch (e: any) {
            if (e?.response?.data?.message?.includes('inscrito')) {
                // Ya inscrito
                setInscripcion({ id: 'existente' });
                setStep('descargo');
            } else if (e?.response?.data?.message?.includes('cerrada') || e?.response?.status === 403) {
                // La inscripción está cerrada
                setInscripcionCerradaModal(true);
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
            setStep('info'); // Mantener en portal unificado
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
                setStep('info'); // Mantener en portal unificado
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

    const handleEmpezarCuestionario = useCallback((cues: any, freshProgress?: any[]) => {
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

        // Revisar si hay una sesión guardada localmente para este mismo cuestionario
        const savedRaw = localStorage.getItem(`cuestionario_session_${evento!.id}`);
        let restoredRespuestas = {};
        let restoredPregIdx = -1;
        let restoredStartTime = null;

        if (savedRaw) {
            try {
                const session = JSON.parse(savedRaw);
                if (session.cuestionarioActivo?.id === cues.id) {
                    restoredRespuestas = session.respuestas || {};
                    restoredPregIdx = session.preguntaIdx;
                    restoredStartTime = session.startTime;
                    console.log("[Senior Resume] Sesión reanudada para cuestionario:", cues.id);
                }
            } catch (e) {
                console.error("Error al restaurar sesión guardada:", e);
            }
        }

        setCuestionarioActivo({ ...cues, preguntas: pregs });
        setRespuestas(restoredRespuestas);

        if (restoredPregIdx !== -1) {
            setPreguntaIdx(restoredPregIdx);
        } else {
            // Determinar índice inicial estilo presentación
            const hasVideo = !!cues.urlVideo;
            const hasPreguntas = pregs.length > 0;
            // Usar freshProgress si está disponible para evitar closure stale
            const progToCheck = freshProgress || progreso;
            const progC = progToCheck?.find((p: any) => p.id === cues.id);
            const alreadyWatched = progC?.videoCompletado || localVideosVistos[cues.id];

            if (hasVideo && alreadyWatched && hasPreguntas) {
                setPreguntaIdx(1); // Empezar en Pregunta 1
            } else {
                setPreguntaIdx(0); // Empezar en Video o Pregunta 1
            }
        }

        setTimerExpired(false);
        setStartTime(restoredStartTime || null);
        setSelectedModuleId(cues.id);
        setStep('info');
        setResultado(null);
    }, [evento, progreso, localVideosVistos, setSelectedModuleId]);

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



    const sortedCuestionarios = [...(evento?.cuestionarios || [])]
        .filter(c => c.estado !== 'eliminado')
        .sort((a, b) => a.orden - b.orden);

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

                {/* ─── DESKTOP BANNER (Hidden on Mobile / Logged-in) ─── */}
                {!persona && (
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
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                                    {evento.tipo?.nombre || 'Evento'}
                                </span>
                                {evento.estado === 'finalizado' && (
                                    <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Finalizado
                                    </span>
                                )}
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-white mt-4 uppercase leading-[0.9] drop-shadow-2xl">
                                {evento.nombre}
                            </h1>
                        </div>
                    </div>
                )}

                {/* ─── MOBILE HEADER (Clean & Professional / Logged-in) ─── */}
                {!persona && (
                    <div className="md:hidden pt-32 pb-8 px-6 bg-slate-50 dark:bg-slate-900 border-b border-border">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                        {evento.tipo?.nombre || 'Evento'}
                                    </span>
                                    {evento.estado === 'finalizado' && (
                                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                                            Finalizado
                                        </span>
                                    )}
                                </div>
                                <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground active:scale-95 transition-all">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase leading-[1.1]">
                                {evento.nombre}
                            </h1>
                        </div>
                    </div>
                )}

                <div className={cn("mx-auto px-4 py-12 space-y-12 transition-all duration-500", persona ? "max-w-[1440px] w-full pt-28 md:pt-36" : "max-w-4xl")}>
                    {evento.estado === 'finalizado' && (
                        <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 flex items-center gap-4 text-amber-600 dark:text-amber-400 shadow-sm">
                            <AlertTriangle className="w-6 h-6 shrink-0" />
                            <div>
                                <h3 className="font-black uppercase text-xs tracking-wider">Evento Finalizado</h3>
                                <p className="text-xs font-bold text-muted-foreground mt-0.5">Este evento ha concluido. Ya no es posible registrarse ni realizar cuestionarios de evaluación.</p>
                            </div>
                        </div>
                    )}
                    {/* Info badges */}
                    {!persona && (
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
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-none">Modalidad</p>
                                        <span className="font-bold">
                                            {(evento.modalidadIds || '').split(',').map(id => {
                                                return allModalidades.find(m => m.id === id.trim())?.nombre;
                                            }).filter(Boolean).join(', ') || evento.modalidadIds}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content switcher */}
                    <AnimatePresence mode="wait">

                        {/* ── STEP INFO ── */}
                        {step === 'info' && (
                            <motion.div key="info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                {!persona && (
                                    <div className="bg-card border border-border rounded-3xl p-8">
                                        <h2 className="text-lg font-black uppercase text-foreground mb-3">Descripción</h2>
                                        <div className="text-muted-foreground leading-relaxed italic prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: evento.descripcion }} />
                                    </div>
                                )}




                                {/* ── PORTAL DE EVALUACIÓN (GATED) ── */}
                                {(evento.cuestionarios?.length || 0) > 0 && evento.estado !== 'finalizado' && (
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
                                                    onClick={() => {
                                                        setForm(prev => ({
                                                            ...prev,
                                                            nombre1: persona.nombre1 || '',
                                                            nombre2: persona.nombre2 || '',
                                                            apellido1: persona.apellido1 || '',
                                                            apellido2: persona.apellido2 || '',
                                                            correo: persona.correo || '',
                                                            celular: persona.celular || '',
                                                            ci: persona.ci || prev.ci,
                                                            fechaNacimiento: persona.fechaNacimiento || prev.fechaNacimiento,
                                                            departamentoId: persona.departamentoId || prev.departamentoId,
                                                            modalidadId: inscripcion?.modalidadId || prev.modalidadId,
                                                        }));
                                                        setIsPersonaExistente(true);
                                                        setIsEditingProfile(true);
                                                        setStep('inscripcion');
                                                        toast.info('Modifica tus datos personales y haz clic en "Vista Previa".');
                                                    }}
                                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-colors flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/20"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                    Editar Datos
                                                </button>
                                                <button
                                                    onClick={() => setStep('descargo')}
                                                    className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200"
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
                                {!persona && evento.urlVideo && (() => {
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


                                {persona && (evento.cuestionarios?.length || 0) > 0 && evento.estado !== 'finalizado' && (
                                    <div className="space-y-6 pt-4">
                                        <div className="flex items-center justify-between border-b border-border pb-6 flex-wrap gap-4">
                                            <h2 className="text-xl font-black uppercase text-foreground flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-primary" />
                                                </div>
                                                Portal de Evaluaciones
                                            </h2>
                                            {(() => {
                                                const ultimaFechaFin = evento.cuestionarios?.reduce((max: Date, c: any) => {
                                                    const end = new Date(c.fechaFin);
                                                    return end > max ? end : max;
                                                }, new Date(0));
                                                const generalTimeLeft = formatTimeRemaining(ultimaFechaFin);

                                                if (!generalTimeLeft || isNaN(ultimaFechaFin.getTime())) return null;

                                                // Plazo vencido: badge discreto sin ruido visual
                                                if (generalTimeLeft.text === 'Cerrado') {
                                                    return (
                                                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-muted/40 bg-muted/10 text-muted-foreground/50">
                                                            <Lock className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Evaluaciones cerradas</span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className={cn(
                                                        "flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 shadow-lg transition-all",
                                                        generalTimeLeft.priority === 'medium' ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                                                            "bg-primary/10 border-primary/30 text-primary"
                                                    )}>
                                                        <Clock className="w-4 h-4" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black uppercase opacity-60 leading-none mb-0.5">Cierre General:</span>
                                                            <span className="text-xs font-black uppercase tracking-tight leading-none">
                                                                {generalTimeLeft.full}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* ── BANNER EVENTO COMPLETADO ── */}
                                        {evento.cuestionarios.every((c: any) => isStepFinished(c.id)) && (() => {
                                            // Fecha más tardía de los cuestionarios (cierre general)
                                            const ultimaFin = evento.cuestionarios?.reduce((max: Date, c: any) => {
                                                const d = new Date(c.fechaFin);
                                                return d > max ? d : max;
                                            }, new Date(0));
                                            const fechaCertLabel = !isNaN(ultimaFin?.getTime())
                                                ? ultimaFin.toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
                                                : null;

                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -16, scale: 0.96 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                                    className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/20"
                                                    style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, var(--card) 45%, rgba(16,185,129,0.06) 100%)' }}
                                                >
                                                    {/* Glow orb top-center */}
                                                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full bg-emerald-400/25 blur-3xl pointer-events-none" />
                                                    {/* Glow orb bottom-right */}
                                                    <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                                                    {/* Corner sparkles */}
                                                    <div className="absolute top-4 right-6 text-emerald-400/40 text-2xl select-none pointer-events-none">✦</div>
                                                    <div className="absolute top-8 right-14 text-emerald-400/20 text-sm select-none pointer-events-none">✦</div>
                                                    <div className="absolute bottom-5 left-6 text-primary/20 text-lg select-none pointer-events-none">✦</div>

                                                    <div className="relative z-10 p-7 md:p-10 flex flex-col items-center text-center gap-6">
                                                        {/* Trophy icon with ring glow */}
                                                        <div className="relative">
                                                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl scale-150 animate-pulse" />
                                                            <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border-2 border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                                                <Trophy className="w-12 h-12 text-emerald-400" />
                                                            </div>
                                                        </div>

                                                        {/* Main text */}
                                                        <div className="space-y-2 max-w-lg">
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 mb-1">
                                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Logro Desbloqueado · Verificado</span>
                                                            </div>
                                                            <h3 className="text-3xl font-black uppercase text-foreground tracking-tight leading-none">
                                                                ¡Evento Completado!
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto">
                                                                Has cumplido con <strong className="text-foreground">todos los requisitos</strong> y evaluaciones del evento. Tu certificado oficial está siendo generado.
                                                            </p>
                                                        </div>

                                                        {/* Stats strip */}
                                                        <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
                                                            <div className="flex-1 min-w-[120px] flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/8 border border-emerald-500/20">
                                                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                                                <div className="text-left">
                                                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground leading-none">Estado</p>
                                                                    <p className="text-xs font-black text-emerald-400 mt-0.5">Aprobado</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-[120px] flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/8 border border-primary/20">
                                                                <Award className="w-4 h-4 text-primary shrink-0" />
                                                                <div className="text-left">
                                                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground leading-none">Certificado</p>
                                                                    <p className="text-xs font-black text-primary mt-0.5">Digital oficial</p>
                                                                </div>
                                                            </div>
                                                            {fechaCertLabel && (
                                                                <div className="flex-1 min-w-[140px] flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/60">
                                                                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                                                    <div className="text-left">
                                                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground leading-none">Disponible el</p>
                                                                        <p className="text-xs font-black text-foreground mt-0.5">{fechaCertLabel}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Certificate info footer */}
                                                        <div className="w-full max-w-md p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-2">
                                                            <div className="flex items-center gap-2 justify-center">
                                                                <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                                                    <Award className="w-3 h-3 text-primary" />
                                                                </div>
                                                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Ministerio de Educación · Portal de Certificación</p>
                                                            </div>
                                                            <p className="text-[9px] text-muted-foreground/70 font-bold leading-relaxed text-center">
                                                                El certificado digital incorpora firma digital autorizada y código QR para verificación inmediata a nivel nacional.
                                                            </p>
                                                            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center pt-1 border-t border-border/40">
                                                                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                                                                    <ShieldCheck className="w-2.5 h-2.5" /> Firma digital y QR
                                                                </span>
                                                                <span className="text-[8px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                                                                    <Download className="w-2.5 h-2.5" /> Descarga con C.I.
                                                                </span>
                                                                <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                                                    <Globe className="w-2.5 h-2.5" /> certificados.minedu.gob.bo
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })()}

                                        {/* ── INTERFAZ UNIFICADA DEL PORTAL (STYLE UDEMY/PLATZI) ── */}
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                            {/* Selector de pestañas para móvil */}
                                            <div className="col-span-12 lg:hidden flex border-b border-border bg-card rounded-2xl overflow-hidden p-1 gap-1">
                                                <button
                                                    onClick={() => setMobileTab('modules')}
                                                    className={cn(
                                                        "flex-1 py-3 text-xs font-black uppercase tracking-widest text-center rounded-xl transition-all",
                                                        mobileTab === 'modules' ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/50"
                                                    )}
                                                >
                                                    Temario ({evento.cuestionarios.filter((c: any) => isStepFinished(c.id)).length}/{evento.cuestionarios.length})
                                                </button>
                                                <button
                                                    onClick={() => setMobileTab('content')}
                                                    className={cn(
                                                        "flex-1 py-3 text-xs font-black uppercase tracking-widest text-center rounded-xl transition-all",
                                                        mobileTab === 'content' ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/50"
                                                    )}
                                                >
                                                    Clase / Cuestionario
                                                </button>
                                            </div>

                                            {/* COLUMNA IZQUIERDA: SIDEBAR DE TEMARIO */}
                                            <div className={cn(
                                                "col-span-12 lg:col-span-4 bg-card border border-border rounded-3xl p-5 space-y-4 shadow-xl shadow-black/5",
                                                mobileTab === 'modules' ? "block" : "hidden lg:block"
                                            )}>
                                                <div className="space-y-1">
                                                    <h3 className="text-xs font-black uppercase text-foreground tracking-tight">Temario del Evento</h3>
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                                                        Haz clic en un módulo para ingresar
                                                    </p>
                                                </div>

                                                {/* Barra de Progreso General */}
                                                {(() => {
                                                    const total = evento.cuestionarios.length;
                                                    const done = evento.cuestionarios.filter((c: any) => isStepFinished(c.id)).length;
                                                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                                                    const allDone = done === total;
                                                    return (
                                                        <div className={cn(
                                                            "space-y-2 p-4 rounded-2xl border transition-all",
                                                            allDone ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/20 border-border/50"
                                                        )}>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Progreso General</span>
                                                                <span className={cn("text-[10px] font-black tabular-nums", allDone ? "text-emerald-500" : "text-primary")}>
                                                                    {done}/{total} · {pct}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn("h-full rounded-full transition-all duration-700", allDone ? "bg-emerald-500" : "bg-primary")}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Lista Scrollable de Diapositivas */}
                                                <div ref={moduleListRef} className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                                                    {sortedCuestionarios.map((c, idx) => {
                                                        const isFinished = isStepFinished(c.id);
                                                        const canStart = c.estado === 'activo' && checkCanStartCuestionario(c.id);
                                                        const isSelected = selectedModuleId === c.id;
                                                        const prog = progreso.find((p: any) => p.id === c.id);
                                                        const hasVideo = !!c.urlVideo;

                                                        return (
                                                            <button
                                                                key={c.id}
                                                                ref={(el) => { moduleItemRefs.current[c.id] = el; }}
                                                                onClick={() => {
                                                                    setSelectedModuleId(c.id);
                                                                    setMobileTab('content');
                                                                }}
                                                                className={cn(
                                                                    "w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 group relative overflow-hidden",
                                                                    isSelected
                                                                        ? "bg-primary/10 border-primary text-primary shadow-inner ring-2 ring-primary/20"
                                                                        : isFinished
                                                                            ? "bg-emerald-500/[0.02] border-emerald-500/10 hover:border-emerald-500/30 text-foreground"
                                                                            : canStart
                                                                                ? "bg-card border-border hover:border-primary/30 text-foreground hover:bg-muted/10"
                                                                                : "bg-muted/10 border-border/30 opacity-40 cursor-not-allowed"
                                                                )}
                                                                disabled={c.estado !== 'activo' && !isFinished}
                                                            >
                                                                {/* Icono de estado */}
                                                                <div className={cn(
                                                                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                                                                    isSelected
                                                                        ? "bg-primary border-primary text-white"
                                                                        : isFinished
                                                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                                                            : canStart
                                                                                ? "bg-muted border-border text-muted-foreground group-hover:border-primary/40"
                                                                                : "bg-muted/50 border-border/20 text-muted-foreground/30"
                                                                )}>
                                                                    {isFinished
                                                                        ? (!c.esEvaluativo && (!c.preguntas || c.preguntas.length === 0)
                                                                            ? <Play className="w-3.5 h-3.5" />   // solo video: play en verde
                                                                            : <Check className="w-3.5 h-3.5" /> // evaluativo: check
                                                                        )
                                                                        : canStart
                                                                            ? (hasVideo ? <Video className="w-3.5 h-3.5" /> : <ClipboardList className="w-3.5 h-3.5" />)
                                                                            : <Lock className="w-3.5 h-3.5" />
                                                                    }
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="text-[8px] font-black uppercase tracking-wider opacity-60">Módulo {idx + 1}</span>
                                                                        {c.esObligatorio && (
                                                                            <span className="text-[7px] font-bold uppercase tracking-widest text-amber-500/80">Oblig.</span>
                                                                        )}
                                                                    </div>
                                                                    <h4 className="text-[13px] font-black uppercase mt-1.5 tracking-tight leading-snug break-words whitespace-normal text-foreground group-hover:text-primary transition-colors">{c.titulo}</h4>
                                                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                                        {(c.esEvaluativo || (c.preguntas && c.preguntas.length > 0)) ? (
                                                                            <>
                                                                                <span className={cn(
                                                                                    "text-[9px] font-black flex items-center gap-1",
                                                                                    isFinished ? "text-emerald-500" : canStart ? "text-muted-foreground" : "text-muted-foreground/50"
                                                                                )}>
                                                                                    {isFinished
                                                                                        ? <><CheckCircle2 className="w-3 h-3 shrink-0" /><span>Completado</span></>
                                                                                        : canStart
                                                                                            ? <><Unlock className="w-3 h-3 shrink-0" /><span>Disponible</span></>
                                                                                            : <><Lock className="w-3 h-3 shrink-0" /><span>Bloqueado</span></>}
                                                                                </span>
                                                                                {c.esEvaluativo && prog?.nota !== null && prog?.nota !== undefined && (
                                                                                    <span className={cn(
                                                                                        "text-[9px] font-black px-1.5 py-0.5 rounded-md",
                                                                                        prog.nota >= (c.puntajeMinimo || 75)
                                                                                            ? "bg-emerald-500/10 text-emerald-500"
                                                                                            : "bg-amber-500/10 text-amber-500"
                                                                                    )}>
                                                                                        {prog.nota}/100
                                                                                    </span>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            /* Solo video */
                                                                            <span className={cn(
                                                                                "text-[9px] font-black flex items-center gap-1",
                                                                                isFinished ? "text-emerald-500" : "text-muted-foreground"
                                                                            )}>
                                                                                {isFinished
                                                                                    ? <><CheckCircle2 className="w-3 h-3 shrink-0" /><span>Visto</span></>
                                                                                    : canStart
                                                                                        ? <><Video className="w-3 h-3 shrink-0" /><span>Ver video</span></>
                                                                                        : <><Lock className="w-3 h-3 shrink-0" /><span>Bloqueado</span></>}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* COLUMNA DERECHA: REPRODUCTOR DE CONTENIDO ACTIVO */}
                                            <div className={cn(
                                                "col-span-12 lg:col-span-8",
                                                mobileTab === 'content' ? "block" : "hidden lg:block"
                                            )}>
                                                {(() => {
                                                    const c = sortedCuestionarios.find(x => x.id === selectedModuleId);
                                                    if (!c) {
                                                        return (
                                                            <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                                                                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                                                <h3 className="font-black uppercase text-sm text-foreground">Selecciona un Módulo</h3>
                                                                <p className="text-xs text-muted-foreground mt-1">Elige un paso del temario para comenzar a avanzar en el curso.</p>
                                                            </div>
                                                        );
                                                    }

                                                    const isFinished = isStepFinished(c.id);
                                                    const canStart = c.estado === 'activo' && checkCanStartCuestionario(c.id);
                                                    // 1. SI EL MÓDULO ESTÁ BLOQUEADO (LOCKED)
                                                    if (!isFinished && !canStart) {
                                                        return (
                                                            <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px] space-y-4">
                                                                <div className="w-16 h-16 rounded-2xl bg-muted border border-border/80 flex items-center justify-center text-muted-foreground">
                                                                    <Lock className="w-8 h-8 animate-pulse" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black uppercase text-base text-foreground">Contenido Bloqueado</h3>
                                                                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[280px] mx-auto leading-relaxed uppercase tracking-wider font-bold">
                                                                        Debes finalizar los módulos obligatorios anteriores para habilitar este paso.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // 2. SI EL MÓDULO ESTÁ COMPLETADO (FINISHED) - MOSTRAR RESULTADOS
                                                    if (isFinished || (resultado && cuestionarioActivo?.id === c.id)) {
                                                        const progBackend = progreso.find((p: any) => p.id === c.id);
                                                        const prog = (resultado && cuestionarioActivo?.id === c.id) ? resultado : progBackend;
                                                        const pVal = Number(prog?.puntaje ?? prog?.puntos ?? prog?.score ?? 0);
                                                        const totalPuntos = c.preguntas?.reduce((acc: number, q: any) => acc + (q.puntos || 0), 0) || 0;
                                                        const tVal = Number((prog?.puntajeMaximo ?? prog?.puntosMaximo ?? totalPuntos) || 0);
                                                        const isAprobado = !!prog?.aprobado || (prog?.nota !== null && prog?.nota !== undefined && prog?.nota >= (c.puntajeMinimo || 75));
                                                        const isPerfect = (prog?.nota ?? 0) >= 100 || isAprobado;
                                                        const limitValue = prog?.limiteIntentos ?? c.limiteIntentos;
                                                        const hasReachedLimit = limitValue != null && (prog?.numeroIntentos || 0) >= limitValue;

                                                        const currentIndex = sortedCuestionarios.findIndex((x: any) => x.id === c.id);
                                                        const siguienteCues = currentIndex !== -1 && currentIndex < sortedCuestionarios.length - 1
                                                            ? sortedCuestionarios[currentIndex + 1]
                                                            : null;

                                                        const sinPreguntas = !c.preguntas || c.preguntas.length === 0;

                                                        return (
                                                            <div className={cn(
                                                                "relative overflow-hidden rounded-3xl border-2 transition-all duration-500 bg-card",
                                                                !c.esEvaluativo
                                                                    ? "bg-primary/5 border-primary/20"
                                                                    : isAprobado
                                                                        ? "bg-gradient-to-br from-primary/10 via-card to-card border-primary/30 shadow-2xl shadow-primary/10"
                                                                        : "bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/20"
                                                            )}>
                                                                <div className="relative z-10 p-8 text-center space-y-6">
                                                                    <div className={cn(
                                                                        "w-20 h-20 rounded-[1.5rem] mx-auto flex items-center justify-center border-2 transition-colors",
                                                                        !c.esEvaluativo
                                                                            ? "bg-primary/10 border-primary/20 text-primary"
                                                                            : isAprobado ? "bg-primary/15 border-primary/30 text-primary animate-pulse" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                                                    )}>
                                                                        {!c.esEvaluativo
                                                                            ? <CheckCircle2 className="w-10 h-10" />
                                                                            : isAprobado
                                                                                ? <Trophy className="w-10 h-10" />
                                                                                : <AlertTriangle className="w-10 h-10" />
                                                                        }
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">{c.titulo}</span>
                                                                        <h2 className="text-4xl font-black tracking-tighter text-foreground mt-1">
                                                                            {!c.esEvaluativo ? '¡COMPLETO!' : `${Math.min(prog?.nota ?? 0, 100)}`}
                                                                            {c.esEvaluativo && <span className="text-xl opacity-20 ml-1">/100</span>}
                                                                        </h2>
                                                                        <p className={cn(
                                                                            "text-xs font-black uppercase tracking-[0.3em] mt-1",
                                                                            !c.esEvaluativo
                                                                                ? "text-primary"
                                                                                : isAprobado ? "text-primary" : "text-amber-500"
                                                                        )}>
                                                                            {!c.esEvaluativo ? (
                                                                                <span className="flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Paso Completado</span>
                                                                            ) : isAprobado ? (
                                                                                <span className="flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Aprobado con Éxito</span>
                                                                            ) : (
                                                                                <span className="flex items-center justify-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Evaluación Pendiente</span>
                                                                            )}
                                                                        </p>
                                                                    </div>

                                                                    {c.esEvaluativo && (
                                                                        <div className="space-y-3 pt-1 max-w-sm mx-auto">
                                                                            <div className="space-y-1.5">
                                                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                                                    <span>0</span>
                                                                                    <span className={isAprobado ? 'text-primary font-black' : 'text-amber-500 font-black'}>
                                                                                        {pVal} / {tVal} pts
                                                                                    </span>
                                                                                    <span>100</span>
                                                                                </div>
                                                                                <div className="w-full h-3 bg-muted rounded-full overflow-hidden border relative shadow-inner">
                                                                                    <div
                                                                                        className={cn("h-full rounded-full transition-all duration-1000", isAprobado ? "bg-primary" : "bg-amber-500")}
                                                                                        style={{ width: `${Math.min(prog?.nota ?? 0, 100)}%` }}
                                                                                    />
                                                                                </div>
                                                                                <p className="text-[9px] text-muted-foreground font-bold">
                                                                                    Mínimo para aprobar: {c.puntajeMinimo || 75}/100
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex flex-col gap-3 max-w-sm mx-auto pt-6 border-t border-border/50">
                                                                        {c.esEvaluativo && !isAprobado && hasReachedLimit && (
                                                                            <div className="flex flex-col items-center gap-2.5 p-5 bg-red-500/5 rounded-2xl border border-red-500/20 text-center">
                                                                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                                                                    <Lock className="w-5 h-5" />
                                                                                </div>
                                                                                <span className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em]">
                                                                                    Evaluación Reprobada · Intentos Agotados
                                                                                </span>
                                                                                <p className="text-[11px] text-muted-foreground font-bold leading-normal uppercase">
                                                                                    Has alcanzado el límite de {limitValue} {limitValue === 1 ? 'intento' : 'intentos'} sin alcanzar la nota mínima de {c.puntajeMinimo || 75} puntos. Tu avance ha quedado bloqueado y no puedes continuar con el siguiente módulo.
                                                                                </p>
                                                                                <p className="text-[9px] text-red-500/80 font-black uppercase tracking-widest leading-none mt-1">
                                                                                    Comunícate con el organizador.
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        {siguienteCues && (!c.esEvaluativo || isAprobado) && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedModuleId(siguienteCues.id);
                                                                                }}
                                                                                className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-md"
                                                                            >
                                                                                Siguiente Módulo <ArrowRight className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                        {!sinPreguntas && !isPerfect && !hasReachedLimit && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    localStorage.removeItem(`cuestionario_session_${evento.id}`);
                                                                                    handleEmpezarCuestionario(c);
                                                                                }}
                                                                                className="w-full h-14 rounded-2xl bg-amber-500 text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all flex items-center justify-center gap-3"
                                                                            >
                                                                                <RotateCcw className="w-4 h-4" /> Reintentar Evaluación
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // 3. SI EL MÓDULO ESTÁ DISPONIBLE Y EN PROGRESO (RENDER WIZARD DEL PLAY DE CLASES)
                                                    if (cuestionarioActivo && cuestionarioActivo.id === c.id) {
                                                        const progC = progreso?.find((p: any) => p.id === cuestionarioActivo.id);
                                                        const videoVisto = !cuestionarioActivo.urlVideo || progC?.videoCompletado || localVideosVistos[cuestionarioActivo.id];
                                                        const hasVideo = !!cuestionarioActivo.urlVideo;
                                                        const pregs = cuestionarioActivo.preguntas;

                                                        return (
                                                            <div className="space-y-6">
                                                                {/* ── SLIDE TIMELINE INDICATOR ── */}
                                                                <div className="bg-card border border-border rounded-3xl p-4 md:p-5 space-y-4 shadow-xl shadow-black/5">
                                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <ClipboardList className="w-5 h-5 text-primary" />
                                                                            <div>
                                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Progreso del Módulo</span>
                                                                                <h4 className="text-sm font-black uppercase text-foreground leading-tight">{cuestionarioActivo.titulo}</h4>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                                                                            {/* ── TEMPORIZADOR en barra de progreso ── siempre visible si hay tiempo límite y video visto */}
                                                                            {videoVisto && cuestionarioActivo.tiempoMaximo && cuestionarioActivo.tiempoMaximo > 0 && startTime && (
                                                                                <Timer_Cuestionario
                                                                                    segundos={cuestionarioActivo.tiempoMaximo * 60}
                                                                                    startTime={startTime}
                                                                                    onExpire={() => {
                                                                                        setTimerExpired(true);
                                                                                        handleEnviarCuestionario();
                                                                                    }}
                                                                                />
                                                                            )}
                                                                            {videoVisto && pregs.length > 0 && (
                                                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 shrink-0">
                                                                                    {cuestionarioActivo.preguntas.filter(p => {
                                                                                        const r = respuestas[p.id];
                                                                                        return r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                                                    }).length}/{pregs.length} Respondidas
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Grid de diapositivas interactivo */}
                                                                    {pregs.length <= 10 ? (
                                                                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                                                                            {hasVideo && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSlideDirection(0 < preguntaIdx ? 'backward' : 'forward');
                                                                                        setPreguntaIdx(0);
                                                                                    }}
                                                                                    className={cn(
                                                                                        "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                                                                        preguntaIdx === 0
                                                                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                                            : videoVisto
                                                                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                                                                                                : "bg-primary/5 text-primary border-primary/20 animate-pulse"
                                                                                    )}
                                                                                >
                                                                                    <Video className="w-3.5 h-3.5" />
                                                                                    <span>Video</span>
                                                                                    {videoVisto && <Check className="w-3 h-3 text-emerald-500" />}
                                                                                </button>
                                                                            )}

                                                                            {videoVisto && pregs.map((p, i) => {
                                                                                const slideIdx = hasVideo ? i + 1 : i;
                                                                                const r = respuestas[p.id];
                                                                                const respondida = r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                                                const esActual = preguntaIdx === slideIdx;

                                                                                return (
                                                                                    <button
                                                                                        key={p.id}
                                                                                        onClick={() => {
                                                                                            setSlideDirection(slideIdx < preguntaIdx ? 'backward' : 'forward');
                                                                                            setPreguntaIdx(slideIdx);
                                                                                        }}
                                                                                        title={`Ir a Pregunta ${i + 1}`}
                                                                                        className={cn(
                                                                                            "flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                                                                            esActual
                                                                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                                                : respondida
                                                                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15"
                                                                                                    : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                                                                                        )}
                                                                                    >
                                                                                        <span>P{i + 1}</span>
                                                                                        {respondida && <Check className="w-3 h-3 text-emerald-500" />}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (() => {
                                                                        const activeQuestionIdx = hasVideo ? preguntaIdx - 1 : preguntaIdx;
                                                                        const totalPregs = pregs.length;
                                                                        let start = Math.max(0, activeQuestionIdx - 2);
                                                                        let end = Math.min(totalPregs - 1, start + 4);
                                                                        if (end - start < 4) {
                                                                            start = Math.max(0, end - 4);
                                                                        }
                                                                        const visibleQuestionIndices = [];
                                                                        for (let i = start; i <= end; i++) {
                                                                            visibleQuestionIndices.push(i);
                                                                        }

                                                                        const totalRespondidas = pregs.filter(p => {
                                                                            const r = respuestas[p.id];
                                                                            return r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                                        }).length;
                                                                        const pctRespondidas = Math.round((totalRespondidas / totalPregs) * 100);

                                                                        return (
                                                                            <div className="w-full pt-3 border-t border-border/50 space-y-3">
                                                                                {/* Header info bar inside selector */}
                                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider">
                                                                                    <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                                                                                        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-xl border border-primary/20">
                                                                                            {preguntaIdx === 0 && hasVideo ? 'Viendo Video' : `Pregunta ${activeQuestionIdx + 1} / ${totalPregs}`}
                                                                                        </span>
                                                                                        <span className="opacity-50">•</span>
                                                                                        <span className="text-emerald-500 font-black">
                                                                                            {totalRespondidas} de {totalPregs} respondidas ({pctRespondidas}%)
                                                                                        </span>
                                                                                    </div>
                                                                                    {/* Thin progress bar representing answered questions */}
                                                                                    <div className="w-full sm:w-40 h-2 bg-muted rounded-full overflow-hidden border border-border/30">
                                                                                        <div
                                                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                                                            style={{ width: `${pctRespondidas}%` }}
                                                                                        />
                                                                                    </div>
                                                                                </div>

                                                                                {/* Navigation controls */}
                                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                                    {/* Video Button */}
                                                                                    {hasVideo && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setSlideDirection(0 < preguntaIdx ? 'backward' : 'forward');
                                                                                                setPreguntaIdx(0);
                                                                                            }}
                                                                                            className={cn(
                                                                                                "flex items-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0",
                                                                                                preguntaIdx === 0
                                                                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                                                    : videoVisto
                                                                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                                                                                                        : "bg-primary/5 text-primary border-primary/20 animate-pulse"
                                                                                            )}
                                                                                        >
                                                                                            <Video className="w-3.5 h-3.5" />
                                                                                            <span>Video</span>
                                                                                            {videoVisto && <Check className="w-3 h-3 text-emerald-500" />}
                                                                                        </button>
                                                                                    )}

                                                                                    {/* Separator / Divider if video is present */}
                                                                                    {hasVideo && <div className="h-6 w-[1px] bg-border mx-1" />}

                                                                                    {/* Left/Prev Arrow */}
                                                                                    {videoVisto && (
                                                                                        <button
                                                                                            disabled={preguntaIdx === 0}
                                                                                            onClick={() => {
                                                                                                setSlideDirection('backward');
                                                                                                setPreguntaIdx(prev => Math.max(0, prev - 1));
                                                                                            }}
                                                                                            className={cn(
                                                                                                "flex items-center justify-center w-8 h-8 rounded-xl border transition-all text-muted-foreground hover:text-foreground",
                                                                                                preguntaIdx === 0
                                                                                                    ? "opacity-30 cursor-not-allowed border-transparent"
                                                                                                    : "bg-card border-border hover:border-primary/30"
                                                                                            )}
                                                                                            title="Pregunta Anterior"
                                                                                        >
                                                                                            <ChevronLeft className="w-4 h-4" />
                                                                                        </button>
                                                                                    )}

                                                                                    {/* First Question Button and Ellipsis if window is shifted */}
                                                                                    {videoVisto && start > 0 && (
                                                                                        <>
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    const slideIdx = hasVideo ? 1 : 0;
                                                                                                    setSlideDirection(slideIdx < preguntaIdx ? 'backward' : 'forward');
                                                                                                    setPreguntaIdx(slideIdx);
                                                                                                }}
                                                                                                className={cn(
                                                                                                    "flex items-center justify-center h-8 w-8 rounded-xl text-[10px] font-black transition-all border",
                                                                                                    (hasVideo ? preguntaIdx === 1 : preguntaIdx === 0)
                                                                                                        ? "bg-primary text-white border-primary"
                                                                                                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                                                                                                )}
                                                                                            >
                                                                                                1
                                                                                            </button>
                                                                                            {start > 1 && (
                                                                                                <span className="text-muted-foreground/60 font-black text-[10px] px-1 select-none">...</span>
                                                                                            )}
                                                                                        </>
                                                                                    )}

                                                                                    {/* Windowed Question Buttons */}
                                                                                    {videoVisto && visibleQuestionIndices.map((i) => {
                                                                                        const slideIdx = hasVideo ? i + 1 : i;
                                                                                        const r = respuestas[pregs[i].id];
                                                                                        const respondida = r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                                                        const esActual = preguntaIdx === slideIdx;

                                                                                        return (
                                                                                            <button
                                                                                                key={pregs[i].id}
                                                                                                onClick={() => {
                                                                                                    setSlideDirection(slideIdx < preguntaIdx ? 'backward' : 'forward');
                                                                                                    setPreguntaIdx(slideIdx);
                                                                                                }}
                                                                                                title={`Ir a Pregunta ${i + 1}`}
                                                                                                className={cn(
                                                                                                    "flex items-center justify-center gap-1 h-8 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                                                                                    esActual
                                                                                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                                                        : respondida
                                                                                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15"
                                                                                                            : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                                                                                                )}
                                                                                            >
                                                                                                <span>P{i + 1}</span>
                                                                                                {respondida && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                                                                                            </button>
                                                                                        );
                                                                                    })}

                                                                                    {/* Last Question Button and Ellipsis if window is shifted */}
                                                                                    {videoVisto && end < totalPregs - 1 && (
                                                                                        <>
                                                                                            {end < totalPregs - 2 && (
                                                                                                <span className="text-muted-foreground/60 font-black text-[10px] px-1 select-none">...</span>
                                                                                            )}
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    const slideIdx = hasVideo ? totalPregs : totalPregs - 1;
                                                                                                    setSlideDirection(slideIdx < preguntaIdx ? 'backward' : 'forward');
                                                                                                    setPreguntaIdx(slideIdx);
                                                                                                }}
                                                                                                className={cn(
                                                                                                    "flex items-center justify-center h-8 w-8 rounded-xl text-[10px] font-black transition-all border",
                                                                                                    (hasVideo ? preguntaIdx === totalPregs : preguntaIdx === totalPregs - 1)
                                                                                                        ? "bg-primary text-white border-primary"
                                                                                                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                                                                                                )}
                                                                                            >
                                                                                                {totalPregs}
                                                                                            </button>
                                                                                        </>
                                                                                    )}

                                                                                    {/* Right/Next Arrow */}
                                                                                    {videoVisto && (
                                                                                        <button
                                                                                            disabled={preguntaIdx === (hasVideo ? totalPregs : totalPregs - 1)}
                                                                                            onClick={() => {
                                                                                                setSlideDirection('forward');
                                                                                                setPreguntaIdx(prev => Math.min(hasVideo ? totalPregs : totalPregs - 1, prev + 1));
                                                                                            }}
                                                                                            className={cn(
                                                                                                "flex items-center justify-center w-8 h-8 rounded-xl border transition-all text-muted-foreground hover:text-foreground",
                                                                                                preguntaIdx === (hasVideo ? totalPregs : totalPregs - 1)
                                                                                                    ? "opacity-30 cursor-not-allowed border-transparent"
                                                                                                    : "bg-card border-border hover:border-primary/30"
                                                                                            )}
                                                                                            title="Pregunta Siguiente"
                                                                                        >
                                                                                            <ChevronRight className="w-4 h-4" />
                                                                                        </button>
                                                                                    )}

                                                                                    {/* Map Toggle Button */}
                                                                                    {videoVisto && (
                                                                                        <button
                                                                                            onClick={() => setMostrarMapaPreguntas(!mostrarMapaPreguntas)}
                                                                                            className={cn(
                                                                                                "flex items-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ml-auto shrink-0",
                                                                                                mostrarMapaPreguntas
                                                                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                                                                    : "bg-muted/30 text-muted-foreground border-border hover:border-primary/30"
                                                                                            )}
                                                                                            title="Ver todas las preguntas"
                                                                                        >
                                                                                            <LayoutGrid className="w-3.5 h-3.5" />
                                                                                            <span>Ver Todas</span>
                                                                                        </button>
                                                                                    )}
                                                                                </div>

                                                                                {/* Collapsible Questions Map */}
                                                                                <AnimatePresence>
                                                                                    {mostrarMapaPreguntas && (
                                                                                        <motion.div
                                                                                            initial={{ opacity: 0, height: 0 }}
                                                                                            animate={{ opacity: 1, height: 'auto' }}
                                                                                            exit={{ opacity: 0, height: 0 }}
                                                                                            className="pt-3 border-t border-border/50 space-y-2.5 overflow-hidden"
                                                                                        >
                                                                                            <div className="flex items-center justify-between">
                                                                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Mapa de Preguntas</span>
                                                                                                <button
                                                                                                    onClick={() => setMostrarMapaPreguntas(false)}
                                                                                                    className="text-[9px] font-black uppercase text-primary hover:underline"
                                                                                                >
                                                                                                    Ocultar
                                                                                                </button>
                                                                                            </div>
                                                                                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-40 overflow-y-auto p-1 scrollbar-thin">
                                                                                                {pregs.map((p, i) => {
                                                                                                    const slideIdx = hasVideo ? i + 1 : i;
                                                                                                    const r = respuestas[p.id];
                                                                                                    const respondida = r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                                                                    const esActual = preguntaIdx === slideIdx;

                                                                                                    return (
                                                                                                        <button
                                                                                                            key={p.id}
                                                                                                            onClick={() => {
                                                                                                                setSlideDirection(slideIdx < preguntaIdx ? 'backward' : 'forward');
                                                                                                                setPreguntaIdx(slideIdx);
                                                                                                            }}
                                                                                                            className={cn(
                                                                                                                "flex items-center justify-center gap-1 h-8 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                                                                                                esActual
                                                                                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                                                                    : respondida
                                                                                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15"
                                                                                                                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                                                                                                            )}
                                                                                                        >
                                                                                                            <span>P{i + 1}</span>
                                                                                                            {respondida && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                                                                                                        </button>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        </motion.div>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>

                                                                {/* ── PRESENTATION SLIDE CONTROLLER ── */}
                                                                <div className="relative overflow-hidden min-h-[300px]">
                                                                    <AnimatePresence mode="wait" initial={false}>
                                                                        <motion.div
                                                                            key={preguntaIdx}
                                                                            initial={{ opacity: 0, x: slideDirection === 'forward' ? 50 : -50 }}
                                                                            animate={{ opacity: 1, x: 0 }}
                                                                            exit={{ opacity: 0, x: slideDirection === 'forward' ? -50 : 50 }}
                                                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                                            className="w-full"
                                                                        >
                                                                            {(() => {
                                                                                const esSlideVideo = hasVideo && preguntaIdx === 0;

                                                                                if (esSlideVideo) {
                                                                                    // RENDER VIDEO SLIDE
                                                                                    const ytId = extractYouTubeId(cuestionarioActivo.urlVideo!);
                                                                                    const handleVideoEnd = async () => {
                                                                                        if (videoVisto) return;
                                                                                        try {
                                                                                            await eventoPublicoService.marcarVideoVisto(
                                                                                                evento!.id,
                                                                                                cuestionarioActivo.id,
                                                                                                form.ci,
                                                                                                form.fechaNacimiento
                                                                                            );
                                                                                            const progUpdate = await eventoPublicoService.getProgreso(evento!.id, form.ci, form.fechaNacimiento);
                                                                                            setProgreso(progUpdate.progress);

                                                                                            if (!cuestionarioActivo.preguntas || cuestionarioActivo.preguntas.length === 0) {
                                                                                                await handleCompletarSinPreguntas(cuestionarioActivo);
                                                                                            } else {
                                                                                                toast.success('¡Video completado! Ya puedes comenzar la evaluación.');
                                                                                            }
                                                                                        } catch (e) {
                                                                                            console.error('Error marcando video visto:', e);
                                                                                        }
                                                                                    };

                                                                                    return (
                                                                                        <div className={cn(
                                                                                            "bg-card border-2 rounded-3xl overflow-hidden shadow-xl transition-all duration-500",
                                                                                            videoVisto ? "border-emerald-500/20" : "border-primary/20"
                                                                                        )}>
                                                                                            <div className={cn(
                                                                                                "px-6 py-4 flex items-center justify-between gap-4 border-b border-border/40",
                                                                                                videoVisto ? "bg-emerald-500/5" : "bg-primary/5"
                                                                                            )}>
                                                                                                <div className="flex items-center gap-3">
                                                                                                    <div className={cn(
                                                                                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                                                                                                        videoVisto ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500" : "bg-primary/10 border-primary/25 text-primary"
                                                                                                    )}>
                                                                                                        <Video className="w-5 h-5" />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Diapositiva 1 · Video Clase</span>
                                                                                                        <h4 className="text-xs font-black uppercase text-foreground leading-tight">
                                                                                                            {videoVisto ? '✓ Video Visto — Puedes avanzar' : 'Ve el video completo para continuar'}
                                                                                                        </h4>
                                                                                                    </div>
                                                                                                </div>
                                                                                                {videoVisto && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                                                                                            </div>

                                                                                            <div className="relative w-full aspect-video">
                                                                                                <YouTube
                                                                                                    videoId={ytId}
                                                                                                    className="absolute inset-0 w-full h-full"
                                                                                                    iframeClassName="w-full h-full"
                                                                                                    opts={{ height: '100%', width: '100%', playerVars: { rel: 0, modestbranding: 1 } }}
                                                                                                    onStateChange={(event) => {
                                                                                                        const timer = videoTimersRef.current[cuestionarioActivo.id] || { totalTime: 0, lastStart: null, lastRate: 1 };
                                                                                                        const currentRate = event.target.getPlaybackRate() || 1;
                                                                                                        if (event.data === 1) {
                                                                                                            timer.lastStart = Date.now();
                                                                                                            timer.lastRate = currentRate;

                                                                                                            if (videoPlaybackRef.current[cuestionarioActivo.id]?.intervalId) {
                                                                                                                clearInterval(videoPlaybackRef.current[cuestionarioActivo.id].intervalId);
                                                                                                            }

                                                                                                            const isAlreadyWatched = !!videoVisto;

                                                                                                            const intervalId = setInterval(() => {
                                                                                                                const player = event.target;
                                                                                                                const currentTime = player.getCurrentTime();
                                                                                                                const playbackRecord = videoPlaybackRef.current[cuestionarioActivo.id] || { maxTime: 0, intervalId: null };

                                                                                                                if (!isAlreadyWatched) {
                                                                                                                    if (currentTime > playbackRecord.maxTime + 3) {
                                                                                                                        player.seekTo(playbackRecord.maxTime, true);
                                                                                                                        toast.warning('No está permitido adelantar el video.');
                                                                                                                    } else {
                                                                                                                        playbackRecord.maxTime = Math.max(playbackRecord.maxTime, currentTime);
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    playbackRecord.maxTime = Math.max(playbackRecord.maxTime, currentTime);
                                                                                                                }

                                                                                                                videoPlaybackRef.current[cuestionarioActivo.id] = {
                                                                                                                    ...playbackRecord,
                                                                                                                    intervalId
                                                                                                                };
                                                                                                            }, 500);

                                                                                                            videoPlaybackRef.current[cuestionarioActivo.id] = {
                                                                                                                maxTime: videoPlaybackRef.current[cuestionarioActivo.id]?.maxTime || 0,
                                                                                                                intervalId
                                                                                                            };
                                                                                                        } else {
                                                                                                            if (timer.lastStart) {
                                                                                                                timer.totalTime += ((Date.now() - timer.lastStart) / 1000) * (timer.lastRate || 1);
                                                                                                                timer.lastStart = null;
                                                                                                            }
                                                                                                            if (videoPlaybackRef.current[cuestionarioActivo.id]?.intervalId) {
                                                                                                                clearInterval(videoPlaybackRef.current[cuestionarioActivo.id].intervalId);
                                                                                                                videoPlaybackRef.current[cuestionarioActivo.id].intervalId = null;
                                                                                                            }
                                                                                                        }
                                                                                                        videoTimersRef.current[cuestionarioActivo.id] = timer;
                                                                                                    }}
                                                                                                    onPlaybackRateChange={(event) => {
                                                                                                        const timer = videoTimersRef.current[cuestionarioActivo.id] || { totalTime: 0, lastStart: null, lastRate: 1 };
                                                                                                        const newRate = event.data;
                                                                                                        if (timer.lastStart) {
                                                                                                            timer.totalTime += ((Date.now() - timer.lastStart) / 1000) * (timer.lastRate || 1);
                                                                                                            timer.lastStart = Date.now();
                                                                                                        }
                                                                                                        timer.lastRate = newRate;
                                                                                                        videoTimersRef.current[cuestionarioActivo.id] = timer;
                                                                                                    }}
                                                                                                    onEnd={async (event) => {
                                                                                                        if (videoPlaybackRef.current[cuestionarioActivo.id]?.intervalId) {
                                                                                                            clearInterval(videoPlaybackRef.current[cuestionarioActivo.id].intervalId);
                                                                                                            videoPlaybackRef.current[cuestionarioActivo.id].intervalId = null;
                                                                                                        }

                                                                                                        const timer = videoTimersRef.current[cuestionarioActivo.id] || { totalTime: 0, lastStart: null, lastRate: 1 };
                                                                                                        if (timer.lastStart) {
                                                                                                            timer.totalTime += ((Date.now() - timer.lastStart) / 1000) * (timer.lastRate || 1);
                                                                                                            timer.lastStart = null;
                                                                                                        }
                                                                                                        const duration = event.target.getDuration();
                                                                                                        if (timer.totalTime < duration * 0.9) {
                                                                                                            setVideoWarningModal(true);
                                                                                                            videoTimersRef.current[cuestionarioActivo.id] = { totalTime: 0, lastStart: null, lastRate: 1 };
                                                                                                            event.target.seekTo(0);
                                                                                                            return;
                                                                                                        }

                                                                                                        setLocalVideosVistos(prev => {
                                                                                                            const next = { ...prev, [cuestionarioActivo.id]: true };
                                                                                                            localStorage.setItem('local_videos_vistos', JSON.stringify(next));
                                                                                                            return next;
                                                                                                        });

                                                                                                        await handleVideoEnd();
                                                                                                    }}
                                                                                                />
                                                                                            </div>

                                                                                            <div className="p-5 bg-muted/10 border-t border-border flex items-center justify-end">
                                                                                                {cuestionarioActivo.preguntas.length > 0 && (
                                                                                                    <button
                                                                                                        disabled={!videoVisto}
                                                                                                        onClick={() => {
                                                                                                            if (videoVisto) {
                                                                                                                setSlideDirection('forward');
                                                                                                                setPreguntaIdx(1);
                                                                                                            }
                                                                                                        }}
                                                                                                        className={cn(
                                                                                                            "flex items-center justify-center gap-2 h-12 px-6 rounded-2xl font-black text-xs uppercase transition-all shadow-lg",
                                                                                                            videoVisto
                                                                                                                ? "bg-primary text-white hover:opacity-90 shadow-primary/20 scale-102 animate-pulse"
                                                                                                                : "bg-muted text-muted-foreground border border-dashed border-border opacity-50 cursor-not-allowed shadow-none"
                                                                                                        )}
                                                                                                    >
                                                                                                        {videoVisto ? (
                                                                                                            <>
                                                                                                                Ir a Preguntas <ChevronRight className="w-4 h-4" />
                                                                                                            </>
                                                                                                        ) : (
                                                                                                            <>
                                                                                                                <Lock className="w-3.5 h-3.5 mr-1" /> Ve el video completo
                                                                                                            </>
                                                                                                        )}
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                // RENDER PREGUNTA SLIDE
                                                                                const pregRealIdx = hasVideo ? preguntaIdx - 1 : preguntaIdx;
                                                                                const preg = cuestionarioActivo.preguntas[pregRealIdx];
                                                                                if (!preg) return null;

                                                                                if (!startTime) {
                                                                                    // PANTALLA DE BIENVENIDA / INSTRUCCIONES DE LA EVALUACIÓN
                                                                                    const progC = progreso?.find((p: any) => p.id === cuestionarioActivo.id);
                                                                                    const intentosRealizados = progC?.numeroIntentos || 0;
                                                                                    const limitValue = progC?.limiteIntentos ?? cuestionarioActivo.limiteIntentos;
                                                                                    const limiteAgotado = limitValue != null && intentosRealizados >= limitValue;

                                                                                    // ── LÍMITE DE INTENTOS ALCANZADO: bloquear entrada ──────────────
                                                                                    if (limiteAgotado) {
                                                                                        return (
                                                                                            <motion.div
                                                                                                initial={{ opacity: 0, scale: 0.97 }}
                                                                                                animate={{ opacity: 1, scale: 1 }}
                                                                                                className="bg-card border-2 border-red-500/30 rounded-3xl p-8 text-center space-y-6 shadow-xl bg-gradient-to-br from-red-500/5 via-card to-card"
                                                                                            >
                                                                                                <div className="w-20 h-20 rounded-[1.5rem] bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto text-red-500">
                                                                                                    <Lock className="w-10 h-10" />
                                                                                                </div>

                                                                                                <div className="space-y-2">
                                                                                                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-red-500/70">Acceso Bloqueado</span>
                                                                                                    <h3 className="text-xl font-black uppercase text-foreground tracking-tight leading-snug">
                                                                                                        Límite de Intentos Alcanzado
                                                                                                    </h3>
                                                                                                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-bold uppercase tracking-wider opacity-80">
                                                                                                        Has utilizado todos los intentos disponibles para esta evaluación. Ya no es posible realizar un nuevo intento.
                                                                                                    </p>
                                                                                                </div>

                                                                                                <div className="bg-muted/20 border border-border/50 rounded-2xl p-5 max-w-sm mx-auto space-y-3 text-left">
                                                                                                    <div className="flex justify-between items-center">
                                                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Intentos realizados</span>
                                                                                                        <span className="text-sm font-black text-red-500">{intentosRealizados} / {limitValue}</span>
                                                                                                    </div>
                                                                                                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                                                                                                        <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
                                                                                                    </div>
                                                                                                    {progC?.nota != null && (
                                                                                                        <div className="flex justify-between items-center pt-1 border-t border-border/40">
                                                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Mejor nota obtenida</span>
                                                                                                            <span className={`text-sm font-black ${(progC?.nota ?? 0) >= (cuestionarioActivo.puntajeMinimo || 75) ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                                                                {progC?.nota ?? 0} / 100
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>

                                                                                                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                                                                                                    Comunícate con el organizador si necesitas asistencia.
                                                                                                </p>
                                                                                            </motion.div>
                                                                                        );
                                                                                    }
                                                                                    // ────────────────────────────────────────────────────────────────

                                                                                    return (
                                                                                        <motion.div
                                                                                            initial={{ opacity: 0, scale: 0.98 }}
                                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                                            className="bg-card border border-border rounded-3xl p-8 text-center space-y-6 shadow-xl"
                                                                                        >
                                                                                            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                                                                                                <ClipboardList className="w-8 h-8" />
                                                                                            </div>

                                                                                            <div className="space-y-2">
                                                                                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                                                                                                    {cuestionarioActivo.esEvaluativo ? 'Evaluación de Módulo' : 'Formulario de Módulo'}
                                                                                                </span>
                                                                                                <h3 className="text-xl font-black uppercase text-foreground tracking-tight leading-snug">
                                                                                                    {cuestionarioActivo.titulo}
                                                                                                </h3>
                                                                                                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed font-bold uppercase tracking-wider opacity-80">
                                                                                                    {cuestionarioActivo.esEvaluativo
                                                                                                        ? 'Prepárate para responder las preguntas de evaluación de este módulo. Una vez que inicies, el tiempo comenzará a correr.'
                                                                                                        : 'Completa este formulario para registrar tu participación. No se asigna nota, solo debes responder todas las preguntas.'}
                                                                                                </p>
                                                                                            </div>

                                                                                            <div className={`grid gap-4 max-w-md mx-auto bg-muted/20 p-5 rounded-2xl border border-border/50 text-left ${cuestionarioActivo.esEvaluativo ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                                                                                <div className="space-y-0.5">
                                                                                                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Preguntas</p>
                                                                                                    <p className="text-sm font-black text-foreground">{cuestionarioActivo.preguntas.length} preguntas</p>
                                                                                                </div>
                                                                                                <div className="space-y-0.5">
                                                                                                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Tiempo Límite</p>
                                                                                                    <p className="text-sm font-black text-foreground">
                                                                                                        {cuestionarioActivo.tiempoMaximo && cuestionarioActivo.tiempoMaximo > 0
                                                                                                            ? `${cuestionarioActivo.tiempoMaximo} minutos`
                                                                                                            : 'Sin límite'}
                                                                                                    </p>
                                                                                                </div>
                                                                                                {cuestionarioActivo.esEvaluativo ? (
                                                                                                    <div className="space-y-0.5">
                                                                                                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Nota de Aprobación</p>
                                                                                                        <p className="text-sm font-black text-emerald-500">{cuestionarioActivo.puntajeMinimo || 75} / 100 pts</p>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="space-y-0.5">
                                                                                                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Tipo</p>
                                                                                                        <p className="text-sm font-black text-primary">Formulario</p>
                                                                                                    </div>
                                                                                                )}
                                                                                                <div className="space-y-0.5">
                                                                                                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Intentos</p>
                                                                                                    <p className="text-sm font-black text-foreground">
                                                                                                        {intentosRealizados} realizados {limitValue ? `de ${limitValue}` : ''}
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="pt-2 max-w-xs mx-auto">
                                                                                                <button
                                                                                                    onClick={() => {
                                                                                                        const now = Date.now();
                                                                                                        setStartTime(now);
                                                                                                        // Guardar sesión
                                                                                                        const session = {
                                                                                                            cuestionarioActivo,
                                                                                                            respuestas,
                                                                                                            preguntaIdx,
                                                                                                            startTime: now,
                                                                                                            step: 'info'
                                                                                                        };
                                                                                                        localStorage.setItem(`cuestionario_session_${evento!.id}`, JSON.stringify(session));
                                                                                                    }}
                                                                                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
                                                                                                >
                                                                                                    <Play className="w-4 h-4 fill-white animate-pulse" />
                                                                                                    {cuestionarioActivo.esEvaluativo ? 'Iniciar Evaluación' : 'Iniciar Formulario'}
                                                                                                </button>
                                                                                            </div>
                                                                                        </motion.div>
                                                                                    );
                                                                                }

                                                                                const totalRespondidas = cuestionarioActivo.preguntas.filter(p => {
                                                                                    const r = respuestas[p.id];
                                                                                    return r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                                                }).length;

                                                                                const isLastQuestion = pregRealIdx === cuestionarioActivo.preguntas.length - 1;

                                                                                return (
                                                                                    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
                                                                                        {/* Header de pregunta */}
                                                                                        <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between gap-4 flex-wrap">
                                                                                            <div className="flex items-center gap-3">
                                                                                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                                                                                    <span className="text-sm font-black text-primary">{pregRealIdx + 1}</span>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Pregunta {pregRealIdx + 1} de {cuestionarioActivo.preguntas.length}</span>
                                                                                                    <p className="text-[10px] font-bold text-muted-foreground leading-none mt-1">
                                                                                                        {preg.tipo === 'SINGLE' ? 'Selección única' : preg.tipo === 'MULTIPLE' ? 'Selección múltiple' : preg.tipo === 'TRUE_FALSE' ? 'Verdadero / Falso' : 'Respuesta abierta'}
                                                                                                        {cuestionarioActivo.esEvaluativo && <>{' • '}<span className="text-primary font-black">{preg.puntos} pt{preg.puntos !== 1 ? 's' : ''}</span></>}
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2 shrink-0">
                                                                                                {respuestas[preg.id] !== undefined && respuestas[preg.id] !== '' && !(Array.isArray(respuestas[preg.id]) && respuestas[preg.id].length === 0) && (
                                                                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                                                                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                                                                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500">Respondida</span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="p-6 md:p-8 space-y-6">
                                                                                            {/* Texto de la pregunta */}
                                                                                            <div className="text-base md:text-lg font-bold text-foreground leading-relaxed prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: preg.texto }} />

                                                                                            {/* Opciones */}
                                                                                            <div className="space-y-3">
                                                                                                {(preg.tipo === 'SINGLE' || preg.tipo === 'TRUE_FALSE') && preg.opciones.map((opt, oi) => (
                                                                                                    <button key={opt.id} onClick={() => setRespuestas(r => ({ ...r, [preg.id]: opt.id }))}
                                                                                                        className={`w-full flex items-center gap-4 px-5 h-14 rounded-2xl border-2 font-bold text-sm text-left transition-all group ${respuestas[preg.id] === opt.id
                                                                                                            ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/10'
                                                                                                            : 'border-border bg-muted/20 text-foreground hover:border-primary/40 hover:bg-primary/5'
                                                                                                            }`}>
                                                                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${respuestas[preg.id] === opt.id ? 'border-primary bg-primary' : 'border-muted-foreground group-hover:border-primary/60'
                                                                                                            }`}>
                                                                                                            {respuestas[preg.id] === opt.id
                                                                                                                ? <Check className="w-3.5 h-3.5 text-white" />
                                                                                                                : <span className="text-[9px] font-black text-muted-foreground">{String.fromCharCode(65 + oi)}</span>
                                                                                                            }
                                                                                                        </div>
                                                                                                        {opt.texto}
                                                                                                    </button>
                                                                                                ))}

                                                                                                {preg.tipo === 'MULTIPLE' && preg.opciones.map((opt, oi) => {
                                                                                                    const selected: string[] = respuestas[preg.id] || [];
                                                                                                    const isChecked = selected.includes(opt.id);
                                                                                                    return (
                                                                                                        <button key={opt.id} onClick={() => setRespuestas(r => ({ ...r, [preg.id]: isChecked ? selected.filter(x => x !== opt.id) : [...selected, opt.id] }))}
                                                                                                            className={`w-full flex items-center gap-4 px-5 h-14 rounded-2xl border-2 font-bold text-sm text-left transition-all group ${isChecked
                                                                                                                ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/10'
                                                                                                                : 'border-border bg-muted/20 text-foreground hover:border-primary/40 hover:bg-primary/5'
                                                                                                                }`}>
                                                                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'border-primary bg-primary' : 'border-muted-foreground group-hover:border-primary/60'
                                                                                                                }`}>
                                                                                                                {isChecked
                                                                                                                    ? <Check className="w-3.5 h-3.5 text-white" />
                                                                                                                    : <span className="text-[9px] font-black text-muted-foreground">{String.fromCharCode(65 + oi)}</span>
                                                                                                                }
                                                                                                            </div>
                                                                                                            {opt.texto}
                                                                                                        </button>
                                                                                                    );
                                                                                                })}

                                                                                                {preg.tipo === 'TEXTO' && (
                                                                                                    <textarea placeholder="Escribe tu respuesta aquí..."
                                                                                                        value={respuestas[preg.id] || ''}
                                                                                                        onChange={e => setRespuestas(r => ({ ...r, [preg.id]: e.target.value }))}
                                                                                                        className="w-full p-5 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none text-foreground font-medium resize-none h-36 transition-all"
                                                                                                    />
                                                                                                )}
                                                                                            </div>

                                                                                            {/* Navegación y Auto-guardado */}
                                                                                            <div className="flex flex-col gap-4 pt-4 border-t border-border/80">
                                                                                                <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-muted/30">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        {lastSavedStatus === 'saved' ? (
                                                                                                            <>
                                                                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                                                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Respuestas guardadas</span>
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
                                                                                                    <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">Auto-guardado</span>
                                                                                                </div>

                                                                                                <div className="flex items-center justify-between gap-3">
                                                                                                    <button
                                                                                                        onClick={() => {
                                                                                                            setSlideDirection('backward');
                                                                                                            setPreguntaIdx(i => Math.max(0, i - 1));
                                                                                                        }}
                                                                                                        className="flex items-center gap-2 h-12 px-5 rounded-2xl bg-muted text-muted-foreground hover:text-foreground font-bold text-xs uppercase transition-all"
                                                                                                    >
                                                                                                        <ChevronLeft className="w-4 h-4" /> Anterior
                                                                                                    </button>

                                                                                                    {!isLastQuestion ? (
                                                                                                        <button
                                                                                                            onClick={() => {
                                                                                                                setSlideDirection('forward');
                                                                                                                setPreguntaIdx(i => i + 1);
                                                                                                            }}
                                                                                                            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                                                                                        >
                                                                                                            Siguiente <ChevronRight className="w-4 h-4" />
                                                                                                        </button>
                                                                                                    ) : (
                                                                                                        <button
                                                                                                            onClick={() => handleEnviarCuestionario()}
                                                                                                            disabled={submitting}
                                                                                                            className="flex-1 flex items-center justify-center gap-2 h-14 md:h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-black text-xs uppercase hover:opacity-90 disabled:opacity-40 transition-all shadow-xl shadow-emerald-600/25"
                                                                                                        >
                                                                                                            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                                                                            {totalRespondidas < cuestionarioActivo.preguntas.length
                                                                                                                ? `Enviar (${totalRespondidas}/${cuestionarioActivo.preguntas.length})`
                                                                                                                : 'Enviar Cuestionario ✓'
                                                                                                            }
                                                                                                        </button>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </motion.div>
                                                                    </AnimatePresence>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                                                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                                            <h3 className="font-black uppercase text-sm text-foreground">Cargando Módulo...</h3>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}{/* Afiche Principal */}
                                {!persona && evento.afiche && (
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

                                {!persona && (
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
                                )}
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
                                            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
                                                {evento?.inscripcionAbierta ? 'Identificación' : 'Evaluación'}
                                            </h2>
                                            <p className="text-muted-foreground max-w-md mx-auto">
                                                {evento?.inscripcionAbierta
                                                    ? 'Valida tus datos para continuar con la inscripción o evaluación.'
                                                    : 'Ingresa tus datos para acceder a tus evaluaciones.'}
                                            </p>
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
                                        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">{isEditingProfile ? 'Actualizar Datos' : 'Datos del Participante'}</h2>
                                        <p className="text-sm text-muted-foreground mt-1">{isEditingProfile ? 'Modifica tu información de contacto y nombres.' : (persona ? 'Tus datos fueron encontrados. Verifica o actualiza.' : 'Completa tus datos para inscribirte.')}</p>
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
                                            autoComplete="new-password"
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

                                    {!isEditingProfile && (
                                        <>
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
                                        </>
                                    )}

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

                                    {!isEditingProfile && (
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
                                    )}

                                    {/* CAMPOS EXTRAS */}
                                    {!isEditingProfile && evento.camposExtras?.map((campo: any) => (
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
                                    <button
                                        onClick={() => {
                                            if (isEditingProfile) {
                                                setIsEditingProfile(false);
                                                setStep('info');
                                            } else {
                                                setStep('identificacion');
                                            }
                                        }}
                                        className="h-14 px-6 rounded-2xl text-xs font-black uppercase text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        {isEditingProfile ? 'Cancelar' : 'Volver'}
                                    </button>
                                    <button onClick={handleInscribirse} disabled={!form.nombre1 || !form.apellido1 || (!isEditingProfile && (!form.modalidadId || !form.departamentoId)) || submitting}
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
                                                    <p className="font-bold text-foreground font-mono">{form.ci}{form.complemento ? `-${form.complemento}` : ''}</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Contacto</span>
                                                    <p className="font-bold text-foreground">{form.celular} • {form.correo || 'S/N'}</p>
                                                </div>
                                                {!isEditingProfile && (
                                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Modalidad</span>
                                                        <p className="font-bold text-primary">
                                                            {allModalidades.find(m => m.id === form.modalidadId)?.nombre || 'No seleccionada'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Campos extras preview */}
                                            {!isEditingProfile && (evento?.camposExtras?.length ?? 0) > 0 && (
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
                                            <span className="font-bold text-primary uppercase bg-primary/10 px-2.5 py-0.5 rounded-md">
                                                {persona?.nombre1} {persona?.nombre2} {persona?.apellido1} {persona?.apellido2}
                                            </span>
                                            <span className="hidden sm:inline opacity-50">•</span>
                                            {cuestionarioActivo.preguntas.length > 0 ? (
                                                <span className="font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md">{cuestionarioActivo.preguntas.length} preguntas</span>
                                            ) : (
                                                <span className="font-bold text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <Video className="w-3.5 h-3.5" /> Clase en Video
                                                </span>
                                            )}
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

                                {/* ── SLIDE TIMELINE INDICATOR ── */}
                                {(() => {
                                    const progC = progreso?.find((p: any) => p.id === cuestionarioActivo.id);
                                    const videoVisto = !cuestionarioActivo.urlVideo || progC?.videoCompletado || localVideosVistos[cuestionarioActivo.id];
                                    const hasVideo = !!cuestionarioActivo.urlVideo;
                                    const pregs = cuestionarioActivo.preguntas;

                                    return (
                                        <div className="bg-card/80 backdrop-blur-md border border-border rounded-3xl p-4 md:p-6 space-y-4 shadow-xl shadow-black/5">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <ClipboardList className="w-5 h-5 text-primary" />
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Progreso del Módulo</span>
                                                        <h4 className="text-sm font-black uppercase text-foreground leading-tight">{cuestionarioActivo.titulo}</h4>
                                                    </div>
                                                </div>
                                                {pregs.length > 0 && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 shrink-0 self-start md:self-auto">
                                                        {cuestionarioActivo.preguntas.filter(p => {
                                                            const r = respuestas[p.id];
                                                            return r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                        }).length}/{pregs.length} Preguntas Respondidas
                                                    </span>
                                                )}
                                            </div>

                                            {/* Grid de diapositivas interactivo */}
                                            {pregs.length <= 10 ? (
                                                <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-border/50">
                                                    {/* Botón Slide Video */}
                                                    {hasVideo && (
                                                        <button
                                                            onClick={() => {
                                                                setSlideDirection(0 < preguntaIdx ? 'backward' : 'forward');
                                                                setPreguntaIdx(0);
                                                            }}
                                                            className={cn(
                                                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border",
                                                                preguntaIdx === 0
                                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                    : videoVisto
                                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 hover:scale-102"
                                                                        : "bg-primary/5 text-primary border-primary/20 animate-pulse"
                                                            )}
                                                        >
                                                            <Video className="w-3.5 h-3.5" />
                                                            <span>Video</span>
                                                            {videoVisto && <Check className="w-3 h-3 text-emerald-500" />}
                                                        </button>
                                                    )}

                                                    {/* Preguntas */}
                                                    {pregs.map((p, i) => {
                                                        const slideIdx = hasVideo ? i + 1 : i;
                                                        const r = respuestas[p.id];
                                                        const respondida = r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                        const esActual = preguntaIdx === slideIdx;
                                                        const deshabilitado = hasVideo && !videoVisto;

                                                        return (
                                                            <button
                                                                key={p.id}
                                                                disabled={deshabilitado}
                                                                onClick={() => {
                                                                    if (deshabilitado) return;
                                                                    setSlideDirection(slideIdx < preguntaIdx ? 'backward' : 'forward');
                                                                    setPreguntaIdx(slideIdx);
                                                                }}
                                                                title={`Ir a Pregunta ${i + 1}`}
                                                                className={cn(
                                                                    "flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border",
                                                                    esActual
                                                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                        : deshabilitado
                                                                            ? "bg-muted/40 text-muted-foreground/30 border-border/20 cursor-not-allowed opacity-50"
                                                                            : respondida
                                                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15 hover:scale-102"
                                                                                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30 hover:scale-102"
                                                                )}
                                                            >
                                                                <span>P{i + 1}</span>
                                                                {respondida && <Check className="w-3 h-3 text-emerald-500" />}
                                                                {deshabilitado && <Lock className="w-3 h-3 text-muted-foreground/40" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (() => {
                                                const activeQuestionIdx = hasVideo ? preguntaIdx - 1 : preguntaIdx;
                                                const totalPregs = pregs.length;
                                                let start = Math.max(0, activeQuestionIdx - 2);
                                                let end = Math.min(totalPregs - 1, start + 4);
                                                if (end - start < 4) {
                                                    start = Math.max(0, end - 4);
                                                }
                                                const visibleQuestionIndices = [];
                                                for (let i = start; i <= end; i++) {
                                                    visibleQuestionIndices.push(i);
                                                }

                                                const totalRespondidas = pregs.filter(p => {
                                                    const r = respuestas[p.id];
                                                    return r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                }).length;
                                                const pctRespondidas = Math.round((totalRespondidas / totalPregs) * 100);
                                                const deshabilitado = hasVideo && !videoVisto;

                                                return (
                                                    <div className="w-full pt-2 border-t border-border/50 space-y-3.5">
                                                        {/* Header info bar inside selector */}
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-black uppercase tracking-wider">
                                                            <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                                                                <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-xl border border-primary/20">
                                                                    {preguntaIdx === 0 && hasVideo ? 'Viendo Video' : `Pregunta ${activeQuestionIdx + 1} / ${totalPregs}`}
                                                                </span>
                                                                <span className="opacity-50">•</span>
                                                                <span className="text-emerald-500 font-black">
                                                                    {totalRespondidas} de {totalPregs} respondidas ({pctRespondidas}%)
                                                                </span>
                                                            </div>
                                                            {/* Thin progress bar representing answered questions */}
                                                            <div className="w-full sm:w-40 h-2 bg-muted rounded-full overflow-hidden border border-border/30">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                                    style={{ width: `${pctRespondidas}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Navigation controls */}
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {/* Video Button */}
                                                            {hasVideo && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSlideDirection(0 < preguntaIdx ? 'backward' : 'forward');
                                                                        setPreguntaIdx(0);
                                                                    }}
                                                                    className={cn(
                                                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shrink-0",
                                                                        preguntaIdx === 0
                                                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                            : videoVisto
                                                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 hover:scale-102"
                                                                                : "bg-primary/5 text-primary border-primary/20 animate-pulse"
                                                                    )}
                                                                >
                                                                    <Video className="w-3.5 h-3.5" />
                                                                    <span>Video</span>
                                                                    {videoVisto && <Check className="w-3 h-3 text-emerald-500" />}
                                                                </button>
                                                            )}

                                                            {/* Separator / Divider if video is present */}
                                                            {hasVideo && <div className="h-8 w-[1px] bg-border mx-1" />}

                                                            {/* Left/Prev Arrow */}
                                                            <button
                                                                disabled={preguntaIdx === 0 || deshabilitado}
                                                                onClick={() => {
                                                                    setSlideDirection('backward');
                                                                    setPreguntaIdx(prev => Math.max(0, prev - 1));
                                                                }}
                                                                className={cn(
                                                                    "flex items-center justify-center w-10 h-10 rounded-xl border transition-all text-muted-foreground hover:text-foreground",
                                                                    (preguntaIdx === 0 || deshabilitado)
                                                                        ? "opacity-30 cursor-not-allowed border-transparent"
                                                                        : "bg-card border-border hover:border-primary/30"
                                                                )}
                                                                title="Pregunta Anterior"
                                                            >
                                                                <ChevronLeft className="w-4.5 h-4.5" />
                                                            </button>

                                                            {/* First Question Button and Ellipsis if window is shifted */}
                                                            {!deshabilitado && start > 0 && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            const slideIdx = hasVideo ? 1 : 0;
                                                                            setSlideDirection(slideIdx < preguntaIdx ? 'backward' : 'forward');
                                                                            setPreguntaIdx(slideIdx);
                                                                        }}
                                                                        className={cn(
                                                                            "flex items-center justify-center h-10 w-10 rounded-xl text-xs font-black transition-all border",
                                                                            (hasVideo ? preguntaIdx === 1 : preguntaIdx === 0)
                                                                                ? "bg-primary text-white border-primary"
                                                                                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                                                                        )}
                                                                    >
                                                                        1
                                                                    </button>
                                                                    {start > 1 && (
                                                                        <span className="text-muted-foreground/60 font-black text-xs px-1 select-none">...</span>
                                                                    )}
                                                                </>
                                                            )}

                                                            {/* Windowed Question Buttons */}
                                                            {visibleQuestionIndices.map((i) => {
                                                                const slideIdx = hasVideo ? i + 1 : i;
                                                                const r = respuestas[pregs[i].id];
                                                                const respondida = r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                                const esActual = preguntaIdx === slideIdx;

                                                                return (
                                                                    <button
                                                                        key={pregs[i].id}
                                                                        disabled={deshabilitado}
                                                                        onClick={() => {
                                                                            if (deshabilitado) return;
                                                                            setSlideDirection(slideIdx < preguntaIdx ? 'backward' : 'forward');
                                                                            setPreguntaIdx(slideIdx);
                                                                        }}
                                                                        title={`Ir a Pregunta ${i + 1}`}
                                                                        className={cn(
                                                                            "flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border",
                                                                            esActual
                                                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                                : deshabilitado
                                                                                    ? "bg-muted/40 text-muted-foreground/30 border-border/20 cursor-not-allowed opacity-50"
                                                                                    : respondida
                                                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15 hover:scale-102"
                                                                                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30 hover:scale-102"
                                                                        )}
                                                                    >
                                                                        <span>P{i + 1}</span>
                                                                        {respondida && <Check className="w-3 h-3 text-emerald-500" />}
                                                                        {deshabilitado && <Lock className="w-3 h-3 text-muted-foreground/40" />}
                                                                    </button>
                                                                );
                                                            })}

                                                            {/* Last Question Button and Ellipsis if window is shifted */}
                                                            {!deshabilitado && end < totalPregs - 1 && (
                                                                <>
                                                                    {end < totalPregs - 2 && (
                                                                        <span className="text-muted-foreground/60 font-black text-xs px-1 select-none">...</span>
                                                                    )}
                                                                    <button
                                                                        onClick={() => {
                                                                            const slideIdx = hasVideo ? totalPregs : totalPregs - 1;
                                                                            setSlideDirection(slideIdx < preguntaIdx ? 'backward' : 'forward');
                                                                            setPreguntaIdx(slideIdx);
                                                                        }}
                                                                        className={cn(
                                                                            "flex items-center justify-center h-10 w-10 rounded-xl text-xs font-black transition-all border",
                                                                            (hasVideo ? preguntaIdx === totalPregs : preguntaIdx === totalPregs - 1)
                                                                                ? "bg-primary text-white border-primary"
                                                                                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                                                                        )}
                                                                    >
                                                                        {totalPregs}
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* Right/Next Arrow */}
                                                            <button
                                                                disabled={preguntaIdx === (hasVideo ? totalPregs : totalPregs - 1) || deshabilitado}
                                                                onClick={() => {
                                                                    setSlideDirection('forward');
                                                                    setPreguntaIdx(prev => Math.min(hasVideo ? totalPregs : totalPregs - 1, prev + 1));
                                                                }}
                                                                className={cn(
                                                                    "flex items-center justify-center w-10 h-10 rounded-xl border transition-all text-muted-foreground hover:text-foreground",
                                                                    (preguntaIdx === (hasVideo ? totalPregs : totalPregs - 1) || deshabilitado)
                                                                        ? "opacity-30 cursor-not-allowed border-transparent"
                                                                        : "bg-card border-border hover:border-primary/30"
                                                                )}
                                                                title="Pregunta Siguiente"
                                                            >
                                                                <ChevronRight className="w-4.5 h-4.5" />
                                                            </button>

                                                            {/* Map Toggle Button */}
                                                            <button
                                                                disabled={deshabilitado}
                                                                onClick={() => setMostrarMapaPreguntas(!mostrarMapaPreguntas)}
                                                                className={cn(
                                                                    "flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ml-auto shrink-0",
                                                                    deshabilitado
                                                                        ? "bg-muted/40 text-muted-foreground/30 border-border/20 cursor-not-allowed opacity-50"
                                                                        : mostrarMapaPreguntas
                                                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-102"
                                                                            : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30 hover:scale-102"
                                                                )}
                                                                title="Ver todas las preguntas"
                                                            >
                                                                <LayoutGrid className="w-3.5 h-3.5" />
                                                                <span>Ver Todas</span>
                                                            </button>
                                                        </div>

                                                        {/* Collapsible Questions Map */}
                                                        <AnimatePresence>
                                                            {mostrarMapaPreguntas && !deshabilitado && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="pt-3.5 border-t border-border/50 space-y-2.5 overflow-hidden"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mapa de Preguntas</span>
                                                                        <button
                                                                            onClick={() => setMostrarMapaPreguntas(false)}
                                                                            className="text-[10px] font-black uppercase text-primary hover:underline"
                                                                        >
                                                                            Ocultar
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                                                                        {pregs.map((p, i) => {
                                                                            const slideIdx = hasVideo ? i + 1 : i;
                                                                            const r = respuestas[p.id];
                                                                            const respondida = r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                                            const esActual = preguntaIdx === slideIdx;

                                                                            return (
                                                                                <button
                                                                                    key={p.id}
                                                                                    onClick={() => {
                                                                                        setSlideDirection(slideIdx < preguntaIdx ? 'backward' : 'forward');
                                                                                        setPreguntaIdx(slideIdx);
                                                                                    }}
                                                                                    className={cn(
                                                                                        "flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all border",
                                                                                        esActual
                                                                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                                            : respondida
                                                                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15 hover:scale-102"
                                                                                                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30 hover:scale-102"
                                                                                    )}
                                                                                >
                                                                                    <span>P{i + 1}</span>
                                                                                    {respondida && <Check className="w-3 h-3 text-emerald-500" />}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })()}

                                {/* ── PRESENTATION SLIDE CONTROLLER ── */}
                                <div className="relative overflow-hidden min-h-[300px]">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.div
                                            key={preguntaIdx}
                                            initial={{ opacity: 0, x: slideDirection === 'forward' ? 50 : -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: slideDirection === 'forward' ? -50 : 50 }}
                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                            className="w-full"
                                        >
                                            {(() => {
                                                const progC = progreso?.find((p: any) => p.id === cuestionarioActivo.id);
                                                const videoVisto = !cuestionarioActivo.urlVideo || progC?.videoCompletado || localVideosVistos[cuestionarioActivo.id];
                                                const hasVideo = !!cuestionarioActivo.urlVideo;

                                                // DETERMINAR QUÉ MOSTRAR EN ESTA DIAPOSITIVA
                                                const esSlideVideo = hasVideo && preguntaIdx === 0;

                                                if (esSlideVideo) {
                                                    // RENDER SLIDE VIDEO
                                                    const ytId = extractYouTubeId(cuestionarioActivo.urlVideo!);
                                                    const handleVideoEnd = async () => {
                                                        if (videoVisto) return;
                                                        try {
                                                            await eventoPublicoService.marcarVideoVisto(
                                                                evento!.id,
                                                                cuestionarioActivo.id,
                                                                form.ci,
                                                                form.fechaNacimiento
                                                            );
                                                            const progUpdate = await eventoPublicoService.getProgreso(evento!.id, form.ci, form.fechaNacimiento);
                                                            setProgreso(progUpdate.progress);

                                                            if (!cuestionarioActivo.preguntas || cuestionarioActivo.preguntas.length === 0) {
                                                                await handleCompletarSinPreguntas(cuestionarioActivo);
                                                                setStep('info');
                                                            } else {
                                                                toast.success('¡Video completado! Ya puedes continuar a las preguntas.');
                                                            }
                                                        } catch (e) {
                                                            console.error('Error marcando video visto:', e);
                                                        }
                                                    };

                                                    return (
                                                        <div className={cn(
                                                            "bg-card border-2 rounded-3xl overflow-hidden shadow-xl transition-all duration-500",
                                                            videoVisto ? "border-emerald-500/20" : "border-primary/20"
                                                        )}>
                                                            <div className={cn(
                                                                "px-6 py-4 flex items-center justify-between gap-4 border-b border-border/40",
                                                                videoVisto ? "bg-emerald-500/5" : "bg-primary/5"
                                                            )}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                                                                        videoVisto ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500" : "bg-primary/10 border-primary/25 text-primary"
                                                                    )}>
                                                                        <Video className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Diapositiva 1 · Video Clase</span>
                                                                        <h4 className="text-xs font-black uppercase text-foreground leading-tight">
                                                                            {videoVisto ? '✓ Video Visto — Puedes avanzar' : 'Ve el video completo para continuar'}
                                                                        </h4>
                                                                    </div>
                                                                </div>
                                                                {videoVisto && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                                                            </div>

                                                            <div className="relative w-full aspect-video">
                                                                <YouTube
                                                                    videoId={ytId}
                                                                    className="absolute inset-0 w-full h-full"
                                                                    iframeClassName="w-full h-full"
                                                                    opts={{ height: '100%', width: '100%', playerVars: { rel: 0, modestbranding: 1 } }}
                                                                    onStateChange={(event) => {
                                                                        const timer = videoTimersRef.current[cuestionarioActivo.id] || { totalTime: 0, lastStart: null, lastRate: 1 };
                                                                        const currentRate = event.target.getPlaybackRate() || 1;
                                                                        if (event.data === 1) {
                                                                            timer.lastStart = Date.now();
                                                                            timer.lastRate = currentRate;

                                                                            if (videoPlaybackRef.current[cuestionarioActivo.id]?.intervalId) {
                                                                                clearInterval(videoPlaybackRef.current[cuestionarioActivo.id].intervalId);
                                                                            }

                                                                            const isAlreadyWatched = !!videoVisto;

                                                                            const intervalId = setInterval(() => {
                                                                                const player = event.target;
                                                                                const currentTime = player.getCurrentTime();
                                                                                const playbackRecord = videoPlaybackRef.current[cuestionarioActivo.id] || { maxTime: 0, intervalId: null };

                                                                                if (!isAlreadyWatched) {
                                                                                    if (currentTime > playbackRecord.maxTime + 3) {
                                                                                        player.seekTo(playbackRecord.maxTime, true);
                                                                                        toast.warning('No está permitido adelantar el video.');
                                                                                    } else {
                                                                                        playbackRecord.maxTime = Math.max(playbackRecord.maxTime, currentTime);
                                                                                    }
                                                                                } else {
                                                                                    playbackRecord.maxTime = Math.max(playbackRecord.maxTime, currentTime);
                                                                                }

                                                                                videoPlaybackRef.current[cuestionarioActivo.id] = {
                                                                                    ...playbackRecord,
                                                                                    intervalId
                                                                                };
                                                                            }, 500);

                                                                            videoPlaybackRef.current[cuestionarioActivo.id] = {
                                                                                maxTime: videoPlaybackRef.current[cuestionarioActivo.id]?.maxTime || 0,
                                                                                intervalId
                                                                            };
                                                                        } else {
                                                                            if (timer.lastStart) {
                                                                                timer.totalTime += ((Date.now() - timer.lastStart) / 1000) * (timer.lastRate || 1);
                                                                                timer.lastStart = null;
                                                                            }
                                                                            if (videoPlaybackRef.current[cuestionarioActivo.id]?.intervalId) {
                                                                                clearInterval(videoPlaybackRef.current[cuestionarioActivo.id].intervalId);
                                                                                videoPlaybackRef.current[cuestionarioActivo.id].intervalId = null;
                                                                            }
                                                                        }
                                                                        videoTimersRef.current[cuestionarioActivo.id] = timer;
                                                                    }}
                                                                    onPlaybackRateChange={(event) => {
                                                                        const timer = videoTimersRef.current[cuestionarioActivo.id] || { totalTime: 0, lastStart: null, lastRate: 1 };
                                                                        const newRate = event.data;
                                                                        if (timer.lastStart) {
                                                                            timer.totalTime += ((Date.now() - timer.lastStart) / 1000) * (timer.lastRate || 1);
                                                                            timer.lastStart = Date.now();
                                                                        }
                                                                        timer.lastRate = newRate;
                                                                        videoTimersRef.current[cuestionarioActivo.id] = timer;
                                                                    }}
                                                                    onEnd={async (event) => {
                                                                        if (videoPlaybackRef.current[cuestionarioActivo.id]?.intervalId) {
                                                                            clearInterval(videoPlaybackRef.current[cuestionarioActivo.id].intervalId);
                                                                            videoPlaybackRef.current[cuestionarioActivo.id].intervalId = null;
                                                                        }

                                                                        const timer = videoTimersRef.current[cuestionarioActivo.id] || { totalTime: 0, lastStart: null, lastRate: 1 };
                                                                        if (timer.lastStart) {
                                                                            timer.totalTime += ((Date.now() - timer.lastStart) / 1000) * (timer.lastRate || 1);
                                                                            timer.lastStart = null;
                                                                        }
                                                                        const duration = event.target.getDuration();
                                                                        if (timer.totalTime < duration * 0.9) {
                                                                            setVideoWarningModal(true);
                                                                            videoTimersRef.current[cuestionarioActivo.id] = { totalTime: 0, lastStart: null, lastRate: 1 };
                                                                            event.target.seekTo(0);
                                                                            return;
                                                                        }

                                                                        setLocalVideosVistos(prev => {
                                                                            const next = { ...prev, [cuestionarioActivo.id]: true };
                                                                            localStorage.setItem('local_videos_vistos', JSON.stringify(next));
                                                                            return next;
                                                                        });

                                                                        await handleVideoEnd();
                                                                    }}
                                                                />
                                                            </div>

                                                            {/* Footer del Video Slide */}
                                                            <div className="p-6 bg-muted/20 border-t border-border flex items-center justify-between gap-4">
                                                                <button
                                                                    onClick={() => setStep('info')}
                                                                    className="flex items-center gap-2 h-12 px-5 rounded-2xl bg-muted text-muted-foreground hover:text-foreground font-bold text-xs uppercase transition-all"
                                                                >
                                                                    <ChevronLeft className="w-4 h-4" /> Salir
                                                                </button>

                                                                {cuestionarioActivo.preguntas.length > 0 && (
                                                                    <button
                                                                        disabled={!videoVisto}
                                                                        onClick={() => {
                                                                            setSlideDirection('forward');
                                                                            setPreguntaIdx(1);
                                                                        }}
                                                                        className={cn(
                                                                            "flex items-center justify-center gap-2 h-12 px-6 rounded-2xl font-black text-xs uppercase transition-all shadow-lg",
                                                                            videoVisto
                                                                                ? "bg-primary text-white hover:opacity-90 shadow-primary/20 scale-102 animate-pulse"
                                                                                : "bg-muted text-muted-foreground border border-dashed border-border opacity-50 cursor-not-allowed shadow-none"
                                                                        )}
                                                                    >
                                                                        {videoVisto ? (
                                                                            <>
                                                                                Ir a Preguntas <ChevronRight className="w-4 h-4" />
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Lock className="w-3.5 h-3.5 mr-1" /> Ve el video completo
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // RENDER SLIDE PREGUNTA
                                                const pregRealIdx = hasVideo ? preguntaIdx - 1 : preguntaIdx;
                                                const preg = cuestionarioActivo.preguntas[pregRealIdx];
                                                if (!preg) return null; // Resguardo

                                                const totalRespondidas = cuestionarioActivo.preguntas.filter(p => {
                                                    const r = respuestas[p.id];
                                                    return r !== undefined && r !== '' && !(Array.isArray(r) && r.length === 0);
                                                }).length;

                                                const isLastQuestion = pregRealIdx === cuestionarioActivo.preguntas.length - 1;

                                                return (
                                                    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
                                                        {/* Header de pregunta */}
                                                        <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-border flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                                                    <span className="text-sm font-black text-primary">{pregRealIdx + 1}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Pregunta {pregRealIdx + 1} de {cuestionarioActivo.preguntas.length}</span>
                                                                    <p className="text-[10px] font-bold text-muted-foreground leading-none mt-1">
                                                                        {preg.tipo === 'SINGLE' ? 'Selección única' : preg.tipo === 'MULTIPLE' ? 'Selección múltiple' : preg.tipo === 'TRUE_FALSE' ? 'Verdadero / Falso' : 'Respuesta abierta'}
                                                                        {' • '}<span className="text-primary font-black">{preg.puntos} pt{preg.puntos !== 1 ? 's' : ''}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {respuestas[preg.id] !== undefined && respuestas[preg.id] !== '' && !(Array.isArray(respuestas[preg.id]) && respuestas[preg.id].length === 0) && (
                                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                                                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500">Respondida</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="p-6 md:p-8 space-y-6">
                                                            {/* Texto de la pregunta */}
                                                            <div className="text-base md:text-lg font-bold text-foreground leading-relaxed prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: preg.texto }} />

                                                            {/* Opciones según tipo */}
                                                            <div className="space-y-3">
                                                                {(preg.tipo === 'SINGLE' || preg.tipo === 'TRUE_FALSE') && preg.opciones.map((opt, oi) => (
                                                                    <button key={opt.id} onClick={() => setRespuestas(r => ({ ...r, [preg.id]: opt.id }))}
                                                                        className={`w-full flex items-center gap-4 px-5 h-14 rounded-2xl border-2 font-bold text-sm text-left transition-all group ${respuestas[preg.id] === opt.id
                                                                            ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/10'
                                                                            : 'border-border bg-muted/20 text-foreground hover:border-primary/40 hover:bg-primary/5'
                                                                            }`}>
                                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${respuestas[preg.id] === opt.id ? 'border-primary bg-primary' : 'border-muted-foreground group-hover:border-primary/60'
                                                                            }`}>
                                                                            {respuestas[preg.id] === opt.id
                                                                                ? <Check className="w-3.5 h-3.5 text-white" />
                                                                                : <span className="text-[9px] font-black text-muted-foreground">{String.fromCharCode(65 + oi)}</span>
                                                                            }
                                                                        </div>
                                                                        {opt.texto}
                                                                    </button>
                                                                ))}

                                                                {preg.tipo === 'MULTIPLE' && preg.opciones.map((opt, oi) => {
                                                                    const selected: string[] = respuestas[preg.id] || [];
                                                                    const isChecked = selected.includes(opt.id);
                                                                    return (
                                                                        <button key={opt.id} onClick={() => setRespuestas(r => ({ ...r, [preg.id]: isChecked ? selected.filter(x => x !== opt.id) : [...selected, opt.id] }))}
                                                                            className={`w-full flex items-center gap-4 px-5 h-14 rounded-2xl border-2 font-bold text-sm text-left transition-all group ${isChecked
                                                                                ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/10'
                                                                                : 'border-border bg-muted/20 text-foreground hover:border-primary/40 hover:bg-primary/5'
                                                                                }`}>
                                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'border-primary bg-primary' : 'border-muted-foreground group-hover:border-primary/60'
                                                                                }`}>
                                                                                {isChecked
                                                                                    ? <Check className="w-3.5 h-3.5 text-white" />
                                                                                    : <span className="text-[9px] font-black text-muted-foreground">{String.fromCharCode(65 + oi)}</span>
                                                                                }
                                                                            </div>
                                                                            {opt.texto}
                                                                        </button>
                                                                    );
                                                                })}

                                                                {preg.tipo === 'TEXTO' && (
                                                                    <textarea placeholder="Escribe tu respuesta aquí..."
                                                                        value={respuestas[preg.id] || ''}
                                                                        onChange={e => setRespuestas(r => ({ ...r, [preg.id]: e.target.value }))}
                                                                        className="w-full p-5 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none text-foreground font-medium resize-none h-36 transition-all"
                                                                    />
                                                                )}
                                                            </div>

                                                            {/* ── NAVEGACIÓN Y CONTROLES INFERIORES DE PREGUNTA ── */}
                                                            <div className="flex flex-col gap-4 pt-4 border-t border-border/80">
                                                                {/* Sync Status */}
                                                                <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-muted/30">
                                                                    <div className="flex items-center gap-2">
                                                                        {lastSavedStatus === 'saved' ? (
                                                                            <>
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Respuestas guardadas localmente</span>
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
                                                                    <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">Auto-guardado</span>
                                                                </div>

                                                                <div className="flex items-center justify-between gap-3">
                                                                    <button
                                                                        onClick={() => {
                                                                            setSlideDirection('backward');
                                                                            setPreguntaIdx(i => Math.max(0, i - 1));
                                                                        }}
                                                                        className="flex items-center gap-2 h-12 px-5 rounded-2xl bg-muted text-muted-foreground hover:text-foreground font-bold text-xs uppercase transition-all"
                                                                    >
                                                                        <ChevronLeft className="w-4 h-4" /> Anterior
                                                                    </button>

                                                                    {!isLastQuestion ? (
                                                                        <button
                                                                            onClick={() => {
                                                                                setSlideDirection('forward');
                                                                                setPreguntaIdx(i => i + 1);
                                                                            }}
                                                                            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                                                        >
                                                                            Siguiente <ChevronRight className="w-4 h-4" />
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleEnviarCuestionario()}
                                                                            disabled={submitting}
                                                                            className="flex-1 flex items-center justify-center gap-2 h-14 md:h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-black text-xs uppercase hover:opacity-90 disabled:opacity-40 transition-all shadow-xl shadow-emerald-600/25"
                                                                        >
                                                                            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                                            {totalRespondidas < cuestionarioActivo.preguntas.length
                                                                                ? `Enviar (${totalRespondidas}/${cuestionarioActivo.preguntas.length} respondidas)`
                                                                                : 'Enviar Cuestionario ✓'
                                                                            }
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
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
                                        {/* ── TARJETA PRINCIPAL DE RESULTADO ── */}
                                        <div className={cn(
                                            "relative overflow-hidden rounded-3xl border-2 transition-all duration-500",
                                            resultado.esEvaluativo === false
                                                ? "bg-primary/5 border-primary/20"
                                                : isAprobado
                                                    ? "bg-gradient-to-br from-primary/10 via-card to-card border-primary/30 shadow-2xl shadow-primary/10"
                                                    : "bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/20"
                                        )}>
                                            {/* Background glow */}
                                            {isAprobado && resultado.esEvaluativo !== false && (
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
                                            )}

                                            <div className="relative z-10 p-8 text-center space-y-5">
                                                {/* Icon */}
                                                <div className={cn(
                                                    "w-24 h-24 rounded-[2rem] mx-auto flex items-center justify-center border-2 transition-colors",
                                                    resultado.esEvaluativo === false
                                                        ? "bg-primary/10 border-primary/20"
                                                        : isAprobado ? "bg-primary/15 border-primary/30" : "bg-amber-500/10 border-amber-500/20"
                                                )}>
                                                    {resultado.esEvaluativo === false
                                                        ? <CheckCircle2 className="w-12 h-12 text-primary" />
                                                        : isAprobado
                                                            ? <Trophy className="w-12 h-12 text-primary" />
                                                            : <AlertTriangle className="w-12 h-12 text-amber-500" />
                                                    }
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Resultado · {cuestionarioActivo?.titulo}</p>
                                                    <h2 className="text-6xl font-black tracking-tighter text-foreground">
                                                        {resultado.esEvaluativo === false ? '¡LISTO!' : `${Math.min(resultado.nota ?? 0, 100)}`}
                                                        {resultado.esEvaluativo !== false && <span className="text-3xl opacity-20 ml-1">/100</span>}
                                                    </h2>
                                                    <p className={cn(
                                                        "text-sm font-black uppercase tracking-[0.3em]",
                                                        resultado.esEvaluativo === false
                                                            ? "text-primary"
                                                            : isAprobado ? "text-primary" : "text-amber-500"
                                                    )}>
                                                        {resultado.esEvaluativo === false
                                                            ? 'Formulario Enviado'
                                                            : isAprobado ? 'Aprobado con Éxito' : 'Evaluación Pendiente'}
                                                    </p>
                                                </div>

                                                {resultado.esEvaluativo !== false && (
                                                    <div className="space-y-3 pt-1">
                                                        {/* Barra de puntaje */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                                <span>0</span>
                                                                <span className={isAprobado ? 'text-primary' : 'text-amber-500'}>
                                                                    {resultado.puntaje} / {resultado.puntajeMaximo} pts
                                                                </span>
                                                                <span>100</span>
                                                            </div>
                                                            <div className="w-full h-4 bg-muted/50 rounded-full overflow-hidden border border-border shadow-inner relative">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${Math.min(resultado.nota ?? 0, 100)}%` }}
                                                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                                                    className={cn("h-full rounded-full", isAprobado ? "bg-gradient-to-r from-primary to-emerald-400" : "bg-gradient-to-r from-amber-500 to-orange-400")}
                                                                />
                                                                {/* Línea de puntaje mínimo */}
                                                                <div
                                                                    className="absolute top-0 h-full border-r-2 border-white/60 border-dashed"
                                                                    style={{ left: `${cuestionarioActivo?.puntajeMinimo || 75}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-[9px] text-muted-foreground font-bold text-center">
                                                                Mínimo para aprobar: {cuestionarioActivo?.puntajeMinimo || 75}/100
                                                            </p>
                                                        </div>

                                                        {!isAprobado && resultado.esEvaluativo !== false && (
                                                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/15">
                                                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                                <p className="text-[10px] text-amber-500/90 font-bold leading-relaxed text-left">
                                                                    Necesitas <strong>{cuestionarioActivo?.puntajeMinimo || 75}/100</strong> para aprobar y acceder al certificado. Puedes reintentar si aún tienes intentos disponibles.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ── TIMELINE DE MÓDULOS ── */}
                                        {(() => {
                                            const sortedCuesTimeline = [...(evento?.cuestionarios || [])]
                                                .filter(c => c.estado !== 'eliminado')
                                                .sort((a, b) => a.orden - b.orden);
                                            if (sortedCuesTimeline.length <= 1) return null;
                                            return (
                                                <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tu progreso en el curso</p>
                                                    <div className="space-y-2">
                                                        {sortedCuesTimeline.map((c, idx) => {
                                                            const cProg = progreso?.find((p: any) => p.id === c.id);
                                                            const cAprobado = !!cProg?.aprobado;
                                                            const cCompletado = !!cProg?.completado;
                                                            const esActual = c.id === cuestionarioActivo?.id;
                                                            return (
                                                                <div key={c.id} className={cn(
                                                                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                                                                    esActual ? 'border-primary/30 bg-primary/5' : cAprobado || cCompletado ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border/40 bg-muted/10 opacity-50'
                                                                )}>
                                                                    <div className={cn(
                                                                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black",
                                                                        esActual ? 'bg-primary/15 text-primary' : cAprobado || cCompletado ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground'
                                                                    )}>
                                                                        {cAprobado || cCompletado ? '✓' : idx + 1}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] font-black uppercase truncate text-foreground">{c.titulo}</p>
                                                                        <p className="text-[9px] text-muted-foreground font-bold">
                                                                            {esActual ? 'Módulo actual' : cAprobado ? 'Aprobado' : cCompletado ? 'Completado' : 'Pendiente'}
                                                                        </p>
                                                                    </div>
                                                                    {esActual && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="p-5 bg-card border border-border rounded-2xl space-y-2">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] border-b border-border pb-2">Sobre esta actividad</p>
                                            <div className="text-sm text-foreground leading-relaxed prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: cuestionarioActivo?.descripcion || '' }} />
                                        </div>

                                        {(() => {
                                            const progCues = progreso?.find((p: any) => p.id === cuestionarioActivo?.id);
                                            const isAprobado = !!resultado.aprobado || !!progCues?.aprobado || (resultado.nota !== null && resultado.nota !== undefined && resultado.nota >= (cuestionarioActivo?.puntajeMinimo || 75));

                                            const sortedCues = [...(evento?.cuestionarios || [])]
                                                .filter(c => c.estado !== 'eliminado')
                                                .sort((a, b) => a.orden - b.orden);
                                            const currentIndex = sortedCues.findIndex((c: any) => c.id === cuestionarioActivo?.id);
                                            const siguienteCues = currentIndex !== -1 && currentIndex < sortedCues.length - 1
                                                ? sortedCues[currentIndex + 1]
                                                : null;

                                            if (resultado.esEvaluativo !== false && isAprobado) {
                                                return (
                                                    <div className="flex flex-col gap-3">
                                                        {siguienteCues && (
                                                            <button
                                                                onClick={() => handleEmpezarCuestionario(siguienteCues)}
                                                                className="w-full h-16 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/30 animate-pulse"
                                                            >
                                                                {siguienteCues.urlVideo ? <Video className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                                                                {siguienteCues.urlVideo ? 'Ver Siguiente Video' : 'Ir al Siguiente Cuestionario'}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setStep('descargo')}
                                                            className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                                        >
                                                            <Download className="w-4 h-4" /> Descargar Resultado de Evaluación
                                                        </button>
                                                    </div>
                                                );
                                            } else if (resultado.esEvaluativo === false) {
                                                return (
                                                    <button
                                                        onClick={() => setStep('descargo')}
                                                        className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                                    >
                                                        <Download className="w-4 h-4" /> Descargar Comprobante de Formulario
                                                    </button>
                                                );
                                            } else {
                                                const limitValue = progCues?.limiteIntentos ?? cuestionarioActivo?.limiteIntentos;
                                                const hasReachedLimit = limitValue != null && (progCues?.numeroIntentos || 0) >= limitValue;

                                                if (hasReachedLimit) {
                                                    return (
                                                        <div className="flex flex-col items-center gap-3 p-6 bg-red-500/5 rounded-2xl border border-red-500/20 text-center">
                                                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                                                <Lock className="w-6 h-6" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em]">
                                                                Evaluación Reprobada · Intentos Agotados
                                                            </span>
                                                            <p className="text-[11px] text-muted-foreground font-bold leading-normal uppercase">
                                                                Has alcanzado el límite de {limitValue} {limitValue === 1 ? 'intento' : 'intentos'} sin alcanzar la nota mínima de {cuestionarioActivo?.puntajeMinimo || 75} puntos. Tu avance ha quedado bloqueado.
                                                            </p>
                                                            <p className="text-[9px] text-red-500/80 font-black uppercase tracking-widest leading-none mt-1">
                                                                Comunícate con el organizador para asistencia.
                                                            </p>
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
                                            };
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
                                    cuestionarioActivo={cuestionarioActivo}
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

                    {/* ── MODAL: Inscripción Cerrada ── */}
                    <AnimatePresence>
                        {inscripcionCerradaModal && (
                            <motion.div
                                key="inscripcion-cerrada"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
                                onClick={() => setInscripcionCerradaModal(false)}
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.85, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, y: 20 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                    className="bg-card border-2 border-red-500/30 rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl shadow-red-500/10 space-y-8 text-center"
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                    <div className="w-20 h-20 rounded-[1.8rem] bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mx-auto">
                                        <Lock className="w-10 h-10 text-red-500" />
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
                                            La inscripción está cerrada
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Lo sentimos, el período de inscripción para este evento ha finalizado. No es posible registrar nuevos participantes en este momento.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                setInscripcionCerradaModal(false);
                                                handleReset();
                                            }}
                                            className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                        >
                                            Entendido, Volver al Evento
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
