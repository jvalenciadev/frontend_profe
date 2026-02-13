'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { comunicadoService, type Comunicado } from '@/services/comunicadoService';
import { departmentService } from '@/services/departmentService';
import {
    Megaphone,
    Plus,
    Search,
    Edit,
    Trash2,
    Image as ImageIcon,
    AlertCircle,
    Bell,
    CheckCircle2,
    X,
    Clock,
    ShieldAlert,
    Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Modal } from '@/components/Modal';

export default function ComunicadosPage() {
    const { user, isSuperAdmin } = useAuth();
    const [comunicados, setComunicados] = useState<Comunicado[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingComunicado, setEditingComunicado] = useState<Comunicado | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        imagen: '',
        tipo: 'GENERAL',
        importancia: 'normal',
        estado: 'ACTIVO',
        tenantId: ''
    });
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isConfirmingSave, setIsConfirmingSave] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (user) loadMetadata();
    }, [user, isSuperAdmin]);

    const loadMetadata = async () => {
        try {
            const depts = await departmentService.getAll();

            if (isSuperAdmin()) {
                setDepartamentos(depts);
            } else if (user?.tenantId) {
                const myDept = depts.filter((d: any) => d.id === user.tenantId);
                setDepartamentos(myDept);
            } else {
                setDepartamentos([]);
            }
        } catch (error) {
            console.error('Error loading metadata:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await comunicadoService.getAll();
            setComunicados(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar los comunicados');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (comunicado?: Comunicado) => {
        if (comunicado) {
            setEditingComunicado(comunicado);
            setFormData({
                nombre: comunicado.nombre,
                descripcion: comunicado.descripcion,
                imagen: comunicado.imagen || '',
                tipo: comunicado.tipo || 'GENERAL',
                importancia: comunicado.importancia || 'normal',
                estado: comunicado.estado || 'ACTIVO',
                tenantId: comunicado.tenantId || ''
            });
        } else {
            setEditingComunicado(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            imagen: '',
            tipo: 'GENERAL',
            importancia: 'normal',
            estado: 'ACTIVO',
            tenantId: isSuperAdmin() ? '' : (user?.tenantId || '')
        });
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const payload = { ...formData, tenantId: formData.tenantId || null };
            if (editingComunicado) {
                await comunicadoService.update(editingComunicado.id, payload);
                toast.success('Comunicado actualizado correctamente');
            } else {
                await comunicadoService.create(payload);
                toast.success('Comunicado publicado exitosamente');
            }
            setIsModalOpen(false);
            setIsConfirmingSave(false);
            loadData();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar el comunicado');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setIsLoading(true);
            await comunicadoService.delete(id);
            toast.success('Comunicado retirado');
            setIsDeleting(null);
            loadData();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar el comunicado');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredComunicados = (comunicados || []).filter(c => {
        const term = searchTerm.toLowerCase();
        return (c.nombre?.toLowerCase() || '').includes(term) ||
            (c.descripcion?.toLowerCase() || '').includes(term);
    });

    const getImportanciaEstilo = (imp: string) => {
        switch (imp) {
            case 'urgente': return 'bg-rose-500 text-white border-rose-600 shadow-rose-500/20';
            case 'importante': return 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20';
            default: return 'bg-primary text-white border-primary/20 shadow-primary/20';
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            {/* Header Moderno-Institucional */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-primary text-white shadow-2xl shadow-primary/30">
                            <Megaphone className="w-8 h-8 animate-bounce" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                                Centro de <span className="text-primary">Comunicados</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-2 opacity-60">Difusión de Información Institucional Crítica</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Filtrar comunicados..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-14 pl-12 pr-6 rounded-2xl bg-card border border-border focus:border-primary transition-all outline-none text-[11px] font-black uppercase tracking-widest min-w-[320px] shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" />
                        Publicar Comunicado
                    </button>
                </div>
            </div>

            {/* Listado de Comunicados */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array(8).fill(0).map((_, i) => (
                        <Card key={i} className="h-48 animate-pulse bg-muted/20 border-border/40" />
                    ))}
                </div>
            ) : filteredComunicados.length === 0 ? (
                <div className="py-40 flex flex-col items-center justify-center text-center">
                    <div className="p-8 rounded-[3rem] bg-muted/20 text-muted-foreground/30 mb-6">
                        <Bell className="w-20 h-20" />
                    </div>
                    <p className="text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground">Bandeja de comunicados vacía</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredComunicados.map((comunicado) => (
                        <motion.div key={comunicado.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="group relative overflow-hidden bg-card border-border/40 hover:border-primary/40 transition-all hover:shadow-2xl hover:shadow-primary/5 rounded-[2.5rem] h-full flex flex-col">
                                {/* Badge de Importancia */}
                                <div className={cn(
                                    "absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-[0.2em] shadow-lg",
                                    getImportanciaEstilo(comunicado.importancia)
                                )}>
                                    {comunicado.importancia}
                                </div>

                                {/* Header Visual */}
                                <div className="p-6 pb-2">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                        {comunicado.importancia === 'urgente' ? <ShieldAlert className="w-7 h-7" /> : <Megaphone className="w-7 h-7" />}
                                    </div>
                                    <h3 className="text-lg font-black uppercase italic tracking-tighter leading-tight group-hover:text-primary transition-colors">
                                        {comunicado.nombre}
                                    </h3>
                                </div>

                                {/* Cuerpo */}
                                <div className="px-6 flex-1">
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-4">
                                        {comunicado.descripcion}
                                    </p>
                                </div>

                                {/* Footer con Acciones */}
                                <div className="p-6 pt-4 mt-4 border-t border-border/40 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {comunicado.createdAt ? new Date(comunicado.createdAt).toLocaleDateString() : 'Reciente'}
                                        </div>
                                        {(comunicado as any).tenant && (
                                            <div className="flex items-center gap-1.5 text-primary/60">
                                                <div className="w-1 h-1 rounded-full bg-border" />
                                                <Building2 className="w-3.5 h-3.5" />
                                                {(comunicado as any).tenant.nombre}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(comunicado)} className="p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-primary shadow-xl hover:scale-110 active:scale-90 transition-all">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setIsDeleting(comunicado.id)} className="p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-destructive shadow-xl hover:scale-110 active:scale-90 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal de Comunicados */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                            <Card className="border-none shadow-3xl rounded-[2.5rem] overflow-hidden flex flex-col flex-1 min-h-0 bg-card">
                                <div className="p-8 border-b border-border flex items-center justify-between bg-primary text-white flex-none">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            <Bell className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                                                {editingComunicado ? 'Actualizar' : 'Emitir'} <span className="opacity-60">Comunicado</span>
                                            </h2>
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 leading-none mt-2">Sistema de Alertas Institucionales</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-4 rounded-3xl hover:bg-white/10 transition-colors">
                                        <X className="w-8 h-8" />
                                    </button>
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); setIsConfirmingSave(true); }} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Título del Comunicado</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.nombre}
                                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                    className="w-full h-14 px-6 rounded-2xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-xs font-bold font-foreground"
                                                    placeholder="Ej. Suspensión de actividades..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Importancia</label>
                                                    <select
                                                        value={formData.importancia}
                                                        onChange={(e) => setFormData({ ...formData, importancia: e.target.value })}
                                                        className="w-full h-14 px-6 rounded-2xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-xs font-bold"
                                                    >
                                                        <option value="normal">Normal</option>
                                                        <option value="importante">Importante</option>
                                                        <option value="urgente">Urgente</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Categoría</label>
                                                    <select
                                                        value={formData.tipo}
                                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                                        className="w-full h-14 px-6 rounded-2xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-xs font-bold"
                                                    >
                                                        <option value="GENERAL">General</option>
                                                        <option value="ACADEMICO">Académico</option>
                                                        <option value="ADMINISTRATIVO">Administrativo</option>
                                                        <option value="ALERTA">Alerta</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Sede / Departamento Destino</label>
                                                <select
                                                    value={formData.tenantId}
                                                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                                    className="w-full h-14 px-6 rounded-2xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-xs font-bold disabled:opacity-50"
                                                    disabled={!isSuperAdmin()}
                                                >
                                                    {isSuperAdmin() && <option value="">Sede Central / Global</option>}
                                                    {departamentos.map(d => (
                                                        <option key={d.id} value={d.id}>{d.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <ImageUpload
                                                value={formData.imagen}
                                                onChange={(url) => setFormData({ ...formData, imagen: url })}
                                                tableName="comunicados"
                                                label="Imagen del Comunicado (Opcional)"
                                            />

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Contenido Detallado</label>
                                                <textarea
                                                    required
                                                    value={formData.descripcion}
                                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                                    className="w-full h-40 px-6 py-5 rounded-2xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-xs font-medium resize-none leading-relaxed"
                                                    placeholder="Escriba el cuerpo del comunicado aquí..."
                                                />
                                            </div>
                                        </div>

                                    </div>
                                    <div className="p-8 border-t border-border/40 bg-card/95 backdrop-blur-sm">
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(false)}
                                                className="h-16 px-8 rounded-2xl border border-border text-[11px] font-black uppercase tracking-widest hover:bg-muted transition-all text-muted-foreground"
                                            >
                                                Cerrar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex-1 h-16 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {isLoading ? <Clock className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                                {editingComunicado ? 'Guardar Cambios' : 'Publicar Comunicado'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </Card>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >

            <ConfirmModal
                isOpen={!!isDeleting}
                onClose={() => setIsDeleting(null)}
                onConfirm={() => isDeleting && handleDelete(isDeleting)}
                title="¿Dar de baja comunicado?"
                description="Esta acción retirará el comunicado del portal público. Podrá reactivarlo más tarde si es necesario."
                confirmText="Sí, dar de baja"
                cancelText="Mantener activo"
                type="danger"
                isLoading={isLoading}
            />

            <ConfirmModal
                isOpen={isConfirmingSave}
                onClose={() => setIsConfirmingSave(false)}
                onConfirm={handleSubmit}
                title={editingComunicado ? "¿Actualizar Comunicado?" : "¿Publicar Comunicado?"}
                description={editingComunicado
                    ? "Se aplicarán los cambios realizados al comunicado seleccionado. Esta información será visible de inmediato."
                    : "El comunicado será publicado y notificado a los usuarios correspondientes."
                }
                confirmText={editingComunicado ? "Confirmar Edición" : "Confirmar Publicación"}
                cancelText="Seguir editando"
                type="info"
                isLoading={isLoading}
            />
        </div>
    );
}
