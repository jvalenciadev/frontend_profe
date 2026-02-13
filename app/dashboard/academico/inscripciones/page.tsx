'use client';

import { useState, useEffect } from 'react';
import { inscripcionService } from '@/services/inscripcionService';
import { programaVersionService } from '@/services/programaVersionService';
import { sedeService } from '@/services/sedeService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    FileText,
    Plus,
    Search,
    Edit2,
    Trash2,
    User,
    Mail,
    Phone,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Activity,
    ClipboardCheck,
    GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function InscripcionesPage() {
    const [inscripciones, setInscripciones] = useState<any[]>([]);
    const [ofertas, setOfertas] = useState<any[]>([]);
    const [sedes, setSedes] = useState<any[]>([]);
    const [estados, setEstados] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInscripcion, setEditingInscripcion] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        personaId: '',
        programaId: '', // ProgramaDos ID
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
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [data, ofertasData, sedesData, estadosData] = await Promise.all([
                inscripcionService.getAll(),
                programaVersionService.getAll(),
                sedeService.getAll(),
                inscripcionService.getEstados()
            ]);
            setInscripciones(data);
            setOfertas(ofertasData);
            setSedes(sedesData);
            setEstados(estadosData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al sincronizar registros de inscripción');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (inscripcion: any = null) => {
        if (inscripcion) {
            setEditingInscripcion(inscripcion);
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
            setFormData({
                personaId: '',
                programaId: '',
                sedeId: '',
                turnoId: '',
                estadoInscripcionId: estados[0]?.id || '',
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
        try {
            setIsLoading(true);
            if (editingInscripcion) {
                await inscripcionService.update(editingInscripcion.id, formData);
                toast.success('Registro de inscripción actualizado');
            } else {
                await inscripcionService.create(formData);
                toast.success('Nueva inscripción registrada correctamente');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al procesar el registro');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro de anular esta inscripción?')) return;
        try {
            await inscripcionService.delete(id);
            toast.success('Registro anulado');
            loadData();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al anular el registro');
        }
    };

    const filtered = inscripciones.filter(i =>
        i.personaId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.programa?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">
                        <ClipboardCheck className="w-3 h-3" />
                        <span>Área de Control Académico</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Libro de <span className="text-primary">Inscripciones</span></h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-md">
                        Gestión centralizada de participantes, estados de matrícula y asignación de programas operativos.
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={loadData}
                        className="p-4 rounded-2xl bg-muted/50 text-muted-foreground hover:text-primary transition-all border border-border/50"
                    >
                        <Activity className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                        Registrar Inscripción
                    </button>
                </div>
            </div>

            {/* Search */}
            <Card className="p-4 border-border/40 bg-card/30 backdrop-blur-md">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por participante o programa..."
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[13px] font-bold text-foreground"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            {/* Content Table-like View */}
            <Card className="overflow-hidden border-border/40 bg-card/50 backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/30">
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Participante / ID</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Oferta Académica</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sede / Ubicación</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="p-8 bg-muted/5"></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <AlertCircle className="w-8 h-8" />
                                            <p className="text-xs font-black uppercase tracking-widest">Sin registros encontrados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((ins) => (
                                    <tr key={ins.id} className="group hover:bg-muted/30 transition-all">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-black text-foreground uppercase tracking-tight">{ins.personaId || 'ID S/N'}</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{ins.licenciatura || 'Sin especialidad'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-black text-foreground uppercase leading-tight">
                                                    {ins.programa?.nombre}
                                                </p>
                                                <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                                    {ins.programa?.codigo}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-[11px] font-bold text-muted-foreground uppercase whitespace-nowrap">
                                            {ins.sede?.nombre || 'Nacional'}
                                        </td>
                                        <td className="p-5">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                                                ins.estadoInscripcion?.nombre?.includes('INSCRITO')
                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                            )}>
                                                {ins.estadoInscripcion?.nombre}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(ins)}
                                                    className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ins.id)}
                                                    className="p-2 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingInscripcion ? 'Actualizar Matrícula' : 'Nueva Inscripción de Participante'}
                size="2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-8 max-h-[75vh] overflow-y-auto px-2 custon-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Section 1: Core Data */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-primary">
                                <User className="w-4 h-4" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Datos del Participante</h4>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">UUID Persona / CI</label>
                                <input
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary outline-none text-xs font-bold"
                                    value={formData.personaId}
                                    onChange={(e) => setFormData({ ...formData, personaId: e.target.value })}
                                    placeholder="Ingrese Identificador Único"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Especialidad / Licenciatura</label>
                                <input
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary outline-none text-xs font-bold"
                                    value={formData.licenciatura}
                                    onChange={(e) => setFormData({ ...formData, licenciatura: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Unidad Educativa</label>
                                <input
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary outline-none text-xs font-bold"
                                    value={formData.unidadEducativa}
                                    onChange={(e) => setFormData({ ...formData, unidadEducativa: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Section 2: Academic Program */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-indigo-500">
                                <GraduationCap className="w-4 h-4" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Asignación Académica</h4>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Oferta / Convocatoria Vigente</label>
                                <select
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary outline-none text-xs font-bold"
                                    value={formData.programaId}
                                    onChange={(e) => setFormData({ ...formData, programaId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar Oferta</option>
                                    {ofertas.map(o => <option key={o.id} value={o.id}>{o.nombre} ({o.codigo})</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sede de Asistencia</label>
                                <select
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary outline-none text-xs font-bold"
                                    value={formData.sedeId}
                                    onChange={(e) => setFormData({ ...formData, sedeId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar Sede</option>
                                    {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado de Matrícula</label>
                                <select
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary outline-none text-xs font-bold"
                                    value={formData.estadoInscripcionId}
                                    onChange={(e) => setFormData({ ...formData, estadoInscripcionId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar Estado</option>
                                    {estados.map(est => <option key={est.id} value={est.id}>{est.nombre}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Textarea - Wide */}
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Observaciones / Notas Adicionales</label>
                            <textarea
                                className="w-full min-h-[100px] p-4 rounded-xl bg-card border border-border focus:border-primary outline-none text-xs font-bold resize-none"
                                value={formData.observacion}
                                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="h-12 px-10 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {isLoading ? 'Procesando...' : (
                                <>
                                    <ClipboardCheck className="w-4 h-4" />
                                    {editingInscripcion ? 'Actualizar Registro' : 'Confirmar Inscripción'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

