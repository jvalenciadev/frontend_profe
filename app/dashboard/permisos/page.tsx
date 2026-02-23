'use client';

import { useState, useEffect } from 'react';
import { permissionService } from '@/services/permissionService';
import { Permission } from '@/types';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import { Can } from '@/components/Can';
import {
    Shield,
    Plus,
    Edit3,
    Trash2,
    Database,
    Cpu,
    Lock as LucideLock,
    Info,
    CheckCircle2,
    Zap,
    Search,
    Fingerprint,
    Activity,
    AlertCircle,
    Boxes,
    Key,
    ShieldAlert,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { AVAILABLE_SUBJECTS } from '@/lib/constants/subjects';

export default function PermisosPage() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        action: 'read',
        subject: 'all',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await permissionService.getAll();
            setPermissions(data);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Fallo en la sincronización de permisos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (permission: Permission | null = null) => {
        if (permission) {
            setEditingPermission(permission);
            setFormData({
                name: permission.name || '',
                action: permission.action,
                subject: permission.subject,
            });
        } else {
            setEditingPermission(null);
            setFormData({
                name: '',
                action: 'read',
                subject: 'all',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Saneamiento de datos para evitar enviar campos prohibidos por el backend (id, etc)
            const payload = {
                name: formData.name,
                action: formData.action,
                subject: formData.subject
            };

            if (editingPermission) {
                await permissionService.update(editingPermission.id, payload);
                toast.success('Capacidad de seguridad actualizada');
            } else {
                await permissionService.create(payload);
                toast.success('Nueva capacidad registrada');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving permission:', error);
            toast.error('Error en la persistencia de datos');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await permissionService.delete(id);
            toast.success('Permiso revocado');
            setIsDeleting(null);
            loadData();
        } catch (error) {
            console.error('Error deleting permission:', error);
            toast.error('Restricción técnica activa');
        }
    };

    const filteredPermissions = permissions.filter(p =>
        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        p.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const actions = ['manage', 'read', 'create', 'update', 'delete'];

    const getActionColor = (action: string) => {
        switch (action) {
            case 'manage': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'create': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'delete': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            case 'update': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                        <Boxes className="w-4 h-4" />
                        <span>Matriz de Capacidades Atómicas</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Permisos</h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-lg">
                        Administración granular de reglas de seguridad y privilegios del sistema.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar capacidad..."
                            className="h-14 pl-12 pr-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-xs font-bold w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Can action="create" subject="Permission">
                        <button
                            onClick={() => handleOpenModal()}
                            className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                        >
                            <Plus className="w-5 h-5" />
                            Añadir Regla
                        </button>
                    </Can>
                </div>
            </div>

            {/* Grid Display - NOT A LIST */}
            {loading && permissions.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array(8).fill(0).map((_, i) => (
                        <div key={i} className="h-40 rounded-3xl bg-card border border-border animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredPermissions.map((p) => (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group"
                            >
                                <Card className="p-0 overflow-hidden border-border bg-card group-hover:border-primary/40 transition-all duration-300 shadow-xl shadow-black/[0.02]">
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                                <LucideLock className="w-5 h-5" />
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                <Can action="update" subject="Permission">
                                                    <button
                                                        onClick={() => handleOpenModal(p)}
                                                        className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:bg-card border border-transparent hover:border-border transition-all"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5 mx-auto" />
                                                    </button>
                                                </Can>
                                                <Can action="delete" subject="Permission">
                                                    <button
                                                        onClick={() => setIsDeleting(p.id)}
                                                        className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:text-rose-600 hover:bg-card border border-transparent hover:border-border transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                                    </button>
                                                </Can>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight truncate">
                                                {p.name || 'PERMISO_CORE'}
                                            </h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate opacity-60">
                                                OBJ:: {p.subject}
                                            </p>
                                        </div>

                                        <div className="pt-2 flex items-center justify-between border-t border-border/50">
                                            <div className={cn(
                                                "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-colors",
                                                getActionColor(p.action)
                                            )}>
                                                {p.action}
                                            </div>
                                            <div className="text-[9px] font-bold text-muted-foreground/30 font-mono">
                                                {p.id.split('-')[0].toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {!loading && filteredPermissions.length === 0 && (
                        <div className="col-span-full py-20 text-center space-y-4 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border">
                            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                                <ShieldAlert className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">No se detectaron capacidades activas</p>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL REDESIGN - ATOMIC PERMISSION */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPermission ? 'Configuración Atómica' : 'Nueva Regla de Acceso'}
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Alias Técnico</label>
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                                placeholder="p. ej. MANAGE_SYSTEM"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Acción</label>
                                <div className="relative">
                                    <select
                                        className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-bold text-foreground appearance-none"
                                        value={formData.action}
                                        onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                                    >
                                        {actions.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                                    </select>
                                    <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sujeto</label>
                                <div className="relative">
                                    <select
                                        className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-bold text-foreground appearance-none"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    >
                                        {AVAILABLE_SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label.toUpperCase()}</option>)}
                                    </select>
                                    <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
                                </div>
                            </div>
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
                            {editingPermission ? 'Actualizar Regla' : 'Inyectar Regla'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* DELETE CONFIRMATION */}
            <Modal
                isOpen={!!isDeleting}
                onClose={() => setIsDeleting(null)}
                title="Acción Irreversible"
            >
                <div className="space-y-8 text-center py-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border-2 border-rose-500/20">
                        <ShieldAlert className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">¿Revocar Capacidad?</h3>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
                            Esto puede causar fallos de acceso en los roles asociados.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 px-10">
                        <button
                            onClick={() => isDeleting && handleDelete(isDeleting)}
                            className="h-14 w-full rounded-2xl bg-rose-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all"
                        >
                            Confirmar Revocación
                        </button>
                        <button
                            onClick={() => setIsDeleting(null)}
                            className="h-14 w-full rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Mantener Regla
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
