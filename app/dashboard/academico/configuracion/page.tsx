'use client';

import { useState, useEffect } from 'react';
import {
    programaVersionService,
    programaTurnoService,
    programaDuracionService,
    programaModalidadService,
    programaTipoService,
    programaInscripcionEstadoService,
    insigniaService
} from '@/services/programaConfigService';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Card } from '@/components/ui/Card';
import {
    Layers,
    Clock,
    History,
    Globe,
    Tag,
    Plus,
    Search,
    Edit2,
    Trash2,
    Save,
    X,
    Settings2,
    CheckCircle2,
    XCircle,
    Activity,
    Trophy,
    Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/StatusBadge';

const TABS = [
    {
        id: 'versiones', label: 'Versiones', icon: Layers, service: programaVersionService, fields: [
            { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Versión I' },
            { name: 'romano', label: 'Romano', type: 'text', placeholder: 'Ej: I' },
            { name: 'numero', label: 'Número', type: 'number', placeholder: 'Ej: 1' },
            { name: 'gestion', label: 'Gestión', type: 'text', placeholder: 'Ej: 2024' },
        ]
    },
    {
        id: 'turnos', label: 'Turnos', icon: Clock, service: programaTurnoService, fields: [
            { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Mañana' },
            { name: 'descripcion', label: 'Descripción', type: 'text', placeholder: 'Ej: Lunes a Viernes 08:00 - 12:00' },
        ]
    },
    {
        id: 'duraciones', label: 'Duraciones', icon: History, service: programaDuracionService, fields: [
            { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: 6 Meses' },
            { name: 'semanas', label: 'Semanas', type: 'number', placeholder: 'Ej: 24' },
        ]
    },
    {
        id: 'modalidades', label: 'Modalidades', icon: Globe, service: programaModalidadService, fields: [
            { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Virtual' },
        ]
    },
    {
        id: 'tipos', label: 'Tipos de Programa', icon: Tag, service: programaTipoService, fields: [
            { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Diplomado' },
            { name: 'notaMaxima', label: 'Nota Máxima', type: 'number', placeholder: 'Ej: 100' },
            { name: 'notaReprobacion', label: 'Nota Reprobación', type: 'number', placeholder: 'Ej: 60' },
        ]
    },
    {
        id: 'estados-inscripcion', label: 'Estados Inscripción', icon: Activity, service: programaInscripcionEstadoService, fields: [
            { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: INSCRITO' },
        ]
    },
    {
        id: 'insignias', label: 'Insignias', icon: Award, service: insigniaService, hideStatus: true, fields: [
            { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Alumno Estrella' },
            { name: 'descripcion', label: 'Descripción', type: 'text', placeholder: 'Ej: Por participación impecable' },
            { name: 'icono', label: 'Ícono (Nombre Lucide o Emoji)', type: 'text', placeholder: 'Ej: Star, Zap, 🏆' },
            { name: 'color', label: 'Color Hex', type: 'text', placeholder: 'Ej: #f59e0b' },
            { name: 'tipo', label: 'Tipo Código (ID)', type: 'text', placeholder: 'Ej: ALUMNO_ESTRELLA' },
        ]
    },
];

export default function ConfigAcademicaPage() {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({ estado: 'activo' });

    const [confirmDelete, setConfirmDelete] = useState<{
        isOpen: boolean;
        itemId: string | null;
        itemName?: string;
        loading: boolean;
    }>({
        isOpen: false,
        itemId: null,
        loading: false
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await activeTab.service.getAll();
            setItems(data);
        } catch (error) {
            console.error('Error loading config data:', error);
            toast.error(`Error al cargar ${activeTab.label.toLowerCase()}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item: any = null) => {
        if (item) {
            setEditingItem(item);
            const initialData: any = { ...item };
            activeTab.fields.forEach(f => {
                if (initialData[f.name] === null || initialData[f.name] === undefined) {
                    initialData[f.name] = f.type === 'number' ? 0 : '';
                }
            });
            setFormData(initialData);
        } else {
            setEditingItem(null);
            const initialData: any = { estado: 'activo' };
            activeTab.fields.forEach(f => initialData[f.name] = f.type === 'number' ? 0 : '');
            setFormData(initialData);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            // Conversion de tipos
            const payload = { ...formData };
            activeTab.fields.forEach(f => {
                if (f.type === 'number') payload[f.name] = parseInt(payload[f.name]);
            });

            if (editingItem) {
                await activeTab.service.update(editingItem.id, payload);
                toast.success(`${activeTab.label} actualizada`);
            } else {
                await activeTab.service.create(payload);
                toast.success(`${activeTab.label} creada`);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar cambios');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (item: any) => {
        setConfirmDelete({
            isOpen: true,
            itemId: item.id,
            itemName: item.nombre,
            loading: false
        });
    };

    const confirmDeleteAction = async () => {
        if (!confirmDelete.itemId) return;
        try {
            setConfirmDelete(prev => ({ ...prev, loading: true }));
            await activeTab.service.delete(confirmDelete.itemId);
            toast.success('Registro eliminado');
            loadData();
            setConfirmDelete(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            toast.error('No se pudo eliminar el registro');
        } finally {
            setConfirmDelete(prev => ({ ...prev, loading: false }));
        }
    };

    const filteredItems = items.filter(item =>
        Object.values(item).some(val =>
            val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <Settings2 className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            Configuración <span className="text-primary italic">Académica</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium ml-1">
                        Gestión paramétrica de maestros secundarios y variables globales.
                    </p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo {activeTab.label.slice(0, -1)}
                </button>
            </div>

            {/* Tabs Navigation */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 bg-muted/20 p-2 rounded-[24px] border border-border/40 backdrop-blur-xl">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab.id === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex-1 md:flex-none justify-center",
                                active
                                    ? "bg-primary text-white shadow-xl shadow-primary/25 scale-[1.02]"
                                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", active ? "animate-pulse" : "")} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={`Filtrar ${activeTab.label.toLowerCase()}...`}
                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border border-border focus:border-primary transition-all shadow-sm outline-none text-sm font-bold placeholder:text-muted-foreground/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    <AnimatePresence mode='popLayout'>
                        {loading ? (
                            Array(8).fill(0).map((_, i) => (
                                <Card key={i} className="h-64 animate-pulse bg-muted/20 rounded-[3rem] border-border/40" />
                            ))
                        ) : filteredItems.length === 0 ? (
                            <div className="col-span-full py-32 text-center space-y-6 opacity-40">
                                <div className="flex justify-center">
                                    <Search className="w-16 h-16 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg font-black uppercase tracking-[0.3em]">Sin registros</p>
                                    <p className="text-sm font-medium">No hay resultados para "{searchTerm}" en {activeTab.label}</p>
                                </div>
                            </div>
                        ) : (
                            filteredItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                >
                                    <Card className="group relative border-border/40 overflow-hidden bg-card hover:border-primary/50 transition-all p-8 rounded-[3.5rem] shadow-sm hover:shadow-3xl hover:shadow-primary/10 h-full flex flex-col justify-between">
                                        {/* Action buttons (hover) */}
                                        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 text-primary shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all scale-90 hover:scale-100"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item)}
                                                className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 shadow-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all scale-90 hover:scale-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex justify-between items-start">
                                                <div className="p-4 rounded-3xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner group-hover:rotate-6">
                                                    <activeTab.icon className="w-8 h-8" />
                                                </div>
                                                <StatusBadge status={item.estado} />
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-lg font-black tracking-tight text-foreground uppercase group-hover:text-primary transition-colors leading-none">
                                                    {activeTab.id === 'versiones'
                                                        ? `${item.nombre} ${item.romano || ''}`
                                                        : item.nombre}
                                                </h3>
                                                {/* Badge Preview */}
                                                {activeTab.id === 'insignias' && (
                                                    <div className="flex items-center gap-3 py-3 px-4 rounded-2xl border border-border/40 bg-muted/20">
                                                        <div 
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg"
                                                            style={{ background: item.color || '#6366f1' }}
                                                        >
                                                            {item.icono?.length > 2 ? '★' : (item.icono || '★')}
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Vista Previa</span>
                                                    </div>
                                                )}
                                                {item.gestion && (
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-widest">
                                                        <Clock className="w-3 h-3 text-primary/50" />
                                                        Gestión {item.gestion}
                                                    </p>
                                                )}
                                                {item.descripcion && (
                                                    <p className="text-[11px] font-medium text-muted-foreground/80 line-clamp-2 italic leading-relaxed">
                                                        "{item.descripcion}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Specific for PROGRAM TYPES */}
                                            {activeTab.id === 'tipos' && (
                                                <div className="pt-4 border-t border-border/40 grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">Nota Máxima</p>
                                                        </div>
                                                        <div className="relative overflow-hidden bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                                                            <p className="text-xl font-black text-emerald-600 leading-none">{item.notaMaxima || 100}</p>
                                                            <div className="absolute -right-2 -bottom-2 opacity-5">
                                                                <Trophy size={40} className="text-emerald-500 rotate-12" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">Reprobación</p>
                                                        </div>
                                                        <div className="relative overflow-hidden bg-rose-500/5 p-3 rounded-2xl border border-rose-500/10 hover:border-rose-500/30 transition-all">
                                                            <p className="text-xl font-black text-rose-600 leading-none">{item.notaReprobacion || 51}</p>
                                                            <div className="absolute -right-2 -bottom-2 opacity-5">
                                                                <XCircle size={40} className="text-rose-500 rotate-12" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Specific for DURATIONS */}
                                            {activeTab.id === 'duraciones' && (
                                                <div className="pt-4 border-t border-border/40 flex items-center gap-4">
                                                    <div className="px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-primary" />
                                                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">{item.semanas} Semanas</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Specific for VERSIONS */}
                                            {activeTab.id === 'versiones' && item.numero && (
                                                <div className="pt-4 border-t border-border/40 flex items-center gap-4">
                                                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                        <span className="text-[9px] font-black uppercase text-slate-400 mr-2">Secuencia</span>
                                                        <span className="text-xs font-black text-slate-800 dark:text-white">#{item.numero}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer decoration */}
                                        <div className="mt-8 flex items-center justify-between">
                                            <div className="flex -space-x-1">
                                                <div className="w-5 h-1 bg-primary/20 rounded-full" />
                                                <div className="w-2 h-1 bg-primary rounded-full" />
                                            </div>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest italic opacity-0 group-hover:opacity-100 transition-all">
                                                ID: {item.id ? item.id.slice(0, 8) : 'AUTO'}
                                            </p>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* CRUD Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${editingItem ? 'Editar' : 'Nuevo'} ${activeTab.label.slice(0, -1)}`}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        {activeTab.fields.map((field) => (
                            <div key={field.name} className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{field.label}</label>
                                <input
                                    type={field.type}
                                    required
                                    className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-sm font-bold"
                                    placeholder={field.placeholder}
                                    value={formData[field.name] ?? ''}
                                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                />
                            </div>
                        ))}

                        {!(activeTab as any).hideStatus && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado</label>
                                <select
                                    className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-sm font-bold"
                                    value={formData.estado}
                                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                >
                                    <option value="activo">Activo (Minúscula)</option>
                                    <option value="inactivo">Inactivo (Minúscula)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border/10">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-12 px-10 rounded-xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {editingItem ? 'Guardar Cambios' : 'Crear Registro'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
                onConfirm={confirmDeleteAction}
                title={`Eliminar ${activeTab.label.slice(0, -1)}`}
                description={`¿Estás seguro de eliminar "${confirmDelete.itemName}"? Esta acción no se puede deshacer.`}
                loading={confirmDelete.loading}
            />
        </div>
    );
}
