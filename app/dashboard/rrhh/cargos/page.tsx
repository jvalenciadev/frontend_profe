'use client';

import { useState, useEffect } from 'react';
import { cargoService, Cargo } from '@/services/cargoService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    Briefcase,
    Plus,
    Search,
    Edit2,
    Trash2,
    Save,
    CheckCircle2,
    XCircle,
    Loader2,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/StatusBadge';

export default function CargosPage() {
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        estado: 'ACTIVO'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await cargoService.getAll();
            setCargos(data);
        } catch (error) {
            toast.error('Error al cargar cargos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (cargo: Cargo | null = null) => {
        if (cargo) {
            setEditingCargo(cargo);
            setFormData({ nombre: cargo.nombre, estado: cargo.estado });
        } else {
            setEditingCargo(null);
            setFormData({ nombre: '', estado: 'ACTIVO' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingCargo) {
                await cargoService.update(editingCargo.id, formData);
                toast.success('Cargo actualizado');
            } else {
                await cargoService.create(formData);
                toast.success('Cargo creado');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            toast.error('Error al guardar cambios');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este cargo?')) return;
        try {
            await cargoService.delete(id);
            toast.success('Cargo eliminado');
            loadData();
        } catch (error) {
            toast.error('No se pudo eliminar el cargo');
        }
    };

    const filteredCargos = cargos.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1200px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            Gestión de <span className="text-primary italic">Cargos</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium ml-1">
                        Define los cargos y posiciones disponibles en la institución.
                    </p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Cargo
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar por nombre de cargo..."
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border border-border focus:border-primary transition-all shadow-sm outline-none text-sm font-bold placeholder:text-muted-foreground/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode='popLayout'>
                    {loading && cargos.length === 0 ? (
                        Array(6).fill(0).map((_, i) => (
                            <Card key={i} className="h-40 animate-pulse bg-muted/20 rounded-[32px] border-border/40" />
                        ))
                    ) : (
                        filteredCargos.map((cargo) => (
                            <motion.div
                                key={cargo.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <Card className="group p-6 rounded-[32px] border-border/40 bg-card hover:border-primary/40 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3.5 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <StatusBadge status={cargo.estado} />
                                    </div>

                                    <h3 className="text-base font-black uppercase tracking-tight mb-6 group-hover:text-primary transition-colors">{cargo.nombre}</h3>

                                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
                                        <button
                                            onClick={() => handleOpenModal(cargo)}
                                            className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cargo.id)}
                                            className="p-2 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCargo ? 'Editar Cargo' : 'Crear Nuevo Cargo'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre del Cargo</label>
                            <input
                                type="text"
                                required
                                className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-sm font-bold"
                                placeholder="Ej: Facilitador Académico"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>

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
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {editingCargo ? 'Actualizar' : 'Crear Cargo'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
