'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { eventoService, type Evento } from '@/services/eventoService';
import { departmentService } from '@/services/departmentService';
import {
    Calendar,
    Plus,
    Search,
    Edit,
    Trash2,
    MapPin,
    Clock,
    Tag,
    Building2,
    X,
    Trophy,
    Users,
    Activity,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Modal } from '@/components/Modal';

export default function EventosPage() {
    const { user, isSuperAdmin } = useAuth();
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [tipos, setTipos] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        codigo: '',
        banner: '',
        afiche: '',
        modulosIds: '',
        fecha: new Date().toISOString().split('T')[0],
        inscripcion: true,
        asistencia: false,
        lugar: '',
        totalInscrito: 0,
        estado: 'ACTIVO',
        tipoId: '',
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
            const [typesData, deptsData] = await Promise.all([
                eventoService.getTipos(),
                departmentService.getAll()
            ]);
            setTipos(typesData);

            // Si es SuperAdmin ve todos, sino solo el suyo
            if (isSuperAdmin()) {
                setDepartamentos(deptsData);
            } else if (user?.tenantId) {
                const myDept = deptsData.filter((d: any) => d.id === user.tenantId);
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
            const data = await eventoService.getAll();
            setEventos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar los eventos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (evento?: Evento) => {
        if (evento) {
            setEditingEvento(evento);
            setFormData({
                nombre: evento.nombre,
                descripcion: evento.descripcion,
                codigo: evento.codigo || '',
                banner: evento.banner || '',
                afiche: evento.afiche || '',
                modulosIds: evento.modulosIds || '',
                fecha: evento.fecha ? evento.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
                inscripcion: evento.inscripcion ?? true,
                asistencia: evento.asistencia ?? false,
                lugar: evento.lugar || '',
                totalInscrito: evento.totalInscrito || 0,
                estado: evento.estado || 'ACTIVO',
                tipoId: evento.tipoId || '',
                tenantId: evento.tenantId || ''
            });
        } else {
            setEditingEvento(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            codigo: '',
            banner: '',
            afiche: '',
            modulosIds: '',
            fecha: new Date().toISOString().split('T')[0],
            inscripcion: true,
            asistencia: false,
            lugar: '',
            totalInscrito: 0,
            estado: 'ACTIVO',
            tipoId: tipos[0]?.id || '',
            tenantId: isSuperAdmin() ? '' : (user?.tenantId || '')
        });
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const payload = {
                ...formData,
                fecha: new Date(formData.fecha).toISOString(),
                totalInscrito: Number(formData.totalInscrito),
                tenantId: formData.tenantId || null
            };

            if (editingEvento) {
                await eventoService.update(editingEvento.id, payload);
                toast.success('Evento actualizado exitosamente');
            } else {
                await eventoService.create(payload);
                toast.success('Evento creado exitosamente');
            }
            setIsModalOpen(false);
            setIsConfirmingSave(false);
            loadData();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar el evento');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setIsLoading(true);
            await eventoService.delete(id);
            toast.success('Evento eliminado');
            setIsDeleting(null);
            loadData();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar el evento');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredEventos = (eventos || []).filter(e => {
        const term = searchTerm.toLowerCase();
        return (e.nombre?.toLowerCase() || '').includes(term) ||
            (e.descripcion?.toLowerCase() || '').includes(term) ||
            (e.lugar?.toLowerCase() || '').includes(term);
    });

    return (
        <div className="min-h-screen bg-background p-8">
            {/* Header Super Institucional */}
            <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="relative">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[2rem] bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/30 transform -rotate-6 transition-transform hover:rotate-0">
                            <Trophy className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none text-foreground">
                                Agenda de <span className="text-primary">Eventos</span>
                            </h1>
                            <div className="flex items-center gap-3 mt-3">
                                <span className="h-0.5 w-12 bg-primary rounded-full" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Plataforma de Coordinación Académica</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar en la agenda..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-16 pl-12 pr-6 rounded-3xl bg-card border-2 border-border/50 focus:border-primary transition-all outline-none text-[11px] font-black uppercase tracking-widest w-[350px] shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="h-16 px-10 rounded-3xl bg-primary text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 active:scale-95"
                    >
                        <Plus className="w-6 h-6" />
                        Añadir Evento
                    </button>
                </div>
            </div>

            {/* Listado Premium */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="h-96 animate-pulse bg-slate-200 border-none rounded-[3rem]" />
                    ))}
                </div>
            ) : filteredEventos.length === 0 ? (
                <div className="py-40 flex flex-col items-center justify-center opacity-20 text-slate-900">
                    <Calendar className="w-24 h-24 mb-6 stroke-[1.5]" />
                    <p className="text-[14px] font-black uppercase tracking-[0.5em]">La agenda está limpia</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEventos.map((evento) => (
                        <motion.div key={evento.id} whileHover={{ y: -10 }} transition={{ type: "spring", stiffness: 300 }}>
                            <Card className="group relative overflow-hidden bg-card border-border/40 shadow-xl shadow-border/10 rounded-[3rem] h-full flex flex-col">
                                {/* Banner Visual */}
                                <div className="relative h-48 overflow-hidden bg-muted">
                                    {evento.banner ? (
                                        <img src={evento.banner} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={evento.nombre} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted">
                                            <Calendar className="w-20 h-20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="absolute top-6 left-6 flex gap-2">
                                        <span className="px-4 py-2 rounded-2xl bg-card border border-border/50 text-primary text-[9px] font-black uppercase tracking-widest shadow-lg">
                                            {evento.estado}
                                        </span>
                                    </div>

                                    <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <span className="text-white text-[9px] font-black uppercase tracking-widest">{evento.totalInscrito} Inscritos</span>
                                            </div>
                                            {(evento as any).tipo && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white">
                                                        <Tag className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-white text-[9px] font-black uppercase tracking-widest">{(evento as any).tipo.nombre}</span>
                                                </div>
                                            )}
                                            {(evento as any).tenant && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white">
                                                        <Building2 className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-white text-[9px] font-black uppercase tracking-widest">{(evento as any).tenant.nombre}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 flex-1 flex flex-col space-y-6">
                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-foreground leading-none">
                                            {evento.nombre}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                                            {evento.descripcion}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-2xl bg-muted/30 text-muted-foreground">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[8px] font-black uppercase text-muted-foreground leading-none mb-1">Fecha</p>
                                                <p className="text-[10px] font-black text-foreground truncate">
                                                    {new Date(evento.fecha).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-2xl bg-muted/30 text-muted-foreground">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[8px] font-black uppercase text-muted-foreground leading-none mb-1">Lugar</p>
                                                <p className="text-[10px] font-black text-foreground truncate">{evento.lugar}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-auto flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenModal(evento)} className="p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-primary shadow-xl hover:scale-110 active:scale-90 transition-all border border-primary/10">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setIsDeleting(evento.id)} className="p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-destructive shadow-xl hover:scale-110 active:scale-90 transition-all border border-destructive/10">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button className="px-5 py-3 rounded-2xl bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                                            Ver Detalles
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal Premium Eventos */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                            <Card className="border-none shadow-3xl rounded-[2.5rem] overflow-hidden flex flex-col flex-1 min-h-0 bg-card">
                                <div className="p-8 border-b border-border flex items-center justify-between bg-primary text-white flex-none">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            <Calendar className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                                                {editingEvento ? 'Actualizar' : 'Configurar'} <span className="opacity-60">Evento</span>
                                            </h2>
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 leading-none mt-2">Parámetros de Agenda Institucional</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-4 rounded-3xl hover:bg-white/10 transition-colors">
                                        <X className="w-8 h-8" />
                                    </button>
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); setIsConfirmingSave(true); }} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Nombre del Evento *</label>
                                                    <input
                                                        type="text" required
                                                        value={formData.nombre}
                                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                        className="w-full h-16 px-8 rounded-3xl bg-muted/30 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-black text-foreground"
                                                        placeholder="Ej. Congreso Internacional Profe 2026"
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Descripción General</label>
                                                    <textarea
                                                        value={formData.descripcion}
                                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                                        rows={4}
                                                        className="w-full px-8 py-6 rounded-[2.5rem] bg-muted/30 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-medium text-muted-foreground resize-none leading-relaxed"
                                                        placeholder="Detalle los objetivos y alcance del evento..."
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Fecha del Evento</label>
                                                        <input
                                                            type="date"
                                                            value={formData.fecha}
                                                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                                            className="w-full h-16 px-8 rounded-3xl bg-muted/30 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-black"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Código Interno</label>
                                                        <input
                                                            type="text"
                                                            value={formData.codigo}
                                                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                                            className="w-full h-16 px-8 rounded-3xl bg-muted/30 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-black"
                                                            placeholder="EVT-2026-01"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Ubicación / Lugar</label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                                                        <input
                                                            type="text"
                                                            value={formData.lugar}
                                                            onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                                                            className="w-full h-16 pl-14 pr-8 rounded-3xl bg-muted/30 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-black"
                                                            placeholder="Aula Magna, Plataforma Virtual, etc."
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Tipo de Evento</label>
                                                        <select
                                                            value={formData.tipoId}
                                                            onChange={(e) => setFormData({ ...formData, tipoId: e.target.value })}
                                                            className="w-full h-16 px-8 rounded-3xl bg-muted/30 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-black"
                                                            required
                                                        >
                                                            <option value="">Seleccione Categoría</option>
                                                            {tipos.map(t => (
                                                                <option key={t.id} value={t.id}>{t.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Sede / Departamento</label>
                                                        <select
                                                            value={formData.tenantId}
                                                            onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                                            className="w-full h-16 px-8 rounded-3xl bg-muted/30 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-black disabled:opacity-50"
                                                            disabled={!isSuperAdmin()}
                                                        >
                                                            {isSuperAdmin() && <option value="">Sede Central (Global)</option>}
                                                            {departamentos.map(d => (
                                                                <option key={d.id} value={d.id}>{d.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Estado Actividad</label>
                                                        <select
                                                            value={formData.estado}
                                                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                                            className="w-full h-16 px-8 rounded-3xl bg-muted/30 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-black"
                                                        >
                                                            <option value="ACTIVO">Activo / Visible</option>
                                                            <option value="INACTIVO">Inactivo / Oculto</option>
                                                            <option value="CANCELADO">Cancelado</option>
                                                            <option value="FINALIZADO">Finalizado</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Cupos / Afiches (IDs)</label>
                                                        <input
                                                            type="text"
                                                            value={formData.modulosIds}
                                                            onChange={(e) => setFormData({ ...formData, modulosIds: e.target.value })}
                                                            className="w-full h-16 px-8 rounded-3xl bg-muted/30 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-black"
                                                            placeholder="Modulos IDs (opcional)"
                                                        />
                                                    </div>
                                                </div>

                                                <ImageUpload
                                                    value={formData.afiche}
                                                    onChange={(url) => setFormData({ ...formData, afiche: url })}
                                                    tableName="eventos"
                                                    label="Afiche Principal del Evento"
                                                />

                                                <ImageUpload
                                                    value={formData.banner}
                                                    onChange={(url) => setFormData({ ...formData, banner: url })}
                                                    tableName="eventos"
                                                    label="Banner Superior del Evento"
                                                />

                                                <div className="grid grid-cols-2 gap-6 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, inscripcion: !formData.inscripcion })}
                                                        className={cn(
                                                            "h-20 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                                                            formData.inscripcion ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" : "bg-muted/30 border-transparent text-muted-foreground"
                                                        )}
                                                    >
                                                        <CheckCircle2 className="w-6 h-6" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Inscripción Habilitada</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, asistencia: !formData.asistencia })}
                                                        className={cn(
                                                            "h-20 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                                                            formData.asistencia ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" : "bg-muted/30 border-transparent text-muted-foreground"
                                                        )}
                                                    >
                                                        <Activity className="w-6 h-6" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Control Asistencia</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="p-8 border-t border-border/40 bg-card/95 backdrop-blur-sm">
                                        <div className="flex gap-6">
                                            <button
                                                type="button" onClick={() => setIsModalOpen(false)}
                                                className="h-20 px-12 rounded-[2rem] border-2 border-border text-[11px] font-black uppercase tracking-[0.3em] hover:bg-muted transition-all text-muted-foreground"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit" disabled={isLoading}
                                                className="flex-1 h-20 rounded-[2rem] bg-primary text-white text-[12px] font-black uppercase tracking-[0.4em] shadow-3xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                            >
                                                {isLoading ? <Clock className="w-6 h-6 animate-spin" /> : <SaveIcon className="w-6 h-6" />}
                                                {editingEvento ? 'Guardar Cambios Agenda' : 'Publicar Nuevo Evento'}
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
                title="¿Eliminar Evento?"
                description="Esta acción eliminará permanentemente el evento y toda la información asociada a él."
                confirmText="Sí, eliminar permanentemente"
                cancelText="Mantener evento"
                type="danger"
                isLoading={isLoading}
            />

            <ConfirmModal
                isOpen={isConfirmingSave}
                onClose={() => setIsConfirmingSave(false)}
                onConfirm={handleSubmit}
                title={editingEvento ? "¿Actualizar Evento?" : "¿Crear Evento?"}
                description={editingEvento
                    ? "Se guardarán todos los cambios técnicos y logísticos en la base de datos central de eventos."
                    : "Se dará de alta un nuevo evento en el cronograma institucional de la región."
                }
                confirmText={editingEvento ? "Confirmar Guardado" : "Confirmar Creación"}
                cancelText="Seguir editando"
                type="info"
                isLoading={isLoading}
            />
        </div>
    );
}

function SaveIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .407.16.795.446 1.082a1.53 1.53 0 001.082.446c.231 0 .454-.035.664-.1m3.673 3.673c-.21.065-.433.1-.664.1a1.53 1.53 0 01-1.082-.446 1.53 1.53 0 01-.446-1.082c0-.231.035-.454.1-.664m-5.87 5.87c-.21.065-.433.1-.664.1a1.53 1.53 0 01-1.082-.446 1.53 1.53 0 01-.446-1.082c0-.231.035-.454.1-.664m5.87 5.87c-.21.065-.433.1-.664.1a1.53 1.53 0 01-1.082-.446 1.53 1.53 0 01-.446-1.082c0-.231.035-.454.1-.664M9 21h6a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902-.11-1.342 0l-4.423 1.106c-.5.125-.852.575-.852 1.091V18.75A2.25 2.25 0 009 21z" />
        </svg>
    )
}
