'use client';

import { useState, useEffect } from 'react';
import {
    programaVersionService,
    programaTurnoService,
    programaDuracionService,
    programaModalidadService,
    programaTipoService,
    programaInscripcionEstadoService
} from '@/services/programaConfigService';
import { Modal } from '@/components/Modal';
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
    Activity
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
            { name: 'semana', label: 'Semanas', type: 'number', placeholder: 'Ej: 24' },
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
        ]
    },
    {
        id: 'estados-inscripcion', label: 'Estados Inscripción', icon: Activity, service: programaInscripcionEstadoService, fields: [
            { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: INSCRITO' },
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
    const [formData, setFormData] = useState<any>({ estado: 'ACTIVO' });

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
            const initialData: any = { estado: 'ACTIVO' };
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

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        try {
            await activeTab.service.delete(id);
            toast.success('Registro eliminado');
            loadData();
        } catch (error) {
            toast.error('No se pudo eliminar el registro');
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {loading ? (
                            Array(8).fill(0).map((_, i) => (
                                <Card key={i} className="h-48 animate-pulse bg-muted/20 rounded-[32px] border-border/40" />
                            ))
                        ) : filteredItems.length === 0 ? (
                            <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                                <div className="flex justify-center"><Search className="w-12 h-12" /></div>
                                <p className="text-sm font-black uppercase tracking-[0.2em]">No se encontraron resultados en {activeTab.label}</p>
                            </div>
                        ) : (
                            filteredItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className="group relative border-border/40 overflow-hidden bg-card hover:border-primary/40 transition-all p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-primary/5">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3.5 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                                <activeTab.icon className="w-6 h-6" />
                                            </div>
                                            <StatusBadge status={item.estado} />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <h3 className="text-base font-black tracking-tight text-foreground uppercase group-hover:text-primary transition-colors">
                                                    {activeTab.id === 'versiones'
                                                        ? `${item.nombre} ${item.romano || ''}`
                                                        : item.nombre}
                                                </h3>
                                                {item.gestion && (
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                        <Activity className="w-3 h-3" />
                                                        Gestión {item.gestion} {activeTab.id !== 'versiones' && item.romano ? `(${item.romano})` : ''}
                                                    </p>
                                                )}
                                                {item.descripcion && (
                                                    <p className="text-xs font-medium text-muted-foreground line-clamp-2 italic">
                                                        "{item.descripcion}"
                                                    </p>
                                                )}
                                                {item.semana && (
                                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                                        {item.semana} Semanas Lectivas
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-border/40 flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-sm"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado</label>
                            <select
                                className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-sm font-bold"
                                value={formData.estado}
                                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                            >
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="INACTIVO">INACTIVO</option>
                            </select>
                        </div>
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
        </div>
    );
}
