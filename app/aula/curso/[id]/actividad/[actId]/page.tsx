'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { aulaService } from '@/services/aulaService';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    MessageSquare,
    FileText,
    Send,
    User,
    Paperclip,
    CheckCircle2,
    Clock,
    AlertCircle,
    Download,
    Loader2,
    Users,
    Star,
    Award,
    ChevronDown,
    Search,
    ArrowRight,
    Save,
    X,
    Calendar,
    GraduationCap,
    BookOpen
} from 'lucide-react';

/** Paleta creativa por tipo de actividad — independiente del color institucional */
function getActColor(tipo: string): string {
    switch ((tipo || '').toUpperCase()) {
        case 'FORO': return '#0891b2'; // 🌊 Teal Cian
        case 'TAREA': return '#059669'; // 🌿 Esmeralda
        case 'CUESTIONARIO': return '#ea580c'; // 🔥 Naranja Profundo
        default: return '#64748b'; // Slate neutro
    }
}

import { cn, getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useAula } from '@/contexts/AulaContext';
import { useAuth } from '@/contexts/AuthContext';

export default function ActivityDetailPage() {
    const { id: cursoId, actId } = useParams();
    const { theme, isFacilitator } = useAula();
    const { user: currentUser } = useAuth();
    const router = useRouter();

    const [activity, setActivity] = useState<any>(null);
    const [forumPosts, setForumPosts] = useState<any[]>([]);
    const [entregas, setEntregas] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Facilitator UI state
    const [viewMode, setViewMode] = useState<'content' | 'submissions'>('content');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'graded'>('all');
    const [gradingData, setGradingData] = useState<{ id: string, nota: number, retro: string }>({ id: '', nota: 0, retro: '' });

    // Tarea submission state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [deliveryText, setDeliveryText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadContent();
    }, [cursoId, actId]);

    const loadContent = async () => {
        setIsLoading(true);
        try {
            const actData = await aulaService.getActividadDetalle(cursoId as string, actId as string);
            setActivity(actData);

            if (actData.tipo === 'FORO' && actData.foro) {
                const posts = await aulaService.getForoPosts(actData.foro.id);
                setForumPosts(posts);
                loadEntregas();
            } else if (actData.tipo === 'TAREA') {
                loadEntregas();
            }
        } catch (err) {
            console.error('Error loading activity', err);
            toast.error('Error al cargar la actividad');
        } finally {
            setIsLoading(false);
        }
    };

    const loadEntregas = async () => {
        try {
            const data = await aulaService.getEntregas(actId as string);
            setEntregas(data);
            // Si el usuario ya tiene una entrega y no estamos en modo facilitador, 
            // precargamos el texto para que pueda editarlo.
            if (data.length > 0 && !isFacilitator && data[0].texto && !deliveryText) {
                setDeliveryText(data[0].texto);
            }
        } catch (err) {
            console.error('Error loading submissions', err);
        }
    };

    const handleCreatePost = async (padreId?: string) => {
        if (!newPost.trim()) return;
        if (!activity?.foro?.id) {
            toast.error('El foro de esta actividad no se ha inicializado correctamente. Contacte al administrador.');
            return;
        }

        setIsSubmitting(true);
        try {
            await aulaService.crearPost(activity.foro.id, { mensaje: newPost, padreId });
            setNewPost('');
            loadContent();
            toast.success('Contribución académica registrada');
        } catch (err) {
            console.error('Error creating post', err);
            toast.error('Error al enviar mensaje');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCalificar = async (targetUserId: string, tipo: 'TAREA' | 'FORO') => {
        if (gradingData.nota < 0 || gradingData.nota > (activity?.puntajeMax || 100)) return toast.error('Nota inválida');
        try {
            await aulaService.calificar({
                actividadId: actId as string,
                targetUserId,
                nota: gradingData.nota,
                retro: gradingData.retro,
                tipoTarget: tipo
            });
            toast.success('Calificación guardada');
            setGradingData({ id: '', nota: 0, retro: '' });
            loadContent();
        } catch (err) {
            toast.error('Error al calificar');
        }
    };

    const handleSubmission = async () => {
        if (!activity?.tarea?.id) return;
        
        // Si no hay archivo nuevo y no hay texto, y no había entrega previa, error
        const hasExistingDelivery = entregas.length > 0;
        if (!selectedFile && !deliveryText.trim() && !hasExistingDelivery) {
            return toast.error('Debes adjuntar un archivo o escribir una respuesta');
        }

        setIsSubmitting(true);
        try {
            // Preservar URL anterior si existe y no se sube un archivo nuevo
            let fileUrl = hasExistingDelivery ? entregas[0].archivoUrl : '';
            
            // 1. Upload file if exists
            if (selectedFile) {
                const fd = new FormData();
                fd.append('file', selectedFile);
                const uploadRes = await aulaService.uploadFile('mod_entrega', fd);
                fileUrl = uploadRes.data.path;
            }

            // 2. Submit task
            await aulaService.submitTarea(activity.tarea.id, {
                texto: deliveryText,
                archivoUrl: fileUrl
            });

            toast.success(hasExistingDelivery ? '¡Entrega actualizada con éxito!' : '¡Actividad entregada con éxito!');
            
            setSelectedFile(null);
            loadContent();
        } catch (err: any) {
            console.error('Error submitting task', err);
            const msg = err.response?.data?.message || 'Ocurrió un error al procesar la entrega';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const groupedParticipants = (activity?.tipo === 'FORO' ? forumPosts : entregas).reduce((acc: any[], item: any) => {
        const userId = item.user?.id || item.userId || item.usuarioId;
        if (!userId) return acc;

        const existing = acc.find(p => p.id === userId);
        if (existing) {
            existing.posts.push(item);
            existing.totalMensajes += 1;
            const currentItemDate = item.createdAt ? new Date(item.createdAt) : new Date(0);
            const existingItemDate = existing.latestPost.createdAt ? new Date(existing.latestPost.createdAt) : new Date(0);
            if (currentItemDate > existingItemDate) {
                existing.latestPost = item;
            }
            if (!existing.nota && item.nota) {
                existing.nota = item.nota;
            }
        } else {
            // Since backend now returns `nota` attached for FORO, and `entregas` naturally has it for TAREA
            let notaToUse = item.nota;
            if (activity?.tipo === 'FORO' && !notaToUse) {
                const entrega = entregas.find((e: any) => e.usuarioId === userId || e.user?.id === userId);
                if (entrega?.nota) notaToUse = entrega.nota;
            }

            acc.push({
                id: userId,
                user: item.user || item.usuario,
                posts: [item],
                latestPost: item,
                totalMensajes: 1,
                nota: notaToUse
            });
        }
        return acc;
    }, []);

    const filteredParticipants = groupedParticipants.filter((p: any) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            p.user?.nombre?.toLowerCase().includes(searchLower) ||
            p.user?.apellidos?.toLowerCase().includes(searchLower) ||
            p.latestPost?.mensaje?.toLowerCase().includes(searchLower);

        const matchesFilter =
            filterTab === 'all' ||
            (filterTab === 'pending' && !p.nota) ||
            (filterTab === 'graded' && !!p.nota);

        return matchesSearch && matchesFilter;
    });

    const isClosed = activity?.fechaFin ? new Date() > new Date(activity.fechaFin) : false;
    const isGraded = !isFacilitator && groupedParticipants.some(p => p.id === currentUser?.id && !!p.nota);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--aula-primary)' }} />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Conectando a la red...</p>
        </div>
    );

    if (!activity) return <div className="p-20 text-center text-slate-400 font-bold">Actividad no encontrada</div>;

    const totalParticipantes = (activity?.tipo === 'FORO' ? groupedParticipants.length : entregas.length);
    const stats = {
        total: totalParticipantes,
        pendientes: groupedParticipants.filter((p: any) => !p.nota).length,
        promedio: groupedParticipants.length > 0 ? (groupedParticipants.reduce((acc, curr) => acc + (curr.nota?.nota || curr.nota || 0), 0) / groupedParticipants.length).toFixed(1) : 0
    };

    return (
        <div className="max-w-7xl mx-auto pb-32">
            {/* Header / Top Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 px-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className={cn("text-2xl font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                            {activity.titulo}
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--aula-primary)' }}>{activity.tipo} EDUCATIVO</p>
                    </div>
                </div>

                {isFacilitator && (
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setViewMode('content')}
                            className={cn(
                                "px-6 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                                viewMode === 'content' ? "bg-white dark:bg-slate-800 shadow-md" : "text-slate-400 hover:text-slate-600"
                            )}
                            style={viewMode === 'content' ? { color: 'var(--aula-primary)' } : {}}
                        >
                            Contenido
                        </button>
                        <button
                            onClick={() => setViewMode('submissions')}
                            className={cn(
                                "px-6 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2",
                                viewMode === 'submissions' ? "bg-white dark:bg-slate-800 shadow-md" : "text-slate-400 hover:text-slate-600"
                            )}
                            style={viewMode === 'submissions' ? { color: 'var(--aula-primary)' } : {}}
                        >
                            <Users size={12} /> Entregas ({stats.total})
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
                {/* Sidebar: Activity Info & Instructions */}
                <aside className="lg:col-span-3 space-y-6">
                    <div className={cn(
                        "sticky top-10 rounded-[2.5rem] border overflow-hidden transition-all",
                        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-2xl shadow-slate-200/50"
                    )}>
                        {/* Status Panel */}
                        <div className="p-8 space-y-8">
                            <div className="flex justify-between items-center">
                                <div className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]")}
                                    style={{
                                        backgroundColor: `${getActColor(activity.tipo)}1a`,
                                        color: getActColor(activity.tipo)
                                    }}>
                                    {activity.tipo}
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Puntaje</p>
                                    <p className="text-2xl font-black" style={{ color: getActColor(activity.tipo) }}>{activity.puntajeMax} PTS</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={12} /> Instrucciones
                                </h4>
                                <div className={cn("text-sm font-medium leading-relaxed", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                                    {activity.instrucciones || 'Sin instrucciones adicionales asignadas por el docente.'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
                                <MetaItem icon={Calendar} label="Apertura" value={new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(activity.fechaInicio))} theme={theme} />
                                <MetaItem icon={Clock} label="Cierre" value={new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(activity.fechaFin))} accent theme={theme} />
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800" style={{ color: getActColor(activity.tipo) }}>
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Facilitador a Cargo</p>
                                        <p className={cn("text-xs font-black uppercase tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                            {activity.facilitador || activity.docente || 'Delfor Vargas Urzagaste'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Student Progress Badge (if not fac) */}
                        {!isFacilitator && (
                            <div className="p-8 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between group cursor-pointer" onClick={() => toast.info('Estado: ' + (entregas.length > 0 ? 'Completado' : 'Pendiente'))}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                            entregas.length > 0 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-400")}>
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tu Estado</p>
                                            <p className={cn("text-xs font-black uppercase", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                                {entregas.length > 0 ? 'Entregado' : 'Pendiente'}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="lg:col-span-9">
                    {viewMode === 'submissions' ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <StatCard icon={Users} label="Participantes" value={stats.total} color="primary" theme={theme} />
                                <StatCard icon={Award} label="Promedio Gral." value={`${stats.promedio}`} color="emerald" theme={theme} />
                            </div>

                            <div className={cn("rounded-[2.5rem] border overflow-hidden", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xl shadow-slate-200/50")}>
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20" style={{ borderLeft: `4px solid ${getActColor(activity.tipo)}` }}>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Nomina de Estudiantes y Entregas</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredParticipants.map((p: any) => (
                                                <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black shadow-sm overflow-hidden" style={{ backgroundColor: getActColor(activity.tipo), color: 'white' }}>
                                                                {p.user?.imagen ? (
                                                                    <img src={getImageUrl(p.user.imagen)} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <>{p.user?.nombre?.charAt(0)}{p.user?.apellidos?.charAt(0)}</>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={cn("text-xs font-black uppercase tracking-tight", theme === 'dark' ? "text-white" : "text-slate-700")}>
                                                                    {p.user?.nombre} {p.user?.apellidos}
                                                                </span>
                                                                {activity.tipo === 'FORO' && (
                                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{p.totalMensajes} Aportes registrados</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Última Actividad</p>
                                                        <p className="text-[10px] font-bold text-slate-500">
                                                            {p.latestPost?.createdAt ? new Date(p.latestPost.createdAt).toLocaleDateString() : '—'}
                                                        </p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", p.nota ? "bg-emerald-500" : "bg-amber-500")} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                                {p.nota ? `Calificado: ${p.nota?.nota ?? p.nota}/${activity.puntajeMax}` : 'Pendiente'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button
                                                            onClick={() => setGradingData({ id: p.id, nota: p.nota?.nota ?? p.nota ?? 0, retro: p.nota?.observacion || '' })}
                                                            className="px-6 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg text-white"
                                                            style={{ backgroundColor: getActColor(activity.tipo) }}
                                                        >
                                                            Gestionar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {(activity.tipo === 'FORO' || (activity.tipo === 'TAREA' && isFacilitator)) && (
                                <div className={cn(
                                    "flex flex-col min-h-[800px] rounded-[3rem] border overflow-hidden relative",
                                    theme === 'dark' ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-2xl shadow-slate-200/50"
                                )}>
                                    {/* Feed Header */}
                                    <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: 'var(--aula-primary)' }}>
                                                <Users size={16} />
                                            </div>
                                            <div>
                                                <h3 className={cn("text-xs font-black uppercase tracking-widest", theme === 'dark' ? "text-slate-100" : "text-slate-800")}>
                                                    {activity.tipo === 'FORO' ? 'Debate Académico' : 'Entregas del Módulo'}
                                                </h3>
                                                <p className="text-[10px] font-bold text-slate-400">
                                                    {activity.tipo === 'FORO' ? forumPosts.length : entregas.length} {activity.tipo === 'FORO' ? 'Participaciones Activas' : 'Archivos Subidos'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                        </div>
                                    </div>

                                    {/* Academic Management Console - High Scale Optimized */}
                                    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/10 dark:bg-slate-900/10">

                                        {/* Facilitator Stats Dashboard */}
                                        {isFacilitator && (
                                            <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--aula-primary), transparent 85%)', color: 'var(--aula-primary)' }}>
                                                        <Users size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Inscritos</p>
                                                        <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-0.5">{groupedParticipants.length}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                                                        <CheckCircle2 size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Calificados</p>
                                                        <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-0.5">{groupedParticipants.filter((p: any) => !!p.nota).length}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                                                        <Clock size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Pendientes</p>
                                                        <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-0.5">{groupedParticipants.filter((p: any) => !p.nota).length}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Activity Toolbar: Search & Filters */}
                                        <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/20 dark:bg-slate-900/20">
                                            <div className="relative w-full md:w-80 group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--aula-primary)] transition-colors" size={14} />
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                    placeholder="Buscar participante..."
                                                    className={cn(
                                                        "w-full pl-10 h-10 rounded-xl border-none text-xs font-semibold focus:ring-2 focus:stroke-[var(--aula-primary)]/10",
                                                        theme === 'dark' ? "bg-slate-800 text-white placeholder:text-slate-600" : "bg-slate-100 text-slate-700 placeholder:text-slate-400"
                                                    )}
                                                />
                                            </div>

                                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <button
                                                    onClick={() => setFilterTab('all')}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                                        filterTab === 'all' ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                    )}
                                                    style={filterTab === 'all' ? { color: 'var(--aula-primary)' } : {}}
                                                >
                                                    Todos
                                                </button>
                                                <button
                                                    onClick={() => setFilterTab('pending')}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                                        filterTab === 'pending' ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                    )}
                                                    style={filterTab === 'pending' ? { color: 'var(--aula-primary)' } : {}}
                                                >
                                                    Por Calificar
                                                </button>
                                                <button
                                                    onClick={() => setFilterTab('graded')}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                                        filterTab === 'graded' ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                    )}
                                                    style={filterTab === 'graded' ? { color: 'var(--aula-primary)' } : {}}
                                                >
                                                    Evaluados
                                                </button>
                                            </div>
                                        </div>

                                        {/* The Academic Ledger - Optimized for High Volume */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                                            {!isFacilitator && activity.tipo === 'FORO' && (
                                                <div className="p-8 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                                    {(!isClosed && !isGraded) ? (
                                                        <div className={cn(
                                                            "max-w-4xl mx-auto p-8 rounded-[2rem] border shadow-xl transition-all",
                                                            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-white"
                                                        )}>
                                                            <div className="flex items-center gap-4 mb-6">
                                                                <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg shadow-primary/20" style={{ backgroundColor: 'var(--aula-primary)' }}>
                                                                    <FileText size={20} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white leading-none">Nueva Entrada Académica</h3>
                                                                    <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-tighter">
                                                                        Identificado como: <span className="font-black" style={{ color: 'var(--aula-primary)' }}>{currentUser?.nombre} {currentUser?.apellidos}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <textarea
                                                                value={newPost}
                                                                onChange={e => setNewPost(e.target.value)}
                                                                placeholder="Redacta tu análisis profesional sobre este debate..."
                                                                className={cn(
                                                                    "w-full min-h-[140px] p-6 rounded-2xl border-none focus:ring-0 text-[15px] font-medium leading-relaxed resize-none",
                                                                    theme === 'dark' ? "bg-slate-800 text-white placeholder:text-slate-600" : "bg-slate-50 text-slate-700 placeholder:text-slate-400"
                                                                )}
                                                            />
                                                            <div className="flex justify-end mt-4">
                                                                <button
                                                                    onClick={() => handleCreatePost()}
                                                                    disabled={isSubmitting || !newPost.trim()}
                                                                    className="px-10 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] hover:scale-105 transition-all disabled:opacity-20"
                                                                    style={{ backgroundColor: isSubmitting || !newPost.trim() ? undefined : 'var(--aula-primary)' }}
                                                                >
                                                                    {isSubmitting ? 'Registrando...' : 'Registrar Aporte'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={cn(
                                                            "max-w-4xl mx-auto p-12 rounded-[2rem] border border-dashed text-center space-y-4",
                                                            theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
                                                        )}>
                                                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                                                <AlertCircle size={32} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">
                                                                    {isClosed ? 'Participación Finalizada' : 'Evaluación Registrada'}
                                                                </h4>
                                                                <p className="text-xs font-medium text-slate-400">
                                                                    {isClosed
                                                                        ? 'Esta actividad ha cerrado su plazo de recepción el ' + new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(activity.fechaFin)).replace(/ a las |,/g, ', ').toLowerCase()
                                                                        : 'Ya has sido calificado por el facilitador. No se permiten más aportes en esta instancia.'
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                {filteredParticipants.map((participant: any, idx: number) => (
                                                    <motion.div
                                                        key={participant.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={cn(
                                                            "mx-2 my-4 p-4 rounded-[2rem] border transition-all relative group flex flex-col md:flex-row gap-4 items-start",
                                                            participant.id === currentUser?.id
                                                                ? "bg-primary/5 dark:bg-primary/10 border-primary/20 shadow-primary/20"
                                                                : "bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                                                        )}
                                                    >
                                                        {/* Status & Identity Indicator */}
                                                        {participant.id === currentUser?.id && (
                                                            <div className="absolute top-0 right-10 -translate-y-1/2 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg" style={{ backgroundColor: 'var(--aula-primary)' }}>
                                                                Tu Aporte Académico
                                                            </div>
                                                        )}

                                                        {/* Profile Column */}
                                                        <div className="flex flex-row md:flex-col items-center gap-4 flex-shrink-0 w-full md:w-auto">
                                                            <div className={cn(
                                                                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center overflow-hidden shadow-md border-4",
                                                                participant.id === currentUser?.id ? "border-white dark:border-slate-800" : "border-slate-50 dark:border-slate-900"
                                                            )}>
                                                                {participant.user?.imagen ? (
                                                                    <img src={getImageUrl(participant.user.imagen)} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                                        <span className="text-xl font-black" style={{ color: 'var(--aula-primary)' }}>
                                                                            {participant.user?.nombre?.charAt(0)}{participant.user?.apellidos?.charAt(0)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="md:text-center w-full md:w-48">
                                                                <h4 className={cn("text-[11px] font-black uppercase tracking-tight leading-tight mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                                                    {participant.user?.nombre} {participant.user?.apellidos}
                                                                </h4>
                                                                <div className="px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: 'color-mix(in srgb, var(--aula-primary), transparent 90%)' }}>
                                                                    <p className="text-[7px] font-black uppercase tracking-widest leading-none" style={{ color: 'var(--aula-primary)' }}>Participante</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Content Body */}
                                                        <div className="flex-1 space-y-4 w-full">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                                                    Global del Debate
                                                                </span>
                                                                {participant.totalMensajes > 0 && (
                                                                    <span className="text-[9px] font-black flex items-center gap-1.5 uppercase tracking-widest" style={{ color: 'var(--aula-primary)' }}>
                                                                        <MessageSquare size={10} /> {participant.totalMensajes} Intervenciones
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                {participant.posts.map((post: any, pIdx: number) => (
                                                                    <div key={post.id || pIdx} className={cn(
                                                                        "p-1 rounded-xl relative transition-all border",
                                                                        theme === 'dark'
                                                                            ? "bg-slate-900/40 border-slate-800 hover:border-slate-700 shadow-inner"
                                                                            : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
                                                                    )}>
                                                                        {activity.tipo === 'TAREA' && post.archivoUrl ? (
                                                                            <a href={post.archivoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-primary hover:bg-primary/10 transition-all">
                                                                                <Paperclip size={16} /> <span className="text-xs font-black uppercase">Archivo Adjunto</span>
                                                                            </a>
                                                                        ) : (
                                                                            <p className={cn(
                                                                                "text-[12px] font-medium leading-normal whitespace-pre-wrap",
                                                                                theme === 'dark' ? "text-slate-300" : "text-slate-600"
                                                                            )}>
                                                                                {post.mensaje || post.texto || 'Sin mensaje.'}
                                                                            </p>
                                                                        )}
                                                                        <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                                                                            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                                                                                Aporte #{participant.totalMensajes - pIdx}
                                                                            </span>
                                                                            <span className="text-[10px] font-bold text-slate-400/60">
                                                                                {new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(post.createdAt))}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {participant.nota && (
                                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start">
                                                                    <div className="shrink-0">
                                                                        <div className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20">
                                                                            NOTA: {participant.nota?.nota ?? participant.nota} / {activity.puntajeMax}
                                                                        </div>
                                                                    </div>
                                                                    {participant.nota.observacion && (
                                                                        <div className={cn(
                                                                            "flex-1 p-5 rounded-2xl border",
                                                                            theme === 'dark' ? "bg-slate-800/30 border-slate-700 text-slate-400" : "bg-emerald-50/30 border-emerald-100 ml-auto"
                                                                        )}>
                                                                            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--aula-primary)' }}>Retroalimentación:</p>
                                                                            <p className="text-[12px] italic leading-relaxed text-slate-500 dark:text-slate-400">
                                                                                "{participant.nota?.observacion || 'Sin comentarios adicionales.'}"
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Action Column */}
                                                        {isFacilitator && (
                                                            <div className="flex-shrink-0">
                                                                <button
                                                                    onClick={() => setGradingData({ id: participant.id, nota: participant.nota?.nota || 0, retro: participant.nota?.observacion || '' })}
                                                                    className={cn(
                                                                        "px-6 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                                        participant.nota
                                                                            ? "bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-primary"
                                                                            : "text-white hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
                                                                    )}
                                                                    style={!participant.nota ? { backgroundColor: 'var(--aula-primary)' } : {}}
                                                                >
                                                                    {participant.nota ? 'Editar Nota' : 'Calificar Aporte'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}

                                                {groupedParticipants.length === 0 && (
                                                    <div className="py-20 flex flex-col items-center justify-center opacity-30 text-center">
                                                        <Search size={48} className="text-slate-400 mb-4" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin registros disponibles</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isFacilitator && activity.tipo === 'TAREA' && (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className={cn("p-10 rounded-[3rem] border space-y-10 group", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xl shadow-slate-200/50")}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--aula-primary)' }} />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registro de Seguimiento</p>
                                            </div>
                                            <div className="space-y-8">
                                                <InfoRow icon={Clock} label="Estado Actividad" value={entregas.length > 0 ? "Completado" : "Pendiente"} theme={theme} />
                                                <InfoRow icon={Star} label="Nota Obtenida" value={entregas.length > 0 && entregas[0].nota ? `${entregas[0].nota.nota}/${activity.puntajeMax}` : "-- / " + activity.puntajeMax} theme={theme} />
                                                <InfoRow icon={AlertCircle} label="Observación" value={entregas.length > 0 && new Date(entregas[0].createdAt) > new Date(activity.fechaFin) ? "Entrega fuera de fecha" : "A tiempo"} theme={theme} />
                                            </div>
                                        </div>

                                        {!isFacilitator && (
                                            <div className={cn(
                                                "p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden group border transition-all duration-500",
                                                theme === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-slate-200/50"
                                            )}>
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--aula-primary),transparent)] opacity-[0.03]" />
                                                <div className="relative z-10 space-y-8">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Entorno de Carga</p>
                                                        <h3 className={cn(
                                                            "text-2xl font-black",
                                                            theme === 'dark' ? "text-white" : "text-slate-900"
                                                        )}>
                                                            {isClosed ? 'Carga Finalizada' : isGraded ? 'Entrega Evaluada' : 'Sube tu Trabajo'}
                                                        </h3>
                                                    </div>

                                                    {!isClosed && !isGraded ? (
                                                        <div className="space-y-6">
                                                            {/* Card Principal de Carga - Light & Institutional */}
                                                            <div className={cn(
                                                                "p-8 rounded-[2.5rem] border-2 shadow-2xl relative overflow-hidden transition-all duration-700 backdrop-blur-sm",
                                                                theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/90 border-[#e2e8f0]"
                                                            )}>
                                                                {/* Sutil acento lateral */}
                                                                <div className="absolute left-0 top-10 bottom-10 w-1.5 rounded-r-full" style={{ backgroundColor: 'var(--aula-primary)' }} />
                                                                
                                                                <div className="relative z-10 space-y-8">
                                                                    {/* Header del Widget */}
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="space-y-1">
                                                                            <h3 className={cn("text-xl font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                                                                Sube tu <span style={{ color: 'var(--aula-primary)' }}>Trabajo</span>
                                                                            </h3>
                                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Entorno de Entrega Académica</p>
                                                                        </div>
                                                                        <div className="p-3 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50">
                                                                            <Clock size={16} className="text-slate-400" />
                                                                        </div>
                                                                    </div>

                                                                    {/* Área de Texto - Refinada */}
                                                                    {activity.tarea?.allowText && (
                                                                        <div className="space-y-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <MessageSquare size={14} style={{ color: 'var(--aula-primary)' }} />
                                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Respuesta Escrita</p>
                                                                            </div>
                                                                            <textarea
                                                                                value={deliveryText}
                                                                                onChange={(e) => setDeliveryText(e.target.value)}
                                                                                placeholder="Escribe tu observación o respuesta aquí..."
                                                                                className={cn(
                                                                                    "w-full h-32 rounded-[1.5rem] p-5 text-sm transition-all outline-none resize-none border-2",
                                                                                    theme === 'dark' 
                                                                                        ? "bg-slate-950/50 border-slate-800 text-white focus:border-primary/50" 
                                                                                        : "bg-slate-50/50 border-slate-100 text-slate-700 focus:border-primary/30 focus:bg-white shadow-inner"
                                                                                )}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* Dropzone de Archivos - Colores Institucionales */}
                                                                    {activity.tarea?.allowFiles && (
                                                                        <div className="space-y-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <FileText size={14} style={{ color: 'var(--aula-primary)' }} />
                                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Archivos Adjuntos</p>
                                                                            </div>
                                                                            <div
                                                                                onClick={() => fileInputRef.current?.click()}
                                                                                className={cn(
                                                                                    "group/upload relative border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center gap-4 transition-all cursor-pointer",
                                                                                    (selectedFile || entregas[0]?.archivoUrl)
                                                                                        ? "border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-500/5"
                                                                                        : theme === 'dark' ? "border-slate-800 bg-slate-950/40 hover:border-primary/40" : "border-slate-200 bg-slate-50/60 hover:border-primary/40 hover:bg-white"
                                                                                )}
                                                                            >
                                                                                <input
                                                                                    type="file"
                                                                                    ref={fileInputRef}
                                                                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                                                    className="hidden"
                                                                                    accept={activity.tarea?.tiposArch ? activity.tarea.tiposArch.split(',').map((t: string) => `.${t.trim()}`).join(',') : '*/*'}
                                                                                />
                                                                                
                                                                                <div className={cn(
                                                                                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                                                    (selectedFile || entregas[0]?.archivoUrl)
                                                                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                                                                        : theme === 'dark' ? "bg-slate-800 text-slate-400 group-hover/upload:text-primary group-hover/upload:scale-110" : "bg-white text-slate-400 group-hover/upload:text-primary group-hover/upload:scale-110 shadow-sm"
                                                                                )}>
                                                                                    {(selectedFile || entregas[0]?.archivoUrl) ? <CheckCircle2 size={28} /> : <Paperclip size={28} />}
                                                                                </div>
                                                                                
                                                                                <div className="text-center space-y-1">
                                                                                    <h4 className={cn("text-xs font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                                                                        {selectedFile ? selectedFile.name : (entregas[0]?.archivoUrl ? 'Documento Registrado' : 'Selecciona tu Archivo')}
                                                                                    </h4>
                                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                                        {activity.tarea?.tiposArch?.toUpperCase() || 'PDF • DOCX'} (LÍMITE {process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '20'}MB)
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {entregas[0]?.archivoUrl && !selectedFile && (
                                                                                <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <FileText size={14} className="text-emerald-500" />
                                                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Archivo en Servidor</p>
                                                                                    </div>
                                                                                    <a 
                                                                                        href={getImageUrl(entregas[0].archivoUrl)} 
                                                                                        target="_blank" 
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-[9px] font-black text-primary hover:underline"
                                                                                    >
                                                                                        VER DOCUMENTO
                                                                                    </a>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Botón de Envío - Color Primario Institucional */}
                                                                    <button
                                                                        onClick={handleSubmission}
                                                                        disabled={isSubmitting}
                                                                        className="group/btn relative w-full h-16 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                                                                        style={{ 
                                                                            backgroundColor: 'var(--aula-primary)',
                                                                            color: 'white'
                                                                        }}
                                                                    >
                                                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                                                            {isSubmitting ? (
                                                                                <Loader2 className="animate-spin" size={18} />
                                                                            ) : (
                                                                                <>
                                                                                    <span>{entregas.length > 0 ? 'Actualizar Mi Entrega' : 'Formalizar Envío'}</span>
                                                                                    <Send size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </button>

                                                                    <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">
                                                                        Delfor Vargas Urzagaste • Facilitador a Cargo
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-8">
                                                            {/* Hero Status Card - Theme Aware */}
                                                            <div className={cn(
                                                                "relative p-10 rounded-[3rem] overflow-hidden group/status border transition-all duration-500",
                                                                theme === 'dark' ? "bg-slate-900 border-slate-800 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/50"
                                                            )}>
                                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--aula-primary),transparent)] opacity-[0.05] pointer-events-none" />
                                                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                                                    <div 
                                                                        className="w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-in fade-in zoom-in duration-500"
                                                                        style={{ 
                                                                            backgroundColor: isGraded ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                                                            border: `1px solid ${isGraded ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)'}`
                                                                        }}
                                                                    >
                                                                        {isGraded ? (
                                                                            <CheckCircle2 size={40} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                                        ) : (
                                                                            <Clock size={40} className="text-slate-500" />
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <h3 className={cn(
                                                                            "text-xl font-black uppercase tracking-[0.2em]",
                                                                            theme === 'dark' ? "text-white" : "text-slate-900"
                                                                        )}>
                                                                            {isGraded ? 'Entrega Evaluada' : 'Plazo Finalizado'}
                                                                        </h3>
                                                                        <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto leading-relaxed">
                                                                            {isClosed
                                                                                ? 'El sistema ha cerrado la recepción de trabajos para esta actividad curricular.'
                                                                                : 'Tu producción académica ha sido revisada y calificada por el facilitador asignado.'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Submission Summary Card - Theme Aware */}
                                                            {entregas.length > 0 && (
                                                                <div className={cn(
                                                                    "p-10 rounded-[3rem] border shadow-2xl space-y-10 relative overflow-hidden group/summary transition-all duration-500",
                                                                    theme === 'dark' ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
                                                                )}>
                                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                                                                    
                                                                    <div className="flex items-center justify-between relative z-10">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: 'var(--aula-primary)' }} />
                                                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Evidencia de Aprendizaje</p>
                                                                        </div>
                                                                        <div className={cn(
                                                                            "px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest",
                                                                            theme === 'dark' ? "bg-slate-900/80 border-slate-800 text-slate-500" : "bg-white border-slate-200 text-slate-400"
                                                                        )}>
                                                                            Registro ID: {entregas[0].id.split('-')[0].toUpperCase()}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="grid grid-cols-1 gap-10 relative z-10">
                                                                        {entregas[0].texto && (
                                                                            <div className="space-y-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <MessageSquare size={14} style={{ color: 'var(--aula-primary)' }} />
                                                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Contenido Teórico:</p>
                                                                                </div>
                                                                                <div className={cn(
                                                                                    "p-6 rounded-3xl border text-sm leading-relaxed italic",
                                                                                    theme === 'dark' ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-600 shadow-sm"
                                                                                )}>
                                                                                    "{entregas[0].texto}"
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {entregas[0].archivoUrl && (
                                                                            <div className="space-y-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <FileText size={14} style={{ color: 'var(--aula-primary)' }} />
                                                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Soporte Documental:</p>
                                                                                </div>
                                                                                <a 
                                                                                    href={getImageUrl(entregas[0].archivoUrl)} 
                                                                                    target="_blank" 
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center justify-between p-6 bg-slate-900 hover:bg-slate-800/80 rounded-[2rem] border border-slate-800 transition-all group/file"
                                                                                >
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover/file:scale-110 transition-transform">
                                                                                            <Download size={24} />
                                                                                        </div>
                                                                                        <div className="text-left">
                                                                                            <p className="text-xs font-black text-white">{entregas[0].archivoUrl.split('/').pop()}</p>
                                                                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">Expediente Digital</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 group-hover/file:text-white group-hover/file:border-white transition-all">
                                                                                        <ArrowRight size={18} />
                                                                                    </div>
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Modal de Calificación Refinado (Right Edge) */}
            <AnimatePresence>
                {gradingData.id && (
                    <div className="fixed inset-0 z-[200] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setGradingData({ id: '', nota: 0, retro: '' })}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: 500, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 500, opacity: 0 }}
                            className={cn("relative w-full max-w-md h-full shadow-2xl p-0 flex flex-col", theme === 'dark' ? "bg-slate-900" : "bg-white")}
                        >
                            {/* Header Fijo */}
                            <header className={cn("p-10 pb-6 flex justify-between items-center border-b", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
                                <h4 className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>Calificar <span style={{ color: 'var(--aula-primary)' }}>Aporte</span></h4>
                                <button onClick={() => setGradingData({ id: '', nota: 0, retro: '' })} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-rose-500 hover:text-white transition-all">
                                    <X size={20} />
                                </button>
                            </header>

                            {/* Contenido Desplazable */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                                {/* Historial de Intervenciones */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(var(--aula-primary-rgb),0.6)]" style={{ backgroundColor: 'var(--aula-primary)' }} />
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historial de Intervenciones</label>
                                    </div>
                                    <div className="space-y-3">
                                        {groupedParticipants.find(p => p.id === gradingData.id)?.posts.map((post: any, pIdx: number) => (
                                            <div key={pIdx} className={cn(
                                                "p-5 rounded-2xl border transition-all text-[12px] leading-relaxed",
                                                theme === 'dark' ? "bg-slate-800/40 border-slate-700/50 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"
                                            )}>
                                                <div className="flex justify-between items-start mb-2 opacity-60">
                                                    <span className="text-[9px] font-black uppercase tracking-wider">Aporte #{pIdx + 1}</span>
                                                    <span className="text-[9px] font-bold">
                                                        {new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(post.createdAt))}
                                                    </span>
                                                </div>
                                                {post.archivoUrl ? (
                                                    <a href={post.archivoUrl} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline flex items-center gap-2" style={{ color: 'var(--aula-primary)' }}>
                                                        <Paperclip size={12} /> Descargar Archivo Adjunto
                                                    </a>
                                                ) : (
                                                    <p className="font-medium italic">"{post.mensaje || post.texto}"</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Puntaje Asignado</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={gradingData.nota}
                                            onChange={e => setGradingData({ ...gradingData, nota: parseFloat(e.target.value) })}
                                            className={cn("w-full h-24 text-6xl font-black text-center rounded-[2.5rem] border-2 border-transparent transition-all outline-none",
                                                theme === 'dark' ? "bg-slate-800 focus:border-primary" : "bg-slate-50 focus:border-primary shadow-inner")}
                                            style={{ color: 'var(--aula-primary)' }}
                                        />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">/{activity.puntajeMax}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Retroalimentación / Comentario</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Escribe una observación técnica para el estudiante..."
                                        value={gradingData.retro}
                                        onChange={e => setGradingData({ ...gradingData, retro: e.target.value })}
                                        className={cn("w-full p-6 rounded-[2rem] border-2 border-transparent font-medium transition-all text-sm resize-none outline-none",
                                            theme === 'dark' ? "bg-slate-800 text-white focus:border-primary" : "bg-slate-50 text-slate-700 focus:border-primary shadow-inner")}
                                    />
                                </div>
                            </div>

                            {/* Footer Fijo con Botón */}
                            <div className={cn("p-10 pt-6 border-t", theme === 'dark' ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white")}>
                                <button
                                    onClick={() => handleCalificar(gradingData.id, activity.tipo)}
                                    className="h-16 w-full text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                    style={{ backgroundColor: 'var(--aula-primary)', boxShadow: '0 20px 40px -10px rgba(var(--aula-primary-rgb), 0.3)' }}
                                >
                                    <Save size={18} /> Confirmar Calificación
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, theme }: any) {
    const colors: any = {
        primary: "text-white",
        amber: "bg-amber-500 text-white",
        emerald: "bg-emerald-500 text-white"
    };
    return (
        <div className={cn("p-6 rounded-[2rem] border flex items-center gap-4 transition-all", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-lg shadow-slate-200/30")}>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", color === 'primary' ? "" : colors[color])}
                style={color === 'primary' ? { backgroundColor: 'var(--aula-primary)' } : {}}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className={cn("text-2xl font-black leading-none", theme === 'dark' ? "text-white" : "text-slate-800")}>{value}</p>
            </div>
        </div>
    );
}

function MetaItem({ icon: Icon, label, value, accent, theme }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all", theme === 'dark' ? "bg-slate-800" : "bg-slate-50")}>
                <Icon size={16} className={accent ? "text-rose-500" : ""} style={!accent ? { color: 'var(--aula-primary)' } : {}} />
            </div>
            <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className={cn("text-[11px] font-black", theme === 'dark' ? "text-slate-200" : "text-slate-700")}>{value}</p>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value, theme }: any) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ color: 'var(--aula-primary)' }}>
                <Icon size={18} />
            </div>
            <div className="flex-1 border-b border-slate-100 dark:border-slate-800 pb-1 flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                <span className={cn("text-xs font-black", theme === 'dark' ? "text-white" : "text-slate-700")}>{value}</span>
            </div>
        </div>
    );
}
