'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    X,
    XCircle,
    Save,
    MessageSquare,
    FileText,
    HelpCircle,
    CheckCircle2,
    AlertCircle,
    Trophy,
    Info,
    Layout,
    Archive,
    Clock,
    UserPlus,
    Check,
    Target,
    CalendarCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ActivityEditorProps {
    moduloId: string;
    onClose: () => void;
    onSuccess: () => void;
    theme: 'light' | 'dark';
    initialUnitId?: string;
    activityToEdit?: any;
    turnoId?: string;
}

export default function ActivityEditor({ moduloId, onClose, onSuccess, theme, initialUnitId, activityToEdit, turnoId }: ActivityEditorProps) {
    const [loading, setLoading] = useState(false);
    const isDark = theme === 'dark';
    const [unidades, setUnidades] = useState<any[]>([]);
    const [categorias, setCategorias] = useState<any[]>([]);

    const [form, setForm] = useState({
        unidadId: activityToEdit?.unidadId || '',
        tipo: activityToEdit?.tipo || 'TAREA',
        titulo: activityToEdit?.titulo || '',
        instrucciones: activityToEdit?.instrucciones || '',
        puntajeMax: activityToEdit?.puntajeMax || 100,
        esCalificable: activityToEdit?.esCalificable ?? true,
        fechaInicio: activityToEdit?.fechaInicio
            ? new Date(activityToEdit.fechaInicio).toISOString().slice(0, 16)
            : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}T00:00`,
        fechaFin: activityToEdit?.fechaFin
            ? new Date(activityToEdit.fechaFin).toISOString().slice(0, 16)
            : `${new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).getFullYear()}-${String(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).getMonth() + 1).padStart(2, '0')}-${String(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).getDate()).padStart(2, '0')}T23:59`,
        categoriaId: activityToEdit?.categoriaId || '',

        // Tarea flags
        allowFiles: activityToEdit?.tarea?.allowFiles ?? activityToEdit?.allowFiles ?? true,
        allowText: activityToEdit?.tarea?.allowText ?? activityToEdit?.allowText ?? false,
        maxArchivos: activityToEdit?.tarea?.maxArchivos ?? activityToEdit?.maxArchivos ?? 1,
        tiposArch: activityToEdit?.tarea?.tiposArch ?? activityToEdit?.tiposArch ?? 'pdf,doc,docx,jpg,png,zip,rar',

        // Cuestionario flags
        duracion: activityToEdit?.cuestionario?.duracion ?? activityToEdit?.duracion ?? 20,
        maxIntentos: activityToEdit?.cuestionario?.maxIntentos ?? activityToEdit?.maxIntentos ?? 1,

        // Foro flags
        permitirFiles: activityToEdit?.foro?.permitirFiles ?? activityToEdit?.permitirFiles ?? false,
        foroMaxArch: activityToEdit?.foro?.maxArchivos ?? activityToEdit?.foroMaxArch ?? 1,

        turnoId: activityToEdit?.turnoId || turnoId || '',
        mod_asi_presencial: activityToEdit?.asistencia?.esPresencial ?? activityToEdit?.esPresencial ?? activityToEdit?.mod_asi_presencial ?? true,
        esPresencial: activityToEdit?.asistencia?.esPresencial ?? activityToEdit?.esPresencial ?? activityToEdit?.mod_asi_presencial ?? true
    });

    const loadData = async () => {
        try {
            const [courseData, c] = await Promise.all([
                aulaService.getCursoDetalle(moduloId, turnoId),
                aulaService.getCategorias(moduloId, turnoId)
            ]);
            const u = courseData?.mod_unidades || [];
            setUnidades(u);
            setCategorias(c);
            setForm(f => ({
                ...f,
                unidadId: f.unidadId || initialUnitId || (u.length > 0 ? u[0].id : ''),
                categoriaId: f.categoriaId || (c.length > 0 ? c[0].id : '')
            }));
        } catch (err) {
            toast.error('Error al cargar datos auxiliares');
        }
    }

    const selectedCategory = categorias.find(c => c.id === form.categoriaId);
    const allActivities = unidades.flatMap(u => (u as any).actividades || []);

    const getActivityLabel = () => {
        const types: any = { 'TAREA': 'Tarea', 'FORO': 'Foro', 'CUESTIONARIO': 'Cuestionario', 'ASISTENCIA': 'Asistencia' };
        return `${types[form.tipo] || 'Actividad'} ${form.esCalificable ? 'Evaluativo' : 'Informativo'}`;
    };

    useEffect(() => {
        loadData();
    }, [moduloId, turnoId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.titulo) return toast.error('El título es obligatorio');

        // ─── VALIDACIÓN DE CRONOGRAMA ───────────────────────────
        if (form.fechaInicio && form.fechaFin) {
            const inicio = new Date(form.fechaInicio);
            const fin = new Date(form.fechaFin);
            if (fin <= inicio) {
                return toast.error('ERROR LÓGICO: La fecha de cierre no puede ser anterior o igual a la de apertura. Por favor, verifique el cronograma.');
            }
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                turnoId: form.turnoId || turnoId,
                asistencia: form.tipo === 'ASISTENCIA' ? { esPresencial: form.esPresencial, mod_asi_presencial: form.mod_asi_presencial } : undefined
            };

            if (activityToEdit) {
                await aulaService.actualizarActividad(activityToEdit.id, payload);
                toast.success('Actividad actualizada');
            } else {
                await aulaService.crearActividad(payload);
                toast.success('Actividad creada');
            }
            onSuccess();
        } catch (err) {
            toast.error('Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                    "w-full max-w-6xl h-[92vh] flex flex-col",
                    theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white",
                    "rounded-[3rem] shadow-2xl relative overflow-hidden"
                )}
            >

                {/* Header Minimalista y Compacto */}
                <header className="px-10 py-6 flex items-center justify-between border-b border-slate-100 dark:border-white/5 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Save size={20} />
                        </div>
                        <div>
                            <h2 className={cn("text-xl font-black tracking-tight leading-none mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                {activityToEdit ? 'Configurar' : 'Nueva'} <span className="text-primary">Actividad</span>
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                Gestión académica institucional v2.4
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />

                        <button
                            type="button"
                            onClick={onClose}
                            className="group w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                            <X size={20} className="transition-transform group-hover:rotate-90" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-10 px-10 py-8">
                        {/* GRID PRINCIPAL: 2 Columnas para compactar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* 00: UNIDAD TEMÁTICA - Selector de destino */}
                            {unidades.length > 1 && (
                                <div className="col-span-full space-y-4">
                                    <div className="flex items-center gap-3 px-6">
                                        <span className="text-[10px] font-black py-1 px-3 bg-indigo-500 text-white rounded-full tracking-widest shadow-lg shadow-indigo-500/20">UT</span>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Unidad Temática de Destino</h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {unidades.map((u: any) => {
                                            const isActive = form.unidadId === u.id;
                                            return (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, unidadId: u.id })}
                                                    className={cn(
                                                        "relative flex items-center p-4 rounded-[1.5rem] border-2 transition-all transition-transform active:scale-95 group text-left",
                                                        isActive
                                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-4 ring-indigo-500/5"
                                                            : theme === 'dark'
                                                                ? "bg-slate-800/50 border-white/5 hover:border-white/10"
                                                                : "bg-white/50 border-slate-100 hover:border-slate-300 shadow-sm"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all font-black text-xs",
                                                        isActive ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-500"
                                                    )}>
                                                        {u.semana}
                                                    </div>
                                                    <div className="ml-4 overflow-hidden">
                                                        <p className={cn("text-[8px] font-black uppercase tracking-widest leading-none mb-1 transition-colors", isActive ? "text-indigo-500" : "text-slate-400")}>Semana</p>
                                                        <h4 className={cn("text-[11px] font-black leading-tight transition-all", isActive ? (theme === 'dark' ? "text-white" : "text-slate-900") : (theme === 'dark' ? "text-slate-500" : "text-slate-600"))}>{u.titulo}</h4>
                                                    </div>
                                                    {isActive && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
                                                            <Check size={10} className="text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 01: NATURALEZA (Tipo) */}
                            <div className="col-span-full space-y-4 bg-slate-50/50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-black py-1 px-3 bg-primary text-white rounded-full tracking-widest">01</span>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Naturaleza</h3>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <CompactTypeButton active={form.tipo === 'TAREA'} icon={FileText} label="Tarea" onClick={() => setForm({ ...form, tipo: 'TAREA' })} theme={theme} />
                                    <CompactTypeButton active={form.tipo === 'FORO'} icon={MessageSquare} label="Foro" onClick={() => setForm({ ...form, tipo: 'FORO' })} theme={theme} />
                                    <CompactTypeButton active={form.tipo === 'CUESTIONARIO'} icon={HelpCircle} label="Cuestionario" onClick={() => setForm({ ...form, tipo: 'CUESTIONARIO' })} theme={theme} />
                                    <CompactTypeButton active={form.tipo === 'ASISTENCIA'} icon={CalendarCheck} label="Asistencia" onClick={() => setForm({ ...form, tipo: 'ASISTENCIA' })} theme={theme} />
                                </div>
                            </div>

                            {/* 02: ESPECIFICACIONES ACADÉMICAS */}
                            <div className="col-span-full">
                                <div className={cn("p-6 rounded-[2rem] border space-y-6 transition-all relative overflow-hidden", theme === 'dark' ? "bg-slate-900/50 border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 dark:border-white/5 pb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black py-1 px-2.5 bg-primary text-white rounded-lg tracking-widest shadow-lg shadow-primary/20">02</span>
                                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Especificaciones Académicas</h3>
                                        </div>

                                        {selectedCategory && (
                                            <div className="flex items-center gap-3 bg-indigo-500/5 dark:bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/10">
                                                <div className="flex items-center gap-2">
                                                    <Trophy size={12} className="text-indigo-500" />
                                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">{selectedCategory.nombre}</span>
                                                </div>
                                                <div className="w-px h-3 bg-indigo-500/20" />
                                                <div className="flex items-center gap-1.5 font-black">
                                                    <span className="text-[7px] uppercase text-slate-400">Peso:</span>
                                                    <span className="text-[10px] text-indigo-500">{selectedCategory.ponderacion}%</span>
                                                </div>
                                                <div className="w-px h-3 bg-indigo-500/20" />
                                                <div className="flex items-center gap-1.5 font-black">
                                                    <span className="text-[7px] uppercase text-slate-400">Actividades:</span>
                                                    <span className="text-[10px] text-indigo-500">
                                                        {allActivities.filter(a => ((a as any).categoriaId || (a as any).categoria?.id) === form.categoriaId).length + (activityToEdit ? 0 : 1)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Título de la Actividad</label>
                                            <textarea
                                                value={form.titulo}
                                                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                                                rows={2}
                                                className={cn(
                                                    "w-full px-5 py-3 rounded-2xl border-2 transition-all text-base font-black outline-none shadow-sm resize-none",
                                                    theme === 'dark' ? "bg-slate-800/50 border-slate-700 focus:border-primary text-white" : "bg-slate-50 border-slate-100 focus:border-primary text-slate-900"
                                                )}
                                                placeholder="Nombre oficial..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Puntaje Máximo</label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    value={form.puntajeMax}
                                                    readOnly
                                                    className={cn(
                                                        "w-full h-11 px-5 rounded-xl border-2 transition-all text-base font-black outline-none opacity-60 cursor-not-allowed",
                                                        theme === 'dark' ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100 text-slate-900"
                                                    )}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary text-[7px] font-black tracking-widest uppercase opacity-60">100% fijo</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Modalidad</label>
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, esCalificable: !form.esCalificable })}
                                                className={cn(
                                                    "w-full h-11 flex items-center justify-between px-5 rounded-xl border-2 transition-all active:scale-95",
                                                    form.esCalificable
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : theme === 'dark' ? "bg-slate-800/50 border-slate-700 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded flex items-center justify-center transition-all",
                                                        form.esCalificable ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700"
                                                    )}>
                                                        <Check size={10} />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{form.esCalificable ? 'Calificable' : 'Formativa'}</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 03 (Estructura) */}
                            <div className="col-span-full space-y-4 bg-slate-50/50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-black py-1 px-3 bg-primary text-white rounded-full tracking-widest">03</span>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Categoría de Calificación</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {categorias.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setForm({ ...form, categoriaId: cat.id })}
                                            className={cn(
                                                "relative p-3 rounded-2xl border-2 transition-all text-left flex items-center gap-3",
                                                form.categoriaId === cat.id
                                                    ? "border-primary bg-white dark:bg-slate-800 shadow-md ring-2 ring-primary/10"
                                                    : "border-transparent bg-white dark:bg-white/5 hover:border-primary/50"
                                            )}
                                        >
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", form.categoriaId === cat.id ? "bg-primary text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400")}>
                                                <Target size={16} />
                                            </div>
                                            <div>
                                                <h4 className={cn("text-[10px] font-black uppercase tracking-tighter leading-none mb-1", form.categoriaId === cat.id ? "text-primary" : (theme === 'dark' ? "text-white" : "text-slate-900"))}>{cat.nombre}</h4>
                                                <p className="text-[8px] font-bold text-slate-400">
                                                    {cat.ponderacion}% • {allActivities.filter(a => (a.categoriaId || (a as any).categoria?.id) === cat.id).length} activs.
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CONFIGURACIONES ESPECÍFICAS (DINÁMICO) */}
                            <AnimatePresence mode="wait">
                                {form.tipo === 'TAREA' && (
                                    <motion.div
                                        key="tarea-settings"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                                                    <Archive size={16} />
                                                </div>
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Configuración de Entrega</h3>
                                            </div>
                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, allowFiles: !form.allowFiles })}
                                                    className={cn("flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2", form.allowFiles ? "bg-emerald-500 text-white border-transparent" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400")}
                                                >
                                                    <Archive size={20} />
                                                    <span className="text-[9px] font-black uppercase">Archivos</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, allowText: !form.allowText })}
                                                    className={cn("flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2", form.allowText ? "bg-emerald-500 text-white border-transparent" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400")}
                                                >
                                                    <FileText size={20} />
                                                    <span className="text-[9px] font-black uppercase">Texto Online</span>
                                                </button>
                                            </div>

                                            {form.allowFiles && (
                                                <div className="grid grid-cols-2 gap-4 pt-2">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Cant. Archivos</label>
                                                        <input
                                                            type="number"
                                                            value={form.maxArchivos}
                                                            onChange={e => setForm({ ...form, maxArchivos: parseInt(e.target.value) })}
                                                            className={cn("w-full h-10 px-4 rounded-xl border font-black text-xs outline-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500" : "bg-white border-slate-200 focus:border-emerald-500")}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Extensiones (coma)</label>
                                                        <input
                                                            type="text"
                                                            value={form.tiposArch}
                                                            onChange={e => setForm({ ...form, tiposArch: e.target.value })}
                                                            placeholder="pdf,zip,docx"
                                                            className={cn("w-full h-10 px-4 rounded-xl border font-black text-xs outline-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500" : "bg-white border-slate-200 focus:border-emerald-500")}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col justify-center">
                                            <p className="text-[10px] font-bold text-slate-400 italic">Configure los límites de la entrega. Puede restringir el tipo de archivo y la cantidad de documentos que el estudiante puede adjuntar.</p>
                                        </div>
                                    </motion.div>
                                )}


                                {form.tipo === 'FORO' && (
                                    <motion.div
                                        key="foro-settings"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                                                    <MessageSquare size={16} />
                                                </div>
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Configuración del Foro</h3>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-3">
                                                        <Archive size={18} className="text-amber-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Permitir Archivos</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm({ ...form, permitirFiles: !form.permitirFiles })}
                                                        className={cn(
                                                            "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                                            form.permitirFiles ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-4 h-4 bg-white rounded-full transition-all duration-300 transform",
                                                            form.permitirFiles ? "translate-x-6" : "translate-x-0"
                                                        )} />
                                                    </button>
                                                </div>

                                                {form.permitirFiles && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Máx. Archivos por Post</label>
                                                        <input
                                                            type="number"
                                                            value={form.foroMaxArch}
                                                            onChange={e => setForm({ ...form, foroMaxArch: parseInt(e.target.value) })}
                                                            className={cn("w-full h-10 px-4 rounded-xl border font-black text-xs outline-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white focus:border-amber-500" : "bg-white border-slate-200 focus:border-amber-500")}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col justify-center">
                                            <p className="text-[10px] font-bold text-slate-400 italic">Los foros permiten la interacción asíncrona. Puede configurar si los estudiantes pueden adjuntar evidencias en sus participaciones.</p>
                                        </div>
                                    </motion.div>
                                )}

                                {(form.tipo === 'CUESTIONARIO' || form.tipo === 'FORMULARIO') && (
                                    <motion.div
                                        key="quiz-settings"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
                                                    <HelpCircle size={16} />
                                                </div>
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Configuración del Cuestionario</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Duración (Minutos)</label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="number"
                                                            value={form.duracion}
                                                            onChange={e => setForm({ ...form, duracion: parseInt(e.target.value) })}
                                                            className={cn("w-full h-11 pl-10 pr-4 rounded-xl border font-black text-xs outline-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-200 focus:border-indigo-500")}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest italic">Nota: Los intentos se configuran desde el gestor de preguntas.</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col justify-center">
                                            <p className="text-[10px] font-bold text-slate-400 italic">Establezca el tiempo límite para completar la evaluación. Una vez finalizado este tiempo, el intento se cerrará automáticamente.</p>
                                        </div>
                                    </motion.div>
                                )}

                                {form.tipo === 'ASISTENCIA' && (
                                    <motion.div
                                        key="asistencia-settings"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                                                    <CalendarCheck size={16} />
                                                </div>
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Modalidad de Asistencia</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, mod_asi_presencial: true, esPresencial: true })}
                                                    className={cn("flex flex-col items-center justify-center gap-2 h-20 rounded-2xl border-2 transition-all",
                                                        form.mod_asi_presencial ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-md" : "border-slate-100 dark:border-slate-800 text-slate-400"
                                                    )}
                                                >
                                                    <UserPlus size={20} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Presencial</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, mod_asi_presencial: false, esPresencial: false })}
                                                    className={cn("flex flex-col items-center justify-center gap-2 h-20 rounded-2xl border-2 transition-all",
                                                        !form.mod_asi_presencial ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 shadow-md" : "border-slate-100 dark:border-slate-800 text-slate-400"
                                                    )}
                                                >
                                                    <Layout size={20} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Virtual</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col justify-center">
                                            <p className="text-[10px] font-bold text-slate-400 italic">Determine si el registro de asistencia se asociará a una sesión física en el aula o a una actividad virtual/remota.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black py-1 px-3 bg-primary text-white rounded-full tracking-widest">04</span>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Cronograma</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {form.tipo === 'ASISTENCIA' ? (
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-primary ml-1">Fecha de la Sesión</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={form.fechaInicio ? form.fechaInicio.split('T')[0] : ''}
                                                        onChange={(e) => setForm({
                                                            ...form,
                                                            fechaInicio: `${e.target.value}T00:00`,
                                                            fechaFin: `${e.target.value}T23:59`
                                                        })}
                                                        className={cn(
                                                            "w-full px-5 py-3 rounded-2xl border-2 transition-all font-black text-sm outline-none uppercase tracking-tighter",
                                                            theme === 'dark' ? "bg-slate-800 border-slate-700 text-white focus:border-primary" : "bg-slate-50 border-slate-200 focus:border-primary"
                                                        )}
                                                    />
                                                </div>
                                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest ml-1">Solo se requiere la fecha del día</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Apertura</label>
                                                    <input type="datetime-local" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} className={cn("w-full px-4 py-2 rounded-xl border transition-all font-bold text-xs outline-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200")} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Cierre</label>
                                                    <input type="datetime-local" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} className={cn("w-full px-4 py-2 rounded-xl border transition-all font-bold text-xs outline-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200")} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-4">
                                    <div className="space-y-4 bg-white dark:bg-black/20 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3 mb-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Lineamientos Académicos</label>
                                        </div>
                                        <textarea
                                            value={form.instrucciones}
                                            onChange={e => setForm({ ...form, instrucciones: e.target.value })}
                                            rows={6}
                                            className={cn(
                                                "w-full p-6 rounded-[2rem] border-2 transition-all font-medium text-sm outline-none resize-none",
                                                theme === 'dark' ? "bg-slate-800/50 border-slate-700 focus:border-primary text-white" : "bg-slate-50 border-slate-100 focus:border-primary shadow-sm"
                                            )}
                                            placeholder="Detalla aquí los lineamientos, instrucciones y objetivos de la actividad..."
                                        />
                                    </div>
                                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em] italic ml-1">
                                        Consejo: Una buena descripción aumenta el compromiso del estudiante.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                            <button type="button" onClick={onClose} className="text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:text-rose-500 transition-colors">Abortar Operación</button>
                            <button
                                type="submit"
                                className="px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl transition-all disabled:opacity-50 active:scale-95 flex items-center gap-3 bg-slate-900 dark:bg-primary text-white hover:scale-105"
                            >
                                {loading && <Clock className="animate-spin" size={16} />}
                                {loading ? 'Procesando...' : (activityToEdit ? 'Guardar Cambios' : 'Publicar Actividad')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

function CompactTypeButton({ active, icon: Icon, label, onClick, theme }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all relative overflow-hidden group active:scale-95 shadow-sm",
                active
                    ? "border-primary bg-white dark:bg-slate-800 text-primary ring-2 ring-primary/5"
                    : theme === 'dark' ? "border-transparent bg-white/5 text-slate-500 hover:border-white/10" : "border-transparent bg-white text-slate-400 hover:border-primary/20"
            )}
        >
            <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                active ? "bg-primary text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400"
            )}>
                <Icon size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}
