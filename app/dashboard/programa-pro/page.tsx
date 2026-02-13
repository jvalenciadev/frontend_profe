'use client';

import { useState, useEffect } from 'react';
import { programaMaestroService } from '@/services/programaMaestroService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    LayoutGrid,
    Plus,
    Search,
    RefreshCw,
    Edit2,
    Trash2,
    BookOpen,
    Clock,
    Hash,
    FileText,
    Save,
    ChevronRight,
    PlusCircle,
    XCircle,
    GraduationCap,
    Library
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ProgramaProPage() {
    const [programas, setProgramas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrograma, setEditingPrograma] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        nombreAbre: '',
        codigo: '',
        contenido: '',
        cargaHoraria: 0,
        convocatoria: '',
        modulos: [] as any[]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await programaMaestroService.getAll();
            setProgramas(data);
        } catch (error) {
            console.error('Error loading programas:', error);
            toast.error('Error al sincronizar programas');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (programa: any = null) => {
        if (programa) {
            setEditingPrograma(programa);
            setFormData({
                nombre: programa.nombre || '',
                nombreAbre: programa.nombreAbre || '',
                codigo: programa.codigo || '',
                contenido: programa.contenido || '',
                cargaHoraria: programa.cargaHoraria || 0,
                convocatoria: programa.convocatoria || '',
                modulos: programa.modulos || []
            });
        } else {
            setEditingPrograma(null);
            setFormData({
                nombre: '',
                nombreAbre: '',
                codigo: '',
                contenido: '',
                cargaHoraria: 0,
                convocatoria: '',
                modulos: []
            });
        }
        setIsModalOpen(true);
    };

    const addModulo = () => {
        setFormData({
            ...formData,
            modulos: [
                ...formData.modulos,
                { nombre: '', codigo: '', descripcion: '', notaMinima: 69 }
            ]
        });
    };

    const removeModulo = (index: number) => {
        const newModulos = [...formData.modulos];
        newModulos.splice(index, 1);
        setFormData({ ...formData, modulos: newModulos });
    };

    const updateModulo = (index: number, field: string, value: any) => {
        const newModulos = [...formData.modulos];
        newModulos[index] = { ...newModulos[index], [field]: value };
        setFormData({ ...formData, modulos: newModulos });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            if (editingPrograma) {
                await programaMaestroService.update(editingPrograma.id, formData);
                toast.success('Programa Pro actualizado');
            } else {
                await programaMaestroService.create(formData);
                toast.success('Nuevo Programa Pro registrado');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving programa:', error);
            toast.error('Error al guardar el programa');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Está seguro de eliminar este programa y todos sus módulos?')) return;
        try {
            await programaMaestroService.delete(id);
            toast.success('Programa eliminado');
            loadData();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar');
        }
    };

    const filtered = programas.filter(p =>
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">
                        <Library className="w-3 h-3" />
                        <span>Gestión Curricular Avanzada</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Programa <span className="text-primary">Pro</span></h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-md">
                        Configuración maestra de programas académicos y sus módulos integrados.
                    </p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Programa Pro
                </button>
            </div>

            {/* Search */}
            <Card className="p-4 border-border/40 bg-card/30 backdrop-blur-md">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código de programa..."
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[13px] font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="h-48 animate-pulse bg-muted/20 border-border/40" />
                    ))
                ) : filtered.map((p) => (
                    <Card key={p.id} className="group relative border-border/40 overflow-hidden bg-card hover:border-primary/30 transition-all p-0">
                        <div className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xl border border-primary/10">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{p.codigo}</span>
                                    <div className="flex items-center gap-1.5 text-muted-foreground mt-1 justify-end">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter">{p.cargaHoraria} Hrs</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-black tracking-tight text-foreground uppercase truncate">
                                    {p.nombre}
                                </h3>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{p.nombreAbre}</p>
                            </div>

                            <div className="pt-2 flex items-center justify-between border-t border-border/40">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary/30" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{p.modulos?.length || 0} Módulos</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(p)}
                                        className="p-2 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        className="p-2 rounded-lg bg-rose-500/5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPrograma ? 'Configuración de Programa Pro' : 'Registro Maestro de Programa'}
                size="2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-8 max-h-[75vh] overflow-y-auto px-2 pr-4 custom-scrollbar">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre del Programa</label>
                            <input
                                type="text"
                                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:bg-primary/[0.01] transition-all outline-none text-xs font-bold text-foreground"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Código Core</label>
                            <input
                                type="text"
                                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                placeholder="PRO-001"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Abreviación</label>
                            <input
                                type="text"
                                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                value={formData.nombreAbre}
                                onChange={(e) => setFormData({ ...formData, nombreAbre: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Carga Horaria</label>
                            <input
                                type="number"
                                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                value={formData.cargaHoraria}
                                onChange={(e) => setFormData({ ...formData, cargaHoraria: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Convocatoria</label>
                            <input
                                type="text"
                                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                value={formData.convocatoria}
                                onChange={(e) => setFormData({ ...formData, convocatoria: e.target.value })}
                                placeholder="2024 - II"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contenido / Descripción</label>
                        <textarea
                            className="w-full h-24 p-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground resize-none"
                            value={formData.contenido}
                            onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                        />
                    </div>

                    {/* Modulos Section */}
                    <div className="pt-6 border-t border-border">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                    <PlusCircle className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Arquitectura de Módulos</h4>
                            </div>
                            <button
                                type="button"
                                onClick={addModulo}
                                className="h-9 px-4 rounded-lg bg-primary/10 text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Añadir Módulo
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.modulos.map((mod, idx) => (
                                <div key={idx} className="group relative p-6 rounded-2xl bg-muted/20 border border-border/50 hover:border-primary/20 transition-all">
                                    <button
                                        type="button"
                                        onClick={() => removeModulo(idx)}
                                        className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-lg border border-border flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all z-10"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-3 space-y-1.5">
                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre del Módulo {idx + 1}</label>
                                            <input
                                                type="text"
                                                className="w-full h-10 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                                value={mod.nombre}
                                                onChange={(e) => updateModulo(idx, 'nombre', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Código</label>
                                            <input
                                                type="text"
                                                className="w-full h-10 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground text-center"
                                                value={mod.codigo}
                                                onChange={(e) => updateModulo(idx, 'codigo', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-3 space-y-1.5">
                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Descripción Técnica</label>
                                            <input
                                                type="text"
                                                className="w-full h-10 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                                value={mod.descripcion}
                                                onChange={(e) => updateModulo(idx, 'descripcion', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nota Min.</label>
                                            <input
                                                type="number"
                                                className="w-full h-10 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground text-center"
                                                value={mod.notaMinima}
                                                onChange={(e) => updateModulo(idx, 'notaMinima', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {formData.modulos.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Sin módulos configurados</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="h-12 px-10 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {isLoading ? 'Sincronizando...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Guardar Programa Pro
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
