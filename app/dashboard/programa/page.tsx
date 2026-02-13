'use client';

import { useState, useEffect } from 'react';
import { programaVersionService } from '@/services/programaVersionService';
import { programaMaestroService } from '@/services/programaMaestroService';
import { sedeService } from '@/services/sedeService';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import {
    GraduationCap,
    Plus,
    Search,
    RefreshCw,
    Edit2,
    Trash2,
    Calendar,
    DollarSign,
    MapPin,
    Save,
    Tag,
    Clock,
    FileText,
    Activity,
    CheckCircle2,
    Building2,
    CalendarCheck,
    Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ProgramaPage() {
    const [programasDos, setProgramasDos] = useState<any[]>([]);
    const [programasMaster, setProgramasMaster] = useState<any[]>([]);
    const [sedes, setSedes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProgDos, setEditingProgDos] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        programaId: '', // ID del Programa Pro (Master)
        sedeId: '',
        nombre: '',
        nombreAbre: '',
        codigo: '',
        contenido: '',
        cargaHoraria: 0,
        convocatoria: '',
        horario: '',
        costo: 0,
        banner: '',
        afiche: '',
        fechaIniIns: '',
        fechaFinIns: '',
        fechaIniClase: '',
        estadoInscripcion: true,
        versionId: '986566d5-dc56-46ea-9828-b80c5ce82edc' // ID de versión por defecto para demo
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [dataDos, dataMaster, dataSedes] = await Promise.all([
                programaVersionService.getAll(),
                programaMaestroService.getAll(),
                sedeService.getAll()
            ]);
            setProgramasDos(dataDos);
            setProgramasMaster(dataMaster);
            setSedes(dataSedes);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al sincronizar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (pdos: any = null) => {
        if (pdos) {
            setEditingProgDos(pdos);
            setFormData({
                programaId: pdos.programaId || '',
                sedeId: pdos.sedeId || '',
                nombre: pdos.nombre || '',
                nombreAbre: pdos.nombreAbre || '',
                codigo: pdos.codigo || '',
                contenido: pdos.contenido || '',
                cargaHoraria: pdos.cargaHoraria || 0,
                convocatoria: pdos.convocatoria || '',
                horario: pdos.horario || '',
                costo: pdos.costo || 0,
                banner: pdos.banner || '',
                afiche: pdos.afiche || '',
                fechaIniIns: pdos.fechaIniIns ? new Date(pdos.fechaIniIns).toISOString().split('T')[0] : '',
                fechaFinIns: pdos.fechaFinIns ? new Date(pdos.fechaFinIns).toISOString().split('T')[0] : '',
                fechaIniClase: pdos.fechaIniClase ? new Date(pdos.fechaIniClase).toISOString().split('T')[0] : '',
                estadoInscripcion: pdos.estadoInscripcion ?? true,
                versionId: pdos.versionId || '986566d5-dc56-46ea-9828-b80c5ce82edc'
            });
        } else {
            setEditingProgDos(null);
            setFormData({
                programaId: '',
                sedeId: '',
                nombre: '',
                nombreAbre: '',
                codigo: '',
                contenido: '',
                cargaHoraria: 0,
                convocatoria: '',
                horario: '',
                costo: 0,
                banner: '',
                afiche: '',
                fechaIniIns: '',
                fechaFinIns: '',
                fechaIniClase: '',
                estadoInscripcion: true,
                versionId: '986566d5-dc56-46ea-9828-b80c5ce82edc'
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
                fechaIniIns: new Date(formData.fechaIniIns).toISOString(),
                fechaFinIns: new Date(formData.fechaFinIns).toISOString(),
                fechaIniClase: new Date(formData.fechaIniClase).toISOString(),
            };

            if (editingProgDos) {
                await programaVersionService.update(editingProgDos.id, payload);
                toast.success('Programa actualizado');
            } else {
                await programaVersionService.create(payload);
                toast.success('Nueva versión de Programa registrada');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta versión del programa?')) return;
        try {
            await programaVersionService.delete(id);
            toast.success('Programa eliminado');
            loadData();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar');
        }
    };

    const filtered = programasDos.filter(p =>
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">
                        <GraduationCap className="w-3 h-3" />
                        <span>Versiones Operativas de Programa</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Programa</h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-md">
                        Gestión de convocatorias, costos y cronogramas de inscripción por sede.
                    </p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Versión
                </button>
            </div>

            {/* Search */}
            <Card className="p-4 border-border/40 bg-card/30 backdrop-blur-md">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o sede..."
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[13px] font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array(8).fill(0).map((_, i) => (
                        <Card key={i} className="h-64 animate-pulse bg-muted/20 border-border/40" />
                    ))
                ) : filtered.map((p) => (
                    <Card key={p.id} className="group relative border-border/40 overflow-hidden bg-card hover:border-primary/30 transition-all p-0">
                        <div className="relative h-32 overflow-hidden bg-primary/5">
                            {p.banner ? (
                                <img src={p.banner} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <ImageIcon className="w-10 h-10 text-primary/20" />
                                </div>
                            )}
                            <div className="absolute top-3 right-3">
                                <span className={cn(
                                    "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border",
                                    p.estadoInscripcion ? "bg-emerald-500/80 text-white border-emerald-400/30" : "bg-rose-500/80 text-white border-rose-400/30"
                                )}>
                                    {p.estadoInscripcion ? 'Inscripciones Abiertas' : 'Cerrado'}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-black tracking-tight text-foreground uppercase truncate">
                                    {p.nombre}
                                </h3>
                                <div className="flex items-center gap-1.5 text-primary">
                                    <MapPin className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest truncate">{p.sede?.nombre || 'Sede Regional'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Inversión</p>
                                    <div className="flex items-center gap-1 text-emerald-600">
                                        <DollarSign className="w-3 h-3 font-bold" />
                                        <span className="text-[12px] font-black">{p.costo} <span className="text-[8px] font-bold uppercase">Bs</span></span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Inicio Clases</p>
                                    <div className="flex items-center gap-1 text-indigo-600">
                                        <CalendarCheck className="w-3 h-3" />
                                        <span className="text-[10px] font-black">{p.fechaIniClase ? new Date(p.fechaIniClase).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : '---'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">@{p.codigo}</span>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => handleOpenModal(p)}
                                        className="p-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        className="p-1.5 rounded-lg bg-rose-500/5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProgDos ? 'Mantenimiento de Programa' : 'Nueva Lanzamiento de Programa'}
                size="2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-8 max-h-[75vh] overflow-y-auto px-2 pr-4 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Config & Identity */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                    <Tag className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Parametrización Core</h4>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Programa Maestro (Pro)</label>
                                <select
                                    className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground appearance-none"
                                    value={formData.programaId}
                                    onChange={(e) => {
                                        const master = programasMaster.find(m => m.id === e.target.value);
                                        setFormData({
                                            ...formData,
                                            programaId: e.target.value,
                                            nombre: master?.nombre || '',
                                            codigo: master?.codigo || '',
                                            nombreAbre: master?.nombreAbre || '',
                                            cargaHoraria: master?.cargaHoraria || 0,
                                            contenido: master?.contenido || ''
                                        });
                                    }}
                                    required
                                >
                                    <option value="">Seleccionar Programa Pro</option>
                                    {programasMaster.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sede de Ejecución</label>
                                <select
                                    className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground appearance-none"
                                    value={formData.sedeId}
                                    onChange={(e) => setFormData({ ...formData, sedeId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar Sede</option>
                                    {sedes.map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Inversión (Bs)</label>
                                    <input
                                        type="number"
                                        className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                        value={formData.costo}
                                        onChange={(e) => setFormData({ ...formData, costo: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Horario Sugerido</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                        value={formData.horario}
                                        onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                                        placeholder="Sábados 8:00 - 14:00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Banner (URL)</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                        value={formData.banner}
                                        onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Afiche (URL)</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                        value={formData.afiche}
                                        onChange={(e) => setFormData({ ...formData, afiche: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, estadoInscripcion: !formData.estadoInscripcion })}
                                className={cn(
                                    "flex items-center justify-between w-full h-14 px-5 rounded-2xl border-2 transition-all shadow-sm",
                                    formData.estadoInscripcion
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                        : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                                )}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">Inscripciones {formData.estadoInscripcion ? 'Abiertas' : 'Bloqueadas'}</span>
                                <Activity className={cn("w-5 h-5", formData.estadoInscripcion ? "animate-pulse" : "")} />
                            </button>
                        </div>

                        {/* Column 2: Timeline */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                    <Calendar className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Cronograma de Operaciones</h4>
                            </div>

                            <div className="space-y-4 p-6 rounded-2xl bg-muted/20 border border-border/50">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Inicio de Inscripción</label>
                                    <input
                                        type="date"
                                        className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                        value={formData.fechaIniIns}
                                        onChange={(e) => setFormData({ ...formData, fechaIniIns: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fin de Inscripción</label>
                                    <input
                                        type="date"
                                        className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                        value={formData.fechaFinIns}
                                        onChange={(e) => setFormData({ ...formData, fechaFinIns: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fecha Inicio de Clases</label>
                                    <input
                                        type="date"
                                        className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground"
                                        value={formData.fechaIniClase}
                                        onChange={(e) => setFormData({ ...formData, fechaIniClase: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <p className="text-[10px] text-primary font-bold italic leading-relaxed">
                                    * Nota: Los datos maestros (Nombre, Código, Carga Horaria) se sincronizan desde el Programa Pro seleccionado para mantener la integridad académica del sistema.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
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
                            {isLoading ? 'Sincronizando...' : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    {editingProgDos ? 'Actualizar Programa' : 'Lanzar Convocatoria'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
