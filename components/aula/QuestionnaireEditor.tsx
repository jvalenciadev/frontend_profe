'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    AlertTriangle, AlignLeft, ArrowUpDown, BarChart2, CheckCheck, CheckCircle2, CheckSquare, ChevronDown, ChevronUp, Circle, Clock, Download, FileJson, GripVertical, HelpCircle, List, Plus, RefreshCw, Save, Settings, ToggleLeft, Trash2, TrendingUp, Trophy, Upload, Users, X, Sigma
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import MathRenderer from './MathRenderer';
import MathEditor from './MathEditor';

/* ─── Tipos de Pregunta ──────────────────────────────────────────── */
type TipoPregunta = 'MULTIPLE' | 'MULTIPLE_M' | 'VF' | 'TEXTO' | 'ORDENAR';

interface TipoConfig {
    id: TipoPregunta;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    badgeBg: string;
}

const TIPOS: TipoConfig[] = [
    {
        id: 'MULTIPLE', label: 'Selección Única', sublabel: 'Solo una respuesta correcta',
        icon: Circle, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10',
        border: 'border-violet-200 dark:border-violet-500/30', badgeBg: 'bg-violet-500',
    },
    {
        id: 'MULTIPLE_M', label: 'Selección Múltiple', sublabel: 'Varias respuestas correctas',
        icon: CheckCheck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10',
        border: 'border-blue-200 dark:border-blue-500/30', badgeBg: 'bg-blue-500',
    },
    {
        id: 'VF', label: 'Verdadero / Falso', sublabel: 'Solo dos opciones',
        icon: ToggleLeft, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        border: 'border-emerald-200 dark:border-emerald-500/30', badgeBg: 'bg-emerald-500',
    },
    {
        id: 'TEXTO', label: 'Respuesta Corta', sublabel: 'Escrita y calificada manualmente',
        icon: AlignLeft, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10',
        border: 'border-amber-200 dark:border-amber-500/30', badgeBg: 'bg-amber-500',
    },
    {
        id: 'ORDENAR', label: 'Ordenar', sublabel: 'Ordena los elementos correctamente',
        icon: ArrowUpDown, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10',
        border: 'border-rose-200 dark:border-rose-500/30', badgeBg: 'bg-rose-500',
    },
];

const getTipo = (id: TipoPregunta): TipoConfig => TIPOS.find(t => t.id === id) || TIPOS[0];

function buildDefaultOpciones(tipo: TipoPregunta) {
    if (tipo === 'VF') return [
        { texto: 'Verdadero', esCorrecta: true, orden: 1, isNew: true },
        { texto: 'Falso', esCorrecta: false, orden: 2, isNew: true },
    ];
    if (tipo === 'ORDENAR') return [
        { texto: 'Primer elemento', esCorrecta: true, orden: 1, isNew: true },
        { texto: 'Segundo elemento', esCorrecta: true, orden: 2, isNew: true },
        { texto: 'Tercer elemento', esCorrecta: true, orden: 3, isNew: true },
    ];
    if (tipo === 'TEXTO') return [];
    return [
        { texto: 'Opción A', esCorrecta: true, orden: 1, isNew: true },
        { texto: 'Opción B', esCorrecta: false, orden: 2, isNew: true },
        { texto: 'Opción C', esCorrecta: false, orden: 3, isNew: true },
        { texto: 'Opción D', esCorrecta: false, orden: 4, isNew: true },
    ];
}

/* ─── Props ──────────────────────────────────────────────────────── */
interface QuestionnaireEditorProps {
    actividadId: string;
    actividadTitulo?: string;
    actividadPuntajeMax?: number;
    theme: 'light' | 'dark';
    onClose: () => void;
}

type Tab = 'preguntas' | 'configuracion' | 'resultados';

export default function QuestionnaireEditor({
    actividadId, actividadTitulo, actividadPuntajeMax, theme, onClose
}: QuestionnaireEditorProps) {
    const [cuestionario, setCuestionario] = useState<any>(null);
    const [preguntas, setPreguntas] = useState<any[]>([]);
    const [intentos, setIntentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingIntentos, setLoadingIntentos] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedPregunta, setExpandedPregunta] = useState<number | null>(0);
    const [activeTab, setActiveTab] = useState<Tab>('preguntas');
    const [showTypePicker, setShowTypePicker] = useState(false);

    const isDark = theme === 'dark';
    const puntajeMax = 100;

    /* ── Load ── */
    const loadData = async () => {
        try {
            setLoading(true);
            const data = await aulaService.getCuestionarioByActividad(actividadId);
            setCuestionario(data);
            setPreguntas(data?.preguntas || []);
        } catch { toast.error('Error al cargar cuestionario'); }
        finally { setLoading(false); }
    };

    const loadIntentos = async () => {
        if (!cuestionario?.id) return;
        try {
            setLoadingIntentos(true);
            const data = await aulaService.getIntentosPorCuestionario(cuestionario.id);
            setIntentos(data || []);
        } catch { toast.error('Error al cargar resultados'); }
        finally { setLoadingIntentos(false); }
    };

    useEffect(() => { loadData(); }, [actividadId]);
    useEffect(() => { if (activeTab === 'resultados' && cuestionario?.id) loadIntentos(); }, [activeTab, cuestionario?.id]);

    /* ── CRUD Preguntas ── */
    const addPregunta = (tipo: TipoPregunta) => {
        const defaultPuntaje = preguntas.length === 0
            ? puntajeMax
            : Math.max(1, Math.floor(puntajeMax / (preguntas.length + 1)));
        setPreguntas([...preguntas, {
            id: null, isNew: true, texto: '', tipo,
            puntaje: defaultPuntaje,
            orden: preguntas.length + 1,
            opciones: buildDefaultOpciones(tipo),
        }]);
        setExpandedPregunta(preguntas.length);
        setShowTypePicker(false);
    };

    const deletePregunta = (idx: number) => setPreguntas(preguntas.filter((_, i) => i !== idx));

    const updatePregunta = (idx: number, data: any) => {
        const n = [...preguntas];
        n[idx] = { ...n[idx], ...data };
        setPreguntas(n);
    };

    const changeTipo = (pIdx: number, tipo: TipoPregunta) => {
        const n = [...preguntas];
        n[pIdx] = { ...n[pIdx], tipo, opciones: buildDefaultOpciones(tipo) };
        setPreguntas(n);
    };

    const addOpcion = (pIdx: number) => {
        const n = [...preguntas];
        const len = n[pIdx].opciones.length;
        n[pIdx].opciones.push({
            texto: `Opción ${String.fromCharCode(65 + len)}`,
            esCorrecta: false, orden: len + 1, isNew: true
        });
        setPreguntas(n);
    };

    const deleteOpcion = (pIdx: number, oIdx: number) => {
        const n = [...preguntas];
        n[pIdx].opciones = n[pIdx].opciones.filter((_: any, i: number) => i !== oIdx);
        setPreguntas(n);
    };

    const toggleCorrecta = (pIdx: number, oIdx: number) => {
        const n = [...preguntas];
        const tipo: TipoPregunta = n[pIdx].tipo;
        if (tipo === 'MULTIPLE' || tipo === 'VF') {
            // Radio: solo una
            n[pIdx].opciones = n[pIdx].opciones.map((o: any, i: number) => ({ ...o, esCorrecta: i === oIdx }));
        } else {
            // Checkbox: toggle
            n[pIdx].opciones[oIdx].esCorrecta = !n[pIdx].opciones[oIdx].esCorrecta;
        }
        setPreguntas(n);
    };

    const updateOpcionTexto = (pIdx: number, oIdx: number, texto: string) => {
        const n = [...preguntas];
        n[pIdx].opciones[oIdx].texto = texto;
        setPreguntas(n);
    };

    /* ── Puntaje ── */
    const totalPuntaje = preguntas.reduce((s, p) => s + (Number(p.puntaje) || 0), 0);
    const getPuntajeMax = () => {
        if (!cuestionario?.aleatorizar || !cuestionario?.randomCount) return totalPuntaje;
        const sorted = [...preguntas].map(p => Number(p.puntaje) || 0).sort((a, b) => b - a);
        return sorted.slice(0, cuestionario.randomCount).reduce((s, p) => s + p, 0);
    };
    const puntajeSimulado = getPuntajeMax();
    const noEsCien = Math.abs(puntajeSimulado - puntajeMax) > 0.01;

    /* ── Save ── */
    const handleSave = async () => {
        if (totalPuntaje === 0) return toast.error('Debe agregar al menos una pregunta');
        if (noEsCien) return toast.error(`El cuestionario debe sumar ${puntajeMax} pts (actualmente ${puntajeSimulado} pts)`);
        try {
            setSaving(true);
            await aulaService.updateCuestionario(cuestionario.id, cuestionario);
            await aulaService.syncPreguntas(cuestionario.id, preguntas);
            toast.success('Cuestionario guardado correctamente');
            loadData();
        } catch { toast.error('Error al guardar cambios'); }
        finally { setSaving(false); }
    };

    /* ── Stats ── */
    const intentosFinalizados = intentos.filter(i => i.estado === 'finalizado');
    const intentosEnProgreso = intentos.filter(i => i.estado === 'en_progreso');
    const promedio = intentosFinalizados.length > 0
        ? (intentosFinalizados.reduce((s, i) => s + (i.puntajeTotal || 0), 0) / intentosFinalizados.length).toFixed(1)
        : '-';
    const aprobados = intentosFinalizados.filter(i => (i.puntajeTotal || 0) >= (puntajeMax * 0.6)).length;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const exportPreguntas = () => {
        if (preguntas.length === 0) return toast.error('No hay preguntas para exportar');
        // Clean data for export (remove local IDs if any, though they are usually from DB)
        const exportData = preguntas.map(p => ({
            texto: p.texto,
            tipo: p.tipo,
            puntaje: p.puntaje,
            opciones: p.opciones.map((o: any) => ({
                texto: o.texto,
                esCorrecta: o.esCorrecta,
                orden: o.orden
            }))
        }));

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `preguntas_${cuestionario.actividadId || 'export'}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success('Preguntas exportadas correctamente');
    };

    const importPreguntas = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (!Array.isArray(json)) throw new Error('El archivo debe contener una lista de preguntas');

                const newPreguntas = json.map(p => ({
                    ...p,
                    id: undefined,
                    cuestionarioId: cuestionario.id,
                    opciones: p.opciones?.map((o: any) => ({
                        ...o,
                        id: undefined,
                        preguntaId: undefined,
                        isNew: true
                    })) || [],
                    isNew: true
                }));

                setPreguntas(prev => [...prev, ...newPreguntas]);
                toast.success(`${newPreguntas.length} preguntas importadas correctamente`);
            } catch (err: any) {
                toast.error('Error al importar: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset
    };

    const tabStyle = (tab: Tab) => cn(
        'px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2',
        activeTab === tab
            ? 'bg-primary text-white shadow-lg shadow-primary/20'
            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
    );

    if (loading) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                    'w-full max-w-7xl h-[92vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden relative',
                    isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50'
                )}
            >
                {/* ── Header ── */}
                <header className={cn(
                    'px-8 py-5 border-b flex items-center justify-between gap-4 shrink-0',
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                )}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                            <HelpCircle size={24} />
                        </div>
                        <div>
                            <h2 className={cn('text-xl font-black leading-none mb-1', isDark ? 'text-white' : 'text-slate-900')}>
                                Configurar <span className="text-primary">Cuestionario</span>
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {actividadTitulo || cuestionario?.actividad?.titulo || '—'} • Máx. {puntajeMax} pts
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">


                        <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border mr-2', isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200')}>
                            <button
                                onClick={exportPreguntas}
                                title="Exportar Preguntas (JSON)"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-700 transition-all"
                            >
                                <Download size={14} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={importPreguntas}
                                accept=".json"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                title="Importar/Migrar Preguntas"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-700 transition-all"
                            >
                                <Upload size={14} />
                            </button>
                            <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                            <FileJson size={12} className="text-slate-300" />
                        </div>

                        <div className={cn('flex gap-1 p-1 rounded-2xl', isDark ? 'bg-slate-800' : 'bg-slate-100')}>
                            <button className={tabStyle('preguntas')} onClick={() => setActiveTab('preguntas')}>
                                <CheckSquare size={12} /> Preguntas ({preguntas.length})
                            </button>
                            <button className={tabStyle('configuracion')} onClick={() => setActiveTab('configuracion')}>
                                <Settings size={12} /> Config.
                            </button>
                            <button className={tabStyle('resultados')} onClick={() => setActiveTab('resultados')}>
                                <Users size={12} /> Resultados
                                {intentosFinalizados.length > 0 && (
                                    <span className="w-5 h-5 bg-white/20 rounded-full text-[9px] flex items-center justify-center">
                                        {intentosFinalizados.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />

                        <button
                            onClick={onClose}
                            className="group relative w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                            title="Cerrar Editor"
                        >
                            <X size={20} className="transition-transform group-hover:rotate-90" />
                        </button>
                    </div>
                </header>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <AnimatePresence mode="wait">

                        {/* ─── TAB: PREGUNTAS ─── */}
                        {activeTab === 'preguntas' && (
                            <motion.div key="preguntas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-5">

                                {/* Alerta puntaje */}
                                <div className={cn(
                                    'flex items-center gap-3 p-4 rounded-2xl border text-sm font-bold',
                                    noEsCien
                                        ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
                                        : 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400'
                                )}>
                                    {noEsCien ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                                    <p className="text-[10px] font-black uppercase tracking-tight">
                                        {noEsCien
                                            ? (cuestionario?.aleatorizar
                                                ? `Con ${cuestionario.randomCount} preguntas aleatorias, suma ${puntajeSimulado} pts. Debe ser exactamente ${puntajeMax} pts.`
                                                : `Puntaje total: ${totalPuntaje} pts. El cuestionario DEBE sumar ${puntajeMax} pts.`)
                                            : `¡Perfecto! El cuestionario suma 100 pts. Se promediará automáticamente con el resto de actividades.`
                                        }
                                    </p>
                                    <span className={cn('ml-auto font-black text-lg shrink-0', noEsCien ? 'text-rose-600 animate-pulse' : 'text-indigo-600')}>
                                        {puntajeSimulado}<span className="text-xs font-bold text-slate-400"> / {puntajeMax}</span>
                                    </span>
                                </div>

                                {/* Lista de preguntas */}
                                {preguntas.map((p, pIdx) => {
                                    const tc = getTipo(p.tipo as TipoPregunta);
                                    const Icon = tc.icon;
                                    return (
                                        <motion.div
                                            key={pIdx}
                                            layout
                                            className={cn(
                                                'rounded-[2rem] border-2 transition-all overflow-hidden',
                                                expandedPregunta === pIdx
                                                    ? `${tc.border} shadow-lg`
                                                    : isDark ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                                            )}
                                        >
                                            {/* Header pregunta */}
                                            <div
                                                onClick={() => setExpandedPregunta(expandedPregunta === pIdx ? null : pIdx)}
                                                className={cn(
                                                    'p-5 cursor-pointer flex items-center gap-4 transition-all',
                                                    expandedPregunta === pIdx ? tc.bg : isDark ? 'bg-slate-800/30' : 'bg-white'
                                                )}
                                            >
                                                {/* Badge tipo */}
                                                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md', tc.badgeBg)}>
                                                    <Icon size={16} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={cn('font-black text-sm leading-tight truncate', isDark ? 'text-white' : 'text-slate-900', !p.texto && 'italic text-slate-400')}>
                                                        <MathRenderer text={p.texto || 'Sin enunciado...'} />
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full', tc.bg, tc.color)}>
                                                            {tc.label}
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                            {p.puntaje} pts
                                                        </span>
                                                        {p.opciones?.length > 0 && (
                                                            <span className="text-[9px] font-bold text-slate-400">
                                                                {p.opciones.length} opciones
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={e => { e.stopPropagation(); deletePregunta(pIdx); }}
                                                        className="w-8 h-8 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors', tc.color, expandedPregunta === pIdx ? tc.bg : '')}>
                                                        {expandedPregunta === pIdx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Body expandido */}
                                            <AnimatePresence>
                                                {expandedPregunta === pIdx && (
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: 'auto' }}
                                                        exit={{ height: 0 }}
                                                        className={cn('border-t overflow-hidden', isDark ? 'border-slate-700' : 'border-slate-100')}
                                                    >
                                                        <div className="p-4 space-y-4">
                                                            {/* Fila: Enunciado + Config */}
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                                {/* Enunciado */}
                                                                <div className="md:col-span-3 space-y-2">
                                                                    {/* Puntaje row */}
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Enunciado</label>
                                                                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                                                            <label className="text-[8px] font-black uppercase text-slate-400">Puntaje</label>
                                                                            <input
                                                                                type="number" min="0" max="100" step="0.5"
                                                                                value={p.puntaje}
                                                                                onChange={e => updatePregunta(pIdx, { puntaje: parseFloat(e.target.value) })}
                                                                                className="w-10 bg-transparent font-black text-xs outline-none text-right"
                                                                            />
                                                                            <span className="text-[8px] font-black text-slate-400 opacity-50">PTS</span>
                                                                        </div>
                                                                    </div>
                                                                    <MathEditor
                                                                        value={p.texto}
                                                                        onChange={val => updatePregunta(pIdx, { texto: val })}
                                                                        placeholder="Escribe el enunciado de la pregunta..."
                                                                        theme={theme}
                                                                        rows={2}
                                                                    />
                                                                </div>

                                                                {/* Tipo */}
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Naturaleza</label>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {TIPOS.map(t => (
                                                                            <button
                                                                                key={t.id}
                                                                                onClick={() => changeTipo(pIdx, t.id)}
                                                                                title={t.label}
                                                                                className={cn(
                                                                                    'w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center',
                                                                                    p.tipo === t.id
                                                                                        ? `${t.bg} ${t.border} ${t.color}`
                                                                                        : isDark ? 'border-slate-800 text-slate-600 hover:border-slate-700' : 'border-slate-50 text-slate-300 hover:border-slate-100'
                                                                                )}
                                                                            >
                                                                                <t.icon size={14} />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-[8px] font-bold text-slate-400 italic mt-1">{tc.label}</p>
                                                                </div>
                                                            </div>

                                                            {/* ── OPCIONES por TIPO ── */}

                                                            {/* MULTIPLE / MULTIPLE_M */}
                                                            {(p.tipo === 'MULTIPLE' || p.tipo === 'MULTIPLE_M') && (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                            {p.tipo === 'MULTIPLE' ? '⚪ Marca UNA respuesta correcta' : '☑ Marca TODAS las respuestas correctas'}
                                                                        </label>
                                                                        <button onClick={() => addOpcion(pIdx)} className={cn('text-[9px] font-black uppercase hover:underline', tc.color)}>
                                                                            + Añadir Opción
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        {p.opciones?.map((opt: any, oIdx: number) => (
                                                                            <div
                                                                                key={oIdx}
                                                                                className={cn(
                                                                                    'flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all group',
                                                                                    opt.esCorrecta
                                                                                        ? `${tc.border} ${tc.bg}`
                                                                                        : isDark ? 'border-slate-700 bg-slate-800/20' : 'border-slate-100 bg-white'
                                                                                )}
                                                                            >
                                                                                <button
                                                                                    onClick={() => toggleCorrecta(pIdx, oIdx)}
                                                                                    className={cn(
                                                                                        'w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 border-2',
                                                                                        opt.esCorrecta
                                                                                            ? `${tc.badgeBg} border-transparent text-white`
                                                                                            : isDark ? 'border-slate-600 text-slate-500' : 'border-slate-200 text-slate-300'
                                                                                    )}
                                                                                >
                                                                                    {p.tipo === 'MULTIPLE'
                                                                                        ? (opt.esCorrecta ? <CheckCircle2 size={13} /> : <Circle size={13} />)
                                                                                        : (opt.esCorrecta ? <CheckSquare size={13} /> : <CheckSquare size={13} className="opacity-20" />)
                                                                                    }
                                                                                </button>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <MathEditor
                                                                                        value={opt.texto}
                                                                                        onChange={val => updateOpcionTexto(pIdx, oIdx, val)}
                                                                                        placeholder="Texto de la opción..."
                                                                                        theme={theme}
                                                                                        rows={1}
                                                                                        className="border-0 bg-transparent shadow-none"
                                                                                    />
                                                                                </div>
                                                                                {p.opciones.length > 2 && (
                                                                                    <button
                                                                                        onClick={() => deleteOpcion(pIdx, oIdx)}
                                                                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all shrink-0"
                                                                                    >
                                                                                        <Trash2 size={13} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* VF */}
                                                            {p.tipo === 'VF' && (
                                                                <div className="space-y-3">
                                                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                        🟢 Selecciona cuál es la respuesta correcta
                                                                    </label>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        {(['Verdadero', 'Falso'] as const).map((val, oIdx) => {
                                                                            const isSelected = p.opciones?.[oIdx]?.esCorrecta;
                                                                            return (
                                                                                <button
                                                                                    key={val}
                                                                                    onClick={() => toggleCorrecta(pIdx, oIdx)}
                                                                                    className={cn(
                                                                                        'py-8 rounded-3xl border-2 font-black text-lg tracking-widest transition-all hover:scale-[1.02] active:scale-95',
                                                                                        isSelected
                                                                                            ? val === 'Verdadero'
                                                                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20'
                                                                                                : 'bg-rose-500 border-rose-500 text-white shadow-xl shadow-rose-500/20'
                                                                                            : isDark ? 'border-slate-700 bg-slate-800/30 text-slate-500' : 'border-slate-200 bg-white text-slate-300'
                                                                                    )}
                                                                                >
                                                                                    {val === 'Verdadero' ? '✓ Verdadero' : '✗ Falso'}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* TEXTO */}
                                                            {p.tipo === 'TEXTO' && (
                                                                <div className={cn(
                                                                    'p-8 rounded-3xl border-2 border-dashed flex flex-col items-center gap-4 text-center',
                                                                    isDark ? 'border-amber-500/30 bg-amber-500/5' : 'border-amber-200 bg-amber-50'
                                                                )}>
                                                                    <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 flex items-center justify-center">
                                                                        <AlignLeft size={28} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Pregunta de Respuesta Abierta</p>
                                                                        <p className="text-xs text-amber-600/70 dark:text-amber-500/60 font-medium mt-1">
                                                                            El participante escribirá su respuesta. La calificación se realiza manualmente desde la sección Resultados.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* ORDENAR */}
                                                            {p.tipo === 'ORDENAR' && (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                            🔢 Define el orden correcto (arrastra para ordenar)
                                                                        </label>
                                                                        <button onClick={() => addOpcion(pIdx)} className="text-[9px] font-black text-rose-600 uppercase hover:underline">
                                                                            + Añadir Elemento
                                                                        </button>
                                                                    </div>

                                                                    <Reorder.Group axis="y" values={p.opciones} onReorder={(newOrder: any[]) => {
                                                                        const n = [...preguntas];
                                                                        n[pIdx].opciones = newOrder.map((o: any, idx: number) => ({ ...o, orden: idx + 1 }));
                                                                        setPreguntas(n);
                                                                    }} className="space-y-2">
                                                                        {p.opciones?.map((opt: any, oIdx: number) => (
                                                                            <Reorder.Item
                                                                                key={opt.id || oIdx}
                                                                                value={opt}
                                                                                className={cn(
                                                                                    "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all group cursor-grab active:cursor-grabbing",
                                                                                    isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-100 shadow-sm"
                                                                                )}
                                                                            >
                                                                                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                                                                                    {oIdx + 1}
                                                                                </div>
                                                                                <GripVertical size={16} className="text-slate-300 shrink-0" />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <MathEditor
                                                                                        value={opt.texto}
                                                                                        onChange={(val: string) => updateOpcionTexto(pIdx, oIdx, val)}
                                                                                        placeholder="Elemento..."
                                                                                        theme={theme}
                                                                                        rows={1}
                                                                                        className="border-0 bg-transparent shadow-none"
                                                                                    />
                                                                                </div>
                                                                                {p.opciones.length > 2 && (
                                                                                    <button
                                                                                        onClick={() => deleteOpcion(pIdx, oIdx)}
                                                                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all shrink-0"
                                                                                    >
                                                                                        <Trash2 size={13} />
                                                                                    </button>
                                                                                )}
                                                                            </Reorder.Item>
                                                                        ))}
                                                                    </Reorder.Group>

                                                                    <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                                                        <AlertTriangle size={10} /> El sistema mostrará los elementos en orden aleatorio al estudiante.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>{/* /p-4 space-y-4 */}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}

                                {/* ── Picker de tipo o botón agregar ── */}
                                <AnimatePresence>
                                    {showTypePicker ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className={cn(
                                                'rounded-[2rem] border-2 p-6 space-y-4',
                                                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className={cn('text-sm font-black uppercase tracking-widest', isDark ? 'text-white' : 'text-slate-800')}>
                                                    ¿Qué tipo de pregunta quieres agregar?
                                                </p>
                                                <button onClick={() => setShowTypePicker(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                                {TIPOS.map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => addPregunta(t.id)}
                                                        className={cn(
                                                            'flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all hover:scale-[1.03] active:scale-95 group',
                                                            t.bg, t.border
                                                        )}
                                                    >
                                                        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg', t.badgeBg)}>
                                                            <t.icon size={22} />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className={cn('text-[10px] font-black uppercase tracking-widest leading-tight', t.color)}>
                                                                {t.label}
                                                            </p>
                                                            <p className="text-[8px] text-slate-400 font-medium mt-0.5 leading-tight">
                                                                {t.sublabel}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.button
                                            onClick={() => setShowTypePicker(true)}
                                            className={cn(
                                                'w-full py-8 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 group transition-all',
                                                isDark ? 'border-slate-700 hover:border-primary/50' : 'border-slate-200 hover:border-primary/50 bg-white/50'
                                            )}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center text-slate-300 transition-all shadow-sm">
                                                <Plus size={22} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-all">
                                                    Agregar nueva pregunta
                                                </p>
                                                <p className="text-[8px] text-slate-300 font-medium mt-0.5">
                                                    Única • Múltiple • V/F • Respuesta Corta • Ordenar
                                                </p>
                                            </div>
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* ─── TAB: CONFIGURACIÓN ─── */}
                        {activeTab === 'configuracion' && (
                            <motion.div key="config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { label: 'Duración (minutos)', field: 'duracion', hint: '0 = sin límite de tiempo' },
                                        { label: 'Intentos máximos', field: 'maxIntentos', hint: 'Cuántas veces puede intentarlo' },
                                    ].map(({ label, field, hint }) => (
                                        <div key={field} className={cn('p-6 rounded-2xl border space-y-3', isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200')}>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
                                            <input type="number" min="0" value={cuestionario?.[field] ?? ''}
                                                onChange={e => setCuestionario({ ...cuestionario, [field]: parseInt(e.target.value) })}
                                                className={cn('w-full h-14 px-5 rounded-xl border-2 font-black text-lg outline-none', isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900')} />
                                            {hint && <p className="text-[9px] text-slate-400 font-medium">{hint}</p>}
                                        </div>
                                    ))}
                                </div>

                                {/* Aleatorizar */}
                                <div className={cn('p-6 rounded-2xl border space-y-4', isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200')}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-black text-sm">Preguntas Aleatorias</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mezcla orden y selecciona un subconjunto por intento</p>
                                        </div>
                                        <button onClick={() => setCuestionario({ ...cuestionario, aleatorizar: !cuestionario?.aleatorizar })}
                                            className={cn('w-14 h-7 rounded-full transition-all relative', cuestionario?.aleatorizar ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700')}>
                                            <div className={cn('absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all', cuestionario?.aleatorizar ? 'left-7' : 'left-0.5')} />
                                        </button>
                                    </div>
                                    {cuestionario?.aleatorizar && (
                                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Preguntas por intento (de {preguntas.length} totales)</label>
                                            <input type="number" min={1} max={preguntas.length}
                                                value={cuestionario?.randomCount || preguntas.length}
                                                onChange={e => setCuestionario({ ...cuestionario, randomCount: parseInt(e.target.value) })}
                                                className={cn('w-32 h-12 px-4 rounded-xl border-2 font-black text-sm outline-none', isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900')} />
                                        </div>
                                    )}
                                </div>

                                {/* Retroalimentación + Seguridad */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                                    {[
                                        { label: 'Mostrar calificación al finalizar', field: 'mostrarNota', desc: 'El participante verá su puntaje inmediatamente' },
                                        { label: 'Retroalimentación inmediata', field: 'retroInmediata', desc: 'Mostrar respuestas correctas al terminar' },
                                        { label: 'Solo dispositivos móviles', field: 'soloMobile', desc: 'Obliga a realizar el cuestionario desde celular o tablet' },
                                        { label: 'Bloquear Copiado y Pegado', field: 'bloquearCopia', desc: 'Desactiva selección de texto, clic derecho y atajos' },
                                    ].map(({ label, field, desc }) => (
                                        <div key={field} className={cn('p-6 rounded-2xl border flex items-center justify-between transition-all', isDark ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:shadow-sm')}>
                                            <div>
                                                <p className="font-black text-sm">{label}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{desc}</p>
                                            </div>
                                            <button onClick={() => setCuestionario({ ...cuestionario, [field]: !cuestionario?.[field] })}
                                                className={cn('w-14 h-7 rounded-full transition-all relative', cuestionario?.[field] ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700')}>
                                                <div className={cn('absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all', cuestionario?.[field] ? 'left-7' : 'left-0.5')} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ─── TAB: RESULTADOS ─── */}
                        {activeTab === 'resultados' && (
                            <motion.div key="resultados" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total', value: intentos.length, icon: Users, color: 'bg-blue-500' },
                                        { label: 'Finalizados', value: intentosFinalizados.length, icon: CheckCircle2, color: 'bg-emerald-500' },
                                        { label: 'En Progreso', value: intentosEnProgreso.length, icon: Clock, color: 'bg-amber-500' },
                                        { label: 'Promedio', value: `${promedio} pts`, icon: TrendingUp, color: 'bg-primary' },
                                    ].map(({ label, value, icon: Icon, color }) => (
                                        <div key={label} className={cn('p-5 rounded-2xl border', isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200')}>
                                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white mb-3', color)}><Icon size={18} /></div>
                                            <p className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-slate-900')}>{value}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                {intentosFinalizados.length > 0 && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                                        <BarChart2 size={18} className="text-emerald-600" />
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                            {aprobados} de {intentosFinalizados.length} participantes aprobaron el 60%
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <h3 className={cn('text-sm font-black uppercase tracking-widest', isDark ? 'text-white' : 'text-slate-800')}>Detalle por Participante</h3>
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
                                        <p className="text-slate-400 font-bold">Ningún participante ha iniciado el cuestionario aún.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {intentos.map(intento => {
                                            const fin = intento.estado === 'finalizado';
                                            const pct = fin && puntajeMax > 0 ? ((intento.puntajeTotal || 0) / puntajeMax * 100) : 0;
                                            const aprobado = pct >= 60;
                                            return (
                                                <div key={intento.id} className={cn('p-5 rounded-2xl border flex items-center gap-4', isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200')}>
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-slate-500 text-sm shrink-0">
                                                        {(intento.user?.nombre || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn('font-black text-sm truncate', isDark ? 'text-white' : 'text-slate-900')}>
                                                            {intento.user?.nombre} {intento.user?.apellidos}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            Intento #{intento.numero} • {new Date(intento.iniciadoEn).toLocaleDateString('es-ES')}
                                                        </p>
                                                    </div>
                                                    {fin ? (
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <div className="text-right">
                                                                <p className={cn('font-black text-lg leading-none', aprobado ? 'text-emerald-600' : 'text-rose-500')}>{intento.puntajeTotal?.toFixed(1)} pts</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase">{pct.toFixed(0)}%</p>
                                                            </div>
                                                            <div className={cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest', aprobado ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600')}>
                                                                {aprobado ? '✓ Aprobado' : '✗ Reprobado'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 shrink-0">En progreso...</span>
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

                {/* ── Footer ── */}
                <footer className={cn('px-8 py-5 border-t flex justify-between items-center shrink-0', isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {preguntas.length} preguntas • {puntajeMax} pts máx.
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-6 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-700">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || noEsCien}
                            style={{ backgroundColor: noEsCien ? undefined : 'var(--aula-primary)' }}
                            className={cn(
                                'px-10 h-12 rounded-xl text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100',
                                noEsCien ? 'bg-rose-500' : 'shadow-primary/20'
                            )}
                        >
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </footer>
            </motion.div>
        </div>
    );
}
