'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    X,
    Clock,
    Trophy,
    ChevronLeft,
    ChevronRight,
    Send,
    HelpCircle,
    CheckCircle2,
    Circle,
    AlertTriangle,
    Play,
    Timer,
    History,
    FileText,
    ArrowRight,
    Rocket,
    Brain,
    Shield,
    Users,
    Trash2,
    ChevronUp,
    ChevronDown,
    ArrowUpDown,
    CheckSquare,
    Calendar,
    Lock,
    List,
    RefreshCw
} from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import MathRenderer from './MathRenderer';
import MathEditor from './MathEditor';

interface QuizPlayerProps {
    actividadId: string;
    theme: 'light' | 'dark';
    onClose: () => void;
}

export default function QuizPlayer({ actividadId, theme, onClose }: QuizPlayerProps) {
    const [lobbyData, setLobbyData] = useState<any>(null);
    const [cuestionario, setCuestionario] = useState<any>(null);
    const [intento, setIntento] = useState<any>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [view, setView] = useState<'lobby' | 'playing' | 'result'>('lobby');
    const [respuestas, setRespuestas] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [saving, setSaving] = useState(false);
    const [starting, setStarting] = useState(false);
    const [showConfirmFinish, setShowConfirmFinish] = useState(false);
    const [showQuestionGrid, setShowQuestionGrid] = useState(false);
    const [discapacidad, setDiscapacidad] = useState(false);
    const [facilitadorPass, setFacilitadorPass] = useState('');
    const [showPassPrompt, setShowPassPrompt] = useState(false);
    const [verifyingPass, setVerifyingPass] = useState(false);
    const [loading, setLoading] = useState(true);

    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => {
            const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
            setIsMobile(mobile);
        };
        checkMobile();
    }, []);

    const loadLobby = async () => {
        try {
            setLoading(true);
            const cueBasic = await aulaService.getCuestionarioByActividad(actividadId);
            const data = await aulaService.getQuizLobby(cueBasic.id);
            setLobbyData(data);
            setCuestionario(data.cuestionario);
        } catch (err: any) {
            toast.error('Error al cargar información del cuestionario');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLobby(); }, [actividadId]);

    // Lógica Anti-Copia
    useEffect(() => {
        const shouldBlock = cuestionario?.bloquearCopia || cuestionario?.mod_cue_bloquear_copia;
        if ((view === 'playing' || view === 'result') && shouldBlock) {
            const handleCopy = (e: ClipboardEvent) => {
                e.preventDefault();
                toast.error('La copia de contenido está desactivada por seguridad del cuestionario.', { duration: 1500 });
            };
            const handleContextMenu = (e: MouseEvent) => {
                e.preventDefault();
            };
            const handleKeyDown = (e: KeyboardEvent) => {
                // Bloquear Ctrl+C, Ctrl+V, Ctrl+U (ver código), F12 (DevTools)
                if (
                    (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 's')) ||
                    e.key === 'F12'
                ) {
                    e.preventDefault();
                    toast.error('Comando bloqueado por seguridad.', { duration: 1000 });
                }
            };

            document.addEventListener('copy', handleCopy);
            document.addEventListener('contextmenu', handleContextMenu);
            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('copy', handleCopy);
                document.removeEventListener('contextmenu', handleContextMenu);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [view, cuestionario]);

    const startQuiz = async () => {
        const isMobileOnly = cuestionario?.soloMobile || cuestionario?.mod_cue_solo_mobile;
        if (isMobileOnly && !isMobile) {
            return toast.error('Este cuestionario es de alta seguridad y solo puede realizarse desde la aplicación móvil o un navegador de celular.', {
                duration: 5000,
                icon: <AlertTriangle className="text-amber-500" />
            });
        }
        try {
            setStarting(true);
            const int = await aulaService.iniciarIntento(cuestionario.id, { 
                discapacidad, 
                password: facilitadorPass 
            });
            setIntento(int);

            // Fetch full questions for this attempt
            const fullCue = await aulaService.getCuestionarioByActividad(actividadId);

            if (int.respuestas && int.respuestas.length > 0) {
                const pregsIds = int.respuestas.map((r: any) => r.preguntaId);
                const filteredPreguntas = pregsIds
                    .map((id: string) => fullCue.preguntas.find((p: any) => p.id === id))
                    .filter(Boolean)
                    // Ordenar por el campo `orden` para respetar el orden configurado por el docente
                    .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0));
                fullCue.preguntas = filteredPreguntas;
            }
            setCuestionario(fullCue);

            /**
             * ESTRATEGIA DE RECONEXIÓN Y PERSISTENCIA:
             * Si ya existe un intento en curso (por pérdida de internet o cierre accidental),
             * el servidor devuelve las respuestas previamente guardadas en 'int.respuestas'.
             * Aquí las restauramos en el estado local 'respuestas' para que el participante
             * continúe exactamente donde lo dejó.
             */
            const rMap: any = {};
            int.respuestas?.forEach((r: any) => {
                if (r.opcionId || r.textoLibre) rMap[r.preguntaId] = r;
            });
            setRespuestas(rMap);

            if (fullCue.duracion > 0) {
                /**
                 * SEGURIDAD DE TIEMPO:
                 * Usamos `tiempoRestanteSegundos` calculado en el SERVIDOR para evitar
                 * que un estudiante con el reloj del sistema desconfigurado (adelantado o atrasado)
                 * pueda alterar el tiempo disponible del cuestionario.
                 * 
                 * Si el servidor retorna 0 (tiempo expirado), se finaliza automáticamente.
                 */
                const remaining = typeof int.tiempoRestanteSegundos === 'number'
                    ? int.tiempoRestanteSegundos
                    : Math.max(0, fullCue.duracion * 60 - Math.floor((Date.now() - new Date(int.iniciadoEn).getTime()) / 1000));

                if (remaining <= 0) {
                    await finalizeDirectly(int.id);
                    return;
                }
                setTimeLeft(remaining);
            }

            setView('playing');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'No se pudo iniciar el intento');
        } finally {
            setStarting(false);
        }
    };

    const finalizeDirectly = async (intentoId: string) => {
        setSaving(true);
        try {
            const res = await aulaService.finalizarIntento(intentoId);
            setIntento(res);
            setView('result');
            toast.info('El tiempo de este cuestionario ha expirado. Se ha enviado automáticamente con tu progreso guardado.');
        } catch (e) {
            toast.error('Error al finalizar el intento expirado');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (view !== 'playing' || timeLeft <= 0 || cuestionario?.duracion === 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [view, timeLeft, cuestionario]);

    const handleAnswer = async (preguntaId: string, opcionId?: string, textoLibre?: string) => {
        try {
            /**
             * AUTOSAVE EN TIEMPO REAL:
             * Cada vez que el participante marca una opción o escribe, se envía inmediatamente
             * al servidor (aulaService.responderPregunta). Esto garantiza que si el participante
             * pierde la conexión a internet o se le apaga el dispositivo, el progreso está a salvo.
             */
            const data = { preguntaId, opcionId, textoLibre };
            const res = await aulaService.responderPregunta(intento.id, data);
            setRespuestas({ ...respuestas, [preguntaId]: res });
        } catch (err) {
            // Si falla el guardado (problemas de red), notificamos al usuario
            toast.error('Error al guardar respuesta. Verifique su conexión.');
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        setShowConfirmFinish(false);
        try {
            const res = await aulaService.finalizarIntento(intento.id);
            setIntento(res);
            setView('result');
            toast.success('Cuestionario enviado con éxito');
        } catch (err) {
            toast.error('Error al finalizar cuestionario');
        } finally {
            setSaving(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (view === 'playing') {
            const el = document.getElementById(`nav-dot-${currentIdx}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [currentIdx, view]);

    if (loading) return (
        <div className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center text-white">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mb-8" />
            <p className="font-black uppercase tracking-[0.3em] text-[10px] animate-pulse text-primary">Sincronizando con el servidor...</p>
        </div>
    );

    if (view === 'lobby') {
        const hasActiveIntento = lobbyData?.intentoEnProgreso;
        return (
            <div className={cn(
                "fixed inset-0 z-[2000] overflow-y-auto no-scrollbar scroll-smooth transition-colors duration-500",
                theme === 'dark'
                    ? "bg-slate-950 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1)_0%,transparent_50%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.1)_0%,transparent_50%)]"
                    : "bg-slate-50 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05)_0%,transparent_50%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.05)_0%,transparent_50%)]"
            )}>
                <div className="min-h-full w-full flex flex-col items-center justify-center py-10 px-6">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">

                        <div className={cn(
                            "md:col-span-3 space-y-6 md:space-y-8 backdrop-blur-xl border p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden transition-all",
                            theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
                        )}>
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <Rocket size={200} className={theme === 'dark' ? "text-white" : "text-primary"} />
                            </div>

                            <header className="space-y-4 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <FileText size={32} />
                                </div>
                                <div>
                                    <h1 className={cn("text-2xl md:text-4xl font-black leading-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                        {cuestionario?.actividad?.titulo}
                                    </h1>
                                    <p className="text-slate-400 font-bold mt-2 text-xs md:text-sm leading-relaxed">{cuestionario?.actividad?.instrucciones}</p>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 relative z-10">
                                {[
                                    { label: 'Duración', value: cuestionario.duracion === 0 ? 'Sin límite' : `${cuestionario.duracion + (discapacidad ? 30 : 0)} min`, icon: Timer, color: 'text-primary' },
                                    { label: 'Intentos', value: `${lobbyData.intentosConsumidos} / ${cuestionario.maxIntentos}`, icon: History, color: 'text-amber-500' },
                                    { label: 'Preguntas', value: cuestionario.aleatorizar && cuestionario.randomCount ? cuestionario.randomCount : (cuestionario.preguntas?.length || 0), icon: Brain, color: 'text-emerald-500' }
                                ].map((item, i) => (
                                    <div key={i} className={cn("p-4 md:p-5 rounded-2xl md:rounded-3xl border transition-all", theme === 'dark' ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-50 border-slate-100")}>
                                        <div className={cn("flex items-center gap-2 mb-2", item.color)}>
                                            <item.icon size={16} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                        </div>
                                        <p className={cn("text-lg md:text-xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                                {[
                                    { label: 'Apertura', value: mounted && cuestionario.actividad?.fechaInicio ? new Date(cuestionario.actividad.fechaInicio).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '...', icon: Calendar, color: 'text-indigo-500' },
                                    { label: 'Cierre', value: mounted && cuestionario.actividad?.fechaFin ? new Date(cuestionario.actividad.fechaFin).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '...', icon: Lock, color: 'text-rose-500' },
                                ].map((item, i) => (
                                    <div key={i} className={cn("p-4 rounded-2xl border transition-all flex items-center gap-4", theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0", theme === 'dark' ? "bg-slate-950 border-slate-800" : "bg-white border-white")}>
                                            <item.icon size={20} className={item.color} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                            <p className={cn("text-xs font-bold truncate", theme === 'dark' ? "text-white" : "text-slate-900")}>{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 relative z-10">
                                {(cuestionario?.soloMobile || cuestionario?.mod_cue_solo_mobile) && !isMobile ? (
                                    <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-4">
                                        <AlertTriangle size={36} className="text-amber-500 mx-auto" />
                                        <div>
                                            <p className="text-amber-600 font-black text-[11px] uppercase tracking-widest leading-none mb-2">Cuestionario de Alta Seguridad</p>
                                            <p className={cn("text-sm font-medium", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>Este cuestionario solo puede realizarse desde un dispositivo móvil (celular o tablet). Descarga la aplicación o ingresa desde tu móvil para realizarlo.</p>
                                        </div>
                                    </div>
                                ) : lobbyData.intentosRestantes > 0 || hasActiveIntento ? (
                                    <div className="space-y-4">
                                        {!hasActiveIntento && (
                                            <div className={cn("p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4", discapacidad ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/10" : "bg-slate-50 border-slate-100 dark:bg-slate-800/20 dark:border-slate-800")}>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", discapacidad ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400")}>
                                                        <CheckCircle2 size={20} />
                                                    </div>
                                                    <div>
                                                        <p className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-900")}>Modo Accesibilidad</p>
                                                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">Persona con discapacidad (+30 min extra)</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => {
                                                    if (!discapacidad) {
                                                        setShowPassPrompt(true);
                                                    } else {
                                                        setDiscapacidad(false);
                                                        setFacilitadorPass('');
                                                    }
                                                }}
                                                    className={cn("w-12 h-6 rounded-full transition-all relative shrink-0", discapacidad ? "bg-primary" : "bg-slate-300 dark:bg-slate-700")}>
                                                    <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all", discapacidad ? "left-[26px]" : "left-0.5")} />
                                                </button>
                                            </div>
                                        )}

                                        {showPassPrompt && !discapacidad && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-5 rounded-2xl bg-primary/5 border-2 border-primary/20 space-y-3">
                                                <div className="flex items-center gap-2 text-primary">
                                                    <Lock size={14} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Autorización del Facilitador</p>
                                                </div>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase leading-tight">El facilitador a cargo debe ingresar su contraseña para autorizar el tiempo extra.</p>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="password"
                                                        value={facilitadorPass}
                                                        onChange={(e) => setFacilitadorPass(e.target.value)}
                                                        placeholder="Contraseña del docente..."
                                                        className="flex-1 h-10 px-4 rounded-xl border-2 border-primary/20 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:border-primary transition-all"
                                                    />
                                                    <button 
                                                        disabled={verifyingPass}
                                                        onClick={async () => {
                                                            if (!facilitadorPass.trim()) return;
                                                            try {
                                                                setVerifyingPass(true);
                                                                const res = await aulaService.verificarFacilitador(cuestionario.id, facilitadorPass);
                                                                if (res.isAuthorized) {
                                                                    setDiscapacidad(true);
                                                                    setShowPassPrompt(false);
                                                                    toast.success('Autorización concedida');
                                                                } else {
                                                                    toast.error('Contraseña incorrecta o no autorizado');
                                                                }
                                                            } catch {
                                                                toast.error('Error al validar facilitador');
                                                            } finally {
                                                                setVerifyingPass(false);
                                                            }
                                                        }}
                                                        className="px-4 h-10 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                                    >
                                                        {verifyingPass ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Validar'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {discapacidad && !hasActiveIntento && (
                                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                                                <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                                                <p className="text-[9px] font-black uppercase text-rose-600 leading-tight">
                                                    ADVERTENCIA: Si declara ser persona con discapacidad sin serlo, su evaluación será ANULADA automáticamente. Esta acción queda registrada.
                                                </p>
                                            </div>
                                        )}
                                        <button
                                            onClick={startQuiz}
                                            disabled={starting}
                                            className={cn(
                                                "w-full h-20 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl",
                                                hasActiveIntento
                                                    ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
                                                    : "bg-primary text-white hover:scale-[1.02] shadow-primary/20"
                                            )}
                                        >
                                            {starting ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : hasActiveIntento ? <Rocket size={20} /> : <Play size={20} />}
                                            {hasActiveIntento ? 'Continuar Intento en curso' : 'Iniciar Nueva Evaluación'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-center font-black text-xs uppercase tracking-widest">
                                        Has agotado todos tus intentos
                                    </div>
                                )}
                                <button onClick={onClose} className="w-full mt-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors">Volver al aula</button>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-4 md:space-y-6">
                            <div className={cn(
                                "p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border flex flex-col justify-between h-full transition-all",
                                theme === 'dark' ? "bg-slate-900/30 border-slate-800/50" : "bg-white border-slate-200 shadow-xl"
                            )}>
                                <div>
                                    <h3 className={cn("font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-3", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                        <Trophy size={18} className="text-amber-500" /> Rendimiento
                                    </h3>
                                    <div className="space-y-4">
                                        <div className={cn("p-4 md:p-5 rounded-2xl border transition-all", theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                            <p className="text-slate-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1">Mejor Calificación</p>
                                            <p className="text-2xl md:text-3xl font-black text-emerald-500">{lobbyData.mejorPuntaje || 0} <span className="text-xs text-slate-400">pts</span></p>
                                        </div>
                                        <div className={cn("p-5 rounded-2xl border transition-all", theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Resultado de Sincronización</p>
                                            <p className={cn("text-xs font-bold", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>Todas tus respuestas se guardan encriptadas y en tiempo real.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 md:mt-10 p-5 md:p-6 rounded-2xl md:rounded-3xl bg-primary/5 border border-primary/10">
                                    <HelpCircle size={28} className="text-primary/40 mb-2 md:mb-3" />
                                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                                        Si pierdes la conexión, tu progreso se guardará automáticamente y podrás continuar desde el mismo punto.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (view === 'playing') {
        const currentP = cuestionario?.preguntas?.[currentIdx];
        if (!currentP) return (
            <div className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center text-white">
                <p className="font-black uppercase tracking-[0.3em] text-[10px] animate-pulse text-primary">Preparando pregunta...</p>
            </div>
        );

        return (
            <div
                className={cn(
                    "fixed inset-0 z-[2000] flex flex-col overflow-hidden transition-colors duration-500",
                    theme === 'dark' ? "bg-slate-950" : "bg-slate-50",
                    (cuestionario?.bloquearCopia || cuestionario?.mod_cue_bloquear_copia) && "select-none"
                )}
                onContextMenu={(cuestionario?.bloquearCopia || cuestionario?.mod_cue_bloquear_copia) ? (e) => e.preventDefault() : undefined}
                onCopy={(cuestionario?.bloquearCopia || cuestionario?.mod_cue_bloquear_copia) ? (e) => e.preventDefault() : undefined}
                onCut={(cuestionario?.bloquearCopia || cuestionario?.mod_cue_bloquear_copia) ? (e) => e.preventDefault() : undefined}
                onPaste={(cuestionario?.bloquearCopia || cuestionario?.mod_cue_bloquear_copia) ? (e) => e.preventDefault() : undefined}
            >
                <header className={cn(
                    "px-6 md:px-10 h-20 md:h-24 border-b flex justify-between items-center backdrop-blur-md transition-all",
                    theme === 'dark' ? "bg-slate-950/80 border-slate-900" : "bg-white/80 border-slate-200"
                )}>
                    <div className="flex items-center gap-8">
                        <button onClick={onClose} className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border flex items-center justify-center text-slate-500 transition-all active:scale-95 shadow-lg",
                            theme === 'dark' ? "bg-slate-900 border-slate-800 hover:text-white" : "bg-white border-slate-200 hover:text-primary"
                        )}>
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h2 className={cn("font-black text-xs md:text-sm uppercase tracking-[0.2em] mb-0.5", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                {cuestionario.actividad?.titulo || 'Evaluación'}
                            </h2>
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <p className="text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest truncate max-w-[120px] md:max-w-none">Intento {intento.numero} • Pr. {currentIdx + 1}/{cuestionario?.preguntas?.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowQuestionGrid(true)}
                            className={cn(
                                "flex items-center gap-2 px-4 h-10 md:h-16 rounded-xl md:rounded-[1.5rem] border-2 transition-all font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-[1.02]",
                                theme === 'dark' ? "border-slate-800 bg-slate-900 text-white" : "border-slate-100 bg-white text-slate-900"
                            )}
                        >
                            <List size={16} />
                            <span className="hidden sm:inline">Índice</span>
                        </button>
                        <div className={cn(
                            "px-4 md:px-10 h-10 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center gap-2 md:gap-4 border-2 transition-all shadow-xl font-mono",
                            timeLeft < 60 && cuestionario.duracion > 0
                                ? "border-rose-500/50 bg-rose-500/10 text-rose-500 animate-pulse"
                                : theme === 'dark' ? "border-slate-800 bg-slate-900 text-white" : "border-slate-100 bg-white text-slate-900"
                        )}>
                            <Clock size={16} className={timeLeft < 60 && cuestionario.duracion > 0 ? "text-rose-500" : "text-primary"} />
                            <span className="font-black text-sm md:text-xl">{cuestionario.duracion === 0 ? '--:--' : formatTime(timeLeft)}</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    <div className="max-w-4xl mx-auto p-6 md:p-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIdx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm",
                                            currentP.tipo === 'MULTIPLE' || currentP.tipo === 'VF' ? 'bg-violet-500' :
                                                currentP.tipo === 'MULTIPLE_M' ? 'bg-blue-500' :
                                                    currentP.tipo === 'TEXTO' ? 'bg-amber-500' : 'bg-rose-500'
                                        )}>
                                            {currentP.tipo === 'MULTIPLE' ? 'Selección Única' :
                                                currentP.tipo === 'MULTIPLE_M' ? 'Selección Múltiple' :
                                                    currentP.tipo === 'VF' ? 'Verdadero / Falso' :
                                                        currentP.tipo === 'TEXTO' ? 'Respuesta Abierta' : 'Ordenar Elementos'}
                                        </span>
                                        <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{currentP.puntaje} pts</span>
                                    </div>
                                    <div className={cn(
                                        "quiz-question-container",
                                        theme === 'dark' ? "text-white" : "text-slate-900"
                                    )}>
                                        <MathRenderer text={currentP.texto} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {(currentP.tipo === 'MULTIPLE' || currentP.tipo === 'VF') && currentP.opciones.map((opt: any) => {
                                        const isSelected = respuestas[currentP.id]?.opcionId === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleAnswer(currentP.id, opt.id)}
                                                className={cn(
                                                    "p-4 md:p-5 rounded-[1.5rem] border-2 flex items-center justify-between group transition-all duration-300 active:scale-[0.98]",
                                                    isSelected
                                                        ? "bg-primary border-primary shadow-2xl shadow-primary/20"
                                                        : theme === 'dark'
                                                            ? "bg-slate-900/50 border-slate-800 hover:border-slate-600"
                                                            : "bg-white border-slate-200 hover:border-primary/30 shadow-sm"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0",
                                                        isSelected
                                                            ? "bg-white text-primary"
                                                            : theme === 'dark' ? "bg-slate-800 text-slate-500 group-hover:bg-slate-700" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                                    )}>
                                                        <span className="font-black text-xs">{String.fromCharCode(65 + currentP.opciones.indexOf(opt))}</span>
                                                    </div>
                                                    <div className={cn("quiz-question-container text-lg font-semibold text-left", isSelected ? "text-white" : theme === 'dark' ? "text-slate-300" : "text-slate-700")}>
                                                        <MathRenderer text={opt.texto} />
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                                    isSelected
                                                        ? "border-white bg-white/20"
                                                        : theme === 'dark' ? "border-slate-800" : "border-slate-100"
                                                )}>
                                                    {isSelected && <CheckCircle2 size={16} className="text-white" />}
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {currentP.tipo === 'MULTIPLE_M' && currentP.opciones.map((opt: any) => {
                                        let selectedIds: string[] = [];
                                        try {
                                            const tl = respuestas[currentP.id]?.textoLibre;
                                            if (tl) selectedIds = JSON.parse(tl);
                                        } catch (e) { }

                                        const isSelected = selectedIds.includes(opt.id);

                                        const toggleM = () => {
                                            const newIds = isSelected
                                                ? selectedIds.filter(id => id !== opt.id)
                                                : [...selectedIds, opt.id];
                                            handleAnswer(currentP.id, undefined, JSON.stringify(newIds));
                                        };

                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={toggleM}
                                                className={cn(
                                                    "p-4 md:p-5 rounded-[1.5rem] border-2 flex items-center justify-between group transition-all duration-300 active:scale-[0.98]",
                                                    isSelected
                                                        ? "bg-blue-600 border-blue-600 shadow-2xl shadow-blue-600/20"
                                                        : theme === 'dark'
                                                            ? "bg-slate-900/50 border-slate-800 hover:border-slate-600"
                                                            : "bg-white border-slate-200 hover:border-blue-600/30 shadow-sm"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0",
                                                        isSelected
                                                            ? "bg-white text-blue-600"
                                                            : theme === 'dark' ? "bg-slate-800 text-slate-500 group-hover:bg-slate-700" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                                    )}>
                                                        <span className="font-black text-xs">{String.fromCharCode(65 + currentP.opciones.indexOf(opt))}</span>
                                                    </div>
                                                    <div className={cn("quiz-question-container text-lg font-semibold text-left", isSelected ? "text-white" : theme === 'dark' ? "text-slate-300" : "text-slate-700")}>
                                                        <MathRenderer text={opt.texto} />
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                                                    isSelected
                                                        ? "border-white bg-white/20"
                                                        : theme === 'dark' ? "border-slate-800" : "border-slate-100"
                                                )}>
                                                    {isSelected && <CheckSquare size={16} className="text-white" />}
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {currentP.tipo === 'TEXTO' && (
                                        <div className="space-y-4">
                                            <MathEditor
                                                value={respuestas[currentP.id]?.textoLibre || ''}
                                                onChange={(val) => {
                                                    setRespuestas({
                                                        ...respuestas,
                                                        [currentP.id]: { ...respuestas[currentP.id], textoLibre: val }
                                                    });
                                                    handleAnswer(currentP.id, undefined, val);
                                                }}
                                                placeholder="Escribe tu respuesta aquí..."
                                                theme={theme}
                                                rows={8}
                                                label="Tu Respuesta"
                                            />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Tus respuestas se guardan automáticamente.</p>
                                        </div>
                                    )}

                                    {currentP.tipo === 'ORDENAR' && (
                                        <div className="space-y-6">
                                            <p className="text-center text-[10px] font-black uppercase tracking-widest text-rose-500 animate-pulse">Arrastra los elementos para ponerlos en el orden correcto</p>
                                            <div className="space-y-3">
                                                {(() => {
                                                    let sortedOpciones = [...currentP.opciones];
                                                    const tl = respuestas[currentP.id]?.textoLibre;
                                                    if (tl) {
                                                        try {
                                                            const orderedIds: string[] = JSON.parse(tl);
                                                            sortedOpciones.sort((a, b) => {
                                                                const idxA = orderedIds.indexOf(a.id);
                                                                const idxB = orderedIds.indexOf(b.id);
                                                                return idxA - idxB;
                                                            });
                                                        } catch (e) { }
                                                    }

                                                    const onReorder = (newItems: any[]) => {
                                                        const newIds = newItems.map(o => o.id);
                                                        setRespuestas({
                                                            ...respuestas,
                                                            [currentP.id]: { ...respuestas[currentP.id], textoLibre: JSON.stringify(newIds) }
                                                        });
                                                        handleAnswer(currentP.id, undefined, JSON.stringify(newIds));
                                                    };

                                                    return (
                                                        <Reorder.Group axis="y" values={sortedOpciones} onReorder={onReorder} className="space-y-3">
                                                            {sortedOpciones.map((opt, oIdx) => (
                                                                <Reorder.Item
                                                                    key={opt.id}
                                                                    value={opt}
                                                                    className={cn(
                                                                        "p-6 rounded-[1.5rem] border-2 flex items-center gap-6 cursor-grab active:cursor-grabbing transition-colors",
                                                                        theme === 'dark'
                                                                            ? "bg-slate-900/50 border-slate-800 hover:border-rose-500/30"
                                                                            : "bg-white border-slate-200 hover:border-rose-500/30 shadow-md"
                                                                    )}
                                                                >
                                                                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-semibold text-sm shrink-0 shadow-lg shadow-rose-500/20">
                                                                        {oIdx + 1}
                                                                    </div>
                                                                    <div className={cn("quiz-question-container text-xl font-semibold flex-1", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>
                                                                        <MathRenderer text={opt.texto} />
                                                                    </div>
                                                                    <ArrowUpDown size={20} className="text-slate-300 shrink-0" />
                                                                </Reorder.Item>
                                                            ))}
                                                        </Reorder.Group>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <footer className={cn(
                    "px-6 md:px-10 h-20 md:h-28 border-t flex items-center justify-between transition-all",
                    theme === 'dark' ? "bg-slate-950 border-slate-900" : "bg-white border-slate-100"
                )}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                            disabled={currentIdx === 0}
                            className={cn(
                                "h-12 md:h-16 px-4 md:px-8 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 transition-all disabled:opacity-20 disabled:hover:scale-100 hover:scale-[1.02] font-black uppercase text-[8px] md:text-[10px] tracking-widest shrink-0",
                                theme === 'dark' ? "bg-slate-900 text-slate-300 border border-slate-800" : "bg-slate-50 text-slate-500 border border-slate-100"
                            )}
                        >
                            <ChevronLeft size={16} className="md:size-5" />
                            <span className="hidden sm:inline">Anterior</span>
                        </button>

                        {/* Navegación de puntos desplazable */}
                        <div className="flex-1 relative min-w-0 hidden md:block">
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 pointer-events-none opacity-50" />
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none opacity-50" />
                            <div className="flex gap-1.5 px-6 overflow-x-auto no-scrollbar scroll-smooth items-center h-full py-2">
                                {cuestionario.preguntas.map((_: any, idx: number) => {
                                    const isCurrent = idx === currentIdx;
                                    const isAnswered = respuestas[cuestionario.preguntas[idx].id];
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentIdx(idx)}
                                            id={`nav-dot-${idx}`}
                                            className={cn(
                                                "w-2.5 h-2.5 rounded-full transition-all duration-300 shrink-0",
                                                isCurrent
                                                    ? "w-8 bg-primary shadow-lg shadow-primary/30"
                                                    : isAnswered ? "bg-emerald-500/60" : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
                                            )}
                                            title={`Pregunta ${idx + 1}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Indicador móvil simplificado */}
                        <div className="md:hidden flex flex-col items-center flex-1">
                            <span className={cn("text-[10px] font-black tracking-widest uppercase", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                                Pregunta
                            </span>
                            <span className={cn("text-sm font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                {currentIdx + 1} / {cuestionario.preguntas.length}
                            </span>
                        </div>
                    </div>

                    {currentIdx === cuestionario.preguntas.length - 1 ? (
                        <button
                            onClick={() => setShowConfirmFinish(true)}
                            disabled={saving}
                            className="h-16 px-12 rounded-[1.5rem] bg-emerald-600 text-white font-black text-xs md:text-sm uppercase tracking-[0.3em] flex items-center gap-4 shadow-xl shadow-emerald-600/20 hover:scale-[1.05] transition-all disabled:opacity-50"
                        >
                            {saving ? <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                            Finalizar
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIdx(prev => prev + 1)}
                            className={cn(
                                "h-12 md:h-16 pl-8 md:pl-12 pr-6 md:pr-10 rounded-xl md:rounded-[1.5rem] font-black text-[10px] md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-3 md:gap-6 shadow-xl hover:scale-[1.05] transition-all group",
                                theme === 'dark' ? "bg-white text-slate-950" : "bg-slate-900 text-white"
                            )}
                        >
                            Siguiente
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </footer>

                <ConfirmModal
                    isOpen={showConfirmFinish}
                    onClose={() => setShowConfirmFinish(false)}
                    onConfirm={handleSubmit}
                    title="¿Terminar Evaluación?"
                    description={`Has respondido ${Object.keys(respuestas).length} de ${cuestionario.preguntas.length} preguntas. ¿Estás seguro de que deseas finalizar y enviar tus respuestas ahora?`}
                    confirmText="Sí, finalizar"
                    cancelText="Revisar preguntas"
                    variant="primary"
                    loading={saving}
                />

                <ConfirmModal
                    isOpen={showQuestionGrid}
                    onClose={() => setShowQuestionGrid(false)}
                    onConfirm={() => setShowQuestionGrid(false)}
                    title="Navegador de Evaluación"
                    description={
                        <div className="space-y-8 mt-4">
                            {/* Dashboard de Progreso */}
                            <div className={cn("p-6 rounded-[2rem] border transition-all relative overflow-hidden", theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-primary/5 border-primary/10")}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                            <Trophy size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Progreso Total</p>
                                            <p className={cn("text-xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                                {Object.keys(respuestas).length} <span className="text-sm text-slate-400">/ {cuestionario.preguntas.length} completadas</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-primary">
                                            {Math.round((Object.keys(respuestas).length / cuestionario.preguntas.length) * 100)}%
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(Object.keys(respuestas).length / cuestionario.preguntas.length) * 100}%` }}
                                        className="h-full bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
                                    />
                                </div>
                            </div>

                            {/* Leyenda */}
                            <div className="flex flex-wrap gap-4 px-2">
                                {[
                                    { label: 'Actual', color: 'bg-primary', border: 'border-primary' },
                                    { label: 'Respondida', color: 'bg-emerald-500/10', border: 'border-emerald-500/50', text: 'text-emerald-600' },
                                    { label: 'Pendiente', color: theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-400' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className={cn("w-3 h-3 rounded-full border", item.color, item.border)} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Cuadrícula de Preguntas */}
                            <div className="max-h-[50vh] overflow-y-auto pr-4 no-scrollbar space-y-8">
                                {Array.from({ length: Math.ceil(cuestionario.preguntas.length / 20) }).map((_, sectionIdx) => (
                                    <div key={sectionIdx} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest shrink-0">Bloque {sectionIdx * 20 + 1} - {Math.min((sectionIdx + 1) * 20, cuestionario.preguntas.length)}</span>
                                            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                                        </div>
                                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                                            {cuestionario.preguntas.slice(sectionIdx * 20, (sectionIdx + 1) * 20).map((p: any, innerIdx: number) => {
                                                const idx = sectionIdx * 20 + innerIdx;
                                                const isAnswered = respuestas[p.id];
                                                const isCurrent = idx === currentIdx;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            setCurrentIdx(idx);
                                                            setShowQuestionGrid(false);
                                                        }}
                                                        className={cn(
                                                            "w-full aspect-square rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300 border-2 active:scale-90",
                                                            isCurrent
                                                                ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-110"
                                                                : isAnswered
                                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:border-emerald-500"
                                                                    : theme === 'dark' 
                                                                        ? "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white" 
                                                                        : "bg-white border-slate-100 text-slate-400 hover:border-primary/30 hover:text-primary shadow-sm"
                                                        )}
                                                    >
                                                        {idx + 1}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    }
                    confirmText="Volver al examen"
                    cancelText=""
                    variant="primary"
                    maxWidth="max-w-4xl"
                />
            </div>
        );
    }

    if (view === 'result') {
        const totalPosible = cuestionario.preguntas.reduce((acc: any, p: any) => acc + (p.puntaje || 0), 0);
        const aprobado = (intento?.puntajeTotal || 0) >= (totalPosible * 0.6);
        return (
            <div className={cn(
                "fixed inset-0 z-[2000] overflow-y-auto no-scrollbar scroll-smooth transition-colors duration-500",
                theme === 'dark' ? "bg-slate-950 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" : "bg-slate-50 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]"
            )}>
                <div className="min-h-full w-full flex flex-col items-center justify-center p-6 md:p-12">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className={cn(
                            "max-w-xl w-full border rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-center space-y-6 md:space-y-10 shadow-2xl relative overflow-hidden transition-all",
                            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                        )}
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />
                        <div className={cn("w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center mx-auto shadow-2xl", aprobado ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20")}>
                            {aprobado ? <Trophy size={36} className="text-white md:size-12" /> : <AlertTriangle size={36} className="text-white md:size-12" />}
                        </div>
                        <div className="space-y-2 md:space-y-3">
                            <h2 className={cn("text-2xl md:text-4xl font-black leading-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                {aprobado ? '¡Excelente!' : 'Sigue intentando'}
                            </h2>
                            <p className="text-slate-400 font-bold text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em]">{aprobado ? 'Has superado la evaluación exitosamente' : 'No has alcanzado el puntaje mínimo requerido'}</p>
                        </div>
                        {cuestionario.mostrarNota ? (
                            <div className={cn("p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border backdrop-blur-sm transition-all", theme === 'dark' ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-100")}>
                                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2 md:mb-3">Puntaje</p>
                                <div className="flex items-end justify-center gap-1">
                                    <span className={cn("text-5xl md:text-7xl font-black leading-none", aprobado ? "text-emerald-400" : "text-rose-400")}>{intento.puntajeTotal}</span>
                                    <span className="text-xl md:text-2xl font-bold text-slate-400 mb-1">/{totalPosible}</span>
                                </div>
                                <div className="w-full h-1 md:h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-6 md:mt-8 overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (intento.puntajeTotal / totalPosible) * 100)}%` }} className={cn("h-full rounded-full", aprobado ? "bg-emerald-500" : "bg-rose-500")} />
                                </div>
                            </div>
                        ) : (
                            <div className={cn("p-8 rounded-[2.5rem] border bg-indigo-500/10 border-indigo-500/20 text-indigo-500")}>
                                <HelpCircle size={32} className="mx-auto mb-4 opacity-50" />
                                <p className="text-xs font-black uppercase tracking-widest leading-relaxed">
                                    Cuestionario enviado correctamente. Tu calificación será publicada próximamente por tu facilitador.
                                </p>
                            </div>
                        )}
                        <button onClick={onClose} className={cn(
                            "w-full h-20 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] shadow-xl transition-all",
                            "bg-primary text-white shadow-primary/20"
                        )}>
                            Finalizar y Salir
                        </button>
                    </motion.div>

                    {/* Retroalimentación Inmediata */}
                    {cuestionario.retroInmediata && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl w-full mt-12 pb-20 space-y-4"
                        >
                            <h3 className={cn("text-xl font-black uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                Revisión de respuestas
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {cuestionario.preguntas.map((p: any, idx: number) => {
                                    const ans = (intento?.respuestas || []).find((r: any) => r.preguntaId === p.id);
                                    const isCorrect = ans?.esCorrecta;
                                    return (
                                        <div key={p.id} className={cn(
                                            "p-6 rounded-[2rem] border transition-all",
                                            theme === 'dark' ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                                        )}>
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2",
                                                    isCorrect ? "bg-emerald-500 border-emerald-400 text-white" : "bg-rose-500 border-rose-400 text-white"
                                                )}>
                                                    <span className="font-black text-sm">{idx + 1}</span>
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <div className={cn("quiz-question-container font-bold prose dark:prose-invert max-w-none", theme === 'dark' ? "text-slate-200" : "text-slate-800")}>
                                                            <MathRenderer text={p.texto} />
                                                        </div>
                                                        <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", isCorrect ? "text-emerald-500" : "text-rose-500")}>
                                                            {isCorrect ? 'Respuesta Correcta' : 'Respuesta Incorrecta'} • {ans?.puntaje || 0} / {p.puntaje} pts
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2">
                                                        {p.tipo !== 'ORDENAR' && p.opciones.map((opt: any) => {
                                                            const wasSelected = (() => {
                                                                if (!ans) return false;
                                                                if (p.tipo === 'MULTIPLE' || p.tipo === 'VF') return ans.opcionId === opt.id;
                                                                if (p.tipo === 'MULTIPLE_M') {
                                                                    try { return JSON.parse(ans.textoLibre || '[]').includes(opt.id); } catch (e) { return false; }
                                                                }
                                                                return false;
                                                            })();

                                                            return (
                                                                <div key={opt.id} className={cn(
                                                                    "p-3 rounded-xl border flex items-center gap-3 text-xs font-medium",
                                                                    opt.esCorrecta
                                                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                                                                        : wasSelected
                                                                            ? "bg-rose-500/10 border-rose-500/30 text-rose-600"
                                                                            : theme === 'dark' ? "bg-slate-800/50 border-slate-700 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"
                                                                )}>
                                                                    <div className={cn(
                                                                        "w-5 h-5 rounded-md flex items-center justify-center border",
                                                                        opt.esCorrecta ? "bg-emerald-500 border-transparent text-white" : "border-current opacity-30"
                                                                    )}>
                                                                        {opt.esCorrecta && <CheckCircle2 size={12} />}
                                                                    </div>
                                                                    <div className="quiz-question-container flex-1">
                                                                        <MathRenderer text={opt.texto} />
                                                                    </div>
                                                                    {wasSelected && <span className="ml-auto text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-rose-500 text-white">Tu respuesta</span>}
                                                                </div>
                                                            );
                                                        })}

                                                        {p.tipo === 'ORDENAR' && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tu Orden</p>
                                                                    {(() => {
                                                                        try {
                                                                            const ids = JSON.parse(ans?.textoLibre || '[]');
                                                                            return ids.map((id: string, oIdx: number) => {
                                                                                const opt = p.opciones.find((o: any) => o.id === id);
                                                                                return (
                                                                                    <div key={id} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 text-[11px] font-bold flex items-center gap-3">
                                                                                        <span className="w-5 h-5 rounded-md bg-slate-500 text-white flex items-center justify-center text-[9px]">{oIdx + 1}</span>
                                                                                        <MathRenderer text={opt?.texto || ''} />
                                                                                    </div>
                                                                                );
                                                                            });
                                                                        } catch (e) { return <p className="text-xs italic opacity-50">Sin respuesta</p>; }
                                                                    })()}
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Orden Correcto</p>
                                                                    {[...p.opciones].sort((a, b) => a.orden - b.orden).map((opt: any, oIdx: number) => (
                                                                        <div key={opt.id} className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] font-bold flex items-center gap-3">
                                                                            <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[9px]">{oIdx + 1}</span>
                                                                            <MathRenderer text={opt.texto} />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {p.tipo === 'TEXTO' && (
                                                            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 italic text-xs">
                                                                <p className="font-bold opacity-50 mb-1">Tu respuesta:</p>
                                                                <MathRenderer text={ans?.textoLibre || '—'} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
