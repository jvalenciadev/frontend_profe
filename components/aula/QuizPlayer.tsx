'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Rocket
} from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    const [respuestas, setRespuestas] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [view, setView] = useState<'lobby' | 'playing' | 'result'>('lobby');
    const [showConfirmFinish, setShowConfirmFinish] = useState(false);

    const loadLobby = async () => {
        try {
            setLoading(true);
            // Primero necesitamos el ID del cuestionario si no lo tenemos
            const cueBasic = await aulaService.getCuestionarioByActividad(actividadId);
            const data = await aulaService.getQuizLobby(cueBasic.id);
            setLobbyData(data);
            setCuestionario(data.cuestionario);
            if (data.intentoEnProgreso) {
                // Si ya hay uno en progreso, podemos saltar al juego o dejar que el usuario elija
                // Para mejor UX, mostramos el lobby primero con el botón "Continuar"
            }
        } catch (err: any) {
            toast.error('Error al cargar información del examen');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLobby(); }, [actividadId]);

    const startQuiz = async () => {
        try {
            setStarting(true);
            const int = await aulaService.iniciarIntento(cuestionario.id);
            setIntento(int);

            // Fetch full questions for this attempt
            // Re-fetch cuestionario just in case to have questions sync
            const fullCue = await aulaService.getCuestionarioByActividad(actividadId);
            
            // Map consistent with specific attempt questions
            if (int.respuestas && int.respuestas.length > 0) {
                const pregsIds = int.respuestas.map((r: any) => r.preguntaId);
                const filteredPreguntas = pregsIds.map((id: string) => fullCue.preguntas.find((p: any) => p.id === id)).filter(Boolean);
                fullCue.preguntas = filteredPreguntas;
            }
            setCuestionario(fullCue);

            // Restore answers
            const rMap: any = {};
            int.respuestas?.forEach((r: any) => {
                if(r.opcionId || r.textoLibre) rMap[r.preguntaId] = r;
            });
            setRespuestas(rMap);

            if (fullCue.duracion > 0) {
                // Calculate remaining time based on startedAt
                const startTime = new Date(int.iniciadoEn).getTime();
                const now = new Date().getTime();
                const elapsed = Math.floor((now - startTime) / 1000);
                const limit = fullCue.duracion * 60;
                setTimeLeft(Math.max(0, limit - elapsed));
            }

            setView('playing');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'No se pudo iniciar el intento');
        } finally {
            setStarting(false);
        }
    };

    // Timer logic
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
            const data = { preguntaId, opcionId, textoLibre };
            const res = await aulaService.responderPregunta(intento.id, data);
            setRespuestas({ ...respuestas, [preguntaId]: res });
        } catch (err) {
            toast.error('Error al guardar respuesta');
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        setShowConfirmFinish(false);
        try {
            const res = await aulaService.finalizarIntento(intento.id);
            setIntento(res);
            setView('result');
            toast.success('Examen enviado con éxito');
        } catch (err) {
            toast.error('Error al finalizar examen');
        } finally {
            setSaving(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center text-white">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mb-8" />
            <p className="font-black uppercase tracking-[0.3em] text-[10px] animate-pulse text-primary">Sincronizando con el servidor...</p>
        </div>
    );

    // ─── VISTA: LOBBY ───
    if (view === 'lobby') {
        const hasActiveIntento = lobbyData?.intentoEnProgreso;
        return (
            <div className={cn(
                "fixed inset-0 z-[2000] flex flex-col items-center justify-center p-6 transition-colors duration-500",
                theme === 'dark' 
                    ? "bg-slate-950 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1)_0%,transparent_50%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.1)_0%,transparent_50%)]" 
                    : "bg-slate-50 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05)_0%,transparent_50%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.05)_0%,transparent_50%)]"
            )}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-5 gap-8">
                    
                    {/* Tarjeta Principal */}
                    <div className={cn(
                        "md:col-span-3 space-y-8 backdrop-blur-xl border p-10 rounded-[3rem] shadow-2xl relative overflow-hidden transition-all",
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
                                <h1 className={cn("text-4xl font-black leading-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                    {cuestionario?.actividad?.titulo}
                                </h1>
                                <p className="text-slate-400 font-bold mt-2 leading-relaxed">Lee detenidamente las instrucciones antes de comenzar tu evaluación.</p>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className={cn("p-6 rounded-3xl border transition-all", theme === 'dark' ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-50 border-slate-100")}>
                                <div className="flex items-center gap-3 text-primary mb-2">
                                    <Timer size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Duración</span>
                                </div>
                                <p className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                    {cuestionario.duracion === 0 ? 'Sin límite' : `${cuestionario.duracion} min`}
                                </p>
                            </div>
                            <div className={cn("p-6 rounded-3xl border transition-all", theme === 'dark' ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-50 border-slate-100")}>
                                <div className="flex items-center gap-3 text-amber-500 mb-2">
                                    <History size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Intentos</span>
                                </div>
                                <p className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                    {lobbyData.intentosConsumidos} / {cuestionario.maxIntentos}
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 relative z-10">
                            {lobbyData.intentosRestantes > 0 || hasActiveIntento ? (
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
                            ) : (
                                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-center font-black text-xs uppercase tracking-widest">
                                    Has agotado todos tus intentos
                                </div>
                            )}
                            <button onClick={onClose} className="w-full mt-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors">Volver al aula</button>
                        </div>
                    </div>

                    {/* Historial Lateral */}
                    <div className="md:col-span-2 space-y-6">
                        <div className={cn(
                            "p-8 rounded-[2.5rem] border flex flex-col justify-between h-auto transition-all",
                            theme === 'dark' ? "bg-slate-900/30 border-slate-800/50" : "bg-white border-slate-200 shadow-xl"
                        )}>
                           <div>
                                <h3 className={cn("font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-3", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                    <Trophy size={18} className="text-amber-500" /> Rendimiento
                                </h3>
                                <div className="space-y-4">
                                    <div className={cn("p-5 rounded-2xl border transition-all", theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Mejor Puntaje</p>
                                        <p className="text-3xl font-black text-emerald-500">{lobbyData.mejorPuntaje || 0} <span className="text-xs text-slate-400">pts</span></p>
                                    </div>
                                    <div className={cn("p-5 rounded-2xl border transition-all", theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Resultado de Sincronización</p>
                                        <p className={cn("text-xs font-bold", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>Todas tus respuestas se guardan encriptadas y en tiempo real.</p>
                                    </div>
                                </div>
                           </div>
                           <div className="mt-10 p-6 rounded-3xl bg-primary/5 border border-primary/10">
                                <HelpCircle size={32} className="text-primary/40 mb-3" />
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                                    Si pierdes la conexión, tu progreso se guardará automáticamente y podrás continuar desde el mismo punto.
                                </p>
                           </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── VISTA: PLAYING ───
    if (view === 'playing') {
        const currentP = cuestionario.preguntas[currentIdx];
        const isSelected = (opcId: string) => respuestas[currentP.id]?.opcionId === opcId;

        return (
            <div className={cn("fixed inset-0 z-[2000] flex flex-col overflow-hidden transition-colors duration-500", theme === 'dark' ? "bg-slate-950" : "bg-slate-50")}>
                {/* Header Superior */}
                <header className={cn(
                    "px-10 h-24 border-b flex justify-between items-center backdrop-blur-md transition-all",
                    theme === 'dark' ? "bg-slate-950/80 border-slate-900" : "bg-white/80 border-slate-200"
                )}>
                    <div className="flex items-center gap-8">
                        <button onClick={onClose} className={cn(
                            "w-12 h-12 rounded-2xl border flex items-center justify-center text-slate-500 transition-all active:scale-95 shadow-lg",
                            theme === 'dark' ? "bg-slate-900 border-slate-800 hover:text-white" : "bg-white border-slate-200 hover:text-primary"
                        )}>
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h2 className={cn("font-black text-sm uppercase tracking-[0.2em] mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                {cuestionario.actividad?.titulo || 'Evaluación'}
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Intento {intento.numero} • Pregunta {currentIdx + 1} de {cuestionario.preguntas.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className={cn(
                        "px-10 h-16 rounded-[1.5rem] flex items-center gap-4 border-2 transition-all shadow-xl font-mono",
                        timeLeft < 60 && cuestionario.duracion > 0 
                            ? "border-rose-500/50 bg-rose-500/10 text-rose-500 animate-pulse" 
                            : theme === 'dark' ? "border-slate-800 bg-slate-900 text-white" : "border-slate-100 bg-white text-slate-900"
                    )}>
                        <Clock size={20} className={timeLeft < 60 && cuestionario.duracion > 0 ? "text-rose-500" : "text-primary"} />
                        <span className="font-black text-xl">{cuestionario.duracion === 0 ? '--:--' : formatTime(timeLeft)}</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    <div className="max-w-4xl mx-auto p-10 md:p-20">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIdx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-12"
                            >
                                {/* Pregunta */}
                                <div className="space-y-6">
                                    <span className="text-primary font-black text-xs uppercase tracking-[0.3em]">Cuestionamiento {currentIdx + 1}</span>
                                    <h3 className={cn("text-3xl md:text-5xl font-black leading-tight tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                        {currentP.texto}
                                    </h3>
                                </div>

                                {/* Opciones */}
                                <div className="grid grid-cols-1 gap-4">
                                    {currentP.opciones.map((opt: any) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleAnswer(currentP.id, opt.id)}
                                            className={cn(
                                                "p-8 rounded-[2rem] border-2 flex items-center justify-between group transition-all duration-300 active:scale-[0.98]",
                                                isSelected(opt.id)
                                                    ? "bg-primary border-primary shadow-2xl shadow-primary/20"
                                                    : theme === 'dark' 
                                                        ? "bg-slate-900/50 border-slate-800 hover:border-slate-600" 
                                                        : "bg-white border-slate-200 hover:border-primary/30 shadow-sm"
                                            )}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                    isSelected(opt.id) 
                                                        ? "bg-white text-primary" 
                                                        : theme === 'dark' ? "bg-slate-800 text-slate-500 group-hover:bg-slate-700" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                                )}>
                                                    <span className="font-black text-sm">{String.fromCharCode(65 + currentP.opciones.indexOf(opt))}</span>
                                                </div>
                                                <span className={cn("text-lg font-bold text-left", isSelected(opt.id) ? "text-white" : theme === 'dark' ? "text-slate-300" : "text-slate-700")}>
                                                    {opt.texto}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                                                isSelected(opt.id) 
                                                    ? "border-white bg-white/20" 
                                                    : theme === 'dark' ? "border-slate-800" : "border-slate-100"
                                            )}>
                                                {isSelected(opt.id) && <CheckCircle2 size={16} className="text-white" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Navegación */}
                <footer className={cn(
                    "px-10 h-28 border-t flex items-center justify-between transition-all",
                    theme === 'dark' ? "bg-slate-950 border-slate-900" : "bg-white border-slate-100"
                )}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                            disabled={currentIdx === 0}
                            className={cn(
                                "h-16 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-20 disabled:hover:scale-100 hover:scale-[1.02] font-black uppercase text-[10px] tracking-widest",
                                theme === 'dark' ? "bg-slate-900 text-slate-300 border border-slate-800" : "bg-slate-50 text-slate-500 border border-slate-100"
                            )}
                        >
                            <ChevronLeft size={20} />
                            Anterior
                        </button>
                        <div className="flex gap-2 px-4 hidden md:flex">
                            {cuestionario.preguntas.map((_: any, idx: number) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setCurrentIdx(idx)}
                                    className={cn(
                                        "w-3 h-1.5 rounded-full transition-all duration-500",
                                        idx === currentIdx ? "w-10 bg-primary shadow-lg shadow-primary/30" : (respuestas[cuestionario.preguntas[idx].id] ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800")
                                    )} 
                                />
                            ))}
                        </div>
                    </div>

                    {currentIdx === cuestionario.preguntas.length - 1 ? (
                        <button
                            onClick={() => setShowConfirmFinish(true)}
                            disabled={saving}
                            className="h-16 px-12 rounded-[1.5rem] bg-emerald-600 text-white font-black text-xs md:text-sm uppercase tracking-[0.3em] flex items-center gap-4 shadow-xl shadow-emerald-600/20 hover:scale-[1.05] transition-all disabled:opacity-50"
                        >
                            {saving ? <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                            Finalizar Examen
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIdx(prev => prev + 1)}
                            className={cn(
                                "h-16 pl-12 pr-10 rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-[0.3em] flex items-center gap-6 shadow-xl hover:scale-[1.05] transition-all group",
                                theme === 'dark' ? "bg-white text-slate-950" : "bg-slate-900 text-white"
                            )}
                        >
                            Siguiente Pregunta
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </footer>

                {/* Confirmación Final */}
                <ConfirmModal
                    isOpen={showConfirmFinish}
                    onClose={() => setShowConfirmFinish(false)}
                    onConfirm={handleSubmit}
                    title="¿Terminar Evaluación?"
                    description={`Has respondido ${Object.keys(respuestas).length} de ${cuestionario.preguntas.length} preguntas. ¿Estás seguro de que deseas finalizar y enviar tus respuestas ahora?`}
                    confirmText="Sí, finalizar"
                    cancelText="Revisar preguntas"
                    variant="info"
                    loading={saving}
                />
            </div>
        );
    }

    // ─── VISTA: RESULT ───
    if (view === 'result') {
        const totalPosible = cuestionario.preguntas.reduce((acc: any, p: any) => acc + (p.puntaje || 0), 0);
        const aprobado = (intento?.puntajeTotal || 0) >= (totalPosible * 0.6);
        return (
            <div className={cn(
                "fixed inset-0 z-[2000] flex flex-col items-center justify-center p-6 transition-colors duration-500",
                theme === 'dark' ? "bg-slate-950 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" : "bg-slate-50 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]"
            )}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className={cn(
                        "max-w-md w-full border rounded-[3rem] p-12 text-center space-y-10 shadow-2xl relative overflow-hidden transition-all",
                        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                    )}
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />
                    <div className={cn("w-28 h-28 rounded-full flex items-center justify-center mx-auto shadow-2xl", aprobado ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20")}>
                        {aprobado ? <Trophy size={48} className="text-white" /> : <AlertTriangle size={48} className="text-white" />}
                    </div>
                    <div className="space-y-3">
                        <h2 className={cn("text-4xl font-black leading-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                            {aprobado ? '¡Excelente!' : 'Sigue intentando'}
                        </h2>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">{aprobado ? 'Has superado la evaluación exitosamente' : 'No has alcanzado el puntaje mínimo requerido'}</p>
                    </div>
                    <div className={cn("p-8 rounded-[2rem] border backdrop-blur-sm transition-all", theme === 'dark' ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-100")}>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-3">Puntaje Obtenido</p>
                        <div className="flex items-end justify-center gap-1.5">
                            <span className={cn("text-7xl font-black leading-none", aprobado ? "text-emerald-400" : "text-rose-400")}>{intento.puntajeTotal}</span>
                            <span className="text-2xl font-bold text-slate-400 mb-1">/{totalPosible}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-8 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (intento.puntajeTotal / totalPosible) * 100)}%` }} className={cn("h-full rounded-full", aprobado ? "bg-emerald-500" : "bg-rose-500")} />
                        </div>
                    </div>
                    <button onClick={onClose} className={cn(
                        "w-full h-20 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] shadow-xl transition-all",
                        theme === 'dark' ? "bg-white text-slate-950" : "bg-slate-900 text-white shadow-slate-900/20"
                    )}>
                        Finalizar y Salir
                    </button>
                </motion.div>
            </div>
        );
    }


    return null;
}
