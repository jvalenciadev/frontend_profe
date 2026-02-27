'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { roleService } from '@/services/roleService';
import { departmentService } from '@/services/departmentService';
import { sedeService } from '@/services/sedeService';
import { cargoService, Cargo } from '@/services/cargoService';
import { User, Role } from '@/types';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Can } from '@/components/Can';
import {
    Users,
    Search,
    Eye,
    Filter,
    RefreshCw,
    Edit2,
    Trash2,
    Mail,
    Shield,
    CheckCircle2,
    Plus,
    User as UserIcon,
    Key as LucideKey,
    UserCheck,
    AlertCircle,
    Hash,
    IdCard,
    Zap,
    Lock as LucideLock,
    Building2,
    ChevronUp,
    ChevronDown,
    ArrowUpDown,
    UserPlus,
    ShieldCheck,
    Activity,
    LayoutGrid,
    List as ListIcon,
    GraduationCap,
    Briefcase,
    Award,
    Globe,
    Book,
    FileText,
    Download
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfe } from '@/contexts/ProfeContext';
import { StatusBadge } from '@/components/StatusBadge';

export default function UsuariosPage() {
    const { user: currentUser } = useAuth();
    const { config: profe } = useProfe();

    const IMG = (src: string | null) => {
        if (!src) return null;
        return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    };
    const [usuarios, setUsuarios] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [sedes, setSedes] = useState<any[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterDept, setFilterDept] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        nombre: '',
        apellidos: '',
        correo: '',
        password: '',
        // Personal Info
        imagen: '',
        genero: 'No prefiero decirlo',
        licenciatura: '',
        direccion: '',
        curriculum: '',
        fechaNacimiento: '',
        estadoCivil: '',
        facebook: '',
        tiktok: '',
        cargo: '',
        celular: 0,
        // Tenant
        tenantId: '',
        // Sedes
        sedeIds: [] as string[],
        // Roles
        roleIds: [] as string[],
        cargoPostulacionId: '',
        personaId: '',
        ci: '',
        activo: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, rolesData, deptsData, sedesData, cargosData] = await Promise.all([
                userService.getAll(),
                roleService.getAll(),
                departmentService.getAll(),
                sedeService.getAll(),
                cargoService.getAll()
            ]);
            console.log('[DEBUG] Usuarios Page - Users:', usersData);
            console.log('[DEBUG] Usuarios Page - Roles Master:', rolesData);
            setUsuarios(usersData);
            setRoles(rolesData);
            setDepartments(deptsData);
            setSedes(sedesData);
            setCargos(cargosData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al sincronizar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleViewUser = async (user: User) => {
        try {
            const fullUser = await userService.getById(user.id);
            setViewingUser(fullUser);
        } catch (error) {
            console.error('Error fetching full user:', error);
            setViewingUser(user); // Fallback to partial data
        }
    };

    const handleOpenModal = (user: User | null = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                nombre: user.nombre || '',
                apellidos: user.apellidos || '',
                correo: user.correo || '',
                password: '',
                imagen: user.imagen || '',
                genero: user.genero || 'No prefiero decirlo',
                licenciatura: user.licenciatura || '',
                direccion: user.direccion || '',
                curriculum: user.curriculum || '',
                fechaNacimiento: user.fechaNacimiento || '',
                estadoCivil: user.estadoCivil || '',
                facebook: user.facebook || '',
                tiktok: user.tiktok || '',
                ci: user.ci ? String(user.ci) : '',
                cargo: user.cargo || '',
                celular: user.celular || 0,
                tenantId: user.tenantId || '',
                personaId: user.personaId || '',
                sedeIds: user.sedes?.map((s: any) => s.sedeId || s.id) || [],
                roleIds: user.roles?.map(r => {
                    if (typeof r === 'string') return r;
                    if (r && 'role' in r) return r.role.id;
                    return (r as any).id;
                }) || [],
                cargoPostulacionId: (user as any).cargoPostulacionId || '',
                activo: user.activo ?? true
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                nombre: '',
                apellidos: '',
                correo: '',
                password: '',
                imagen: '',
                genero: 'No prefiero decirlo',
                licenciatura: '',
                direccion: '',
                curriculum: '',
                fechaNacimiento: '',
                estadoCivil: '',
                facebook: '',
                tiktok: '',
                cargo: '',
                celular: 0,
                tenantId: '',
                sedeIds: [],
                roleIds: [],
                cargoPostulacionId: '',
                personaId: '',
                ci: '',
                activo: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { roleIds, sedeIds, password, activo, username, correo, ...rest } = formData;

            const payload: any = {
                ...rest,
                roles: roleIds,
                sedes: sedeIds,
                estado: activo ? 'activo' : 'inactivo'
            };

            // Solo enviar password si se ha escrito algo nuevo
            if (password) {
                payload.password = password;
            }

            // Limpieza de UUIDs vacíos para evitar errores de Prisma (Invalid UUID length)
            const cleanPayload = { ...payload };
            ['personaId', 'tenantId', 'cargoPostulacionId'].forEach(key => {
                if (cleanPayload[key] === '') {
                    delete cleanPayload[key];
                }
            });

            if (editingUser) {
                // Para actualización (PATCH), evitamos enviar username y correo
                await userService.update(editingUser.id, cleanPayload);
                toast.success('Cambios aplicados con éxito');
            } else {
                // Para creación (POST), el payload completo es necesario
                const createPayload = {
                    ...cleanPayload,
                    username,
                    correo
                };
                await userService.create(createPayload);
                toast.success('Nueva identidad registrada');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error('Fallo en la sincronización de datos');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await userService.delete(id);
            toast.success('Operador removido');
            setIsDeleting(null);
            loadData();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Error en la remoción técnica');
        }
    };

    const handleResetPassword = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de resetear la contraseña de ${name}? La nueva contraseña será 'password123'.`)) return;
        try {
            await userService.resetPassword(id);
            toast.success(`Contraseña de ${name} reseteada correctamente`);
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error('Error al resetear la contraseña');
        }
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredUsuarios = usuarios.filter(u => {
        const matchesSearch =
            u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.ci?.toString().includes(searchTerm);

        const matchesRole = filterRole === 'all' || u.roles?.some(r => {
            if (typeof r === 'string') return r === filterRole;
            if (r && 'role' in r) return r.role.id === filterRole;
            return (r as any).id === filterRole;
        });

        const matchesDept = filterDept === 'all' || u.tenantId === filterDept;

        const isActive = u.estado === 'ACTIVO' || u.activo;
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && isActive) ||
            (filterStatus === 'inactive' && !isActive);

        return matchesSearch && matchesRole && matchesDept && matchesStatus;
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let valA: any = (a as any)[key];
        let valB: any = (b as any)[key];

        if (key === 'nombre_completo') {
            valA = `${a.nombre} ${a.apellidos}`.toLowerCase();
            valB = `${b.nombre} ${b.apellidos}`.toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const stats = {
        total: usuarios.length,
        active: usuarios.filter(u => u.estado === 'ACTIVO' || u.activo).length,
        admins: usuarios.filter(u => u.roles?.some(r => {
            const name = typeof r === 'string' ? r : ('role' in r ? r.role.name : (r as any).name);
            return name?.toLowerCase().includes('admin');
        })).length,
        pending: usuarios.filter(u => !(u.estado === 'ACTIVO' || u.activo)).length
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">
                        <Users className="w-3 h-3" />
                        <span>Recursos Humanos Operativos</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Usuarios</h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-md">
                        Gestión técnica de credenciales y perfiles de acceso regional.
                    </p>
                </div>

                <Can action="create" subject="User">
                    <button
                        onClick={() => handleOpenModal()}
                        className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Operador
                    </button>
                </Can>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Operadores', value: stats.total, icon: Users, color: 'primary' },
                    { label: 'Acceso Activo', value: stats.active, icon: Activity, color: 'emerald' },
                    { label: 'Administradores', value: stats.admins, icon: ShieldCheck, color: 'indigo' },
                    { label: 'Restringidos', value: stats.pending, icon: LucideLock, color: 'rose' }
                ].map((stat, i) => (
                    <Card key={`stat-${i}`} className="p-6 border-border/40 bg-card/50 backdrop-blur-xl group hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                <p className="text-3xl font-black tracking-tighter text-foreground">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-2xl bg-${stat.color}-500/5 text-${stat.color}-500 border border-${stat.color}-500/10 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Matrix Filters */}
            <Card className="p-4 border-border/40 bg-card/30 backdrop-blur-md">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Ejcutar búsqueda por nombre, username o canal de enlace..."
                            className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-[13px] font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center bg-muted/20 p-1 rounded-xl border border-border/50">
                            {[
                                { id: 'all', label: 'Todos' },
                                { id: 'active', label: 'Activos' },
                                { id: 'inactive', label: 'Inactivos' }
                            ].map(s => (
                                <button
                                    key={`status-filter-${s.id}`}
                                    onClick={() => setFilterStatus(s.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        filterStatus === s.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        <select
                            className="h-12 px-4 rounded-xl bg-muted/30 border border-border/50 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all w-full lg:w-40"
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <option value="all">Rango: Todos</option>
                            {roles.map((r, idx) => (
                                <option key={r.id || `filter-role-${idx}`} value={r.id}>{r.name}</option>
                            ))}
                        </select>

                        <select
                            className="h-12 px-4 rounded-xl bg-muted/30 border border-border/50 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all w-full lg:w-48"
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                        >
                            <option value="all">Filtro: Departamentos</option>
                            {departments.map((d, idx) => (
                                <option key={d.id || `filter-dept-${idx}`} value={d.id}>{d.nombre}</option>
                            ))}
                        </select>

                        <div className="h-10 w-[1px] bg-border/50 hidden lg:block mx-1" />

                        <div className="flex items-center bg-muted/20 p-1 rounded-xl border border-border/50">
                            {[
                                { id: 'table', icon: ListIcon },
                                { id: 'grid', icon: LayoutGrid }
                            ].map(v => (
                                <button
                                    key={`view-mode-${v.id}`}
                                    onClick={() => setViewMode(v.id as any)}
                                    className={cn(
                                        "p-2 rounded-lg transition-all",
                                        viewMode === v.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <v.icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterRole('all');
                                setFilterDept('all');
                                setFilterStatus('all');
                            }}
                            className="p-3 rounded-xl bg-muted/30 border border-border/50 text-muted-foreground hover:text-primary transition-all active:rotate-180"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </Card>

            {/* Matrix Data View */}
            <AnimatePresence mode="wait">
                {viewMode === 'table' ? (
                    <motion.div
                        key="table"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {/* Matrix Table */}
                        <Card className="border-border/40 shadow-xl shadow-black/[0.02] overflow-hidden bg-card">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border/60">
                                            <th
                                                className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-[22%] cursor-pointer hover:text-primary transition-colors"
                                                onClick={() => handleSort('nombre_completo')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Entidad Operativa
                                                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-[20%]">Canal de Enlace</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-[15%]">Esquema de Roles</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-[15%]">Departamento</th>
                                            <th
                                                className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-[10%] text-center cursor-pointer hover:text-primary transition-colors"
                                                onClick={() => handleSort('activo')}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    Status Core
                                                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Mantenimiento</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {loading && usuarios.length === 0 ? (
                                            Array(5).fill(0).map((_, i) => (
                                                <tr key={`skeleton-${i}`} className="animate-pulse">
                                                    <td colSpan={6} className="px-6 py-5 cursor-wait opacity-50"><div className="h-12 bg-muted rounded-2xl w-full" /></td>
                                                </tr>
                                            ))
                                        ) : filteredUsuarios.map((u) => (
                                            <tr key={u.id} className="group hover:bg-muted/50 transition-all duration-300">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-card border border-border/50 text-primary flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform overflow-hidden relative">
                                                            {u.imagen ? (
                                                                <img src={`${process.env.NEXT_PUBLIC_API_URL}${u.imagen}`} alt={u.nombre} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full p-2.5 flex items-center justify-center">
                                                                    {profe?.imagen ? (
                                                                        <img src={IMG(profe.imagen)!} className="w-full h-full object-contain opacity-40 grayscale" alt="Logo" />
                                                                    ) : (
                                                                        <span className="relative z-10">{u.nombre?.charAt(0) || 'U'}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-black text-foreground truncate uppercase tracking-tight">{u.nombre} {u.apellidos}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">@{u.username}</span>
                                                                {u.ci ? (
                                                                    <>
                                                                        <span className="text-[10px] text-muted-foreground/30">•</span>
                                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">CI: {u.ci}</span>
                                                                    </>
                                                                ) : null}
                                                                {(u as any).cargoPostulacion?.nombre || u.cargo ? (
                                                                    <>
                                                                        <span className="text-[10px] text-muted-foreground/30">•</span>
                                                                        <span className="text-[9px] font-black text-primary uppercase tracking-tighter">{(u as any).cargoPostulacion?.nombre || u.cargo}</span>
                                                                    </>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2.5 text-[12px] font-bold text-muted-foreground">
                                                        <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                                                            <Mail className="w-3.5 h-3.5" />
                                                        </div>
                                                        {u.correo}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {u.roles && u.roles.length > 0 ? (
                                                            u.roles.map((r, idx) => {
                                                                // Resolver el nombre del rol si viene como string (ID), Objeto o Pivot
                                                                let roleName = 'Sin Nombre';
                                                                if (typeof r === 'string') {
                                                                    const resolvedRole = roles.find(role => role.id === r);
                                                                    roleName = resolvedRole?.name || r;
                                                                } else if ('role' in r) {
                                                                    roleName = r.role.name || 'Desconocido';
                                                                } else if ('name' in r) {
                                                                    roleName = r.name || 'Desconocido';
                                                                }

                                                                return (
                                                                    <span
                                                                        key={idx}
                                                                        className="px-2.5 py-1 rounded-lg bg-card border border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground shadow-sm"
                                                                    >
                                                                        {roleName}
                                                                    </span>
                                                                );
                                                            })
                                                        ) : (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 italic">No Asignado</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {u.tenant ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-primary/40" />
                                                            <span className="text-[10px] font-black uppercase text-foreground">{u.tenant.nombre}</span>
                                                        </div>
                                                    ) : u.tenantId ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                                                            <span className="text-[10px] font-black uppercase text-muted-foreground">
                                                                {departments.find(d => d.id === (u as any).tenantId)?.nombre || 'Sin Asignar'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase italic opacity-30">Sin Región</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <StatusBadge
                                                        status={u.estado || (u.activo ? 'OPERATIVO' : 'BLOQUEADO')}
                                                        showIcon={false}
                                                    />
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleViewUser(u)}
                                                            className="p-2.5 rounded-xl bg-blue-500/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                            title="Ver Perfil Completo"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <Can action="update" subject="User">
                                                            <button
                                                                onClick={() => handleOpenModal(u)}
                                                                className="p-2.5 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                                                title="Editar Operador"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleResetPassword(u.id, u.nombre)}
                                                                title="Resetear Contraseña"
                                                                className="p-2.5 rounded-xl bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                            </button>
                                                        </Can>
                                                        <Can action="delete" subject="User">
                                                            <button
                                                                onClick={() => setIsDeleting(u.id)}
                                                                className="p-2.5 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                                title="Remover Acceso"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
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
                    </motion.div>
                ) : (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredUsuarios.map((u) => (
                            <Card key={u.id} className="group relative border-border/40 overflow-hidden bg-card hover:border-primary/30 transition-all p-0">
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="w-16 h-16 rounded-3xl bg-white dark:bg-card border border-border/50 text-primary flex items-center justify-center font-black text-2xl group-hover:rotate-6 transition-transform overflow-hidden relative">
                                            {u.imagen ? (
                                                <img src={`${process.env.NEXT_PUBLIC_API_URL}${u.imagen}`} alt={u.nombre} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full p-3.5 flex items-center justify-center">
                                                    {profe?.imagen ? (
                                                        <img src={IMG(profe.imagen)!} className="w-full h-full object-contain opacity-40 grayscale" alt="Logo" />
                                                    ) : (
                                                        <span className="relative z-10">{u.nombre?.charAt(0) || 'U'}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                            (u.estado === 'ACTIVO' || u.activo) ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                        )}>
                                            {(u.estado === 'ACTIVO' || u.activo) ? 'Operativo' : 'Bloqueado'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black tracking-tight text-foreground uppercase truncate">
                                            {u.nombre} {u.apellidos}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">@{u.username}</p>
                                            {(u as any).cargoPostulacion?.nombre || u.cargo ? (
                                                <span className="text-[9px] font-black text-primary uppercase px-2 py-0.5 bg-primary/5 rounded-md">
                                                    {(u as any).cargoPostulacion?.nombre || u.cargo}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="pt-2 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80 lowercase">
                                            <Mail className="w-3.5 h-3.5 text-primary" />
                                            {u.correo}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            <Building2 className="w-3.5 h-3.5 text-primary" />
                                            {u.tenant?.nombre || 'Sin Región'}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {u.roles?.slice(0, 2).map((r, idx) => {
                                            const name = typeof r === 'string' ? roles.find(role => role.id === r)?.name : ('role' in r ? r.role.name : (r as any).name);
                                            return (
                                                <span key={idx} className="px-2 py-0.5 rounded-md bg-muted text-[8px] font-black uppercase text-muted-foreground">
                                                    {name}
                                                </span>
                                            );
                                        })}
                                        {u.roles && u.roles.length > 2 && (
                                            <span className="px-2 py-0.5 rounded-md bg-primary/5 text-[8px] font-black uppercase text-primary">
                                                +{u.roles.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <button
                                        onClick={() => handleViewUser(u)}
                                        className="p-2 rounded-xl bg-white shadow-xl border border-border text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                                        title="Ver Información"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <Can action="update" subject="User">
                                        <button
                                            onClick={() => handleOpenModal(u)}
                                            className="p-2 rounded-xl bg-white shadow-xl border border-border text-primary hover:bg-primary hover:text-white transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleResetPassword(u.id, u.nombre)}
                                            className="p-2 rounded-xl bg-white shadow-xl border border-border text-amber-500 hover:bg-amber-500 hover:text-white transition-all"
                                            title="Resetear Clave"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </Can>
                                    <Can action="delete" subject="User">
                                        <button
                                            onClick={() => setIsDeleting(u.id)}
                                            className="p-2 rounded-xl bg-white shadow-xl border border-border text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </Can>
                                </div>
                            </Card>
                        ))}
                    </motion.div>
                )
                }
            </AnimatePresence >

            {/* LIGHT MODE PREMIUM MODAL REDESIGN */}
            < Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? 'Parámetros del Operador' : 'Registro de Operador'}
                size="2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-10 max-h-[75vh] overflow-y-auto px-2 pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Column 1: Identity */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                    <IdCard className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Identidad Digital</h4>
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Username de Enlace</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        className="w-full h-12 pl-12 pr-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black text-foreground"
                                        placeholder="p. ej. cruiz"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombres Completos</label>
                                <input
                                    type="text"
                                    className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black text-foreground"
                                    placeholder="Juan Carlos"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Apellidos</label>
                                <input
                                    type="text"
                                    className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black text-foreground"
                                    placeholder="Perez Gomez"
                                    value={formData.apellidos}
                                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Column 2: Access */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                    <LucideLock className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Seguridad Nucleo</h4>
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        className="w-full h-12 pl-12 pr-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black text-foreground"
                                        placeholder="carlos@profe.bo"
                                        value={formData.correo}
                                        onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {!editingUser && (
                                <div className="space-y-1.5 group">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contraseña Inicial</label>
                                    <div className="relative">
                                        <LucideKey className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="password"
                                            className="w-full h-12 pl-12 pr-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black text-foreground"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest ml-1 mb-2 block">Estado Operativo</label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                                    className={cn(
                                        "flex items-center justify-between w-full h-14 px-5 rounded-2xl border-2 transition-all group/toggle shadow-sm",
                                        formData.activo
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                            : "bg-muted border-border text-muted-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <UserCheck className={cn("w-5 h-5", formData.activo ? "text-emerald-500" : "text-muted-foreground")} />
                                        <span className="text-[11px] font-black uppercase tracking-widest leading-none">Acceso Habilitado</span>
                                    </div>
                                    <div className={cn(
                                        "w-10 h-6 rounded-full p-1 transition-colors relative",
                                        formData.activo ? "bg-emerald-500" : "bg-muted-foreground/30"
                                    )}>
                                        <div className={cn(
                                            "w-4 h-4 bg-white rounded-full transition-transform shadow-md",
                                            formData.activo ? "translate-x-4" : "translate-x-0"
                                        )} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Tenant Assignment */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                    <Building2 className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Asignación Territorial</h4>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Departamento (Tenant)</label>
                                <select
                                    className={cn(
                                        "w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black text-foreground appearance-none",
                                        (currentUser?.tenantId || (editingUser && formData.tenantId)) && "opacity-60 cursor-not-allowed"
                                    )}
                                    value={formData.tenantId}
                                    disabled={!!currentUser?.tenantId || (!!editingUser && !!formData.tenantId)}
                                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value, sedeIds: [] })}
                                >
                                    <option value="">Sin Asignar</option>
                                    {departments.map((d, idx) => (
                                        <option key={d.id || `modal-dept-${idx}`} value={d.id}>{d.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sedes Asignadas</label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl border border-border bg-muted/20">
                                    {sedes.filter(s => !formData.tenantId || s.departamentoId === formData.tenantId).length === 0 ? (
                                        <p className="col-span-2 text-xs text-muted-foreground text-center py-4">No hay sedes disponibles para este departamento</p>
                                    ) : (
                                        sedes.filter(s => !formData.tenantId || s.departamentoId === formData.tenantId).map((sede, idx) => (
                                            <button
                                                key={sede.id || `modal-sede-${idx}`}
                                                type="button"
                                                onClick={() => {
                                                    const isSelected = formData.sedeIds.includes(sede.id);
                                                    const newSedeIds = isSelected
                                                        ? formData.sedeIds.filter(id => id !== sede.id)
                                                        : [...formData.sedeIds, sede.id];
                                                    setFormData({ ...formData, sedeIds: newSedeIds });
                                                }}
                                                className={cn(
                                                    "relative p-2 rounded-xl border-2 text-left transition-all text-xs",
                                                    formData.sedeIds.includes(sede.id)
                                                        ? "bg-primary/10 border-primary text-primary font-black"
                                                        : "bg-card border-border text-muted-foreground hover:border-primary/20"
                                                )}
                                            >
                                                {formData.sedeIds.includes(sede.id) && (
                                                    <CheckCircle2 className="absolute top-1 right-1 w-3 h-3 text-primary" />
                                                )}
                                                <span className="block truncate pr-4">{sede.nombre}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extended User Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                    <IdCard className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Información Personal</h4>
                            </div>
                        </div>

                        <ImageUpload
                            value={formData.imagen}
                            onChange={(url) => setFormData({ ...formData, imagen: url })}
                            tableName="usuarios"
                            label="Foto de Perfil"
                        />

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Género</label>
                            <select
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black text-foreground appearance-none"
                                value={formData.genero}
                                onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                            >
                                <option value="No prefiero decirlo">No prefiero decirlo</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Cédula de Identidad (CI)</label>
                            <input
                                type="text"
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black text-foreground"
                                placeholder="00000000"
                                value={formData.ci}
                                onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                            <input
                                type="date"
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-medium text-foreground"
                                value={formData.fechaNacimiento}
                                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado Civil</label>
                            <select
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black text-foreground appearance-none"
                                value={formData.estadoCivil}
                                onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value })}
                            >
                                <option value="">Seleccionar</option>
                                <option value="Soltero/a">Soltero/a</option>
                                <option value="Casado/a">Casado/a</option>
                                <option value="Divorciado/a">Divorciado/a</option>
                                <option value="Viudo/a">Viudo/a</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Celular</label>
                            <input
                                type="number"
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black text-foreground"
                                placeholder="70000000"
                                value={formData.celular}
                                onChange={(e) => setFormData({ ...formData, celular: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Cargo Institucional</label>
                            <select
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-black text-foreground appearance-none"
                                value={formData.cargoPostulacionId}
                                onChange={(e) => setFormData({ ...formData, cargoPostulacionId: e.target.value })}
                            >
                                <option value="">Seleccionar Cargo</option>
                                {cargos.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Licenciatura</label>
                            <input
                                type="text"
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-medium text-foreground"
                                placeholder="Lic. en Educación, Ing. Sistemas, etc."
                                value={formData.licenciatura}
                                onChange={(e) => setFormData({ ...formData, licenciatura: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Dirección</label>
                            <input
                                type="text"
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-medium text-foreground"
                                placeholder="Av. Principal #123, Zona Centro"
                                value={formData.direccion}
                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Facebook</label>
                            <input
                                type="text"
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-medium text-foreground"
                                placeholder="@usuario"
                                value={formData.facebook}
                                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">TikTok</label>
                            <input
                                type="text"
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-medium text-foreground"
                                placeholder="@usuario"
                                value={formData.tiktok}
                                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Curriculum (URL)</label>
                            <input
                                type="text"
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-medium text-foreground"
                                placeholder="https://ejemplo.com/cv.pdf"
                                value={formData.curriculum}
                                onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Persona ID / Código de Sincronización</label>
                            <input
                                type="text"
                                className="w-full h-12 px-5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-[13px] font-medium text-foreground"
                                placeholder="UUID o Código Externo"
                                value={formData.personaId}
                                onChange={(e) => setFormData({ ...formData, personaId: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                <Shield className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Matriz de Roles</h4>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {roles.map((role, idx) => (
                                <button
                                    key={role.id || `modal-role-${idx}`}
                                    type="button"
                                    onClick={() => {
                                        const isSelected = formData.roleIds.includes(role.id);
                                        const newRoleIds = isSelected
                                            ? formData.roleIds.filter(id => id !== role.id)
                                            : [...formData.roleIds, role.id];
                                        setFormData({ ...formData, roleIds: newRoleIds });
                                    }}
                                    className={cn(
                                        "relative p-3 rounded-2xl border-2 text-center transition-all",
                                        formData.roleIds.includes(role.id)
                                            ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.03] z-10"
                                            : "bg-card border-border text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.02]"
                                    )}
                                >
                                    {formData.roleIds.includes(role.id) && (
                                        <CheckCircle2 className="absolute top-1 right-1 w-3 h-3 text-white/40" />
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{role.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all active:scale-95"
                        >
                            Abortar Proceso
                        </button>
                        <button
                            type="submit"
                            className="h-14 px-12 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:opacity-90 active:scale-95 transition-all"
                        >
                            {editingUser ? 'Aplicar Cambios' : 'Finalizar Registro'}
                        </button>
                    </div>
                </form>
            </Modal >

            {/* Error Confirmation Redesign */}
            < Modal
                isOpen={!!isDeleting}
                onClose={() => setIsDeleting(null)}
                title="Confirmación Crítica"
            >
                <div className="space-y-8 text-center py-6">
                    <div className="w-24 h-24 rounded-[3rem] bg-destructive/10 text-destructive flex items-center justify-center mx-auto border-2 border-destructive/20 shadow-xl shadow-destructive/10">
                        <AlertCircle className="w-12 h-12" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase">¿Eliminar Operador?</h3>
                        <p className="text-[14px] text-muted-foreground px-10 leading-relaxed font-bold italic">
                            "La remoción de este ID es irreversible y afectará la trazabilidad del sistema regional."
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => isDeleting && handleDelete(isDeleting)}
                            className="h-16 w-full rounded-[2rem] bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:opacity-90 active:scale-95 transition-all"
                        >
                            Confirmar Remoción Técnica
                        </button>
                        <button
                            onClick={() => setIsDeleting(null)}
                            className="h-16 w-full rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Mantener Integridad
                        </button>
                    </div>
                </div>
            </Modal >

            {/* Modal de Vista de Información (Solo Lectura - Version Profesional Bank) */}
            <Modal
                isOpen={!!viewingUser}
                onClose={() => setViewingUser(null)}
                title="Expediente Profesional de Operador"
                size="full"
            >
                {viewingUser && (
                    <div className="space-y-10 max-h-[85vh] overflow-y-auto px-6 pb-20 scrollbar-hide">
                        {/* Cabecera de Perfil Premium */}
                        <div className="flex flex-col md:flex-row gap-10 items-start md:items-center p-10 rounded-[40px] bg-gradient-to-br from-primary/[0.04] via-transparent to-primary/[0.08] border border-primary/10 relative overflow-hidden shadow-2xl shadow-primary/5">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

                            <div className="w-40 h-40 rounded-[48px] bg-white border-8 border-white shadow-2xl overflow-hidden relative group shrink-0 ring-1 ring-primary/10">
                                {viewingUser.imagen ? (
                                    <img src={getImageUrl(viewingUser.imagen)} className="w-full h-full object-cover" alt={viewingUser.nombre} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary text-5xl font-black italic">
                                        {viewingUser.nombre?.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6 relative z-10 flex-1">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm backdrop-blur-md">
                                            {viewingUser.estado || (viewingUser.activo ? 'OPERATIVO' : 'BLOQUEADO')}
                                        </span>
                                        <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 shadow-sm backdrop-blur-md">
                                            ID: {viewingUser.id.substring(0, 8).toUpperCase()}
                                        </span>
                                        {viewingUser.ci && (
                                            <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-sm backdrop-blur-md">
                                                CI: {viewingUser.ci}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-5xl font-black tracking-tighter text-foreground uppercase leading-tight max-w-4xl">
                                        {viewingUser.nombre} {viewingUser.apellidos}
                                    </h2>
                                    <div className="flex flex-wrap gap-6 items-center pt-2">
                                        <div className="flex items-center gap-2 text-muted-foreground font-bold lowercase italic text-lg">
                                            <Mail className="w-5 h-5 text-primary/60" />
                                            {viewingUser.correo}
                                        </div>
                                        {viewingUser.linkedinUrl && (
                                            <a href={viewingUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[11px] hover:underline underline-offset-4">
                                                <Globe className="w-4 h-4" />
                                                LinkedIn Profile
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="hidden lg:flex flex-col gap-3 shrink-0">
                                {viewingUser.hojaDeVidaPdf && (
                                    <a href={getImageUrl(viewingUser.hojaDeVidaPdf)} target="_blank" className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                                        <Download className="w-4 h-4" />
                                        Expediente CV
                                    </a>
                                )}
                                {viewingUser.rdaPdf && (
                                    <a href={getImageUrl(viewingUser.rdaPdf)} target="_blank" className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-card border border-border text-foreground font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-muted transition-all">
                                        <FileText className="w-4 h-4" />
                                        Certificado RDA
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Grid de Contenido de Mi Ficha */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                            {/* Columna Izquierda (Info Institucional y Enlace) */}
                            <div className="lg:col-span-4 space-y-8">
                                {/* Matriz de Privilegios */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 ml-2">
                                        <ShieldCheck className="w-4 h-4 text-primary" />
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Autoridad de Sistema</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2 p-6 bg-card border border-border rounded-[32px] shadow-sm">
                                        {viewingUser.roles?.map((r, idx) => {
                                            const name = typeof r === 'string' ? roles.find(role => role.id === r)?.name : ('role' in r ? r.role.name : (r as any).name);
                                            return (
                                                <span key={idx} className="px-4 py-2 rounded-xl bg-primary shadow-lg shadow-primary/10 text-white text-[9px] font-black uppercase tracking-widest">
                                                    {name}
                                                </span>
                                            );
                                        }) || <span className="text-[9px] font-bold text-muted-foreground italic uppercase">Sin Roles Asignados</span>}
                                    </div>
                                </div>

                                {/* Posición en Organigrama */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 ml-2">
                                        <Building2 className="w-4 h-4 text-primary" />
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Asignación Estructural</h4>
                                    </div>
                                    <div className="space-y-4 p-8 bg-muted/30 border border-border/50 rounded-[32px]">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Cargo Designado</p>
                                            <p className="text-xl font-black text-foreground uppercase tracking-tighter">
                                                {(viewingUser as any).cargoPostulacion?.nombre || viewingUser.cargo || 'Operador General'}
                                            </p>
                                        </div>
                                        <div className="h-[1px] bg-border/40" />
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Región Operativa</p>
                                            <p className="text-[13px] font-black text-foreground uppercase italic">{viewingUser.tenant?.nombre || 'Sede Central'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Sedes de Campo</p>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {viewingUser.sedes?.map((s: any, idx: number) => (
                                                    <span key={idx} className="px-3 py-1.5 rounded-lg bg-white border border-border text-[9px] font-bold uppercase text-muted-foreground">
                                                        {s.sede?.nombre || s.nombre}
                                                    </span>
                                                )) || <span className="text-[9px] font-medium text-muted-foreground/40 italic">Global</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Personal Secundaria */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 ml-2">
                                        <UserIcon className="w-4 h-4 text-primary" />
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Biometría y Enlace</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 p-8 bg-card border border-border rounded-[32px] shadow-sm">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Género</p>
                                            <p className="text-[12px] font-bold text-foreground">{viewingUser.genero || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Celular</p>
                                            <p className="text-[12px] font-bold text-foreground">{viewingUser.celular || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Estado Civil</p>
                                            <p className="text-[12px] font-bold text-foreground">{viewingUser.estadoCivil || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Nacimiento</p>
                                            <p className="text-[12px] font-bold text-foreground">
                                                {viewingUser.fechaNacimiento ? new Date(viewingUser.fechaNacimiento).toLocaleDateString() : '---'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha (Expediente Profesional - El Corazón de Mi Ficha) */}
                            <div className="lg:col-span-8 space-y-10">

                                {/* Resumen Profesional */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 ml-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Resumen de Trayectoria</h4>
                                    </div>
                                    <Card className="p-8 border-border bg-card shadow-sm rounded-[32px]">
                                        <p className="text-[15px] leading-relaxed text-muted-foreground font-medium italic">
                                            {viewingUser.resumenProfesional || "El operador no ha redactado su resumen profesional en la plataforma."}
                                        </p>
                                    </Card>
                                </div>

                                {/* Formación Académica */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 ml-2">
                                        <GraduationCap className="w-5 h-5 text-primary" />
                                        <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Nivel de Titulación</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card className="p-6 border-primary/10 bg-primary/[0.02] rounded-[24px]">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Licenciatura Universitaria</p>
                                            <p className="text-[13px] font-black text-foreground">{viewingUser.licUniversitaria || "No declarada"}</p>
                                        </Card>
                                        <Card className="p-6 border-primary/10 bg-primary/[0.02] rounded-[24px]">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Licenciatura MESCP</p>
                                            <p className="text-[13px] font-black text-foreground">{viewingUser.licMescp || "No declarada"}</p>
                                        </Card>
                                    </div>
                                </div>

                                {/* Experiencia y Habilidades */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 ml-2">
                                            <Briefcase className="w-4 h-4 text-primary" />
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Experiencia Crítica</h4>
                                        </div>
                                        <Card className="p-6 border-border bg-muted/10 rounded-[28px] h-full">
                                            <p className="text-[13px] leading-relaxed text-muted-foreground font-medium whitespace-pre-line">
                                                {viewingUser.experienciaLaboral || "Cronograma de experiencia no disponible."}
                                            </p>
                                        </Card>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 ml-2">
                                            <Zap className="w-4 h-4 text-primary" />
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Competencias Técnicas</h4>
                                        </div>
                                        <Card className="p-6 border-border bg-muted/10 rounded-[28px] h-full space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Habilidades</p>
                                                <p className="text-[12px] font-bold text-foreground">{viewingUser.habilidades || "---"}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Idiomas</p>
                                                <p className="text-[12px] font-bold text-foreground">{viewingUser.idiomas || "---"}</p>
                                            </div>
                                        </Card>
                                    </div>
                                </div>

                                {/* Posgrados (Acordeón de títulos) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 ml-2">
                                        <Award className="w-5 h-5 text-primary" />
                                        <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Especializaciones y Posgrados</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {(viewingUser as any).bp_posgrado && (viewingUser as any).bp_posgrado.length > 0 ? (
                                            (viewingUser as any).bp_posgrado.map((p: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group overflow-hidden relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform" />
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                                                            <GraduationCap className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest">{(p.bp_tipo_posgrado?.btp_nombre || 'Especialización').toUpperCase()}</p>
                                                            <h5 className="text-[13px] font-black text-foreground uppercase">{p.bpg_titulo}</h5>
                                                            <p className="text-[10px] font-bold text-muted-foreground italic">Expedido: {new Date(p.bpg_fecha).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-10 rounded-[32px] border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
                                                <Award className="w-10 h-10 text-muted-foreground/20" />
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sin posgrados registrados</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Producción Intelectual */}
                                <div className="space-y-4 pb-10">
                                    <div className="flex items-center gap-3 ml-2">
                                        <Book className="w-5 h-5 text-primary" />
                                        <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Producción Intelectual</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(viewingUser as any).bp_produccion_intelectual && (viewingUser as any).bp_produccion_intelectual.length > 0 ? (
                                            (viewingUser as any).bp_produccion_intelectual.map((prod: any, idx: number) => (
                                                <Card key={idx} className="p-5 border-border bg-card rounded-2xl flex items-center gap-4">
                                                    <div className="p-3 rounded-xl bg-indigo-500/5 text-indigo-500">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h5 className="text-[12px] font-black text-foreground uppercase truncate w-64">{prod.bpi_titulo}</h5>
                                                        <p className="text-[10px] font-bold text-muted-foreground">Año: {prod.bpi_anio_publicacion}</p>
                                                    </div>
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="col-span-2 p-10 rounded-[32px] border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
                                                <Book className="w-10 h-10 text-muted-foreground/20" />
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sin publicaciones declaradas</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
                <div className="p-10 pt-0 flex justify-end">
                    <button
                        onClick={() => setViewingUser(null)}
                        className="h-16 px-16 rounded-2xl bg-muted text-muted-foreground font-black text-[12px] uppercase tracking-widest hover:text-foreground transition-all active:scale-95 shadow-xl hover:shadow-2xl"
                    >
                        Cerrar Expediente
                    </button>
                </div>
            </Modal>
        </div >
    );
}


