'use client';

import { useState, useEffect } from 'react';
import { distritoService } from '@/services/distritoService';
import { departmentService } from '@/services/departmentService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    MapPin,
    Plus,
    Edit2,
    Trash2,
    Search,
    Hash,
    Building2,
    Activity,
    AlertCircle,
    Navigation,
    Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Can } from '@/components/Can';

export default function DistritosPage() {
    const [distritos, setDistritos] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingDistrito, setEditingDistrito] = useState<any>(null);
    const [formData, setFormData] = useState({
        codigo: 0,
        nombre: '',
        departamentoId: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [distData, deptsData] = await Promise.all([
                distritoService.getAll(),
                departmentService.getAll()
            ]);
            setDistritos(distData);
            setDepartments(deptsData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error de enlace con el servicio de distritos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (dist: any = null) => {
        if (dist) {
            setEditingDistrito(dist);
            setFormData({
                codigo: dist.codigo,
                nombre: dist.nombre,
                departamentoId: dist.departamentoId,
            });
        } else {
            setEditingDistrito(null);
            setFormData({
                codigo: 0,
                nombre: '',
                departamentoId: departments[0]?.id || '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingDistrito) {
                await distritoService.update(editingDistrito.id, formData);
                toast.success('Distrito actualizado en el nodo');
            } else {
                await distritoService.create(formData);
                toast.success('Nuevo distrito federado');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving distrito:', error);
            toast.error('Fallo en la sincronización del distrito');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await distritoService.delete(id);
            toast.success('Distrito removido del esquema');
            setIsDeleting(null);
            loadData();
        } catch (error) {
            console.error('Error deleting distrito:', error);
            toast.error('Error en la baja del registro');
        }
    };

    const filteredDistritos = distritos.filter(d =>
        d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.codigo.toString().includes(searchTerm)
    );

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                        <Layers className="w-4 h-4" />
                        <span>Subdivisiones Territoriales</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Distritos</h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-lg">
                        Mapeo de las unidades educativas y zonas administrativas por distrito.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar código o nombre..."
                            className="h-14 pl-12 pr-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-xs font-bold w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Can action="create" subject="Distrito">
                        <button
                            onClick={() => handleOpenModal()}
                            className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                        >
                            <Plus className="w-5 h-5" />
                            Nuevo Distrito
                        </button>
                    </Can>
                </div>
            </div>

            {/* Matrix Table */}
            <Card className="border-border/40 shadow-xl shadow-black/[0.02] overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border/60">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-32">Código SIE</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nombre Distrital</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Jurisdicción</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right w-32">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {loading && distritos.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-6 cursor-wait opacity-50"><div className="h-8 bg-muted rounded-xl w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredDistritos.map((dist) => (
                                <tr key={dist.id} className="group hover:bg-primary/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-muted group-hover:bg-primary/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors border border-transparent group-hover:border-primary/20 font-black text-[10px]">
                                                {dist.codigo}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-foreground uppercase tracking-tight">{dist.nombre}</span>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">ID: {dist.id.slice(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {dist.departamento && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary/40" />
                                                <span className="text-[10px] font-black uppercase text-foreground">{dist.departamento.nombre}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="px-3 py-1 bg-muted rounded-full text-[9px] font-black uppercase tracking-tighter border border-border">
                                            {dist.estado}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <Can action="update" subject="Distrito">
                                                <button
                                                    onClick={() => handleOpenModal(dist)}
                                                    className="w-10 h-10 rounded-2xl bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all active:scale-95"
                                                >
                                                    <Edit2 className="w-4 h-4 mx-auto" />
                                                </button>
                                            </Can>
                                            <Can action="delete" subject="Distrito">
                                                <button
                                                    onClick={() => setIsDeleting(dist.id)}
                                                    className="w-10 h-10 rounded-2xl bg-card border border-border text-muted-foreground hover:text-rose-600 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-500/10 transition-all active:scale-95"
                                                >
                                                    <Trash2 className="w-4 h-4 mx-auto" />
                                                </button>
                                            </Can>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingDistrito ? 'Actualizar Nodo Distrital' : 'Configurar Nuevo Distrito'}
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Región de Pertenencia</label>
                            <select
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[11px] font-black text-foreground uppercase tracking-tight appearance-none ring-inset"
                                value={formData.departamentoId}
                                onChange={(e) => setFormData({ ...formData, departamentoId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Departamento</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Código SIE</label>
                                <input
                                    type="number"
                                    className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                                    placeholder="807300"
                                    value={formData.codigo}
                                    onChange={(e) => setFormData({ ...formData, codigo: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre del Distrito</label>
                                <input
                                    type="text"
                                    className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                                    placeholder="p. ej. DISTRITO 1 EL ALTO"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border mt-10">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:opacity-90 transition-all"
                        >
                            {editingDistrito ? 'Propagar Cambios' : 'Federar Distrito'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* DELETE */}
            <Modal
                isOpen={!!isDeleting}
                onClose={() => setIsDeleting(null)}
                title="Protocolo de Remoción"
            >
                <div className="space-y-8 text-center py-6">
                    <div className="w-20 h-20 rounded-[2.2rem] bg-destructive/10 text-destructive flex items-center justify-center mx-auto border-2 border-destructive/20 shadow-xl shadow-destructive/10">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase">¿Remover Distrito?</h3>
                        <p className="text-[13px] text-muted-foreground px-10 leading-relaxed font-bold italic opacity-70">
                            "Asegúrese de que no existan unidades educativas vinculadas antes de proceder."
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 px-8">
                        <button
                            onClick={() => isDeleting && handleDelete(isDeleting)}
                            className="h-14 w-full rounded-2xl bg-destructive text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-destructive/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                            Confirmar Remoción
                        </button>
                        <button
                            onClick={() => setIsDeleting(null)}
                            className="h-14 w-full rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Manetener Distrito
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
