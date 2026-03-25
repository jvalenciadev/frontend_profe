'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Settings2, ShieldCheck, List, ToggleLeft, Loader2, RefreshCcw, Info, Hash, Type, GripVertical } from 'lucide-react';
import { userService } from '@/services/userService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TIPOS_CAMPO = [
    { value: 'TEXTO', label: 'Texto Libre', icon: Edit2 },
    { value: 'BOOLEAN', label: 'Sí/No (Checkbox)', icon: ToggleLeft },
    { value: 'SINGLE_SELECT', label: 'Selección Única', icon: List },
    { value: 'MULTIPLE_SELECT', label: 'Selección Múltiple', icon: List },
];

export default function CamposExtraAdminPage() {
    const [campos, setCampos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCampo, setCurrentCampo] = useState<any>(null);
    const [formData, setFormData] = useState({
        label: '',
        tipo: 'TEXTO',
        esObligatorio: false,
        orden: 0,
        opciones: [] as string[]
    });
    const [newOption, setNewOption] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await userService.getCamposExtra();
            setCampos(data);
        } catch (error) {
            toast.error("Error cargando campos extra");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (campo: any = null) => {
        setCurrentCampo(campo);
        if (campo) {
            setFormData({
                label: campo.label,
                tipo: campo.tipo,
                esObligatorio: campo.esObligatorio,
                orden: campo.orden || 0,
                opciones: campo.opciones || [],
            });
        } else {
            setFormData({ label: '', tipo: 'TEXTO', esObligatorio: false, orden: campos.length + 1, opciones: [] });
        }
        setNewOption('');
        setIsModalOpen(true);
    };

    const handleAddOption = () => {
        if (!newOption.trim()) return;
        if (formData.opciones.includes(newOption.trim())) {
            toast.error("La opción ya existe");
            return;
        }
        setFormData(prev => ({ ...prev, opciones: [...prev.opciones, newOption.trim()] }));
        setNewOption('');
    };

    const handleRemoveOption = (opt: string) => {
        setFormData(prev => ({ ...prev, opciones: prev.opciones.filter(o => o !== opt) }));
    };

    const handleSave = async () => {
        if (!formData.label.trim()) return toast.error("El nombre del campo es obligatorio");
        if ((formData.tipo === 'SINGLE_SELECT' || formData.tipo === 'MULTIPLE_SELECT') && formData.opciones.length === 0) {
            return toast.error("Debe agregar al menos una opción para las listas de selección");
        }

        setIsSaving(true);
        try {
            if (currentCampo) {
                await userService.updateCampoExtra(currentCampo.id, formData);
                toast.success("Campo actualizado exitosamente");
            } else {
                await userService.createCampoExtra(formData);
                toast.success("Campo creado exitosamente");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Error al guardar el campo");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de inhabilitar este campo? Los usuarios ya no lo verán.") === true) {
            try {
                await userService.deleteCampoExtra(id);
                toast.success("Campo eliminado");
                fetchData();
            } catch (error) {
                toast.error("Error al eliminar el campo");
            }
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        <Settings2 size={14} /> Gestión de Personal
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Campos Extra de Usuarios</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xl">
                        Configura campos dinámicos que se solicitarán en el Aula Virtual (LMS) para enriquecer el Perfil Institucional y Kardex de los usuarios matriculados.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchData} 
                        className="w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary/30 transition-all active:scale-95"
                    >
                        <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={16} /> Crear Campo
                    </button>
                </div>
            </header>

            {/* List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Cargando esquema...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {campos.map((campo, index) => {
                            const TipoIcon = TIPOS_CAMPO.find(t => t.value === campo.tipo)?.icon || Edit2;
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={campo.id}
                                    className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between min-h-[180px]"
                                >
                                    <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                    
                                    <div className="flex justify-between items-start pl-2">
                                        <div className="space-y-1 pr-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                                    <TipoIcon size={16} />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                    Orden: {campo.orden}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                                                {campo.label}
                                            </h3>
                                            <div className="flex items-center gap-3 pt-2">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                    {TIPOS_CAMPO.find(t => t.value === campo.tipo)?.label}
                                                </span>
                                                {campo.esObligatorio && (
                                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                        <ShieldCheck size={10} /> Obligatorio
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal(campo)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(campo.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {(campo.tipo === 'SINGLE_SELECT' || campo.tipo === 'MULTIPLE_SELECT') && campo.opciones && (
                                        <div className="pl-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {campo.opciones.slice(0, 3).map((opt: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[9px] font-bold text-slate-500">
                                                        {opt}
                                                    </span>
                                                ))}
                                                {campo.opciones.length > 3 && (
                                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-black text-slate-400">
                                                        +{campo.opciones.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Premium Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                    >
                        {/* Backdrop with strong blur */}
                        <div 
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setIsModalOpen(false)}
                        />

                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                            className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-full border border-slate-200/50 dark:border-slate-700/50"
                        >
                            {/* Decorative Header Background */}
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/5 opacity-50 pointer-events-none" />

                            {/* Header */}
                            <div className="relative p-8 pb-6 flex justify-between items-start">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary shrink-0 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-primary/10 scale-0 group-hover:scale-100 transition-transform rounded-2xl" />
                                        <Settings2 size={24} className="relative z-10" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                            {currentCampo ? 'Actualizar Campo' : 'Nuevo Registro'}
                                        </h2>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                            Configuración de Variables de Usuario
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="relative p-8 pt-2 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                                
                                {/* Label Input */}
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-2">
                                        <Type className="w-3 h-3 text-primary" /> Nombre del Campo
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.label}
                                            onChange={e => setFormData({ ...formData, label: e.target.value })}
                                            className="w-full h-14 pl-5 pr-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black text-slate-700 dark:text-slate-200 placeholder:text-slate-400 placeholder:font-bold"
                                            placeholder="Ej: Número de RDA, Región, Carnet..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Type Select */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-2">
                                            <List className="w-3 h-3 text-primary" /> Naturaleza del Dato
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.tipo}
                                                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                                className="w-full h-14 px-5 pr-10 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                                            >
                                                {TIPOS_CAMPO.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Input */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-2">
                                            <Hash className="w-3 h-3 text-primary" /> Posición Visual
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.orden}
                                            onChange={e => setFormData({ ...formData, orden: Number(e.target.value) })}
                                            className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black text-slate-700 dark:text-slate-200 text-center sm:text-left"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {/* Stunning Mandatory Toggle */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, esObligatorio: !formData.esObligatorio })}
                                        className={cn(
                                            "flex items-center justify-between w-full p-5 rounded-[1.5rem] border-2 transition-all group/toggle",
                                            formData.esObligatorio
                                                ? "bg-amber-500/10 border-amber-500/20 shadow-[0_8px_30px_rgb(245,158,11,0.12)]"
                                                : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                                formData.esObligatorio ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                                            )}>
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div>
                                                <span className={cn(
                                                    "block text-sm font-black uppercase tracking-wide transition-colors",
                                                    formData.esObligatorio ? "text-amber-600 dark:text-amber-500" : "text-slate-700 dark:text-slate-300"
                                                )}>
                                                    Exigir al Estudiante
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-1">
                                                    <Info size={12}/> Bloquea acceso si no se completa
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-14 h-8 rounded-full p-1 transition-colors relative shrink-0",
                                            formData.esObligatorio ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                                        )}>
                                            <div className={cn(
                                                "w-6 h-6 bg-white rounded-full transition-transform shadow-md",
                                                formData.esObligatorio ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </div>
                                    </button>
                                </div>

                                {/* Options Builder */}
                                {(formData.tipo === 'SINGLE_SELECT' || formData.tipo === 'MULTIPLE_SELECT') && (
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] space-y-4 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
                                        
                                        <div className="flex items-center justify-between relative z-10">
                                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                                <List className="w-3 h-3 text-primary" /> Opciones de Lista
                                            </label>
                                            <span className="text-[9px] font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-md text-slate-400">
                                                {formData.opciones.length} en total
                                            </span>
                                        </div>
                                        
                                        <div className="flex gap-2 relative z-10">
                                            <input
                                                type="text"
                                                value={newOption}
                                                onChange={e => setNewOption(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddOption();
                                                    }
                                                }}
                                                className="flex-1 h-12 pl-4 pr-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-700 dark:text-slate-200 focus:border-primary outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400 placeholder:font-bold"
                                                placeholder="Ej: Licenciatura..."
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleAddOption} 
                                                className="h-12 px-6 flex items-center justify-center bg-slate-800 dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md flex-shrink-0"
                                            >
                                                Añadir
                                            </button>
                                        </div>

                                        {formData.opciones.length > 0 && (
                                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-wrap gap-2 relative z-10 mt-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                {formData.opciones.map((opt, index) => (
                                                    <motion.div 
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        key={opt} 
                                                        className="pl-3 pr-1 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/30 rounded-lg text-xs font-black text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-sm transition-colors group"
                                                    >
                                                        <span className="text-[10px] text-slate-400 font-bold">{index + 1}.</span>
                                                        {opt}
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleRemoveOption(opt)} 
                                                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md p-1 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 sm:px-8 sm:py-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 relative z-10 shrink-0">
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="px-6 h-12 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all"
                                >
                                    Descartar
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="px-8 h-12 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {isSaving ? (
                                        <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                        <Save size={16} className="text-white/80" />
                                    )}
                                    Consolidar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
