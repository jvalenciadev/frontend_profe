'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Clock, Users, CheckCircle2, AlertCircle,
    Download, Timer, Wifi, WifiOff, ChevronRight, ChevronLeft,
    Trophy, Star, FileText, RefreshCw, User, Hash, ArrowRight,
    QrCode, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { eventoPublicoService } from '@/services/eventoPublicoService';
import publicService from '@/services/publicService';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';

// ─── TYPES ─────────────────────────────────────────────────────────────────
type TipoPreg = 'SINGLE' | 'MULTIPLE' | 'TRUE_FALSE' | 'TEXTO';

interface Opcion { id: string; texto: string; }
interface Pregunta { id: string; texto: string; tipo: TipoPreg; puntos: number; obligatorio: boolean; opciones: Opcion[]; }
interface Cuestionario { id: string; titulo: string; descripcion: string; fechaInicio: string; fechaFin: string; tiempoMaximo: number | null; puntosMaximos: number | null; estado: string; preguntas: Pregunta[]; }
interface Evento { id: string; nombre: string; codigo: string; descripcion: string; banner: string; afiche: string; fecha: string; lugar: string; inscripcionAbierta: boolean; asistencia: boolean | null; codigoAsistencia: string | null; tipo: any; cuestionarios: Cuestionario[]; modalidadIds: string; }

// Hook de online/offline
function useOnlineStatus() {
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
        ? `${window.location.origin}/eventos/${evento?.codigo || evento?.id}`
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

        win.document.write(`
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
    <div class="field"><div class="label">Fecha del evento</div><div class="value">${evento?.fecha ? new Date(evento.fecha).toLocaleDateString('es-BO') : ''}</div></div>
    ${resultado && !resultado.offline ? `
    <div class="field"><div class="label">Puntaje Obtenido</div><div class="value">${resultado.puntaje} / ${resultado.puntajeMaximo} pts</div></div>
    <div class="field"><div class="label">Calificación Final</div><div class="${resultado.aprobado ? 'aprobado' : 'reprobado'}">${resultado.nota}/100 — ${resultado.aprobado ? 'APROBADO ✓' : 'NO APROBADO'}</div></div>
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
</html>`);
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
                        <p className="font-bold text-foreground text-sm">{new Date(evento?.fecha).toLocaleDateString('es-BO')}</p>
                    </div>

                    {tipo === 'cuestionario' && resultado && (
                        <>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Puntaje</span>
                                <p className="font-black text-2xl text-primary">{resultado.puntaje} / {resultado.puntajeMaximo} pts</p>
                            </div>
                            <div className={`p-4 rounded-2xl border space-y-1 ${resultado.aprobado ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Calificación</span>
                                <p className={`font-black text-2xl ${resultado.aprobado ? 'text-green-500' : 'text-red-500'}`}>
                                    {resultado.nota}/100 — {resultado.aprobado ? 'APROBADO ✓' : 'NO APROBADO'}
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
    const router = useRouter();
    const online = useOnlineStatus();

    // States
    const [evento, setEvento] = useState<Evento | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'info' | 'identificacion' | 'inscripcion' | 'asistencia' | 'cuestionario' | 'resultado' | 'descargo'>('info');
    const [persona, setPersona] = useState<any>(null);
    const [inscripcion, setInscripcion] = useState<any>(null);
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
    const generos = [
        { id: '1', nombre: 'MASCULINO' },
        { id: '2', nombre: 'FEMENINO' },
        { id: '3', nombre: 'OTRO' }
    ];

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
        codigoAsistencia: ''
    });

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
            codigoAsistencia: ''
        });
        // Limpiar sesiones guardadas en localStorage
        const id = eventoId || evento?.id;
        if (id) {
            localStorage.removeItem(`cuestionario_session_${id}`);
        }
        localStorage.removeItem('cuestionario_pendiente');
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
                    setForm(session.form);
                    setStep(session.step);
                    setCuestionarioActivo(session.cuestionarioActivo);
                    setRespuestas(session.respuestas || {});
                    setPreguntaIdx(session.preguntaIdx || 0);
                    setStartTime(session.startTime);

                    // Si estaba en cuestionario, validar tiempo
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
        if (evento && step !== 'info' && step !== 'descargo' && step !== 'resultado') {
            const session = {
                persona, form, step, cuestionarioActivo, respuestas, preguntaIdx, startTime
            };
            localStorage.setItem(`cuestionario_session_${evento.id}`, JSON.stringify(session));
        }
    }, [evento, step, persona, form, cuestionarioActivo, respuestas, preguntaIdx, startTime]);

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

                // Si el usuario venía por un cuestionario, lo dejamos pasar
                if (cuestionarioActivo) {
                    setStep('cuestionario');
                    toast.success('Identidad verificada. Preparando cuestionario...');
                } else {
                    setStep('descargo');
                    toast.success('Ya te encuentras registrado. Aquí tienes tu comprobante.');
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
                setForm(prev => ({
                    ...prev,
                    ci: ciLimpio,
                    complemento: compLimpio || result.persona.complemento || '',
                    nombre1: result.persona.nombre1,
                    nombre2: result.persona.nombre2,
                    apellido1: result.persona.apellido1,
                    apellido2: result.persona.apellido2,
                    correo: result.persona.correo,
                    celular: result.persona.celular,
                    generoId: result.persona.generoId?.toString() || '1',
                }));
            } else {
                setForm(prev => ({ ...prev, ci: ciLimpio, complemento: compLimpio }));
            }
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
        setSubmitting(true);
        try {
            // Limpieza de CI por si acaso quedó con guión
            const ciLimpio = form.ci.includes('-') ? form.ci.split('-')[0] : form.ci;

            const result = await eventoPublicoService.inscribirse(evento.id, {
                ...form,
                ci: ciLimpio,
                departamentoId: form.departamentoId,
                modalidadId: form.modalidadId,
            });
            setPersona(result.persona);
            setInscripcion(result.inscripcion);
            setStep('descargo');
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
        setSubmitting(true);
        try {
            const result = await eventoPublicoService.registrarAsistencia(evento.id, form.ci, form.fechaNacimiento, form.codigoAsistencia);
            setPersona(result.persona);
            setInscripcion({ id: result.inscripcion });
            setStep('descargo');
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Error al registrar asistencia');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEnviarCuestionario = useCallback(async (queuedData?: any) => {
        if (!evento || !cuestionarioActivo || !persona) return;
        setSubmitting(true);

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
                eventoId: evento.id,
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
            return;
        }

        try {
            const result = await eventoPublicoService.responderCuestionario(evento.id, cuestionarioActivo.id, payload);
            setResultado(result);
            setStep('resultado');
            // Limpiar sesión al finalizar con éxito
            localStorage.removeItem(`cuestionario_session_${evento.id}`);
            localStorage.removeItem('cuestionario_pendiente');
            setOfflineQueue(null);
        } catch (e: any) {
            console.error("Error enviando cuestionario:", e);
            if (e?.response?.status === 409) {
                // Ya lo respondió anteriormente — reset para nueva persona
                handleReset();
                toast.error('Ya has respondido este cuestionario con esta persona.');
            } else {
                // Si falla por otra cosa y estamos online, lo guardamos para reintentar luego
                localStorage.setItem('cuestionario_pendiente', JSON.stringify({
                    eventoId: evento.id,
                    cuestionarioId: cuestionarioActivo.id,
                    data: payload
                }));
                setOfflineQueue(payload);
                alert("Hubo un problema al conectar con el servidor. Tus respuestas se han guardado localmente e intentaremos enviarlas de nuevo en un momento.");
            }
        } finally {
            setSubmitting(false);
        }
    }, [evento, cuestionarioActivo, persona, respuestas, form, online]);

    const cuestionarioVigente = evento?.cuestionarios?.find(c => {
        const now = new Date();
        return c.estado === 'activo' && new Date(c.fechaInicio) <= now && new Date(c.fechaFin) >= now;
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
            <button onClick={() => window.location.href = '/eventos'}
                className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all">
                Ver todos los eventos
            </button>
        </div>
    );

    if (!evento) return null;

    const fechaEvento = new Date(evento.fecha).toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
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

            {/* Banner header */}
            <div className="relative h-[25rem] md:h-[35rem] overflow-hidden bg-slate-950 mt-24 md:mt-32 rounded-3xl mx-4 md:mx-8 mb-8 shadow-2xl">
                {evento.banner ? (
                    <>
                        {/* Background blurry layer for filling space */}
                        <div className="absolute inset-0 scale-110 blur-3xl opacity-40">
                            <img src={getImageUrl(evento.banner)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <img src={getImageUrl(evento.banner)} alt={evento.nombre} className="relative w-full h-full object-contain" />
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-indigo-600" />
                )}
                {/* Overlay oscuro GARANTIZADO en la parte inferior para leer letras blancas */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                {/* Back button - Adjusted to not overlap with main navbar */}
                <button onClick={() => router.back()} className="absolute top-6 left-6 md:top-8 md:left-8 z-30 w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/80 hover:scale-105 transition-all shadow-2xl">
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20">
                    <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {evento.tipo?.nombre || 'Evento'}
                    </span>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white mt-4 uppercase leading-[0.9] drop-shadow-2xl">
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
                                <p className="text-muted-foreground leading-relaxed italic">{evento.descripcion}</p>
                            </div>

                            {/* Questionnaires Section */}
                            {(evento.cuestionarios?.length || 0) > 0 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-black uppercase text-foreground flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-primary" />
                                        </div>
                                        Evaluaciones y Cuestionarios
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {evento.cuestionarios.map((c: any) => {
                                            const now = new Date();
                                            const start = new Date(c.fechaInicio);
                                            const end = new Date(c.fechaFin);
                                            const isActive = c.estado === 'activo' && start <= now && end >= now;
                                            const isUpcoming = start > now;

                                            return (
                                                <div key={c.id} className={`p-6 rounded-[2rem] border transition-all ${isActive ? 'bg-card border-primary/30 shadow-xl shadow-primary/5 hover:border-primary/50' : 'bg-muted/10 border-border opacity-70'}`}>
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="font-black uppercase text-foreground tracking-tight text-lg">{c.titulo}</h3>
                                                                {isActive && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">Vigente</span>}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground leading-relaxed">{c.descripcion}</p>
                                                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Calendar className="w-3.5 h-3.5 text-primary/60" />
                                                                    {start.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <span className="text-border">|</span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock className="w-3.5 h-3.5 text-primary/60" />
                                                                    Cierre: {end.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isActive ? (
                                                            <button
                                                                onClick={() => {
                                                                    setCuestionarioActivo(c);
                                                                    setStep('identificacion');
                                                                    if (!startTime) setStartTime(Date.now());
                                                                }}
                                                                className="shrink-0 h-12 px-8 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary-600 transition-all flex items-center justify-center gap-3"
                                                            >
                                                                Participar
                                                                <ArrowRight className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <div className="shrink-0 h-12 px-8 rounded-2xl bg-muted border border-border text-muted-foreground font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2">
                                                                {isUpcoming ? 'Próximamente' : 'Finalizado'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Afiche Principal */}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {evento.inscripcionAbierta && (
                                    <button onClick={() => setStep('identificacion')}
                                        className="group p-8 bg-card border border-border rounded-3xl font-black uppercase tracking-wide hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-start gap-5 shadow-sm hover:shadow-lg">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div className="text-left text-foreground">
                                            <div className="text-xl group-hover:text-primary transition-colors tracking-tight">Inscripción Oficial</div>
                                            <div className="text-xs text-muted-foreground font-medium normal-case mt-1 max-w-[90%] tracking-normal">Garantiza tu participación en esta actividad académica.</div>
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
                                {cuestionarioVigente && (
                                    <button onClick={() => {
                                        setCuestionarioActivo(cuestionarioVigente);
                                        setStep('identificacion');
                                        if (!startTime) setStartTime(Date.now()); // Solo iniciar si no hay uno previo
                                    }}
                                        className="group p-8 bg-primary rounded-3xl border border-primary/50 text-white font-black uppercase tracking-wide hover:bg-primary-600 transition-all flex flex-col items-start gap-5 shadow-xl shadow-primary/20 md:col-span-2">
                                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-2xl tracking-tight">Realizar Evaluación</div>
                                            <div className="text-xs font-semibold normal-case mt-1 opacity-90 tracking-normal text-white/90">
                                                {cuestionarioVigente.titulo} • {cuestionarioVigente.tiempoMaximo ? `${cuestionarioVigente.tiempoMaximo} MINUTOS` : 'SIN LÍMITE DE TIEMPO'}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 self-end opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP IDENTIFICACION ── */}
                    {step === 'identificacion' && (
                        <motion.div key="id" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-card border border-border rounded-3xl p-8 space-y-6">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Identificación</h2>
                                <p className="text-sm text-muted-foreground mt-1">Ingresa tu CI y fecha de nacimiento. <br /> <span className="text-[10px] opacity-70">Ejemplo: 1412240 o 1412240-1L</span></p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Carnet de Identidad</label>
                                    <input type="text" placeholder="Ej. 12345678" value={form.ci}
                                        onChange={e => setForm(p => ({ ...p, ci: e.target.value }))}
                                        className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-black text-foreground transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Fecha de Nacimiento</label>
                                    <input type="date" value={form.fechaNacimiento}
                                        onChange={e => setForm(p => ({ ...p, fechaNacimiento: e.target.value }))}
                                        className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-black text-foreground transition-all" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setStep('info')} className="h-14 px-6 rounded-2xl text-xs font-black uppercase text-muted-foreground hover:text-foreground transition-all">
                                    Volver
                                </button>
                                <button onClick={handleBuscarPersona} disabled={!form.ci || !form.fechaNacimiento || submitting}
                                    className="flex-1 h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                    Continuar
                                </button>
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
                                {(['nombre1', 'nombre2', 'apellido1', 'apellido2'] as const).map((field) => (
                                    <div key={field} className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{field.replace(/\d/, ' $&')}</label>
                                        <input type="text" placeholder={field} value={(form as any)[field]}
                                            onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                                            className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-bold text-foreground uppercase transition-all" />
                                    </div>
                                ))}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Género</label>
                                    <select value={form.generoId} onChange={e => setForm(p => ({ ...p, generoId: e.target.value }))}
                                        className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all">
                                        {generos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Modalidad de Participación</label>
                                    <select value={form.modalidadId} onChange={e => setForm(p => ({ ...p, modalidadId: e.target.value }))}
                                        className="w-full h-14 px-6 rounded-2xl bg-primary/5 border-2 border-primary/20 focus:border-primary outline-none font-bold text-primary transition-all">
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
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Departamento origen (Inscripción)</label>
                                    <select value={form.departamentoId} onChange={e => setForm(p => ({ ...p, departamentoId: e.target.value }))}
                                        className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all">
                                        <option value="">Seleccionar departamento...</option>
                                        {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setStep('identificacion')} className="h-14 px-6 rounded-2xl text-xs font-black uppercase text-muted-foreground hover:text-foreground transition-all">
                                    Volver
                                </button>
                                <button onClick={handleInscribirse} disabled={!form.nombre1 || !form.apellido1 || !form.modalidadId || !form.departamentoId || submitting}
                                    className="flex-1 h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Confirmar Inscripción
                                </button>
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
                                    <p className="text-sm text-muted-foreground">{cuestionarioActivo.preguntas.length} preguntas</p>
                                </div>
                                {cuestionarioActivo.tiempoMaximo && (
                                    <Timer_Cuestionario
                                        segundos={cuestionarioActivo.tiempoMaximo * 60}
                                        startTime={startTime || Date.now()}
                                        onExpire={() => setTimerExpired(true)}
                                    />
                                )}
                            </div>

                            {/* Pregunta actual */}
                            {cuestionarioActivo.preguntas.length > 0 && (() => {
                                const preg = cuestionarioActivo.preguntas[preguntaIdx];
                                return (
                                    <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Pregunta {preguntaIdx + 1} de {cuestionarioActivo.preguntas.length} • {preg.puntos} pt{preg.puntos !== 1 ? 's' : ''}</span>
                                                <h3 className="text-xl font-bold text-foreground mt-2">{preg.texto}</h3>
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
                                        <div className="flex items-center justify-between pt-4 border-t border-border">
                                            <button onClick={() => setPreguntaIdx(i => Math.max(0, i - 1))} disabled={preguntaIdx === 0}
                                                className="flex items-center gap-2 h-12 px-6 rounded-2xl bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 font-bold text-xs uppercase transition-all">
                                                <ChevronLeft className="w-4 h-4" /> Anterior
                                            </button>

                                            {/* Progress dots */}
                                            <div className="flex gap-1.5">
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
                                                    className="flex items-center gap-2 h-12 px-6 rounded-2xl bg-green-600 text-white font-black text-xs uppercase hover:opacity-90 disabled:opacity-40 transition-all">
                                                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                    Enviar Respuestas
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
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
                                <div className={`p-8 rounded-3xl text-center space-y-4 ${resultado.aprobado ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-red-500/10 border-2 border-red-500/30'}`}>
                                    <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: resultado.aprobado ? '#22c55e22' : '#ef444422' }}>
                                        {resultado.aprobado ? <Trophy className="w-10 h-10 text-green-500" /> : <AlertCircle className="w-10 h-10 text-red-500" />}
                                    </div>
                                    <h2 className="text-4xl font-black text-foreground">{resultado.nota}/100</h2>
                                    <p className={`text-xl font-black uppercase tracking-widest ${resultado.aprobado ? 'text-green-500' : 'text-red-500'}`}>
                                        {resultado.aprobado ? '¡Aprobado!' : 'No aprobado'}
                                    </p>
                                    <p className="text-muted-foreground">{resultado.puntaje} de {resultado.puntajeMaximo} puntos</p>
                                </div>
                            )}

                            {!resultado.offline && (
                                <button onClick={() => setStep('descargo')} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" /> Descargar Comprobante
                                </button>
                            )}

                            <button onClick={() => handleReset()} className="w-full h-14 rounded-2xl bg-muted text-muted-foreground font-black text-xs uppercase hover:text-foreground transition-all">
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
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => handleReset()}
                                    className="flex-1 h-12 rounded-2xl bg-muted text-muted-foreground font-black text-xs uppercase hover:text-foreground transition-all"
                                >
                                    Registrar otra persona
                                </button>
                                <button
                                    onClick={() => router.back()}
                                    className="h-12 px-6 rounded-2xl bg-primary/10 text-primary font-black text-xs uppercase hover:bg-primary/20 transition-all"
                                >
                                    Salir
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>


        </div >
    );
}
