'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    evaluationService,
    EvaluationPeriod,
    EvaluacionCuestionario,
    EvaluacionAdmins,
} from '@/services/evaluationService';
import { userService } from '@/services/userService';
import { cargoService, Cargo } from '@/services/cargoService';
import { departmentService } from '@/services/departmentService';
import { useAbility } from '@/hooks/useAbility';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    Users,
    UserCheck,
    Plus,
    Search,
    Trash2,
    CheckCircle2,
    CalendarCheck,
    Layers,
    Filter,
    ArrowRight,
    Building2,
    Briefcase,
    Sparkles,
    UserPlus,
    UserMinus,
    Loader2,
    AlertCircle,
    FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AsignacionesEvaluacionPage() {
    const { user, isSuperAdmin } = useAbility();

    // Data States
    const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [asignaciones, setAsignaciones] = useState<EvaluacionAdmins[]>([]);
    const [cuestionarios, setCuestionarios] = useState<EvaluacionCuestionario[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState<string>('');
    const [filterEstado, setFilterEstado] = useState<string>('');

    // Modal Asignación Individual
    const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
    const [evaluadorId, setEvaluadorId] = useState('');
    const [evaluadoId, setEvaluadoId] = useState('');
    const [cuestionarioId, setCuestionarioId] = useState('');
    const [tipoEvaluacion, setTipoEvaluacion] = useState('SUPERVISOR');
    const [savingIndividual, setSavingIndividual] = useState(false);

    // Modal Asignación Masiva
    const [isMasivaModalOpen, setIsMasivaModalOpen] = useState(false);
    const [masivaEvaluadorId, setMasivaEvaluadorId] = useState('');
    const [masivaTipo, setMasivaTipo] = useState('SUPERVISOR');
    const [masivaCuestionarioId, setMasivaCuestionarioId] = useState('');
    const [targetCargoId, setTargetCargoId] = useState('');
    const [targetDeptId, setTargetDeptId] = useState('');
    const [masivaSearch, setMasivaSearch] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [savingMasiva, setSavingMasiva] = useState(false);

    const loadAsignacionesYMatriz = async (periodId?: string) => {
        const pId = periodId || selectedPeriod;
        if (!pId) return;
        try {
            setLoading(true);
            const [asigs, cuests] = await Promise.all([
                evaluationService.getAsignaciones(undefined, pId).catch(() => []),
                evaluationService.getCuestionarios(pId).catch(() => []),
            ]);
            setAsignaciones(asigs || []);
            setCuestionarios(cuests || []);
        } catch {
            toast.error('Error al cargar la matriz de asignaciones');
        } finally {
            setLoading(false);
        }
    };

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [pData, uData, cData, dData] = await Promise.all([
                evaluationService.getPeriods().catch(() => []),
                userService.getAll('', true).catch(() => []),
                cargoService.getAll().catch(() => []),
                departmentService.getAll().catch(() => []),
            ]);

            setPeriods(pData || []);
            setAllUsers(uData || []);
            setCargos(cData || []);
            setDepartments(dData || []);

            const active = pData && pData.length > 0 ? (pData.find((p: any) => p.activo) || pData[0]) : null;
            if (active) {
                setSelectedPeriod(active.id);
                const [asigs, cuests] = await Promise.all([
                    evaluationService.getAsignaciones(undefined, active.id).catch(() => []),
                    evaluationService.getCuestionarios(active.id).catch(() => []),
                ]);
                setAsignaciones(asigs || []);
                setCuestionarios(cuests || []);
            }
        } catch {
            toast.error('Error al cargar datos del sistema');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const handlePeriodChange = (newPeriodId: string) => {
        setSelectedPeriod(newPeriodId);
        loadAsignacionesYMatriz(newPeriodId);
    };

    // Crear Asignación Individual (1 a 1)
    const handleCreateIndividual = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!evaluadorId || !evaluadoId || !selectedPeriod) {
            toast.warning('Selecciona el evaluador, el evaluado y el periodo');
            return;
        }

        if (evaluadorId === evaluadoId && tipoEvaluacion !== 'AUTOEVALUACION') {
            toast.warning('Un usuario no puede evaluarse a sí mismo a menos que el tipo sea AUTOEVALUACION');
            return;
        }

        try {
            setSavingIndividual(true);
            const targetEvaluado = allUsers.find(u => u.id === evaluadoId);
            await evaluationService.createAsignacion({
                periodoId: selectedPeriod,
                cuestionarioId: cuestionarioId || undefined,
                evaluadorId,
                evaluadoId,
                cargoId: targetEvaluado?.cargoPostulacionId,
                tenantId: targetEvaluado?.tenantId,
                tipoEvaluacion,
            });

            toast.success('Asignación creada exitosamente');
            setIsIndividualModalOpen(false);
            setEvaluadorId('');
            setEvaluadoId('');
            setCuestionarioId('');
            loadAsignacionesYMatriz();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al crear la asignación';
            toast.error(msg);
        } finally {
            setSavingIndividual(false);
        }
    };

    // Crear Asignación Masiva (1 a N o Selección)
    const handleCreateMasiva = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!masivaEvaluadorId || !selectedPeriod) {
            toast.warning('Selecciona el evaluador principal');
            return;
        }

        if (selectedUserIds.length === 0) {
            toast.warning('Selecciona al menos un funcionario para evaluar');
            return;
        }

        try {
            setSavingMasiva(true);
            const payload = selectedUserIds.map(uid => {
                const targetEvaluado = allUsers.find(u => u.id === uid);
                return {
                    periodoId: selectedPeriod,
                    cuestionarioId: masivaCuestionarioId || undefined,
                    evaluadorId: masivaEvaluadorId,
                    evaluadoId: uid,
                    cargoId: targetEvaluado?.cargoPostulacionId,
                    tenantId: targetEvaluado?.tenantId,
                    tipoEvaluacion: masivaTipo,
                };
            });

            const res = await evaluationService.createAsignacionesMasivas(payload);
            toast.success(`Se crearon ${res.creadas} asignaciones correctamente`);
            setIsMasivaModalOpen(false);
            setSelectedUserIds([]);
            setMasivaEvaluadorId('');
            setMasivaCuestionarioId('');
            loadAsignacionesYMatriz();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al generar asignaciones masivas';
            toast.error(msg);
        } finally {
            setSavingMasiva(false);
        }
    };

    const handleDeleteAsignacion = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta asignación de evaluación?')) return;

        try {
            await evaluationService.deleteAsignacion(id);
            toast.success('Asignación eliminada');
            setAsignaciones(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            toast.error('Error al eliminar la asignación');
        }
    };

    // Usuarios filtrados para modal masivo
    const eligibleUsersForMasiva = useMemo(() => {
        return allUsers.filter(u => {
            if (u.id === masivaEvaluadorId && masivaTipo !== 'AUTOEVALUACION') return false;
            if (targetCargoId && u.cargoPostulacionId !== targetCargoId && u.cargoPostulacion?.id !== targetCargoId) return false;
            if (targetDeptId && u.tenantId !== targetDeptId) return false;

            if (masivaSearch.trim()) {
                const q = masivaSearch.toLowerCase();
                const nom = `${u.nombre || ''} ${u.apellidos || ''}`.toLowerCase();
                const ci = `${u.ci || ''}`.toLowerCase();
                const car = `${u.cargoPostulacion?.nombre || u.cargoStr || ''}`.toLowerCase();
                if (!nom.includes(q) && !ci.includes(q) && !car.includes(q)) return false;
            }

            return true;
        });
    }, [allUsers, masivaEvaluadorId, masivaTipo, targetCargoId, targetDeptId, masivaSearch]);

    const handleSelectAllMasiva = () => {
        if (selectedUserIds.length === eligibleUsersForMasiva.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(eligibleUsersForMasiva.map(u => u.id));
        }
    };

    const handleToggleUserMasiva = (id: string) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Filtrar lista (excluyendo autoevaluaciones automáticas del sistema)
    const filteredAsignaciones = asignaciones.filter(a => {
        if (a.tipoEvaluacion === 'AUTOEVALUACION' || a.evaluadorId === a.evaluadoId) return false;
        if (filterTipo && a.tipoEvaluacion !== filterTipo) return false;
        if (filterEstado && a.estadoEvaluacion !== filterEstado) return false;

        const evaluador = `${a.evaluador?.nombre || ''} ${a.evaluador?.apellidos || ''}`.toLowerCase();
        const evaluado = `${a.evaluado?.nombre || ''} ${a.evaluado?.apellidos || ''}`.toLowerCase();
        const cargo = `${a.cargo?.nombre || ''}`.toLowerCase();
        const query = searchTerm.toLowerCase();

        return evaluador.includes(query) || evaluado.includes(query) || cargo.includes(query);
    });

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <Users className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            Asignación de Evaluadores
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">
                        Un evaluador puede calificar a <strong>N funcionarios</strong>. Un funcionario puede ser evaluado por <strong>N evaluadores</strong>. Se promedian todas las notas recibidas.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Selector de Periodo */}
                    <div className="flex items-center gap-2 bg-card px-4 py-2.5 rounded-2xl border border-border/40 shadow-sm">
                        <CalendarCheck className="w-4 h-4 text-primary" />
                        <select
                            value={selectedPeriod}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer text-foreground"
                        >
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.gestion} - {p.periodo} ({p.semestre})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setIsIndividualModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary text-secondary-foreground text-xs font-bold uppercase hover:bg-secondary/80 transition-all border border-border/40 shadow-sm"
                    >
                        <UserPlus className="w-4 h-4 text-primary" />
                        Asignar 1 Evaluador
                    </button>

                    <button
                        onClick={() => setIsMasivaModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md shadow-primary/20"
                    >
                        <Sparkles className="w-4 h-4" />
                        Asignación Masiva
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            {(() => {
                const directAsigs = asignaciones.filter(a => a.tipoEvaluacion !== 'AUTOEVALUACION' && a.evaluadorId !== a.evaluadoId);
                const completadas = directAsigs.filter(a => a.estadoEvaluacion === 'COMPLETADO').length;
                const pendientes = directAsigs.filter(a => a.estadoEvaluacion !== 'COMPLETADO').length;

                return (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-card p-5 rounded-3xl border border-border/40 shadow-sm">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">Asignaciones de Supervisión</span>
                            <div className="text-2xl font-black text-foreground mt-1">{directAsigs.length}</div>
                        </div>
                        <div className="bg-card p-5 rounded-3xl border border-border/40 shadow-sm">
                            <span className="text-[11px] font-bold text-emerald-600 uppercase">Evaluaciones Realizadas</span>
                            <div className="text-2xl font-black text-emerald-600 mt-1">
                                {completadas}
                            </div>
                        </div>
                        <div className="bg-card p-5 rounded-3xl border border-border/40 shadow-sm">
                            <span className="text-[11px] font-bold text-amber-500 uppercase">Pendientes de Calificar</span>
                            <div className="text-2xl font-black text-amber-500 mt-1">
                                {pendientes}
                            </div>
                        </div>
                        <div className="bg-card p-5 rounded-3xl border border-border/40 shadow-sm">
                            <span className="text-[11px] font-bold text-primary uppercase">Cuestionarios Disponibles</span>
                            <div className="text-2xl font-black text-primary mt-1">{cuestionarios.length}</div>
                        </div>
                    </div>
                );
            })()}

            {/* Filtros y Búsqueda */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por evaluador, funcionario o cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-border/40 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={filterTipo}
                        onChange={(e) => setFilterTipo(e.target.value)}
                        className="bg-card border border-border/40 text-xs font-semibold px-4 py-2.5 rounded-2xl text-foreground focus:ring-0"
                    >
                        <option value="">Todas las Modalidades</option>
                        <option value="SUPERVISOR">Supervisión Directa</option>
                        <option value="PAR">Evaluación entre Pares</option>
                        <option value="SUBORDINADO">Evaluación de Equipo</option>
                    </select>

                    <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="bg-card border border-border/40 text-xs font-semibold px-4 py-2.5 rounded-2xl text-foreground focus:ring-0"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_PROCESO">En Proceso</option>
                        <option value="COMPLETADO">Completado</option>
                    </select>
                </div>
            </div>

            {/* Tabla Matriz */}
            <div className="bg-card rounded-3xl border border-border/40 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-xs font-semibold text-muted-foreground">Cargando matriz de evaluaciones...</p>
                    </div>
                ) : filteredAsignaciones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                        <Users className="w-12 h-12 text-muted-foreground/30" />
                        <p className="text-base font-bold text-foreground">No hay asignaciones registradas</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                            Comienza asignando evaluadores de forma individual o masiva para este periodo.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-secondary/40 border-b border-border/30 text-muted-foreground uppercase text-[10px] font-black tracking-wider">
                                <tr>
                                    <th className="py-4 px-6">Evaluador</th>
                                    <th className="py-4 px-6">Funcionario Evaluado</th>
                                    <th className="py-4 px-6">Cargo</th>
                                    <th className="py-4 px-6">Cuestionario</th>
                                    <th className="py-4 px-6">Modalidad</th>
                                    <th className="py-4 px-6">Estado / Calificación</th>
                                    <th className="py-4 px-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {filteredAsignaciones.map((a) => {
                                    const modalidadLabel = a.tipoEvaluacion === 'SUPERVISOR'
                                        ? 'Supervisión Directa'
                                        : a.tipoEvaluacion === 'PAR'
                                            ? 'Entre Pares'
                                            : a.tipoEvaluacion === 'SUBORDINADO'
                                                ? 'Equipo'
                                                : a.tipoEvaluacion;

                                    return (
                                        <tr key={a.id} className="hover:bg-secondary/20 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                                        {a.evaluador?.nombre?.charAt(0)}{a.evaluador?.apellidos?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">{a.evaluador?.nombre} {a.evaluador?.apellidos}</p>
                                                        <span className="text-[10px] text-muted-foreground">{a.evaluador?.correo}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-secondary text-secondary-foreground font-bold flex items-center justify-center text-xs">
                                                        {a.evaluado?.nombre?.charAt(0)}{a.evaluado?.apellidos?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">{a.evaluado?.nombre} {a.evaluado?.apellidos}</p>
                                                        <span className="text-[10px] text-muted-foreground">CI: {a.evaluado?.ci || 'S/N'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-foreground">
                                                {a.cargo?.nombre || 'General / Sin Cargo'}
                                            </td>
                                            <td className="py-4 px-6 text-muted-foreground font-medium">
                                                {a.cuestionario?.titulo || 'Cuestionario Estándar'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                                    {modalidadLabel}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                {a.estadoEvaluacion === 'COMPLETADO' ? (
                                                    <span className="text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Evaluado ({a.puntajeFinal ?? '—'} pts)
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-500 font-semibold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleDeleteAsignacion(a.id)}
                                                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                    title="Eliminar asignación"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL ASIGNACIÓN INDIVIDUAL */}
            <Modal
                isOpen={isIndividualModalOpen}
                onClose={() => setIsIndividualModalOpen(false)}
                title="Nueva Asignación"
                size="md"
            >
                <form onSubmit={handleCreateIndividual} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-foreground">Evaluador (Quién califica)</label>
                        <select
                            value={evaluadorId}
                            onChange={(e) => setEvaluadorId(e.target.value)}
                            required
                            className="w-full p-2.5 rounded-2xl border border-border bg-card text-xs font-semibold focus:ring-2 focus:ring-primary/20 text-foreground"
                        >
                            <option value="">Selecciona al Evaluador...</option>
                            {allUsers.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.nombre} {u.apellidos} ({u.cargoPostulacion?.nombre || u.cargoStr || 'Sin Cargo'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-foreground">Funcionario a Evaluar</label>
                        <select
                            value={evaluadoId}
                            onChange={(e) => setEvaluadoId(e.target.value)}
                            required
                            className="w-full p-2.5 rounded-2xl border border-border bg-card text-xs font-semibold focus:ring-2 focus:ring-primary/20 text-foreground"
                        >
                            <option value="">Selecciona al Evaluado...</option>
                            {allUsers.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.nombre} {u.apellidos} ({u.cargoPostulacion?.nombre || u.cargoStr || 'Sin Cargo'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-foreground">Modalidad de Evaluación</label>
                            <select
                                value={tipoEvaluacion}
                                onChange={(e) => setTipoEvaluacion(e.target.value)}
                                className="w-full p-2.5 rounded-2xl border border-border bg-card text-xs font-semibold focus:ring-2 focus:ring-primary/20 text-foreground"
                            >
                                <option value="SUPERVISOR">Supervisión Directa</option>
                                <option value="PAR">Evaluación entre Pares</option>
                                <option value="SUBORDINADO">Evaluación de Equipo</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-foreground">Cuestionario (Opcional)</label>
                            <select
                                value={cuestionarioId}
                                onChange={(e) => setCuestionarioId(e.target.value)}
                                className="w-full p-2.5 rounded-2xl border border-border bg-card text-xs font-semibold focus:ring-2 focus:ring-primary/20 text-foreground"
                            >
                                <option value="">Auto según cargo</option>
                                {cuestionarios.map(c => (
                                    <option key={c.id} value={c.id}>{c.titulo}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                        <button
                            type="button"
                            onClick={() => setIsIndividualModalOpen(false)}
                            className="px-4 py-2 rounded-2xl border border-border bg-card text-xs font-bold uppercase"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={savingIndividual}
                            className="px-5 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider flex items-center gap-2"
                        >
                            {savingIndividual ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Crear Asignación
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL ASIGNACIÓN MASIVA */}
            <Modal
                isOpen={isMasivaModalOpen}
                onClose={() => setIsMasivaModalOpen(false)}
                title="Asignación Masiva de Evaluaciones"
                size="xl"
            >
                <form onSubmit={handleCreateMasiva} className="space-y-6 pt-2">
                    {/* Encabezado descriptivo */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase text-foreground tracking-wider">
                                    Configuración de Asignación Rápida
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                    Asigna un evaluador a múltiples funcionarios simultáneamente según su cargo y área.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Paso 1: Evaluador y Modalidad */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                                    Evaluador Responsable
                                </label>
                                <select
                                    value={masivaEvaluadorId}
                                    onChange={(e) => setMasivaEvaluadorId(e.target.value)}
                                    required
                                    className="w-full p-3 rounded-2xl border border-border bg-card text-xs font-semibold focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                                >
                                    <option value="">Seleccionar evaluador responsable...</option>
                                    {allUsers.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.nombre} {u.apellidos} ({u.cargoPostulacion?.nombre || u.cargoStr || 'Sin Cargo'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-primary" />
                                    Cuestionario (Opcional)
                                </label>
                                <select
                                    value={masivaCuestionarioId}
                                    onChange={(e) => setMasivaCuestionarioId(e.target.value)}
                                    className="w-full p-3 rounded-2xl border border-border bg-card text-xs font-semibold focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                                >
                                    <option value="">Automático según el cargo de cada funcionario</option>
                                    {cuestionarios.map(c => (
                                        <option key={c.id} value={c.id}>{c.titulo}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Selector de Modalidad */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-foreground">
                                Modalidad de Evaluación
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: 'SUPERVISOR', title: 'Supervisión Directa', desc: 'Evaluación jerárquica directa' },
                                    { id: 'PAR', title: 'Entre Pares', desc: 'Evaluación mutua entre colegas' },
                                    { id: 'SUBORDINADO', title: 'Equipo', desc: 'Evaluación ascendente de equipo' },
                                ].map((mod) => {
                                    const isSelected = masivaTipo === mod.id;
                                    return (
                                        <button
                                            key={mod.id}
                                            type="button"
                                            onClick={() => setMasivaTipo(mod.id)}
                                            className={cn(
                                                "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                                                isSelected
                                                    ? "bg-primary/10 border-primary text-primary shadow-sm ring-1 ring-primary/20"
                                                    : "bg-card border-border/50 hover:bg-secondary/40 text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-xs font-bold">{mod.title}</span>
                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">{mod.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Paso 2: Filtros y Búsqueda de Funcionarios */}
                    <div className="p-4 rounded-3xl bg-secondary/30 border border-border/40 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-foreground flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5 text-primary" /> Filtrar Funcionarios
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                                {eligibleUsersForMasiva.length} funcionario(s) disponibles
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o CI..."
                                    value={masivaSearch}
                                    onChange={(e) => setMasivaSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card text-xs font-medium focus:ring-2 focus:ring-primary/20 text-foreground"
                                />
                            </div>

                            <select
                                value={targetCargoId}
                                onChange={(e) => setTargetCargoId(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground"
                            >
                                <option value="">Todos los Cargos</option>
                                {cargos.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>

                            <select
                                value={targetDeptId}
                                onChange={(e) => setTargetDeptId(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground"
                            >
                                <option value="">Todos los Departamentos</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Paso 3: Selección de Funcionarios */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-black uppercase text-foreground">
                                    Funcionarios a Calificar
                                </label>
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-black",
                                    selectedUserIds.length > 0 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                                )}>
                                    {selectedUserIds.length} seleccionados
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleSelectAllMasiva}
                                className="text-xs font-bold text-primary hover:underline cursor-pointer"
                            >
                                {selectedUserIds.length === eligibleUsersForMasiva.length && eligibleUsersForMasiva.length > 0
                                    ? 'Deseleccionar Todos'
                                    : 'Seleccionar Todos'}
                            </button>
                        </div>

                        {/* Barra de progreso de selección */}
                        {eligibleUsersForMasiva.length > 0 && (
                            <div className="w-full bg-secondary/80 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-primary h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${Math.round((selectedUserIds.length / eligibleUsersForMasiva.length) * 100)}%`,
                                    }}
                                />
                            </div>
                        )}

                        <div className="max-h-64 overflow-y-auto rounded-3xl border border-border/40 p-2 space-y-1.5 bg-background/50 divide-y divide-border/10">
                            {eligibleUsersForMasiva.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-xs font-medium">
                                    No se encontraron funcionarios con los filtros seleccionados
                                </div>
                            ) : (
                                eligibleUsersForMasiva.map(u => {
                                    const isChecked = selectedUserIds.includes(u.id);
                                    return (
                                        <label
                                            key={u.id}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border",
                                                isChecked
                                                    ? "bg-primary/5 border-primary/30 shadow-xs"
                                                    : "hover:bg-secondary/40 border-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleToggleUserMasiva(u.id)}
                                                    className="w-4 h-4 rounded-md border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                                                />
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
                                                    {u.nombre?.charAt(0)}{u.apellidos?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground leading-tight">
                                                        {u.nombre} {u.apellidos}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {u.cargoPostulacion?.nombre || u.cargoStr || 'Sin cargo'}
                                                    </span>
                                                </div>
                                            </div>

                                            <span className="text-[10px] font-semibold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-lg">
                                                CI: {u.ci || 'S/N'}
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <span className="text-xs text-muted-foreground font-semibold">
                            {selectedUserIds.length} funcionario(s) listos para asignar
                        </span>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsMasivaModalOpen(false)}
                                className="px-5 py-2.5 rounded-2xl border border-border bg-card text-xs font-bold uppercase hover:bg-secondary transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={savingMasiva || selectedUserIds.length === 0 || !masivaEvaluadorId}
                                className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 shadow-md shadow-primary/20 hover:opacity-95 transition-all cursor-pointer"
                            >
                                {savingMasiva ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Asignar a {selectedUserIds.length} Funcionario(s)
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
