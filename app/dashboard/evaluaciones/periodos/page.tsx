'use client';

import { useState, useEffect } from 'react';
import {
    evaluationService,
    EvaluationPeriod,
    EvaluacionCriterio,
    EvaluacionSubcriterio,
    TipoPregunta,
} from '@/services/evaluationService';
import { cargoService, Cargo } from '@/services/cargoService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    CalendarDays,
    Plus,
    Search,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Save,
    Edit3,
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Loader2,
    Layers,
    ListTree,
    Briefcase,
    ChevronDown,
    ChevronUp,
    FileSpreadsheet,
    Sparkles,
    Calendar,
    Percent,
    AlertCircle,
    ArrowUp,
    ArrowDown,
    Filter,
    CheckSquare,
    Square,
    ExternalLink,
    FileQuestion,
    GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import MathRenderer from '@/components/aula/MathRenderer';
import { RichTextMathEditor } from '@/components/evaluaciones/RichTextMathEditor';

export const isCuestionarioCriterio = (crit: { nombre?: string; descripcion?: string; cuestionarios?: any[] }) => {
    const nombre = (crit.nombre || '').toLowerCase();
    const desc = (crit.descripcion || '').toLowerCase();
    return (
        Boolean(crit.cuestionarios && crit.cuestionarios.length > 0) ||
        nombre.includes('factores asociados') ||
        nombre.includes('cuestionario') ||
        nombre.includes('examen') ||
        nombre.includes('prueba técnica') ||
        desc.includes('cuestionario') ||
        desc.includes('examen')
    );
};

interface FormCriterio {
    id?: string;
    nombre: string;
    descripcion: string;
    pesoPorcentaje: number;
    orden: number;
    cargoIds: string[];
    subcriterios: {
        id?: string;
        codigo: string;
        indicador: string;
        tipoPregunta: TipoPregunta;
        pesoPorcentaje: number;
        orden: number;
    }[];
}

export default function PeriodosEvaluacionPage() {
    const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedPeriodId, setExpandedPeriodId] = useState<string | null>(null);
    const [cargoFilterByPeriod, setCargoFilterByPeriod] = useState<Record<string, string>>({});

    // Modal Periodo + Criterios
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
    const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
    const [savingPeriod, setSavingPeriod] = useState(false);
    const [collapsedCriterios, setCollapsedCriterios] = useState<Record<number, boolean>>({});

    const defaultPeriodData = () => ({
        gestion: new Date().getFullYear().toString(),
        semestre: 'I',
        periodo: 'ANUAL',
        fechaInicio: '',
        fechaFin: '',
        criterios: [
            {
                nombre: 'Desempeño Técnico y Funciones',
                descripcion: 'Evaluación del cumplimiento de actividades específicas del cargo.',
                pesoPorcentaje: 50,
                orden: 1,
                cargoIds: [] as string[],
                subcriterios: [
                    {
                        codigo: 'IND-1.1',
                        indicador: 'Cumple oportunamente con las tareas asignadas para su puesto.',
                        tipoPregunta: 'LIKERT' as TipoPregunta,
                        pesoPorcentaje: 25,
                        orden: 1,
                    },
                    {
                        codigo: 'IND-1.2',
                        indicador: 'Demuestra calidad y rigor en la ejecución técnica.',
                        tipoPregunta: 'LIKERT' as TipoPregunta,
                        pesoPorcentaje: 25,
                        orden: 2,
                    },
                ],
            },
            {
                nombre: 'Responsabilidad y Trabajo en Equipo',
                descripcion: 'Puntualidad, ética y clima laboral.',
                pesoPorcentaje: 50,
                orden: 2,
                cargoIds: [] as string[],
                subcriterios: [
                    {
                        codigo: 'IND-2.1',
                        indicador: 'Mantiene comunicación efectiva y colaborativa con su equipo.',
                        tipoPregunta: 'LIKERT' as TipoPregunta,
                        pesoPorcentaje: 25,
                        orden: 1,
                    },
                    {
                        codigo: 'IND-2.2',
                        indicador: 'Acatamiento de normativas y puntualidad.',
                        tipoPregunta: 'LIKERT' as TipoPregunta,
                        pesoPorcentaje: 25,
                        orden: 2,
                    },
                ],
            },
        ] as FormCriterio[],
    });

    const [periodFormData, setPeriodFormData] = useState(defaultPeriodData());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [pData, cData] = await Promise.all([
                evaluationService.getPeriods(),
                cargoService.getAll(),
            ]);
            setPeriods(pData || []);
            setCargos(cData || []);
            if (pData && pData.length > 0 && !expandedPeriodId) {
                setExpandedPeriodId(pData[0].id);
            }
        } catch (error) {
            toast.error('Error al cargar periodos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreatePeriod = () => {
        setEditingPeriodId(null);
        setPeriodFormData(defaultPeriodData());
        setIsPeriodModalOpen(true);
    };

    const handleOpenEditPeriod = (period: EvaluationPeriod) => {
        setEditingPeriodId(period.id);
        setPeriodFormData({
            gestion: period.gestion || '',
            semestre: period.semestre || 'I',
            periodo: period.periodo || 'ANUAL',
            fechaInicio: period.fechaInicio ? period.fechaInicio.split('T')[0] : '',
            fechaFin: period.fechaFin ? period.fechaFin.split('T')[0] : '',
            criterios: (period.criterios || []).map((c, i) => ({
                id: c.id,
                nombre: c.nombre,
                descripcion: c.descripcion || '',
                pesoPorcentaje: Number(c.pesoPorcentaje) || 0,
                orden: c.orden || i + 1,
                cargoIds: c.cargos?.map(cg => cg.cargoId) || c.cargoIds || [],
                subcriterios: isCuestionarioCriterio(c)
                    ? []
                    : (c.subcriterios || []).map((s, si) => ({
                        id: s.id,
                        codigo: s.codigo || `IND-${i + 1}.${si + 1}`,
                        indicador: s.indicador,
                        tipoPregunta: (s.tipoPregunta as TipoPregunta) || 'LIKERT',
                        pesoPorcentaje: Number(s.pesoPorcentaje) || 0,
                        orden: s.orden || si + 1,
                    })),
            })),
        });
        setIsPeriodModalOpen(true);
    };

    // Validar suma de porcentajes
    const totalPesoCriterios = periodFormData.criterios.reduce((acc, c) => acc + (Number(c.pesoPorcentaje) || 0), 0);

    const handleSavePeriod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (periodFormData.criterios.length === 0) {
            toast.warning('Agrega al menos un criterio de evaluación para este periodo');
            return;
        }

        try {
            setSavingPeriod(true);
            const payload = {
                gestion: periodFormData.gestion,
                semestre: periodFormData.semestre,
                periodo: periodFormData.periodo,
                fechaInicio: periodFormData.fechaInicio || undefined,
                fechaFin: periodFormData.fechaFin || undefined,
                criterios: periodFormData.criterios.map(c => ({
                    ...c,
                    subcriterios: isCuestionarioCriterio(c) ? [] : c.subcriterios,
                })),
                activo: true,
            };

            if (editingPeriodId) {
                await evaluationService.updatePeriod(editingPeriodId, payload);
                toast.success('Periodo y Criterios actualizados exitosamente');
            } else {
                await evaluationService.createPeriod(payload);
                toast.success('Periodo y Criterios creados exitosamente');
            }

            setIsPeriodModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar el periodo');
        } finally {
            setSavingPeriod(false);
        }
    };

    const handleTogglePeriod = async (id: string, currentActive: boolean) => {
        try {
            await evaluationService.togglePeriod(id, !currentActive);
            toast.success(`Periodo ${!currentActive ? 'activado' : 'desactivado'}`);
            setPeriods(prev =>
                prev.map(p => (p.id === id ? { ...p, activo: !currentActive } : p))
            );
        } catch (error) {
            toast.error('Error al actualizar estado del periodo');
        }
    };

    const handleDeletePeriod = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este periodo de evaluación?')) return;
        try {
            await evaluationService.deletePeriod(id);
            toast.success('Periodo eliminado');
            setPeriods(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            toast.error('Error al eliminar periodo');
        }
    };

    // Mutadores de Criterios y Subcriterios con Reordenamiento y Colapso
    const toggleCollapseCriterio = (ci: number) => {
        setCollapsedCriterios(prev => ({ ...prev, [ci]: !prev[ci] }));
    };

    const collapseAllCriterios = () => {
        const all: Record<number, boolean> = {};
        periodFormData.criterios.forEach((_, i) => { all[i] = true; });
        setCollapsedCriterios(all);
    };

    const expandAllCriterios = () => {
        setCollapsedCriterios({});
    };

    const moveCriterioUp = (ci: number) => {
        if (ci <= 0) return;
        setPeriodFormData(prev => {
            const list = [...prev.criterios];
            const temp = list[ci];
            list[ci] = list[ci - 1];
            list[ci - 1] = temp;
            list.forEach((c, idx) => { c.orden = idx + 1; });
            return { ...prev, criterios: list };
        });
        setCollapsedCriterios(prev => {
            const updated = { ...prev };
            const temp = updated[ci];
            updated[ci] = updated[ci - 1];
            updated[ci - 1] = temp;
            return updated;
        });
    };

    const moveCriterioDown = (ci: number) => {
        if (ci >= periodFormData.criterios.length - 1) return;
        setPeriodFormData(prev => {
            const list = [...prev.criterios];
            const temp = list[ci];
            list[ci] = list[ci + 1];
            list[ci + 1] = temp;
            list.forEach((c, idx) => { c.orden = idx + 1; });
            return { ...prev, criterios: list };
        });
        setCollapsedCriterios(prev => {
            const updated = { ...prev };
            const temp = updated[ci];
            updated[ci] = updated[ci + 1];
            updated[ci + 1] = temp;
            return updated;
        });
    };

    const moveSubcriterioUp = (ci: number, si: number) => {
        if (si <= 0) return;
        setPeriodFormData(prev => {
            const list = [...prev.criterios];
            const subList = [...list[ci].subcriterios];
            const temp = subList[si];
            subList[si] = subList[si - 1];
            subList[si - 1] = temp;
            subList.forEach((s, idx) => {
                s.orden = idx + 1;
                s.codigo = `IND-${ci + 1}.${idx + 1}`;
            });
            list[ci].subcriterios = subList;
            return { ...prev, criterios: list };
        });
    };

    const moveSubcriterioDown = (ci: number, si: number) => {
        if (si >= periodFormData.criterios[ci].subcriterios.length - 1) return;
        setPeriodFormData(prev => {
            const list = [...prev.criterios];
            const subList = [...list[ci].subcriterios];
            const temp = subList[si];
            subList[si] = subList[si + 1];
            subList[si + 1] = temp;
            subList.forEach((s, idx) => {
                s.orden = idx + 1;
                s.codigo = `IND-${ci + 1}.${idx + 1}`;
            });
            list[ci].subcriterios = subList;
            return { ...prev, criterios: list };
        });
    };

    const addCriterio = () => {
        const next = periodFormData.criterios.length + 1;
        setPeriodFormData(prev => ({
            ...prev,
            criterios: [
                ...prev.criterios,
                {
                    nombre: `Criterio ${next}`,
                    descripcion: '',
                    pesoPorcentaje: 0,
                    orden: next,
                    cargoIds: [],
                    subcriterios: [
                        {
                            codigo: `IND-${next}.1`,
                            indicador: 'Indicador a evaluar...',
                            tipoPregunta: 'LIKERT',
                            pesoPorcentaje: 0,
                            orden: 1,
                        },
                    ],
                },
            ],
        }));
    };

    const removeCriterio = (ci: number) => {
        setPeriodFormData(prev => {
            const filtered = prev.criterios.filter((_, i) => i !== ci);
            filtered.forEach((c, idx) => { c.orden = idx + 1; });
            return { ...prev, criterios: filtered };
        });
    };

    const updateCriterioField = (ci: number, field: keyof FormCriterio, value: any) => {
        setPeriodFormData(prev => {
            const list = [...prev.criterios];
            list[ci] = { ...list[ci], [field]: value };
            return { ...prev, criterios: list };
        });
    };

    const handleToggleCargoInCriterio = (ci: number, cargoId: string) => {
        setPeriodFormData(prev => {
            const list = [...prev.criterios];
            const currentCargos = list[ci].cargoIds || [];
            list[ci].cargoIds = currentCargos.includes(cargoId)
                ? currentCargos.filter(id => id !== cargoId)
                : [...currentCargos, cargoId];
            return { ...prev, criterios: list };
        });
    };

    const handleSelectAllCargosInCriterio = (ci: number) => {
        setPeriodFormData(prev => {
            const list = [...prev.criterios];
            list[ci].cargoIds = cargos.map(c => c.id);
            return { ...prev, criterios: list };
        });
    };

    const handleClearCargosInCriterio = (ci: number) => {
        setPeriodFormData(prev => {
            const list = [...prev.criterios];
            list[ci].cargoIds = [];
            return { ...prev, criterios: list };
        });
    };

    const addSubcriterio = (ci: number) => {
        setPeriodFormData(prev => {
            const list = [...prev.criterios];
            const next = list[ci].subcriterios.length + 1;
            list[ci].subcriterios.push({
                codigo: `IND-${ci + 1}.${next}`,
                indicador: '',
                tipoPregunta: 'LIKERT',
                pesoPorcentaje: 0,
                orden: next,
            });
            return { ...prev, criterios: list };
        });
    };

    const removeSubcriterio = (ci: number, si: number) => {
        setPeriodFormData(prev => {
            const list = [...prev.criterios];
            const filtered = list[ci].subcriterios.filter((_, i) => i !== si);
            filtered.forEach((s, idx) => {
                s.orden = idx + 1;
                s.codigo = `IND-${ci + 1}.${idx + 1}`;
            });
            list[ci].subcriterios = filtered;
            return { ...prev, criterios: list };
        });
    };

    const filteredPeriods = periods.filter(p =>
        p.gestion?.includes(searchTerm) ||
        p.periodo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.semestre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <CalendarDays className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            Periodos de Evaluación
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">
                        Configura las gestiones activas, sus criterios con porcentaje de peso, subcriterios e indicadores y los cargos que aplican.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/evaluaciones/cuestionarios"
                        className="px-4 py-2.5 rounded-2xl bg-secondary text-secondary-foreground text-xs font-bold uppercase hover:bg-secondary/80 transition-all border border-border/40 flex items-center gap-2"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-primary" />
                        Cuestionarios con Tiempo
                    </Link>

                    <button
                        onClick={handleOpenCreatePeriod}
                        className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Periodo y Criterios
                    </button>
                </div>
            </div>

            {/* Buscador */}
            <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar por gestión, semestre o tipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-border/40 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
            </div>

            {/* Listado de Periodos */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-xs font-semibold text-muted-foreground">Cargando periodos de evaluación...</p>
                </div>
            ) : filteredPeriods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-dashed border-border/60 text-center space-y-3">
                    <CalendarDays className="w-12 h-12 text-muted-foreground/30" />
                    <p className="text-base font-bold text-foreground">No hay periodos registrados</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        Crea el primer periodo con sus criterios de evaluación, pesos y cargos asociados.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredPeriods.map((period) => {
                        const isExpanded = expandedPeriodId === period.id;
                        const criteriosList = period.criterios || [];
                        const totalSub = criteriosList.reduce((acc, cr) => acc + (cr.subcriterios?.length || 0), 0);

                        return (
                            <div
                                key={period.id}
                                className="bg-card rounded-3xl border border-border/40 shadow-sm overflow-hidden transition-all duration-200 hover:border-primary/30"
                            >
                                {/* Cabecera del Periodo */}
                                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shadow-inner flex-shrink-0">
                                            {period.gestion}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-black uppercase text-foreground">
                                                    Gestión {period.gestion} — {period.periodo} ({period.semestre})
                                                </h3>
                                                <span
                                                    className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1",
                                                        period.activo
                                                            ? "bg-emerald-500/10 text-emerald-600"
                                                            : "bg-rose-500/10 text-rose-600"
                                                    )}
                                                >
                                                    {period.activo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {period.activo ? 'ACTIVO' : 'INACTIVO'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {period.fechaInicio ? `Del ${period.fechaInicio.split('T')[0]}` : 'Inicio sin fecha'}
                                                {period.fechaFin ? ` al ${period.fechaFin.split('T')[0]}` : ' - Sin fecha límite'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats & Acciones */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl text-xs font-semibold text-secondary-foreground">
                                            <ListTree className="w-4 h-4 text-primary" />
                                            {criteriosList.length} Criterios • {totalSub} Indicadores
                                        </div>

                                        <button
                                            onClick={() => handleTogglePeriod(period.id, period.activo)}
                                            className={cn(
                                                "p-2 rounded-xl text-xs font-bold transition-all",
                                                period.activo
                                                    ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white"
                                                    : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                                            )}
                                            title={period.activo ? 'Desactivar periodo' : 'Activar periodo'}
                                        >
                                            {period.activo ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                                        </button>

                                        <button
                                            onClick={() => handleOpenEditPeriod(period)}
                                            className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                                            title="Editar periodo, criterios y subcriterios"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            <span>Editar</span>
                                        </button>

                                        <button
                                            onClick={() => setExpandedPeriodId(isExpanded ? null : period.id)}
                                            className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center gap-1.5 text-xs font-bold"
                                        >
                                            {isExpanded ? 'Ocultar Criterios' : 'Ver Criterios y Cargos'}
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>

                                        <button
                                            onClick={() => handleDeletePeriod(period.id)}
                                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
                                            title="Eliminar periodo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Desglose Expandible de Criterios, Pesos, Cargos y Subcriterios */}
                                <AnimatePresence>
                                    {isExpanded && (() => {
                                        const currentCargoFilter = cargoFilterByPeriod[period.id] || 'ALL';

                                        // Filtrar los criterios del periodo según el cargo seleccionado
                                        const displayedCriterios = criteriosList.filter(cr => {
                                            if (currentCargoFilter === 'ALL') return true;
                                            if (currentCargoFilter === 'GENERAL') {
                                                return !cr.cargos || cr.cargos.length === 0;
                                            }
                                            // Si es un cargo específico, mostrar si no tiene cargos (aplica a todos) o si incluye este cargo
                                            return !cr.cargos?.length || cr.cargos.some(cg => cg.cargoId === currentCargoFilter || (cg as any).cargo?.id === currentCargoFilter);
                                        });

                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="border-t border-border/30 bg-secondary/10 p-6 space-y-5"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                                                            <ListTree className="w-4 h-4 text-primary" /> Criterios e Indicadores por Cargo ({displayedCriterios.length} de {criteriosList.length})
                                                        </h4>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Filtra por cargo para visualizar qué criterios e indicadores se aplicarán a cada puesto:
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleOpenEditPeriod(period)}
                                                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                        Editar Criterios y Cargos
                                                    </button>
                                                </div>

                                                {/* Píldoras de Filtro por Cargo */}
                                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1 mr-1 flex-shrink-0">
                                                        <Filter className="w-3 h-3 text-primary" /> Filtrar:
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCargoFilterByPeriod(prev => ({ ...prev, [period.id]: 'ALL' }))}
                                                        className={cn(
                                                            "px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition-all flex-shrink-0 border",
                                                            currentCargoFilter === 'ALL'
                                                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                                : "bg-card text-muted-foreground border-border/40 hover:bg-secondary"
                                                        )}
                                                    >
                                                        Todos ({criteriosList.length})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCargoFilterByPeriod(prev => ({ ...prev, [period.id]: 'GENERAL' }))}
                                                        className={cn(
                                                            "px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition-all flex-shrink-0 border",
                                                            currentCargoFilter === 'GENERAL'
                                                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                                : "bg-card text-muted-foreground border-border/40 hover:bg-secondary"
                                                        )}
                                                    >
                                                        Generales (Todos los puestos)
                                                    </button>
                                                    {cargos.map(cg => {
                                                        const countForCargo = criteriosList.filter(cr =>
                                                            !cr.cargos?.length || cr.cargos.some(c => c.cargoId === cg.id || (c as any).cargo?.id === cg.id)
                                                        ).length;
                                                        if (countForCargo === 0) return null;
                                                        return (
                                                            <button
                                                                key={cg.id}
                                                                type="button"
                                                                onClick={() => setCargoFilterByPeriod(prev => ({ ...prev, [period.id]: cg.id }))}
                                                                className={cn(
                                                                    "px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition-all flex-shrink-0 border flex items-center gap-1",
                                                                    currentCargoFilter === cg.id
                                                                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                                        : "bg-card text-muted-foreground border-border/40 hover:bg-secondary"
                                                                )}
                                                            >
                                                                <span>{cg.nombre}</span>
                                                                <span className="opacity-80 font-black">({countForCargo})</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {displayedCriterios.length === 0 ? (
                                                    <div className="p-8 rounded-2xl bg-card border border-dashed border-border text-center space-y-1">
                                                        <p className="text-xs font-bold text-foreground">No hay criterios configurados para el filtro seleccionado</p>
                                                        <p className="text-[11px] text-muted-foreground">Edita el periodo para asignar criterios a este cargo.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {displayedCriterios.map((crit, ci) => (
                                                            <div
                                                                key={crit.id || ci}
                                                                className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm space-y-3"
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="space-y-0.5 flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                                                                #{crit.orden || ci + 1}
                                                                            </span>
                                                                            <h5 className="text-sm font-bold text-foreground">
                                                                                {crit.nombre}
                                                                            </h5>
                                                                        </div>
                                                                        {crit.descripcion && (
                                                                            <p className="text-xs text-muted-foreground mt-0.5">{crit.descripcion}</p>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs font-black bg-primary/10 text-primary px-2.5 py-1 rounded-xl flex-shrink-0">
                                                                        {crit.pesoPorcentaje}% Peso
                                                                    </span>
                                                                </div>

                                                                {/* Cargos que aplican a este criterio */}
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                                        <Briefcase className="w-3 h-3 text-primary" /> Cargos evaluados:
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {crit.cargos && crit.cargos.length > 0 ? (
                                                                            crit.cargos.map((cg) => (
                                                                                <span
                                                                                    key={cg.id || cg.cargoId}
                                                                                    className="text-[10px] font-bold bg-secondary px-2.5 py-0.5 rounded-md text-secondary-foreground border border-border/30"
                                                                                >
                                                                                    {cg.cargo?.nombre || 'Cargo vinculado'}
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">
                                                                                Aplica a todos los cargos (General)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Subcriterios / Indicadores O Modo Cuestionario */}
                                                                {isCuestionarioCriterio(crit) ? (
                                                                    <div className="pt-2.5 border-t border-border/20 space-y-2">
                                                                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                                                                            <FileQuestion className="w-4 h-4 flex-shrink-0" />
                                                                            <span>Criterio de Evaluación Técnica (Modo Examen / Cuestionario)</span>
                                                                        </div>
                                                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                                            Las preguntas de opción múltiple, banco de reactivos, tiempo límite y fórmulas se gestionan de forma automatizada.
                                                                        </p>
                                                                        <Link
                                                                            href="/dashboard/evaluaciones/cuestionarios"
                                                                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-all hover:bg-primary/20"
                                                                        >
                                                                            <GraduationCap className="w-3.5 h-3.5" />
                                                                            Configurar Preguntas del Cuestionario
                                                                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                                                                        </Link>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-1.5 pt-2 border-t border-border/20">
                                                                        <span className="text-[10px] font-black uppercase text-muted-foreground">
                                                                            Subcriterios / Indicadores ({crit.subcriterios?.length || 0}):
                                                                        </span>
                                                                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                                                            {crit.subcriterios?.map((sub, si) => (
                                                                                <div key={sub.id || si} className="p-2 rounded-xl bg-secondary/30 text-xs flex items-start gap-2 border border-border/20">
                                                                                    <span className="font-mono text-[10px] font-bold text-primary w-14 flex-shrink-0">
                                                                                        {sub.codigo || `IND-${ci + 1}.${si + 1}`}
                                                                                    </span>
                                                                                    <div className="text-foreground text-[11px] font-medium flex-1">
                                                                                        <MathRenderer text={sub.indicador} className="inline-block" />
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })()}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL CREAR / EDITAR PERIODO CON CRITERIOS, PESOS, SUBCRITERIOS Y CARGOS */}
            <Modal
                isOpen={isPeriodModalOpen}
                onClose={() => setIsPeriodModalOpen(false)}
                title={editingPeriodId ? "Editar Periodo, Criterios y Subcriterios" : "Configurar Nuevo Periodo y Criterios"}
                size="xl"
            >
                <form onSubmit={handleSavePeriod} className="space-y-6 max-h-[85vh] overflow-y-auto px-1 pt-2">
                    {/* Datos del Periodo y Vigencia de Fechas */}
                    <div className="space-y-3 p-4 rounded-2xl bg-secondary/30 border border-border/40">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-foreground">Gestión</label>
                                <input
                                    type="text"
                                    required
                                    value={periodFormData.gestion}
                                    onChange={(e) => setPeriodFormData({ ...periodFormData, gestion: e.target.value })}
                                    className="w-full p-2.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="Ej: 2026"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-foreground">Semestre / Subperiodo</label>
                                <select
                                    value={periodFormData.semestre}
                                    onChange={(e) => setPeriodFormData({ ...periodFormData, semestre: e.target.value })}
                                    className="w-full p-2.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                >
                                    <option value="I">I</option>
                                    <option value="II">II</option>
                                    <option value="III">III</option>
                                    <option value="ANUAL">ANUAL</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-foreground">Tipo de Periodo</label>
                                <select
                                    value={periodFormData.periodo}
                                    onChange={(e) => setPeriodFormData({ ...periodFormData, periodo: e.target.value })}
                                    className="w-full p-2.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                >
                                    <option value="ANUAL">ANUAL</option>
                                    <option value="SEMESTRAL">SEMESTRAL</option>
                                    <option value="TRIMESTRAL">TRIMESTRAL</option>
                                    <option value="MENSUAL">MENSUAL</option>
                                </select>
                            </div>
                        </div>

                        {/* Fechas de Vigencia para Evaluaciones y Cuestionarios */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/20">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Inicio de Evaluación
                                </label>
                                <input
                                    type="date"
                                    value={periodFormData.fechaInicio}
                                    onChange={(e) => setPeriodFormData({ ...periodFormData, fechaInicio: e.target.value })}
                                    className="w-full p-2.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-amber-600" /> Fecha Límite / Fin (Hasta cuándo puede rendir)
                                </label>
                                <input
                                    type="date"
                                    value={periodFormData.fechaFin}
                                    onChange={(e) => setPeriodFormData({ ...periodFormData, fechaFin: e.target.value })}
                                    className="w-full p-2.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Constructor de Criterios, Pesos y Selección de Cargos */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black uppercase text-foreground flex items-center gap-2">
                                    <ListTree className="w-4 h-4 text-primary" /> Criterios de Evaluación ({periodFormData.criterios.length})
                                </h4>
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-xs font-black",
                                    totalPesoCriterios === 100
                                        ? "bg-emerald-500/10 text-emerald-600"
                                        : "bg-amber-500/10 text-amber-600"
                                )}>
                                    Total Peso: {totalPesoCriterios}%
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={expandAllCriterios}
                                    className="px-2.5 py-1 rounded-lg border border-border bg-card text-[10px] font-bold text-muted-foreground hover:text-foreground"
                                >
                                    Desplegar Todos
                                </button>
                                <button
                                    type="button"
                                    onClick={collapseAllCriterios}
                                    className="px-2.5 py-1 rounded-lg border border-border bg-card text-[10px] font-bold text-muted-foreground hover:text-foreground"
                                >
                                    Plegar Todos
                                </button>
                                <button
                                    type="button"
                                    onClick={addCriterio}
                                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-sm hover:opacity-90"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Añadir Criterio
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {periodFormData.criterios.map((crit, ci) => {
                                const isCollapsed = Boolean(collapsedCriterios[ci]);

                                return (
                                    <div key={ci} className="rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden transition-all">
                                        {/* Barra Superior del Criterio con Ordenamiento y Colapso */}
                                        <div className="p-3.5 bg-secondary/20 border-b border-border/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                {/* Botones de Reordenar Criterio */}
                                                <div className="flex items-center gap-0.5 bg-card border border-border/40 rounded-lg p-0.5">
                                                    <button
                                                        type="button"
                                                        disabled={ci === 0}
                                                        onClick={() => moveCriterioUp(ci)}
                                                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                                                        title="Subir posición del criterio"
                                                    >
                                                        <ArrowUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={ci === periodFormData.criterios.length - 1}
                                                        onClick={() => moveCriterioDown(ci)}
                                                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                                                        title="Bajar posición del criterio"
                                                    >
                                                        <ArrowDown className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">
                                                    #{ci + 1}
                                                </span>

                                                <input
                                                    type="text"
                                                    value={crit.nombre}
                                                    onChange={(e) => updateCriterioField(ci, 'nombre', e.target.value)}
                                                    placeholder="Nombre del Criterio..."
                                                    required
                                                    className="w-full p-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                                                {/* Peso Porcentaje */}
                                                <div className="flex items-center gap-1.5 bg-card px-3 py-1 rounded-xl border border-border/40">
                                                    <Percent className="w-3.5 h-3.5 text-primary" />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={crit.pesoPorcentaje}
                                                        onChange={(e) => updateCriterioField(ci, 'pesoPorcentaje', Number(e.target.value) || 0)}
                                                        placeholder="Peso %"
                                                        className="w-14 bg-transparent border-none text-xs font-black text-foreground focus:ring-0 p-0 text-right"
                                                    />
                                                    <span className="text-[10px] font-bold text-muted-foreground">%</span>
                                                </div>

                                                {/* Botón Plegar / Desplegar Criterio */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCollapseCriterio(ci)}
                                                    className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-bold flex items-center gap-1"
                                                    title={isCollapsed ? "Desplegar detalles" : "Plegar detalles"}
                                                >
                                                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                                </button>

                                                {/* Eliminar Criterio */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeCriterio(ci)}
                                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                                                    title="Eliminar Criterio"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Contenido Expandido del Criterio */}
                                        {!isCollapsed && (
                                            <div className="p-4 space-y-4">
                                                {/* Descripción opcional */}
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Descripción del Criterio (Opcional)</label>
                                                    <input
                                                        type="text"
                                                        value={crit.descripcion}
                                                        onChange={(e) => updateCriterioField(ci, 'descripcion', e.target.value)}
                                                        placeholder="Ej: Evaluación de competencias técnicas y metodológicas..."
                                                        className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs font-medium text-foreground"
                                                    />
                                                </div>

                                                {/* Selector de Cargos que aplican a este criterio con Acciones Rápidas */}
                                                <div className="space-y-2 p-3.5 rounded-xl bg-secondary/20 border border-border/30">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-[10px] font-black uppercase text-foreground flex items-center gap-1.5">
                                                            <Briefcase className="w-3.5 h-3.5 text-primary" />
                                                            Cargos para este criterio:
                                                            <span className="text-primary font-bold">
                                                                {crit.cargoIds.length === 0 ? ' (Todos los cargos / General)' : ` (${crit.cargoIds.length} seleccionados)`}
                                                            </span>
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSelectAllCargosInCriterio(ci)}
                                                                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                                            >
                                                                <CheckSquare className="w-3 h-3" /> Seleccionar Todos
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleClearCargosInCriterio(ci)}
                                                                className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                                                            >
                                                                <Square className="w-3 h-3" /> Ninguno (General)
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-card rounded-xl border border-border/30">
                                                        {cargos.map((cargo) => {
                                                            const isSel = crit.cargoIds.includes(cargo.id);
                                                            return (
                                                                <button
                                                                    key={cargo.id}
                                                                    type="button"
                                                                    onClick={() => handleToggleCargoInCriterio(ci, cargo.id)}
                                                                    className={cn(
                                                                        "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1",
                                                                        isSel
                                                                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-black"
                                                                            : "bg-secondary/40 hover:bg-secondary text-muted-foreground border-border/30"
                                                                    )}
                                                                >
                                                                    {isSel && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                                                                    <span>{cargo.nombre}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Subcriterios / Indicadores O Panel Informativo de Cuestionario */}
                                                {isCuestionarioCriterio(crit) ? (
                                                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2.5">
                                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                                                            <FileQuestion className="w-4 h-4 flex-shrink-0" />
                                                            <span>Criterio en Modo Examen / Cuestionario Técnico</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                            Este criterio evalúa conocimientos técnicos y factores asociados de forma automatizada mediante exámenes por cargo. No requiere redactar indicadores de rúbrica aquí.
                                                        </p>
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <Link
                                                                href="/dashboard/evaluaciones/cuestionarios"
                                                                target="_blank"
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-all hover:bg-primary/20 shadow-xs"
                                                            >
                                                                <GraduationCap className="w-3.5 h-3.5" />
                                                                Ir a Cuestionarios por Cargo
                                                                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-primary/30">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase text-foreground flex items-center gap-1.5">
                                                                <ListTree className="w-3.5 h-3.5 text-primary" /> Subcriterios / Indicadores ({crit.subcriterios.length}):
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => addSubcriterio(ci)}
                                                                className="text-xs font-black text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" /> Añadir Indicador
                                                            </button>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {crit.subcriterios.map((sub, si) => (
                                                                <div key={si} className="p-3.5 rounded-2xl bg-secondary/10 border border-border/40 space-y-2.5 shadow-xs">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            {/* Controles para reordenar subcriterio */}
                                                                            <div className="flex items-center gap-0.5 bg-card border border-border/40 rounded-lg p-0.5">
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={si === 0}
                                                                                    onClick={() => moveSubcriterioUp(ci, si)}
                                                                                    className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                                                                                    title="Subir indicador"
                                                                                >
                                                                                    <ArrowUp className="w-3 h-3" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={si === crit.subcriterios.length - 1}
                                                                                    onClick={() => moveSubcriterioDown(ci, si)}
                                                                                    className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                                                                                    title="Bajar indicador"
                                                                                >
                                                                                    <ArrowDown className="w-3 h-3" />
                                                                                </button>
                                                                            </div>

                                                                            <span className="text-[10px] font-mono font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                                                                                {sub.codigo}
                                                                            </span>

                                                                            <span className="text-[9px] font-bold uppercase text-muted-foreground">
                                                                                Orden: #{si + 1}
                                                                            </span>
                                                                        </div>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeSubcriterio(ci, si)}
                                                                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                                            title="Eliminar indicador"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>

                                                                    <RichTextMathEditor
                                                                        value={sub.indicador}
                                                                        onChange={(val) => {
                                                                            const list = [...periodFormData.criterios];
                                                                            list[ci].subcriterios[si].indicador = val;
                                                                            setPeriodFormData({ ...periodFormData, criterios: list });
                                                                        }}
                                                                        placeholder="Descripción del indicador o conducta observable (soporta viñetas, fórmulas $...$, HTML)..."
                                                                        rows={2}
                                                                        compact
                                                                        required
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                        <button
                            type="button"
                            onClick={() => setIsPeriodModalOpen(false)}
                            className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold uppercase"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={savingPeriod}
                            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-primary/20"
                        >
                            {savingPeriod ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {editingPeriodId ? 'Actualizar Periodo y Criterios' : 'Guardar Periodo y Criterios'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
