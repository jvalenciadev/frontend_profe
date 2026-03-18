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
    CheckCircle2,
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
    FileSearch,
    TrendingUp,
    Target,
    GraduationCap
} from 'lucide-react';
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
    // Unified Items Reorder State
    const [isEditModeCombined, setIsEditModeCombined] = useState(false);
    const [combinedItems, setCombinedItems] = useState<any[]>([]);
    const [isSavingOrderCombined, setIsSavingOrderCombined] = useState(false);
    const [pdfToView, setPdfToView] = useState<any>(null);

    // Deletion states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [deleteType, setDeleteType] = useState<'activity' | 'resource'>('activity');

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
                const unit = data.mod_unidades?.[activeUnit] || data.mod_unidades?.[0];
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
                    toast.error('Ocurrió un error al conectar con el aula virtual');
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
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Sincronizando Aula Virtual...</p>
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
        <div key={moduloId as string} className="max-w-7xl mx-auto px-6 space-y-12 pb-32">
            {/* Premium Top Header */}
            <header className="pt-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 dark:border-slate-800/60 pb-12 relative">
                <div className="space-y-8 flex-1">
                    <button
                        onClick={() => router.back()}
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
                <TabButton active={view === 'stats'} onClick={() => setView('stats')} label="Rendimiento" icon={BarChart2} />
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
                                                <p className="text-xl text-slate-500 font-medium leading-relaxed">
                                                    {currentUnit.descripcion}
                                                </p>
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
                                                ? (isFacilitator ? "Todavía no has creado contenido para esta aula virtual." : "Estamos preparando el material para este curso.")
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
                <div className="mt-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                            { label: 'Estudiantes', value: modulo?.studentCount || 0, icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className={cn("lg:col-span-2 p-10 rounded-[3rem] border relative overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/40")}>
                             <div className="flex items-center justify-between mb-10">
                                 <h3 className="text-xl font-black uppercase tracking-tight">Cumplimiento por Unidad</h3>
                                 <TrendingUp size={20} className="text-primary" />
                             </div>
                             <div className="space-y-6">
                                {units.map((u: any, i: number) => (
                                    <div key={u.id} className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Unidad {u.semana}: {u.titulo}</span>
                                            <span>{Math.round((i+1)*20)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(i+1)*20}%` }}
                                                transition={{ delay: 0.5 + (i*0.1), duration: 1 }}
                                                className="h-full bg-primary"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {units.length === 0 && (
                                    <div className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs">Sin datos disponibles</div>
                                )}
                             </div>
                        </div>

                        <div className={cn("p-10 rounded-[3rem] border flex flex-col items-center justify-center text-center space-y-6 bg-slate-950 text-white border-primary/20 shadow-2xl")}>
                             <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
                                <Target size={48} />
                             </div>
                             <h4 className="text-2xl font-black">Meta del Mes</h4>
                             <p className="text-sm opacity-60 font-medium">Alcanza el 90% de participación en foros para desbloquear la insignia de "Interacción Premium".</p>
                             <div className="w-full pt-6">
                                <button className="w-full h-12 rounded-2xl bg-white text-slate-950 font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Ver Recomendaciones</button>
                             </div>
                        </div>
                    </div>
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
                        onClose={() => { setShowUnitEditor(false); setSelectedUnitToEdit(null); }}
                        onSuccess={() => { setShowUnitEditor(false); setSelectedUnitToEdit(null); loadModulo(); }}
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
    const info = getActTypeInfo(act.tipo);
    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={onClick}
            className={cn(
                "p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer flex items-center gap-8 relative group overflow-hidden",
                theme === 'dark'
                    ? cn("bg-slate-900/40 border-slate-800/60", info.border)
                    : cn("bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)]", info.border),
                className
            )}
        >
            <div
                className={cn("w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:rotate-6 duration-500")}
                style={{ backgroundColor: info.bgHex || 'var(--aula-primary)' }}
            >
                <info.icon size={28} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-sm transition-all", info.bg)}>
                            {info.label}
                        </span>
                        {act.esCalificable && (
                            <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                Evaluativo
                            </span>
                        )}
                        {act.categoria && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">
                                • {act.categoria.config?.nombre || act.categoria.nombre}
                            </span>
                        )}
                    </div>
                    <h4 className={cn("text-xl md:text-2xl font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>
                        {act.titulo}
                    </h4>
                </div>

                <p className="text-slate-500 text-sm font-medium line-clamp-1 mt-1 opacity-80 italic">
                    {act.instrucciones || 'Haga clic para ingresar a la actividad académica.'}
                </p>

                <div className="flex flex-wrap items-center gap-6 mt-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 px-3 py-1.5 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                        <Calendar size={12} className="text-primary opacity-70" />
                        <span className="opacity-80 tracking-tight">{formatDate(act.fechaInicio)} — {formatDate(act.fechaFin)}</span>
                    </div>

                    {act.esCalificable && (
                        <div className="flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-xl bg-amber-500/5 text-amber-600 border border-amber-500/10 shadow-sm transition-all hover:bg-amber-500/10">
                            <Trophy size={11} className="text-amber-500" />
                            <span>{act.puntajeMax} <span className="text-[8px] opacity-60">PUNTOS MÁX.</span></span>
                        </div>
                    )}

                    {isFac ? (
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                                <Users size={12} className="text-primary opacity-60" />
                                {act.respuestasCount || 0} {act.tipo === 'CUESTIONARIO' ? 'Intentos' : 'Entregas'}
                            </div>
                            {act.tipo === 'CUESTIONARIO' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                                    className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                                >
                                    Ver Resultados
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2",
                            act.isGraded
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : act.userSubmitted
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent"
                        )}>
                            {act.userSubmitted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {act.userSubmitted ? (act.isGraded ? `Calificado: ${act.userGrade}/${act.puntajeMax}` : 'Entregado') : 'Sin entregar'}
                        </div>
                    )}
                </div>
            </div>

                {isFac && (
                    <div className="flex items-center gap-2 pointer-events-auto relative z-30">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                            <Edit3 size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 transition-all",
                    act.tipo === 'FORO' ? "group-hover:bg-primary" :
                        act.tipo === 'TAREA' ? "group-hover:bg-amber-500" :
                            act.tipo === 'CUESTIONARIO' ? "group-hover:bg-violet-500" : "group-hover:bg-primary", "group-hover:text-white")}>
                    <ChevronLeft size={20} className="rotate-180" />
                </div>
        </motion.div>
    );
}

const getResTypeInfoPremium = (tipo: string) => {
    switch (tipo) {
        // 📙 PDF: Ámbar Académico — máximo contraste y visibilidad
        case 'PDF': return { icon: FileText, label: 'Documento PDF', bg: 'bg-amber-500/15 text-amber-600', border: 'border-amber-200', bgHex: '#d97706' };
        // 🎬 VIDEO: Violeta Real — dinamismo y profundidad
        case 'VIDEO': return { icon: PlayCircle, label: 'Clase en Video', bg: 'bg-violet-500/15 text-violet-600', border: 'border-violet-200', bgHex: '#7c3aed' };
        // 🌐 LINK: Azul Eléctrico — conectividad global
        case 'LINK': return { icon: Globe, label: 'Enlace Externo', bg: 'bg-blue-500/15 text-blue-600', border: 'border-blue-200', bgHex: '#2563eb' };
        // 🖼️ IMAGEN: Esmeralda — visualización clara
        case 'IMAGEN': return { icon: File, label: 'Recurso Visual', bg: 'bg-emerald-500/15 text-emerald-600', border: 'border-emerald-200', bgHex: '#059669' };
        default: return { icon: File, label: 'Material Extra', bg: 'bg-slate-500/15 text-slate-600', border: 'border-slate-200', bgHex: '#475569' };
    }
};

function PdfViewerModal({ resource, theme, onClose }: any) {
    const isDrive = resource.url.includes('drive.google.com');
    const isImage = resource.tipo === 'IMAGEN' || /\.(jpg|jpeg|png|gif|webp)$/i.test(resource.url) || resource.url.includes('image');
    const info = getResTypeInfoPremium(resource.tipo);
    
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
    const info = getResTypeInfoPremium(res.tipo);
    const [showVideo, setShowVideo] = useState(false);

    // YouTube URL Extractor
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = res.tipo === 'VIDEO' ? getYouTubeId(res.url) : null;
    const isPdf = res.tipo === 'PDF' || res.url.toLowerCase().endsWith('.pdf') || res.url.includes('drive.google.com');

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className={cn(
                "group relative overflow-hidden rounded-[2.5rem] border transition-all duration-500",
                theme === 'dark'
                    ? "bg-slate-900/60 border-slate-800/50 hover:border-primary/40 shadow-2xl shadow-black/40"
                    : "bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.1)]",
                className
            )}
        >
            {/* Fondo decorativo sutil */}
            <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20", info.bg)} />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/res:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="p-3">
                {/* Visual Header / Video Preview (Solo para Videos) */}
                {res.tipo === 'VIDEO' && youtubeId && (
                    <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800 group/video mb-3 shadow-inner">
                        <AnimatePresence mode="wait">
                            {showVideo ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
                                    <YouTube
                                        videoId={youtubeId}
                                        opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1 } }}
                                        className="w-full h-full"
                                    />
                                </motion.div>
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
                                    <img
                                        src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover/video:scale-110"
                                        alt={res.titulo}
                                    />
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}
                                            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all shadow-2xl"
                                        >
                                            <PlayCircle size={40} fill="currentColor" stroke="none" />
                                        </button>
                                    </div>
                                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                                        <YoutubeIcon size={14} /> Reproductor HD
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Info Area - Diseño Creativo para Materiales */}
                <div className={cn("px-5 py-4", res.tipo !== 'VIDEO' && "min-h-[100px] flex items-center")}>
                    <div className="flex items-center justify-between gap-6 w-full">
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                            {/* Visual Asset (Imagen real o Icono Glass) */}
                            {res.tipo !== 'VIDEO' && (
                                <div className="shrink-0 relative group/asset">
                                    {res.tipo === 'IMAGEN' ? (
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-2xl rotate-[-3deg] group-hover/asset:rotate-0 transition-transform duration-500 bg-slate-100 flex items-center justify-center">
                                            <img 
                                                src={res.url} 
                                                className="w-full h-full object-contain" 
                                                alt={res.titulo}
                                                onError={(e: any) => { e.target.src = 'https://via.placeholder.com/150?text=Imagen'; }}
                                            />
                                        </div>
                                    ) : (
                                        <div 
                                            className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl rotate-[-3deg] group-hover/asset:rotate-0 transition-all duration-500 relative overflow-hidden group/icon"
                                        >
                                            <div 
                                                className="absolute inset-0 opacity-100 group-hover/icon:opacity-90 transition-opacity"
                                                style={{ backgroundColor: info.bgHex }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent pointer-events-none" />
                                            <info.icon size={28} className="relative z-10 drop-shadow-md text-white" />
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2.5">
                                    <div className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] shadow-sm", info.bg)}>
                                        {info.label}
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
                                        <div className="w-1 h-1 rounded-full bg-slate-400" />
                                        RECURSO DIGITAL
                                    </span>
                                </div>
                                <h5 className={cn("text-lg font-black tracking-tight leading-tight transition-colors truncate", theme === 'dark' ? "text-white group-hover:text-primary" : "text-slate-800 group-hover:text-primary")}>
                                    {res.titulo}
                                </h5>
                                {res.descripcion && (
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight truncate opacity-80">
                                        {res.descripcion}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {(isPdf || res.tipo === 'IMAGEN') && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onView(); }}
                                    className="w-12 h-12 rounded-2xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center group/view"
                                >
                                    <FileSearch size={20} className="group-hover:scale-110 transition-transform" />
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); window.open(res.url, '_blank'); }}
                                className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                            >
                                <ExternalLink size={20} />
                            </button>
                            {isFac && (
                                <div className="flex items-center gap-1.5 flex-nowrap pointer-events-auto relative z-30">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                        title="Editar material"
                                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-all flex items-center justify-center shrink-0"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                        title="Eliminar material"
                                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
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
        if (!form.titulo || !form.url) return toast.error('Faltan datos');
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
                        <div className={cn("grid grid-cols-2 gap-4", theme === 'dark' ? "text-white" : "text-slate-800")}>
                            {['PDF', 'VIDEO', 'LINK', 'IMAGEN'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setForm({ ...form, tipo: t })}
                                    className={cn(
                                        "h-16 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-all",
                                        form.tipo === t 
                                            ? "border-primary bg-primary/5 text-primary" 
                                            : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-400"
                                    )}
                                >
                                    {t === 'PDF' && <FileText size={16} />}
                                    {t === 'VIDEO' && <YoutubeIcon size={16} />}
                                    {t === 'LINK' && <LinkIcon size={16} />}
                                    {t === 'IMAGEN' && <File size={16} />}
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">URL / Enlace</label>
                        <input type="text" placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className={cn("w-full h-14 px-6 rounded-2xl border-2 font-bold text-sm", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100")} />
                    </div>

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

function UnitModal({ moduloId, theme, unit, onClose, onSuccess, turnoId }: any) {
    const isEdit = !!unit;
    const [form, setForm] = useState({
        titulo: unit?.titulo || '',
        descripcion: unit?.descripcion || '',
        semana: unit?.semana || 1,
        orden: unit?.orden || 0,
        fechaInicio: unit?.fechaInicio ? new Date(unit.fechaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        fechaFin: unit?.fechaFin ? new Date(unit.fechaFin).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
        if (!confirm('¿Estás seguro de eliminar esta unidad?')) return;
        setLoading(true);
        try {
            await aulaService.eliminarUnidad(moduloId, unit.id);
            toast.success('Unidad eliminada');
            onSuccess();
        } catch (err) {
            toast.error('Error al eliminar unidad');
        } finally {
            setLoading(false);
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
                        <button onClick={handleDelete} className="p-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[1.5rem] transition-all border border-transparent hover:border-rose-100">
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

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Orden (Prioridad)</label>
                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Afecta la secuencia visual</span>
                        </div>
                        <div className="relative">
                            <SlidersHorizontal size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="number"
                                value={form.orden}
                                onChange={e => setForm({ ...form, orden: parseInt(e.target.value) })}
                                className={cn("w-full h-14 pl-12 pr-6 rounded-2xl border-2 font-bold text-sm focus:ring-0",
                                    theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100")}
                            />
                        </div>
                        <p className="text-[9px] text-slate-400 px-1 font-medium italic">Define qué unidad aparece antes cuando están en la misma semana.</p>
                    </div>

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
        </div>
    );
}

function getActTypeInfo(type: string) {
    switch (type.toUpperCase()) {
        // 🌊 FORO: Teal Cian — conversación fluida y dinámica
        case 'FORO': return { icon: MessagesSquare, bg: 'bg-[#0891b2]', bgHex: '#0891b2', border: 'hover:border-[#0891b2]/50', label: 'Debate Académico' };
        // 🌿 TAREA: Esmeralda — productividad y crecimiento
        case 'TAREA': return { icon: ClipboardCheck, bg: 'bg-[#059669]', bgHex: '#059669', border: 'hover:border-[#059669]/50', label: 'Práctica / Tarea' };
        // 🔥 CUESTIONARIO: Naranja Profu — desafío y conocimiento
        case 'CUESTIONARIO': return { icon: Brain, bg: 'bg-[#ea580c]', bgHex: '#ea580c', border: 'hover:border-[#ea580c]/50', label: 'Examen de Unidad' };
        default: return { icon: CheckCircle2, bg: 'bg-slate-500', bgHex: '#64748b', border: 'hover:border-slate-500/50', label: 'Estructura Académica' };
    }
}

function getResTypeInfo(type: string) {
    switch (type.toUpperCase()) {
        case 'PDF': return { icon: File };
        case 'VIDEO': return { icon: Youtube };
        case 'LINK': return { icon: LinkIcon };
        default: return { icon: FileText };
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
                        ¿Eliminar {isActivity ? 'Actividad' : 'Material'}?
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

