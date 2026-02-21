'use client';

import { useState, useEffect } from 'react';
import { programaDosService } from '@/services/programaDosService';
import { programaMaestroService } from '@/services/programaMaestroService';
import { programaVersionService } from '@/services/programaVersionService';
import { sedeService } from '@/services/sedeService';
import { programaLookupService } from '@/services/programaLookupService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    GraduationCap,
    Plus,
    Search,
    Edit2,
    Trash2,
    LayoutGrid,
    BookOpen,
    Save,
    PlusCircle,
    XCircle,
    FileText,
    Activity,
    CheckCircle2,
    Clock,
    Award,
    Box,
    Building2,
    DollarSign,
    Calendar,
    Tag,
    Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/StatusBadge';

export default function ProgramaDosPage() {
    const [programas, setProgramas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrograma, setEditingPrograma] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        programaId: '',
        sedeId: '',
        versionId: '',
        nombre: '',
        nombreAbre: '',
        codigo: '',
        contenido: '',
        cargaHoraria: 0,
        convocatoria: '',
        tipoId: '',
        modalidadId: '',
        duracionId: '',
        horario: '',
        costo: 0,
        banner: '',
        afiche: '',
        fechaIniIns: '',
        fechaFinIns: '',
        fechaIniClase: '',
        estadoInscripcion: true,
        estado: 'ACTIVO'
    });

    const [tipos, setTipos] = useState<any[]>([]);
    const [modalidades, setModalidades] = useState<any[]>([]);
    const [duraciones, setDuraciones] = useState<any[]>([]);
    const [sedes, setSedes] = useState<any[]>([]);
    const [masters, setMasters] = useState<any[]>([]);
    const [versiones, setVersiones] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [data, tiposData, modalitiesData, durationsData, sedesData, mastersData, versionsData] = await Promise.all([
                programaDosService.getAll(),
                programaLookupService.getTipos(),
                programaLookupService.getModalidades(),
                programaLookupService.getDuraciones(),
                sedeService.getAll(),
                programaMaestroService.getAll(),
                programaVersionService.getAll()
            ]);
            setProgramas(data);
            setTipos(tiposData);
            setModalidades(modalitiesData);
            setDuraciones(durationsData);
            setSedes(sedesData);
            setMasters(mastersData);
            setVersiones(versionsData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al sincronizar datos operativos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (programa: any = null) => {
        if (programa) {
            setEditingPrograma(programa);
            setFormData({
                programaId: programa.programaId || '',
                sedeId: programa.sedeId || '',
                versionId: programa.versionId || '',
                nombre: programa.nombre || '',
                nombreAbre: programa.nombreAbre || '',
                codigo: programa.codigo || '',
                contenido: programa.contenido || '',
                cargaHoraria: programa.cargaHoraria || 0,
                convocatoria: programa.convocatoria || '',
                tipoId: programa.tipoId || '',
                modalidadId: programa.modalidadId || '',
                duracionId: programa.duracionId || '',
                horario: programa.horario || '',
                costo: programa.costo || 0,
                banner: programa.banner || '',
                afiche: programa.afiche || '',
                fechaIniIns: programa.fechaIniIns ? new Date(programa.fechaIniIns).toISOString().split('T')[0] : '',
                fechaFinIns: programa.fechaFinIns ? new Date(programa.fechaFinIns).toISOString().split('T')[0] : '',
                fechaIniClase: programa.fechaIniClase ? new Date(programa.fechaIniClase).toISOString().split('T')[0] : '',
                estadoInscripcion: programa.estadoInscripcion ?? true,
                estado: programa.estado || 'ACTIVO'
            });
        } else {
            setEditingPrograma(null);
            setFormData({
                programaId: '',
                sedeId: '',
                versionId: '',
                nombre: '',
                nombreAbre: '',
                codigo: '',
                contenido: '',
                cargaHoraria: 0,
                convocatoria: '',
                tipoId: '',
                modalidadId: '',
                duracionId: '',
                horario: '',
                costo: 0,
                banner: '',
                afiche: '',
                fechaIniIns: '',
                fechaFinIns: '',
                fechaIniClase: '',
                estadoInscripcion: true,
                estado: 'ACTIVO'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const payload = {
                ...formData,
                fechaIniIns: formData.fechaIniIns ? new Date(formData.fechaIniIns).toISOString() : null,
                fechaFinIns: formData.fechaFinIns ? new Date(formData.fechaFinIns).toISOString() : null,
                fechaIniClase: formData.fechaIniClase ? new Date(formData.fechaIniClase).toISOString() : null,
            };

            if (editingPrograma) {
                await programaDosService.update(editingPrograma.id, payload);
                toast.success('Programa Operativo actualizado');
            } else {
                await programaDosService.create(payload);
                toast.success('Nueva versión operativa registrada');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar el programa operativo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro de eliminar este registro operativo?')) return;
        try {
            await programaDosService.delete(id);
            toast.success('Registro operativo eliminado');
            loadData();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar');
        }
    };

    const filtered = programas.filter(p =>
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">
                        <Rocket className="w-3 h-3" />
                        <span>Gestión de Programas Dos (Operativos)</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase text-primary">Programa <span className="text-foreground">Dos</span></h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-md">
                        Control total sobre las versiones operativas de los programas académicos.
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
                        Nuevo P2
                    </button>
                </div>
            </div>

            {/* Search */}
            <Card className="p-4 border-border/40 bg-card/30 backdrop-blur-md">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código operativa..."
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[13px] font-bold text-foreground"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="h-64 animate-pulse bg-muted/20 border-border/40" />
                    ))
                ) : (
                    <AnimatePresence>
                        {filtered.map((p) => (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <Card className="group relative border-border/40 overflow-hidden bg-card hover:border-primary/30 transition-all p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <Award className="w-6 h-6" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                                {p.codigo}
                                            </span>
                                            <div className="mt-2">
                                                <StatusBadge status={p.estado} showIcon={false} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-black tracking-tight text-foreground uppercase line-clamp-2">
                                                {p.nombre}
                                            </h3>
                                            <p className="text-[9px] font-bold text-primary uppercase mt-1">Sede: {p.sede?.nombre || 'N/A'}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/40">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Costo</p>
                                                <p className="text-sm font-black text-emerald-600">{p.costo} Bs</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Carga</p>
                                                <p className="text-sm font-black text-indigo-600">{p.cargaHoraria} Hrs</p>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex items-center justify-between">
                                            <div className="text-[9px] font-bold text-muted-foreground uppercase">
                                                V: {p.version?.nombre || 'S/V'}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(p)}
                                                    className="p-2.5 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="p-2.5 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPrograma ? 'Edición Maestro Operativo (P2)' : 'Nuevo Registro Operativo (P2)'}
                size="2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-8 max-h-[70vh] overflow-y-auto px-1 pr-4 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Core Links */}
                        <div className="md:col-span-2 space-y-4 p-4 rounded-2xl bg-accent/30 border border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Tag className="w-4 h-4 text-primary" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Vinculación Maestra</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Catálogo Maestro</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-[11px] font-bold"
                                        value={formData.programaId}
                                        onChange={(e) => {
                                            const master = masters.find(m => m.id === e.target.value);
                                            if (master) {
                                                setFormData({
                                                    ...formData,
                                                    programaId: e.target.value,
                                                    nombre: master.nombre,
                                                    nombreAbre: master.nombreAbre,
                                                    codigo: master.codigo,
                                                    cargaHoraria: master.cargaHoraria,
                                                    contenido: master.contenido,
                                                    tipoId: master.tipoId || '',
                                                    modalidadId: master.modalidadId || '',
                                                    duracionId: master.duracionId || ''
                                                });
                                            } else {
                                                setFormData({ ...formData, programaId: e.target.value });
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">Seleccionar Maestro</option>
                                        {masters.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sede Destino</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-[11px] font-bold"
                                        value={formData.sedeId}
                                        onChange={(e) => setFormData({ ...formData, sedeId: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar Sede</option>
                                        {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Versión/Gestión</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-[11px] font-bold"
                                        value={formData.versionId}
                                        onChange={(e) => setFormData({ ...formData, versionId: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar Versión</option>
                                        {versiones.map(v => <option key={v.id} value={v.id}>{v.nombre} ({v.gestion})</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Snapshot Fields */}
                        <div className="md:col-span-2 space-y-4 mt-2">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Datos Snapshot (Modificables)</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre Operativo</label>
                                    <input type="text" className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Código Operativo</label>
                                    <input type="text" className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Carga Horaria</label>
                                    <input type="number" className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.cargaHoraria} onChange={(e) => setFormData({ ...formData, cargaHoraria: parseInt(e.target.value) })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Convocatoria</label>
                                    <input type="text" className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.convocatoria} onChange={(e) => setFormData({ ...formData, convocatoria: e.target.value })} placeholder="Ej: 2024 - Fase I" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tipo Snapshot</label>
                                    <select className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.tipoId} onChange={(e) => setFormData({ ...formData, tipoId: e.target.value })}>
                                        <option value="">Seleccionar Tipo</option>
                                        {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Modalidad Snapshot</label>
                                    <select className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.modalidadId} onChange={(e) => setFormData({ ...formData, modalidadId: e.target.value })}>
                                        <option value="">Seleccionar Modalidad</option>
                                        {modalidades.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Duración Snapshot</label>
                                    <select className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.duracionId} onChange={(e) => setFormData({ ...formData, duracionId: e.target.value })}>
                                        <option value="">Seleccionar Duración</option>
                                        {duraciones.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contenido Académico (Snapshot)</label>
                                    <textarea className="w-full h-24 p-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold resize-none" value={formData.contenido} onChange={(e) => setFormData({ ...formData, contenido: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Financial & Ops */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/40">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Costo (Bs)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    <input type="number" className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-emerald-600" value={formData.costo} onChange={(e) => setFormData({ ...formData, costo: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Horario</label>
                                <input type="text" className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.horario} onChange={(e) => setFormData({ ...formData, horario: e.target.value })} placeholder="Sáb. 08-16:00" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado</label>
                                <select className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })}>
                                    <option value="ACTIVO">ACTIVO</option>
                                    <option value="INACTIVO">INACTIVO</option>
                                    <option value="VISTA">SOLO VISTA</option>
                                </select>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/40">
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1 text-primary">Inicia Inscripción</label>
                                <input type="date" className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.fechaIniIns} onChange={(e) => setFormData({ ...formData, fechaIniIns: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1 text-primary">Cierra Inscripción</label>
                                <input type="date" className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.fechaFinIns} onChange={(e) => setFormData({ ...formData, fechaFinIns: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1 text-indigo-500">Inician Clases</label>
                                <input type="date" className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold" value={formData.fechaIniClase} onChange={(e) => setFormData({ ...formData, fechaIniClase: e.target.value })} />
                            </div>
                        </div>

                        <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50">
                            <span className="text-[10px] font-black uppercase tracking-widest">Habilitar Inscripciones Públicas</span>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, estadoInscripcion: !formData.estadoInscripcion })}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-all relative",
                                    formData.estadoInscripcion ? "bg-emerald-500" : "bg-muted"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                    formData.estadoInscripcion ? "right-1" : "left-1"
                                )} />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="h-12 px-10 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            {isLoading ? 'Guardando...' : 'Confirmar P2'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
