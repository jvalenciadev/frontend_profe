'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Clock, Users, CheckCircle2, AlertCircle,
    Download, Timer, Wifi, WifiOff, ChevronRight, ChevronLeft,
    Trophy, Star, FileText, RefreshCw, User, Hash
} from 'lucide-react';
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

// ─── DESCARGO COMPONENT ─────────────────────────────────────────────────────
function Descargo({ tipo, persona, evento, resultado, inscripcionId }: any) {
    const handlePrint = () => window.print();
    const fecha = new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });
    const hora = new Date().toLocaleTimeString('es-BO');

    return (
        <div className="space-y-6">
            <div id="descargo-print" className="bg-card border-2 border-primary/30 rounded-3xl p-8 space-y-6 print:border-black print:bg-white">
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-border pb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                            {tipo === 'inscripcion' ? 'Comprobante de Inscripción' : tipo === 'asistencia' ? 'Comprobante de Asistencia' : 'Certificado de Evaluación'}
                        </h2>
                        <p className="text-sm text-muted-foreground">PROFE — Sistema de Gestión Académica</p>
                    </div>
                </div>

                {/* Datos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Participante</span>
                        <p className="font-black text-foreground uppercase">{persona?.nombre1} {persona?.nombre2} {persona?.apellido1} {persona?.apellido2}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">C.I.</span>
                        <p className="font-black text-foreground">{persona?.ci}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Evento</span>
                        <p className="font-bold text-foreground">{evento?.nombre}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Fecha</span>
                        <p className="font-bold text-foreground">{new Date(evento?.fecha).toLocaleDateString('es-BO')}</p>
                    </div>
                    {tipo === 'cuestionario' && resultado && (
                        <>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Puntaje Obtenido</span>
                                <p className="font-black text-2xl text-primary">{resultado.puntaje} / {resultado.puntajeMaximo} pts</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Nota</span>
                                <p className={`font-black text-2xl ${resultado.aprobado ? 'text-green-500' : 'text-red-500'}`}>
                                    {resultado.nota}/100 — {resultado.aprobado ? 'APROBADO' : 'NO APROBADO'}
                                </p>
                            </div>
                        </>
                    )}
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Emitido</span>
                        <p className="font-bold text-foreground">{fecha} {hora}</p>
                    </div>
                    {inscripcionId && (
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-muted-foreground">Código de verificación</span>
                            <p className="font-black text-foreground font-mono text-xs">{inscripcionId}</p>
                        </div>
                    )}
                </div>

                <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
                    Este documento es un comprobante oficial generado automáticamente por el Sistema PROFE.
                </div>
            </div>

            <button
                onClick={handlePrint}
                className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 transition-all"
            >
                <Download className="w-4 h-4" />
                Descargar / Imprimir Comprobante
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

            // ─── REPERAR SESIÓN GUARDADA ───
            const saved = localStorage.getItem(`cuestionario_session_${evt.id}`);
            if (saved) {
                try {
                    const session = JSON.parse(saved);
                    // Solo recuperar si es el mismo usuario y el tiempo no ha expirado de forma masiva
                    setPersona(session.persona);
                    setForm(session.form);
                    setStep(session.step);
                    setCuestionarioActivo(session.cuestionarioActivo);
                    setRespuestas(session.respuestas);
                    setPreguntaIdx(session.preguntaIdx);
                    setStartTime(session.startTime);

                    // Si estaba en cuestionario, validar tiempo
                    if (session.step === 'cuestionario' && session.startTime && session.cuestionarioActivo.tiempoMaximo) {
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

        // Si el usuario escribió "1234567-1L" en el campo CI, lo separamos
        if (form.ci.includes('-')) {
            const [ci, comp] = form.ci.split('-');
            ciLimpio = ci;
            compLimpio = comp;
        }

        setSubmitting(true);
        try {
            const result = await eventoPublicoService.buscarPersona(ciLimpio, form.fechaNacimiento);
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
                // Si no se encuentra, actualizamos los campos limpiados por si acaso
                setForm(prev => ({ ...prev, ci: ciLimpio, complemento: compLimpio }));
            }
            setStep('inscripcion');
        } catch {
            setStep('inscripcion');
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

        const data = queuedData || {
            ci: form.ci,
            fechaNacimiento: form.fechaNacimiento,
            respuestas: Object.entries(respuestas).map(([preguntaId, val]) => {
                if (Array.isArray(val)) return { preguntaId, opciones: val };
                if (typeof val === 'string' && val.startsWith('{')) { try { return JSON.parse(val); } catch { } }
                return { preguntaId, opcionId: val, texto: val };
            }),
        };

        if (!online) {
            // Guardar en localStorage para reintento
            setOfflineQueue(data);
            localStorage.setItem('cuestionario_pendiente', JSON.stringify({ eventoId: evento.id, cuestionarioId: cuestionarioActivo.id, data }));
            alert('Sin conexión. Tus respuestas se guardarán y enviarán cuando tengas Internet.');
            setSubmitting(false);
            return;
        }

        try {
            const result = await eventoPublicoService.responderCuestionario(evento.id, cuestionarioActivo.id, data);
            setResultado(result);
            setStep('resultado');
            // Limpiar sesión al finalizar con éxito
            localStorage.removeItem(`cuestionario_session_${evento.id}`);
            localStorage.removeItem('cuestionario_pendiente');
        } catch (e: any) {
            console.error("Error enviando cuestionario:", e);
            if (e?.response?.status === 409) {
                // Ya lo respondió
                setStep('info');
                alert("Ya has respondido este cuestionario.");
                localStorage.removeItem(`cuestionario_session_${evento.id}`);
            } else {
                alert("Error al enviar el cuestionario. Por favor intenta de nuevo.");
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
            <div className="relative h-[25rem] md:h-[35rem] overflow-hidden bg-black">
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
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                {/* Back button */}
                <button onClick={() => router.back()} className="absolute top-6 left-6 z-20 w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/40 transition-all">
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                    <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                        {evento.tipo?.nombre || 'Evento'}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mt-4 uppercase leading-[0.9]">
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
                                <span className="font-bold">{evento.modalidadIds}</span>
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

                            {/* Opciones disponibles */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {evento.inscripcionAbierta && (
                                    <button onClick={() => setStep('identificacion')}
                                        className="group p-8 bg-primary text-white rounded-3xl font-black uppercase tracking-wide hover:opacity-90 active:scale-95 transition-all flex flex-col items-start gap-4">
                                        <Users className="w-8 h-8" />
                                        <div className="text-left">
                                            <div className="text-lg">Inscribirse</div>
                                            <div className="text-xs opacity-60 font-medium normal-case">Regístrate en este evento</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 self-end group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                                {evento.asistencia && (
                                    <button onClick={() => setStep('asistencia')}
                                        className="group p-8 bg-card border-2 border-primary text-primary rounded-3xl font-black uppercase tracking-wide hover:bg-primary/5 active:scale-95 transition-all flex flex-col items-start gap-4">
                                        <CheckCircle2 className="w-8 h-8" />
                                        <div className="text-left">
                                            <div className="text-lg">Registrar Asistencia</div>
                                            <div className="text-xs opacity-60 font-medium normal-case">Ingresa tu código de asistencia</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 self-end group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                                {cuestionarioVigente && (
                                    <button onClick={() => {
                                        setCuestionarioActivo(cuestionarioVigente);
                                        setStep('identificacion');
                                        setStartTime(Date.now()); // Iniciar el tiempo oficial
                                    }}
                                        className="group p-8 bg-card border-2 border-amber-500 text-amber-500 rounded-3xl font-black uppercase tracking-wide hover:bg-amber-500/5 active:scale-95 transition-all flex flex-col items-start gap-4 md:col-span-2">
                                        <FileText className="w-8 h-8" />
                                        <div className="text-left">
                                            <div className="text-lg">Realizar Cuestionario</div>
                                            <div className="text-xs opacity-60 font-medium normal-case">{cuestionarioVigente.titulo} — {cuestionarioVigente.tiempoMaximo ? `${cuestionarioVigente.tiempoMaximo} min` : 'Sin límite de tiempo'}</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 self-end group-hover:translate-x-1 transition-transform" />
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
                            <button onClick={() => setStep('descargo')} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" /> Descargar Comprobante
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
                            <button onClick={() => setStep('info')} className="w-full mt-4 h-12 rounded-2xl bg-muted text-muted-foreground font-black text-xs uppercase hover:text-foreground transition-all">
                                Volver al evento
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            <style jsx global>{`
                @media print {
                    body > *:not(#descargo-print) { display: none; }
                    #descargo-print { display: block !important; }
                }
            `}</style>
        </div>
    );
}
