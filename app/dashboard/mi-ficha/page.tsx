'use client';

import { useState, useEffect } from 'react';
import { useProfe } from '@/contexts/ProfeContext';
import {
    User, GraduationCap, Book, FileText, Plus, Trash2,
    Save, Loader2, Calendar, IdCard, Briefcase, Award, Upload,
    Mail, MailCheck, Hash, CheckCircle, Globe, MapPin, Phone,
    Heart, ChevronRight, FileDown, Edit2, ClipboardSignature, Lock,
    Eye, ShieldCheck,
    UserCircle,
    AlertCircle,
    LogOut,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { bancoProfesionalService, BancoProfesional } from '@/services/bancoProfesionalService';
import { evaluationService, EvaluacionAdmins } from '@/services/evaluationService';
import { toast } from 'sonner';
import { cn, getImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/Modal';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FichaPDF } from '@/components/FichaPDF';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export default function MiFichaPage() {
    const { updateUser } = useAuth();

    const { config: profeConfig } = useProfe();
    const IMG = (src: string | null) => getImageUrl(src);
    const [ficha, setFicha] = useState<BancoProfesional>({
        id: '',
        licUniversitaria: '',
        licMescp: '',
        esMaestro: false,
        tieneProduccion: false,
        categoriaId: '',
        cargoId: '',
        nombre: '',
        apellidos: '',
        ci: '',
        estado: 'pendiente',
        hojaDeVidaPdf: null
    });
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState<EvaluacionAdmins[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'personal' | 'posgrados' | 'produccion' | 'evaluaciones' | 'cuenta'>('personal');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [originalEmail, setOriginalEmail] = useState('');
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showVerificationInput, setShowVerificationInput] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    // Modals
    const [showPosgradoModal, setShowPosgradoModal] = useState(false);
    const [showProduccionModal, setShowProduccionModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Memoize PDF to avoid expensive re-renders while typing
    const memoizedFichaPDF = useMemo(() => {
        if (!ficha || !config || !profeConfig) return null;
        return <FichaPDF ficha={ficha} config={config} profe={profeConfig} />;
    }, [ficha.id, ficha.hojaDeVidaPdf, ficha.rdaPdf, config, profeConfig]);

    const [posgradoForm, setPosgradoForm] = useState({ tipoPosgradoId: '', titulo: '', fecha: '', imagen: '' });
    const [produccionForm, setProduccionForm] = useState({ titulo: '', anioPublicacion: new Date().getFullYear() });

    const [editingPosgradoId, setEditingPosgradoId] = useState<string | null>(null);
    const [editingProduccionId, setEditingProduccionId] = useState<string | null>(null);

    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const handleFileUpload = async (file: File, tableName: string) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const { data } = await api.post(`/upload/${tableName}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // El backend devuelve { data: { path: '...' } }
            return data.data?.path || data.path;
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Error al subir archivo');
            return null;
        }
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'posgrado' | 'cv' | 'avatar' | 'rda') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const url = await handleFileUpload(file, type === 'posgrado' ? 'banco_posgrado' : 'banco_profesional');
        if (url) {
            const cleanUrl = url.includes('/uploads/') ? '/uploads/' + url.split('/uploads/')[1] : url;

            if (type === 'posgrado') {
                setPosgradoForm({ ...posgradoForm, imagen: cleanUrl });
                toast.success('Diploma cargado en el formulario');
            } else if (type === 'avatar') {
                setFicha({ ...ficha, user: ficha.user ? { ...ficha.user, imagen: cleanUrl } : undefined, imagen: cleanUrl } as any);
                toast.success('Foto de perfil actualizada (Recuerda Guardar)');
            } else if (type === 'cv') {
                setFicha({ ...ficha, hojaDeVidaPdf: cleanUrl } as any);
                toast.success('Hoja de Vida cargada (Recuerda Guardar Cambios)');
            } else if (type === 'rda') {
                setFicha({ ...ficha, rdaPdf: cleanUrl } as any);
                toast.success('Certificado RDA cargado (Recuerda Guardar Cambios)');
            }
        }
        setUploading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [fichaRes, configRes, evalsRes] = await Promise.all([
                bancoProfesionalService.getMiFicha(),
                bancoProfesionalService.getConfig(),
                evaluationService.getMyEvaluations()
            ]);
            setFicha(fichaRes);
            setOriginalEmail(fichaRes.user?.correo || fichaRes.correo || '');
            setConfig(configRes);
            setEvaluations(evalsRes);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar tu ficha');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestVerification = async () => {
        const email = ficha?.user?.correo || (ficha as any)?.correo;
        if (!email) {
            toast.error('Ingresa un correo válido');
            return;
        }
        setIsSendingVerification(true);
        try {
            await bancoProfesionalService.requestVerification(email);
            toast.success('Código de verificación enviado');
            setShowVerificationInput(true);
            setCountdown(60);
        } catch (error) {
            toast.error('Error al enviar código');
        } finally {
            setIsSendingVerification(false);
        }
    };

    const handleUpdatePersonal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ficha) return;

        const currentEmail = ficha.user?.correo || (ficha as any).correo;
        if (currentEmail !== originalEmail && !isEmailVerified) {
            toast.error('Debes verificar tu nuevo correo antes de guardar');
            return;
        }

        try {
            setSubmitting(true);
            await bancoProfesionalService.updateMiFicha({
                licUniversitaria: ficha.licUniversitaria,
                licMescp: ficha.licMescp,
                esMaestro: ficha.esMaestro,
                categoriaId: ficha.categoriaId,
                tieneProduccion: ficha.tieneProduccion,
                // Nuevos campos
                resumenProfesional: ficha.resumenProfesional,
                habilidades: ficha.habilidades,
                linkedinUrl: ficha.linkedinUrl,
                hojaDeVidaPdf: ficha.hojaDeVidaPdf,
                celular: ficha.celular,
                direccion: ficha.direccion,
                genero: ficha.genero,
                estadoCivil: ficha.estadoCivil,
                imagen: ficha.user?.imagen || ficha.imagen,
                nombre: ficha.user?.nombre || ficha.nombre,
                apellidos: ficha.user?.apellidos || ficha.apellidos,
                ci: ficha.user?.ci || ficha.ci,
                correo: ficha.user?.correo || ficha.correo,
                fechaNac: ficha.user?.fechaNacimiento || ficha.fechaNacimiento,
                rda: ficha.user?.rda || ficha.rda,
                rdaPdf: ficha.rdaPdf,
                verificationCode: verificationCode, // Enviar código si el correo cambió
                password: passwordForm.newPassword || undefined,
                idiomas: ficha.idiomas,
                experienciaLaboral: ficha.experienciaLaboral
            });
            toast.success('Datos actualizados correctamente');
            setOriginalEmail(currentEmail);
            setIsEmailVerified(false);
            setShowVerificationInput(false);
            setVerificationCode('');
            setPasswordForm({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error('Error al actualizar datos');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadConcepto = async (evalId: string) => {
        try {
            toast.info('Generando Hoja de Concepto...');
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

    const handleAddPosgrado = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ficha) return;
        try {
            setSubmitting(true);
            if (editingPosgradoId) {
                await bancoProfesionalService.updatePosgrado(editingPosgradoId, posgradoForm);
                toast.success('Postgrado actualizado correctamente');
            } else {
                await bancoProfesionalService.addPosgrado(ficha.id, posgradoForm);
                toast.success('Postgrado agregado correctamente');
            }
            setShowPosgradoModal(false);
            setEditingPosgradoId(null);
            setPosgradoForm({ tipoPosgradoId: '', titulo: '', fecha: '', imagen: '' });
            await loadData();
        } catch (error) {
            toast.error('Error al guardar postgrado');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditPosgrado = (p: any) => {
        setEditingPosgradoId(p.id);
        setPosgradoForm({
            tipoPosgradoId: p.tipoPosgradoId,
            titulo: p.titulo,
            fecha: p.fecha ? new Date(p.fecha).toISOString().split('T')[0] : '',
            imagen: p.imagen || ''
        });
        setShowPosgradoModal(true);
    };

    const openCreatePosgrado = () => {
        setEditingPosgradoId(null);
        setPosgradoForm({ tipoPosgradoId: '', titulo: '', fecha: '', imagen: '' });
        setShowPosgradoModal(true);
    };

    const handleDeletePosgrado = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        try {
            await bancoProfesionalService.removePosgrado(id);
            toast.success('Registro eliminado');
            loadData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const handleAddProduccion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ficha) return;
        try {
            setLoading(true);
            if (editingProduccionId) {
                await bancoProfesionalService.updateProduccion(editingProduccionId, produccionForm);
                toast.success('Producción actualizada');
            } else {
                await bancoProfesionalService.addProduccion(ficha.id, produccionForm);
                toast.success('Producción agregada');
            }
            setShowProduccionModal(false);
            setEditingProduccionId(null);
            setProduccionForm({ titulo: '', anioPublicacion: new Date().getFullYear() });
            loadData();
        } catch (error) {
            toast.error('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    const openEditProduccion = (p: any) => {
        setEditingProduccionId(p.id);
        setProduccionForm({
            titulo: p.titulo,
            anioPublicacion: p.anioPublicacion
        });
        setShowProduccionModal(true);
    };

    const openCreateProduccion = () => {
        setEditingProduccionId(null);
        setProduccionForm({ titulo: '', anioPublicacion: new Date().getFullYear() });
        setShowProduccionModal(true);
    };

    const handleDeleteProduccion = async (id: string) => {
        if (!confirm('¿Estás seguro?')) return;
        try {
            await bancoProfesionalService.removeProduccion(id);
            toast.success('Eliminado');
            loadData();
        } catch (error) {
            toast.error('Error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <IdCard className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Sincronizando Ficha...</p>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-rose-500" />
                <h2 className="text-2xl font-black uppercase tracking-tighter">Error de Configuración</h2>
                <p className="text-sm font-medium text-muted-foreground max-w-xs">No se pudieron cargar los parámetros del sistema. Por favor, reintente más tarde.</p>
                <Button onClick={loadData} className="rounded-2xl h-12 px-8">Reintentar</Button>
            </div>
        );
    }

    if (!ficha) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-8 max-w-2xl mx-auto">
                <div className="w-32 h-32 bg-white dark:bg-card rounded-[3rem] flex items-center justify-center border-4 border-dashed border-primary/20 p-8 overflow-hidden">
                    {profeConfig?.imagen ? (
                        <img src={IMG(profeConfig.imagen)!} className="w-full h-full object-contain opacity-40 grayscale" alt="Logo" />
                    ) : (
                        <UserCircle className="w-16 h-16 text-primary" />
                    )}
                </div>
                <div className="space-y-2">
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Tu Ficha <span className="text-primary italic">No Existe</span></h2>
                    <p className="text-sm font-medium text-muted-foreground">Parece que aún no te has registrado en el Banco de Profesionales o tu cuenta no está vinculada a una ficha activa.</p>
                </div>
                <div className="bg-muted/30 p-6 rounded-3xl border border-border w-full text-left flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                        <Info className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-foreground">¿Qué debes hacer?</p>
                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                            Debes completar el registro inicial en el portal público. Si ya lo hiciste y sigues viendo este mensaje, contacta al administrador de Recursos Humanos para vincular tu CI con tu identidad actual.
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => {
                        Cookies.remove('token');
                        Cookies.remove('user');
                        window.location.href = '/login';
                    }}
                    variant="outline"
                    className="h-12 px-8 rounded-2xl border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 uppercase tracking-wide gap-2"
                >
                    <LogOut className="w-4 h-4" /> Cerrar Sesión e Ir al Registro
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
            {/* Page Header - Premium styled */}
            <div className="relative p-8 md:p-12 rounded-[3.5rem] bg-gradient-to-br from-primary/10 via-background to-background border border-primary/10 overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-1000"></div>

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Avatar con doble borde y sombra profunda */}
                    <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-primary-600 rounded-[2.8rem] flex items-center justify-center text-white font-black text-4xl shadow-2xl overflow-hidden border-4 border-white dark:border-slate-900 group-hover:scale-105 transition-transform duration-500 relative">
                            {ficha.user?.imagen || ficha.imagen ? (
                                <img
                                    src={getImageUrl(ficha.user?.imagen || ficha.imagen)}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full p-8 flex items-center justify-center bg-white dark:bg-card">
                                    {profeConfig?.imagen ? (
                                        <img src={IMG(profeConfig.imagen)!} className="w-full h-full object-contain opacity-40 grayscale" alt="Logo" />
                                    ) : (
                                        <UserCircle className="w-16 h-16 opacity-50" />
                                    )}
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <Upload className="w-8 h-8 text-white" />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => onFileChange(e, 'avatar')}
                                />
                            </label>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg" title="Perfil Activo">
                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-5xl font-black dark:text-white uppercase tracking-tighter leading-none">
                                {ficha.user?.nombre} <span className="text-primary-600">{ficha.user?.apellidos}</span>
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">CI: {ficha.user?.ci}</span>
                                {(ficha.cargoPostulacion?.nombre || (ficha as any).cargo) && (
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                        {ficha.cargoPostulacion?.nombre || (ficha as any).cargo}
                                    </span>
                                )}
                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">{ficha.user?.departamento || 'No definido'}</span>
                                <span className={cn(
                                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border",
                                    (ficha.estado?.toLowerCase() === 'activo' || !ficha.estado || ficha.estado?.toLowerCase() === 'aprobado') ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                        ficha.estado?.toLowerCase() === 'pendiente' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                            "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                )}>
                                    {ficha.estado || 'ACTIVO'}
                                </span>
                            </div>
                        </div>

                        <p className="text-[11px] font-medium text-muted-foreground max-w-xl leading-relaxed italic opacity-80">
                            {ficha.resumenProfesional || 'Sin descripción profesional definida. Completa tu resumen en la pestaña de Datos Personales.'}
                        </p>
                    </div>

                    <div className="shrink-0 flex self-center md:self-start">
                        {!isGeneratingPDF ? (
                            <button
                                onClick={() => setIsGeneratingPDF(true)}
                                className="bg-primary text-white px-8 h-14 rounded-[1.8rem] text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-primary-700 hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all shadow-xl shadow-primary/20"
                            >
                                <FileDown className="w-5 h-5" /> Preparar Ficha PDF
                            </button>
                        ) : isMounted && memoizedFichaPDF && (
                            <PDFDownloadLink
                                document={memoizedFichaPDF}
                                fileName={`Ficha_${ficha.user?.ci}.pdf`}
                                className="bg-emerald-600 text-white px-8 h-14 rounded-[1.8rem] text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald/40 active:scale-95 transition-all shadow-xl shadow-emerald/20 animate-in zoom-in duration-300"
                            >
                                {({ loading }) => (
                                    loading ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Generando...</>
                                    ) : (
                                        <><CheckCircle className="w-5 h-5" /> Descargar PDF Ahora</>
                                    )
                                )}
                            </PDFDownloadLink>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs - More refined */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-border pb-1">
                <div className="flex gap-1 p-1.5 bg-muted/40 backdrop-blur-md rounded-[2rem] w-fit border border-border/50">
                    {[
                        { id: 'personal', label: 'Datos Personales', icon: User, count: null },
                        { id: 'posgrados', label: 'Formación Superior', icon: GraduationCap, count: ficha.postgrados?.length },
                        { id: 'produccion', label: 'Producción Intelectual', icon: Book, count: ficha.produccionIntelectual?.length },
                        { id: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardSignature, count: evaluations.length },
                        { id: 'cuenta', label: 'Cuenta y Seguridad', icon: Lock, count: null }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 px-6 py-3.5 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-background text-primary shadow-xl shadow-black/5 scale-100 border border-border/30'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            {tab.label}
                            {tab.count !== null && (
                                <span className={`ml-1 w-5 h-5 flex items-center justify-center rounded-full text-[8px] ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Sincronizado hoy
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'personal' && (
                    <motion.div
                        key="personal"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <form onSubmit={handleUpdatePersonal} className="space-y-8">
                            <Card className="p-8 rounded-[3rem] border-gray-100 dark:border-slate-800 shadow-sm space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                                    {/* Columna Izquierda: Perfil y Contacto (8/12) */}
                                    <div className="md:col-span-12 lg:col-span-8 space-y-10">
                                        <div className="space-y-8">
                                            {/* Sección 1: Identidad Institucional */}
                                            <div className="space-y-6">
                                                <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <IdCard className="w-5 h-5" /> Identidad Institucional
                                                </h3>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Cédula de Identidad (CI)</label>
                                                        <div className="relative">
                                                            <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <Input
                                                                value={ficha.user?.ci || ficha.ci || ''}
                                                                onChange={(e) => setFicha({ ...ficha, user: ficha.user ? { ...ficha.user, ci: e.target.value } : undefined, ci: e.target.value })}
                                                                placeholder="Nro de Documento"
                                                                className="pl-11 h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <Input
                                                                type="date"
                                                                value={ficha.user?.fechaNacimiento?.split('T')[0] || (ficha as any).fechaNacimiento?.split('T')[0] || ''}
                                                                onChange={(e) => setFicha({ ...ficha, user: ficha.user ? { ...ficha.user, fechaNacimiento: e.target.value } : undefined, fechaNacimiento: e.target.value } as any)}
                                                                className="pl-11 h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre(s)</label>
                                                        <Input
                                                            value={ficha.user?.nombre || ficha.nombre || ''}
                                                            onChange={(e) => setFicha({ ...ficha, user: ficha.user ? { ...ficha.user, nombre: e.target.value } : undefined, nombre: e.target.value })}
                                                            placeholder="Nombres"
                                                            className="h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Apellidos</label>
                                                        <Input
                                                            value={ficha.user?.apellidos || ficha.apellidos || ''}
                                                            onChange={(e) => setFicha({ ...ficha, user: ficha.user ? { ...ficha.user, apellidos: e.target.value } : undefined, apellidos: e.target.value })}
                                                            placeholder="Apellidos"
                                                            className="h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Correo Electrónico Institucional</label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <Input
                                                                type="email"
                                                                value={ficha.user?.correo || (ficha as any).correo || ''}
                                                                onChange={(e) => {
                                                                    setFicha({ ...ficha, user: ficha.user ? { ...ficha.user, correo: e.target.value } : undefined, correo: e.target.value } as any);
                                                                    if (e.target.value !== originalEmail) {
                                                                        setIsEmailVerified(false);
                                                                    }
                                                                }}
                                                                placeholder="ejemplo@profe.edu.bo"
                                                                className="pl-11 pr-32 h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
                                                            />
                                                            {(ficha.user?.correo || (ficha as any).correo) !== originalEmail && (
                                                                <button
                                                                    type="button"
                                                                    disabled={isSendingVerification || countdown > 0 || isEmailVerified}
                                                                    onClick={handleRequestVerification}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
                                                                >
                                                                    {isEmailVerified ? (
                                                                        <span className="flex items-center gap-1 text-emerald-400 group"><CheckCircle className="w-3 h-3 text-emerald-400" /> Verificado</span>
                                                                    ) : (
                                                                        countdown > 0 ? `Reenviar en ${countdown}s` : 'Verificar'
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {showVerificationInput && !isEmailVerified && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1 italic">Ingresa el código que enviamos a tu nuevo correo:</label>
                                                            <div className="relative">
                                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                                                <Input
                                                                    value={verificationCode}
                                                                    onChange={(e) => {
                                                                        setVerificationCode(e.target.value);
                                                                        if (e.target.value.length === 6) {
                                                                            setIsEmailVerified(true);
                                                                            toast.success('Código ingresado correctamente');
                                                                        }
                                                                    }}
                                                                    placeholder="Código de 6 dígitos"
                                                                    className="pl-11 h-14 rounded-2xl bg-primary/5 border-primary/20 focus:bg-background"
                                                                    maxLength={6}
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sección 2: Perfil Profesional */}
                                            <div className="space-y-6 pt-6 border-t border-border/40">
                                                <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <FileText className="w-5 h-5" /> Perfil y Resumen
                                                </h3>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Resumen Profesional</label>
                                                    <textarea
                                                        value={ficha.resumenProfesional || ''}
                                                        onChange={(e) => setFicha({ ...ficha, resumenProfesional: e.target.value })}
                                                        placeholder="Describe tu trayectoria, logros y visión pedagógica..."
                                                        className="w-full h-40 p-6 rounded-[2rem] bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background transition-all resize-none text-sm font-medium leading-relaxed"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Celular de Contacto</label>
                                                        <Input
                                                            value={ficha.celular || ''}
                                                            onChange={(e) => setFicha({ ...ficha, celular: e.target.value })}
                                                            placeholder="Ej: 77889900"
                                                            className="h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">LinkedIn URL</label>
                                                        <div className="relative">
                                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <Input
                                                                value={ficha.linkedinUrl || ''}
                                                                onChange={(e) => setFicha({ ...ficha, linkedinUrl: e.target.value })}
                                                                placeholder="linkedin.com/in/perfil"
                                                                className="pl-11 h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Género / Sexo</label>
                                                        <select
                                                            value={ficha.genero || ''}
                                                            onChange={(e) => setFicha({ ...ficha, genero: e.target.value })}
                                                            className="w-full h-14 rounded-2xl bg-muted/30 border-transparent px-4 text-sm font-bold focus:bg-background outline-none"
                                                        >
                                                            <option value="">Seleccionar</option>
                                                            <option value="MASCULINO">MASCULINO</option>
                                                            <option value="FEMENINO">FEMENINO</option>
                                                            <option value="OTRO">OTRO</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado Civil</label>
                                                        <select
                                                            value={ficha.estadoCivil || ''}
                                                            onChange={(e) => setFicha({ ...ficha, estadoCivil: e.target.value })}
                                                            className="w-full h-14 rounded-2xl bg-muted/30 border-transparent px-4 text-sm font-bold focus:bg-background outline-none"
                                                        >
                                                            <option value="">Seleccionar</option>
                                                            <option value="SOLTERO(A)">SOLTERO(A)</option>
                                                            <option value="CASADO(A)">CASADO(A)</option>
                                                            <option value="DIVORCIADO(A)">DIVORCIADO(A)</option>
                                                            <option value="VIUDO(A)">VIUDO(A)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Dirección de Domicilio</label>
                                                    <Input
                                                        value={ficha.direccion || ''}
                                                        onChange={(e) => setFicha({ ...ficha, direccion: e.target.value })}
                                                        placeholder="Calle, Número, Zona..."
                                                        className="h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Habilidades Especiales</label>
                                                    <Input
                                                        value={ficha.habilidades || ''}
                                                        onChange={(e) => setFicha({ ...ficha, habilidades: e.target.value })}
                                                        placeholder="Ej: Liderazgo, Gestión Educativa, Inglés B2, TIC..."
                                                        className="h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Idiomas</label>
                                                        <Input
                                                            value={ficha.idiomas || ''}
                                                            onChange={(e) => setFicha({ ...ficha, idiomas: e.target.value })}
                                                            placeholder="Ej: Español, Quechua, Inglés..."
                                                            className="h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">LinkedIn URL</label>
                                                        <div className="relative">
                                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <Input
                                                                value={ficha.linkedinUrl || ''}
                                                                onChange={(e) => setFicha({ ...ficha, linkedinUrl: e.target.value })}
                                                                placeholder="linkedin.com/in/perfil"
                                                                className="pl-11 h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Experiencia Laboral Relevante</label>
                                                    <textarea
                                                        value={ficha.experienciaLaboral || ''}
                                                        onChange={(e) => setFicha({ ...ficha, experienciaLaboral: e.target.value })}
                                                        placeholder="Describe tus cargos anteriores más importantes..."
                                                        className="w-full h-32 p-6 rounded-[2rem] bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background transition-all resize-none text-sm font-medium leading-relaxed"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna Derecha: Formación y Magisterio (4/12) */}
                                    <div className="md:col-span-12 lg:col-span-4 space-y-10">
                                        <div className="p-8 rounded-[2.5rem] bg-muted/20 border border-border/50 space-y-8">
                                            <div className="space-y-6">
                                                <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <Award className="w-5 h-5" /> Formación Base
                                                </h3>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Licenciatura Univ.</label>
                                                        <Input
                                                            value={ficha.licUniversitaria || ''}
                                                            onChange={(e) => setFicha({ ...ficha, licUniversitaria: e.target.value })}
                                                            placeholder="Título Universitario"
                                                            className="h-12 rounded-xl bg-background border-border/40"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Licenciatura MESCP</label>
                                                        <Input
                                                            value={ficha.licMescp || ''}
                                                            onChange={(e) => setFicha({ ...ficha, licMescp: e.target.value })}
                                                            placeholder="Título MESCP"
                                                            className="h-12 rounded-xl bg-background border-border/40"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Hoja de Vida (PDF)</label>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`flex-1 h-12 rounded-xl flex items-center px-4 border ${ficha.hojaDeVidaPdf ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-dashed border-border/50'}`}>
                                                                {ficha.hojaDeVidaPdf ? (
                                                                    <div className="flex items-center justify-between w-full">
                                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                                            <FileText className="w-4 h-4 text-primary shrink-0" />
                                                                            <span className="text-[10px] font-bold text-primary truncate uppercase">CV_CARGADO.pdf</span>
                                                                        </div>
                                                                        <a href={IMG(ficha.hojaDeVidaPdf)} target="_blank" className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors text-primary" title="Previsualizar">
                                                                            <Eye className="w-4 h-4" />
                                                                        </a>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-muted-foreground/60">
                                                                        <FileText className="w-4 h-4" />
                                                                        <span className="text-[10px] font-bold uppercase italic">Sin archivo</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <label className="shrink-0 h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                                                <Upload className="w-4 h-4" />
                                                                <input type="file" accept=".pdf" className="hidden" onChange={(e) => onFileChange(e, 'cv')} />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-8 border-t border-border/40 space-y-6">
                                                <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <Briefcase className="w-5 h-5" /> Magisterio y Cargo
                                                </h3>

                                                <div className="p-5 bg-background rounded-2xl border border-border/40 space-y-4 shadow-inner">
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={ficha.esMaestro}
                                                            onChange={(e) => setFicha({ ...ficha, esMaestro: e.target.checked })}
                                                            className="w-5 h-5 rounded-lg accent-primary cursor-pointer"
                                                        />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Personal Magisterio</span>
                                                    </label>

                                                    <AnimatePresence>
                                                        {ficha.esMaestro && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="space-y-4 pt-2"
                                                            >
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Número RDA</label>
                                                                    <div className="relative">
                                                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                                        <Input
                                                                            type="number"
                                                                            value={ficha.user?.rda || ficha.rda || ''}
                                                                            onChange={(e) => setFicha({ ...ficha, rda: e.target.value })}
                                                                            placeholder="Registro Docente"
                                                                            className="pl-9 h-10 rounded-lg bg-muted/20 border-transparent text-xs font-bold"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Certificado RDA (PDF)</label>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`flex-1 h-10 rounded-lg flex items-center px-3 border ${ficha.rdaPdf ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-dashed border-border/50'}`}>
                                                                            {ficha.rdaPdf ? (
                                                                                <div className="flex items-center justify-between w-full">
                                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                                        <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                                        <span className="text-[9px] font-bold text-emerald-600 truncate uppercase">RDA_CARGADO.pdf</span>
                                                                                    </div>
                                                                                    <a href={IMG(ficha.rdaPdf)} target="_blank" className="p-1.5 hover:bg-emerald-500/10 rounded-lg transition-colors text-emerald-600" title="Previsualizar">
                                                                                        <Eye className="w-3.5 h-3.5" />
                                                                                    </a>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center gap-2 text-muted-foreground/50">
                                                                                    <FileText className="w-3.5 h-3.5" />
                                                                                    <span className="text-[9px] font-bold uppercase italic">Sin archivo</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <label className="shrink-0 h-10 w-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                                                                            <Upload className="w-3.5 h-3.5" />
                                                                            <input type="file" accept=".pdf" className="hidden" onChange={(e) => onFileChange(e, 'rda')} />
                                                                        </label>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Categoría</label>
                                                                    <select
                                                                        value={ficha.categoriaId || ''}
                                                                        onChange={(e) => setFicha({ ...ficha, categoriaId: e.target.value })}
                                                                        className="w-full h-10 rounded-lg bg-muted/20 border-transparent text-xs font-bold px-3 outline-none"
                                                                    >
                                                                        <option value="">Selecciona categoría</option>
                                                                        {config.categorias.map((c: any) => (
                                                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Cargo Actual</label>
                                                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                                        <p className="text-[11px] font-black uppercase text-primary leading-tight">
                                                            {ficha.cargoPostulacion?.nombre || config.cargos.find((c: any) => c.id === (ficha.cargoPostulacionId || ficha.cargoId))?.nombre || 'No definido'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                                    <Button type="submit" disabled={submitting} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl">
                                        {submitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </Card>
                        </form>
                    </motion.div>
                )}

                {activeTab === 'posgrados' && (
                    <motion.div
                        key="posgrados"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Diplomados, Especialidades y Maestrías</h2>
                            <Button onClick={openCreatePosgrado} className="rounded-2xl h-12">
                                <Plus className="w-5 h-5 mr-2" /> Agregar Grado
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {ficha.postgrados?.length ? ficha.postgrados.map((p: any) => (
                                <Card key={p.id} className="p-8 rounded-[3rem] border-border/40 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-background to-muted/20">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="space-y-4 flex-1">
                                            <div className="px-4 py-1.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest w-fit rounded-full border border-primary/20">
                                                {p.tipoPosgrado?.nombre}
                                            </div>
                                            <h4 className="text-2xl font-black dark:text-white uppercase tracking-tight line-clamp-2 leading-none">{p.titulo}</h4>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-wider bg-muted/50 w-fit px-3 py-1 rounded-lg">
                                                <Calendar className="w-3.5 h-3.5 text-primary" /> {new Date(p.fecha).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditPosgrado(p)}
                                                className="p-3 bg-primary/10 text-primary rounded-2xl hover:bg-primary hover:text-white"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePosgrado(p.id)}
                                                className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    {p.imagen && (
                                        <div className="mt-6 aspect-video rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-slate-50 relative group">
                                            <img
                                                src={getImageUrl(p.imagen)}
                                                alt="Diploma"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <a
                                                    href={getImageUrl(p.imagen)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl"
                                                >
                                                    Ver pantalla completa
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            )) : (
                                <div className="col-span-full py-20 bg-gray-50 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
                                    <GraduationCap className="w-16 h-16 text-gray-300" />
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No has registrado postgrados todavía.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'produccion' && (
                    <motion.div
                        key="produccion"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Producción Intelectual</h2>
                            <Button onClick={openCreateProduccion} className="rounded-2xl h-12 bg-primary">
                                <Plus className="w-5 h-5 mr-2" /> Registrar Publicación
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {ficha.produccionIntelectual?.length ? ficha.produccionIntelectual.map((p: any) => (
                                <Card key={p.id} className="p-8 rounded-[3rem] border-border/40 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 relative group overflow-hidden bg-gradient-to-br from-background to-muted/20">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-xl group-hover:bg-primary/10 transition-colors"></div>
                                    <div className="space-y-6 relative z-10">
                                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-[1.2rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <Book className="w-7 h-7" />
                                        </div>
                                        <h4 className="text-lg font-black dark:text-white uppercase tracking-tight line-clamp-3 min-h-[4rem] leading-tight">{p.titulo}</h4>
                                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                            <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{p.anioPublicacion}</span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditProduccion(p)}
                                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduccion(p.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )) : (
                                <div className="col-span-full py-20 bg-gray-50 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
                                    <Book className="w-16 h-16 text-gray-300" />
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Aún no has registrado publicaciones.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
                {activeTab === 'evaluaciones' && (
                    <motion.div
                        key="evaluaciones"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Historial de Hojas de Concepto</h2>
                        </div>

                        {evaluations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {evaluations.map((ev) => (
                                    <Card key={ev.id} className="p-6 rounded-[2.5rem] border-border/40 shadow-sm hover:shadow-xl transition-all group bg-gradient-to-br from-background to-emerald-500/5">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-start">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                    <ClipboardSignature className="w-6 h-6" />
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Puntaje Total</div>
                                                    <div className="text-2xl font-black text-emerald-600">{ev.puntajeTotal} / 100</div>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black uppercase tracking-tight">{ev.periodoEval?.gestion} - {ev.periodoEval?.periodo}</h4>
                                                <p className="text-[10px] font-medium text-muted-foreground italic leading-tight">
                                                    Verificación: <span className="font-bold text-primary">{ev.codigoVerificacion}</span>
                                                </p>
                                            </div>

                                            <Button
                                                onClick={() => handleDownloadConcepto(ev.id)}
                                                variant="outline"
                                                className="w-full h-11 rounded-xl bg-background border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white font-black text-[10px] uppercase transition-all"
                                            >
                                                <FileDown className="w-4 h-4 mr-2" /> Descargar PDF
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-12 text-center rounded-[3rem] border-dashed border-2 border-border/60 bg-muted/20">
                                <div className="space-y-4">
                                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                        <ClipboardSignature className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black uppercase tracking-tight">Sin evaluaciones registradas</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                            Aún no cuentas con evaluaciones en tu historial para las gestiones actuales.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </motion.div>
                )}

                {activeTab === 'cuenta' && ficha && (
                    <motion.div
                        key="cuenta"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <Card className="p-10 border-border/40 shadow-2xl bg-card rounded-[3rem]">
                            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-border">
                                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-md font-black uppercase tracking-tighter text-foreground leading-none">Seguridad y Cuenta</h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Gestiona tus credenciales de acceso</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleUpdatePersonal(e); }} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-12">
                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Edit2 className="w-4 h-4" /> Datos de Identidad
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombres</label>
                                                <Input
                                                    value={ficha.user?.nombre || ficha.nombre || ''}
                                                    onChange={(e) => setFicha({ ...ficha, user: ficha.user ? { ...ficha.user, nombre: e.target.value } : undefined, nombre: e.target.value })}
                                                    className="h-11 rounded-xl bg-muted/30 border-transparent focus:bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Apellidos</label>
                                                <Input
                                                    value={ficha.user?.apellidos || ficha.apellidos || ''}
                                                    onChange={(e) => setFicha({ ...ficha, user: ficha.user ? { ...ficha.user, apellidos: e.target.value } : undefined, apellidos: e.target.value })}
                                                    className="h-11 rounded-xl bg-muted/30 border-transparent focus:bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Correo Electrónico (No modificable)</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                                                    <Input
                                                        value={ficha.user?.correo || ficha.correo || ''}
                                                        disabled
                                                        className="pl-11 h-11 rounded-xl bg-muted/50 border-border text-muted-foreground cursor-not-allowed italic font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Lock className="w-4 h-4" /> Actualizar Contraseña
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                                <Input
                                                    type="password"
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                    placeholder="Dejar en blanco para no cambiar"
                                                    className="h-11 rounded-xl bg-muted/30 border-transparent focus:bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
                                                <Input
                                                    type="password"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                    placeholder="Repite la contraseña"
                                                    className="h-11 rounded-xl bg-muted/30 border-transparent focus:bg-background"
                                                />
                                            </div>
                                            {passwordForm.newPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                                                <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest animate-pulse">Las contraseñas no coinciden</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-border flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center gap-3"
                                    >
                                        {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                                        Actualizar Seguridad y Cuenta
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODALS */}
            <Modal isOpen={showPosgradoModal} onClose={() => setShowPosgradoModal(false)} title={editingPosgradoId ? "Editar Grado Académico" : "Agregar Grado Académico"}>
                <form onSubmit={handleAddPosgrado} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Grado</label>
                        <select
                            required
                            value={posgradoForm.tipoPosgradoId}
                            onChange={(e) => setPosgradoForm({ ...posgradoForm, tipoPosgradoId: e.target.value })}
                            className="w-full h-12 bg-gray-50 rounded-xl border-transparent px-4 text-xs font-bold"
                        >
                            <option value="">Selecciona tipo</option>
                            {config.tiposPosgrado.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título Obtenido</label>
                        <Input
                            required
                            placeholder="Ej: Posgrado en Entornos Virtuales"
                            value={posgradoForm.titulo}
                            onChange={(e) => setPosgradoForm({ ...posgradoForm, titulo: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha de Emisión</label>
                        <Input
                            type="date"
                            required
                            value={posgradoForm.fecha}
                            onChange={(e) => setPosgradoForm({ ...posgradoForm, fecha: e.target.value })}
                        />
                    </div>
                    <div className="p-1 relative">
                        {uploading ? (
                            <div className="p-10 border-2 border-dashed border-primary/30 rounded-3xl flex flex-col items-center justify-center space-y-4 bg-primary/5">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Subiendo Archivo...</span>
                            </div>
                        ) : posgradoForm.imagen ? (
                            <div className="aspect-video rounded-3xl overflow-hidden relative group border-2 border-primary/20">
                                <img
                                    src={getImageUrl(posgradoForm.imagen)}
                                    className="w-full h-full object-contain bg-slate-100"
                                    alt="Diploma"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <label className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-gray-100 transition-colors">Cambiar Imagen</label>
                                    <button
                                        type="button"
                                        onClick={() => setPosgradoForm({ ...posgradoForm, imagen: '' })}
                                        className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, 'posgrado')} />
                                </div>
                            </div>
                        ) : (
                            <label className="p-10 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center space-y-4 hover:border-primary-500 transition-colors cursor-pointer bg-gray-50/50">
                                <Upload className="w-8 h-8 text-gray-400" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Subir Imagen del Título</span>
                                <p className="text-[9px] text-gray-400 uppercase tracking-tighter">JPG, PNG (Max. 5MB)</p>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, 'posgrado')} />
                            </label>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={submitting || uploading}
                        className="w-full h-14 rounded-2xl uppercase font-black tracking-widest shadow-lg shadow-primary/20"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Registro'}
                    </Button>
                </form>
            </Modal>

            <Modal isOpen={showProduccionModal} onClose={() => setShowProduccionModal(false)} title={editingProduccionId ? "Editar Producción Intelectual" : "Registrar Producción Intelectual"}>
                <form onSubmit={handleAddProduccion} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título de la Obra o Artículo</label>
                        <Input
                            required
                            placeholder="Ej: El impacto de las TIC en el aula"
                            value={produccionForm.titulo}
                            onChange={(e) => setProduccionForm({ ...produccionForm, titulo: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Año de Publicación</label>
                        <Input
                            type="number"
                            required
                            min={1950}
                            max={2026}
                            value={produccionForm.anioPublicacion}
                            onChange={(e) => setProduccionForm({ ...produccionForm, anioPublicacion: parseInt(e.target.value) })}
                        />
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl uppercase font-black tracking-widest bg-primary hover:opacity-90 shadow-primary/20">Finalizar Registro</Button>
                </form>
            </Modal>
        </div>
    );
}

const scaleUp = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', damping: 20 }
};
