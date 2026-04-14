'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { aulaService } from '@/services/aulaService';
import Cookies from 'js-cookie';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    ChevronLeft,
    FileText,
    MessageSquare,
    Link as LinkIcon,
    PlayCircle,
    Download,
    Lock,
    HelpCircle,
    Plus,
    Trash2,
    Edit3,
    MoreVertical,
    Settings,
    Layout,
    Youtube,
    File,
    ExternalLink,
    Clock,
    BookOpen,
    Users,
    Activity,
    Calendar,
    ArrowRight,
    Search,
    Info,
    Trophy,
    BarChart2,
    Hash,
    SlidersHorizontal,
    XCircle,
    Globe,
    Brain,
    MessagesSquare,
    ClipboardCheck,
    Youtube as YoutubeIcon,
    Image,
    FileSearch,
    TrendingUp,
    Target,
    GraduationCap,
    CalendarCheck,
    CheckCircle2,
    Printer,
    X
} from 'lucide-react';
import React from 'react';
import YouTube from 'react-youtube';
import AttendanceManager from '@/components/aula/AttendanceManager';
import AttendanceStudentView from '@/components/aula/AttendanceStudentView';
import QuestionnaireEditor from '@/components/aula/QuestionnaireEditor';
import QuizPlayer from '@/components/aula/QuizPlayer';
import { cn, getImageUrl } from '@/lib/utils';
import { useAula } from '@/contexts/AulaContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ActivityEditor from '@/components/aula/ActivityEditor';
import StudentList from '@/components/aula/StudentList';
import MathRenderer from '@/components/aula/MathRenderer';

function formatDate(date: string) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function TabButton({ active, onClick, label, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-8 h-12 rounded-[1.5rem] flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all relative overflow-hidden",
                active
                    ? "bg-white dark:bg-slate-800 text-primary shadow-lg"
                    : "text-slate-400 hover:text-slate-600"
            )}
        >
            <Icon size={16} />
            {label}
            {active && (
                <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 w-full h-1 bg-primary"
                />
            )}
        </button>
    );
}

export default function CourseDetailPage() {
    const { id: moduloId } = useParams();
    const searchParams = useSearchParams();
    const turnoId = searchParams.get('turnoId');
    const { theme, isFacilitator } = useAula();
    const isDark = theme === 'dark';
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [modulo, setModulo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeUnit, setActiveUnit] = useState(0);
    const [view, setView] = useState<'content' | 'attendance' | 'stats'>('content');
    const [selectedActivity, setSelectedActivity] = useState<any>(null);

    // Modals
    const [showActivityEditor, setShowActivityEditor] = useState(false);
    const [activityToEdit, setActivityToEdit] = useState<any>(null);
    const [newActivityUnitId, setNewActivityUnitId] = useState<string | undefined>(undefined);
    const [showUnitEditor, setShowUnitEditor] = useState(false);
    const [selectedUnitToEdit, setSelectedUnitToEdit] = useState<any>(null);
    const [showResourceModal, setShowResourceModal] = useState<string | null>(null);
    const [resourceToEdit, setResourceToEdit] = useState<any>(null);
    const [showQuizEditor, setShowQuizEditor] = useState(false);
    const [showQuizPlayer, setShowQuizPlayer] = useState(false);
    const [showStudentList, setShowStudentList] = useState(false);

    // Interceptar botón "atrás" del navegador mientras el QuizPlayer esté abierto
    useEffect(() => {
        if (!showQuizPlayer) return;
        // Añadimos un estado falso al historial para que el back "aterrice" aquí
        window.history.pushState({ quiz: true }, '');
        const handlePopState = (e: PopStateEvent) => {
            // El usuario presionó atrás: cerramos el quiz y recargamos el módulo
            setShowQuizPlayer(false);
            loadModulo();
            // Prevenimos salir de la página del curso empujando de nuevo la entrada
            // (el estado ya fue consumido por el popstate, no hace falta más)
        };
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [showQuizPlayer]);
    // Unified Items Reorder State
    const [isEditModeCombined, setIsEditModeCombined] = useState(false);
    const [combinedItems, setCombinedItems] = useState<any[]>([]);
    const [isSavingOrderCombined, setIsSavingOrderCombined] = useState(false);
    const [pdfToView, setPdfToView] = useState<any>(null);

    // Deletion states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [deleteType, setDeleteType] = useState<'activity' | 'resource'>('activity');

    // --- MANEJO DE DEEP LINKS (Notificaciones) ---
    const openQuizId = searchParams?.get('openQuiz');
    const targetView = searchParams?.get('view');

    useEffect(() => {
        if (targetView && ['content', 'attendance', 'stats'].includes(targetView)) {
            setView(targetView as any);
        }
    }, [targetView]);

    useEffect(() => {
        // Solo procedemos si el módulo ya cargó sus actividades
        if (openQuizId && modulo) {
            const allActs = (modulo.mod_unidades || []).flatMap((u: any) => u.actividades || []);
            const targetAct = allActs.find((a: any) => a.id === openQuizId);

            if (targetAct) {
                setSelectedActivity(targetAct);
                if (targetAct.tipo === 'CUESTIONARIO') {
                    if (isFacilitator) setShowQuizEditor(true);
                    else setShowQuizPlayer(true);
                }
            }
        }
    }, [openQuizId, modulo, isFacilitator]);

    // --- CÁLCULO DE PROGRESO REAL ---
    const allActivities = (modulo?.mod_unidades || []).flatMap((u: any) => u.actividades || []);
    const totalActivities = allActivities.length;
    const completedActivities = allActivities.filter((a: any) => a.userSubmitted).length;
    const calculatedProgress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
    const progressText = isFacilitator ? "Avance Curricular" : "Tu Progreso";
    const displayProgress = isFacilitator ? (totalActivities > 0 ? 100 : 0) : calculatedProgress;
    // Para facilitador, si hay actividades, su "avance" es el diseño del curso (asumimos 100% si hay contenido o calculamos según fechas)
    // Pero lo más honesto es mostrar el progreso del alumno. Si es facilitador, tal vez quiera ver el promedio de la clase?
    // Por ahora, calcularemos el progreso real para alumnos y un indicador de diseño para facilitadores.

    const handleActivityClick = (act: any) => {
        setSelectedActivity(act);
        if (act.tipo === 'CUESTIONARIO') {
            if (isFacilitator) {
                setShowQuizEditor(true);
            } else {
                setShowQuizPlayer(true);
            }
        } else if (act.tipo === 'ASISTENCIA') {
            setView('attendance');
        } else {
            router.push(`/aula/curso/${moduloId}/actividad/${act.id}`);
        }
    };

    useEffect(() => {
        if (moduloId) {
            setModulo(null); // Reset para evitar flash de datos viejos
            setIsLoading(true);
            loadModulo();
        }
    }, [moduloId]); // Simplificado: solo depende del ID. El resto se maneja en loadModulo

    const loadModulo = async (retryCount = 0) => {
        if (!moduloId) return;

        // Si authLoading es true, esperamos un poco
        if (authLoading && retryCount === 0) {
            setTimeout(() => loadModulo(0), 200);
            return;
        }

        const hasToken = !!Cookies.get('aula_token');
        if (!hasToken && !authLoading) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const data = await aulaService.getCursoDetalle(moduloId as string, turnoId || undefined);
            if (data) {
                setModulo(data);

                // Si la unidad activa ya no existe o está fuera de rango (p.ej. tras borrarla), volver a la primera o última válida
                let safeIndex = activeUnit;
                const unitsCount = data.mod_unidades?.length || 0;
                if (safeIndex >= unitsCount) {
                    safeIndex = Math.max(0, unitsCount - 1);
                    setActiveUnit(safeIndex);
                }

                const unit = data.mod_unidades?.[safeIndex] || data.mod_unidades?.[0];
                if (unit) {
                    const combined = [
                        ...(unit.actividades || []).map((a: any) => ({ ...a, itemType: 'activity' })),
                        ...(unit.recursos || []).map((r: any) => ({ ...r, itemType: 'resource' }))
                    ].sort((a, b) => (a.orden || 0) - (b.orden || 0));
                    setCombinedItems(combined);
                }
                setIsLoading(false);
            } else {
                throw new Error('Sin datos');
            }
        } catch (err: any) {
            console.error(`Error aula-load (intento ${retryCount + 1}):`, err);

            if (retryCount < 3) {
                const retryDelay = 600 * (retryCount + 1);
                setTimeout(() => loadModulo(retryCount + 1), retryDelay);
            } else {
                if (err.response?.status !== 401) {
                    toast.error('Ocurrió un error al conectar con Aula Profe');
                }
                setIsLoading(false);
            }
        }
    };

    const confirmDelete = (item: any, type: 'activity' | 'resource') => {
        // Validación para actividades: No borrar si tiene respuestas
        if (type === 'activity' && (item.respuestasCount || 0) > 0) {
            return toast.error('No se puede eliminar: Esta actividad ya tiene entregas o respuestas de estudiantes.');
        }

        setItemToDelete(item);
        setDeleteType(type);
        setShowDeleteModal(true);
    };

    const handleDeleteResource = async () => {
        if (!itemToDelete) return;
        try {
            await aulaService.eliminarRecurso(itemToDelete.id);
            toast.success('Material eliminado correctamente');
            setShowDeleteModal(false);
            loadModulo();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al eliminar recurso';
            toast.error(msg);
        } finally {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleDeleteActivity = async () => {
        if (!itemToDelete) return;
        try {
            await aulaService.eliminarActividad(itemToDelete.id);
            toast.success('Actividad eliminada correctamente');
            setShowDeleteModal(false);
            loadModulo();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al eliminar la actividad';
            toast.error(msg);
        } finally {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const processDelete = () => {
        if (deleteType === 'activity') handleDeleteActivity();
        else handleDeleteResource();
    };

    useEffect(() => {
        if (modulo?.mod_unidades?.[activeUnit]) {
            const unit = modulo.mod_unidades[activeUnit];
            const combined = [
                ...(unit.actividades || []).map((a: any) => ({ ...a, itemType: 'activity' })),
                ...(unit.recursos || []).map((r: any) => ({ ...r, itemType: 'resource' }))
            ].sort((a, b) => (a.orden || 0) - (b.orden || 0));
            setCombinedItems(combined);
        }
    }, [activeUnit, modulo]);

    const handleSaveCombinedOrder = async () => {
        setIsSavingOrderCombined(true);
        try {
            // Separamos por tipo para las APIs existentes
            const activities = combinedItems
                .filter(i => i.itemType === 'activity')
                .map((act, index) => ({ id: act.id, orden: combinedItems.indexOf(act) }));

            const resources = combinedItems
                .filter(i => i.itemType === 'resource')
                .map((res, index) => ({ id: res.id, orden: combinedItems.indexOf(res) }));

            if (activities.length > 0) await aulaService.reordenarActividades(activities);
            if (resources.length > 0) await aulaService.reordenarRecursos(resources);

            toast.success('Orden de contenido actualizado');
            setIsEditModeCombined(false);
            loadModulo();
        } catch (err) {
            toast.error('Error al guardar el nuevo orden');
        } finally {
            setIsSavingOrderCombined(false);
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 rounded-full" />
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Sincronizando Aula Profe...</p>
        </div>
    );

    if (!modulo) return (
        <div className="p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <XCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Curso no encontrado</h2>
            <button
                onClick={() => router.push('/aula')}
                className="px-8 h-12 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20"
            >
                Volver al inicio
            </button>
        </div>
    );

    const units = modulo.mod_unidades || [];
    const currentUnit = units[activeUnit];
    const participantesCount = modulo.participantes?.length || 0;

    return (
        <div key={moduloId as string} className="max-w-9xl mx-auto px-6 space-y-12 pb-32">
            {/* Premium Top Header */}
            <header className="pt-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 dark:border-slate-800/60 pb-12 relative">
                <div className="space-y-8 flex-1">
                    <button
                        onClick={() => router.push('/aula/cursos')}
                        className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-black text-[10px] uppercase tracking-[0.2em] group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Aula
                    </button>

                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl border border-primary/20">
                                {modulo.programaDos?.tipo?.nombre || 'Módulo Académico'}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="text-slate-500 font-bold text-xs capitalize flex items-center gap-2">
                                <Globe size={14} className="text-slate-400" />
                                {modulo.programaDos?.sede?.nombre || 'Sede Central'}
                            </span>
                        </div>

                        <h1 className={cn("text-3xl md:text-5xl font-black tracking-tighter mb-8 max-w-4xl leading-[0.9]", theme === 'dark' ? "text-white" : "text-slate-900")}>
                            {modulo.nombre}
                        </h1>

                        <div className="flex flex-wrap items-center gap-10">
                            {/* Premium Community Pile */}
                            <div
                                className="group relative flex items-center gap-4 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none p-2 pr-6 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:border-primary/40 cursor-pointer"
                                onClick={() => setShowStudentList(true)}
                            >
                                <div className="flex -space-x-3 ml-2">
                                    {(modulo.participantes || []).slice(0, 5).map((p: any, i: number) => (
                                        <div key={i} className="w-11 h-11 rounded-2xl border-2 border-white dark:border-slate-900 bg-slate-100 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800 transition-transform group-hover:translate-x-1 shadow-sm" style={{ zIndex: 10 - i }}>
                                            {p.persona?.imagen ? (
                                                <img src={getImageUrl(p.persona.imagen)} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black bg-primary/20 text-primary uppercase">
                                                    {p.persona?.nombre?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {participantesCount > 5 && (
                                        <div className="w-11 h-11 rounded-2xl border-2 border-white dark:border-slate-900 bg-slate-800 text-white flex items-center justify-center text-[10px] font-black z-0 shadow-sm">
                                            +{participantesCount - 5}
                                        </div>
                                    )}
                                    {participantesCount === 0 && (
                                        <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Users size={18} />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-primary transition-colors">Comunidad</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                                        {participantesCount > 0
                                            ? `${participantesCount} Participantes`
                                            : "Iniciando Grupo"}
                                    </p>
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                            </div>

                            <div className="hidden lg:block w-[1px] h-10 bg-slate-200 dark:bg-slate-800" />

                            {/* Minimal Progress */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-baseline justify-between w-48">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{progressText}</span>
                                    <span className="text-xs font-black" style={{ color: 'var(--aula-primary)' }}>{displayProgress}%</span>
                                </div>
                                <div className="w-48 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${displayProgress}%` }}
                                        className="h-full rounded-full shadow-lg"
                                        style={{ backgroundColor: 'var(--aula-primary)', boxShadow: `0 4px 12px var(--aula-primary)44` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pb-2">
                    {isFacilitator && (
                        <>
                            <button
                                onClick={() => setIsEditModeCombined(!isEditModeCombined)}
                                className={cn(
                                    "h-14 px-8 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl",
                                    isEditModeCombined
                                        ? "bg-amber-500 text-white hover:bg-amber-600 scale-105"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                            >
                                <Settings size={18} className={isEditModeCombined ? "animate-spin-slow" : ""} />
                                {isEditModeCombined ? "Desactivar Edición" : "Organizar Contenido"}
                            </button>
                            <button
                                onClick={() => { setSelectedUnitToEdit(null); setShowUnitEditor(true); }}
                                style={{ backgroundColor: 'var(--aula-primary)' }}
                                className="h-14 px-10 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3"
                            >
                                <Plus size={18} /> Nueva Unidad
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Premium Navigation Tabs */}
            <div className="flex gap-2 p-2 bg-slate-100/60 dark:bg-slate-900/40 rounded-[2rem] w-fit backdrop-blur-md border border-white/20">
                <TabButton active={view === 'content'} onClick={() => setView('content')} label="Contenido" icon={Layout} />
                <TabButton active={view === 'attendance'} onClick={() => setView('attendance')} label="Asistencia" icon={Calendar} />
                <TabButton active={view === 'stats'} onClick={() => setView('stats')} label={isFacilitator ? "Rendimiento" : "Calificaciones"} icon={isFacilitator ? BarChart2 : Trophy} />
            </div>

            {view === 'content' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Minimal index (TOC style) */}
                    <nav className="lg:col-span-3 space-y-8">
                        <div className="px-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Currículo</p>
                        </div>
                        <div className="space-y-1">
                            {units.map((unit: any, idx: number) => (
                                <button
                                    key={unit.id}
                                    onClick={() => setActiveUnit(idx)}
                                    className={cn(
                                        "w-full group flex items-center gap-4 p-4 rounded-2xl transition-all relative overflow-hidden",
                                        activeUnit === idx
                                            ? "bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none translate-x-1"
                                            : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 transition-all duration-500",
                                        activeUnit === idx
                                            ? "text-white shadow-lg"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                    )} style={activeUnit === idx ? { backgroundColor: 'var(--aula-primary)', boxShadow: '0 8px 16px -4px var(--aula-primary)66' } : {}}>
                                        {unit.semana}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold leading-tight line-clamp-2 text-left",
                                        activeUnit === idx ? "text-slate-900 dark:text-white" : "text-slate-500 group-hover:text-slate-700"
                                    )}>
                                        {unit.titulo}
                                    </span>
                                    {isFacilitator && (
                                        <div onClick={(e) => { e.stopPropagation(); setSelectedUnitToEdit(unit); setShowUnitEditor(true); }} className="absolute right-2 opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-primary cursor-pointer transition-all">
                                            <Edit3 size={14} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* Airy Content Flow */}
                    <main className="lg:col-span-9 max-w-4xl space-y-20">
                        <AnimatePresence mode="wait">
                            {currentUnit ? (
                                <motion.div
                                    key={currentUnit.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    className="space-y-24"
                                >
                                    {/* Unit Focus Header */}
                                    <header className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                    Semana {currentUnit.semana}
                                                </div>
                                                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                                    <Calendar size={14} />
                                                    {formatDate(currentUnit.fechaInicio)} — {formatDate(currentUnit.fechaFin)}
                                                </div>
                                            </div>
                                            {isFacilitator && (
                                                <button
                                                    onClick={() => { setSelectedUnitToEdit(currentUnit); setShowUnitEditor(true); }}
                                                    className="p-3 text-slate-300 hover:text-primary transition-colors"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h2 className={cn("text-3xl md:text-4xl font-black leading-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                                {currentUnit.titulo}
                                            </h2>
                                            {currentUnit.descripcion && (
                                                <div className="text-xl text-slate-500 font-medium leading-relaxed prose prose-xl dark:prose-invert max-w-none">
                                                    <MathRenderer text={currentUnit.descripcion} />
                                                </div>
                                            )}
                                        </div>
                                    </header>

                                    {/* Unified Content Feed: Activities + Materials mixed and reorderable */}
                                    <section className="space-y-10">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                                            <div className="flex items-center gap-4">
                                                <h3 className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>Contenido de la Unidad</h3>
                                                {isEditModeCombined && (
                                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 animate-pulse">
                                                        Modo Reordenar Mixto
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {isEditModeCombined ? (
                                                    <button
                                                        onClick={handleSaveCombinedOrder}
                                                        disabled={isSavingOrderCombined}
                                                        className="px-6 py-2 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition-all"
                                                    >
                                                        {isSavingOrderCombined ? "Guardando..." : "Guardar Orden"}
                                                    </button>
                                                ) : (
                                                    isFacilitator && (
                                                        <div className="flex items-center gap-4">
                                                            <button onClick={() => { setNewActivityUnitId(currentUnit?.id); setShowActivityEditor(true); }} className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline">+ Actividad</button>
                                                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <button onClick={() => setShowResourceModal(currentUnit.id)} className="text-amber-600 font-black text-[10px] uppercase tracking-widest hover:underline">+ Recurso</button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {isEditModeCombined ? (
                                                <Reorder.Group axis="y" values={combinedItems} onReorder={setCombinedItems} className="space-y-4">
                                                    {combinedItems.map((item) => (
                                                        <Reorder.Item key={`${item.itemType}-${item.id}`} value={item}>
                                                            <div className="relative group/item border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-1">
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 cursor-grab text-slate-300 group-hover/item:text-primary transition-colors z-20">
                                                                    <Hash size={24} />
                                                                </div>
                                                                <div className="pl-14">
                                                                    {item.itemType === 'activity' ? (
                                                                        <ActivityCard
                                                                            act={item}
                                                                            theme={theme}
                                                                            isFac={isFacilitator}
                                                                            onEdit={() => { setActivityToEdit(item); setShowActivityEditor(true); }}
                                                                            onDelete={() => confirmDelete(item, 'activity')}
                                                                        />
                                                                    ) : (
                                                                        <ResourceCard
                                                                            res={item}
                                                                            theme={theme}
                                                                            isFac={isFacilitator}
                                                                            onEdit={() => { setResourceToEdit(item); setShowResourceModal(currentUnit.id); }}
                                                                            onDelete={() => confirmDelete(item, 'resource')}
                                                                            onView={() => setPdfToView(item)}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Reorder.Item>
                                                    ))}
                                                </Reorder.Group>
                                            ) : (
                                                combinedItems.length > 0 ? (
                                                    combinedItems.map((item) => (
                                                        item.itemType === 'activity' ? (
                                                            <ActivityCard
                                                                key={item.id}
                                                                act={item}
                                                                theme={theme}
                                                                isFac={isFacilitator}
                                                                onClick={() => handleActivityClick(item)}
                                                                onEdit={() => {
                                                                    setActivityToEdit(item);
                                                                    setShowActivityEditor(true);
                                                                }}
                                                                onDelete={() => confirmDelete(item, 'activity')}
                                                            />
                                                        ) : (
                                                            <ResourceCard
                                                                key={item.id}
                                                                res={item}
                                                                theme={theme}
                                                                isFac={isFacilitator}
                                                                onEdit={() => {
                                                                    setResourceToEdit(item);
                                                                    setShowResourceModal(currentUnit.id);
                                                                }}
                                                                onDelete={() => confirmDelete(item, 'resource')}
                                                                onView={() => setPdfToView(item)}
                                                            />
                                                        )
                                                    ))
                                                ) : (
                                                    <div className="py-20 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                                                        <p className="text-slate-400 text-sm font-medium">No hay contenido todavía en esta unidad.</p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </section>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-40 flex flex-col items-center justify-center text-center space-y-8"
                                >
                                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-200">
                                        <BookOpen size={48} />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className={cn("text-2xl font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                            {units.length === 0 ? "Comenzando pronto" : "Selecciona una Unidad"}
                                        </h3>
                                        <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                                            {units.length === 0
                                                ? (isFacilitator ? "Todavía no has creado contenido para Aula Profe." : "Estamos preparando el material para este curso.")
                                                : "Explora el currículo en el lateral izquierdo para ver el contenido."}
                                        </p>
                                    </div>
                                    {isFacilitator && units.length === 0 && (
                                        <button
                                            onClick={() => setShowUnitEditor(true)}
                                            style={{ backgroundColor: 'var(--aula-primary)' }}
                                            className="px-8 h-12 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                                        >
                                            <Plus size={16} className="inline mr-2" /> Crear Primera Unidad
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            )}

            {view === 'attendance' && (
                <div className="mt-10">
                    {isFacilitator ? (
                        <AttendanceManager moduloId={moduloId as string} theme={theme} moduloData={modulo} turnoId={turnoId || undefined} />
                    ) : (
                        <AttendanceStudentView moduloId={moduloId as string} theme={theme} />
                    )}
                </div>
            )}

            {view === 'stats' && (
                <div className="mt-10 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {isFacilitator ? (
                        <>
                            <header className="flex justify-between items-end">
                                <div className="space-y-2">
                                    <h2 className={cn("text-3xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                        Rendimiento del <span style={{ color: 'var(--aula-primary)' }}>Módulo</span>
                                    </h2>
                                    <p className="text-slate-500 font-medium">Estadísticas detalladas y progreso de aprendizaje.</p>
                                </div>
                                <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-[9px] font-black uppercase tracking-widest text-primary">Vista General</div>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Unidades', value: units.length, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                    { label: 'Actividades', value: units.reduce((s: number, u: any) => s + (u.actividades?.length || 0), 0), icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                    { label: 'Recursos', value: units.reduce((s: number, u: any) => s + (u.recursos?.length || 0), 0), icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                    { label: 'Estudiantes', value: modulo?.studentCount || (modulo.participantes?.length || 0), icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                ].map((stat, i) => (
                                    <div key={i} className={cn("p-8 rounded-[2.5rem] border transition-all hover:scale-[1.02] cursor-default", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/40")}>
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", stat.bg, stat.color)}>
                                            <stat.icon size={28} />
                                        </div>
                                        <p className="text-4xl font-black mb-1">{stat.value}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            <FacilitatorGradesReport
                                moduloId={moduloId as string}
                                turnoId={modulo?.currentTurnoId || turnoId || undefined}
                                theme={theme}
                                moduloNombre={modulo.nombre}
                            />
                        </>
                    ) : (
                        <StudentGradesDetailed moduloId={moduloId as string} theme={theme} />
                    )}
                </div>
            )}

            {/* Modals Selection */}
            <AnimatePresence>
                {showActivityEditor && (
                    <ActivityEditor
                        moduloId={moduloId as string}
                        theme={theme}
                        activityToEdit={activityToEdit}
                        turnoId={turnoId || undefined}
                        initialUnitId={activityToEdit ? activityToEdit.unidadId : newActivityUnitId}
                        onClose={() => {
                            setShowActivityEditor(false);
                            setActivityToEdit(null);
                            setNewActivityUnitId(undefined);
                        }}
                        onSuccess={() => {
                            setShowActivityEditor(false);
                            setActivityToEdit(null);
                            setNewActivityUnitId(undefined);
                            loadModulo();
                        }}
                    />
                )}
                {showResourceModal && (
                    <ResourceModal
                        unitId={showResourceModal}
                        theme={theme}
                        resourceToEdit={resourceToEdit}
                        onClose={() => {
                            setShowResourceModal(null);
                            setResourceToEdit(null);
                        }}
                        onSuccess={() => {
                            setShowResourceModal(null);
                            setResourceToEdit(null);
                            loadModulo();
                        }}
                    />
                )}
                {showUnitEditor && (
                    <UnitModal
                        moduloId={moduloId as string}
                        theme={theme}
                        unit={selectedUnitToEdit}
                        turnoId={turnoId || undefined}
                        unitsCount={units.length}
                        onClose={() => { setShowUnitEditor(false); setSelectedUnitToEdit(null); }}
                        onSuccess={() => {
                            setShowUnitEditor(false);
                            setSelectedUnitToEdit(null);
                            setActiveUnit(0);
                            loadModulo();
                        }}
                    />
                )}
                {showQuizEditor && selectedActivity && (
                    <QuestionnaireEditor
                        actividadId={selectedActivity.id}
                        actividadTitulo={selectedActivity.titulo}
                        actividadPuntajeMax={selectedActivity.puntajeMax}
                        theme={theme}
                        onClose={() => { setShowQuizEditor(false); loadModulo(); }}
                    />
                )}
                {showQuizPlayer && selectedActivity && (
                    <QuizPlayer
                        actividadId={selectedActivity.id}
                        theme={theme}
                        onClose={() => { setShowQuizPlayer(false); loadModulo(); }}
                    />
                )}
                {showStudentList && (
                    <StudentList
                        moduloId={moduloId as string}
                        turnoId={modulo.currentTurnoId}
                        onClose={() => setShowStudentList(false)}
                        theme={theme}
                        moduloNombre={modulo?.nombre || modulo?.moduloNombre}
                    />
                )}
                {pdfToView && (
                    <PdfViewerModal
                        resource={pdfToView}
                        theme={theme}
                        onClose={() => setPdfToView(null)}
                    />
                )}
            </AnimatePresence>

            {/* Modal de Confirmación de Eliminación - Ubicación Final Segura */}
            <AnimatePresence>
                {showDeleteModal && itemToDelete && (
                    <DeleteConfirmModal
                        key={`delete-${itemToDelete.id}`}
                        item={itemToDelete}
                        type={deleteType}
                        onConfirm={processDelete}
                        onClose={() => {
                            setShowDeleteModal(false);
                            setItemToDelete(null);
                        }}
                        theme={theme}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

function ActivityCard({ act, theme, isFac, onClick, onEdit, onDelete, className }: any) {
    const info = getActTypeInfoPremium(act.tipo);

    // ─── ASISTENCIA: tarjeta compacta especial ───────────────────────────
    if (act.tipo === 'ASISTENCIA') {
        const isPresencial = act.asistencia?.esPresencial ?? act.mod_asi_presencial ?? act.esPresencial ?? true;
        return (
            <motion.div
                whileHover={{ x: 2 }}
                onClick={onClick}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 cursor-pointer group",
                    theme === 'dark'
                        ? "bg-slate-900/30 border-slate-800/50 hover:border-indigo-500/30"
                        : "bg-white border-slate-100 hover:border-indigo-200 shadow-sm",
                    className
                )}
            >
                {/* Icon */}
                <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6",
                    info.bg, info.color
                )}>
                    <info.icon size={16} strokeWidth={1.8} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold truncate leading-tight", theme === 'dark' ? "text-slate-200" : "text-slate-800")}>
                        {act.titulo}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">{formatDate(act.fechaInicio)}</span>
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                            isPresencial
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-indigo-500/10 text-indigo-600"
                        )}>
                            {isPresencial ? '● Presencial' : '● Virtual'}
                        </span>
                    </div>
                </div>

                {/* Fac actions */}
                {isFac && (
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                            <Edit3 size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all">
                            <Trash2 size={13} />
                        </button>
                    </div>
                )}
                <ChevronLeft size={14} className="rotate-180 text-slate-300 shrink-0" />
            </motion.div>
        );
    }

    // ─── RESTO DE ACTIVIDADES: tarjeta completa ───────────────────────────
    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={onClick}
            className={cn(
                "p-4 md:p-5 rounded-[2rem] border transition-all duration-500 cursor-pointer flex items-center gap-5 relative group overflow-hidden",
                theme === 'dark'
                    ? cn("bg-slate-900/40 border-slate-800/60", info.border)
                    : cn("bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)]", info.border),
                className
            )}
        >
            <div
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-6 duration-500 shrink-0")}
                style={{ backgroundColor: info.bgHex || 'var(--aula-primary)' }}
            >
                <info.icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-all"
                            style={{ backgroundColor: info.bgHex || 'var(--aula-primary)' }}>
                            {info.label}
                        </span>
                        {act.esCalificable && (
                            <span className="px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                Evaluativo
                            </span>
                        )}
                        {act.categoria && (
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">
                                • {act.categoria.config?.nombre || act.categoria.nombre}
                            </span>
                        )}
                    </div>
                    <h4 className={cn("text-lg font-black tracking-tight leading-tight truncate", theme === 'dark' ? "text-white" : "text-slate-800")}>
                        {act.titulo}
                    </h4>
                </div>

                <div className="text-slate-500 text-sm font-medium line-clamp-1 mt-1 opacity-80 italic prose prose-sm dark:prose-invert max-w-none">
                    <MathRenderer text={act.instrucciones || 'Haga clic para ingresar a la actividad académica.'} />
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2">
                    {/* Fecha de Rango (Solo se muestra si NO ha entregado para incentivar el orden) */}
                    {!act.userSubmitted && (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 px-2 py-1 rounded-lg border border-slate-100/50 dark:border-slate-800/50">
                            <Calendar size={10} className="text-primary opacity-70" />
                            <span className="opacity-80 tracking-tight">{formatDate(act.fechaInicio)} — {formatDate(act.fechaFin)}</span>
                        </div>
                    )}

                    {act.esCalificable && !act.userSubmitted && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black px-2 py-1 rounded-lg bg-amber-500/5 text-amber-600 border border-amber-500/10 shadow-sm transition-all">
                            <Trophy size={10} className="text-amber-500" />
                            <span>{act.puntajeMax} <span className="text-[7px] opacity-60 uppercase">PTS</span></span>
                        </div>
                    )}

                    {/* Estado de Entrega o Countdown */}
                    {isFac ? (
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                                <Users size={10} className="text-primary opacity-60" />
                                {act.respuestasCount || 0} {act.tipo === 'CUESTIONARIO' ? 'Intentos' : 'Entregas'}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {act.userSubmitted ? (
                                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                    <CheckCircle2 size={12} />
                                    <span>{act.isGraded ? `${act.userGrade}/${act.puntajeMax} PTS` : 'Entregado'}</span>
                                </div>
                            ) : (
                                (() => {
                                    if (!act.fechaFin) return null;
                                    const now = new Date();
                                    const end = new Date(act.fechaFin);
                                    const diffMs = end.getTime() - now.getTime();
                                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

                                    if (diffMs < 0) return (
                                        <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-transparent">
                                            <Lock size={10} /> <span>Cerrado</span>
                                        </div>
                                    );

                                    if (diffHours < 24) return (
                                        <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse shadow-sm shadow-rose-500/10">
                                            <Clock size={12} className="text-rose-500" />
                                            <span>Menos de 24h</span>
                                        </div>
                                    );

                                    return (
                                        <div className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm shadow-primary/5">
                                            <Clock size={12} />
                                            <span>Faltan {diffDays} {diffDays === 1 ? 'día' : 'días'}</span>
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isFac && (
                <div className="flex items-center gap-1.5 pointer-events-auto relative z-30 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm">
                        <Edit3 size={15} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                        <Trash2 size={15} />
                    </button>
                </div>
            )}
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 transition-all shrink-0 ml-auto md:ml-0",
                act.tipo === 'FORO' ? "group-hover:bg-primary" :
                    act.tipo === 'TAREA' ? "group-hover:bg-amber-500" :
                        act.tipo === 'CUESTIONARIO' ? "group-hover:bg-violet-500" : "group-hover:bg-primary", "group-hover:text-white")}>
                <ChevronLeft size={16} className="rotate-180" />
            </div>
        </motion.div>
    );

}



function PdfViewerModal({ resource, theme, onClose }: any) {
    const isDrive = resource.url.includes('drive.google.com');
    const isImage = resource.tipo === 'IMAGEN' || /\.(jpg|jpeg|png|gif|webp)$/i.test(resource.url) || resource.url.includes('image');
    const info = getActTypeInfoPremium(resource.tipo);

    let embedUrl = resource.url;

    if (isDrive) {
        if (resource.url.includes('/view')) {
            embedUrl = resource.url.replace('/view', '/preview');
        } else if (resource.url.includes('id=')) {
            const idMatch = resource.url.match(/id=([^&]+)/);
            if (idMatch) embedUrl = `https://drive.google.com/file/d/${idMatch[1]}/preview`;
        }
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={cn("w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border", theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-200")}
            >
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg relative overflow-hidden"
                            style={{ backgroundColor: info.bgHex }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
                            <info.icon size={24} className="relative z-10 text-white drop-shadow-sm" />
                        </div>
                        <div>
                            <h3 className={cn("text-lg font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>{resource.titulo}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isImage ? 'Previsualización de Material Visual' : 'Previsualización de Documento'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.open(resource.url, '_blank')}
                            className="px-6 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                        >
                            Abrir en Nueva Ventana
                        </button>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center">
                            <XCircle size={24} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden p-8">
                    {isImage ? (
                        <div className="relative w-full h-full flex items-center justify-center rounded-[2rem] overflow-hidden bg-slate-100/30 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800/50">
                            <img
                                src={resource.url}
                                className="max-w-[85%] max-h-[85%] object-contain shadow-2xl rounded-xl ring-8 ring-white/10"
                                alt={resource.titulo}
                            />
                        </div>
                    ) : (
                        <iframe
                            src={embedUrl}
                            className="w-full h-full border-none rounded-xl"
                            allow="autoplay text-rendering"
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function ResourceCard({ res, theme, isFac, onDelete, onEdit, onView, className }: any) {
    const info = getActTypeInfoPremium(res.tipo);
    const [showVideo, setShowVideo] = useState(false);

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url?.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = (res.tipo === 'VIDEO' || res.tipo === 'YOUTUBE') ? getYouTubeId(res.url) : null;
    const isPdf = res.tipo === 'PDF' || res.url?.toLowerCase().endsWith('.pdf') || res.url?.includes('drive.google.com');

    // ─── DISEÑO PARA TÍTULOS (SEPARADORES CREATIVOS) ───
    if (res.tipo === 'TITULO') {
        return (
            <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 py-3 mt-4 group/title pointer-events-none">
                <div className="relative shrink-0 flex items-center justify-center">
                    <div className="w-1.5 h-5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]" style={{ backgroundColor: 'var(--aula-primary)' }} />
                    <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse" style={{ backgroundColor: 'var(--aula-primary)' }} />
                </div>
                <div className="flex flex-col">
                    <h3 className={cn("text-base font-black uppercase tracking-[0.1em] transition-colors", theme === 'dark' ? "text-white" : "text-slate-900")}>
                        {res.titulo}
                    </h3>
                    {res.descripcion && (
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-60">
                            {res.descripcion}
                        </p>
                    )}
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-100 to-transparent dark:from-slate-800 dark:via-slate-900 dark:to-transparent" />

                {/* Botones para el Fac (estos sí necesitan eventos) */}
                {isFac && (
                    <div className="flex gap-2 pointer-events-auto ml-4">
                        <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary flex items-center justify-center transition-all bg-opacity-50 backdrop-blur-sm"><Edit3 size={12} /></button>
                        <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"><Trash2 size={12} /></button>
                    </div>
                )}
            </motion.div>
        );
    }

    // ─── DISEÑO PARA RECURSOS MEJORADO (MODERN & PREMIUM) ───
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, scale: 1.002 }}
            className={cn(
                "group relative rounded-2xl border transition-all duration-300 overflow-hidden",
                theme === 'dark'
                    ? "bg-[#0f172a]/40 border-slate-800/60 hover:border-primary/30 hover:bg-slate-900/40 text-slate-100"
                    : "bg-white border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgb(0,0,0,0.05)] text-slate-800",
                showVideo && "ring-2 ring-primary/10 border-primary/30 shadow-lg"
            )}
        >
            <div className="p-3 md:p-4 flex items-center gap-4 w-full relative">
                {/* Visual Accent */}
                <div className={cn("absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity", info.bg)} />

                {/* Icon Column */}
                <div className="shrink-0">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:rotate-6 shadow-sm",
                        info.bg, info.color
                    )}>
                        <info.icon size={20} strokeWidth={1.7} />
                    </div>
                </div>

                {/* Content Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5 cursor-pointer" onClick={() => youtubeId ? setShowVideo(!showVideo) : (onView ? onView() : window.open(res.url, '_blank'))}>
                    <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded-lg text-[6px] font-black uppercase tracking-widest shadow-sm", info.bg, info.color)}>
                            {info.label}
                        </span>
                        {res.url?.includes('drive.google.com') && (
                            <span className="px-2 py-0.5 rounded-lg text-[6px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 border border-blue-500/10">
                                Google Drive
                            </span>
                        )}
                    </div>
                    <h5 className={cn(
                        "text-sm md:text-base font-bold tracking-tight leading-tight truncate",
                        theme === 'dark' ? "text-white group-hover:text-primary" : "text-black group-hover:text-primary"
                    )}>
                        {res.titulo}
                    </h5>
                    {res.descripcion && (
                        <div className={cn("text-[11px] font-medium line-clamp-1 opacity-70 italic prose prose-sm dark:prose-invert max-w-none", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                            <MathRenderer text={res.descripcion} />
                        </div>
                    )}
                </div>

                {/* Actions Panel */}
                <div className="flex items-center gap-2 shrink-0 justify-end">
                    {/* Primary Action */}
                    {youtubeId ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowVideo(!showVideo); }}
                            className={cn(
                                "h-9 px-4 rounded-xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest shadow-md",
                                showVideo
                                    ? "bg-rose-500 text-white"
                                    : "bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white"
                            )}
                        >
                            <PlayCircle size={14} /> {showVideo ? 'Cerrar' : 'Ver Video'}
                        </button>
                    ) : (isPdf || res.tipo === 'IMAGEN') ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onView(); }}
                            className="h-9 px-4 rounded-xl bg-primary text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest shadow-lg shadow-primary/20"
                        >
                            <FileSearch size={14} /> Abrir
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); window.open(res.url, '_blank'); }}
                            className="h-9 px-4 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest"
                        >
                            <ExternalLink size={14} /> Link
                        </button>
                    )}

                    {/* Admin Actions */}
                    {isFac && (
                        <div className="flex items-center gap-1.5 ml-1 border-l border-slate-100 dark:border-slate-800/50 pl-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center shadow-sm"
                            >
                                <Edit3 size={15} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all flex items-center justify-center shadow-sm"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Inline YouTube Player Improved */}
            <AnimatePresence>
                {showVideo && youtubeId && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="w-full bg-black relative"
                    >
                        <div className="absolute top-4 right-4 z-20">
                            <button onClick={() => setShowVideo(false)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="relative aspect-video w-full overflow-hidden">
                            <YouTube
                                videoId={youtubeId}
                                className="absolute inset-0 w-full h-full"
                                opts={{
                                    width: '100%',
                                    height: '100%',
                                    playerVars: {
                                        autoplay: 1,
                                        modestbranding: 1,
                                        rel: 0,
                                        showinfo: 0,
                                        iv_load_policy: 3
                                    },
                                }}
                            />
                        </div>
                        <div className="bg-slate-950 p-4 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">En reproducción</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{res.titulo}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Video Indicator Line for Slim */}
            {(res.tipo === 'VIDEO' || res.tipo === 'YOUTUBE') && !showVideo && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-red-500/50 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </motion.div>
    );
}

function ResourceModal({ unitId, theme, onClose, onSuccess, resourceToEdit }: any) {
    const isEdit = !!resourceToEdit;
    const [form, setForm] = useState({
        titulo: resourceToEdit?.titulo || '',
        tipo: resourceToEdit?.tipo || 'PDF',
        url: resourceToEdit?.url || '',
        descripcion: resourceToEdit?.descripcion || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!form.titulo) return toast.error('El título es requerido');
        if (form.tipo !== 'TITULO' && !form.url) return toast.error('La URL es requerida para este tipo de recurso');

        setLoading(true);
        try {
            if (isEdit) {
                await aulaService.actualizarRecurso(resourceToEdit.id, form);
                toast.success('Recurso actualizado');
            } else {
                await aulaService.crearRecurso({ ...form, unidadId: unitId });
                toast.success('Recurso añadido');
            }
            onSuccess();
        } catch (err) {
            toast.error(isEdit ? 'Error al actualizar recurso' : 'Error al crear recurso');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("w-full max-w-lg p-10 rounded-[3rem] shadow-2xl space-y-8", theme === 'dark' ? "bg-slate-900" : "bg-white")}>
                <h3 className={cn("text-3xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>
                    {isEdit ? 'Editar' : 'Nuevo'} <span style={{ color: 'var(--aula-primary)' }}>Recurso</span>
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Título del Material</label>
                        <input type="text" placeholder="Ej: Lectura Obligatoria Semana 1" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className={cn("w-full h-14 px-6 rounded-2xl border-2 font-bold text-sm", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100")} />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo de Recurso</label>
                        <div className={cn("grid grid-cols-3 gap-3", theme === 'dark' ? "text-white" : "text-slate-800")}>
                            {[
                                { t: 'PDF', i: FileText },
                                { t: 'VIDEO', i: PlayCircle },
                                { t: 'YOUTUBE', i: YoutubeIcon },
                                { t: 'LINK', i: LinkIcon },
                                { t: 'IMAGEN', i: File },
                                { t: 'TITULO', i: Hash }
                            ].map(({ t, i: Icon }) => (
                                <button
                                    key={t}
                                    onClick={() => setForm({ ...form, tipo: t, url: t === 'TITULO' ? '' : form.url })}
                                    className={cn(
                                        "h-16 rounded-2xl border-2 font-black text-[9px] uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-all",
                                        form.tipo === t
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-400"
                                    )}
                                >
                                    <Icon size={16} />
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.tipo !== 'TITULO' && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">URL / Enlace</label>
                            <input type="text" placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className={cn("w-full h-14 px-6 rounded-2xl border-2 font-bold text-sm", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100")} />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Descripción del Material</label>
                        <textarea placeholder="Explica de qué trata este recurso..." value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className={cn("w-full min-h-[100px] p-6 rounded-2xl border-2 font-bold text-sm resize-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100")} />
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-2 h-14 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 bg-primary" style={{ backgroundColor: 'var(--aula-primary)' }}>
                        {loading ? 'Procesando...' : isEdit ? 'Guardar Cambios' : 'Añadir Recurso'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function UnitModal({ moduloId, theme, unit, onClose, onSuccess, turnoId, unitsCount = 0 }: any) {
    const isEdit = !!unit;
    const [showDeletePrompt, setShowDeletePrompt] = useState(false);
    const [form, setForm] = useState({
        titulo: unit?.titulo || '',
        descripcion: unit?.descripcion || '',
        semana: unit?.semana || (unitsCount + 1),
        orden: unit?.orden || (unitsCount + 1),
        fechaInicio: unit?.fechaInicio ? new Date(unit.fechaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        fechaFin: unit?.fechaFin ? new Date(unit.fechaFin).toISOString().split('T')[0] : new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        turnoId: unit?.turnoId || turnoId || null
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!form.titulo) return toast.error('Título requerido');
        setLoading(true);
        try {
            if (isEdit) {
                await aulaService.actualizarUnidad(moduloId, unit.id, form);
                toast.success('Unidad actualizada');
            } else {
                await aulaService.crearUnidad(moduloId, form);
                toast.success('Unidad creada');
            }
            onSuccess();
        } catch (err) {
            toast.error('Error al procesar unidad');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if ((unit.actividades?.length || 0) > 0 || (unit.recursos?.length || 0) > 0) {
            return toast.error('No se puede eliminar: Esta unidad tiene contenido (actividades o materiales). Elimínalos primero.');
        }

        setLoading(true);
        try {
            await aulaService.eliminarUnidad(moduloId, unit.id);
            toast.success('Unidad eliminada');
            onSuccess();
        } catch (err) {
            toast.error('Error al eliminar unidad');
        } finally {
            setLoading(false);
            setShowDeletePrompt(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("w-full max-w-2xl p-10 rounded-[3.5rem] shadow-2xl space-y-8 my-8 border", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--aula-primary)]" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Administrador de Contenido</p>
                        </div>
                        <h3 className={cn("text-3xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>
                            {isEdit ? 'Editar' : 'Nueva'} <span className="text-[var(--aula-primary)]">Unidad</span>
                        </h3>
                    </div>
                    {isEdit && (
                        <button onClick={() => setShowDeletePrompt(true)} className="p-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[1.5rem] transition-all border border-transparent hover:border-rose-100">
                            <Trash2 size={24} />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Título de la Unidad</label>
                        <input
                            type="text"
                            placeholder="Ej: Semana 1: Introducción a la materia"
                            value={form.titulo}
                            onChange={e => setForm({ ...form, titulo: e.target.value })}
                            className={cn("w-full h-14 px-6 rounded-2xl border-2 font-bold text-sm focus:ring-0 transition-all",
                                theme === 'dark'
                                    ? "bg-slate-800 border-slate-700 text-white focus:border-[var(--aula-primary)]"
                                    : "bg-slate-50 border-slate-100 focus:border-[var(--aula-primary)]")}
                        />
                    </div>

                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Descripción del Contenido</label>
                        <textarea
                            placeholder="Escribe una breve guía de lo que se verá esta semana..."
                            value={form.descripcion}
                            onChange={e => setForm({ ...form, descripcion: e.target.value })}
                            className={cn("w-full h-36 p-6 rounded-2xl border-2 font-bold text-sm resize-none focus:ring-0 transition-all",
                                theme === 'dark'
                                    ? "bg-slate-800 border-slate-700 text-white focus:border-[var(--aula-primary)]"
                                    : "bg-slate-50 border-slate-100 focus:border-[var(--aula-primary)]")}
                        />
                    </div>

                    {isEdit && (
                        <>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">N° de Semana</label>
                                <div className="relative">
                                    <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="number"
                                        value={form.semana}
                                        onChange={e => setForm({ ...form, semana: parseInt(e.target.value) })}
                                        className={cn("w-full h-14 pl-12 pr-6 rounded-2xl border-2 font-bold text-sm focus:ring-0",
                                            theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100")}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Fecha de Inicio</label>
                        <input
                            type="date"
                            value={form.fechaInicio}
                            onChange={e => setForm({ ...form, fechaInicio: e.target.value })}
                            className={cn("w-full h-14 px-6 rounded-2xl border-2 font-bold text-sm focus:ring-0",
                                theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100")}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Fecha de Finalización</label>
                        <input
                            type="date"
                            value={form.fechaFin}
                            onChange={e => setForm({ ...form, fechaFin: e.target.value })}
                            className={cn("w-full h-14 px-6 rounded-2xl border-2 font-bold text-sm focus:ring-0",
                                theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100")}
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button onClick={onClose} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancelar</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-2 h-14 bg-[var(--aula-primary)] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 px-12 hover:scale-[1.02] active:scale-95 transition-all">
                        {loading ? 'Procesando...' : isEdit ? 'Guardar Cambios' : 'Crear Unidad'}
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {showDeletePrompt && (
                    <DeleteConfirmModal
                        item={unit}
                        type="unidad"
                        onConfirm={handleDelete}
                        onClose={() => setShowDeletePrompt(false)}
                        theme={theme}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function StudentGradesDetailed({ moduloId, theme }: { moduloId: string; theme: string }) {
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isDark = theme === 'dark';

    useEffect(() => {
        const load = async () => {
            try {
                const data = await aulaService.getMisCalificaciones(moduloId);
                setReport(data);
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        load();
    }, [moduloId]);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Calculando Notas...</p>
        </div>
    );

    if (!report || (report.categorias || []).length === 0) return (
        <div className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs">Sin registros de calificación disponibles</div>
    );

    const total = parseFloat(report.totalAcumulado) || 0;
    const notaReprobacion = parseFloat(report.notaReprobacion) || 60;
    const aprobado = total >= notaReprobacion;

    return (
        <div className="space-y-12">
            <header className={cn(
                "p-10 rounded-[3rem] border flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden",
                isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-100 shadow-xl"
            )}>
                <div className="relative z-10 space-y-4 flex-1 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="px-4 py-1.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-xl border border-primary/20">Estado Académico</div>
                        <div className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl border",
                            aprobado ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20")}>
                            {aprobado ? 'Aprobado' : 'En Proceso'}
                        </div>
                    </div>
                    <h2 className={cn("text-3xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Tu Desempeño Global</h2>
                    <p className="text-slate-400 font-medium text-sm">Puntaje calculado según la configuración de calificación del programa.</p>
                </div>
                <div className={cn("relative z-10 w-full md:w-56 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-2xl transition-transform hover:scale-105",
                    aprobado ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Total Final</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black">{total.toFixed(1)}</span>
                        <span className="text-lg font-bold opacity-60">/ {report.notaMaxima || 100}</span>
                    </div>
                </div>
            </header>

            {/* Sistema de Ponderación Explicativo */}
            <div className={cn("p-8 rounded-[2.5rem] border", isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-100")}>
                <div className="flex items-center gap-2 mb-6 text-primary">
                    <Info size={14} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Configuración Institucional (100 Puntos)</span>
                </div>
                <div className="flex flex-wrap gap-6">
                    {report.categorias.map((cat: any, idx: number) => (
                        <div key={idx} className={cn(
                            "flex-1 min-w-[140px] p-6 rounded-[2rem] border shadow-sm flex flex-col items-center text-center relative overflow-hidden transition-all hover:scale-105 group",
                            cat.esEvalFinal ? "bg-primary/10 border-primary/30 ring-4 ring-primary/5" : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800"
                        )}>
                            {cat.esEvalFinal && <Trophy size={12} className="absolute top-4 right-4 text-primary animate-pulse" />}
                            <p className={cn("text-3xl font-black mb-1", cat.esEvalFinal ? "text-primary" : (isDark ? "text-white" : "text-slate-900"))}>{cat.ponderacion}%</p>
                            <p className={cn("text-[9px] font-black uppercase tracking-widest", cat.esEvalFinal ? "text-primary/70" : "text-slate-400")}>{cat.nombre}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {report.categorias.map((cat: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className={cn("p-10 rounded-[3rem] border transition-all hover:bg-slate-50 dark:hover:bg-slate-800/20 relative",
                            cat.esEvalFinal ? "bg-primary/[0.02] border-primary/30 ring-4 ring-primary/5 shadow-2xl shadow-primary/10" : (isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"))}>
                        {cat.esEvalFinal && (
                            <div className="absolute top-0 right-10 -translate-y-1/2 flex items-center gap-2 px-5 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-xl">
                                <Trophy size={12} />
                                Componente de Evaluación Final
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <h3 className={cn("text-lg font-black uppercase tracking-tight", isDark ? "text-white" : "text-slate-800")}>{cat.nombre}</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Peso: {cat.ponderacion}% • Aporte: {cat.aporteNota} pts</p>
                            </div>
                            <div className={cn("w-12 h-12 rounded-2xl flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800")}>
                                <span className="text-lg font-black">{Math.round(cat.totalCategoria)}</span>
                                <span className="text-[7px] font-black opacity-50 uppercase leading-none mt-0.5">Nota</span>
                            </div>
                        </div>
                        <div className="space-y-5">
                            {(cat.actividades || []).map((act: any) => (
                                <div key={act.id} className="group/item space-y-2">
                                    <div className="flex justify-between items-center pr-1">
                                        <span className="text-xs font-bold text-slate-500 truncate max-w-[180px]">{act.titulo}</span>
                                        <div className="text-right flex items-baseline gap-1">
                                            <span className={cn("text-xs font-black", act.nota >= (act.puntajeMax * 0.6) ? "text-emerald-500" : "text-slate-400")}>{act.nota || '---'}</span>
                                            <span className="text-[9px] font-bold text-slate-300">/ {act.puntajeMax}</span>
                                        </div>
                                    </div>
                                    <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${act.nota ? (act.nota / act.puntajeMax * 100) : 0}%` }}
                                            className={cn("h-full rounded-full transition-colors", (act.nota / act.puntajeMax) >= 0.7 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function FacilitatorGradesReport({ moduloId, turnoId, theme }: any) {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const isDark = theme === 'dark';

    useEffect(() => {
        const load = async () => {
            try {
                const data = await aulaService.getReporteCalificaciones(moduloId, turnoId);
                setReport(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, [moduloId, turnoId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-100 dark:border-slate-800 rounded-full" />
                <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0 shadow-lg shadow-primary/20" />
            </div>
            <div className="animate-pulse flex flex-col items-center">
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Cuadro de Calificaciones</p>
                <p className="text-xs font-bold text-slate-500 mt-1">Sincronizando con el Programa Académico...</p>
            </div>
        </div>
    );

    if (!report) return null;

    const categories = report.categorias || [];
    const students = report.estudiantes || [];
    const headers = report.headers || [];
    const notaReprobacion = report.notaReprobacion || 60;

    const stats = {
        total: students.length,
        aprobados: students.filter((s: any) => s.total >= notaReprobacion).length,
        reprobados: students.filter((s: any) => s.total < notaReprobacion).length,
        promedioGeneral: students.length > 0 ? (students.reduce((acc: number, s: any) => acc + s.total, 0) / students.length).toFixed(1) : 0
    };

    // Paleta de colores para categorías (estética premium)
    const catColors = [
        { main: 'indigo', bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-500/30', gradient: 'from-indigo-500 to-indigo-400' },
        { main: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30', gradient: 'from-amber-500 to-amber-400' },
        { main: 'teal', bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-500/30', gradient: 'from-teal-500 to-teal-400' },
        { main: 'rose', bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-500/30', gradient: 'from-rose-500 to-rose-400' },
        { main: 'cyan', bg: 'bg-cyan-500/10', text: 'text-cyan-600', border: 'border-cyan-500/30', gradient: 'from-cyan-500 to-cyan-400' },
    ];

    return (
        <div className="space-y-12 pb-32">
            {/* Super Dashboard Header */}
            <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} className="relative">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
                    <div className={cn("lg:col-span-1 p-10 rounded-[3.5rem] border relative overflow-hidden flex flex-col justify-between group h-full shadow-2xl",
                        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-slate-200/50")}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-primary/10 transition-all duration-700" />
                        <div>
                            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-8 shadow-inner">
                                <TrendingUp size={32} />
                            </div>
                            <h3 className={cn("text-2xl font-black leading-tight", isDark ? "text-white" : "text-slate-900")}>Monitor de <br /><span className="text-primary italic">Resultados Académicos</span></h3>
                            <div className="flex items-center gap-2 mt-4 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl w-fit">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Sincronización v2.6 Activa</p>
                            </div>
                        </div>
                        <button onClick={() => window.print()} className="mt-12 h-14 w-full rounded-[1.5rem] bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center justify-center gap-3">
                            <Printer size={18} /> Exportar Registro Oficial
                        </button>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: 'Participantes', val: stats.total, sub: 'Inscritos en el turno', icon: Users, color: 'indigo' },
                            { label: 'Aprobados', val: stats.aprobados, sub: `Min. ${notaReprobacion} pts`, icon: CheckCircle2, color: 'emerald' },
                            { label: 'Media del Módulo', val: stats.promedioGeneral, sub: 'Rendimiento Grupal', icon: Target, color: 'primary' },
                        ].map((st, i) => (
                            <div key={i} className={cn("p-10 rounded-[3.5rem] border relative overflow-hidden group transition-all hover:-translate-y-2 hover:shadow-3xl",
                                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/30")}>
                                <div className="absolute top-6 right-10 opacity-[0.03] group-hover:opacity-10 transition-all duration-700">
                                    <st.icon size={120} />
                                </div>
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner",
                                    st.color === 'indigo' ? "bg-blue-500/10 text-blue-500" :
                                        st.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary")}>
                                    <st.icon size={24} />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{st.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h4 className={cn("text-5xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>{st.val}</h4>
                                    {st.label === 'Media del Módulo' && <span className="text-xl font-bold text-slate-400">/ 100</span>}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 flex items-center gap-2">
                                    <span className={cn("w-1.5 h-1.5 rounded-full",
                                        st.color === 'indigo' ? "bg-blue-500" : st.color === 'emerald' ? "bg-emerald-500" : "bg-primary")} />
                                    {st.sub}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Matrix Section */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cn(
                "rounded-[4.5rem] border shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden backdrop-blur-xl",
                isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/95 border-slate-100"
            )}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-primary to-emerald-500" />

                <div className="p-12 border-b border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                            </div>
                            <h3 className={cn("text-2xl font-black uppercase tracking-tight", isDark ? "text-white" : "text-slate-900")}>Registro Matriz de Calificaciones</h3>
                        </div>
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em] mt-2 block">Ordenado por jerarquía académica (mod_tcc_orden)</p>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-premium">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className={cn(isDark ? "bg-slate-800/20" : "bg-slate-50/50")}>
                                <th className="p-0 sticky left-0 z-40 bg-inherit shadow-[10px_0_30px_-15px_rgba(0,0,0,0.1)]"></th>
                                {categories.map((cat: any, i: number) => {
                                    const count = headers.filter((h: any) => h.categoriaId === cat.configId || h.categoriaNombre === cat.nombre).length;
                                    const color = catColors[i % catColors.length];
                                    return (
                                        <th key={i} colSpan={count + 1} className={cn("px-8 py-10 text-center border-l border-slate-100 dark:border-slate-800/50", color.bg)}>
                                            <div className="flex flex-col items-center gap-3">
                                                <div className={cn("px-6 py-2 rounded-2xl border font-black text-[11px] uppercase tracking-[0.15em] shadow-sm", color.bg, color.text, color.border)}>
                                                    {cat.nombre}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[16px] font-black leading-none">{cat.peso}%</span>
                                                        <span className="text-[7px] font-black uppercase opacity-40">Ponderación</span>
                                                    </div>
                                                    {cat.esEvalFinal && (
                                                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
                                                            <Trophy size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                    );
                                })}
                                <th className="sticky right-0 z-40 bg-inherit shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]"></th>
                            </tr>

                            <tr className={cn(isDark ? "bg-slate-800/40" : "bg-slate-50/80")}>
                                <th className="px-12 py-10 text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 min-w-[320px] sticky left-0 z-30 bg-inherit backdrop-blur-2xl border-b border-r border-slate-100 dark:border-slate-800/50">Listado de Participantes</th>
                                {categories.map((cat: any, ci: number) => {
                                    const color = catColors[ci % catColors.length];
                                    return (
                                        <React.Fragment key={cat.nombre}>
                                            {headers.filter((h: any) => h.categoriaId === cat.configId || h.categoriaNombre === cat.nombre).map((h: any) => (
                                                <th key={h.id} className="px-6 py-10 text-center min-w-[140px] border-l border-b border-slate-100 dark:border-slate-800/20">
                                                    <div className="flex flex-col gap-2">
                                                        <span className={cn("text-[10px] font-black leading-snug uppercase px-3", isDark ? "text-slate-300" : "text-slate-600 line-clamp-2")}>{h.titulo}</span>
                                                        <div className={cn("text-[9px] font-bold italic w-fit mx-auto px-2 py-0.5 rounded-md", color.bg, color.text)}>{h.puntajeMax} pts</div>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className={cn("px-8 py-10 text-center min-w-[220px] border-l border-b font-black text-[11px] uppercase tracking-widest shadow-inner", isDark ? "bg-slate-800/60" : "bg-slate-100/50")}>
                                                Rendimiento Parcial
                                            </th>
                                        </React.Fragment>
                                    );
                                })}
                                <th className="px-12 py-10 text-[12px] font-black uppercase tracking-[0.2em] text-primary text-center sticky right-0 z-30 bg-primary/[0.03] backdrop-blur-2xl border-l border-b border-slate-100 dark:border-slate-800/50">Puntaje Final</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {students.map((s: any, idx: number) => (
                                <motion.tr initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} key={idx} className="hover:bg-primary/[0.03] transition-all group duration-500">
                                    <td className="px-8 py-4 sticky left-0 z-20 bg-inherit backdrop-blur-2xl border-r border-slate-100 dark:border-slate-800/10 shadow-[4px_0_15px_-5px_rgba(0,0,0,0.05)]">
                                        <div className="flex flex-col gap-1 pr-6">
                                            <p className={cn("text-[13px] font-black tracking-tight truncate leading-tight", isDark ? "text-slate-100" : "text-slate-900")}>
                                                {s.nombre}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 w-20 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.total}%` }} transition={{ duration: 1 }} className={cn("h-full", s.total >= notaReprobacion ? "bg-emerald-500" : "bg-primary")} />
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 tabular-nums">{s.total} pts</span>
                                                <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded uppercase border",
                                                    s.asistencia >= 80 ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10" : "bg-primary/5 text-primary border-primary/10")}>
                                                    {s.asistencia}% Asist.
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {categories.map((cat: any, ci: number) => {
                                        const catScore = s.desglose.find((d: any) => d.nombre === cat.nombre);
                                        const catActHeaders = headers.filter((h: any) => h.categoriaId === cat.configId || h.categoriaNombre === cat.nombre);
                                        const color = catColors[ci % catColors.length];
                                        return (
                                            <React.Fragment key={cat.nombre}>
                                                {catActHeaders.map((h: any) => (
                                                    <td key={h.id} className="px-6 py-2 text-center text-[12px] font-bold text-slate-500 border-l border-slate-50 dark:border-slate-800/10 tabular-nums">
                                                        {s.scores[h.id] ?? 0}
                                                    </td>
                                                ))}
                                                <td className={cn("px-4 py-2 border-l border-slate-100 dark:border-slate-800/30", isDark ? "bg-slate-800/20" : "bg-slate-50/30")}>
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="flex items-center gap-1.5 opacity-40 text-[8px] font-black font-mono">
                                                            ({catActHeaders.map((h: any) => s.scores[h.id] ?? 0).join(',') || '0'}) / {catActHeaders.length || 1}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex flex-col items-center">
                                                                <span className={cn("text-[10px] font-black", isDark ? "text-slate-100" : "text-slate-800")}>{catScore?.promedio || 0}</span>
                                                                <span className="text-[6px] uppercase opacity-40 font-black">Prom.</span>
                                                            </div>
                                                            <div className={cn("w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1")} />
                                                            <div className="flex flex-col items-center">
                                                                <span className={cn("text-[12px] font-black", color.text)}>{catScore?.aporte || 0}</span>
                                                                <span className={cn("text-[6px] uppercase font-black opacity-60", color.text)}>Ptos</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}

                                    <td className="px-12 py-8 text-center sticky right-0 z-20 bg-primary/[0.02] backdrop-blur-2xl border-l border-slate-100 dark:border-slate-800/50 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
                                        <motion.div whileHover={{ scale: 1.1, rotate: -2 }} className={cn(
                                            "w-20 h-20 flex flex-col items-center justify-center rounded-[2rem] border-4 transition-all duration-500",
                                            parseFloat(s.total) >= notaReprobacion
                                                ? "bg-emerald-500 text-white border-emerald-100 shadow-xl shadow-emerald-500/30"
                                                : "bg-rose-500 text-white border-rose-100 shadow-xl shadow-rose-500/30"
                                        )}>
                                            <span className="text-2xl font-black">{s.total}</span>
                                            <p className="text-[7px] font-black uppercase tracking-[0.1em] opacity-80 mt-1">{parseFloat(s.total) >= notaReprobacion ? 'PROMOCIONADO' : ' REPROBADO'}</p>
                                        </motion.div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <footer className="p-16 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 p-10 opacity-5">
                        <GraduationCap size={200} />
                    </div>

                    <div className="flex flex-col md:flex-row gap-16 items-center justify-between relative z-10">
                        <div className="flex flex-wrap gap-12">
                            <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20"><CheckCircle2 size={24} /></div>
                                <div>
                                    <h5 className="text-3xl font-black">{stats.aprobados}</h5>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alumnos Aprobados</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
                                <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20"><XCircle size={24} /></div>
                                <div>
                                    <h5 className="text-3xl font-black">{stats.reprobados}</h5>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alumnos Reprobados</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-64 h-32 border-b-2 border-slate-300 dark:border-slate-700 border-dashed mb-4 flex items-end justify-center pb-4 italic text-slate-400 text-sm font-serif">
                                    Firma Electrónica
                                </div>
                                <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Validación del Facilitador</span>
                            </div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Generado automáticamente por Aula Profe AI Core</p>
                        </div>
                    </div>
                </footer>
            </motion.div>
        </div>
    );
}

function getActTypeInfoPremium(type: string) {
    const t = type.toUpperCase();
    switch (t) {
        // ─── ACTIVIDADES ───
        case 'FORO': return { icon: MessageSquare, bg: 'bg-[#0891b2]/10', color: 'text-[#0891b2]', bgHex: '#0891b2', border: 'hover:border-[#0891b2]/30', label: 'Debate' };
        case 'TAREA': return { icon: ClipboardCheck, bg: 'bg-[#059669]/10', color: 'text-[#059669]', bgHex: '#059669', border: 'hover:border-[#059669]/30', label: 'Tarea' };
        case 'CUESTIONARIO': return { icon: Brain, bg: 'bg-[#ea580c]/10', color: 'text-[#ea580c]', bgHex: '#ea580c', border: 'hover:border-[#ea580c]/30', label: 'Cuestionario' };
        case 'ASISTENCIA': return { icon: CalendarCheck, bg: 'bg-[#6366f1]/10', color: 'text-[#6366f1]', bgHex: '#6366f1', border: 'hover:border-[#6366f1]/30', label: 'Asistencia' };

        // ─── RECURSOS ───
        case 'PDF': return { icon: FileText, bg: 'bg-rose-500/10', color: 'text-rose-600', bgHex: '#e11d48', border: 'hover:border-rose-500/20', label: 'PDF' };
        case 'VIDEO':
        case 'YOUTUBE': return { icon: Youtube, bg: 'bg-red-500/10', color: 'text-red-600', bgHex: '#dc2626', border: 'hover:border-red-500/20', label: 'Video' };
        case 'LINK': return { icon: LinkIcon, bg: 'bg-blue-500/10', color: 'text-blue-600', bgHex: '#2563eb', border: 'hover:border-blue-500/20', label: 'Enlace' };
        case 'IMAGEN': return { icon: Image, bg: 'bg-emerald-500/10', color: 'text-emerald-600', bgHex: '#059669', border: 'hover:border-emerald-500/20', label: 'Imagen' };
        case 'TITULO': return { icon: Hash, bg: 'bg-slate-500/10', color: 'text-slate-600', bgHex: '#334155', border: 'hover:border-slate-500/20', label: 'Título' };

        default: return { icon: BookOpen, bg: 'bg-slate-500/10', color: 'text-slate-600', bgHex: '#475569', border: 'hover:border-slate-500/20', label: 'Material' };
    }
}

// ─── Modal de Confirmación Deletion ────────────────────────
function DeleteConfirmModal({ item, type, onConfirm, onClose, theme }: any) {
    const isActivity = type === 'activity';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={cn(
                    "max-w-sm w-full rounded-[2.5rem] p-10 text-center space-y-8 relative overflow-hidden shadow-2xl",
                    theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white"
                )}
            >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />

                <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                    <Trash2 size={40} />
                </div>

                <div className="space-y-3">
                    <h3 className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>
                        ¿Eliminar {type === 'unidad' ? 'Unidad' : (isActivity ? 'Actividad' : 'Material')}?
                    </h3>
                    <div className="space-y-2">
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            Estás a punto de eliminar:
                        </p>
                        <p className={cn("text-sm font-black px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 line-clamp-2", theme === 'dark' ? "text-white" : "text-slate-800")}>
                            {item?.titulo || 'este elemento'}
                        </p>
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/5 py-2 rounded-lg">
                            Esta acción no se puede deshacer
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                        onClick={onClose}
                        className={cn(
                            "h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
                            theme === 'dark' ? "text-slate-400" : "text-slate-500"
                        )}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="h-14 rounded-2xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all"
                    >
                        Sí, Eliminar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

