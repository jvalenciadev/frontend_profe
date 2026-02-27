'use client';

import { useState, useEffect } from 'react';
import { bancoProfesionalService, BancoProfesional } from '@/services/bancoProfesionalService';
import { cargoService, Cargo } from '@/services/cargoService';
import { roleService } from '@/services/roleService';
import { Role } from '@/types';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import { useProfe } from '@/contexts/ProfeContext';
import {
    Search, Filter, Plus, MoreVertical, Eye, FileText,
    Download, Trash2, CheckCircle2, XCircle, UserCircle,
    Loader2, Briefcase, GraduationCap, Award, Book,
    Mail, MapPin, Calendar, Heart, Globe, FileDown, IdCard,
    IdCardIcon, AlertCircle, ChevronRight, Save, Users2, UserCheck, Phone, Clock
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FichaPDF } from '@/components/FichaPDF';
import { userService } from '@/services/userService';
import { cn, getImageUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/StatusBadge';

export default function BancoProfesionalPage() {
    const { config: profeConfig } = useProfe();
    const [professionals, setProfessionals] = useState<BancoProfesional[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedProf, setSelectedProf] = useState<BancoProfesional | null>(null);
    const [completeFicha, setCompleteFicha] = useState<any>(null);
    const [approvalData, setApprovalData] = useState({
        roleId: '',
        tenantId: '',
        status: 'activo'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [profData, cargoData, roleData, configData] = await Promise.all([
                bancoProfesionalService.getAll(),
                cargoService.getAll(),
                roleService.getAll(),
                bancoProfesionalService.getConfig()
            ]);
            setProfessionals(profData);
            setCargos(cargoData);
            setRoles(roleData.filter((r: any) => r.name !== 'POSTULACION_PROFE'));
            setConfig(configData);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const openDetailModal = async (p: BancoProfesional) => {
        setSelectedProf(p);
        setIsDetailModalOpen(true);
        setCompleteFicha(null);
        try {
            // Obtener datos completos del profesional (no solo lo que viene en el listado)
            // En este caso, el listado ya trae mucho, pero si hace falta más, se puede fetchear por ID
            // bancoProfesionalService.getById(p.id) ...
            // Por ahora simulamos/usamos lo que tenemos + config
            setCompleteFicha(p);
        } catch (error) {
            toast.error('Error al cargar detalle');
        }
    };

    const handleApprove = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProf) return;
        try {
            setLoading(true);
            if (!approvalData.roleId) {
                toast.error('Debe seleccionar un rol institucional');
                return;
            }

            await bancoProfesionalService.aprobar(
                selectedProf.id,
                approvalData.roleId,
                approvalData.tenantId || undefined,
                approvalData.status
            );
            toast.success('Cambios guardados correctamente');
            setIsApprovalModalOpen(false);
            loadData();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al aprobar profesional';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const openApprovalModal = (p: BancoProfesional) => {
        setSelectedProf(p);
        // Intentar encontrar el rol actual o poner el primero disponible
        setApprovalData({
            roleId: roles.find(r => r.name === 'PARTICIPANTE')?.id || roles[0]?.id || '',
            tenantId: (p as any).tenantId || '',
            status: p.estado || 'APROBADO'
        });
        setIsApprovalModalOpen(true);
    };

    const handleDarDeBaja = async (p: BancoProfesional) => {
        const bajaRole = roles.find(r => r.name === 'BAJAS' || r.name === 'BAJA');
        if (!bajaRole) {
            toast.error('No se encontró el rol de BAJAS en el sistema');
            return;
        }

        if (!confirm(`¿Está seguro de dar de BAJA a ${p.nombre}?`)) return;

        try {
            setLoading(true);
            await bancoProfesionalService.aprobar(p.id, bajaRole.id, (p as any).tenantId, 'inactivo');
            toast.success('Personal dado de baja');
            loadData();
        } catch (error) {
            toast.error('Error al dar de baja');
        } finally {
            setLoading(false);
        }
    };

    const filteredProf = professionals.filter(p =>
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ci?.toString().includes(searchTerm) ||
        (p.user?.correo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCargoName = (id: string) => cargos.find(c => c.id === id)?.nombre || 'Sin Cargo';

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <Users2 className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            Banco <span className="text-primary italic">Profesional</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium ml-1">
                        Postulantes y profesionales calificados para la institución.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o CI..."
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border border-border focus:border-primary transition-all shadow-sm outline-none text-sm font-bold placeholder:text-muted-foreground/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Content Table/Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode='popLayout'>
                    {loading && professionals.length === 0 ? (
                        Array(8).fill(0).map((_, i) => (
                            <Card key={i} className="h-72 animate-pulse bg-muted/20 rounded-[32px] border-border/40" />
                        ))
                    ) : (
                        filteredProf.map((p) => (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="group p-6 rounded-[32px] border-border/40 bg-card hover:border-primary/40 transition-all shadow-sm hover:shadow-2xl hover:shadow-primary/5 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/5 text-primary flex items-center justify-center font-black text-2xl group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all shadow-inner overflow-hidden border-2 border-primary/10">
                                            {p.user?.imagen ? (
                                                <img
                                                    src={getImageUrl(p.user?.imagen)}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
                                                />
                                            ) : (
                                                p.nombre.charAt(0)
                                            )}
                                        </div>
                                        <StatusBadge status={p.estado} />
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-tight line-clamp-1">{p.nombre} {p.apellidos}</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">CI: {p.ci}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-tighter">
                                                <Briefcase className="w-3 h-3 text-primary" />
                                                {getCargoName(p.cargoId)}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                                                <GraduationCap className="w-3 h-3 text-primary" />
                                                {p.licUniversitaria || 'Sin Título Registrado'}
                                            </div>
                                        </div>

                                        {p.esMaestro && (
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/10">
                                                <UserCheck className="w-3 h-3" /> Personal Magisterio
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-border/40 grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => openDetailModal(p)}
                                            className="h-10 rounded-xl bg-accent/40 text-muted-foreground hover:bg-primary hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                        >
                                            <Eye className="w-4 h-4" /> Perfil
                                        </button>
                                        {p.estado?.toLowerCase() === 'pendiente' ? (
                                            <button
                                                onClick={() => openApprovalModal(p)}
                                                className="h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <UserCheck className="w-4 h-4" /> Categorizar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => openApprovalModal(p)}
                                                className="h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <Save className="w-4 h-4" /> Estado/Rol
                                            </button>
                                        )}
                                        {p.estado?.toLowerCase() === 'activo' && (
                                            <button
                                                onClick={() => handleDarDeBaja(p)}
                                                className="col-span-2 h-10 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" /> Dar de Baja
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Modal de Detalle de Ficha */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detalle del Profesional"
                size="xl"
            >
                {selectedProf && (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-primary/10 text-primary flex items-center justify-center font-black text-4xl shadow-inner shrink-0 overflow-hidden border-2 border-primary/20">
                                {selectedProf.user?.imagen ? (
                                    <img
                                        src={getImageUrl(selectedProf.user?.imagen)}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    selectedProf.nombre.charAt(0)
                                )}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedProf.nombre} {selectedProf.apellidos}</h3>
                                    <p className="text-xs font-bold text-muted-foreground uppercase mt-2 tracking-widest">CI: {selectedProf.ci} • {selectedProf.estado}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
                                        <Mail className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-bold">{selectedProf.user?.correo || 'No disponible'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
                                        <Phone className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-bold">{selectedProf.celular || 'No disponible'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/20">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Formación y Cargo
                                </h4>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Cargo Postulado</p>
                                        <p className="text-sm font-bold uppercase">{getCargoName(selectedProf.cargoId)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Licenciatura</p>
                                        <p className="text-sm font-bold uppercase">{selectedProf.licUniversitaria || '—'}</p>
                                    </div>
                                    {selectedProf.esMaestro && (
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Categoría Magisterio</p>
                                            <p className="text-sm font-bold uppercase">{selectedProf.categoriaId ? (config?.categorias?.find((c: any) => c.id === String(selectedProf.categoriaId))?.nombre || selectedProf.categoriaId) : '—'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Resumen y Contacto
                                </h4>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Dirección</p>
                                        <p className="text-sm font-bold">{selectedProf.direccion || '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Resumen Profesional</p>
                                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">{selectedProf.resumenProfesional || 'Sin descripción disponible.'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Idiomas</p>
                                            <p className="text-xs font-bold">{selectedProf.idiomas || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Habilidades</p>
                                            <p className="text-xs font-bold">{selectedProf.habilidades || '---'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documentos y Experiencia */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/20">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Documentos Adjuntos
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {selectedProf.hojaDeVidaPdf && (
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 group/doc">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Hoja de Vida (CV)</p>
                                                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Formato PDF</p>
                                                </div>
                                            </div>
                                            <a
                                                href={getImageUrl(selectedProf.hojaDeVidaPdf)}
                                                target="_blank"
                                                className="p-2.5 rounded-xl bg-white dark:bg-card text-muted-foreground hover:text-primary hover:shadow-lg transition-all"
                                                title="Ver PDF"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                        </div>
                                    )}
                                    {selectedProf.rdaPdf && (
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 group/doc">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Certificado RDA</p>
                                                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Formato PDF</p>
                                                </div>
                                            </div>
                                            <a
                                                href={getImageUrl(selectedProf.rdaPdf)}
                                                target="_blank"
                                                className="p-2.5 rounded-xl bg-white dark:bg-card text-muted-foreground hover:text-emerald-600 hover:shadow-lg transition-all"
                                                title="Ver PDF"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                        </div>
                                    )}
                                    {!selectedProf.hojaDeVidaPdf && !selectedProf.rdaPdf && (
                                        <p className="text-[10px] font-bold text-muted-foreground italic">No se han subido documentos PDF.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Experiencia Laboral
                                </h4>
                                <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 min-h-[100px]">
                                    <p className="text-xs font-medium text-muted-foreground leading-relaxed italic whitespace-pre-wrap">
                                        {selectedProf.experienciaLaboral || 'No se detalló experiencia laboral.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Nueva sección de postgrados y producción */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/20">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Formación Superior
                                </h4>
                                <div className="space-y-3">
                                    {selectedProf.postgrados && selectedProf.postgrados.length > 0 ? (
                                        selectedProf.postgrados.map((p: any) => (
                                            <div key={p.id} className="p-4 rounded-[1.5rem] bg-muted/40 border border-border/50">
                                                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">{p.tipoPosgrado?.nombre}</p>
                                                <p className="text-[11px] font-black uppercase leading-tight">{p.titulo}</p>
                                                <p className="text-[8px] text-muted-foreground font-bold mt-2 uppercase tracking-widest">{new Date(p.fecha).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 rounded-[1.5rem] border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-center">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Sin postgrados</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Producción Intelectual
                                </h4>
                                <div className="space-y-3">
                                    {selectedProf.produccionIntelectual && selectedProf.produccionIntelectual.length > 0 ? (
                                        selectedProf.produccionIntelectual.map((p: any) => (
                                            <div key={p.id} className="p-4 rounded-[1.5rem] bg-muted/40 border border-border/50">
                                                <p className="text-[11px] font-black uppercase leading-tight">{p.titulo}</p>
                                                <p className="text-[8px] font-black text-muted-foreground mt-2 uppercase tracking-[0.2em]">Año de Publicación: {p.anioPublicacion}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 rounded-[1.5rem] border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-center">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Sin publicaciones</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-8 border-t border-border/20">
                            <button onClick={() => setIsDetailModalOpen(false)} className="px-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                                Cerrar
                            </button>
                            {isMounted && config && selectedProf && (
                                <PDFDownloadLink
                                    document={<FichaPDF ficha={selectedProf} config={config} profe={profeConfig} />}
                                    fileName={`Ficha_${selectedProf.nombre}_${selectedProf.apellidos}.pdf`}
                                    className="h-12 px-8 rounded-xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2"
                                >
                                    {({ loading }) => (
                                        <>
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                            Imprimir Ficha
                                        </>
                                    )}
                                </PDFDownloadLink>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal de Aprobación */}
            <Modal
                isOpen={isApprovalModalOpen}
                onClose={() => setIsApprovalModalOpen(false)}
                title="Gestión de Rol y Estado"
                size="md"
            >
                <form onSubmit={handleApprove} className="space-y-6">
                    <div className="p-6 rounded-[2.5rem] bg-primary/5 border border-primary/10 mb-8 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-slate-900 shadow-xl mb-4 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 relative z-10 transition-transform hover:scale-110 duration-500">
                            {selectedProf?.user?.imagen ? (
                                <img
                                    src={getImageUrl(selectedProf?.user?.imagen)}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                    <UserCircle className="w-12 h-12 text-primary" />
                                </div>
                            )}
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-lg font-black uppercase tracking-tight leading-none mb-1">{selectedProf?.nombre} {selectedProf?.apellidos}</h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1 rounded-full inline-block">
                                Postulante a: {getCargoName(selectedProf?.cargoId || '')}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado</label>
                                <select
                                    required
                                    className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border focus:border-primary transition-all text-sm font-bold"
                                    value={approvalData.status}
                                    onChange={(e) => setApprovalData({ ...approvalData, status: e.target.value })}
                                >
                                    <option value="activo">ACTIVO</option>
                                    <option value="pendiente">PENDIENTE</option>
                                    <option value="inactivo">INACTIVO</option>
                                    <option value="inhabilitado">INHABILITADO</option>
                                    <option value="eliminado">ELIMINADO</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Rol</label>
                                <select
                                    required
                                    className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border focus:border-primary transition-all text-sm font-bold"
                                    value={approvalData.roleId}
                                    onChange={(e) => setApprovalData({ ...approvalData, roleId: e.target.value })}
                                >
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-1 bg-muted/30 p-3 rounded-xl border border-border/50 leading-relaxed font-medium italic">
                            {approvalData.status === 'APROBADO'
                                ? `Usted está por aprobar a ${selectedProf?.nombre} como personal activo. Se le asignará el rol seleccionado y tendrá acceso a las funciones institucionales.`
                                : approvalData.status === 'INACTIVO'
                                    ? `Atención: Está por dar de baja a ${selectedProf?.nombre}. Esta acción restringirá su acceso al sistema.`
                                    : `Se actualizarán los permisos y el rol de ${selectedProf?.nombre} en el sistema.`}
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border/10">
                        <button type="button" onClick={() => setIsApprovalModalOpen(false)} className="px-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-12 px-10 rounded-xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                approvalData.status === 'APROBADO' ? <CheckCircle2 className="w-4 h-4" /> :
                                    approvalData.status === 'INACTIVO' ? <XCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />
                            )}
                            {approvalData.status === 'APROBADO' ? 'Aprobar Profesional' :
                                approvalData.status === 'INACTIVO' ? 'Confirmar Baja' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
