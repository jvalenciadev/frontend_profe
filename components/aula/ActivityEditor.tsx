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
    Target
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
    const [unidades, setUnidades] = useState<any[]>([]);
    const [categorias, setCategorias] = useState<any[]>([]);

    const [form, setForm] = useState({
        unidadId: activityToEdit?.unidadId || '',
        tipo: activityToEdit?.tipo || 'TAREA',
        titulo: activityToEdit?.titulo || '',
        instrucciones: activityToEdit?.instrucciones || '',
        puntajeMax: activityToEdit?.puntajeMax || 10,
        esCalificable: activityToEdit?.esCalificable ?? true,
        fechaInicio: activityToEdit?.fechaInicio ? new Date(activityToEdit.fechaInicio).toISOString().slice(0, 16) : '',
        fechaFin: activityToEdit?.fechaFin ? new Date(activityToEdit.fechaFin).toISOString().slice(0, 16) : '',
        categoriaId: activityToEdit?.categoriaId || '',
        allowFiles: activityToEdit?.allowFiles ?? true,
        allowText: activityToEdit?.allowText ?? true,
        duracion: activityToEdit?.duracion || 60,
        maxIntentos: activityToEdit?.maxIntentos || 1,
        turnoId: activityToEdit?.turnoId || turnoId || '',
        maxArchivos: activityToEdit?.maxArchivos || 1,
        tiposArch: activityToEdit?.tiposArch || 'pdf,doc,docx,jpg,png,zip,rar'
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
    const usedByOthers = allActivities.reduce((sum, act) => {
        const actCatId = (act as any).categoriaId || (act as any).categoria?.id;
        if (actCatId === form.categoriaId && (act as any).esCalificable && (act as any).id !== activityToEdit?.id) {
            return sum + Number((act as any).puntajeMax || 0);
        }
        return sum;
    }, 0);

    const currentBudget = Number(selectedCategory?.ponderacion || 0);
    const availableForMe = currentBudget - usedByOthers;
    const isExceeded = form.esCalificable && selectedCategory && form.puntajeMax > availableForMe;

    useEffect(() => {
        loadData();
    }, [moduloId, turnoId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.titulo) return toast.error('El título es obligatorio');
        setLoading(true);
        try {
            const payload = { ...form, turnoId: form.turnoId || turnoId };
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
                    "w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative p-8 border",
                    theme === 'dark' ? "bg-slate-900/90 border-white/10" : "bg-white/95 border-slate-200"
                )}
            >
                {/* Botón Cerrar Flotante */}
                <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all z-20">
                    <X size={20} />
                </button>

                {/* Header Minimalista y Compacto */}
                <header className="mb-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-6">
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
                    <div className="text-right hidden md:block px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                        <span className="text-[9px] font-black uppercase text-primary tracking-tighter block">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Registro Sincronizado</span>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* GRID PRINCIPAL: 2 Columnas para compactar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* 00: UNIDAD TEMÁTICA - Selector de destino */}
                        {unidades.length > 1 && (
                            <div className="col-span-full space-y-3 bg-amber-50/80 dark:bg-amber-500/5 p-5 rounded-2xl border border-amber-200 dark:border-amber-500/20">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-[10px] font-black py-1 px-3 bg-amber-500 text-white rounded-full tracking-widest">UT</span>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">Unidad Temática de Destino</h3>
                                </div>
                                <select
                                    value={form.unidadId}
                                    onChange={(e) => setForm({ ...form, unidadId: e.target.value })}
                                    className={cn(
                                        "w-full h-12 px-5 rounded-2xl border-2 font-black text-sm outline-none appearance-none",
                                        theme === 'dark'
                                            ? "bg-slate-800 border-amber-500/30 text-white focus:border-amber-500"
                                            : "bg-white border-amber-200 text-slate-900 focus:border-amber-500"
                                    )}
                                >
                                    {unidades.map((u: any) => (
                                        <option key={u.id} value={u.id}>
                                            Semana {u.semana} – {u.titulo}
                                        </option>
                                    ))}
                                </select>
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
                                <CompactTypeButton active={form.tipo === 'CUESTIONARIO'} icon={HelpCircle} label="Examen" onClick={() => setForm({ ...form, tipo: 'CUESTIONARIO' })} theme={theme} />
                            </div>
                        </div>

                        {/* 02: ESPECIFICACIONES (Título y Puntos) */}
                        <div className="space-y-4 bg-white dark:bg-transparent p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-black py-1 px-3 bg-slate-900 dark:bg-white/20 text-white rounded-full tracking-widest">02</span>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Especificaciones</h3>
                            </div>

                            <div className="space-y-4">
                                {/* Título en su propia fila para máximo espacio (RESPONDE ESTAS PREGUNTAS) */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Título de la Actividad</label>
                                    <textarea
                                        value={form.titulo}
                                        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                                        rows={2}
                                        className={cn(
                                            "w-full px-5 py-3 rounded-2xl border-2 transition-all text-base font-black outline-none shadow-sm resize-none",
                                            theme === 'dark' ? "bg-slate-800/50 border-slate-700 focus:border-primary text-white" : "bg-slate-50 border-slate-100 focus:border-primary text-slate-900"
                                        )}
                                        placeholder="Nombre oficial de la actividad..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Puntos</label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                value={form.puntajeMax}
                                                onChange={(e) => setForm({ ...form, puntajeMax: Number(e.target.value) })}
                                                className={cn(
                                                    "w-full px-5 py-3 rounded-2xl border-2 transition-all text-base font-black outline-none",
                                                    theme === 'dark' ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100 text-slate-900",
                                                    isExceeded && "border-rose-500 focus:border-rose-500"
                                                )}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-black">PTS</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Calificable</label>
                                        <div className="flex h-[52px] items-center gap-3 bg-slate-50 dark:bg-white/5 px-4 rounded-2xl border border-slate-100 dark:border-white/5 cursor-pointer active:scale-95 transition-all"
                                            onClick={() => setForm({ ...form, esCalificable: !form.esCalificable })}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                                form.esCalificable ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700"
                                            )}>
                                                <Check size={14} />
                                            </div>
                                            <span className={cn("text-[10px] font-black", form.esCalificable ? "text-primary" : "text-slate-500")}>
                                                {form.esCalificable ? 'SÍ' : 'NO'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 03: CARTERA (Presupuesto) */}
                        <div className="space-y-4">
                            {selectedCategory ? (
                                <div className={cn(
                                    "p-6 rounded-3xl border transition-all h-full relative overflow-hidden",
                                    theme === 'dark' ? "bg-primary/5 border-primary/20" : "bg-primary/10 border-primary/20"
                                )}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", isExceeded ? "bg-rose-500 text-white" : "bg-primary text-white")}>
                                                <Trophy size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Presupuesto</p>
                                                <h4 className={cn("text-sm font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>{selectedCategory.nombre}</h4>
                                            </div>
                                        </div>
                                        <div className={cn("px-4 py-2 rounded-xl text-[10px] font-black flex flex-col items-end", isExceeded ? "bg-rose-500 text-white animate-pulse" : "bg-emerald-500 text-white")}>
                                            <span>{Math.max(0, availableForMe - (form.esCalificable ? form.puntajeMax : 0))} PTS</span>
                                            <span className="text-[7px] opacity-80 underline uppercase tracking-tighter">Libres en Cartera</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, ((currentBudget - availableForMe + (form.esCalificable ? form.puntajeMax : 0)) / currentBudget) * 100)}%` }}
                                                className={cn("h-full rounded-full transition-all duration-1000", isExceeded ? "bg-rose-500" : "bg-primary")}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 px-1">
                                            <span>Uso: {usedByOthers + (form.esCalificable ? form.puntajeMax : 0)} pts</span>
                                            <span>Límite: {currentBudget} pts</span>
                                        </div>
                                    </div>
                                    {isExceeded && (
                                        <p className="text-[8px] font-bold text-rose-500 mt-3 flex items-center gap-1">
                                            <AlertCircle size={10} /> ERROR: SE EXCEDIERON LOS PUNTOS DE LA CARTERA
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center h-full">
                                    <Target size={24} className="text-slate-300 mb-2" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sin Cartera Vinculada</p>
                                </div>
                            )}
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
                                            <h4 className={cn("text-[10px] font-black uppercase tracking-tighter leading-none mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>{cat.nombre}</h4>
                                            <p className="text-[8px] font-bold text-primary">{cat.ponderacion}%</p>
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
                                                onClick={() => setForm({...form, allowFiles: !form.allowFiles})}
                                                className={cn("flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2", form.allowFiles ? "bg-emerald-500 text-white border-transparent" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400")}
                                            >
                                                <Archive size={20} />
                                                <span className="text-[9px] font-black uppercase">Archivos</span>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setForm({...form, allowText: !form.allowText})}
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
                                                        onChange={e => setForm({...form, maxArchivos: parseInt(e.target.value)})}
                                                        className={cn("w-full h-10 px-4 rounded-xl border font-black text-xs outline-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500" : "bg-white border-slate-200 focus:border-emerald-500")}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Extensiones (coma)</label>
                                                    <input 
                                                        type="text" 
                                                        value={form.tiposArch} 
                                                        onChange={e => setForm({...form, tiposArch: e.target.value})}
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

                            {form.tipo === 'CUESTIONARIO' && (
                                <motion.div 
                                    key="quiz-settings"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6"
                                >
                                    <div className="bg-violet-500/5 border border-violet-500/10 p-6 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-violet-500 text-white flex items-center justify-center">
                                                <Clock size={16} />
                                            </div>
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-violet-600">Lineamientos del Examen</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Duración (Min)</label>
                                                <input 
                                                    type="number" 
                                                    value={form.duracion} 
                                                    onChange={e => setForm({...form, duracion: parseInt(e.target.value)})}
                                                    className={cn("w-full h-12 px-4 rounded-xl border-2 font-black text-sm outline-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white focus:border-violet-500" : "bg-slate-50 border-slate-100 focus:border-violet-500")}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Intentos Máx.</label>
                                                <input 
                                                    type="number" 
                                                    value={form.maxIntentos} 
                                                    onChange={e => setForm({...form, maxIntentos: parseInt(e.target.value)})}
                                                    className={cn("w-full h-12 px-4 rounded-xl border-2 font-black text-sm outline-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white focus:border-violet-500" : "bg-slate-50 border-slate-100 focus:border-violet-500")}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col justify-center">
                                        <p className="text-[10px] font-bold text-slate-400 italic">El cronómetro se iniciará automáticamente cuando el estudiante entre al examen. Los intentos se guardarán en el historial.</p>
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
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Apertura</label>
                                        <input type="datetime-local" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} className={cn("w-full px-4 py-2 rounded-xl border transition-all font-bold text-xs outline-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200")} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Cierre</label>
                                        <input type="datetime-local" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} className={cn("w-full px-4 py-2 rounded-xl border transition-all font-bold text-xs outline-none", theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200")} />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Lineamientos Académicos</h3>
                                </div>
                                <textarea
                                    value={form.instrucciones}
                                    onChange={e => setForm({ ...form, instrucciones: e.target.value })}
                                    rows={4}
                                    className={cn(
                                        "w-full p-4 rounded-2xl border-2 transition-all font-medium text-sm outline-none resize-none",
                                        theme === 'dark' ? "bg-slate-800/50 border-slate-700 focus:border-primary text-white" : "bg-slate-50 border-slate-100 focus:border-primary"
                                    )}
                                    placeholder="Especifique los lineamientos aquí..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:text-rose-500 transition-colors">Abortar Operación</button>
                        <button
                            type="submit"
                            disabled={loading || (form.esCalificable && isExceeded)}
                            className={cn(
                                "px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl transition-all disabled:opacity-50 active:scale-95 flex items-center gap-3",
                                isExceeded ? "bg-rose-500 text-white" : "bg-slate-900 dark:bg-primary text-white hover:scale-105"
                            )}
                        >
                            {loading && <Clock className="animate-spin" size={16} />}
                            {loading ? 'Procesando...' : (activityToEdit ? 'Guardar Cambios' : 'Publicar Actividad')}
                        </button>
                    </div>
                </form>
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
