'use client';

import { useState, useEffect } from 'react';
import { evaluationService, EvaluationPeriod } from '@/services/evaluationService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    CalendarDays,
    Plus,
    Search,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Save,
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Loader2,
    Layers,
    ListTodo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function PeriodosEvaluacionPage() {
    const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        gestion: new Date().getFullYear().toString(),
        semestre: 'I',
        periodo: 'ANUAL',
        criterios: [
            { nombre: 'Puntualidad y Asistencia', puntajeMaximo: 20, orden: 1 },
            { nombre: 'Desempeño Académico', puntajeMaximo: 30, orden: 2 },
            { nombre: 'Cumplimiento de Objetivos', puntajeMaximo: 30, orden: 3 },
            { nombre: 'Innovación y Mejora', puntajeMaximo: 20, orden: 4 }
        ]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await evaluationService.getPeriods();
            setPeriods(data);
        } catch (error) {
            console.error('Error loading periods:', error);
            toast.error('Error al cargar los periodos de evaluación');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePeriod = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await evaluationService.createPeriod(formData);
            toast.success('Periodo de evaluación creado correctamente');
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            toast.error('Error al crear el periodo');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePeriod = async (id: string, currentActive: boolean) => {
        try {
            await evaluationService.togglePeriod(id, !currentActive);
            toast.success(`Periodo ${!currentActive ? 'activado' : 'desactivado'}`);
            loadData();
        } catch (error) {
            toast.error('No se pudo cambiar el estado del periodo');
        }
    };

    const addCriterio = () => {
        setFormData({
            ...formData,
            criterios: [...formData.criterios, { nombre: '', puntajeMaximo: 0, orden: formData.criterios.length + 1 }]
        });
    };

    const updateCriterio = (index: number, field: string, value: any) => {
        const newCriterios = [...formData.criterios];
        newCriterios[index] = { ...newCriterios[index], [field]: value };
        setFormData({ ...formData, criterios: newCriterios });
    };

    const removeCriterio = (index: number) => {
        setFormData({
            ...formData,
            criterios: formData.criterios.filter((_, i) => i !== index)
        });
    };

    const filteredPeriods = periods.filter(p =>
        p.gestion.includes(searchTerm) ||
        p.periodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.semestre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <CalendarDays className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            Periodos de <span className="text-primary italic">Evaluación</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium ml-1">
                        Configura los tiempos y criterios para la evaluación de desempeño.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Periodo
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar periodos por gestión, semestre o nombre..."
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border border-border focus:border-primary transition-all shadow-sm outline-none text-sm font-bold placeholder:text-muted-foreground/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode='popLayout'>
                    {loading && periods.length === 0 ? (
                        Array(4).fill(0).map((_, i) => (
                            <Card key={i} className="h-64 animate-pulse bg-muted/20 rounded-[32px] border-border/40" />
                        ))
                    ) : filteredPeriods.length === 0 ? (
                        <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                            <div className="flex justify-center"><Search className="w-12 h-12" /></div>
                            <p className="text-sm font-black uppercase tracking-[0.2em]">No se encontraron periodos de evaluación</p>
                        </div>
                    ) : (
                        filteredPeriods.map((period) => (
                            <motion.div
                                key={period.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="group relative border-border/40 overflow-hidden bg-card hover:border-primary/40 transition-all p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-primary/5">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3.5 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                            <ClipboardCheck className="w-6 h-6" />
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5",
                                            period.activo ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                        )}>
                                            {period.activo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {period.activo ? 'ACTIVO' : 'INACTIVO'}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black tracking-tight text-foreground uppercase">
                                                {period.periodo} {period.gestion}
                                            </h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                Semestre {period.semestre}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[10px] bg-muted px-2 py-1 rounded-lg font-bold text-muted-foreground">
                                                {period.criterios?.length || 0} Criterios
                                            </span>
                                            <span className="text-[10px] bg-muted px-2 py-1 rounded-lg font-bold text-muted-foreground">
                                                Max: {period.criterios?.reduce((acc, c) => acc + (c.puntajeMaximo || 0), 0)} pts
                                            </span>
                                        </div>

                                        <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                                            <button
                                                onClick={() => handleTogglePeriod(period.id, period.activo)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    period.activo ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                                )}
                                            >
                                                {period.activo ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                                                {period.activo ? 'Desactivar' : 'Activar'}
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Configurar Nuevo Periodo"
                size="lg"
            >
                <form onSubmit={handleCreatePeriod} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Gestión</label>
                            <input
                                type="text"
                                required
                                className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-sm font-bold"
                                value={formData.gestion}
                                onChange={(e) => setFormData({ ...formData, gestion: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Semestre</label>
                            <select
                                className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-sm font-bold"
                                value={formData.semestre}
                                onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                            >
                                <option value="I">I</option>
                                <option value="II">II</option>
                                <option value="III">III</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tipo Periodo</label>
                            <select
                                className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border focus:border-primary transition-all outline-none text-sm font-bold"
                                value={formData.periodo}
                                onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                            >
                                <option value="MENSUAL">MENSUAL</option>
                                <option value="TRIMESTRAL">TRIMESTRAL</option>
                                <option value="SEMESTRAL">SEMESTRAL</option>
                                <option value="ANUAL">ANUAL</option>
                                <option value="OTRO">OTRO</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <ListTodo className="w-4 h-4 text-primary" />
                                Criterios de Evaluación
                            </h3>
                            <button
                                type="button"
                                onClick={addCriterio}
                                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                            >
                                + Añadir Criterio
                            </button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-primary/20">
                            {formData.criterios.map((crit, idx) => (
                                <div key={idx} className="flex gap-3 items-end bg-muted/20 p-4 rounded-2xl relative group">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full h-10 px-3 rounded-lg bg-background border border-border text-xs font-bold"
                                            value={crit.nombre}
                                            onChange={(e) => updateCriterio(idx, 'nombre', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-24 space-y-1.5">
                                        <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">pts máx</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full h-10 px-3 rounded-lg bg-background border border-border text-xs font-bold"
                                            value={crit.puntajeMaximo}
                                            onChange={(e) => updateCriterio(idx, 'puntajeMaximo', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeCriterio(idx)}
                                        className="h-10 w-10 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border/10">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-12 px-10 rounded-xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Crear Periodo
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
