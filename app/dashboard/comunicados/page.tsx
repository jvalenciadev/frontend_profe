'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useComunicados } from '@/features/comunicado/application/useComunicados';
import { Comunicado } from '@/features/comunicado/domain/Comunicado';
import { useDepartamentos } from '@/features/departamento/application/useDepartamentos';
import {
    Megaphone, Plus, Search, Edit3, Trash2, Image as ImageIcon,
    AlertCircle, Bell, CheckCircle2, X, Clock, ShieldAlert,
    Building2, Filter, ArrowRight, RefreshCw, LayoutGrid, List as ListIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getImageUrl } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function ComunicadosPage() {
    const { user, isSuperAdmin } = useAuth();
    const { items: comunicados, loading: comunicadosLoading, loadItems, createItem, updateItem, deleteItem } = useComunicados();
    const { items: departments, loadItems: loadDepartamentos } = useDepartamentos();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterImportance, setFilterImportance] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingComunicado, setEditingComunicado] = useState<Comunicado | null>(null);
    const [formData, setFormData] = useState({
        nombre: '', descripcion: '', imagen: '',
        tipo: 'GENERAL', importancia: 'normal',
        estado: 'activo', tenantId: ''
    });
    const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
    const [isConfirmingSave, setIsConfirmingSave] = useState(false);

    useEffect(() => {
        loadItems();
        loadDepartamentos();
    }, []);

    const handleRefresh = async () => {
        await loadItems();
        toast.info('Actualizado');
    };

    const handleOpenModal = (comunicado?: Comunicado) => {
        if (comunicado) {
            setEditingComunicado(comunicado);
            setFormData({
                nombre: comunicado.nombre || '',
                descripcion: comunicado.descripcion || '',
                imagen: comunicado.imagen || '',
                tipo: comunicado.tipo || 'GENERAL',
                importancia: comunicado.importancia || 'normal',
                estado: comunicado.estado || 'activo',
                tenantId: comunicado.tenantId || ''
            });
        } else {
            setEditingComunicado(null);
            setFormData({
                nombre: '', descripcion: '', imagen: '', tipo: 'GENERAL',
                importancia: 'normal', estado: 'activo',
                tenantId: isSuperAdmin() ? '' : (user?.tenantId || '')
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const payload = { ...formData, tenantId: formData.tenantId || null };
            const success = editingComunicado
                ? await updateItem(editingComunicado.id, payload)
                : await createItem(payload);
            if (success) { setIsModalOpen(false); setIsConfirmingSave(false); }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModalId) return;
        setIsLoading(true);
        try { await deleteItem(deleteModalId); setDeleteModalId(null); }
        finally { setIsLoading(false); }
    };

    const filtered = useMemo(() => (comunicados || []).filter(c => {
        const q = searchTerm.toLowerCase();
        const matchSearch = (c.nombre?.toLowerCase() || '').includes(q) || (c.descripcion?.toLowerCase() || '').includes(q);
        const matchImp = filterImportance === 'all' || c.importancia === filterImportance;
        return matchSearch && matchImp;
    }), [comunicados, searchTerm, filterImportance]);

    const impColors: Record<string, string> = {
        urgente: 'bg-red-500/10 text-red-600 border border-red-200',
        importante: 'bg-amber-500/10 text-amber-600 border border-amber-200',
        normal: 'bg-sky-500/10 text-sky-600 border border-sky-200',
    };
    const impAccent: Record<string, string> = {
        urgente: 'bg-red-500', importante: 'bg-amber-500', normal: 'bg-primary',
    };

    return (
        <div className="min-h-screen bg-background p-6 lg:p-10">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Megaphone className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase italic tracking-tight text-foreground leading-none">
                            Comunicados
                        </h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mt-1">
                            {comunicados.length} publicaciones
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleRefresh}
                        className="h-12 w-12 flex items-center justify-center rounded-2xl border border-border hover:bg-muted transition-all">
                        <RefreshCw className={cn("w-4 h-4 text-muted-foreground", comunicadosLoading && "animate-spin")} />
                    </button>
                    <button onClick={() => handleOpenModal()}
                        className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" /> Nuevo
                    </button>
                </div>
            </div>

            {/* ── FILTERS ── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar comunicado..."
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-card border border-border focus:border-primary transition-all outline-none text-sm font-medium"
                    />
                </div>

                <div className="flex bg-card border border-border rounded-2xl p-1 gap-1">
                    {[['all', 'Todos'], ['normal', 'Normal'], ['importante', 'Import.'], ['urgente', 'Urgente']].map(([val, lbl]) => (
                        <button key={val} onClick={() => setFilterImportance(val)}
                            className={cn("flex-1 sm:flex-none px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                filterImportance === val ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
                            {lbl}
                        </button>
                    ))}
                </div>

                <div className="flex bg-card border border-border rounded-2xl p-1 gap-1">
                    <button onClick={() => setViewMode('grid')}
                        className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted")}>
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('list')}
                        className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted")}>
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── GRID / LIST ── */}
            <AnimatePresence mode="wait">
                {comunicadosLoading && comunicados.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className="h-[340px] rounded-[2rem] bg-card border border-border animate-pulse" />
                        ))}
                    </div>

                ) : filtered.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="py-32 flex flex-col items-center justify-center text-center gap-4">
                        <div className="p-8 rounded-[2.5rem] bg-muted/40 text-muted-foreground/30">
                            <Bell className="w-16 h-16" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-[0.25em] text-muted-foreground">
                            Sin comunicados
                        </p>
                    </motion.div>

                ) : viewMode === 'grid' ? (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filtered.map(c => <ComunicadoCard key={c.id} c={c} impColors={impColors} impAccent={impAccent}
                            onEdit={() => handleOpenModal(c)} onDelete={() => setDeleteModalId(c.id)} />)}
                    </motion.div>
                ) : (
                    <motion.div layout className="flex flex-col gap-3">
                        {filtered.map(c => <ComunicadoRow key={c.id} c={c} impColors={impColors} impAccent={impAccent}
                            onEdit={() => handleOpenModal(c)} onDelete={() => setDeleteModalId(c.id)} />)}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── MODAL FORM ── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 24 }}
                            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-card rounded-[2.5rem] shadow-2xl border border-border overflow-hidden">

                            {/* Header */}
                            <div className="flex items-center justify-between px-10 py-7 border-b border-border flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Megaphone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase italic tracking-tighter text-foreground">
                                            {editingComunicado ? 'Editar' : 'Nuevo'} <span className="text-primary">Comunicado</span>
                                        </h2>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Rellena los campos necesarios</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 rounded-xl bg-muted hover:bg-muted/70 transition-all flex items-center justify-center text-muted-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* Left */}
                                    <div className="space-y-6">
                                        <Field label="Título *">
                                            <input required value={formData.nombre}
                                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                                className="field-input" placeholder="Ej. Suspensión de clases..." />
                                        </Field>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Importancia">
                                                <select value={formData.importancia}
                                                    onChange={e => setFormData({ ...formData, importancia: e.target.value })}
                                                    className="field-input">
                                                    <option value="normal">Normal</option>
                                                    <option value="importante">Importante</option>
                                                    <option value="urgente">Urgente</option>
                                                </select>
                                            </Field>
                                            <Field label="Tipo">
                                                <select value={formData.tipo}
                                                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                                    className="field-input">
                                                    <option value="GENERAL">General</option>
                                                    <option value="ACADEMICO">Académico</option>
                                                    <option value="ADMINISTRATIVO">Administrativo</option>
                                                    <option value="ALERTA">Alerta</option>
                                                </select>
                                            </Field>
                                        </div>

                                        <Field label="Sede / Departamento">
                                            <select value={formData.tenantId}
                                                onChange={e => setFormData({ ...formData, tenantId: e.target.value })}
                                                disabled={!isSuperAdmin()}
                                                className="field-input disabled:opacity-50">
                                                {isSuperAdmin() && <option value="">Global / Central</option>}
                                                {departments.map((d: any) => (
                                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                                ))}
                                            </select>
                                        </Field>

                                        <Field label="Contenido *">
                                            <textarea required rows={6} value={formData.descripcion}
                                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                                className="field-input resize-none pt-4"
                                                placeholder="Escribe el cuerpo del comunicado..." />
                                        </Field>
                                    </div>

                                    {/* Right */}
                                    <div>
                                        <ImageUpload
                                            value={formData.imagen}
                                            onChange={url => setFormData({ ...formData, imagen: url })}
                                            tableName="comunicados"
                                            label="Imagen del Comunicado (opcional)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex gap-4 px-10 py-7 border-t border-border flex-shrink-0 bg-card">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-8 h-14 rounded-2xl border border-border text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all">
                                    Cancelar
                                </button>
                                <button onClick={() => setIsConfirmingSave(true)} disabled={isLoading}
                                    className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {editingComunicado ? 'Guardar Cambios' : 'Publicar'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── CONFIRM MODALS ── */}
            <ConfirmModal
                isOpen={!!deleteModalId}
                onClose={() => setDeleteModalId(null)}
                onConfirm={handleDelete}
                title="¿Eliminar comunicado?"
                description="El comunicado pasará a estado eliminado y no será visible."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
                loading={isLoading}
            />
            <ConfirmModal
                isOpen={isConfirmingSave}
                onClose={() => setIsConfirmingSave(false)}
                onConfirm={handleSubmit}
                title={editingComunicado ? "¿Guardar cambios?" : "¿Publicar comunicado?"}
                description={editingComunicado
                    ? "Los cambios se aplicarán de inmediato."
                    : "El comunicado será visible para todos los destinatarios."}
                confirmText="Confirmar"
                cancelText="Revisar"
                variant="info"
                loading={isLoading}
            />

            <style jsx global>{`
                .field-input {
                    width: 100%;
                    min-height: 48px;
                    padding: 0 1.25rem;
                    border-radius: 1rem;
                    background: hsl(var(--muted) / 0.4);
                    border: 2px solid transparent;
                    font-size: 0.8rem;
                    font-weight: 600;
                    outline: none;
                    transition: border-color 0.2s, background 0.2s;
                    color: hsl(var(--foreground));
                }
                .field-input:focus {
                    border-color: hsl(var(--primary) / 0.4);
                    background: hsl(var(--card));
                }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 10px; }
            `}</style>
        </div>
    );
}

/* ── Sub-components ── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{label}</label>
            {children}
        </div>
    );
}

function ComunicadoCard({ c, impColors, impAccent, onEdit, onDelete }: {
    c: any; impColors: Record<string, string>; impAccent: Record<string, string>;
    onEdit: () => void; onDelete: () => void;
}) {
    const imageUrl = getImageUrl(c.imagen);
    const colorKey = c.importancia in impColors ? c.importancia : 'normal';

    return (
        <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="group">
            <Card className="relative overflow-hidden bg-card border border-border rounded-[2rem] flex flex-col h-full hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">

                {/* Accent top stripe */}
                <div className={cn("h-1.5 w-full flex-shrink-0", impAccent[colorKey])} />

                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-muted flex-shrink-0">
                    {imageUrl ? (
                        <img src={imageUrl} alt={c.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={e => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                            <ImageIcon className="w-12 h-12" />
                        </div>
                    )}

                    {/* Badges on image */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        <span className={cn("px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest", impColors[colorKey])}>
                            {c.importancia}
                        </span>
                        <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-black/40 text-white backdrop-blur-sm border border-white/10">
                            {c.tipo}
                        </span>
                    </div>

                    {/* Action buttons – visible on hover */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onEdit}
                            className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-sm text-primary flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={onDelete}
                            className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-sm text-destructive flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        {c.tenant && (
                            <>
                                <span className="opacity-30">•</span>
                                <Building2 className="w-3.5 h-3.5 text-primary" />
                                <span className="text-primary/70">{c.tenant.nombre}</span>
                            </>
                        )}
                    </div>

                    <h3 className="text-lg font-black uppercase italic tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {c.nombre}
                    </h3>

                    <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-3 flex-1">
                        {c.descripcion}
                    </p>
                </div>
            </Card>
        </motion.div>
    );
}

function ComunicadoRow({ c, impColors, impAccent, onEdit, onDelete }: {
    c: any; impColors: Record<string, string>; impAccent: Record<string, string>;
    onEdit: () => void; onDelete: () => void;
}) {
    const imageUrl = getImageUrl(c.imagen);
    const colorKey = c.importancia in impColors ? c.importancia : 'normal';

    return (
        <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="group">
            <Card className="flex items-center gap-6 bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all px-4 py-4">
                {/* Stripe */}
                <div className={cn("w-1.5 self-stretch rounded-full flex-shrink-0", impAccent[colorKey])} />

                {/* Thumbnail */}
                <div className="w-20 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {imageUrl ? (
                        <img src={imageUrl} alt={c.nombre} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn("px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest", impColors[colorKey])}>
                            {c.importancia}
                        </span>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{c.tipo}</span>
                    </div>
                    <p className="text-sm font-black uppercase italic tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{c.descripcion}</p>
                </div>

                {/* Date */}
                <div className="hidden md:flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-ES') : '—'}
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={onEdit}
                        className="w-9 h-9 rounded-xl bg-muted text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete}
                        className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-white transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </Card>
        </motion.div>
    );
}
