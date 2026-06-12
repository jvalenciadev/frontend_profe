'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/features/role/application/useRoles';
import { usePermissions } from '@/features/permission/application/usePermissions';
import { permissionService } from '@/services/permissionService';
import { Role } from '@/features/role/domain/Role';
import { Permission } from '@/features/permission/domain/Permission';
import { Modal } from '@/components/Modal';
import { Can } from '@/components/Can';
import { AVAILABLE_SUBJECTS } from '@/lib/constants/subjects';
import {
    ShieldCheck,
    Plus,
    Edit3,
    Trash2,
    ChevronRight,
    Layers,
    Lock as LucideLock,
    Shield,
    ShieldAlert,
    CheckCircle2,
    Search,
    X,
    Fingerprint,
    Activity,
    Key,
    Boxes,
    Users,
    AlertTriangle,
    Sparkles,
    RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ─── helpers ──────────────────────────────────────────────────────────────────
function cn(...classes: (string | false | null | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

const ACTION_STYLES: Record<string, string> = {
    manage: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    create: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    delete: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    update: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    read: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
};
const ACTIONS = ['manage', 'read', 'create', 'update', 'delete'];

function getPermIds(role: Role): string[] {
    return ((role as any).rolePermissions || (role as any).permissions || []).map((p: any) =>
        p && typeof p === 'object' && 'permission' in p ? p.permission.id : p.id
    );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function SeguridadPage() {
    const { isLoading: authLoading, isAuthenticated } = useAuth();

    // ── data
    const { items: roles, loading: rolesLoading, loadItems: loadRoles, createItem, updateItem, deleteItem: deleteRole } = useRoles();
    const { items: allPermissions, loadItems: loadPermissions } = usePermissions();

    // ── selection / filter
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [permSearch, setPermSearch] = useState('');
    const [roleSearch, setRoleSearch] = useState('');

    // ── role modal state
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [roleForm, setRoleForm] = useState({ name: '', permissionIds: [] as string[] });
    const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

    // ── permission modal state
    const [permModalOpen, setPermModalOpen] = useState(false);
    const [editingPerm, setEditingPerm] = useState<Permission | null>(null);
    const [permForm, setPermForm] = useState({ name: '', action: 'read', subject: 'all' });
    const [deletingPermId, setDeletingPermId] = useState<string | null>(null);

    // ── active tab (mobile)
    const [mobileTab, setMobileTab] = useState<'roles' | 'permisos'>('roles');
    // ── permissions view mode (only relevant when a role is selected)
    const [showOnlyActive, setShowOnlyActive] = useState(true);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadRoles();
            loadPermissions();
        }
    }, [authLoading, isAuthenticated, loadRoles, loadPermissions]);

    // ── derived
    const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId) ?? null, [roles, selectedRoleId]);
    const selectedPermIds = useMemo(() => selectedRole ? getPermIds(selectedRole) : [], [selectedRole]);

    // Reset view mode when role changes
    useEffect(() => { setShowOnlyActive(true); }, [selectedRoleId]);

    const filteredRoles = useMemo(() =>
        roles.filter(r => r.name.toLowerCase().includes(roleSearch.toLowerCase())),
        [roles, roleSearch]
    );

    const groupedPermissions = useMemo(() => {
        // pool: si hay rol y modo activos → solo los suyos; sino todos
        const pool = (selectedRole && showOnlyActive)
            ? allPermissions.filter(p => selectedPermIds.includes(p.id))
            : allPermissions;

        const filtered = pool.filter(p =>
            (p.name?.toLowerCase() || '').includes(permSearch.toLowerCase()) ||
            p.action.toLowerCase().includes(permSearch.toLowerCase()) ||
            p.subject.toLowerCase().includes(permSearch.toLowerCase())
        );
        return filtered.reduce((acc, perm) => {
            const s = perm.subject || 'SISTEMA';
            if (!acc[s]) acc[s] = [];
            acc[s].push(perm);
            return acc;
        }, {} as Record<string, Permission[]>);
    }, [allPermissions, permSearch, selectedRole, selectedPermIds, showOnlyActive]);

    // ── stats
    const unassignedPerms = useMemo(() => {
        const assigned = new Set(roles.flatMap(r => getPermIds(r)));
        return allPermissions.filter(p => !assigned.has(p.id)).length;
    }, [roles, allPermissions]);

    // ── role handlers
    const openRoleModal = (role: Role | null = null) => {
        setEditingRole(role);
        setRoleForm(role
            ? { name: role.name, permissionIds: getPermIds(role) }
            : { name: '', permissionIds: [] }
        );
        setRoleModalOpen(true);
    };

    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { name: roleForm.name, guardName: 'api', permissions: roleForm.permissionIds };
        const ok = editingRole ? await updateItem(editingRole.id, payload) : await createItem(payload);
        if (ok) { setRoleModalOpen(false); loadPermissions(); }
    };

    const handleRoleDelete = async (id: string) => {
        await deleteRole(id);
        if (selectedRoleId === id) setSelectedRoleId(null);
        setDeletingRoleId(null);
    };

    // ── inline assign/unassign permission to selected role
    const [togglingPermId, setTogglingPermId] = useState<string | null>(null);

    const togglePermForRole = async (permId: string) => {
        if (!selectedRole || togglingPermId) return;
        setTogglingPermId(permId);
        const current = getPermIds(selectedRole);
        const updated = current.includes(permId)
            ? current.filter(id => id !== permId)
            : [...current, permId];
        await updateItem(selectedRole.id, {
            name: selectedRole.name,
            guardName: 'api',
            permissions: updated,
        } as any);
        setTogglingPermId(null);
    };

    // ── permission handlers
    const openPermModal = (perm: Permission | null = null) => {
        setEditingPerm(perm);
        setPermForm(perm
            ? { name: perm.name || '', action: perm.action, subject: perm.subject }
            : { name: '', action: 'read', subject: 'all' }
        );
        setPermModalOpen(true);
    };

    const handlePermSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { name: permForm.name, action: permForm.action, subject: permForm.subject };
        try {
            if (editingPerm) {
                await permissionService.update(editingPerm.id, payload);
                toast.success('Permiso actualizado');
            } else {
                await permissionService.create(payload);
                toast.success('Permiso creado');
            }
            setPermModalOpen(false);
            loadPermissions();
        } catch { toast.error('Error al guardar permiso'); }
    };

    const handlePermDelete = async (id: string) => {
        try {
            await permissionService.delete(id);
            toast.success('Permiso eliminado');
            setDeletingPermId(null);
            loadPermissions();
        } catch { toast.error('Error al eliminar permiso'); }
    };

    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Estableciendo canal seguro...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-20 min-h-0">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Control de Acceso · CASL / RBAC</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                        Seguridad
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-lg">
                        Gestión unificada de roles y permisos. Selecciona un rol para ver y comparar sus capacidades asignadas.
                    </p>
                </div>

                {/* Stats strip */}
                <div className="flex items-center gap-3 flex-wrap">
                    <Stat icon={<Users className="w-4 h-4" />} label="Roles" value={roles.length} color="text-primary" />
                    <Stat icon={<Key className="w-4 h-4" />} label="Permisos" value={allPermissions.length} color="text-emerald-500" />
                    {unassignedPerms > 0 && (
                        <Stat icon={<AlertTriangle className="w-4 h-4" />} label="Sin asignar" value={unassignedPerms} color="text-amber-500" />
                    )}
                </div>
            </div>

            {/* ── Mobile Tab switcher ────────────────────────────────────── */}
            <div className="flex lg:hidden gap-2 p-1 bg-muted/40 rounded-2xl border border-border/50 w-full">
                {(['roles', 'permisos'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setMobileTab(tab)}
                        className={cn(
                            'flex-1 h-10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                            mobileTab === tab
                                ? 'bg-card border border-border shadow text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── Split panel ────────────────────────────────────────────── */}
            <div className="flex gap-6 min-h-[70vh]">

                {/* LEFT – Roles */}
                <div className={cn(
                    'flex flex-col gap-4 w-full lg:w-[38%] lg:flex-shrink-0',
                    mobileTab !== 'roles' && 'hidden lg:flex'
                )}>
                    {/* Panel header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-foreground">
                                Roles
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-muted text-[9px] font-black border border-border text-muted-foreground">
                                {filteredRoles.length}
                            </span>
                        </div>
                        <Can action="create" subject="Role">
                            <button
                                onClick={() => openRoleModal()}
                                className="h-9 px-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> Nuevo
                            </button>
                        </Can>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            value={roleSearch}
                            onChange={e => setRoleSearch(e.target.value)}
                            placeholder="Filtrar roles..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-xs font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                        />
                    </div>

                    {/* Role list */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                        {rolesLoading && roles.length === 0
                            ? Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />
                            ))
                            : (
                                <AnimatePresence mode="popLayout">
                                    {filteredRoles.map(role => {
                                        const isSelected = selectedRoleId === role.id;
                                        const permCount = getPermIds(role).length;
                                        return (
                                            <motion.div
                                                key={role.id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setSelectedRoleId(isSelected ? null : role.id);
                                                        setMobileTab('permisos');
                                                    }}
                                                    className={cn(
                                                        'w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 group relative overflow-hidden',
                                                        isSelected
                                                            ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10'
                                                            : 'bg-card border-border hover:border-primary/30'
                                                    )}
                                                >
                                                    {/* selected glow bar */}
                                                    {isSelected && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />
                                                    )}
                                                    <div className="flex items-center justify-between gap-3 pl-1">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={cn(
                                                                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all',
                                                                isSelected
                                                                    ? 'bg-primary text-white border-primary'
                                                                    : 'bg-muted text-muted-foreground border-border group-hover:border-primary/40'
                                                            )}>
                                                                <ShieldCheck className="w-4 h-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className={cn(
                                                                    'text-sm font-black uppercase tracking-tight truncate',
                                                                    isSelected ? 'text-primary' : 'text-foreground'
                                                                )}>
                                                                    {role.name}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                                                    {permCount} capacidades
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Can action="update" subject="Role">
                                                                <button
                                                                    onClick={ev => { ev.stopPropagation(); openRoleModal(role); }}
                                                                    className="w-7 h-7 rounded-lg bg-muted/60 text-muted-foreground hover:text-primary hover:bg-card border border-transparent hover:border-border transition-all flex items-center justify-center"
                                                                >
                                                                    <Edit3 className="w-3 h-3" />
                                                                </button>
                                                            </Can>
                                                            <Can action="delete" subject="Role">
                                                                <button
                                                                    onClick={ev => { ev.stopPropagation(); setDeletingRoleId(role.id); }}
                                                                    className="w-7 h-7 rounded-lg bg-muted/60 text-muted-foreground hover:text-rose-600 hover:bg-card border border-transparent hover:border-border transition-all flex items-center justify-center"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </Can>
                                                        </div>
                                                    </div>
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )
                        }
                        {!rolesLoading && filteredRoles.length === 0 && (
                            <div className="py-16 text-center rounded-2xl border-2 border-dashed border-border">
                                <ShieldAlert className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Sin roles</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* DIVIDER */}
                <div className="hidden lg:block w-px bg-border/60 shrink-0" />

                {/* RIGHT – Permissions */}
                <div className={cn(
                    'flex flex-col gap-4 flex-1 min-w-0',
                    mobileTab !== 'permisos' && 'hidden lg:flex'
                )}>
                    {/* Panel header */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <Key className="w-4 h-4 text-emerald-500" />
                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-foreground">
                                {selectedRole ? 'Permisos Activos' : 'Permisos'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-muted text-[9px] font-black border border-border text-muted-foreground">
                                {selectedRole ? selectedPermIds.length : allPermissions.length}
                            </span>

                            {/* Selected role badge */}
                            <AnimatePresence>
                                {selectedRole && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[9px] font-black uppercase tracking-wider"
                                    >
                                        <CheckCircle2 className="w-3 h-3" />
                                        {selectedRole.name}
                                        <button onClick={() => setSelectedRoleId(null)} className="ml-1 hover:text-rose-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Toggle solo activos / ver todos — visible solo con rol seleccionado */}
                            {selectedRole && (
                                <button
                                    onClick={() => setShowOnlyActive(v => !v)}
                                    className={cn(
                                        'h-9 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all',
                                        showOnlyActive
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                                            : 'bg-primary/10 border-primary/30 text-primary'
                                    )}
                                >
                                    <Layers className="w-3 h-3" />
                                    {showOnlyActive ? 'Solo activos' : 'Ver todos'}
                                </button>
                            )}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                    value={permSearch}
                                    onChange={e => setPermSearch(e.target.value)}
                                    placeholder="Buscar permiso..."
                                    className="h-9 pl-9 pr-4 w-48 rounded-xl bg-card border border-border text-xs font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                />
                            </div>
                            <Can action="create" subject="Permission">
                                <button
                                    onClick={() => openPermModal()}
                                    className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:opacity-90 active:scale-95 transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Añadir
                                </button>
                            </Can>
                        </div>
                    </div>

                    {/* Permissions grouped by subject */}
                    <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-none">
                        {Object.entries(groupedPermissions).map(([subject, perms]) => {
                            const subjectLabel = AVAILABLE_SUBJECTS.find(s => s.value === subject)?.label ?? subject;
                            const allInRole = selectedRole ? perms.every(p => selectedPermIds.includes(p.id)) : false;
                            const someInRole = selectedRole && !allInRole && perms.some(p => selectedPermIds.includes(p.id));

                            return (
                                <div key={subject} className="space-y-2">
                                    {/* Subject divider */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-border/40" />
                                        <div className={cn(
                                            'flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all',
                                            allInRole
                                                ? 'bg-primary/10 border-primary/30 text-primary'
                                                : someInRole
                                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                    : 'bg-muted border-border text-muted-foreground/70'
                                        )}>
                                            {allInRole && <CheckCircle2 className="w-3 h-3" />}
                                            {subjectLabel}
                                        </div>
                                        <div className="h-px flex-1 bg-border/40" />
                                    </div>

                                    {/* Perm cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                        {perms.map(perm => {
                                            const isActive = selectedPermIds.includes(perm.id);
                                            // En modo "ver todos" con rol → activos en verde, inactivos neutros
                                            const cardStyle = selectedRole && !showOnlyActive
                                                ? isActive
                                                    ? 'bg-emerald-500/5 border-emerald-500/30 shadow-sm'
                                                    : 'bg-card border-border hover:border-primary/30'
                                                : selectedRole
                                                    ? 'bg-emerald-500/5 border-emerald-500/30 shadow-sm'
                                                    : 'bg-card border-border hover:border-primary/30';

                                            return (
                                                <motion.div
                                                    key={perm.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className={cn('group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200', cardStyle)}
                                                >
                                                    {/* Active indicator bar */}
                                                    {selectedRole && isActive && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 rounded-l-xl" />
                                                    )}

                                                    {/* Action badge */}
                                                    <div className={cn(
                                                        'px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border shrink-0',
                                                        ACTION_STYLES[perm.action] ?? ACTION_STYLES.read
                                                    )}>
                                                        {perm.action}
                                                    </div>

                                                    {/* Name */}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[11px] font-black uppercase tracking-tight truncate text-foreground">
                                                            {perm.name}
                                                        </p>
                                                    </div>

                                                    {/* Toggle assign/unassign — visible cuando hay rol seleccionado */}
                                                    {selectedRole && (
                                                        <Can action="update" subject="Role">
                                                            <button
                                                                onClick={() => togglePermForRole(perm.id)}
                                                                disabled={togglingPermId === perm.id}
                                                                title={isActive ? 'Quitar del rol' : 'Asignar al rol'}
                                                                className={cn(
                                                                    'shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border transition-all',
                                                                    togglingPermId === perm.id
                                                                        ? 'opacity-50 cursor-wait'
                                                                        : isActive
                                                                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white'
                                                                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                                                                )}
                                                            >
                                                                {togglingPermId === perm.id
                                                                    ? <RefreshCw className="w-3 h-3 animate-spin" />
                                                                    : isActive
                                                                        ? <X className="w-3 h-3" />
                                                                        : <Plus className="w-3 h-3" />
                                                                }
                                                            </button>
                                                        </Can>
                                                    )}

                                                    {/* Edit/Delete — solo sin rol seleccionado o en modo Ver todos sin asignación */}
                                                    {(!selectedRole || !showOnlyActive) && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <Can action="update" subject="Permission">
                                                                <button
                                                                    onClick={() => openPermModal(perm)}
                                                                    className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shadow-sm"
                                                                >
                                                                    <Edit3 className="w-2.5 h-2.5" />
                                                                </button>
                                                            </Can>
                                                            <Can action="delete" subject="Permission">
                                                                <button
                                                                    onClick={() => setDeletingPermId(perm.id)}
                                                                    className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-colors shadow-sm"
                                                                >
                                                                    <Trash2 className="w-2.5 h-2.5" />
                                                                </button>
                                                            </Can>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {Object.keys(groupedPermissions).length === 0 && (
                            <div className="py-20 text-center rounded-2xl border-2 border-dashed border-border">
                                <ShieldAlert className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                                    {selectedRole
                                        ? `El rol "${selectedRole.name}" no tiene permisos asignados`
                                        : 'Sin permisos registrados'
                                    }
                                </p>
                                {selectedRole && (
                                    <button
                                        onClick={() => setShowOnlyActive(false)}
                                        className="mt-4 h-9 px-5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all inline-flex items-center gap-2"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Asignar Permisos
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                MODALS
            ════════════════════════════════════════════════════════════ */}

            {/* Role Modal */}
            <Modal
                isOpen={roleModalOpen}
                onClose={() => setRoleModalOpen(false)}
                title={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            >
                <form onSubmit={handleRoleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre del Rol</label>
                        <input
                            type="text"
                            className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                            placeholder="p. ej. ADMIN_SOPORTE"
                            value={roleForm.name}
                            onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Permissions selector */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LucideLock className="w-4 h-4 text-primary" />
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Capacidades asignadas</label>
                            </div>
                            <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-[9px] font-black rounded-lg uppercase tracking-widest">
                                {roleForm.permissionIds.length} / {allPermissions.length}
                            </span>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto pr-1 space-y-6 scrollbar-none">
                            {Object.entries(
                                allPermissions.reduce((acc, p) => {
                                    const s = p.subject || 'SISTEMA';
                                    if (!acc[s]) acc[s] = [];
                                    acc[s].push(p);
                                    return acc;
                                }, {} as Record<string, Permission[]>)
                            ).map(([subject, perms]) => (
                                <div key={subject} className="space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-px flex-1 bg-border/40" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">{subject}</span>
                                        <div className="h-px flex-1 bg-border/40" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {perms.map(perm => {
                                            const pId = (perm as any).id;
                                            const sel = roleForm.permissionIds.includes(pId);
                                            return (
                                                <button
                                                    key={pId}
                                                    type="button"
                                                    onClick={() => setRoleForm({
                                                        ...roleForm,
                                                        permissionIds: sel
                                                            ? roleForm.permissionIds.filter(id => id !== pId)
                                                            : [...roleForm.permissionIds, pId]
                                                    })}
                                                    className={cn(
                                                        'flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left',
                                                        sel ? 'bg-primary/5 border-primary' : 'bg-muted/30 border-border/50 hover:border-primary/30'
                                                    )}
                                                >
                                                    <div className={cn(
                                                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all',
                                                        sel ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border'
                                                    )}>
                                                        {sel ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Shield className="w-3 h-3" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={cn('text-[10px] font-black uppercase tracking-tight truncate', sel ? 'text-primary' : 'text-foreground')}>
                                                            {perm.name}
                                                        </p>
                                                        <p className="text-[8px] font-bold uppercase text-muted-foreground/50">
                                                            {perm.action}
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
                        <button type="button" onClick={() => setRoleModalOpen(false)}
                            className="h-12 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
                            Cancelar
                        </button>
                        <button type="submit"
                            className="h-12 px-10 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                            {editingRole ? 'Actualizar' : 'Crear Rol'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Permission Modal */}
            <Modal
                isOpen={permModalOpen}
                onClose={() => setPermModalOpen(false)}
                title={editingPerm ? 'Editar Permiso' : 'Nuevo Permiso'}
            >
                <form onSubmit={handlePermSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Alias Técnico</label>
                        <input
                            type="text"
                            className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-sm font-black text-foreground uppercase tracking-tight"
                            placeholder="p. ej. MANAGE_USERS"
                            value={permForm.name}
                            onChange={e => setPermForm({ ...permForm, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Acción</label>
                            <div className="relative">
                                <select
                                    className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary outline-none text-sm font-bold text-foreground appearance-none"
                                    value={permForm.action}
                                    onChange={e => setPermForm({ ...permForm, action: e.target.value })}
                                >
                                    {ACTIONS.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sujeto</label>
                            <div className="relative">
                                <select
                                    className="w-full h-14 px-6 rounded-2xl bg-card border border-border focus:border-primary outline-none text-sm font-bold text-foreground appearance-none"
                                    value={permForm.subject}
                                    onChange={e => setPermForm({ ...permForm, subject: e.target.value })}
                                >
                                    {AVAILABLE_SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-border">
                        <button type="button" onClick={() => setPermModalOpen(false)}
                            className="h-12 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
                            Cancelar
                        </button>
                        <button type="submit"
                            className="h-12 px-10 rounded-2xl bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 hover:opacity-90 transition-all">
                            {editingPerm ? 'Actualizar' : 'Crear Permiso'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Role confirm */}
            <Modal isOpen={!!deletingRoleId} onClose={() => setDeletingRoleId(null)} title="Eliminar Rol">
                <DeleteConfirm
                    message="Los usuarios con este rol perderán sus capacidades de acceso de forma inmediata."
                    confirmLabel="Eliminar Rol"
                    onConfirm={() => deletingRoleId && handleRoleDelete(deletingRoleId)}
                    onCancel={() => setDeletingRoleId(null)}
                />
            </Modal>

            {/* Delete Permission confirm */}
            <Modal isOpen={!!deletingPermId} onClose={() => setDeletingPermId(null)} title="Eliminar Permiso">
                <DeleteConfirm
                    message="Esto revocará este permiso de todos los roles que lo tienen asignado."
                    confirmLabel="Eliminar Permiso"
                    onConfirm={() => deletingPermId && handlePermDelete(deletingPermId)}
                    onCancel={() => setDeletingPermId(null)}
                />
            </Modal>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border">
            <span className={color}>{icon}</span>
            <div>
                <p className="text-lg font-black text-foreground leading-none">{value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

function DeleteConfirm({ message, confirmLabel, onConfirm, onCancel }: {
    message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
    return (
        <div className="space-y-8 text-center py-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border-2 border-rose-500/20">
                <ShieldAlert className="w-8 h-8" />
            </div>
            <p className="text-sm text-muted-foreground font-medium max-w-[280px] mx-auto leading-relaxed">{message}</p>
            <div className="flex flex-col gap-2 px-8">
                <button onClick={onConfirm}
                    className="h-12 w-full rounded-2xl bg-rose-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all">
                    {confirmLabel}
                </button>
                <button onClick={onCancel}
                    className="h-12 w-full rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
                    Cancelar
                </button>
            </div>
        </div>
    );
}
