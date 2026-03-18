'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    X,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Circle,
    Save,
    Settings,
    HelpCircle,
    Users,
    Trophy,
    Clock,
    TrendingUp,
    CheckSquare,
    AlertTriangle,
    BarChart2,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuestionnaireEditorProps {
    actividadId: string;
    actividadTitulo?: string;
    actividadPuntajeMax?: number;
    theme: 'light' | 'dark';
    onClose: () => void;
}

type Tab = 'preguntas' | 'configuracion' | 'resultados';

export default function QuestionnaireEditor({ actividadId, actividadTitulo, actividadPuntajeMax, theme, onClose }: QuestionnaireEditorProps) {
    const [cuestionario, setCuestionario] = useState<any>(null);
    const [preguntas, setPreguntas] = useState<any[]>([]);
    const [intentos, setIntentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingIntentos, setLoadingIntentos] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedPregunta, setExpandedPregunta] = useState<number | null>(0);
    const [activeTab, setActiveTab] = useState<Tab>('preguntas');

    const puntajeMax = actividadPuntajeMax || cuestionario?.actividad?.puntajeMax || 100;

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await aulaService.getCuestionarioByActividad(actividadId);
            setCuestionario(data);
            setPreguntas(data?.preguntas || []);
        } catch (err) {
            toast.error('Error al cargar cuestionario');
        } finally {
            setLoading(false);
        }
    };

    const loadIntentos = async () => {
        if (!cuestionario?.id) return;
        try {
            setLoadingIntentos(true);
            const data = await aulaService.getIntentosPorCuestionario(cuestionario.id);
            setIntentos(data || []);
        } catch (err) {
            toast.error('Error al cargar resultados');
        } finally {
            setLoadingIntentos(false);
        }
    };

    useEffect(() => { loadData(); }, [actividadId]);
    useEffect(() => { if (activeTab === 'resultados' && cuestionario?.id) loadIntentos(); }, [activeTab, cuestionario?.id]);

    const addPregunta = () => {
        const defaultPuntaje = preguntas.length === 0 ? puntajeMax : Math.max(1, Math.floor(puntajeMax / (preguntas.length + 1)));
        const newPregunta = {
            id: null, isNew: true, texto: '', tipo: 'MULTIPLE',
            puntaje: defaultPuntaje, orden: preguntas.length + 1,
            opciones: [
                { texto: 'Opción A', esCorrecta: true, orden: 1, isNew: true },
                { texto: 'Opción B', esCorrecta: false, orden: 2, isNew: true },
                { texto: 'Opción C', esCorrecta: false, orden: 3, isNew: true },
                { texto: 'Opción D', esCorrecta: false, orden: 4, isNew: true },
            ]
        };
        setPreguntas([...preguntas, newPregunta]);
        setExpandedPregunta(preguntas.length);
    };

    const deletePregunta = (idx: number) => setPreguntas(preguntas.filter((_, i) => i !== idx));

    const updatePregunta = (idx: number, data: any) => {
        const newP = [...preguntas];
        newP[idx] = { ...newP[idx], ...data };
        setPreguntas(newP);
    };

    const addOpcion = (pIdx: number) => {
        const newP = [...preguntas];
        newP[pIdx].opciones.push({ texto: `Opción ${String.fromCharCode(65 + newP[pIdx].opciones.length)}`, esCorrecta: false, orden: newP[pIdx].opciones.length + 1, isNew: true });
        setPreguntas(newP);
    };

    const deleteOpcion = (pIdx: number, oIdx: number) => {
        const newP = [...preguntas];
        newP[pIdx].opciones = newP[pIdx].opciones.filter((_: any, i: number) => i !== oIdx);
        setPreguntas(newP);
    };

    const toggleCorrecta = (pIdx: number, oIdx: number) => {
        const newP = [...preguntas];
        if (newP[pIdx].tipo === 'MULTIPLE' || newP[pIdx].tipo === 'VF') {
            newP[pIdx].opciones = newP[pIdx].opciones.map((o: any, i: number) => ({ ...o, esCorrecta: i === oIdx }));
        } else {
            newP[pIdx].opciones[oIdx].esCorrecta = !newP[pIdx].opciones[oIdx].esCorrecta;
        }
        setPreguntas(newP);
    };

    // Calibración de puntaje dinámico
    const totalPuntajeAbsoluto = preguntas.reduce((s, p) => s + (Number(p.puntaje) || 0), 0);
    
    // Si hay aleatorización, el máximo puntaje real por intento depende de las preguntas seleccionadas.
    // Para ser conservadores, tomamos las X preguntas con mayor puntaje.
    const getPuntajeMaximoPosibleEnIntento = () => {
        if (!cuestionario?.aleatorizar || !cuestionario?.randomCount) return totalPuntajeAbsoluto;
        const sortedPuntajes = [...preguntas].map(p => Number(p.puntaje) || 0).sort((a, b) => b - a);
        return sortedPuntajes.slice(0, cuestionario.randomCount).reduce((s, p) => s + p, 0);
    };

    const puntajeMaxSimulado = getPuntajeMaximoPosibleEnIntento();
    const puntajeSuperado = Math.abs(puntajeMaxSimulado - puntajeMax) > 0.01 && !cuestionario?.aleatorizar && totalPuntajeAbsoluto > puntajeMax;
    
    // Nueva lógica: No bloqueamos, advertimos que se escalará si no coincide exactamente
    const necesitaEscalamiento = Math.abs(puntajeMaxSimulado - puntajeMax) > 0.01;

    const handleSave = async () => {
        if (totalPuntajeAbsoluto === 0) {
            toast.error('Debe agregar al menos una pregunta');
            return;
        }
        try {
            setSaving(true);
            await aulaService.updateCuestionario(cuestionario.id, cuestionario);
            await aulaService.syncPreguntas(cuestionario.id, preguntas);
            toast.success('Cambios guardados. Los puntajes se ajustarán automáticamente al máximo de la actividad.');
            loadData();
        } catch (err) {
            toast.error('Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    const tabStyle = (tab: Tab) => cn(
        "px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2",
        activeTab === tab
            ? "bg-primary text-white shadow-lg shadow-primary/20"
            : theme === 'dark' ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"
    );

    if (loading) return null;

    // Stats para Resultados
    const intentosFinalizados = intentos.filter(i => i.estado === 'finalizado');
    const intentosEnProgreso = intentos.filter(i => i.estado === 'en_progreso');
    const promedio = intentosFinalizados.length > 0
        ? (intentosFinalizados.reduce((s, i) => s + (i.puntajeTotal || 0), 0) / intentosFinalizados.length).toFixed(1)
        : '-';
    const aprobados = intentosFinalizados.filter(i => (i.puntajeTotal || 0) >= (puntajeMax * 0.6)).length;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                    "w-full max-w-5xl h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden",
                    theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-slate-50"
                )}
            >
                {/* Header */}
                <header className={cn(
                    "p-8 border-b flex items-center justify-between gap-4",
                    theme === 'dark' ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
                )}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                            <HelpCircle size={24} />
                        </div>
                        <div>
                            <h2 className={cn("text-xl font-black leading-none mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                Configurar <span className="text-primary">Examen</span>
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {actividadTitulo || cuestionario?.actividad?.titulo || '—'} • Máx. {puntajeMax} pts
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Tabs */}
                        <div className={cn("flex gap-1 p-1 rounded-2xl", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")}>
                            <button className={tabStyle('preguntas')} onClick={() => setActiveTab('preguntas')}>
                                <CheckSquare size={12} /> Preguntas ({preguntas.length})
                            </button>
                            <button className={tabStyle('configuracion')} onClick={() => setActiveTab('configuracion')}>
                                <Settings size={12} /> Config.
                            </button>
                            <button className={tabStyle('resultados')} onClick={() => setActiveTab('resultados')}>
                                <Users size={12} /> Resultados
                                {intentosFinalizados.length > 0 && <span className="w-5 h-5 bg-white/20 rounded-full text-[9px] flex items-center justify-center">{intentosFinalizados.length}</span>}
                            </button>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </header>

                {/* Body */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <AnimatePresence mode="wait">

                        {/* ─── TAB: PREGUNTAS ─── */}
                        {activeTab === 'preguntas' && (
                            <motion.div key="preguntas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-4">

                                {/* Alerta de puntaje inteligente */}
                                {necesitaEscalamiento && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700">
                                        <AlertTriangle size={18} />
                                        <p className="text-[10px] font-black uppercase tracking-tight">
                                            {cuestionario?.aleatorizar 
                                                ? `Info: Al mostrar ${cuestionario.randomCount} preguntas aleatorias, el puntaje máximo por intento variará. El sistema lo escalará automáticamente a ${puntajeMax} pts.`
                                                : `Aviso: El puntaje total (${totalPuntajeAbsoluto} pts) no coincide con el máximo de la actividad (${puntajeMax} pts). Las notas se calcularán proporcionalmente.`}
                                        </p>
                                    </div>
                                )}

                                <div className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-2xl border",
                                    necesitaEscalamiento ? "bg-amber-50/50 border-amber-200" : "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
                                )}>
                                    <span className={cn("text-xs font-bold", necesitaEscalamiento ? "text-amber-700" : "text-emerald-700 dark:text-emerald-400")}>
                                        Total preguntas: <strong>{preguntas.length}</strong> | Puntaje base: {totalPuntajeAbsoluto} pts
                                    </span>
                                    {cuestionario?.aleatorizar && (
                                        <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
                                            Modo Aleatorio: {cuestionario.randomCount} preguntas
                                        </span>
                                    )}
                                </div>

                                {preguntas.map((p, pIdx) => (
                                    <motion.div key={pIdx} layout className={cn(
                                        "rounded-[2rem] border transition-all overflow-hidden",
                                        theme === 'dark' ? "bg-slate-800/40 border-slate-700/50 hover:border-slate-600" : "bg-white border-slate-200 hover:shadow-lg"
                                    )}>
                                        {/* Pregunta Header */}
                                        <div onClick={() => setExpandedPregunta(expandedPregunta === pIdx ? null : pIdx)}
                                            className="p-6 cursor-pointer flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                                    {pIdx + 1}
                                                </div>
                                                <div>
                                                    <p className={cn("font-black text-sm leading-tight", !p.texto && "italic text-slate-300")}>
                                                        {p.texto || 'Sin texto...'}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[9px] font-black uppercase text-primary tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">{p.tipo}</span>
                                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{p.puntaje} pts</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); deletePregunta(pIdx); }}
                                                    className="w-8 h-8 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center">
                                                    <Trash2 size={15} />
                                                </button>
                                                {expandedPregunta === pIdx ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                                            </div>
                                        </div>

                                        {/* Pregunta Body Expandido */}
                                        <AnimatePresence>
                                            {expandedPregunta === pIdx && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                                    className={cn("border-t p-6 space-y-6", theme === 'dark' ? "border-slate-700" : "border-slate-100")}>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div className="md:col-span-2 space-y-2">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Texto de la pregunta</label>
                                                            <textarea value={p.texto} onChange={e => updatePregunta(pIdx, { texto: e.target.value })}
                                                                className={cn("w-full p-4 rounded-2xl border font-bold text-sm focus:ring-2 transition-all outline-none resize-none",
                                                                    theme === 'dark' ? "bg-slate-700 border-slate-600 text-white focus:ring-primary/20" : "bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10")}
                                                                rows={3} placeholder="Escriba la pregunta aquí..." />
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tipo</label>
                                                                <select value={p.tipo} onChange={e => updatePregunta(pIdx, { tipo: e.target.value, opciones: e.target.value === 'VF' ? [{ texto: 'Verdadero', esCorrecta: true, orden: 1, isNew: true }, { texto: 'Falso', esCorrecta: false, orden: 2, isNew: true }] : p.opciones })}
                                                                    className={cn("w-full h-12 px-4 rounded-xl border font-black text-sm appearance-none",
                                                                        theme === 'dark' ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-900")}>
                                                                    <option value="MULTIPLE">Opción Múltiple</option>
                                                                    <option value="VF">Verdadero / Falso</option>
                                                                    <option value="TEXTO">Respuesta Corta</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Puntaje (max {puntajeMax})</label>
                                                                <input type="number" min="0" max={puntajeMax} step="0.5" value={p.puntaje}
                                                                    onChange={e => updatePregunta(pIdx, { puntaje: parseFloat(e.target.value) })}
                                                                    className={cn("w-full h-12 px-4 rounded-xl border font-black text-sm",
                                                                        theme === 'dark' ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-900")} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Opciones */}
                                                    {(p.tipo === 'MULTIPLE' || p.tipo === 'VF') && (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Opciones de respuesta</label>
                                                                {p.tipo === 'MULTIPLE' && <button onClick={() => addOpcion(pIdx)} className="text-[9px] font-black text-primary uppercase hover:underline">+ Añadir Opción</button>}
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {p.opciones?.map((opt: any, oIdx: number) => (
                                                                    <div key={oIdx} className={cn("flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                                                                        opt.esCorrecta ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" : "border-slate-200 dark:border-slate-700")}>
                                                                        <button onClick={() => toggleCorrecta(pIdx, oIdx)}
                                                                            className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0",
                                                                                opt.esCorrecta ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400")}>
                                                                            {opt.esCorrecta ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                                                        </button>
                                                                        <input type="text" value={opt.texto}
                                                                            onChange={e => { const newP = [...preguntas]; newP[pIdx].opciones[oIdx].texto = e.target.value; setPreguntas(newP); }}
                                                                            className="flex-1 bg-transparent font-bold text-sm outline-none min-w-0" />
                                                                        {p.tipo === 'MULTIPLE' && p.opciones.length > 2 && (
                                                                            <button onClick={() => deleteOpcion(pIdx, oIdx)} className="text-slate-300 hover:text-rose-500 transition-colors shrink-0"><Trash2 size={14} /></button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {p.tipo === 'TEXTO' && (
                                                        <div className={cn("p-4 rounded-2xl border-2 border-dashed text-center", theme === 'dark' ? "border-slate-600 text-slate-500" : "border-slate-200 text-slate-400")}>
                                                            <p className="text-xs font-bold">El participante escribirá su respuesta libremente.</p>
                                                            <p className="text-[10px] text-slate-400 mt-1">La calificación de respuesta corta se hace manualmente.</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}

                                <button onClick={addPregunta}
                                    className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-primary/50 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center text-slate-300 transition-all">
                                        <Plus size={20} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-all">Nueva Pregunta</span>
                                </button>
                            </motion.div>
                        )}

                        {/* ─── TAB: CONFIGURACIÓN ─── */}
                        {activeTab === 'configuracion' && (
                            <motion.div key="config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { label: 'Duración (minutos)', field: 'duracion', type: 'number', min: 0, hint: '0 = sin límite de tiempo' },
                                        { label: 'Intentos máximos', field: 'maxIntentos', type: 'number', min: 1 },
                                    ].map(({ label, field, type, min, hint }) => (
                                        <div key={field} className={cn("p-6 rounded-2xl border space-y-3", theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-200")}>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
                                            <input type={type} min={min} value={cuestionario?.[field] ?? ''}
                                                onChange={e => setCuestionario({ ...cuestionario, [field]: parseInt(e.target.value) })}
                                                className={cn("w-full h-14 px-5 rounded-xl border-2 font-black text-lg outline-none", theme === 'dark' ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-900")} />
                                            {hint && <p className="text-[9px] text-slate-400 font-medium">{hint}</p>}
                                        </div>
                                    ))}
                                </div>

                                {/* Aleatorizar */}
                                <div className={cn("p-6 rounded-2xl border space-y-4", theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-200")}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-black text-sm">Preguntas Aleatorias</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mezcla el orden y selecciona un subconjunto de preguntas para cada intento</p>
                                        </div>
                                        <button onClick={() => setCuestionario({ ...cuestionario, aleatorizar: !cuestionario?.aleatorizar })}
                                            className={cn("w-14 h-7 rounded-full transition-all relative", cuestionario?.aleatorizar ? "bg-primary" : "bg-slate-200 dark:bg-slate-700")}>
                                            <div className={cn("absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all", cuestionario?.aleatorizar ? "left-7" : "left-0.5")} />
                                        </button>
                                    </div>
                                    {cuestionario?.aleatorizar && (
                                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Número de preguntas a mostrar por intento (de {preguntas.length} totales)</label>
                                            <input type="number" min={1} max={preguntas.length}
                                                value={cuestionario?.randomCount || preguntas.length}
                                                onChange={e => setCuestionario({ ...cuestionario, randomCount: parseInt(e.target.value) })}
                                                className={cn("w-32 h-12 px-4 rounded-xl border-2 font-black text-sm outline-none", theme === 'dark' ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-200 text-slate-900")} />
                                        </div>
                                    )}
                                </div>

                                {/* Retroalimentación */}
                                {[
                                    { label: 'Mostrar calificación al finalizar', field: 'mostrarNota', desc: 'El participante verá su puntaje inmediatamente' },
                                    { label: 'Retroalimentación inmediata', field: 'retroInmediata', desc: 'Mostrar respuestas correctas al terminar' },
                                ].map(({ label, field, desc }) => (
                                    <div key={field} className={cn("p-6 rounded-2xl border flex items-center justify-between", theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-200")}>
                                        <div>
                                            <p className="font-black text-sm">{label}</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{desc}</p>
                                        </div>
                                        <button onClick={() => setCuestionario({ ...cuestionario, [field]: !cuestionario?.[field] })}
                                            className={cn("w-14 h-7 rounded-full transition-all relative", cuestionario?.[field] ? "bg-primary" : "bg-slate-200 dark:bg-slate-700")}>
                                            <div className={cn("absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all", cuestionario?.[field] ? "left-7" : "left-0.5")} />
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* ─── TAB: RESULTADOS ─── */}
                        {activeTab === 'resultados' && (
                            <motion.div key="resultados" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-6">
                                {/* Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Intentos Totales', value: intentos.length, icon: Users, color: 'bg-blue-500' },
                                        { label: 'Finalizados', value: intentosFinalizados.length, icon: CheckCircle2, color: 'bg-emerald-500' },
                                        { label: 'En Progreso', value: intentosEnProgreso.length, icon: Clock, color: 'bg-amber-500' },
                                        { label: 'Promedio', value: `${promedio} pts`, icon: TrendingUp, color: 'bg-primary' },
                                    ].map(({ label, value, icon: Icon, color }) => (
                                        <div key={label} className={cn("p-5 rounded-2xl border", theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-200")}>
                                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white mb-3", color)}>
                                                <Icon size={18} />
                                            </div>
                                            <p className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>{value}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Aprobados pill */}
                                {intentosFinalizados.length > 0 && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                                        <BarChart2 size={18} className="text-emerald-600" />
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                            {aprobados} de {intentosFinalizados.length} participantes superaron el 60% ({(puntajeMax * 0.6).toFixed(1)} pts)
                                        </p>
                                    </div>
                                )}

                                {/* Refresh */}
                                <div className="flex items-center justify-between">
                                    <h3 className={cn("text-sm font-black uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                        Detalle por Participante
                                    </h3>
                                    <button onClick={loadIntentos} disabled={loadingIntentos}
                                        className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline disabled:opacity-50">
                                        <RefreshCw size={12} className={loadingIntentos ? 'animate-spin' : ''} /> Actualizar
                                    </button>
                                </div>

                                {loadingIntentos ? (
                                    <div className="py-20 flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : intentos.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <Users size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold">Ningún participante ha iniciado el examen aún.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {intentos.map((intento) => {
                                            const finalizado = intento.estado === 'finalizado';
                                            const pct = finalizado && puntajeMax > 0 ? ((intento.puntajeTotal || 0) / puntajeMax * 100) : 0;
                                            const aprobado = pct >= 60;
                                            return (
                                                <div key={intento.id} className={cn(
                                                    "p-5 rounded-2xl border flex items-center gap-4",
                                                    theme === 'dark' ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-200"
                                                )}>
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-slate-500 text-sm shrink-0">
                                                        {(intento.user?.nombre || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("font-black text-sm truncate", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                                            {intento.user?.nombre} {intento.user?.apellidos}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            Intento #{intento.numero} • {new Date(intento.iniciadoEn).toLocaleDateString('es-ES')}
                                                        </p>
                                                    </div>
                                                    {finalizado ? (
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <div className="text-right">
                                                                <p className={cn("font-black text-lg leading-none", aprobado ? "text-emerald-600" : "text-rose-500")}>
                                                                    {intento.puntajeTotal?.toFixed(1)} pts
                                                                </p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase">{pct.toFixed(0)}%</p>
                                                            </div>
                                                            <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                                aprobado ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600")}>
                                                                {aprobado ? '✓ Aprobado' : '✗ Reprobado'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 shrink-0">
                                                            En progreso...
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <footer className={cn("p-6 border-t flex justify-between items-center", theme === 'dark' ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {preguntas.length} preguntas • {puntajeMax} pts máx.
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-6 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-700">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={saving || puntajeSuperado}
                            style={{ backgroundColor: puntajeSuperado ? undefined : 'var(--aula-primary)' }}
                            className={cn("px-10 h-12 rounded-xl text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100",
                                puntajeSuperado ? "bg-rose-500" : "shadow-primary/20")}>
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </footer>
            </motion.div>
        </div>
    );
}
