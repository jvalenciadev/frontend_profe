'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { eventoService, type Evento } from '@/services/eventoService';
import { departmentService } from '@/services/departmentService';
import { programaLookupService } from '@/services/programaLookupService';
import {
    Calendar, Plus, Search, Edit, Trash2, MapPin, Tag,
    Building2, Activity, CheckCircle2, Save, Trophy, Users,
    X, Settings2, Clock, Filter, LayoutGrid, LayoutList,
    Zap, ChevronDown, Globe, Lock, Eye
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getImageUrl } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';

// ─── Paleta de colores por tipo de evento ────────────────────────────────────
const TIPO_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    default: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', dot: 'bg-primary' },
    congreso: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', dot: 'bg-purple-500' },
    taller: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' },
    seminario: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-500' },
    feria: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', dot: 'bg-green-500' },
    conferencia: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-500' },
};

function getTipoColor(nombre?: string) {
    if (!nombre) return TIPO_COLORS.default;
    const key = Object.keys(TIPO_COLORS).find(k => nombre.toLowerCase().includes(k));
    return TIPO_COLORS[key || 'default'];
}

function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EventosPage() {
    const { user, isSuperAdmin } = useAuth();
    const router = useRouter();
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [tipos, setTipos] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [modalidades, setModalidades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
    const [formData, setFormData] = useState({
        nombre: '', descripcion: '', codigo: '', banner: '', afiche: '',
        modalidadIds: '', fecha: new Date().toISOString().split('T')[0],
        inscripcionAbierta: true, asistencia: false, lugar: '',
        totalInscritos: 0, estado: 'activo', tipoId: '', tenantId: ''
    });
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isConfirmingSave, setIsConfirmingSave] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => { loadData(); }, []);
    useEffect(() => { if (user) loadMetadata(); }, [user, isSuperAdmin]);

    const loadMetadata = async () => {
        try {
            const [typesData, deptsData, modsData] = await Promise.all([
                eventoService.getTipos(),
                departmentService.getAll(),
                programaLookupService.getModalidades()
            ]);
            setTipos(typesData);
            setModalidades(modsData);
            if (isSuperAdmin()) {
                setDepartamentos(deptsData);
            } else if (user?.tenantId) {
                setDepartamentos(deptsData.filter((d: any) => d.id === user.tenantId));
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
            toast.error('Error al cargar los eventos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (evento?: Evento) => {
        if (evento) {
            setEditingEvento(evento);
            setFormData({
                nombre: evento.nombre, descripcion: evento.descripcion,
                codigo: evento.codigo || '', banner: evento.banner || '',
                afiche: evento.afiche || '', modalidadIds: (evento as any).modalidadIds || '',
                fecha: evento.fecha ? evento.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
                inscripcionAbierta: (evento as any).inscripcionAbierta ?? true,
                asistencia: evento.asistencia ?? false, lugar: evento.lugar || '',
                totalInscritos: evento.totalInscritos || 0, estado: evento.estado || 'activo',
                tipoId: evento.tipoId || '', tenantId: evento.tenantId || ''
            });
        } else {
            setEditingEvento(null);
            setFormData({
                nombre: '', descripcion: '', codigo: '', banner: '', afiche: '',
                modalidadIds: '', fecha: new Date().toISOString().split('T')[0],
                inscripcionAbierta: true, asistencia: false, lugar: '',
                totalInscritos: 0, estado: 'activo',
                tipoId: tipos[0]?.id || '',
                tenantId: isSuperAdmin() ? '' : (user?.tenantId || '')
            });
        }
        setActiveStep(0);
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const payload = {
                ...formData,
                fecha: new Date(formData.fecha).toISOString(),
                totalInscritos: Number(formData.totalInscritos),
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
            toast.error('Error al eliminar el evento');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredEventos = (eventos || []).filter(e => {
        const term = searchTerm.toLowerCase();
        const matchSearch = (e.nombre?.toLowerCase() || '').includes(term) ||
            (e.descripcion?.toLowerCase() || '').includes(term) ||
            (e.lugar?.toLowerCase() || '').includes(term);
        const matchTipo = !filterTipo || e.tipoId === filterTipo;
        const matchEstado = !filterEstado || e.estado === filterEstado;
        return matchSearch && matchTipo && matchEstado;
    });

    // Stats
    const stats = {
        total: eventos.length,
        activos: eventos.filter(e => e.estado === 'activo').length,
        inscritos: eventos.reduce((acc, e) => acc + (e.totalInscritos || 0), 0),
        conAsistencia: eventos.filter(e => e.asistencia).length,
    };

    const FORM_STEPS = ['Información', 'Configuración', 'Imágenes'];

    // ── RENDER ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background">

            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="mb-8">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                                <Trophy className="w-7 h-7" />
                            </div>
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                                <span className="text-[8px] text-white font-black">{stats.activos}</span>
                            </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                                Agenda de <span className="text-primary">Eventos</span>
                            </h1>
                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground mt-0.5">
                                Coordinación Académica Institucional
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2.5 h-12 px-6 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Evento
                    </button>
                </div>

                {/* Stats Pills */}
                <div className="flex flex-wrap gap-3 mt-6">
                    {[
                        { label: 'Total Eventos', val: stats.total, icon: Calendar, color: 'bg-primary/10 text-primary border-primary/20' },
                        { label: 'Activos', val: stats.activos, icon: Zap, color: 'bg-green-500/10 text-green-400 border-green-500/20' },
                        { label: 'Participantes', val: stats.inscritos, icon: Users, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                        { label: 'Con Asistencia', val: stats.conAsistencia, icon: CheckCircle2, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                    ].map(s => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border ${s.color} backdrop-blur-sm`}
                        >
                            <s.icon className="w-4 h-4" />
                            <span className="text-xl font-black">{s.val}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-70">{s.label}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ── FILTROS Y BÚSQUEDA ─────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
                <div className="relative flex-1 min-w-52">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar eventos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 rounded-2xl bg-card border border-border focus:border-primary transition-all outline-none text-sm font-medium"
                    />
                </div>
                <select
                    value={filterTipo}
                    onChange={e => setFilterTipo(e.target.value)}
                    className="h-11 px-4 rounded-2xl bg-card border border-border focus:border-primary transition-all outline-none text-sm font-bold text-foreground"
                >
                    <option value="">Todos los tipos</option>
                    {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <select
                    value={filterEstado}
                    onChange={e => setFilterEstado(e.target.value)}
                    className="h-11 px-4 rounded-2xl bg-card border border-border focus:border-primary transition-all outline-none text-sm font-bold text-foreground"
                >
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="finalizado">Finalizado</option>
                </select>
                {/* View Toggle */}
                <div className="flex gap-1 bg-card border border-border rounded-2xl p-1">
                    <button onClick={() => setViewMode('table')} className={cn('p-2 rounded-xl transition-all', viewMode === 'table' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}>
                        <LayoutList className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-xl transition-all', viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}>
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── CONTENIDO ──────────────────────────────────────────────── */}
            {loading ? (
                <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-card animate-pulse border border-border/50" />
                    ))}
                </div>
            ) : filteredEventos.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-32 text-muted-foreground/30">
                    <Calendar className="w-16 h-16 mb-4" strokeWidth={1} />
                    <p className="text-sm font-black uppercase tracking-widest">Sin eventos registrados</p>
                    <p className="text-xs mt-1">Crea el primero con el botón de arriba</p>
                </motion.div>
            ) : viewMode === 'table' ? (
                /* ── VISTA TABLA ── */
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/60 bg-muted/30">
                                    <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Evento</th>
                                    <th className="text-left px-4 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Tipo</th>
                                    <th className="text-left px-4 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Fecha</th>
                                    <th className="text-left px-4 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Lugar</th>
                                    <th className="text-center px-4 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Inscritos</th>
                                    <th className="text-center px-4 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Estado</th>
                                    <th className="text-center px-4 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Inscripción</th>
                                    <th className="text-center px-4 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredEventos.map((evento, idx) => {
                                        const tipoNombre = (evento as any).tipo?.nombre || '';
                                        const color = getTipoColor(tipoNombre);
                                        return (
                                            <motion.tr
                                                key={evento.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="border-b border-border/30 hover:bg-muted/20 transition-colors group"
                                            >
                                                {/* Evento */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0">
                                                            {evento.banner ? (
                                                                <img src={getImageUrl(evento.banner)} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                                    <Calendar className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-foreground text-sm leading-tight">{evento.nombre}</p>
                                                            {evento.codigo && <p className="text-[10px] font-mono text-muted-foreground">{evento.codigo}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Tipo */}
                                                <td className="px-4 py-4">
                                                    {tipoNombre ? (
                                                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black border', color.bg, color.text, color.border)}>
                                                            <span className={cn('w-1.5 h-1.5 rounded-full', color.dot)} />
                                                            {tipoNombre}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">—</span>
                                                    )}
                                                </td>
                                                {/* Fecha */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {formatDate(evento.fecha)}
                                                    </div>
                                                </td>
                                                {/* Lugar */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[160px]">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate">{evento.lugar || '—'}</span>
                                                    </div>
                                                </td>
                                                {/* Inscritos */}
                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 text-sm font-black border border-blue-500/20">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {evento.totalInscritos || 0}
                                                    </span>
                                                </td>
                                                {/* Estado */}
                                                <td className="px-4 py-4 text-center">
                                                    <StatusBadge status={evento.estado || 'activo'} />
                                                </td>
                                                {/* Inscripción */}
                                                <td className="px-4 py-4 text-center">
                                                    {(evento as any).inscripcionAbierta ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-[10px] font-black border border-green-500/20">
                                                            <Globe className="w-3 h-3" /> Abierta
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-muted-foreground text-[10px] font-black">
                                                            <Lock className="w-3 h-3" /> Cerrada
                                                        </span>
                                                    )}
                                                </td>
                                                {/* Acciones */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => router.push(`/dashboard/eventos/${evento.id}`)}
                                                            className="h-8 px-3 rounded-xl bg-primary/10 text-primary text-xs font-black hover:bg-primary/20 transition-all flex items-center gap-1.5"
                                                        >
                                                            <Settings2 className="w-3.5 h-3.5" />
                                                            Panel
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenModal(evento)}
                                                            className="w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setIsDeleting(evento.id)}
                                                            className="w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-3 border-t border-border/30 bg-muted/20 flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Mostrando <b>{filteredEventos.length}</b> de <b>{eventos.length}</b> eventos
                        </p>
                    </div>
                </motion.div>
            ) : (
                /* ── VISTA GRID ── */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <AnimatePresence>
                        {filteredEventos.map((evento, idx) => {
                            const tipoNombre = (evento as any).tipo?.nombre || '';
                            const color = getTipoColor(tipoNombre);
                            return (
                                <motion.div
                                    key={evento.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                >
                                    <Card className="group overflow-hidden bg-card border border-border/50 rounded-3xl h-full flex flex-col shadow-sm hover:shadow-lg hover:border-primary/20 transition-all">
                                        {/* Banner */}
                                        <div className="relative h-40 overflow-hidden bg-muted">
                                            {evento.banner ? (
                                                <img src={getImageUrl(evento.banner)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={evento.nombre} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Calendar className="w-12 h-12 text-muted-foreground/30" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                <StatusBadge status={evento.estado || 'activo'} className="text-[10px]" />
                                            </div>
                                            {tipoNombre && (
                                                <div className="absolute bottom-3 left-3">
                                                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black', color.bg, color.text, 'bg-opacity-90 backdrop-blur-sm border', color.border)}>
                                                        <span className={cn('w-1.5 h-1.5 rounded-full', color.dot)} />
                                                        {tipoNombre}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col gap-3">
                                            <div>
                                                <h3 className="font-black text-foreground text-base leading-tight uppercase">{evento.nombre}</h3>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{evento.descripcion}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{formatDate(evento.fecha)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{evento.lugar || '—'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-blue-400">
                                                    <Users className="w-3.5 h-3.5" />
                                                    <span>{evento.totalInscritos || 0} inscritos</span>
                                                </div>
                                                {(evento as any).tenant && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        <span className="truncate">{(evento as any).tenant.nombre}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-3 border-t border-border/30 flex items-center justify-between">
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => handleOpenModal(evento)} className="w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setIsDeleting(evento.id)} className="w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/dashboard/eventos/${evento.id}`)}
                                                    className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all"
                                                >
                                                    <Settings2 className="w-3.5 h-3.5" />
                                                    Panel
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* ── MODAL CREAR/EDITAR ────────────────────────────────────── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl rounded-3xl overflow-hidden"
                        >
                            <Card className="border-none rounded-3xl flex flex-col flex-1 min-h-0 bg-card">
                                {/* Header Modal */}
                                <div className="px-8 py-6 bg-primary text-white flex items-center justify-between flex-none">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black uppercase tracking-tight">
                                                {editingEvento ? 'Editar Evento' : 'Nuevo Evento'}
                                            </h2>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                                Plataforma Académica PROFE
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-2xl hover:bg-white/10 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Stepper */}
                                <div className="flex gap-0 border-b border-border/40 flex-none">
                                    {FORM_STEPS.map((step, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveStep(i)}
                                            className={cn(
                                                'flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2',
                                                activeStep === i
                                                    ? 'border-primary text-primary bg-primary/5'
                                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <span className={cn('w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black', activeStep === i ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>
                                                    {i + 1}
                                                </span>
                                                {step}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-5">
                                    <AnimatePresence mode="wait">
                                        {activeStep === 0 && (
                                            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Nombre del Evento *</label>
                                                        <input
                                                            type="text" required value={formData.nombre}
                                                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                                            className="w-full h-12 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-bold text-foreground"
                                                            placeholder="Ej. Congreso Internacional PROFE 2026"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Descripción</label>
                                                        <textarea
                                                            value={formData.descripcion}
                                                            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                                            rows={3}
                                                            className="w-full px-5 py-4 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary transition-all outline-none text-sm text-muted-foreground resize-none"
                                                            placeholder="Objetivos y alcance del evento..."
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Fecha del Evento</label>
                                                        <input
                                                            type="date" value={formData.fecha}
                                                            onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                                            className="w-full h-12 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Código Interno</label>
                                                        <input
                                                            type="text" value={formData.codigo}
                                                            onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                                            className="w-full h-12 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-bold font-mono"
                                                            placeholder="EVT-2026-01"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Lugar / Ubicación</label>
                                                        <div className="relative">
                                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <input
                                                                type="text" value={formData.lugar}
                                                                onChange={e => setFormData({ ...formData, lugar: e.target.value })}
                                                                className="w-full h-12 pl-11 pr-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-bold"
                                                                placeholder="Aula Magna, Online..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Estado</label>
                                                        <select
                                                            value={formData.estado}
                                                            onChange={e => setFormData({ ...formData, estado: e.target.value })}
                                                            className="w-full h-12 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-bold"
                                                        >
                                                            <option value="activo">Activo</option>
                                                            <option value="inactivo">Inactivo</option>
                                                            <option value="cancelado">Cancelado</option>
                                                            <option value="finalizado">Finalizado</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeStep === 1 && (
                                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Tipo de Evento *</label>
                                                        <select
                                                            value={formData.tipoId}
                                                            onChange={e => setFormData({ ...formData, tipoId: e.target.value })}
                                                            className="w-full h-12 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-bold"
                                                            required
                                                        >
                                                            <option value="">Seleccione tipo...</option>
                                                            {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Sede / Departamento</label>
                                                        <select
                                                            value={formData.tenantId}
                                                            onChange={e => setFormData({ ...formData, tenantId: e.target.value })}
                                                            disabled={!isSuperAdmin()}
                                                            className="w-full h-12 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-bold disabled:opacity-50"
                                                        >
                                                            {isSuperAdmin() && <option value="">Global (Todas las sedes)</option>}
                                                            {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Modalidad</label>
                                                        <select
                                                            value={formData.modalidadIds}
                                                            onChange={e => setFormData({ ...formData, modalidadIds: e.target.value })}
                                                            className="w-full h-12 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary transition-all outline-none text-sm font-bold"
                                                        >
                                                            <option value="">Seleccione modalidad...</option>
                                                            {modalidades.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Toggles */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, inscripcionAbierta: !formData.inscripcionAbierta })}
                                                        className={cn(
                                                            'h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2',
                                                            formData.inscripcionAbierta
                                                                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                                                : 'bg-muted/30 border-transparent text-muted-foreground'
                                                        )}
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                                            Inscripción {formData.inscripcionAbierta ? 'Abierta' : 'Cerrada'}
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, asistencia: !formData.asistencia })}
                                                        className={cn(
                                                            'h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2',
                                                            formData.asistencia
                                                                ? 'bg-primary/10 border-primary/40 text-primary'
                                                                : 'bg-muted/30 border-transparent text-muted-foreground'
                                                        )}
                                                    >
                                                        <Activity className="w-5 h-5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                                            Control {formData.asistencia ? 'Activo' : 'Sin Asistencia'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeStep === 2 && (
                                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                                <ImageUpload
                                                    value={formData.banner}
                                                    onChange={url => setFormData({ ...formData, banner: url })}
                                                    tableName="eventos"
                                                    label="Banner del Evento"
                                                />
                                                <ImageUpload
                                                    value={formData.afiche}
                                                    onChange={url => setFormData({ ...formData, afiche: url })}
                                                    tableName="eventos"
                                                    label="Afiche del Evento"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-5 border-t border-border/40 bg-muted/20 flex items-center justify-between flex-none">
                                    <div className="flex gap-2">
                                        {activeStep > 0 && (
                                            <button
                                                onClick={() => setActiveStep(s => s - 1)}
                                                className="h-11 px-5 rounded-2xl bg-muted text-muted-foreground text-sm font-black hover:text-foreground transition-all"
                                            >
                                                ← Anterior
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="h-11 px-5 rounded-2xl border border-border text-sm font-black text-muted-foreground hover:text-foreground transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                    {activeStep < FORM_STEPS.length - 1 ? (
                                        <button
                                            onClick={() => setActiveStep(s => s + 1)}
                                            className="h-11 px-8 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary/90 transition-all"
                                        >
                                            Siguiente →
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setIsConfirmingSave(true)}
                                            disabled={isLoading || !formData.nombre}
                                            className="h-11 px-8 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {editingEvento ? 'Guardar Cambios' : 'Crear Evento'}
                                        </button>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modals de confirmación */}
            <ConfirmModal
                isOpen={!!isDeleting}
                onClose={() => setIsDeleting(null)}
                onConfirm={() => isDeleting && handleDelete(isDeleting)}
                title="¿Eliminar Evento?"
                description="Esta acción eliminará permanentemente el evento y toda la información asociada."
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                type="danger"
                isLoading={isLoading}
            />
            <ConfirmModal
                isOpen={isConfirmingSave}
                onClose={() => setIsConfirmingSave(false)}
                onConfirm={handleSubmit}
                title={editingEvento ? '¿Actualizar Evento?' : '¿Crear Evento?'}
                description={editingEvento
                    ? 'Se guardarán los cambios en la base de datos.'
                    : 'Se publicará el nuevo evento en el cronograma institucional.'}
                confirmText={editingEvento ? 'Confirmar' : 'Crear Evento'}
                cancelText="Seguir editando"
                type="info"
                isLoading={isLoading}
            />
        </div>
    );
}
