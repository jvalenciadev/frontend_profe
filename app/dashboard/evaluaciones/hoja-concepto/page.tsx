'use client';

import { useState, useEffect } from 'react';
import { evaluationService, EvaluationPeriod, EvaluacionAdmins } from '@/services/evaluationService';
import { departmentService } from '@/services/departmentService';
import { useAbility } from '@/hooks/useAbility';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    ClipboardSignature,
    Search,
    UserCircle,
    Download,
    Eye,
    Star,
    AlertCircle,
    CheckCircle2,
    FileText,
    Loader2,
    Building2,
    CalendarCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function HojaConceptoPage() {
    const { user, isSuperAdmin } = useAbility();
    const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [usersToEvaluate, setUsersToEvaluate] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [evaluationData, setEvaluationData] = useState<any>({
        puntajes: []
    });

    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<string>(user?.tenantId || '');

    useEffect(() => {
        loadPeriods();
        if (isSuperAdmin) {
            loadDepartments();
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        if (selectedPeriod) {
            loadUsers();
        }
    }, [selectedPeriod, selectedDept]);

    const loadPeriods = async () => {
        try {
            const data = await evaluationService.getPeriods();
            const activePeriods = data.filter(p => p.activo);
            setPeriods(activePeriods);
            if (activePeriods.length > 0 && !selectedPeriod) {
                setSelectedPeriod(activePeriods[0].id);
            }
        } catch (error) {
            toast.error('Error al cargar periodos');
        }
    };

    const loadDepartments = async () => {
        try {
            const data = await departmentService.getAll();
            setDepartments(data);
        } catch (error) {
            toast.error('Error al cargar departamentos');
        }
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            // Si es superadmin y no seleccionó departamento, pasamos vacío para ver todo
            const targetTenant = isSuperAdmin ? selectedDept : (user?.tenantId || '');
            const data = await evaluationService.getUsersToEvaluate(targetTenant, selectedPeriod);
            // Transformar para que u.evaluacion sea el primer elemento de u.evaluaciones
            const mappedData = data.map((u: any) => ({
                ...u,
                evaluacion: u.evaluaciones && u.evaluaciones.length > 0 ? u.evaluaciones[0] : null
            }));
            setUsersToEvaluate(mappedData);
        } catch (error) {
            console.error('Error loading users to evaluate:', error);
            toast.error('Error al cargar lista de personal');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEvaluation = (userToEval: any) => {
        const period = periods.find(p => p.id === selectedPeriod);
        if (!period) return;

        const evalTenantId = userToEval.tenantId || selectedDept || user?.tenantId || '';

        setSelectedUser(userToEval);
        setEvaluationData({
            userId: userToEval.id,
            periodoId: selectedPeriod,
            responsableTenantId: evalTenantId,
            puntajes: period.criterios?.map(c => ({
                criterioId: c.id,
                nombre: c.nombre,
                puntajeMaximo: c.puntajeMaximo,
                puntaje: 0
            })) || []
        });
        setIsEvaluationModalOpen(true);
    };

    const handleSubmitEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                userId: evaluationData.userId,
                periodoId: evaluationData.periodoId,
                responsableTenantId: evaluationData.responsableTenantId,
                puntajes: evaluationData.puntajes.map((p: any) => ({
                    criterioId: p.criterioId,
                    puntaje: Number(p.puntaje)
                }))
            };

            await evaluationService.createEvaluation(payload);
            toast.success('Evaluación guardada y firmada digitalmente');
            setIsEvaluationModalOpen(false);
            loadUsers();
        } catch (error) {
            toast.error('Error al guardar la evaluación');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async (evalId: string) => {
        try {
            toast.info('Generando documento PDF...');
            const blob = await evaluationService.getEvaluationPdf(evalId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hoja_concepto_${evalId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Error al descargar el PDF');
        }
    };

    const filteredUsers = usersToEvaluate.filter(u =>
        (u.id !== user?.id) && (
            u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.correo || u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const activePeriod = periods.find(p => p.id === selectedPeriod);

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <ClipboardSignature className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            Hoja de <span className="text-primary italic">Concepto</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium ml-1">
                        Evaluación de desempeño y calificación de personal.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {isSuperAdmin && (
                        <div className="flex items-center gap-4 bg-card p-2 rounded-2xl border border-border">
                            <div className="flex items-center gap-2 px-3">
                                <Building2 className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Departamento:</span>
                            </div>
                            <select
                                className="bg-transparent text-sm font-bold outline-none border-none pr-4 min-w-[150px]"
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                            >
                                <option value="">Todos los Departamentos</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-4 bg-card p-2 rounded-2xl border border-border">
                        <div className="flex items-center gap-2 px-3">
                            <CalendarCheck className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Periodo:</span>
                        </div>
                        <select
                            className="bg-transparent text-sm font-bold outline-none border-none pr-4"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                        >
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>{p.periodo} {p.gestion} - S{p.semestre}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Warning if no departamentoId */}
            {!user?.tenantId && !isSuperAdmin && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[24px] flex items-center gap-4 text-rose-500">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <div>
                        <p className="text-sm font-black uppercase tracking-widest">Atención: Falta asignación de Departamento</p>
                        <p className="text-xs font-medium opacity-80">No tienes un departamento asignado en tu perfil. Contacta al administrador para poder realizar evaluaciones.</p>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar personal por nombre o correo..."
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border border-border focus:border-primary transition-all shadow-sm outline-none text-sm font-bold placeholder:text-muted-foreground/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode='popLayout'>
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <Card key={i} className="h-40 animate-pulse bg-muted/20 rounded-[32px] border-border/40" />
                        ))
                    ) : filteredUsers.length === 0 ? (
                        <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                            <div className="flex justify-center"><UserCircle className="w-12 h-12" /></div>
                            <p className="text-sm font-black uppercase tracking-[0.2em]">No hay personal para evaluar en este departamento</p>
                        </div>
                    ) : (
                        filteredUsers.map((u) => (
                            <motion.div
                                key={u.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className={cn(
                                    "group p-6 rounded-[32px] border-border/40 overflow-hidden relative transition-all",
                                    u.evaluacion ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card hover:border-primary/40 shadow-sm"
                                )}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner overflow-hidden",
                                            u.evaluacion ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                                        )}>
                                            {u.imagen ? (
                                                <img src={`${process.env.NEXT_PUBLIC_API_URL}${u.imagen}`} alt={u.nombre} className="w-full h-full object-cover" />
                                            ) : (
                                                u.nombre.charAt(0)
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h3 className="font-black text-sm uppercase truncate">{u.nombre} {u.apellidos}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Building2 className="w-3 h-3 text-muted-foreground" />
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">Asignado a este Departamento</p>
                                            </div>
                                        </div>
                                    </div>

                                    {u.evaluacion ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3 h-3" /> Evaluado
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-70">Puntaje Final</p>
                                                    <p className="text-xl font-black text-emerald-600 leading-none">{u.evaluacion.puntajeTotal}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDownloadPdf(u.evaluacion.id)}
                                                    className="flex-1 h-10 rounded-xl bg-white border border-border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent transition-all"
                                                >
                                                    <Download className="w-4 h-4" /> PDF
                                                </button>
                                                <button
                                                    className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center hover:text-primary transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max">
                                                <Star className="w-3 h-3" /> Pendiente
                                            </div>
                                            <button
                                                onClick={() => handleOpenEvaluation(u)}
                                                className="w-full h-12 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                Evaluar Ahora
                                            </button>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Evaluation Modal */}
            <Modal
                isOpen={isEvaluationModalOpen}
                onClose={() => setIsEvaluationModalOpen(false)}
                title={`Hoja de Concepto - ${selectedUser?.nombre}`}
                size="xl"
            >
                <form onSubmit={handleSubmitEvaluation} className="space-y-8">
                    <div className="bg-primary/5 p-6 rounded-[24px] space-y-2 border border-primary/10">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Instrucciones</p>
                        <p className="text-xs font-medium text-muted-foreground">Califique cada criterio según el desempeño observado en el periodo actual. El sistema generará una firma digital única para este documento.</p>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                        {evaluationData.puntajes.map((p: any, idx: number) => (
                            <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-muted/20 border border-border/50 group hover:border-primary/30 transition-all">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">{p.nombre}</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Puntaje Máximo Permitido: {p.puntajeMaximo} pts</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max={p.puntajeMaximo}
                                        value={p.puntaje}
                                        onChange={(e) => {
                                            const newPuntajes = [...evaluationData.puntajes];
                                            newPuntajes[idx].puntaje = parseInt(e.target.value);
                                            setEvaluationData({ ...evaluationData, puntajes: newPuntajes });
                                        }}
                                        className="w-40 accent-primary"
                                    />
                                    <div className="w-16 h-12 flex items-center justify-center bg-card rounded-xl border border-border font-black text-primary text-lg">
                                        {p.puntaje}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between bg-accent/40 p-6 rounded-[24px] border border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Puntaje Final Acumulado</p>
                                <p className="text-2xl font-black text-foreground">{evaluationData.puntajes.reduce((acc: number, p: any) => acc + (Number(p.puntaje) || 0), 0)} pts</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={() => setIsEvaluationModalOpen(false)} className="px-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardSignature className="w-4 h-4" />}
                                Guardar y Firmar
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
