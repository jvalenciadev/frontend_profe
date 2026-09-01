'use client';

import { useState, useEffect } from 'react';
import {
    evaluationService,
    EvaluationPeriod,
    EvaluacionCuestionario,
    EvaluacionCriterio,
    TipoPregunta,
} from '@/services/evaluationService';
import { cargoService, Cargo } from '@/services/cargoService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    FileSpreadsheet,
    Plus,
    Search,
    Trash2,
    Edit3,
    CalendarCheck,
    Clock,
    ListTree,
    CheckCircle2,
    Loader2,
    Timer,
    Briefcase,
    Sparkles,
    Save,
    HelpCircle,
    CheckSquare,
    Circle,
    Check,
    Settings2,
    ListChecks,
    Code2,
    Sigma,
    Eye,
    EyeOff,
    Heading1,
    Heading2,
    Heading3,
    Bold,
    Italic,
    Underline,
    List,
    Type,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import MathRenderer from '@/components/aula/MathRenderer';
import { RichTextMathEditor } from '@/components/evaluaciones/RichTextMathEditor';

export interface PreguntaForm {
    id?: string;
    codigo: string;
    indicador: string;
    tipoPregunta: TipoPregunta;
    pesoPorcentaje: number;
    orden: number;
    opciones: {
        id?: string;
        texto: string;
        esCorrecta: boolean;
        orden: number;
    }[];
}

interface FormData {
    titulo: string;
    descripcion: string;
    criterioId: string;
    tiempoLimiteMinutos: number | null;
    maxIntentos: number;
    tipoCalculo: 'PROMEDIO_SIMPLE' | 'PONDERADO';
    notaMinima: number;
    cargoIds: string[];
    maxPreguntas: number | null;
    randomPreguntas: boolean;
    estado: 'activo' | 'inactivo';
    preguntas: PreguntaForm[];
}

export default function CuestionariosEvaluacionPage() {
    const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [cuestionarios, setCuestionarios] = useState<EvaluacionCuestionario[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeModalTab, setActiveModalTab] = useState<'config' | 'preguntas'>('config');
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    const emptyForm = (): FormData => ({
        titulo: '',
        descripcion: '',
        criterioId: '',
        tiempoLimiteMinutos: 30,
        maxIntentos: 1,

        tipoCalculo: 'PROMEDIO_SIMPLE',
        notaMinima: 60,
        cargoIds: [],
        maxPreguntas: null,
        randomPreguntas: false,
        estado: 'activo',
        preguntas: [
            {
                codigo: 'PREG-1',
                indicador: '¿Pregunta 1 de la evaluación?',
                tipoPregunta: 'OPCION_UNICA',
                pesoPorcentaje: 100,
                orden: 1,
                opciones: [
                    { texto: 'Opción A', esCorrecta: true, orden: 1 },
                    { texto: 'Opción B', esCorrecta: false, orden: 2 },
                    { texto: 'Opción C', esCorrecta: false, orden: 3 },
                ],
            },
        ],
    });

    const [formData, setFormData] = useState<FormData>(emptyForm());
    const [collapsedPreguntas, setCollapsedPreguntas] = useState<Record<number, boolean>>({});

    const toggleCollapsePregunta = (idx: number) => {
        setCollapsedPreguntas(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const collapseAllPreguntas = () => {
        const next: Record<number, boolean> = {};
        formData.preguntas.forEach((_, idx) => {
            next[idx] = true;
        });
        setCollapsedPreguntas(next);
    };

    const expandAllPreguntas = () => {
        setCollapsedPreguntas({});
    };

    const loadCuestionarios = async (periodId?: string) => {
        const pId = periodId !== undefined ? periodId : selectedPeriod;
        try {
            setLoading(true);
            const data = await evaluationService.getCuestionarios(pId || undefined);
            setCuestionarios(data || []);
        } catch {
            toast.error('Error al cargar cuestionarios');
        } finally {
            setLoading(false);
        }
    };

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [pData, cData] = await Promise.all([
                evaluationService.getPeriods().catch(() => []),
                cargoService.getAll().catch(() => []),
            ]);
            setPeriods(pData || []);
            setCargos(cData || []);

            const active = pData && pData.length > 0 ? (pData.find((p: any) => p.activo) || pData[0]) : null;
            const targetPeriodId = active?.id || '';
            if (targetPeriodId) {
                setSelectedPeriod(targetPeriodId);
            }
            const cuestData = await evaluationService.getCuestionarios(targetPeriodId || undefined).catch(() => []);
            setCuestionarios(cuestData || []);
        } catch {
            toast.error('Error al cargar datos iniciales');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        loadInitialData();
    }, []);

    const handlePeriodChange = (newPeriodId: string) => {
        setSelectedPeriod(newPeriodId);
        loadCuestionarios(newPeriodId);
    };

    const currentPeriodObj = periods.find(p => p.id === selectedPeriod);
    const availableCriterios = currentPeriodObj?.criterios || [];

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData(emptyForm());
        setActiveModalTab('config');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cuest: EvaluacionCuestionario) => {
        setEditingId(cuest.id);
        const subcrits = cuest.criterio?.subcriterios || [];
        setFormData({
            titulo: cuest.titulo,
            descripcion: cuest.descripcion || '',
            criterioId: cuest.criterioId || '',
            tiempoLimiteMinutos: cuest.tiempoLimiteMinutos ?? null,
            maxIntentos: cuest.maxIntentos || 1,
            tipoCalculo: cuest.tipoCalculo || 'PROMEDIO_SIMPLE',
            notaMinima: cuest.notaMinima || 60,
            cargoIds: cuest.cargos?.map(c => c.cargoId) || [],
            maxPreguntas: cuest.maxPreguntas ?? null,
            randomPreguntas: cuest.randomPreguntas ?? false,
            estado: (cuest.estado === 'inactivo' ? 'inactivo' : 'activo') as 'activo' | 'inactivo',
            preguntas: subcrits.length > 0 ? subcrits.map((s, i) => ({
                id: s.id,
                codigo: s.codigo || `PREG-${i + 1}`,
                indicador: s.indicador,
                tipoPregunta: (s.tipoPregunta as TipoPregunta) || 'OPCION_UNICA',
                pesoPorcentaje: Number(s.pesoPorcentaje) || 0,
                orden: s.orden || i + 1,
                opciones: (s.opciones || []).map((o, oi) => ({
                    id: o.id,
                    texto: o.texto,
                    esCorrecta: Boolean(o.esCorrecta),
                    orden: o.orden || oi + 1,
                })),
            })) : [
                {
                    codigo: 'PREG-1',
                    indicador: '',
                    tipoPregunta: 'OPCION_UNICA',
                    pesoPorcentaje: 100,
                    orden: 1,
                    opciones: [
                        { texto: 'Opción 1', esCorrecta: true, orden: 1 },
                        { texto: 'Opción 2', esCorrecta: false, orden: 2 },
                    ],
                },
            ],
        });
        setActiveModalTab('config');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.titulo.trim()) {
            toast.warning('Ingresa el título del cuestionario');
            setActiveModalTab('config');
            return;
        }

        if (formData.preguntas.length === 0) {
            toast.warning('Debes añadir al menos una pregunta a la evaluación');
            setActiveModalTab('preguntas');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                periodoId: selectedPeriod,
                criterioId: formData.criterioId || undefined,
            };

            if (editingId) {
                await evaluationService.updateCuestionario(editingId, payload);
                toast.success('Cuestionario y banco de preguntas actualizados exitosamente');
            } else {
                await evaluationService.createCuestionario(payload);
                toast.success('Cuestionario creado con preguntas exitosamente');
            }
            setIsModalOpen(false);
            loadCuestionarios();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar el cuestionario');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este cuestionario y sus preguntas asociadas?')) return;
        try {
            await evaluationService.deleteCuestionario(id);
            toast.success('Cuestionario eliminado');
            setCuestionarios(prev => prev.filter(c => c.id !== id));
        } catch {
            toast.error('Error al eliminar');
        }
    };

    const handleToggleEstado = async (cuest: EvaluacionCuestionario) => {
        const nuevoEstado = cuest.estado === 'activo' ? 'inactivo' : 'activo';
        try {
            await evaluationService.updateCuestionario(cuest.id, { estado: nuevoEstado });
            toast.success(nuevoEstado === 'activo' ? 'Cuestionario habilitado para rendir evaluación' : 'Cuestionario deshabilitado temporalmente');
            setCuestionarios(prev => prev.map(c => c.id === cuest.id ? { ...c, estado: nuevoEstado } : c));
        } catch {
            toast.error('Error al cambiar estado del cuestionario');
        }
    };

    const handleToggleCargo = (cargoId: string) => {
        setFormData(prev => ({
            ...prev,
            cargoIds: prev.cargoIds.includes(cargoId)
                ? prev.cargoIds.filter(id => id !== cargoId)
                : [...prev.cargoIds, cargoId],
        }));
    };

    const addPregunta = () => {
        const next = formData.preguntas.length + 1;
        setFormData(prev => ({
            ...prev,
            preguntas: [
                ...prev.preguntas,
                {
                    codigo: `PREG-${next}`,
                    indicador: '',
                    tipoPregunta: 'OPCION_UNICA',
                    pesoPorcentaje: 0,
                    orden: next,
                    opciones: [
                        { texto: 'Opción 1', esCorrecta: true, orden: 1 },
                        { texto: 'Opción 2', esCorrecta: false, orden: 2 },
                    ],
                },
            ],
        }));
    };

    const removePregunta = (pIdx: number) => {
        setFormData(prev => ({
            ...prev,
            preguntas: prev.preguntas.filter((_, i) => i !== pIdx),
        }));
    };

    const updatePregunta = (pIdx: number, field: keyof PreguntaForm, val: any) => {
        setFormData(prev => {
            const list = [...prev.preguntas];
            list[pIdx] = { ...list[pIdx], [field]: val };
            if (field === 'tipoPregunta' && val === 'VERDADERO_FALSO') {
                list[pIdx].opciones = [
                    { texto: 'Verdadero', esCorrecta: true, orden: 1 },
                    { texto: 'Falso', esCorrecta: false, orden: 2 },
                ];
            } else if (field === 'tipoPregunta' && (val === 'OPCION_UNICA' || val === 'SELECCION_MULTIPLE') && list[pIdx].opciones.length === 0) {
                list[pIdx].opciones = [
                    { texto: 'Opción 1', esCorrecta: true, orden: 1 },
                    { texto: 'Opción 2', esCorrecta: false, orden: 2 },
                ];
            }
            return { ...prev, preguntas: list };
        });
    };

    const addOpcion = (pIdx: number) => {
        setFormData(prev => {
            const list = [...prev.preguntas];
            const nextO = list[pIdx].opciones.length + 1;
            list[pIdx].opciones.push({
                texto: `Opción ${nextO}`,
                esCorrecta: false,
                orden: nextO,
            });
            return { ...prev, preguntas: list };
        });
    };

    const removeOpcion = (pIdx: number, oIdx: number) => {
        setFormData(prev => {
            const list = [...prev.preguntas];
            list[pIdx].opciones = list[pIdx].opciones.filter((_, i) => i !== oIdx);
            return { ...prev, preguntas: list };
        });
    };

    const toggleOpcionCorrecta = (pIdx: number, oIdx: number) => {
        setFormData(prev => {
            const list = [...prev.preguntas];
            const tipo = list[pIdx].tipoPregunta;
            if (tipo === 'OPCION_UNICA' || tipo === 'VERDADERO_FALSO') {
                list[pIdx].opciones = list[pIdx].opciones.map((o, i) => ({
                    ...o,
                    esCorrecta: i === oIdx,
                }));
            } else {
                list[pIdx].opciones[oIdx].esCorrecta = !list[pIdx].opciones[oIdx].esCorrecta;
            }
            return { ...prev, preguntas: list };
        });
    };

    const updateOpcionTexto = (pIdx: number, oIdx: number, texto: string) => {
        setFormData(prev => {
            const list = [...prev.preguntas];
            list[pIdx].opciones[oIdx].texto = texto;
            return { ...prev, preguntas: list };
        });
    };

    const insertSnippetInPregunta = (pIdx: number, snippet: string) => {
        setFormData(prev => {
            const list = [...prev.preguntas];
            const current = list[pIdx].indicador || '';
            list[pIdx].indicador = current ? `${current} ${snippet}` : snippet;
            return { ...prev, preguntas: list };
        });
    };

    const insertSnippetInOpcion = (pIdx: number, oIdx: number, snippet: string) => {
        setFormData(prev => {
            const list = [...prev.preguntas];
            const current = list[pIdx].opciones[oIdx].texto || '';
            list[pIdx].opciones[oIdx].texto = current ? `${current} ${snippet}` : snippet;
            return { ...prev, preguntas: list };
        });
    };

    const filteredCuestionarios = cuestionarios.filter(c =>
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            Cuestionarios de Evaluación
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">
                        Crea cuestionarios con preguntas de opción única, selección múltiple o verdadero/falso para calificación automática.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-card px-4 py-2.5 rounded-2xl border border-border/40 shadow-sm">
                        <CalendarCheck className="w-4 h-4 text-primary" />
                        <select
                            value={selectedPeriod}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer text-foreground"
                        >
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.gestion} - {p.periodo} ({p.semestre})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Cuestionario
                    </button>
                </div>
            </div>

            <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar cuestionario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-border/40 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
            </div>

            {!mounted || loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 bg-card/50 rounded-3xl border border-border/30">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cargando cuestionarios...</p>
                </div>
            ) : filteredCuestionarios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-dashed border-border/60 text-center space-y-3">
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground/30" />
                    <p className="text-base font-bold text-foreground">No hay cuestionarios registrados</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        Crea un cuestionario con preguntas y respuestas para evaluar funcionarios de forma automatizada.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCuestionarios.map((cuest) => {
                        const totalPreguntas = cuest.criterio?.subcriterios?.length || 0;
                        return (
                            <div
                                key={cuest.id}
                                className="bg-card rounded-3xl border border-border/40 p-6 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between gap-4"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-black text-base uppercase text-foreground leading-tight">
                                                {cuest.titulo}
                                            </h3>
                                            <span className="text-[11px] font-bold text-primary flex items-center gap-1 mt-0.5">
                                                <Briefcase className="w-3 h-3 shrink-0" />
                                                {cuest.cargos && cuest.cargos.length > 0
                                                    ? cuest.cargos.map(c => c.cargo?.nombre || 'Cargo').join(' • ')
                                                    : 'Aplica a todos los cargos'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary">
                                                {cuest.maxPreguntas && cuest.maxPreguntas < totalPreguntas
                                                    ? `${cuest.maxPreguntas} de ${totalPreguntas} Preguntas`
                                                    : `${totalPreguntas} Preguntas`}
                                            </span>
                                            {cuest.randomPreguntas && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                    <Sparkles className="w-2.5 h-2.5" /> Aleatorio
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {cuest.descripcion && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">{cuest.descripcion}</p>
                                    )}

                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                            <Briefcase className="w-3 h-3 text-primary" /> Cargos evaluados:
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                            {cuest.cargos && cuest.cargos.length > 0 ? (
                                                cuest.cargos.map((cg) => (
                                                    <span
                                                        key={cg.id || cg.cargoId}
                                                        className="text-[10px] bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground font-semibold"
                                                    >
                                                        {cg.cargo?.nombre || 'Cargo'}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] italic text-muted-foreground">Aplica a todos los cargos</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/20 text-xs">
                                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                            <Clock className="w-3.5 h-3.5 text-primary" />
                                            {cuest.tiempoLimiteMinutos ? `${cuest.tiempoLimiteMinutos} min` : 'Sin límite'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                            <Timer className="w-3.5 h-3.5 text-primary" />
                                            {cuest.maxIntentos} Intento(s)
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/20">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleEstado(cuest)}
                                        className={cn(
                                            "px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all border shadow-2xs",
                                            cuest.estado === 'activo'
                                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30"
                                                : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30"
                                        )}
                                        title={cuest.estado === 'activo' ? 'Haz clic para deshabilitar este examen' : 'Haz clic para habilitar este examen'}
                                    >
                                        <span className={cn("w-2 h-2 rounded-full shrink-0", cuest.estado === 'activo' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                        {cuest.estado === 'activo' ? 'Habilitado' : 'Deshabilitado'}
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenEdit(cuest)}
                                            className="px-3 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-xs font-bold flex items-center gap-1"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> Editar Preguntas
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cuest.id)}
                                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Editar Cuestionario y Preguntas' : 'Nuevo Cuestionario y Preguntas'}
                size="xl"
            >
                <form onSubmit={handleSave} className="space-y-6 max-h-[85vh] overflow-y-auto px-1 pt-2">
                    <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                        <button
                            type="button"
                            onClick={() => setActiveModalTab('config')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                activeModalTab === 'config'
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            )}
                        >
                            <Settings2 className="w-4 h-4" /> Configuración General
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveModalTab('preguntas')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                activeModalTab === 'preguntas'
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            )}
                        >
                            <ListChecks className="w-4 h-4" /> Banco de Preguntas ({formData.preguntas.length})
                        </button>
                    </div>

                    {activeModalTab === 'config' && (
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-foreground">Título del Cuestionario</label>
                                <input
                                    type="text"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    placeholder="Ej: Evaluación de Conocimientos Técnicos - Matemáticas"
                                    required
                                    className="w-full p-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-foreground">Descripción / Instrucciones</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    rows={2}
                                    placeholder="Instrucciones para el evaluador o funcionario que rinde el cuestionario..."
                                    className="w-full p-2.5 rounded-xl border border-border bg-card text-xs text-foreground"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                                    <ListTree className="w-3.5 h-3.5 text-primary" /> Criterio / Tipo de Evaluación
                                </label>
                                <select
                                    value={formData.criterioId}
                                    onChange={(e) => setFormData({ ...formData, criterioId: e.target.value })}
                                    className="w-full p-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground"
                                >
                                    <option value="">Evaluación Exclusiva por Cargo (Banco de preguntas independiente)</option>
                                    {availableCriterios.map((crit) => (
                                        <option key={crit.id} value={crit.id}>
                                            {crit.nombre} ({crit.pesoPorcentaje}% de peso)
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-muted-foreground italic">
                                    Las preguntas configuradas en este cuestionario pertenecerán exclusivamente a los cargos seleccionados abajo.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground">Tiempo Límite (min)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.tiempoLimiteMinutos ?? 0}
                                        onChange={(e) => setFormData({ ...formData, tiempoLimiteMinutos: Number(e.target.value) || null })}
                                        className="w-full p-2 rounded-xl border border-border bg-card text-xs text-foreground font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground">Máx. Intentos</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.maxIntentos}
                                        onChange={(e) => setFormData({ ...formData, maxIntentos: Number(e.target.value) || 1 })}
                                        className="w-full p-2 rounded-xl border border-border bg-card text-xs text-foreground font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground">Nota Mínima Aprobatoria</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.notaMinima}
                                        onChange={(e) => setFormData({ ...formData, notaMinima: Number(e.target.value) || 60 })}
                                        className="w-full p-2 rounded-xl border border-border bg-card text-xs text-foreground font-bold"
                                    />
                                </div>
                            </div>

                            {/* Cantidad máxima, aleatoriedad y Estado */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                                        <ListChecks className="w-3.5 h-3.5 text-primary" /> Cantidad Máx. a Mostrar
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder={`Todas (${formData.preguntas.length} disponibles)`}
                                        value={formData.maxPreguntas ?? ''}
                                        onChange={(e) => setFormData({ ...formData, maxPreguntas: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full p-2 rounded-xl border border-border bg-card text-xs text-foreground font-bold placeholder:font-normal placeholder:text-muted-foreground/70"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Vacío = todo el banco.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-primary" /> Mezclar Preguntas
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, randomPreguntas: !formData.randomPreguntas })}
                                        className={cn(
                                            'w-full p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all',
                                            formData.randomPreguntas
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                                        )}
                                    >
                                        <span className={cn(
                                            'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                                            formData.randomPreguntas ? 'bg-primary-foreground border-primary-foreground' : 'border-muted-foreground'
                                        )}>
                                            {formData.randomPreguntas && <Check className="w-2.5 h-2.5 text-primary" />}
                                        </span>
                                        {formData.randomPreguntas ? 'Orden aleatorio' : 'Orden fijo'}
                                    </button>
                                    <p className="text-[10px] text-muted-foreground italic">Preguntas y opciones random.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                                        <Timer className="w-3.5 h-3.5 text-primary" /> Estado / Habilitación
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, estado: formData.estado === 'activo' ? 'inactivo' : 'activo' })}
                                        className={cn(
                                            'w-full p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all',
                                            formData.estado === 'activo'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                : 'bg-rose-600/10 text-rose-600 border-rose-600/30'
                                        )}
                                    >
                                        <span className={cn(
                                            'w-2 h-2 rounded-full shrink-0',
                                            formData.estado === 'activo' ? 'bg-white animate-pulse' : 'bg-rose-600'
                                        )} />
                                        {formData.estado === 'activo' ? 'Habilitado para rendir' : 'Deshabilitado'}
                                    </button>
                                    <p className="text-[10px] text-muted-foreground italic">Controla si los evaluados pueden rendir ahora.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-foreground">
                                    Cargos que Aplican ({formData.cargoIds.length} seleccionados)
                                </label>
                                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 rounded-xl border border-border/30 bg-background/50">
                                    {cargos.map(cargo => {
                                        const sel = formData.cargoIds.includes(cargo.id);
                                        return (
                                            <button
                                                key={cargo.id}
                                                type="button"
                                                onClick={() => handleToggleCargo(cargo.id)}
                                                className={cn(
                                                    'px-3 py-1 rounded-xl text-xs font-semibold transition-all border',
                                                    sel
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-card hover:bg-secondary text-muted-foreground border-border/40'
                                                )}
                                            >
                                                {cargo.nombre}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeModalTab === 'preguntas' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-sm font-black uppercase text-foreground">Preguntas del Cuestionario</h4>
                                    <p className="text-xs text-muted-foreground">Configura las preguntas, opciones de respuesta y marca las correctas.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {formData.preguntas.length > 1 && (
                                        <div className="flex items-center bg-secondary/50 p-1 rounded-xl border border-border/40">
                                            <button
                                                type="button"
                                                onClick={collapseAllPreguntas}
                                                className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-all"
                                                title="Plegar todas las preguntas para ahorrar espacio"
                                            >
                                                Plegar Todas
                                            </button>
                                            <button
                                                type="button"
                                                onClick={expandAllPreguntas}
                                                className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-all"
                                                title="Desplegar todas las preguntas"
                                            >
                                                Desplegar Todas
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={addPregunta}
                                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" /> Añadir Pregunta
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {formData.preguntas.map((preg, pIdx) => {
                                    const isCollapsed = Boolean(collapsedPreguntas[pIdx]);
                                    const cleanTextSnippet = preg.indicador
                                        ? preg.indicador.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                                        : 'Sin enunciado redactado...';

                                    return (
                                        <div
                                            key={pIdx}
                                            className={cn(
                                                "rounded-3xl border transition-all duration-200",
                                                isCollapsed
                                                    ? "p-3.5 bg-card border-border/50 hover:border-primary/40 shadow-2xs"
                                                    : "p-5 bg-secondary/20 border-border/40 space-y-4 shadow-xs"
                                            )}
                                        >
                                            {/* Cabecera de la Pregunta con Flecha Colapsable */}
                                            <div className="flex items-center justify-between gap-3">
                                                <div
                                                    onClick={() => toggleCollapsePregunta(pIdx)}
                                                    className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 select-none group"
                                                >
                                                    {/* Flecha interactiva de colapso */}
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            "w-7 h-7 rounded-xl flex items-center justify-center transition-transform duration-200 border border-border/40",
                                                            isCollapsed
                                                                ? "bg-secondary text-muted-foreground group-hover:text-primary -rotate-90"
                                                                : "bg-primary/10 text-primary rotate-0"
                                                        )}
                                                    >
                                                        <ChevronDown className="w-4 h-4" />
                                                    </button>

                                                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">
                                                        {pIdx + 1}
                                                    </span>

                                                    {/* Input de código si está expandido, o texto de código si está colapsado */}
                                                    {!isCollapsed ? (
                                                        <input
                                                            type="text"
                                                            value={preg.codigo}
                                                            onChange={(e) => updatePregunta(pIdx, 'codigo', e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            placeholder="Código..."
                                                            className="w-24 p-1.5 rounded-lg border border-border bg-card text-xs font-mono font-bold text-foreground"
                                                        />
                                                    ) : (
                                                        <span className="font-mono text-xs font-black text-foreground flex-shrink-0">
                                                            {preg.codigo || `PREG-${pIdx + 1}`}
                                                        </span>
                                                    )}

                                                    {/* Snippet de texto en vista colapsada */}
                                                    {isCollapsed && (
                                                        <span className="text-xs text-muted-foreground truncate font-medium">
                                                            {cleanTextSnippet}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <select
                                                        value={preg.tipoPregunta}
                                                        onChange={(e) => updatePregunta(pIdx, 'tipoPregunta', e.target.value as TipoPregunta)}
                                                        className="p-1.5 rounded-lg border border-border bg-card text-xs font-bold text-foreground cursor-pointer"
                                                    >
                                                        <option value="OPCION_UNICA">Opción Única</option>
                                                        <option value="SELECCION_MULTIPLE">Selección Múltiple</option>
                                                        <option value="VERDADERO_FALSO">Verdadero / Falso</option>
                                                        <option value="LIKERT">Escala Likert</option>
                                                    </select>

                                                    {formData.preguntas.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removePregunta(pIdx)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                                            title="Eliminar pregunta"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Cuerpo de la pregunta (solo cuando NO está colapsada) */}
                                            {!isCollapsed && (
                                                <div className="space-y-4 pt-1 border-t border-border/20">
                                                    {/* Enunciado con editor visual */}
                                                    <RichTextMathEditor
                                                        label="Enunciado / Pregunta (Soporta formato y Fórmulas Matemáticas)"
                                                        value={preg.indicador}
                                                        onChange={(val) => updatePregunta(pIdx, 'indicador', val)}
                                                        placeholder="Ej: Determina el valor de $x$ tal que $\sqrt{x^2 + 1} = 5$..."
                                                        rows={3}
                                                        required
                                                    />

                                                    {(preg.tipoPregunta === 'OPCION_UNICA' || preg.tipoPregunta === 'SELECCION_MULTIPLE') && (
                                                        <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3 text-primary" /> Opciones de Respuesta:
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addOpcion(pIdx)}
                                                                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <Plus className="w-3 h-3" /> Añadir Opción
                                                                </button>
                                                            </div>

                                                            <div className="space-y-3">
                                                                {preg.opciones.map((opt, oIdx) => (
                                                                    <div key={oIdx} className="space-y-2 p-3 rounded-2xl bg-card border border-border/40 shadow-2xs">
                                                                        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/20">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="w-5 h-5 rounded-lg bg-secondary text-foreground text-xs font-black flex items-center justify-center">
                                                                                    {String.fromCharCode(65 + oIdx)}
                                                                                </span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleOpcionCorrecta(pIdx, oIdx)}
                                                                                    className={cn(
                                                                                        "px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 border transition-all cursor-pointer",
                                                                                        opt.esCorrecta
                                                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                                                                            : "bg-secondary text-muted-foreground hover:bg-secondary/80 border-border/40"
                                                                                    )}
                                                                                >
                                                                                    {opt.esCorrecta ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                                                                                    {opt.esCorrecta ? 'Opción Correcta' : 'Opción Incorrecta'}
                                                                                </button>
                                                                            </div>

                                                                            {preg.opciones.length > 2 && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeOpcion(pIdx, oIdx)}
                                                                                    className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                                                                    title="Eliminar opción"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            )}
                                                                        </div>

                                                                        <RichTextMathEditor
                                                                            value={opt.texto}
                                                                            onChange={(val) => updateOpcionTexto(pIdx, oIdx, val)}
                                                                            placeholder={`Texto de la Opción ${String.fromCharCode(65 + oIdx)} (ej: $x = \\frac{1}{2}$)...`}
                                                                            rows={2}
                                                                            compact
                                                                            required
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {preg.tipoPregunta === 'VERDADERO_FALSO' && (
                                                        <div className="p-3 rounded-2xl bg-card border border-border/40 space-y-2">
                                                            <span className="text-[10px] font-black uppercase text-muted-foreground">
                                                                ¿Cuál es la respuesta correcta?
                                                            </span>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {preg.opciones.map((opt, oIdx) => (
                                                                    <button
                                                                        key={oIdx}
                                                                        type="button"
                                                                        onClick={() => toggleOpcionCorrecta(pIdx, oIdx)}
                                                                        className={cn(
                                                                            "p-2.5 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer",
                                                                            opt.esCorrecta
                                                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                                                                : "bg-secondary/40 border-border/40 text-muted-foreground hover:bg-secondary"
                                                                        )}
                                                                    >
                                                                        {opt.esCorrecta && <Check className="w-4 h-4" />}
                                                                        {opt.texto} {opt.esCorrecta ? '(Correcta)' : ''}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {preg.tipoPregunta === 'LIKERT' && (
                                                        <div className="p-3 rounded-2xl bg-card border border-border/40 text-[11px] text-muted-foreground space-y-1">
                                                            <span className="font-bold text-foreground block">Escala Likert Estándar:</span>
                                                            <p>Se calificará con 5 niveles: Siempre (100), Casi Siempre (80), Algunas Veces (60), Casi Nunca (40), Nunca (20).</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <div className="text-xs text-muted-foreground">
                            {formData.preguntas.length} Pregunta(s) configuradas
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold uppercase"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 shadow-md shadow-primary/20"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingId ? 'Actualizar Cuestionario y Preguntas' : 'Guardar Cuestionario'}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
