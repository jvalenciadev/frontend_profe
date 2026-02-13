'use client';

import { useState, useEffect } from 'react';
import { departmentService } from '@/services/departmentService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    MapPin,
    Plus,
    Edit2,
    Trash2,
    Search,
    Globe,
    Building2,
    Activity,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Can } from '@/components/Can';

export default function DepartamentosPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<any>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        abreviacion: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await departmentService.getAll();
            setDepartments(data);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Fallo en la sincronización de departamentos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (dept: any = null) => {
        if (dept) {
            setEditingDepartment(dept);
            setFormData({
                nombre: dept.nombre,
                abreviacion: dept.abreviacion,
            });
        } else {
            setEditingDepartment(null);
            setFormData({
                nombre: '',
                abreviacion: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingDepartment) {
                await departmentService.update(editingDepartment.id, formData);
                toast.success('Departamento actualizado correctamente');
            } else {
                await departmentService.create(formData);
                toast.success('Nuevo departamento registrado');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving department:', error);
            toast.error('Error en la persistencia de datos');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await departmentService.delete(id);
            toast.success('Departamento removido');
            setIsDeleting(null);
            loadData();
        } catch (error) {
            console.error('Error deleting department:', error);
            toast.error('Error en la remoción técnica');
        }
    };

    const filteredDepartments = departments.filter(d =>
        d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.abreviacion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                        <Globe className="w-4 h-4" />
                        <span>Gestión Territorial Core</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Departamentos</h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-lg">
                        Administración de las unidades territoriales principales del sistema.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar departamento..."
                            className="h-14 pl-12 pr-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-xs font-bold w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Can action="create" subject="Departamento">
                        <button
                            onClick={() => handleOpenModal()}
                            className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                        >
                            <Plus className="w-5 h-5" />
                            Nuevo Registro
                        </button>
                    </Can>
                </div>
            </div>

            {/* Grid Display */}
            {loading && departments.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-44 rounded-3xl bg-card border border-border animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredDepartments.map((dept) => (
                            <motion.div
                                key={dept.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group"
                            >
                                <Card className="p-0 overflow-hidden border-border bg-card group-hover:border-primary/40 transition-all duration-300 shadow-xl shadow-black/[0.02]">
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-start justify-between">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 transition-transform group-hover:scale-110">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                <Can action="update" subject="Departamento">
                                                    <button
                                                        onClick={() => handleOpenModal(dept)}
                                                        className="w-9 h-9 rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-card border border-transparent hover:border-border transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4 mx-auto" />
                                                    </button>
                                                </Can>
                                                <Can action="delete" subject="Departamento">
                                                    <button
                                                        onClick={() => setIsDeleting(dept.id)}
                                                        className="w-9 h-9 rounded-xl bg-muted text-muted-foreground hover:text-rose-600 hover:bg-card border border-transparent hover:border-border transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4 mx-auto" />
                                                    </button>
                                                </Can>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black tracking-tighter text-foreground uppercase leading-none truncate">
                                                {dept.nombre}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3 h-3 text-emerald-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{dept.abreviacion}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Estado</span>
                                            </div>
                                            <span className="px-2 py-0.5 bg-muted rounded-md text-[9px] font-black text-foreground border border-border">
                                                {dept.estado}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingDepartment ? 'Actualizar Departamento' : 'Nuevo Departamento'}
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre Completo</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                                placeholder="p. ej. LA PAZ"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Abreviación</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                                placeholder="p. ej. LP"
                                value={formData.abreviacion}
                                onChange={(e) => setFormData({ ...formData, abreviacion: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border">
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
                            {editingDepartment ? 'Salvar Cambios' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* DELETE CONFIRMATION */}
            <Modal
                isOpen={!!isDeleting}
                onClose={() => setIsDeleting(null)}
                title="Confirmación de Remoción"
            >
                <div className="space-y-8 text-center py-6">
                    <div className="w-20 h-20 rounded-[2.2rem] bg-destructive/10 text-destructive flex items-center justify-center mx-auto border-2 border-destructive/20 shadow-xl shadow-destructive/10">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase">¿Remover Registro?</h3>
                        <p className="text-[13px] text-muted-foreground px-10 leading-relaxed font-bold italic opacity-70">
                            "Esta acción podría afectar el acceso territorial de varios usuarios."
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
                            Mantener Registro
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
