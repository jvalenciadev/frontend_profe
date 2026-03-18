'use client';

import { useState, useEffect } from 'react';
import { programaMaestroService } from '@/services/programaMaestroService';
import { programaLookupService } from '@/services/programaLookupService';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Card } from '@/components/ui/Card';
import { Plus, Search, Edit2, Trash2, Save, X, GraduationCap, Clock, FileText, BadgeDollarSign, PlusCircle, LayoutGrid, Box, XCircle, ImageIcon, Activity, MapPin, CheckCircle2, BookOpen, Users, Award } from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/StatusBadge';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { userService } from '@/services/userService';


export default function ProgramasMaestroPage() {
    const [programas, setProgramas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrograma, setEditingPrograma] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [confirmDelete, setConfirmDelete] = useState<{
        isOpen: boolean;
        itemId: string | null;
        itemName?: string;
        loading: boolean;
    }>({
        isOpen: false,
        itemId: null,
        loading: false
    });

    const [formData, setFormData] = useState({
        nombre: '',
        nombreAbre: '',
        codigo: '',
        contenido: '',
        cargaHoraria: 0,
        convocatoria: '',
        tipoId: '',
        modalidadId: '',
        duracionId: '',
        estado: 'ACTIVO',
        costo: 0,
        banner: '',
        afiche: '',
        modulos: [] as any[]
    });

    const [tipos, setTipos] = useState<any[]>([]);
    const [modalidades, setModalidades] = useState<any[]>([]);
    const [duraciones, setDuraciones] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [facilitadores, setFacilitadores] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [data, tiposData, modalidadesData, duracionesData, departamentosData, usersData] = await Promise.all([
                programaMaestroService.getAll(),
                programaLookupService.getTipos(),
                programaLookupService.getModalidades(),
                programaLookupService.getDuraciones(),
                programaLookupService.getDepartamentos(),
                userService.getAll()
            ]);
            setProgramas(data);
            setTipos(tiposData);
            setModalidades(modalidadesData);
            setDuraciones(duracionesData);
            setDepartamentos(departamentosData);
            setFacilitadores(usersData.filter((u: any) =>
                u.roles?.some((r: any) => {
                    const roleName = (r.role?.nombre || r.role?.name || '').toUpperCase();
                    return roleName;
                })
            ));
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al sincronizar datos del Maestro');
        } finally {
            setLoading(false);
        }
    };

    const { user } = useAuth(); // Import useAuth to get user context

    const handleOpenModal = (programa: any = null) => {
        if (programa) {
            setEditingPrograma(programa);
            setFormData({
                nombre: programa.nombre || '',
                nombreAbre: programa.nombreAbreviado || programa.nombreAbre || '',
                codigo: programa.codigo || '',
                contenido: programa.contenido || '',
                cargaHoraria: programa.cargaHoraria || 0,
                convocatoria: programa.convocatoria || '',
                tipoId: programa.tipoId || '',
                modalidadId: programa.modalidadId || '',
                duracionId: programa.duracionId || '',
                estado: programa.estado || 'ACTIVO',
                costo: programa.costo || 0,
                banner: programa.banner || '',
                afiche: programa.afiche || '',
                modulos: programa.modulos || []
            });
        } else {
            setEditingPrograma(null);
            setFormData({
                nombre: '',
                nombreAbre: '',
                codigo: '',
                contenido: '',
                cargaHoraria: 0,
                convocatoria: '',
                tipoId: '',
                modalidadId: '',
                duracionId: '',
                estado: 'ACTIVO',
                costo: 0,
                banner: '',
                afiche: '',
                modulos: []
            });
        }
        setIsModalOpen(true);
    };

    const addModulo = () => {
        const nextOrden = formData.modulos.length > 0
            ? Math.max(...formData.modulos.map(m => m.orden || 0)) + 1
            : 1;

        setFormData({
            ...formData,
            modulos: [
                ...formData.modulos,
                {
                    nombre: '',
                    codigo: '',
                    descripcion: '',
                    estado: 'ACTIVO',
                    esGlobal: false,
                    orden: nextOrden
                }
            ]
        });
    };

    const removeModulo = (index: number) => {
        const newModulos = [...formData.modulos];
        newModulos.splice(index, 1);
        setFormData({ ...formData, modulos: newModulos });
    };

    const updateModulo = (index: number, field: string, value: any) => {
        const newModulos = [...formData.modulos];
        newModulos[index] = { ...newModulos[index], [field]: value };
        setFormData({ ...formData, modulos: newModulos });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);

            // Remove departamentoId if it exists (not part of Programa model)
            const { departamentoId, ...cleanData } = formData as any;

            if (editingPrograma) {
                await programaMaestroService.update(editingPrograma.id, cleanData);
                toast.success('Programa Maestro actualizado');
            } else {
                await programaMaestroService.create(cleanData);
                toast.success('Nuevo Programa Maestro registrado');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error al guardar el programa');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (programa: any) => {
        setConfirmDelete({
            isOpen: true,
            itemId: programa.id,
            itemName: programa.nombre,
            loading: false
        });
    };

    const confirmDeleteAction = async () => {
        if (!confirmDelete.itemId) return;
        try {
            setConfirmDelete(prev => ({ ...prev, loading: true }));
            await programaMaestroService.delete(confirmDelete.itemId);
            toast.success('Eliminado');
            loadData();
            setConfirmDelete(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            toast.error('Error al eliminar');
        } finally {
            setConfirmDelete(prev => ({ ...prev, loading: false }));
        }
    };

    const [selectedTipo, setSelectedTipo] = useState('');
    const [selectedModalidad, setSelectedModalidad] = useState('');
    const [selectedDepartamento, setSelectedDepartamento] = useState('');

    const filtered = programas.filter(p => {
        const matchesSearch = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTipo = selectedTipo ? p.tipoId === selectedTipo : true;
        const matchesModalidad = selectedModalidad ? p.modalidadId === selectedModalidad : true;

        // Los programas maestro son nacionales, no se filtran por departamento 
        // a menos que el modelo sea extendido en el futuro.
        const matchesDepartamento = selectedDepartamento ? p.departamentoId === selectedDepartamento : true;

        return matchesSearch && matchesTipo && matchesModalidad && matchesDepartamento;
    });

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">
                        <GraduationCap className="w-3 h-3" />
                        <span>Gestión Académica Central</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Programas <span className="text-primary">Maestro</span></h1>
                    <p className="text-sm font-medium text-muted-foreground max-w-md">
                        Definición de la malla curricular, módulos y arquitectura académica base.
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
                        Crear Programa
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <Card className="p-1 border-border/40 bg-card/30 backdrop-blur-md">
                <div className="flex flex-col xl:flex-row gap-2 p-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[13px] font-bold text-foreground"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 xl:w-auto w-full">
                        <select
                            className="h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[11px] font-bold text-foreground cursor-pointer hover:bg-muted/50"
                            value={selectedTipo}
                            onChange={(e) => setSelectedTipo(e.target.value)}
                        >
                            <option value="">TODOS LOS TIPOS</option>
                            {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>

                        <select
                            className="h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[11px] font-bold text-foreground cursor-pointer hover:bg-muted/50"
                            value={selectedModalidad}
                            onChange={(e) => setSelectedModalidad(e.target.value)}
                        >
                            <option value="">TODA MODALIDAD</option>
                            {modalidades.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>

                        <select
                            className="h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary transition-all outline-none text-[11px] font-bold text-foreground cursor-pointer hover:bg-muted/50"
                            value={selectedDepartamento}
                            onChange={(e) => setSelectedDepartamento(e.target.value)}
                        >
                            <option value="">TODO DEPARTAMENTO</option>
                            {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Content Grid */}
            <div className="space-y-12">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array(6).fill(0).map((_, i) => (
                            <Card key={i} className="h-64 animate-pulse bg-muted/20 border-border/40" />
                        ))}
                    </div>
                ) : (
                    <AnimatePresence>
                        {Object.entries(
                            filtered.reduce<Record<string, any[]>>((acc, p) => {
                                const tipoName = p.tipo?.nombre || 'Otros Programas';
                                if (!acc[tipoName]) acc[tipoName] = [];
                                acc[tipoName].push(p);
                                return acc;
                            }, {})
                        ).map(([tipoName, groupProgramas]) => (
                            <div key={tipoName} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                                        <BookOpen className="w-4 h-4" />
                                    </div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">{tipoName}</h2>
                                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">{groupProgramas.length}</span>
                                    <div className="h-px flex-1 bg-border/60"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {groupProgramas.map((programa) => (
                                        <motion.div
                                            key={programa.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <Card className="group relative border-border/40 overflow-hidden bg-card hover:border-primary/30 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1 duration-300">
                                                {/* Decorative Background Pattern */}
                                                <div className="absolute top-0 right-0 p-20 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                                                <div className="p-6 space-y-6 relative">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                                <GraduationCap className="w-6 h-6" />
                                                            </div>
                                                            {/* Estado Badge */}
                                                            <StatusBadge status={programa.estado || 'ACTIVO'} />
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                                                                {programa.codigo}
                                                            </span>
                                                            {programa.modalidad && (
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                                    {programa.modalidad.nombre}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <h3 className="text-lg font-black tracking-tight text-foreground uppercase group-hover:text-primary transition-colors min-h-[3.5em] line-clamp-2 leading-tight">
                                                            {programa.nombre}
                                                        </h3>

                                                        <div className="flex flex-wrap gap-3">
                                                            <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-[10px] uppercase bg-muted/30 px-2 py-1 rounded-md">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {programa.cargaHoraria} Hrs
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-primary font-bold text-[10px] uppercase bg-primary/5 px-2 py-1 rounded-md">
                                                                <Award className="w-3.5 h-3.5" />
                                                                {programa.modulos?.length || 0} Módulos
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-orange-600 font-bold text-[10px] uppercase bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                                                                <span className="text-[9px]">$</span>
                                                                {programa.costo || 0} Bs.
                                                            </div>
                                                        </div>

                                                        {programa.departamento ? (
                                                            <div className="flex items-center gap-1.5 pt-1 text-[9px] font-black text-emerald-600 uppercase tracking-wide">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                {programa.departamento.nombre}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 pt-1 text-[9px] font-black text-slate-500 uppercase tracking-wide">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                                Alcance Nacional
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="pt-5 border-t border-border/40 flex items-center justify-between">
                                                        <div className="flex -space-x-2">
                                                            {programa.modulos?.slice(0, 3).map((_: any, i: number) => (
                                                                <div key={i} className="w-7 h-7 rounded-lg border-2 border-card bg-primary/5 flex items-center justify-center text-[7px] font-black text-primary backdrop-blur-sm">
                                                                    M{i + 1}
                                                                </div>
                                                            ))}
                                                            {programa.modulos?.length > 3 && (
                                                                <div className="w-7 h-7 rounded-lg border-2 border-card bg-muted flex items-center justify-center text-[7px] font-black text-muted-foreground backdrop-blur-sm">
                                                                    +{programa.modulos.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                onClick={() => handleOpenModal(programa)}
                                                                className="p-2 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm group/btn"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(programa)}
                                                                className="p-2 rounded-lg bg-destructive/5 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm group/btn"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPrograma ? 'Configuración de Programa Maestro' : 'Nuevo Registro Académico Maestro'}
                size="2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-8 max-h-[75vh] overflow-y-auto px-2 pr-4 custom-scrollbar">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Información General</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre Completo del Programa</label>
                                <input
                                    type="text"
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej: Diplomado en Ciencia de Datos"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre Abreviado</label>
                                <input
                                    type="text"
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm"
                                    value={formData.nombreAbre}
                                    onChange={(e) => setFormData({ ...formData, nombreAbre: e.target.value })}
                                    placeholder="Ej: DCD"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Código Identificador</label>
                                <input
                                    type="text"
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm"
                                    value={formData.codigo}
                                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                    placeholder="EDCD-01"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tipo de Programa</label>
                                <select
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm"
                                    value={formData.tipoId}
                                    onChange={(e) => setFormData({ ...formData, tipoId: e.target.value })}
                                >
                                    <option value="">Seleccionar Tipo</option>
                                    {Array.isArray(tipos) && tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Modalidad</label>
                                <select
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm"
                                    value={formData.modalidadId}
                                    onChange={(e) => setFormData({ ...formData, modalidadId: e.target.value })}
                                >
                                    <option value="">Seleccionar Modalidad</option>
                                    {Array.isArray(modalidades) && modalidades.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Duración</label>
                                <select
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm"
                                    value={formData.duracionId}
                                    onChange={(e) => setFormData({ ...formData, duracionId: e.target.value })}
                                >
                                    <option value="">Seleccionar Duración</option>
                                    {Array.isArray(duraciones) && duraciones.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Carga Horaria Total</label>
                                <input
                                    type="number"
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm"
                                    value={formData.cargaHoraria || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, cargaHoraria: val === '' ? 0 : parseInt(val) });
                                    }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Inversión / Costo (Bs.)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs font-mono">Bs.</span>
                                    <input
                                        type="number"
                                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-[13px] font-black text-foreground shadow-sm"
                                        value={formData.costo}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, costo: val === '' ? 0 : parseInt(val) });
                                        }}
                                        placeholder="0 (Gratis)"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Convocatoria</label>
                                <input
                                    type="text"
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm"
                                    value={formData.convocatoria}
                                    onChange={(e) => setFormData({ ...formData, convocatoria: e.target.value })}
                                    placeholder="Ej: 1ra Convocatoria 2024"
                                />
                            </div>
                            <div className="md:col-span-1 space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado del Programa</label>
                                <select
                                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm"
                                    value={formData.estado}
                                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                >
                                    <option value="ACTIVO">ACTIVO - DISPONIBLE</option>
                                    <option value="INACTIVO">INACTIVO - NO DISPONIBLE</option>
                                    <option value="ELIMINADO">MARCAR COMO ELIMINADO</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contenido Académico / Objetivo</label>
                                <textarea
                                    className="w-full min-h-[100px] p-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-xs font-bold text-foreground shadow-sm resize-none"
                                    value={formData.contenido}
                                    onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                                    placeholder="Describa el contenido o propósito del programa..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3 text-primary" />
                                    Banner del Programa
                                </label>
                                <ImageUpload
                                    value={formData.banner}
                                    onChange={(url: string) => setFormData({ ...formData, banner: url })}
                                    tableName="programa"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3 text-primary" />
                                    Afiche Publicitario
                                </label>
                                <ImageUpload
                                    value={formData.afiche}
                                    onChange={(url: string) => setFormData({ ...formData, afiche: url })}
                                    tableName="programa"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Modulos Management */}
                    <div className="space-y-6 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                                    <LayoutGrid className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Arquitectura de Módulos</h4>
                            </div>
                            <button
                                type="button"
                                onClick={addModulo}
                                className="px-4 py-2 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Añadir Módulo
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.modulos.length === 0 && (
                                <div className="p-8 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center opacity-40">
                                    <Box className="w-8 h-8 mb-2" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Sin módulos definidos</p>
                                </div>
                            )}
                            {formData.modulos.map((modulo, index) => (
                                <div key={index} className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4 relative group">
                                    <button
                                        type="button"
                                        onClick={() => removeModulo(index)}
                                        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>

                                    {/* Cabecera del Módulo con Indicador Global */}
                                    <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs",
                                                modulo.esGlobal ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-primary/10 text-primary"
                                            )}>
                                                {modulo.orden || index + 1}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                                                {modulo.nombre || 'Nuevo Módulo'}
                                            </span>
                                            {modulo.esGlobal && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-tighter border border-emerald-200 animate-pulse">
                                                    Módulo Maestro Global
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-2 space-y-1.5">
                                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre del Módulo</label>
                                            <input
                                                type="text"
                                                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-[12px] font-bold text-foreground"
                                                value={modulo.nombre}
                                                onChange={(e) => updateModulo(index, 'nombre', e.target.value)}
                                                placeholder="Ej: Módulo 1: Fundamentos"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Código</label>
                                            <input
                                                type="text"
                                                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-[12px] font-bold text-foreground"
                                                value={modulo.codigo}
                                                onChange={(e) => updateModulo(index, 'codigo', e.target.value)}
                                                placeholder="MOD-01"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Orden Aparición</label>
                                            <input
                                                type="number"
                                                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-[12px] font-bold text-foreground"
                                                value={modulo.orden}
                                                onChange={(e) => updateModulo(index, 'orden', parseInt(e.target.value) || 0)}
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-1.5">
                                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Descripción Breve</label>
                                            <input
                                                type="text"
                                                className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-[12px] font-bold text-foreground"
                                                value={modulo.descripcion}
                                                onChange={(e) => updateModulo(index, 'descripcion', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5 flex flex-col justify-end pb-1">
                                            <div className="p-3 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
                                                <label className="relative flex items-center justify-between cursor-pointer">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">¿Es Módulo Global?</span>
                                                        <span className="text-[8px] text-muted-foreground font-bold">Aparece fuera del curso</span>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={modulo.esGlobal}
                                                            onChange={(e) => updateModulo(index, 'esGlobal', e.target.checked)}
                                                        />
                                                        <div className="w-10 h-6 bg-muted-foreground/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 border-t border-border/20 pt-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado de Publicación</label>
                                                <select
                                                    className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:border-primary transition-all outline-none text-[12px] font-bold text-foreground"
                                                    value={modulo.estado}
                                                    onChange={(e) => updateModulo(index, 'estado', e.target.value)}
                                                >
                                                    <option value="ACTIVO">ACTIVO - Público para alumnos</option>
                                                    <option value="INACTIVO">INACTIVO - Solo facilitadores</option>
                                                    <option value="ELIMINADO">ELIMINADO - Papelera</option>
                                                </select>
                                            </div>

                                            {/* ASIGNACIÓN DE FACILITADOR GLOBAL - DISEÑO CREATIVO */}
                                            {modulo.esGlobal && (
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                        <Award className="w-3 h-3" />
                                                        Lider de Inducción (Gestión Central)
                                                    </label>

                                                    <div className="relative group/fac">
                                                        {modulo.facilitadorId ? (
                                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all animate-in fade-in slide-in-from-top-2">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/30 overflow-hidden border-2 border-white">
                                                                    {facilitadores.find(f => f.id === modulo.facilitadorId)?.imagen ? (
                                                                        <img
                                                                            src={getImageUrl(facilitadores.find(f => f.id === modulo.facilitadorId).imagen)}
                                                                            className="w-full h-full object-cover"
                                                                            alt="avatar"
                                                                        />
                                                                    ) : (
                                                                        <span>{facilitadores.find(f => f.id === modulo.facilitadorId)?.nombre?.substring(0, 1)}{facilitadores.find(f => f.id === modulo.facilitadorId)?.apellidos?.substring(0, 1)}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 flex flex-col min-w-0">
                                                                    <span className="text-[11px] font-black text-foreground truncate">
                                                                        {facilitadores.find(f => f.id === modulo.facilitadorId)?.nombre} {facilitadores.find(f => f.id === modulo.facilitadorId)?.apellidos}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-tighter">Responsable Oficial Designado</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateModulo(index, 'facilitadorId', null)}
                                                                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive opacity-0 group-hover/fac:opacity-100 transition-all hover:scale-110"
                                                                    title="Remover Responsable"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <div className="relative">
                                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Buscar Administrador, Técnico o Facilitador..."
                                                                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted/20 border border-emerald-100 focus:border-emerald-500 focus:bg-white transition-all outline-none text-[12px] font-bold text-foreground placeholder:text-emerald-900/30"
                                                                        value={userSearch}
                                                                        onChange={(e) => setUserSearch(e.target.value)}
                                                                    />
                                                                </div>

                                                                {userSearch.length >= 2 && (
                                                                    <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-2xl bg-white border border-border shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95">
                                                                        {facilitadores
                                                                            .filter(f =>
                                                                                `${f.nombre} ${f.apellidos}`.toLowerCase().includes(userSearch.toLowerCase())
                                                                            )
                                                                            .slice(0, 10)
                                                                            .map(f => (
                                                                                <button
                                                                                    key={f.id}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        updateModulo(index, 'facilitadorId', f.id);
                                                                                        setUserSearch('');
                                                                                    }}
                                                                                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50 text-left transition-colors group/item"
                                                                                >
                                                                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[10px] group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">
                                                                                        {f.nombre?.substring(0, 1)}{f.apellidos?.substring(0, 1)}
                                                                                    </div>
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[11px] font-bold text-foreground">{f.nombre} {f.apellidos}</span>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-[9px] text-muted-foreground uppercase font-black">{f.username}</span>
                                                                                            {f.roles?.map((r: any, idx: number) => (
                                                                                                <span key={idx} className="text-[8px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-black uppercase tracking-tighter">
                                                                                                    {r.role?.nombre || r.role?.name}
                                                                                                </span>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </button>
                                                                            ))
                                                                        }
                                                                        {facilitadores.filter(f => `${f.nombre} ${f.apellidos}`.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                                                                            <div className="p-4 text-center text-xs text-muted-foreground italic">No se encontraron resultados</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {modulo.esGlobal ? (
                                                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">Configuración Global Activada</span>
                                                        <span className="text-[8px] font-bold opacity-80 italic">Este módulo será compartido como INDUCCIÓN / MÓDULO 0</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary/70">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                                        <BookOpen size={16} className="text-primary/50" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">Módulo Secuencial</span>
                                                        <span className="text-[8px] font-bold opacity-80 italic">Parte de la malla curricular normal</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cerrar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="h-12 px-10 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {isLoading ? 'Sincronizando...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {editingPrograma ? 'Actualizar Maestro' : 'Guardar Maestro'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
                onConfirm={confirmDeleteAction}
                title="Eliminar Programa Maestro"
                description={`¿Está seguro de eliminar el programa maestro "${confirmDelete.itemName}"? Esta acción no se puede deshacer y afectará a la malla curricular base.`}
                loading={confirmDelete.loading}
            />
        </div >
    );
}
