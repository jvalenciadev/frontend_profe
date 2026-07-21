'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { userService } from '@/services/userService';
import { authService } from '@/services/authService';
import { roleService } from '@/services/roleService';
import { departmentService } from '@/services/departmentService';
import { sedeService } from '@/services/sedeService';
import { cargoService, Cargo } from '@/services/cargoService';
import { bancoProfesionalService } from '@/services/bancoProfesionalService';
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
    Globe,
    Book,
    FileText,
    Download,
    Settings2,
    Award,
    Briefcase,
    ArrowLeftRight,
    Upload
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfe } from '@/contexts/ProfeContext';
import { StatusBadge } from '@/components/StatusBadge';

export default function UsuariosPage() {
    const router = useRouter();
    const { user: currentUser, login } = useAuth();
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
    const [viewingUserBP, setViewingUserBP] = useState<any | null>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState<User | null>(null);

    // Bulk Migration State
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkData, setBulkData] = useState<any[]>([]);
    const [selectedBulkRoleIds, setSelectedBulkRoleIds] = useState<string[]>([]);
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationProgress, setMigrationProgress] = useState(0);
    const [migrationReport, setMigrationReport] = useState<{ success: number; errors: any[] } | null>(null);

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

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadUsers(searchTerm);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBulkFile(file);
        setMigrationReport(null);
        setMigrationProgress(0);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                setBulkData(data);
                toast.success(`${data.length} registros cargados del archivo`);
            } catch (err) {
                console.error(err);
                toast.error('Error al procesar el archivo Excel');
            }
        };
        reader.readAsBinaryString(file);
    };

    const startBulkMigration = async () => {
        if (selectedBulkRoleIds.length === 0) {
            toast.warning('Seleccione al menos un rol para los operadores');
            return;
        }
        if (bulkData.length === 0) {
            toast.warning('Suba un archivo de Excel válido');
            return;
        }

        setIsMigrating(true);
        setMigrationReport(null);
        setMigrationProgress(0);

        try {
            const rawUsuarios = bulkData.map(row => ({
                ci: row.ci || row.CI || row.documento || row.DOCUMENTO,
                complemento: row.complemento || row.COMPLEMENTO,
                nombre: row.nombre || row.NOMBRE || row.nombres || row.NOMBRES,
                apellidos: row.apellidos || row.APELLIDOS || row.apellido || row.APELLIDO,
                correo: row.correo || row.CORREO || row.email || row.EMAIL,
                username: row.username || row.USERNAME || row.usuario || row.USUARIO,
                password: row.password || row.PASSWORD || row.contraseña || row.CONTRASEÑA,
                celular: row.celular || row.CELULAR || row.telefono || row.TELEFONO,
                cargo: row.cargo || row.CARGO,
                licenciatura: row.licenciatura || row.LICENCIATURA,
                genero: row.genero || row.GENERO,
                direccion: row.direccion || row.DIRECCION,
            })).filter(u => u.ci && u.nombre && u.apellidos);

            if (rawUsuarios.length === 0) {
                toast.error('El archivo no contiene registros válidos (debe tener CI, Nombre y Apellidos)');
                setIsMigrating(false);
                return;
            }

            const chunkSize = 50;
            const chunks = [];
            for (let i = 0; i < rawUsuarios.length; i += chunkSize) {
                chunks.push(rawUsuarios.slice(i, i + chunkSize));
            }

            let totalSuccess = 0;
            let totalErrors: any[] = [];

            for (let i = 0; i < chunks.length; i++) {
                const res = await userService.bulkImport({
                    roleIds: selectedBulkRoleIds,
                    usuarios: chunks[i]
                });

                totalSuccess += res.success;
                totalErrors = [...totalErrors, ...res.errors];

                setMigrationProgress(Math.round(((i + 1) / chunks.length) * 100));
            }

            const finalReport = { success: totalSuccess, errors: totalErrors };
            setMigrationReport(finalReport);
            toast.success(`Migración finalizada: ${totalSuccess} creados, ${totalErrors.length} errores`);
            loadUsers(searchTerm);

            if (totalErrors.length === 0) {
                setTimeout(() => {
                    setIsBulkModalOpen(false);
                    setBulkFile(null);
                    setBulkData([]);
                }, 2000);
            }
        } catch (error) {
            console.error('Migration error:', error);
            toast.error('Error durante la migración masiva');
        } finally {
            setIsMigrating(false);
        }
    };

    const loadUsers = async (search?: string) => {
        try {
            setLoading(true);
            const usersData = await userService.getAll(search);
            setUsuarios(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Error al cargar la lista de usuarios');
        } finally {
            setLoading(false);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [rolesData, deptsData, sedesData, cargosData] = await Promise.all([
                roleService.getAll(),
                departmentService.getAll(),
                sedeService.getAll(),
                cargoService.getAll()
            ]);
            console.log('[DEBUG] Usuarios Page - Roles Master:', rolesData);
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
        setViewingUserBP(null);
        try {
            const fullUser = await userService.getById(user.id);
            setViewingUser(fullUser);
            // Intentar cargar datos del Banco Profesional vinculado al usuario
            try {
                const allBP = await bancoProfesionalService.getAll();
                const bp = allBP.find((b: any) => b.user?.id === user.id || b.userId === user.id);
                if (bp) setViewingUserBP(bp);
            } catch (_) { /* sin BP */ }
        } catch (error) {
            console.error('Error fetching full user:', error);
            setViewingUser(user);
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
            loadUsers(searchTerm);
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
            loadUsers(searchTerm);
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Error en la remoción técnica');
        }
    };

    const handleResetPassword = (user: User) => {
        setUserToReset(user);
        setIsResetModalOpen(true);
    };

    const confirmResetPassword = async () => {
        if (!userToReset) return;
        try {
            await userService.resetPassword(userToReset.id);
            toast.success(`Contraseña de ${userToReset.nombre} reseteada correctamente`);
            setIsResetModalOpen(false);
            setUserToReset(null);
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error('Error al resetear la contraseña');
        }
    };

    const handleImpersonate = async (user: User, mode: 'dashboard' | 'aula' = 'dashboard') => {
        const loadingToast = toast.loading(`Generando acceso mágico para ${user.username}...`);
        try {
            const { access_token, user: impersonatedUser } = await authService.impersonate(user.id);

            if (mode === 'aula') {
                // Abrir en nueva pestaña con el token
                toast.dismiss(loadingToast);
                const url = `/aula/login?token=${access_token}`;
                window.open(url, '_blank');
                toast.success(`Aula abierta como ${user.nombre}`);
            } else {
                // Loguear en la misma pestaña
                login(access_token, impersonatedUser);
                toast.dismiss(loadingToast);
                toast.success(`Ahora eres: ${user.nombre}`);
                router.push('/dashboard');
                // Forzar recarga ligera para limpiar contextos
                setTimeout(() => window.location.reload(), 500);
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Error al generar acceso de suplantación');
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
        // Excluir rol POSTULACION_PROFE a menos que se busque explícitamente
        const isPostulante = u.roles?.some(r => {
            const name = typeof r === 'string' ? r : ('role' in r ? r.role?.name : (r as any)?.name);
            return name === 'POSTULACION_PROFE';
        });
        const isSearching = searchTerm.trim().length > 0;

        if (isPostulante && !isSearching) {
            return false;
        }

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
        <div className="space-y-4 md:space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">
                        <Users className="w-3 h-3" />
                        <span className="hidden sm:inline">Recursos Humanos Operativos</span>
                        <span className="sm:hidden">RRHH</span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground uppercase">Usuarios</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Can action="read" subject="User">
                        <Link
                            href="/dashboard/usuarios/campos-extra"
                            className="h-10 md:h-14 px-4 md:px-6 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-white active:scale-95 transition-all flex items-center gap-2 shrink-0"
                        >
                            <Settings2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Campos Extras</span>
                            <span className="sm:hidden">Extras</span>
                        </Link>
                    </Can>
                    <Can action="create" subject="User">
                        <button
                            onClick={() => {
                                setMigrationReport(null);
                                setMigrationProgress(0);
                                setBulkFile(null);
                                setBulkData([]);
                                setSelectedBulkRoleIds([]);
                                setIsBulkModalOpen(true);
                            }}
                            className="h-10 md:h-14 px-4 md:px-6 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white active:scale-95 transition-all flex items-center gap-2 shrink-0"
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                            <span className="hidden sm:inline">Migrar Excel</span>
                            <span className="sm:hidden">Migrar</span>
                        </button>
                    </Can>
                    <Can action="create" subject="User">
                        <button
                            onClick={() => handleOpenModal()}
                            className="h-10 md:h-14 px-4 md:px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-2 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nuevo Operador</span>
                            <span className="sm:hidden">Nuevo</span>
                        </button>
                    </Can>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
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

            {/* Filters */}
            <Card className="p-3 md:p-4 border-border/40 bg-card/30 backdrop-blur-md">
                <div className="flex flex-col gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, username..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary outline-none text-[13px] font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Filter Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center bg-muted/20 p-1 rounded-xl border border-border/50">
                            {[{ id: 'all', label: 'Todos' }, { id: 'active', label: 'Activos' }, { id: 'inactive', label: 'Inact.' }].map(s => (
                                <button key={s.id} onClick={() => setFilterStatus(s.id)}
                                    className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                                        filterStatus === s.id ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-foreground')}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        <select className="h-9 px-3 rounded-xl bg-muted/30 border border-border/50 text-[10px] font-black uppercase outline-none focus:border-primary flex-1 min-w-[100px]"
                            value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                            <option value="all">Roles: Todos</option>
                            {roles.map((r, idx) => <option key={r.id || idx} value={r.id}>{r.name}</option>)}
                        </select>
                        <select className="h-9 px-3 rounded-xl bg-muted/30 border border-border/50 text-[10px] font-black uppercase outline-none focus:border-primary flex-1 min-w-[100px]"
                            value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                            <option value="all">Depto: Todos</option>
                            {departments.map((d, idx) => <option key={d.id || idx} value={d.id}>{d.nombre}</option>)}
                        </select>
                        <div className="flex items-center bg-muted/20 p-1 rounded-xl border border-border/50">
                            {[{ id: 'table', icon: ListIcon }, { id: 'grid', icon: LayoutGrid }].map(v => (
                                <button key={v.id} onClick={() => setViewMode(v.id as any)}
                                    className={cn('p-2 rounded-lg transition-all', viewMode === v.id ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground')}>
                                    <v.icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                        <button onClick={() => { setSearchTerm(''); setFilterRole('all'); setFilterDept('all'); setFilterStatus('all'); }}
                            className="p-2 rounded-xl bg-muted/30 border border-border/50 text-muted-foreground hover:text-primary transition-all">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </Card>

            {/* Data View */}
            <AnimatePresence mode="wait">
                {viewMode === 'table' ? (
                    <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {/* Desktop table, hidden on mobile */}
                        <Card className="border-border/40 shadow-xl overflow-hidden bg-card hidden md:block">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border/60">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground cursor-pointer hover:text-primary" onClick={() => handleSort('nombre_completo')}>
                                                <div className="flex items-center gap-2">Operador <ArrowUpDown className="w-3 h-3 opacity-30" /></div>
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Correo</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Roles</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Dpto.</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Estado</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {loading && usuarios.length === 0 ? Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-5"><div className="h-12 bg-muted rounded-2xl" /></td></tr>
                                        )) : filteredUsuarios.map((u) => (
                                            <tr key={u.id} className="group hover:bg-muted/50 transition-all">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-card border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                                                            {u.imagen ? <img src={getImageUrl(u.imagen)} alt={u.nombre} className="w-full h-full object-cover" />
                                                                : <span className="text-primary font-black text-sm">{u.nombre?.charAt(0) || 'U'}</span>}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">{u.nombre} {u.apellidos}</p>
                                                            <p className="text-[10px] font-bold text-muted-foreground">@{u.username}{u.ci ? ` · CI: ${u.ci}` : ''}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-[12px] font-bold text-muted-foreground">{u.correo}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {u.roles?.map((r, idx) => {
                                                            const name = typeof r === 'string' ? roles.find(x => x.id === r)?.name : ('role' in r ? r.role.name : (r as any).name);
                                                            return <span key={idx} className="px-2 py-0.5 rounded-md bg-card border border-border text-[9px] font-black uppercase text-muted-foreground">{name}</span>;
                                                        }) || <span className="text-[9px] italic text-muted-foreground/30">Sin rol</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground">{u.tenant?.nombre || '—'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <StatusBadge status={u.estado || (u.activo ? 'OPERATIVO' : 'BLOQUEADO')} showIcon={false} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2 text-right">
                                                        <div className="flex items-center gap-1 pr-2 border-r border-border/50">
                                                            <button
                                                                onClick={() => handleImpersonate(u, 'dashboard')}
                                                                className="h-8 px-2 rounded-lg bg-pink-500/5 text-pink-500 hover:bg-pink-500 hover:text-white transition-all flex items-center gap-1 text-[8px] font-black uppercase"
                                                                title="Acceder como Administrador"
                                                            >
                                                                <Zap className="w-3.5 h-3.5" /> Admin
                                                            </button>
                                                            <button
                                                                onClick={() => handleImpersonate(u, 'aula')}
                                                                className="h-8 px-2 rounded-lg bg-indigo-500/5 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1 text-[8px] font-black uppercase"
                                                                title="Acceder como Estudiante (Nueva Pestaña)"
                                                            >
                                                                <GraduationCap className="w-3.5 h-3.5" /> Aula
                                                            </button>
                                                        </div>
                                                        <button onClick={() => handleViewUser(u)} className="p-2 rounded-xl bg-blue-500/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all" title="Ver"><Eye className="w-4 h-4" /></button>
                                                        <Can action="update" subject="User">
                                                            <button onClick={() => handleOpenModal(u)} className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => handleResetPassword(u)} className="p-2 rounded-xl bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-white transition-all" title="Reset"><RefreshCw className="w-4 h-4" /></button>
                                                        </Can>
                                                        <Can action="delete" subject="User">
                                                            <button onClick={() => setIsDeleting(u.id)} className="p-2 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                                        </Can>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                        {/* Mobile cards - visible only on small screens */}
                        <div className="md:hidden space-y-3">
                            {loading && usuarios.length === 0 ? Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
                            )) : filteredUsuarios.map((u) => (
                                <Card key={u.id} className="p-4 border-border/40 bg-card flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-card border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                                        {u.imagen ? <img src={getImageUrl(u.imagen)} alt={u.nombre} className="w-full h-full object-cover" />
                                            : <span className="text-primary font-black text-base">{u.nombre?.charAt(0) || 'U'}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm text-foreground uppercase truncate">{u.nombre} {u.apellidos}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">@{u.username} · {u.correo}</p>
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            <StatusBadge status={u.estado || (u.activo ? 'OPERATIVO' : 'BLOQUEADO')} showIcon={false} />
                                            {u.roles?.slice(0, 2).map((r, idx) => {
                                                const name = typeof r === 'string' ? roles.find(x => x.id === r)?.name : ('role' in r ? r.role.name : (r as any).name);
                                                return <span key={idx} className="px-2 py-0.5 rounded-md bg-muted text-[8px] font-black uppercase text-muted-foreground">{name}</span>;
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button onClick={() => handleViewUser(u)} className="p-2 rounded-xl bg-blue-500/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"><Eye className="w-4 h-4" /></button>
                                        <Can action="update" subject="User">
                                            <button onClick={() => handleOpenModal(u)} className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                                        </Can>
                                        <Can action="delete" subject="User">
                                            <button onClick={() => setIsDeleting(u.id)} className="p-2 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </Can>
                                    </div>
                                </Card>
                            ))}
                        </div>
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
                                            onClick={() => handleResetPassword(u)}
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

            {/* Modal de Reseteo de Contraseña Premium */}
            <Modal
                isOpen={isResetModalOpen}
                onClose={() => { setIsResetModalOpen(false); setUserToReset(null); }}
                title="Gestión de Seguridad"
            >
                <div className="space-y-8 text-center py-6">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl animate-pulse" />
                        <div className="relative w-24 h-24 rounded-[3rem] bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center border-4 border-white shadow-2xl">
                            <LucideLock className="w-10 h-10" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase">¿Resetear Acceso?</h3>
                            <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Usuario: {userToReset?.nombre} {userToReset?.apellidos}</p>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-[2rem] space-y-4 shadow-sm">
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                Se establecerá la contraseña por defecto <span className="text-primary font-black underline underline-offset-4 decoration-primary/30">profe2026</span> y se enviará una notificación formal al correo electrónico del usuario.
                            </p>
                            <div className="flex items-center justify-center gap-2 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                                <Mail className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-tight text-primary/70">{userToReset?.correo}</span>
                            </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground font-bold italic uppercase opacity-60">
                            "El usuario deberá cambiar su clave obligatoriamente al ingresar."
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={confirmResetPassword}
                            className="h-16 w-full rounded-[2rem] bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <LucideKey className="w-5 h-5" />
                            Ejecutar Reseteo Maestro
                        </button>
                        <button
                            onClick={() => { setIsResetModalOpen(false); setUserToReset(null); }}
                            className="h-14 w-full rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cancelar Operación
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Migración Masiva desde Excel */}
            <Modal
                isOpen={isBulkModalOpen}
                onClose={() => {
                    if (!isMigrating) {
                        setIsBulkModalOpen(false);
                        setBulkFile(null);
                        setBulkData([]);
                    }
                }}
                title={undefined}
                size="2xl"
            >
                <div className="flex flex-col bg-slate-50 dark:bg-slate-950">
                    <div className="p-8 bg-white dark:bg-slate-900 border-b border-border/40">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                <ArrowLeftRight className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                                    Migración <span className="text-indigo-600">Masiva</span>
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Importación de operadores vía Excel / CSV</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Selector de Roles por Defecto */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Roles por Defecto a Asignar</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {roles.map((role) => {
                                    const isSelected = selectedBulkRoleIds.includes(role.id);
                                    return (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedBulkRoleIds(selectedBulkRoleIds.filter(id => id !== role.id));
                                                } else {
                                                    setSelectedBulkRoleIds([...selectedBulkRoleIds, role.id]);
                                                }
                                            }}
                                            className={cn(
                                                "h-12 px-4 rounded-xl border text-xs font-bold flex items-center justify-between transition-all",
                                                isSelected
                                                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-600"
                                                    : "bg-white dark:bg-slate-900 border-border text-foreground hover:border-indigo-500/50"
                                            )}
                                        >
                                            <span>{role.name}</span>
                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* File Upload Zone */}
                        <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-4 hover:border-indigo-500/50 transition-all group cursor-pointer relative overflow-hidden">
                            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform", bulkFile ? "bg-emerald-500 text-white" : "bg-indigo-500/10 text-indigo-600")}>
                                {bulkFile ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black uppercase tracking-tight">{bulkFile ? bulkFile.name : 'Seleccionar Archivo Excel'}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {bulkData.length > 0 ? `${bulkData.length} registros detectados` : 'Formatos permitidos: .xlsx, .csv'}
                                </p>
                            </div>
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept=".xlsx, .csv"
                                onChange={handleBulkFile}
                                disabled={isMigrating}
                            />
                        </div>

                        {/* Plantilla Excel de Ayuda */}
                        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-border/60 text-xs text-muted-foreground space-y-2">
                            <span className="font-bold text-foreground">Columnas esperadas en el archivo:</span>
                            <p className="font-mono text-[10px] whitespace-pre-wrap leading-relaxed">
                                ci (obligatorio), nombre (obligatorio), apellidos (obligatorio), correo (opcional), username (opcional), password (opcional), celular (opcional), cargo (opcional), licenciatura (opcional), genero (opcional), direccion (opcional)
                            </p>
                        </div>

                        {/* Barra de Progreso */}
                        {isMigrating && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 animate-pulse">Registrando operadores...</span>
                                    <span className="text-[10px] font-black text-indigo-600">{migrationProgress}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-indigo-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${migrationProgress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reporte de Migración */}
                        {migrationReport && (
                            <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2">
                                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex justify-between items-center">
                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Reporte Final:</span>
                                    <div className="flex gap-4">
                                        <span className="text-xs font-black text-emerald-600">✓ {migrationReport.success} Exitosos</span>
                                        <span className="text-xs font-black text-rose-600">✗ {migrationReport.errors.length} Errores</span>
                                    </div>
                                </div>

                                {migrationReport.errors.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Listado de Errores</label>
                                        <div className="border border-rose-500/20 rounded-2xl overflow-hidden divide-y divide-rose-500/10">
                                            {migrationReport.errors.map((err, idx) => (
                                                <div key={idx} className="p-3 bg-rose-500/5 flex justify-between gap-4 text-[11px]">
                                                    <span className="font-black text-rose-600 font-mono">CI: {err.ci}</span>
                                                    <span className="font-bold text-rose-500/90 text-right">{err.error}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Botones de Acción */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                disabled={isMigrating || bulkData.length === 0 || selectedBulkRoleIds.length === 0}
                                onClick={startBulkMigration}
                                className="h-16 w-full rounded-[2rem] bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Iniciar Migración
                            </button>
                            <button
                                type="button"
                                disabled={isMigrating}
                                onClick={() => {
                                    setIsBulkModalOpen(false);
                                    setBulkFile(null);
                                    setBulkData([]);
                                }}
                                className="h-16 w-full rounded-[2rem] border border-border text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>


            {/* Modal de Vista de Información */}
            <Modal
                isOpen={!!viewingUser}
                onClose={() => { setViewingUser(null); setViewingUserBP(null); }}
                title="Expediente Profesional"
                size="full"
            >
                {viewingUser && (() => {
                    const imgSrc = viewingUserBP?.imagen ? getImageUrl(viewingUserBP.imagen)
                        : viewingUser.imagen ? getImageUrl(viewingUser.imagen) : null;
                    const cvPdf = viewingUserBP?.hojaDeVidaPdf ? getImageUrl(viewingUserBP.hojaDeVidaPdf) : null;
                    const rdaPdf2 = viewingUserBP?.rdaPdf ? getImageUrl(viewingUserBP.rdaPdf) : null;
                    return (
                        <div className="space-y-6 max-h-[85vh] overflow-y-auto px-3 md:px-6 pb-6 scrollbar-hide">
                            {/* Cabecera */}
                            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center p-5 md:p-8 rounded-3xl bg-gradient-to-br from-primary/[0.04] via-transparent to-primary/[0.08] border border-primary/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                                <div className="w-24 h-24 md:w-36 md:h-36 rounded-3xl bg-white border-4 border-white shadow-xl overflow-hidden shrink-0 ring-1 ring-primary/10">
                                    {imgSrc ? <img src={imgSrc} className="w-full h-full object-cover" alt={viewingUser.nombre} />
                                        : <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary text-4xl font-black">{viewingUser.nombre?.charAt(0)}</div>}
                                </div>
                                <div className="flex-1 space-y-2 relative z-10">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase border border-emerald-500/20">{viewingUser.estado || (viewingUser.activo ? 'OPERATIVO' : 'BLOQUEADO')}</span>
                                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase border border-primary/20">ID: {viewingUser.id.substring(0, 8).toUpperCase()}</span>
                                        {viewingUser.ci && <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase border border-indigo-500/20">CI: {viewingUser.ci}</span>}
                                    </div>
                                    <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground uppercase leading-tight">{viewingUser.nombre} {viewingUser.apellidos}</h2>
                                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm">
                                        <Mail className="w-4 h-4 text-primary/60" />
                                        {viewingUser.correo}
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {cvPdf && (
                                            <a href={cvPdf} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all">
                                                <Download className="w-3.5 h-3.5" /> CV del Banco Profesional
                                            </a>
                                        )}
                                        {rdaPdf2 && (
                                            <a href={rdaPdf2} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-foreground font-black text-[10px] uppercase tracking-widest shadow hover:bg-muted transition-all">
                                                <FileText className="w-3.5 h-3.5" /> Certificado RDA
                                            </a>
                                        )}
                                        {!cvPdf && !rdaPdf2 && (
                                            <span className="text-[10px] text-muted-foreground/50 italic">Sin documentos del Banco Profesional</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Grid de Contenido */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 ml-2">
                                            <ShieldCheck className="w-4 h-4 text-primary" />
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Autoridad de Sistema</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2 p-5 bg-card border border-border rounded-3xl shadow-sm">
                                            {viewingUser.roles?.map((r, idx) => {
                                                const name = typeof r === 'string' ? roles.find(role => role.id === r)?.name : ('role' in r ? r.role.name : (r as any).name);
                                                return <span key={idx} className="px-3 py-1.5 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest">{name}</span>;
                                            }) || <span className="text-[9px] font-bold text-muted-foreground italic uppercase">Sin Roles</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 ml-2">
                                            <Building2 className="w-4 h-4 text-primary" />
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Asignación Estructural</h4>
                                        </div>
                                        <div className="space-y-3 p-5 bg-muted/30 border border-border/50 rounded-3xl">
                                            <div><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Cargo</p><p className="text-base font-black text-foreground uppercase">{(viewingUser as any).cargoPostulacion?.nombre || viewingUser.cargo || 'Operador General'}</p></div>
                                            <div className="h-px bg-border/40" />
                                            <div><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Región</p><p className="text-[13px] font-black text-foreground uppercase">{viewingUser.tenant?.nombre || 'Sede Central'}</p></div>
                                            <div>
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Sedes</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {viewingUser.sedes?.map((s: any, idx: number) => (
                                                        <span key={idx} className="px-2 py-1 rounded-lg bg-white border border-border text-[9px] font-bold uppercase text-muted-foreground">{s.sede?.nombre || s.nombre}</span>
                                                    )) || <span className="text-[9px] text-muted-foreground/40 italic">Global</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 ml-2">
                                            <UserIcon className="w-4 h-4 text-primary" />
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Datos Personales</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 p-5 bg-card border border-border rounded-3xl shadow-sm">
                                            <div><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Género</p><p className="text-[12px] font-bold text-foreground">{viewingUser.genero || '---'}</p></div>
                                            <div><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Celular</p><p className="text-[12px] font-bold text-foreground">{viewingUser.celular || '---'}</p></div>
                                            <div><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Est. Civil</p><p className="text-[12px] font-bold text-foreground">{viewingUser.estadoCivil || '---'}</p></div>
                                            <div><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Nacimiento</p><p className="text-[12px] font-bold text-foreground">{viewingUser.fechaNacimiento ? new Date(viewingUser.fechaNacimiento).toLocaleDateString() : '---'}</p></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 ml-2"><FileText className="w-4 h-4 text-primary" /><h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Resumen Profesional</h4></div>
                                        <Card className="p-5 border-border bg-card shadow-sm rounded-3xl"><p className="text-sm leading-relaxed text-muted-foreground font-medium italic">{viewingUser.resumenProfesional || 'Sin resumen profesional registrado.'}</p></Card>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 ml-2"><GraduationCap className="w-4 h-4 text-primary" /><h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Formación</h4></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <Card className="p-4 border-primary/10 bg-primary/[0.02] rounded-2xl"><p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Lic. Universitaria</p><p className="text-[13px] font-black text-foreground">{viewingUser.licUniversitaria || 'No declarada'}</p></Card>
                                            <Card className="p-4 border-primary/10 bg-primary/[0.02] rounded-2xl"><p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Lic. MESCP</p><p className="text-[13px] font-black text-foreground">{viewingUser.licMescp || 'No declarada'}</p></Card>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 ml-1"><Briefcase className="w-4 h-4 text-primary" /><h4 className="text-[10px] font-black uppercase tracking-widest">Experiencia</h4></div>
                                            <Card className="p-4 border-border bg-muted/10 rounded-2xl"><p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{viewingUser.experienciaLaboral || 'No disponible.'}</p></Card>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 ml-1"><Zap className="w-4 h-4 text-primary" /><h4 className="text-[10px] font-black uppercase tracking-widest">Competencias</h4></div>
                                            <Card className="p-4 border-border bg-muted/10 rounded-2xl space-y-2">
                                                <div><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Habilidades</p><p className="text-[12px] font-bold text-foreground">{viewingUser.habilidades || '---'}</p></div>
                                                <div><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Idiomas</p><p className="text-[12px] font-bold text-foreground">{viewingUser.idiomas || '---'}</p></div>
                                            </Card>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 ml-2"><Award className="w-4 h-4 text-primary" /><h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Posgrados</h4></div>
                                        <div className="space-y-2">
                                            {(viewingUser as any).bp_posgrado?.length > 0 ? (viewingUser as any).bp_posgrado.map((p: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
                                                    <div className="p-2 rounded-xl bg-primary/5 text-primary"><GraduationCap className="w-4 h-4" /></div>
                                                    <div><p className="text-[9px] font-black text-primary uppercase tracking-widest">{p.bp_tipo_posgrado?.btp_nombre || 'Especialización'}</p><h5 className="text-[13px] font-black text-foreground uppercase">{p.bpg_titulo}</h5></div>
                                                </div>
                                            )) : (
                                                <div className="p-8 rounded-2xl border border-dashed border-border flex flex-col items-center gap-2">
                                                    <Award className="w-8 h-8 text-muted-foreground/20" />
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sin posgrados</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
                <div className="px-3 md:px-6 pb-6 flex justify-end">
                    <button
                        onClick={() => { setViewingUser(null); setViewingUserBP(null); }}
                        className="h-12 px-10 rounded-2xl bg-muted text-muted-foreground font-black text-[11px] uppercase tracking-widest hover:text-foreground transition-all active:scale-95"
                    >
                        Cerrar Expediente
                    </button>
                </div>
            </Modal>
        </div>
    );
}