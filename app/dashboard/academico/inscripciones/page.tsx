'use client';

import { useState, useEffect, useMemo } from 'react';
import { useInscripcions } from '@/features/inscripcion/application/useInscripcions';
import { useOfertas } from '@/features/oferta/application/useOfertas';
import { sedeService } from '@/services/sedeService';
import { programaInscripcionEstadoService } from '@/services/programaConfigService';
import { userService } from '@/services/userService';
import {
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    Edit2,
    Trash2,
    MoreVertical,
    Users,
    ChevronLeft,
    ChevronRight,
    Building2,
    Calendar,
    CheckCircle2,
    XCircle,
    Loader2,
    UserPlus,
    FileDigit,
    ArrowUpRight,
    MapPin,
    Clock,
    DollarSign,
    RefreshCw,
    LayoutGrid,
    BookOpen,
    Info,
    GraduationCap,
    Stamp,
    Printer,
    FileCheck,
    ArrowRightCircle,
    Tag,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { InscripcionPDF } from '@/components/academico/InscripcionPDF';
import { useProfe } from '@/contexts/ProfeContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InscritosModal } from '@/components/academico/InscritosModal';

export default function InscripcionesPage() {
    const { items: inscripciones, loading, loadItems, createItem: createInscripcion, updateItem: updateInscripcion, deleteItem } = useInscripcions();
    const { items: ofertas, loadItems: loadOfertas } = useOfertas();
    const { config: profe } = useProfe();

    const [sedes, setSedes] = useState<any[]>([]);
    const [estadosInscripcion, setEstadosInscripcion] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInscripcion, setEditingInscripcion] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [camposExtra, setCamposExtra] = useState<any[]>([]);
    const [userExtraResponses, setUserExtraResponses] = useState<{ [key: string]: string }>({});
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');

    // Persona Search State
    const [personaSearch, setPersonaSearch] = useState('');
    const [personasFound, setPersonasFound] = useState<any[]>([]);
    const [personaLoading, setPersonaLoading] = useState(false);

    // Filter states
    const [filterSede, setFilterSede] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal view for payments (Eye)
    const [isInscritosModalOpen, setIsInscritosModalOpen] = useState(false);
    const [targetOferta, setTargetOferta] = useState<any>(null);

    const [formData, setFormData] = useState({
        personaId: '',
        programaId: '',
        sedeId: '',
        turnoId: '',
        estadoInscripcionId: '',
        observacion: '',
        licenciatura: '',
        unidadEducativa: '',
        nivel: '',
        subsistema: ''
    });

    useEffect(() => {
        loadItems();
        loadOfertas();
        loadSedes();
        loadEstados();
        loadCamposExtra();
    }, []);

    const loadCamposExtra = async () => {
        try {
            const data = await userService.getCamposExtra();
            setCamposExtra(data);
        } catch (error) {
            console.error('Error loading extra fields');
        }
    };

    const loadSedes = async () => {
        try {
            const data = await sedeService.getAll();
            setSedes(data);
        } catch (error) {
            toast.error('Error al cargar sedes');
        }
    };

    const loadEstados = async () => {
        try {
            const data = await programaInscripcionEstadoService.getAll();
            setEstadosInscripcion(data);
        } catch (error) {
            toast.error('Error al cargar estados');
        }
    };

    // Auto-search personas
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (personaSearch.length >= 3 && !formData.personaId) {
                setPersonaLoading(true);
                try {
                    const data = await userService.getAll(personaSearch);
                    setPersonasFound(data);
                } catch (error) {
                    console.error('Error searching personas');
                } finally {
                    setPersonaLoading(false);
                }
            } else {
                setPersonasFound([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [personaSearch, formData.personaId]);

    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    // Grouping logic for slots (Cupos)
    const groupedStats = useMemo(() => {
        const flatStats: any[] = [];

        ofertas.forEach(o => {
            // Process each turno of the offer as a separate slot
            (o.turnos || []).forEach((t: any) => {
                const count = inscripciones.filter(ins =>
                    ins.programaId === o.id &&
                    ins.turnoId === t.id &&
                    ['INSCRITO', 'CONFIRMADO'].includes(ins.estadoInscripcion?.nombre)
                ).length;

                const cupoReal = t.cupo || 0;
                const percentage = cupoReal > 0 ? Math.min(100, (count / cupoReal) * 100) : 0;
                // Si cupoReal es 0, se considera ilimitado (isFull = false)
                const isFull = cupoReal > 0 && count >= cupoReal;

                flatStats.push({
                    id: `${o.id}-${t.id}`,
                    ofertaId: o.id,
                    nombre: o.nombre,
                    codigo: o.codigo,
                    sede: o.sede?.nombre || 'General',
                    sedeId: o.sedeId,
                    turno: t.turnoConfig?.nombre || 'Único',
                    turnoId: t.id,
                    programaId: o.programaId,
                    version: o.version?.nombre ? `${o.version.nombre} ${o.version.numero}` : '',
                    gestion: o.version?.gestion || '',
                    inscritos: count,
                    cupo: cupoReal,
                    porcentaje: percentage,
                    isFull: isFull
                });
            });
        });

        return flatStats;
    }, [inscripciones, ofertas]);

    const filteredInscripciones = useMemo(() => {
        return inscripciones.filter((ins) => {
            const matchesSearch =
                ins.persona?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ins.persona?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ins.persona?.ci && String(ins.persona?.ci).includes(searchTerm)) ||
                ins.programa?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ins.id?.includes(searchTerm);

            const matchesSede = !filterSede || ins.sedeId === filterSede;
            const matchesEstado = !filterEstado || ins.estadoInscripcionId === filterEstado;

            // Group Filter Logic
            let matchesGroup = true;
            if (selectedGroup) {
                const group = groupedStats.find(g => g.id === selectedGroup);
                if (group) {
                    matchesGroup = (
                        ins.programaId === group.ofertaId &&
                        ins.turnoId === group.turnoId
                    );
                }
            }

            return matchesSearch && matchesSede && matchesEstado && matchesGroup;
        });
    }, [inscripciones, searchTerm, filterSede, filterEstado, selectedGroup, groupedStats]);

    const stats = useMemo(() => {
        const total = inscripciones.length;
        const inscritos = inscripciones.filter(i => i.estadoInscripcion?.nombre === 'INSCRITO').length;
        const preinscritos = total - inscritos;
        const recaudado = inscripciones.reduce((acc, i) => {
            const pagos = (i.baucher || []).reduce((s: number, b: any) => s + (b.confirmado ? Number(b.monto) : 0), 0);
            return acc + pagos;
        }, 0);

        return { total, inscritos, preinscritos, recaudado };
    }, [inscripciones]);

    const uniqueVersions = useMemo(() => {
        const map = new Map();
        ofertas.forEach((o: any) => {
            if (o.version) {
                map.set(o.version.id, {
                    id: o.version.id,
                    nombre: o.version.nombre,
                    numero: o.version.numero,
                    gestion: o.version.gestion,
                    programaNombre: o.nombre,
                    codigo: o.codigo
                });
            }
        });
        return Array.from(map.values());
    }, [ofertas]);

    const handleOpenModal = (inscripcion: any = null) => {
        if (inscripcion) {
            setEditingInscripcion(inscripcion);

            // Lock the selected version if we're editing
            const oferta = ofertas.find((o: any) => o.id === inscripcion.programaId);
            if (oferta && oferta.version) setSelectedVersionId(oferta.version.id);

            setCurrentStep(2); // Jump to academic data when editing
            setPersonaSearch(inscripcion.persona ? `${inscripcion.persona.nombre} ${inscripcion.persona.apellidos}` : '');
            setFormData({
                personaId: inscripcion.personaId || '',
                programaId: inscripcion.programaId || '',
                sedeId: inscripcion.sedeId || '',
                turnoId: inscripcion.turnoId || '',
                estadoInscripcionId: inscripcion.estadoInscripcionId || '',
                observacion: inscripcion.observacion || '',
                licenciatura: inscripcion.licenciatura || '',
                unidadEducativa: inscripcion.unidadEducativa || '',
                nivel: inscripcion.nivel || '',
                subsistema: inscripcion.subsistema || ''
            });

            // Populate extra responses from user
            const responses: { [key: string]: string } = {};
            if (inscripcion.persona?.mod_campos_extra_regs) {
                inscripcion.persona.mod_campos_extra_regs.forEach((reg: any) => {
                    responses[reg.campoExtraId] = reg.valor;
                });
            }
            setUserExtraResponses(responses);
        } else {
            setEditingInscripcion(null);
            setCurrentStep(1); // Start with person search for new
            setPersonaSearch('');
            setSelectedVersionId('');
            setUserExtraResponses({});
            setFormData({
                personaId: '',
                programaId: '',
                sedeId: '',
                turnoId: '',
                estadoInscripcionId: '',
                observacion: '',
                licenciatura: '',
                unidadEducativa: '',
                nivel: '',
                subsistema: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation for new record flow
        if (currentStep === 1 && !editingInscripcion) {
            if (!formData.personaId) {
                toast.warning('Debe seleccionar a una persona');
                return;
            }
            setCurrentStep(2);
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Update user extra fields first
            if (formData.personaId && Object.keys(userExtraResponses).length > 0) {
                await userService.update(formData.personaId, {
                    mod_campos_extra_regs: userExtraResponses as any
                });
            }

            // 2. Process inscription
            const payload = { ...formData };
            if (editingInscripcion) {
                const success = await updateInscripcion(editingInscripcion.id, payload);
                if (success) setIsModalOpen(false);
            } else {
                const success = await createInscripcion(payload);
                if (success) setIsModalOpen(false);
            }
        } catch (error) {
            toast.error('Error al procesar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este registro? Esta acción no se puede deshacer.')) {
            await deleteItem(id);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header with Glassmorphism Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">
                        Control de <span className="text-primary">Matriculación</span>
                    </h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Gestión académica y financiera de participantes</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "p-3 rounded-2xl border transition-all shadow-sm",
                            showFilters ? "bg-primary text-white border-primary" : "bg-card border-border hover:border-primary/50 text-muted-foreground"
                        )}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                    >
                        <UserPlus className="w-5 h-5" />
                        Inscribir Nuevo
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Registros', val: stats.total, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { label: 'Confirmados', val: stats.inscritos, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Pendientes', val: stats.preinscritos, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Recaudación Total', val: `Bs. ${stats.recaudado.toLocaleString()}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
                ].map((s, i) => (
                    <Card key={i} className="p-6 border-border/40 hover:border-primary/20 transition-all group overflow-hidden relative">
                        <div className={cn("absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-5 blur-2xl", s.color.replace('text', 'bg'))} />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", s.bg)}>
                                <s.icon className={cn("w-7 h-7", s.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
                                <p className="text-2xl font-black tracking-tight">{s.val}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* DYNAMIC CUPOS & GROUPS PANEL */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-500/10 rounded-lg">
                        <ArrowRightCircle className="w-4 h-4 text-orange-500" />
                    </div>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground text-primary italic">Control de Ocupación (SEDE / PROGRAMA-VERSIÓN / TURNO)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groupedStats.map((group) => (
                        <Card
                            key={group.id}
                            onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                            className={cn(
                                "p-4 border-border/40 cursor-pointer bg-card/50 backdrop-blur-xl relative overflow-hidden group transition-all",
                                group.isFull ? "border-rose-500/30 bg-rose-500/[0.02]" : "hover:border-primary/30",
                                selectedGroup === group.id ? "ring-2 ring-primary border-primary bg-primary/5 shadow-xl shadow-primary/10" : "scale-[0.98] opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:scale-100"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4 text-primary">
                                <div className="space-y-2 max-w-[75%] relative">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex -space-x-1">
                                            <span className="z-10 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-[9px] font-black border-2 border-card">{group.sede.charAt(0)}</span>
                                            {group.version && (
                                                <div className="z-20 inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-2 border-card shadow-md overflow-hidden h-6 transition-transform hover:scale-105 cursor-default">
                                                    <span className="px-2.5 text-[10px] font-black tracking-widest uppercase">
                                                        {group.version}
                                                    </span>
                                                    {group.gestion && (
                                                        <span className="px-2 py-0.5 bg-black/20 text-[8px] font-bold tracking-widest italic border-l border-white/20 h-full flex items-center">
                                                            {group.gestion}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-2 border-l-2 border-border/50">{group.codigo}</span>
                                    </div>
                                    <h3 className="text-[12px] font-black uppercase tracking-tight text-foreground leading-tight line-clamp-2">
                                        {group.nombre}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase mt-2 bg-muted/30 px-2 py-1 rounded-md inline-flex">
                                        <MapPin className="w-3 h-3 text-primary" /> {group.sede}
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <Clock className="w-3 h-3 text-indigo-500" /> {group.turno}
                                    </div>
                                </div>
                                <div className={cn(
                                    "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest",
                                    group.cupo === 0 ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" :
                                        group.isFull ? "bg-rose-500 text-white" : "bg-primary/10 text-primary border border-primary/20"
                                )}>
                                    {group.cupo === 0 ? 'Ilimitado' : group.isFull ? 'Lleno' : 'Disponible'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black">
                                    <span className="text-muted-foreground uppercase tracking-widest text-[8px]">Ocupación Actual</span>
                                    <span className={cn(group.porcentaje > 90 ? "text-rose-500" : "text-foreground")}>
                                        {group.inscritos} / {group.cupo > 0 ? group.cupo : '∞'}
                                    </span>
                                </div>
                                <div className="h-2.5 bg-muted rounded-full overflow-hidden p-0.5 border border-border/20">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: group.cupo > 0 ? `${group.porcentaje}%` : '10%' }}
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            group.cupo === 0 ? "bg-indigo-300 opacity-60" :
                                                group.porcentaje > 90 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" :
                                                    group.porcentaje > 60 ? "bg-orange-500" : "bg-emerald-500"
                                        )}
                                    />
                                </div>
                                {group.cupo === 0 && (
                                    <p className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Capacidad ilimitada</p>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Inscriptions Table Card */}
            <Card className="border-border/40 overflow-hidden shadow-2xl shadow-indigo-500/5">
                <div className="p-8 border-b border-border/40 bg-white/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between gap-6">
                    <div className="relative flex-1 max-w-xl group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por Doc., Nombre o Programa..."
                            className="w-full h-14 pl-14 pr-6 rounded-2xl bg-muted/30 border border-border/50 focus:border-primary outline-none text-sm font-bold transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {showFilters && (
                        <div className="flex gap-4 animate-in slide-in-from-right-4 duration-300">
                            <select
                                className="h-14 px-6 rounded-2xl bg-muted/30 border border-border/50 outline-none text-[11px] font-black uppercase tracking-widest"
                                value={filterSede}
                                onChange={(e) => setFilterSede(e.target.value)}
                            >
                                <option value="">Todas las Sedes</option>
                                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                            <select
                                className="h-14 px-6 rounded-2xl bg-muted/30 border border-border/50 outline-none text-[11px] font-black uppercase tracking-widest"
                                value={filterEstado}
                                onChange={(e) => setFilterEstado(e.target.value)}
                            >
                                <option value="">Todos los Estados</option>
                                {estadosInscripcion.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30">
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Expediente / Participante</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap text-center">Inscrito en</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap text-center">Estado Académico</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap text-right">Balance Económico</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap text-right">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="p-10 h-24 bg-muted/10" />
                                    </tr>
                                ))
                            ) : filteredInscripciones.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-30 gap-4">
                                            <Search className="w-16 h-16" />
                                            <p className="text-sm font-black uppercase tracking-[0.3em]">No se encontraron resultados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInscripciones.map((ins) => (
                                    <tr key={ins.id} className="hover:bg-primary/[0.02] transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shadow-sm">
                                                    {ins.persona?.nombre?.[0]}{ins.persona?.apellidos?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-black uppercase tracking-tight text-foreground leading-none mb-1">{ins.persona?.nombre} {ins.persona?.apellidos}</p>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                        <span>CI: {ins.persona?.ci}</span>
                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                        <span className="text-primary/60">ID: {ins.id?.substring(0, 8)}</span>
                                                    </div>
                                                    {ins.persona?.mod_campos_extra_regs?.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {ins.persona.mod_campos_extra_regs.map((reg: any) => (
                                                                <span key={reg.id} className="px-2 py-1 rounded-lg bg-primary/5 dark:bg-primary/10 text-[9px] font-black text-primary uppercase border border-primary/10 shadow-sm flex items-center gap-1">
                                                                    <Tag className="w-2.5 h-2.5 opacity-50" />
                                                                    {reg.campoExtra?.label}: <span className="text-foreground">{reg.valor}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col items-center text-center">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span className="text-[10px] font-black uppercase text-foreground">{ins.programa?.nombre || 'General'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    <MapPin className="w-3 h-3" /> {ins.sede?.nombre || 'General'}
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <Clock className="w-3 h-3" /> {ins.turno?.turnoConfig?.nombre || 'Turno Único'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm",
                                                ins.estadoInscripcion?.nombre === 'INSCRITO' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                    ins.estadoInscripcion?.nombre === 'PREINSCRITO' ? "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-amber-500/5 shadow-inner" :
                                                        "bg-muted text-muted-foreground border-border"
                                            )}>
                                                {ins.estadoInscripcion?.nombre || 'PROCESANDO'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col items-end gap-1.5">
                                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px]">
                                                    <div
                                                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                        style={{ width: `${Math.min(100, ((ins.baucher || []).reduce((acc: number, b: any) => acc + (b.confirmado ? Number(b.monto) : 0), 0) / (ins.programa?.costo || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-foreground">Bs. {(ins.baucher || []).reduce((acc: number, b: any) => acc + (b.confirmado ? Number(b.monto) : 0), 0)}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground italic">/ Bs. {ins.programa?.costo || 0}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-end gap-2.5">
                                                <button
                                                    onClick={() => {
                                                        setTargetOferta(ins.programa);
                                                        setIsInscritosModalOpen(true);
                                                    }}
                                                    className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-800 hover:text-white dark:bg-slate-800 dark:hover:bg-indigo-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm"
                                                    title="Expediente y Pagos"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(ins)}
                                                    className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title="Modificar Matrícula"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <PDFDownloadLink
                                                    document={<InscripcionPDF inscripcion={ins} profe={profe} />}
                                                    fileName={`Inscripcion_${ins.persona?.nroDocumento || ins.id}.pdf`}
                                                    className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    {({ loading }) => (loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />)}
                                                </PDFDownloadLink>
                                                <button
                                                    onClick={() => confirmDelete(ins.id)}
                                                    className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Inscription Processing Modal (Premium Wizard) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={undefined}
                size="2xl"
            >
                <form onSubmit={handleSubmit} className="flex flex-col min-h-[500px] overflow-hidden bg-slate-50 dark:bg-slate-950">
                    {/* Modal Head */}
                    <div className="p-8 bg-white dark:bg-slate-900 border-b border-border/40">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20">
                                    <Stamp className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                                        {editingInscripcion ? 'Actualizar' : 'Nueva'} <span className="text-primary">Inscripción</span>
                                    </h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sistema de Matriculación Profe</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", currentStep >= 1 ? "bg-primary shadow-[0_0_10px_rgba(var(--theme-primary),0.5)]" : "bg-muted")} />
                                <div className={cn("w-12 h-1 rounded-full", currentStep >= 2 ? "bg-primary" : "bg-muted")} />
                                <div className={cn("w-3 h-3 rounded-full", currentStep >= 2 ? "bg-primary" : "bg-muted")} />
                            </div>
                        </div>

                        {/* Informative Alert */}
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4">
                            <Info className="w-5 h-5 text-primary shrink-0" />
                            <p className="text-[10px] font-bold text-primary/80 uppercase leading-relaxed tracking-wide">
                                Asegúrese de que los datos biométricos y de contacto sean correctos. La matrícula genera un compromiso institucional automático.
                            </p>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-8"
                                >
                                    {/* Persona Search Component */}
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-2 block">Identificación del Participante</label>
                                            <div className="relative group">
                                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="CI, Nombre o Apellidos..."
                                                    className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-primary outline-none text-sm font-bold shadow-sm"
                                                    value={personaSearch}
                                                    onChange={(e) => {
                                                        setPersonaSearch(e.target.value);
                                                        setFormData({ ...formData, personaId: '' });
                                                    }}
                                                    required
                                                />
                                                {personaLoading && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />}
                                            </div>

                                            {/* Results Dropdown */}
                                            {personasFound.length > 0 && (
                                                <div className="absolute z-[100] top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-72 overflow-y-auto p-3 space-y-1">
                                                    {personasFound.map((p: any) => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => {
                                                                setFormData({ ...formData, personaId: p.id });
                                                                setPersonaSearch(`${p.nombre} ${p.apellidos}`);
                                                                setPersonasFound([]);
                                                            }}
                                                            className="p-5 hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer rounded-2xl flex justify-between items-center group transition-all"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[10px]">
                                                                    {p.nombre?.[0]}{p.apellidos?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[12px] font-black uppercase text-foreground group-hover:text-primary">{p.nombre} {p.apellidos}</p>
                                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{p.nroDocumento} | {p.celular}</p>
                                                                </div>
                                                            </div>
                                                            <ArrowUpRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {formData.personaId && (
                                            <div className="p-5 rounded-3xl bg-primary text-primary-foreground flex items-center justify-between shadow-xl shadow-primary/20">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                                        <CheckCircle2 className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-widest">Participante Vinculado</p>
                                                        <p className="text-[10px] font-bold text-primary-foreground/80 uppercase">CI: {personaSearch.split('|')[0]}</p>
                                                    </div>
                                                </div>
                                                {!editingInscripcion && (
                                                    <button type="button" onClick={() => { setFormData({ ...formData, personaId: '' }); setPersonaSearch(''); }} className="px-4 py-2 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20">Cambiar</button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Dynamic Extra Fields */}
                                    {camposExtra.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2.5rem] bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                            <div className="col-span-full">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 italic">Información Complementaria del Usuario</h4>
                                            </div>
                                            {camposExtra.map((field) => (
                                                <div key={field.id} className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-2 block">
                                                        {field.label} {field.esObligatorio && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    {(() => {
                                                        const fieldType = field.tipo?.toString().toLowerCase().trim() || 'text';
                                                        let options: string[] = [];
                                                        if (Array.isArray(field.opciones)) {
                                                            options = field.opciones;
                                                        } else if (typeof field.opciones === 'string') {
                                                            try {
                                                                options = field.opciones.startsWith('[') ? JSON.parse(field.opciones) : field.opciones.split(',').map((s: string) => s.trim());
                                                            } catch (e) { }
                                                        }

                                                        if (['seleccion_unica', 'seleccion unica', 'select', 'single_select'].includes(fieldType)) {
                                                            return (
                                                                <div className="relative">
                                                                    <select
                                                                        className="w-full h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold transition-all shadow-sm appearance-none cursor-pointer"
                                                                        value={userExtraResponses[field.id] || ''}
                                                                        onChange={(e) => setUserExtraResponses({ ...userExtraResponses, [field.id]: e.target.value })}
                                                                        required={field.esObligatorio}
                                                                    >
                                                                        <option value="" disabled>Seleccione una opción...</option>
                                                                        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                                    </select>
                                                                    <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        if (['seleccion_multiple', 'seleccion multiple', 'checkbox', 'multiple_select'].includes(fieldType)) {
                                                            return (
                                                                <div className="flex flex-col gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                                                    {options.map((opt: string) => {
                                                                        const isChecked = (userExtraResponses[field.id] || '').split(',').includes(opt);
                                                                        return (
                                                                            <label key={opt} className="flex items-center gap-3 text-xs font-bold cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 -m-1.5 rounded-lg transition-colors">
                                                                                <div className={cn("w-5 h-5 rounded flex items-center justify-center border-2 transition-colors", isChecked ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 group-hover:border-primary/50")}>
                                                                                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                                                </div>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="hidden"
                                                                                    checked={isChecked}
                                                                                    onChange={(e) => {
                                                                                        const current = (userExtraResponses[field.id] || '').split(',').filter(Boolean);
                                                                                        if (e.target.checked) {
                                                                                            setUserExtraResponses({ ...userExtraResponses, [field.id]: [...current, opt].join(',') });
                                                                                        } else {
                                                                                            setUserExtraResponses({ ...userExtraResponses, [field.id]: current.filter(c => c !== opt).join(',') });
                                                                                        }
                                                                                    }}
                                                                                />
                                                                                <span className={cn(isChecked ? "text-primary transition-colors" : "text-foreground")}>{opt}</span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <input
                                                                className="w-full h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-bold transition-all shadow-sm"
                                                                type={['number', 'numero'].includes(fieldType) ? 'number' : ['date', 'fecha'].includes(fieldType) ? 'date' : 'text'}
                                                                value={userExtraResponses[field.id] || ''}
                                                                onChange={(e) => setUserExtraResponses({ ...userExtraResponses, [field.id]: e.target.value })}
                                                                placeholder={`Ingrese ${field.label.toLowerCase()}...`}
                                                                required={field.esObligatorio}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 space-y-6">
                                        <div className="flex items-center gap-4 text-primary">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Asignación de Oferta y Turno</h4>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            {/* PROGRAM/VERSION SELECTION */}
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center justify-between">
                                                    <span>1. Programa y Versión Académica</span>
                                                </label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                                    {uniqueVersions
                                                        .filter(v => editingInscripcion ? v.id === selectedVersionId : true)
                                                        .map(v => {
                                                            const isSelected = selectedVersionId === v.id;
                                                            return (
                                                                <div
                                                                    key={v.id}
                                                                    onClick={() => {
                                                                        if (!editingInscripcion) {
                                                                            setSelectedVersionId(v.id);
                                                                            setFormData({ ...formData, sedeId: '', programaId: '', turnoId: '' });
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all flex flex-col justify-between group",
                                                                        isSelected
                                                                            ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-[1.02]"
                                                                            : editingInscripcion
                                                                                ? "hidden"
                                                                                : "border-transparent bg-white dark:bg-slate-900 shadow-sm hover:border-primary/50 hover:shadow-md"
                                                                    )}
                                                                >
                                                                    <div className="flex items-start justify-between mb-4">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="z-20 inline-flex items-center justify-center h-6 px-3 rounded-full bg-primary text-primary-foreground text-[10px] font-black tracking-widest shadow-md uppercase">
                                                                                {v.nombre} {v.numero}
                                                                            </span>
                                                                            {v.gestion && (
                                                                                <span className="z-10 inline-flex items-center h-6 px-2 pl-4 rounded-r-full bg-slate-200 dark:bg-slate-800 text-[9px] font-black tracking-widest text-slate-500 border border-slate-300 dark:border-slate-700 border-l-0 -ml-2">
                                                                                    {v.gestion}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all shadow-sm", isSelected ? "border-primary bg-primary" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800")}>
                                                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h5 className={cn("text-[11px] font-black uppercase tracking-tight leading-loose line-clamp-2", isSelected ? "text-primary dark:text-primary" : "text-foreground group-hover:text-primary transition-colors")}>
                                                                            {v.programaNombre}
                                                                        </h5>
                                                                        <div className="flex items-center gap-2 mt-3">
                                                                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-400">
                                                                                {v.codigo}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>

                                            {/* SEDE SELECTION */}
                                            {selectedVersionId && (
                                                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center justify-between">
                                                        <span>2. Sede / Modalidad Disponible</span>
                                                    </label>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {ofertas
                                                            .filter((o: any) => o.version?.id === selectedVersionId)
                                                            .map((o: any) => {
                                                                const isSelected = formData.programaId === o.id;
                                                                return (
                                                                    <div
                                                                        key={o.id}
                                                                        onClick={() => {
                                                                            let newTurnoId = o?.turnos?.[0]?.id || '';
                                                                            if (formData.turnoId && formData.programaId) {
                                                                                const oldOferta = ofertas.find((old: any) => old.id === formData.programaId);
                                                                                const oldTurno = oldOferta?.turnos?.find((t: any) => t.id === formData.turnoId);
                                                                                if (oldTurno) {
                                                                                    const matchingTurno = o?.turnos?.find((t: any) => t.turnoConfig?.nombre === oldTurno.turnoConfig?.nombre);
                                                                                    if (matchingTurno) newTurnoId = matchingTurno.id;
                                                                                }
                                                                            }
                                                                            setFormData({ ...formData, programaId: o.id, sedeId: o.sedeId, turnoId: newTurnoId });
                                                                        }}
                                                                        className={cn(
                                                                            "p-4 rounded-[1rem] border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group text-center",
                                                                            isSelected
                                                                                ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                                                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-primary/50 text-foreground"
                                                                        )}
                                                                    >
                                                                        <span className="text-[10px] font-black uppercase tracking-widest line-clamp-2">
                                                                            {o.sede?.nombre || 'General'}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* TURNO SELECTION */}
                                            {formData.programaId && (
                                                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">3. Horario / Turno Asignado</label>
                                                    <select
                                                        className="w-full h-14 px-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-primary outline-none text-xs font-black uppercase shadow-sm appearance-none cursor-pointer"
                                                        value={formData.turnoId}
                                                        onChange={(e) => setFormData({ ...formData, turnoId: e.target.value })}
                                                        required
                                                    >
                                                        <option value="">Seleccionar Turno</option>
                                                        {ofertas.find(o => o.id === formData.programaId)?.turnos?.map((t: any) => (
                                                            <option key={t.id} value={t.id}>{t.turnoConfig?.nombre || 'General'}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 block">Estado del Registro Académico</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {estadosInscripcion.map((est: any) => (
                                                <button
                                                    key={est.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, estadoInscripcionId: est.id })}
                                                    className={cn(
                                                        "p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all",
                                                        formData.estadoInscripcionId === est.id
                                                            ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20"
                                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50"
                                                    )}
                                                >
                                                    {est.nombre}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-8 bg-white dark:bg-slate-900 border-t border-border/40 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => currentStep > 1 ? setCurrentStep(1) : setIsModalOpen(false)}
                            className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all flex items-center gap-2"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            {currentStep === 1 ? 'Cancelar' : 'Regresar'}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.personaId || (currentStep === 2 && !formData.programaId)}
                            className="h-16 px-12 rounded-3xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:bg-slate-800 transition-all flex items-center gap-4 group disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <span>{currentStep === 1 && !editingInscripcion ? 'Ingresar Datos Académicos' : editingInscripcion ? 'Guardar Cambios' : 'Confirmar Matrícula'}</span>
                                    <ArrowRightCircle className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Inscritos Modal (Reused for Detail View) */}
            <InscritosModal
                isOpen={isInscritosModalOpen}
                onClose={() => setIsInscritosModalOpen(false)}
                oferta={targetOferta}
            />
        </div>
    );
}
