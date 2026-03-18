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
    ArrowRightCircle
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
    }, []);

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

    const filteredInscripciones = useMemo(() => {
        return inscripciones.filter((ins) => {
            const matchesSearch =
                ins.persona?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ins.persona?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ins.persona?.nroDocumento?.includes(searchTerm) ||
                ins.programa?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ins.id?.includes(searchTerm);

            const matchesSede = !filterSede || ins.sedeId === filterSede;
            const matchesEstado = !filterEstado || ins.estadoInscripcionId === filterEstado;

            return matchesSearch && matchesSede && matchesEstado;
        });
    }, [inscripciones, searchTerm, filterSede, filterEstado]);

    const summary = useMemo(() => {
        const total = inscripciones.length;
        const inscritos = inscripciones.filter(i => i.estadoInscripcion?.nombre === 'INSCRITO').length;
        const preinscritos = total - inscritos;
        const recaudado = inscripciones.reduce((acc, i) => {
            const pagos = (i.baucher || []).reduce((s: number, b: any) => s + (b.confirmado ? Number(b.monto) : 0), 0);
            return acc + pagos;
        }, 0);

        return { total, inscritos, preinscritos, recaudado };
    }, [inscripciones]);

    const handleOpenModal = (inscripcion: any = null) => {
        if (inscripcion) {
            setEditingInscripcion(inscripcion);
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
        } else {
            setEditingInscripcion(null);
            setCurrentStep(1); // Start with person search for new
            setPersonaSearch('');
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
            const payload = { ...formData };
            if (editingInscripcion) {
                const success = await updateInscripcion(editingInscripcion.id, payload);
                if (success) setIsModalOpen(false);
            } else {
                const success = await createInscripcion(payload);
                if (success) setIsModalOpen(false);
            }
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
                    { label: 'Total Registros', val: summary.total, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { label: 'Confirmados', val: summary.inscritos, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Pendientes', val: summary.preinscritos, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Recaudación Total', val: `Bs. ${summary.recaudado.toLocaleString()}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
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
                                                        <span>CI: {ins.persona?.nroDocumento}</span>
                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                        <span className="text-primary/60">ID: {ins.id?.substring(0, 8)}</span>
                                                    </div>
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
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                    <Stamp className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                                        {editingInscripcion ? 'Actualizar' : 'Nueva'} <span className="text-indigo-600">Inscripción</span>
                                    </h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sistema de Matriculación Profe</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", currentStep >= 1 ? "bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-muted")} />
                                <div className={cn("w-12 h-1 rounded-full", currentStep >= 2 ? "bg-indigo-600" : "bg-muted")} />
                                <div className={cn("w-3 h-3 rounded-full", currentStep >= 2 ? "bg-indigo-600" : "bg-muted")} />
                            </div>
                        </div>

                        {/* Informative Alert */}
                        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex gap-4">
                            <Info className="w-5 h-5 text-indigo-500 shrink-0" />
                            <p className="text-[10px] font-bold text-indigo-600/80 uppercase leading-relaxed tracking-wide">
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
                                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="CI, Nombre o Apellidos..."
                                                    className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 outline-none text-sm font-bold shadow-sm"
                                                    value={personaSearch}
                                                    onChange={(e) => {
                                                        setPersonaSearch(e.target.value);
                                                        setFormData({ ...formData, personaId: '' });
                                                    }}
                                                    required
                                                />
                                                {personaLoading && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />}
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
                                                            className="p-5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer rounded-2xl flex justify-between items-center group transition-all"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[10px]">
                                                                    {p.nombre?.[0]}{p.apellidos?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[12px] font-black uppercase text-foreground group-hover:text-indigo-600">{p.nombre} {p.apellidos}</p>
                                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{p.nroDocumento} | {p.celular}</p>
                                                                </div>
                                                            </div>
                                                            <ArrowUpRight className="w-5 h-5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {formData.personaId && (
                                            <div className="p-5 rounded-3xl bg-indigo-600 text-white flex items-center justify-between shadow-xl shadow-indigo-600/20">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                                        <CheckCircle2 className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-widest">Participante Vinculado</p>
                                                        <p className="text-[10px] font-bold text-white/70 uppercase">CI: {personaSearch.split('|')[0]}</p>
                                                    </div>
                                                </div>
                                                {!editingInscripcion && (
                                                    <button type="button" onClick={() => { setFormData({ ...formData, personaId: '' }); setPersonaSearch(''); }} className="px-4 py-2 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20">Cambiar</button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-2 block">Especialidad</label>
                                            <input className="w-full h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-indigo-600 outline-none text-xs font-bold transition-all" value={formData.licenciatura} onChange={(e) => setFormData({ ...formData, licenciatura: e.target.value })} placeholder="Ej. Primaria" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-2 block">Unidad Educativa</label>
                                            <input className="w-full h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-indigo-600 outline-none text-xs font-bold transition-all" value={formData.unidadEducativa} onChange={(e) => setFormData({ ...formData, unidadEducativa: e.target.value })} placeholder="Nombre de la UE" />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-600/10 space-y-6">
                                        <div className="flex items-center gap-4 text-indigo-600">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Asignación de Oferta y Turno</h4>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Programa / Convocatoria Disponible</label>
                                            <select
                                                className="w-full h-16 px-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 outline-none text-xs font-black uppercase shadow-sm appearance-none"
                                                value={formData.programaId}
                                                onChange={(e) => {
                                                    const o = ofertas.find(off => off.id === e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        programaId: e.target.value,
                                                        sedeId: o?.sedeId || '',
                                                        turnoId: o?.turnos?.[0]?.id || ''
                                                    });
                                                }}
                                                required
                                            >
                                                <option value="">Seleccione Convocatoria...</option>
                                                {ofertas.map((o: any) => (
                                                    <option key={o.id} value={o.id}>{o.nombre} ({o.codigo})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Modalidad / Sede</label>
                                                <div className="h-14 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-3 text-xs font-black text-slate-500 uppercase">
                                                    <MapPin className="w-4 h-4" />
                                                    {sedes.find(s => s.id === formData.sedeId)?.nombre || 'Vínculo Automático'}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Horario / Turno</label>
                                                <select
                                                    className="w-full h-14 px-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 outline-none text-xs font-black uppercase shadow-sm"
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
                                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20"
                                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400"
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
                            className="h-16 px-12 rounded-3xl bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 hover:bg-slate-800 transition-all flex items-center gap-4 group disabled:opacity-50"
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
