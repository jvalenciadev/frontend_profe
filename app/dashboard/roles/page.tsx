'use client';

import { useState, useEffect } from 'react';
import { roleService } from '@/services/roleService';
import { permissionService } from '@/services/permissionService';
import { Role, Permission } from '@/types';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import { Can } from '@/components/Can';
import {
    ShieldCheck,
    Plus,
    Edit3,
    Trash2,
    ChevronRight,
    Layers,
    Activity,
    Fingerprint,
    Info,
    CheckCircle2,
    Lock as LucideLock,
    Settings,
    Shield,
    ShieldAlert,
    Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        permissionIds: [] as string[]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [rolesData, permsData] = await Promise.all([
                roleService.getAll(),
                permissionService.getAll()
            ]);
            setRoles(rolesData);
            setAllPermissions(permsData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Fallo en la sincronización de permisos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (role: Role | null = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                permissionIds: (role.rolePermissions || role.permissions || []).map((p: any) => {
                    if (p && typeof p === 'object' && 'permission' in p) return (p as any).permission.id;
                    return (p as any).id;
                })
            });
        } else {
            setEditingRole(null);
            setFormData({
                name: '',
                permissionIds: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                guardName: 'api',
                permissions: formData.permissionIds
            };

            if (editingRole) {
                await roleService.update(editingRole.id, payload);
                toast.success('Perfil de seguridad actualizado');
            } else {
                await roleService.create(payload);
                toast.success('Nueva identidad de rol registrada');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving role:', error);
            toast.error('Error en la persistencia de datos');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await roleService.delete(id);
            toast.success('Vínculo removido');
            setIsDeleting(null);
            loadData();
        } catch (error) {
            console.error('Error deleting role:', error);
            toast.error('Restricción: usuarios activos dependientes');
        }
    };

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        const subject = perm.subject || 'SISTEMA CORE';
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                        <Box className="w-4 h-4" />
                        <span>Arquitectura de Perfiles Core</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Roles</h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-lg">
                        Definición de grupos de acceso y herencia de capacidades regionales.
                    </p>
                </div>

                <Can action="create" subject="Role">
                    <button
                        onClick={() => handleOpenModal()}
                        className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                        Generar Perfil
                    </button>
                </Can>
            </div>

            {/* Compact Grid Display */}
            {loading && roles.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-44 rounded-3xl bg-card border border-border animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredRoles.map((role) => (
                            <motion.div
                                key={role.id}
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
                                                <ShieldCheck className="w-6 h-6" />
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                <Can action="update" subject="Role">
                                                    <button
                                                        onClick={() => handleOpenModal(role)}
                                                        className="w-9 h-9 rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-card border border-transparent hover:border-border transition-all"
                                                    >
                                                        <Edit3 className="w-4 h-4 mx-auto" />
                                                    </button>
                                                </Can>
                                                <Can action="delete" subject="Role">
                                                    <button
                                                        onClick={() => setIsDeleting(role.id)}
                                                        className="w-9 h-9 rounded-xl bg-muted text-muted-foreground hover:text-rose-600 hover:bg-card border border-transparent hover:border-border transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4 mx-auto" />
                                                    </button>
                                                </Can>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-lg font-black tracking-tighter text-foreground uppercase leading-none truncate">
                                                {role.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3 h-3 text-emerald-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Activo en Nodo</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Capacidades</span>
                                            </div>
                                            <span className="px-2 py-0.5 bg-muted rounded-md text-[9px] font-black text-foreground border border-border">
                                                {(role.rolePermissions || role.permissions || []).length}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* ROLES MODAL - COMPACT CONFIG */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRole ? 'Ajustar Perfil Técnico' : 'Generar Nueva Escala de Acceso'}
            >
                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                <Fingerprint className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Identificación del Perfil</h4>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Alias del Perfil</label>
                                <input
                                    type="text"
                                    className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                                    placeholder="p. ej. ADMIN_SOPORTE"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                    <LucideLock className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Matriz de Permisos</h4>
                            </div>
                            <div className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-[9px] font-black rounded-lg uppercase tracking-widest">
                                {formData.permissionIds.length} ASIGNADOS
                            </div>
                        </div>

                        <div className="max-h-[350px] overflow-y-auto pr-2 space-y-8 scrollbar-none">
                            {Object.entries(groupedPermissions).map(([subject, perms]) => (
                                <div key={subject} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-[1px] flex-1 bg-border/40" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">{subject}</span>
                                        <div className="h-[1px] flex-1 bg-border/40" />
                                    </div>
                                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                                        {perms.map(perm => {
                                            const pId = 'permission' in perm ? (perm as any).permission.id : (perm as any).id;
                                            const isSelected = formData.permissionIds.includes(pId);

                                            return (
                                                <button
                                                    key={pId}
                                                    type="button"
                                                    onClick={() => {
                                                        const newIds = isSelected
                                                            ? formData.permissionIds.filter(id => id !== pId)
                                                            : [...formData.permissionIds, pId];
                                                        setFormData({ ...formData, permissionIds: newIds });
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left group/perm relative overflow-hidden",
                                                        isSelected
                                                            ? "bg-primary/5 border-primary shadow-sm"
                                                            : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all border",
                                                        isSelected ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border group-hover/perm:border-primary/40 shadow-inner"
                                                    )}>
                                                        {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={cn("text-[11px] font-black uppercase tracking-tight truncate", isSelected ? "text-primary" : "text-foreground")}>{perm.name}</p>
                                                        <p className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground/50 truncate">
                                                            ACTION::{perm.action}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cerrar
                        </button>
                        <button
                            type="submit"
                            className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:opacity-90 transition-all"
                        >
                            {editingRole ? 'Salvar Perfil' : 'Crear Perfil'}
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
                        <ShieldAlert className="w-10 h-10" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase">¿Remover Perfil?</h3>
                        <p className="text-[13px] text-muted-foreground px-10 leading-relaxed font-bold italic opacity-70">
                            "Esta acción puede restringir accesos heredados de forma inmediata."
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 px-8">
                        <button
                            onClick={() => isDeleting && handleDelete(isDeleting)}
                            className="h-14 w-full rounded-2xl bg-destructive text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-destructive/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                            Confirmar Remoción Técnica
                        </button>
                        <button
                            onClick={() => setIsDeleting(null)}
                            className="h-14 w-full rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Mantener Integridad
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
