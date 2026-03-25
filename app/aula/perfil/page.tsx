'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAula } from '@/contexts/AulaContext';
import { aulaService } from '@/services/aulaService';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import {
    User, Mail, Shield, Camera, Settings, LogOut, CheckCircle2,
    UserCircle, Phone, MapPin, Calendar, Heart, Facebook, Link as LinkIcon,
    Edit3, Save, X, Loader2, FileText, Briefcase, Globe, Lock, Bell, Moon, Sun,
    Eye, EyeOff, ShieldCheck, Activity, Zap, Info
} from 'lucide-react';
import React from 'react';
import { cn, getImageUrl } from '@/lib/utils';
import { uploadService } from '@/services/uploadService';
import { toast } from 'sonner';

export default function PerfilPage() {
    const { user, logout, updateUser } = useAuth();
    const { theme, toggleTheme } = useAula();
    const [activeTab, setActiveTab] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: '', next: '', confirm: '' });
    const [newPhoto, setNewPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        nombre: user?.nombre || '',
        apellidos: user?.apellidos || '',
        celular: user?.celular || '',
        direccion: user?.direccion || '',
        facebook: user?.facebook || '',
        tiktok: user?.tiktok || '',
        resumenProfesional: user?.resumenProfesional || '',
        habilidades: user?.habilidades || '',
        idiomas: user?.idiomas || '',
    });

    const [camposExtra, setCamposExtra] = useState<any[]>([]);
    const [respuestasExtra, setRespuestasExtra] = useState<Record<string, string>>({});

    React.useEffect(() => {
        const loadPerfil = async () => {
            try {
                const fullUser = await aulaService.getPerfil();
                updateUser(fullUser);
                // Sync form data with full user
                setFormData({
                    nombre: fullUser.nombre || '',
                    apellidos: fullUser.apellidos || '',
                    celular: fullUser.celular || '',
                    direccion: fullUser.direccion || '',
                    facebook: fullUser.facebook || '',
                    tiktok: fullUser.tiktok || '',
                    resumenProfesional: fullUser.resumenProfesional || '',
                    habilidades: fullUser.habilidades || '',
                    idiomas: fullUser.idiomas || '',
                });
            } catch (err) {
                console.error("Error loading full profile:", err);
            }
        };

        const loadCampos = async () => {
            try {
                const data = await aulaService.getCamposExtraPerfil();
                setCamposExtra(data);
                const initResp: Record<string, string> = {};
                data.forEach((c: any) => {
                    initResp[c.id] = c.valorActual || '';
                });
                setRespuestasExtra(initResp);
                
                // Si hay campos obligatorios vacíos, se fuerza la edición y alerta
                const hasMissing = data.some((c: any) => c.esObligatorio && !c.valorActual);
                if (hasMissing) {
                    setIsEditing(true);
                    toast.warning('Debe completar su información institucional obligatoria.');
                }
            } catch (err) {
                console.error("Error loading campos extra:", err);
            }
        };
        
        loadPerfil();
        loadCampos();
    }, []);

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            const payload: any = {};
            // Sólo los campos editables
            if (formData.direccion !== undefined) payload.direccion = formData.direccion;
            if (formData.facebook !== undefined) payload.facebook = formData.facebook;
            if (formData.tiktok !== undefined) payload.tiktok = formData.tiktok;
            if (formData.resumenProfesional !== undefined) payload.resumenProfesional = formData.resumenProfesional;
            if (formData.habilidades !== undefined) payload.habilidades = formData.habilidades;
            if (formData.idiomas !== undefined) payload.idiomas = formData.idiomas;

            if (formData.celular && formData.celular.toString().trim() !== '') {
                payload.celular = Number(formData.celular);
            } else {
                payload.celular = null;
            }

            // Validar campos obligatorios
            const missing = camposExtra.find(c => c.esObligatorio && (!respuestasExtra[c.id] || respuestasExtra[c.id].trim() === ''));
            if (missing) {
                setIsLoading(false);
                return toast.error(`El campo "${missing.label}" es obligatorio.`);
            }

            if (newPhoto) {
                setIsUploading(true);
                try {
                    const response = await uploadService.uploadFile(newPhoto, 'usuarios');
                    if (response.success) {
                        const resData = response as any;
                        payload.imagen = resData.data?.path || resData.path;
                    }
                } catch (error) {
                    toast.error('Error al subir la imagen');
                    setIsLoading(false);
                    return;
                } finally {
                    setIsUploading(false);
                }
            }

            const updatedResponse = await aulaService.actualizarPerfil(payload);
            
            // Save extra fields
            const formatRespuestas = Object.entries(respuestasExtra).map(([id, val]) => ({ campoExtraId: id, valor: String(val) }));
            if (formatRespuestas.length > 0) {
                await aulaService.guardarRespuestasCamposExtra(formatRespuestas);
            }

            if (updatedResponse.user) {
                updateUser(updatedResponse.user);
            }
            setIsEditing(false);
            setNewPhoto(null);
            setPhotoPreview(null);
            toast.success('Perfil institucional actualizado');
        } catch (error: any) {
            console.error('Validation error:', error);
            const msg = error.response?.data?.message || 'Error de validación';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.next !== passwordData.confirm) {
            return toast.error('Las contraseñas no coinciden');
        }
        if (passwordData.next.length < 6) {
            return toast.error('Mínimo 6 caracteres');
        }

        setIsLoading(true);
        try {
            await aulaService.actualizarPerfil({ password: passwordData.next } as any);
            toast.success('Contraseña actualizada');
            setIsPasswordModalOpen(false);
            setPasswordData({ current: '', next: '', confirm: '' });
        } catch (error) {
            toast.error('Error al actualizar contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setNewPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const tabs = [
        { id: 'personal', label: 'Datos Personales', icon: UserCircle },
        { id: 'profesional', label: 'Trayectoria Profesional', icon: Briefcase },
        { id: 'config', label: 'Seguridad y Cuenta', icon: Settings },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-32 relative pt-6 px-4">
            {/* Background Texture Detail */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 space-y-8">
                {/* Institutional Header Banner - Rediseñado sin degradados */}
                <div className={cn(
                    "relative overflow-hidden rounded-[2rem] shadow-xl border transition-all",
                    theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                )}>
                    {/* Top Solid Banner */}
                    <div className="h-56 lg:h-64 relative bg-[var(--aula-primary)] overflow-hidden">
                        {/* Abstract Pattern */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" 
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} 
                        />
                        
                        <div className="absolute top-6 right-6 lg:top-8 lg:right-10 px-5 py-2.5 bg-black/20 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3 shadow-lg">
                            <ShieldCheck className="text-white" size={16} />
                            <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] hidden sm:block">Perfil Verificado</p>
                        </div>
                    </div>

                    <div className="px-6 lg:px-10 pb-10">
                        <div className="relative flex flex-col lg:flex-row gap-8 lg:gap-10 items-center lg:items-start pt-6 lg:pt-0">
                            {/* Visual Identity */}
                            <div className="relative shrink-0 group z-10 -mt-20 lg:-mt-24 w-full flex justify-center lg:w-auto lg:block">
                                <div className={cn(
                                    "w-40 h-40 lg:w-48 lg:h-48 rounded-[2.5rem] border-8 overflow-hidden shadow-2xl relative transition-all duration-500 group-hover:scale-[1.02]",
                                    theme === 'dark' ? "border-slate-900 bg-slate-800 shadow-black/50" : "border-white bg-slate-100 shadow-primary/10"
                                )}>
                                    {photoPreview || user?.imagen ? (
                                        <img src={photoPreview ? photoPreview : (user?.imagen ? getImageUrl(user.imagen) : '')} alt={user?.nombre || 'Perfil'} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <UserCircle size={64} strokeWidth={1} />
                                        </div>
                                    )}
                                    {isUploading && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                            <Loader2 className="animate-spin text-white" size={32} />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => isEditing && fileInputRef.current?.click()}
                                        className={cn(
                                            "absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center text-white",
                                            isEditing ? "opacity-0 group-hover:opacity-100 cursor-pointer" : "hidden"
                                        )}
                                    >
                                        <Camera size={28} />
                                    </button>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />

                                {/* Status Indicator */}
                                <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900" />
                            </div>

                            {/* Info & Actions */}
                            <div className="flex-1 space-y-6 pt-2 lg:pt-4 w-full mb-2 lg:pb-2">
                                <div className="space-y-4 text-center lg:text-left">
                                    <div className="flex flex-col lg:flex-row items-center lg:items-center gap-4 mt-2 lg:mt-0">
                                        <div className="space-y-2">
                                            <div className="inline-flex px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/20">
                                                {((user?.roles?.[0] as any)?.role?.name) || (user as any)?.rol || 'Consultor'}
                                            </div>
                                            <h1 className={cn("text-4xl lg:text-5xl font-black tracking-tight leading-none", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                                {user?.nombre} <span className="text-slate-400">{user?.apellidos}</span>
                                            </h1>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                        <span className="flex items-center gap-2"><Mail size={14} className="text-primary" /> {user?.email}</span>
                                        <span className="flex items-center gap-2"><MapPin size={14} className="text-amber-500" /> {user?.direccion || 'Sede Central'}</span>
                                        <span className="flex items-center gap-2"><Phone size={14} className="text-emerald-500" /> {user?.celular || 'Sin contacto'}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                                    <button
                                        onClick={() => {
                                            if (isEditing) {
                                                setNewPhoto(null);
                                                setPhotoPreview(null);
                                            }
                                            setIsEditing(!isEditing)
                                        }}
                                        className={cn(
                                            "px-8 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl",
                                            isEditing
                                                ? "bg-rose-50 text-rose-600 shadow-rose-500/10 hover:bg-rose-100 border border-rose-200"
                                                : "bg-primary text-white shadow-primary/20 hover:scale-105 active:scale-95"
                                        )}
                                    >
                                        {isEditing ? <><X size={14} /> Cancelar</> : <><Edit3 size={14} /> Editar Perfil</>}
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="px-8 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-100 dark:border-rose-500/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={16} /> Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className={cn(
                        "flex overflow-x-auto px-6 lg:px-10 py-5 gap-3 border-t",
                        theme === 'dark' ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/80"
                    )}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3.5 rounded-2xl whitespace-nowrap transition-all font-black text-[10px] uppercase tracking-widest shrink-0",
                                    activeTab === tab.id
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                                        : "bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-slate-500 hover:text-primary hover:border-primary/30 shadow-sm"
                                )}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-12">
                        {activeTab === 'personal' && (
                            <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="px-4 border-l-4 border-primary">
                                    <h3 className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>Datos Personales</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Información de contacto institucional</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                        { label: 'Nombres', key: 'nombre', icon: UserCircle, readonly: true },
                                        { label: 'Apellidos', key: 'apellidos', icon: UserCircle, readonly: true },
                                        { label: 'Carnet de Identidad', key: 'ci', icon: Shield, readonly: true },
                                        { label: 'Correo Electrónico', key: 'email', icon: Mail, readonly: true },
                                        { label: 'Fecha de Nacimiento', key: 'fechaNacimiento', icon: Calendar, readonly: true },
                                        { label: 'Celular', key: 'celular', icon: Phone, readonly: false },
                                        { label: 'Dirección', key: 'direccion', icon: MapPin, readonly: false },
                                        { label: 'Facebook', key: 'facebook', icon: Facebook, readonly: false },
                                        { label: 'TikTok', key: 'tiktok', icon: Globe, readonly: false },
                                    ].map((field) => (
                                        <div key={field.key} className="space-y-3">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                                                <field.icon size={12} className="text-primary" />
                                                {field.label} {field.readonly && <span className="text-slate-400 font-medium">(No editable)</span>}
                                            </label>
                                            <input
                                                type="text"
                                                value={field.readonly ? (user as any)?.[field.key] || '' : (formData as any)[field.key] || ''}
                                                onChange={(e) => {
                                                    if (!field.readonly) {
                                                        setFormData({ ...formData, [field.key]: e.target.value })
                                                    }
                                                }}
                                                disabled={!isEditing || field.readonly}
                                                className={cn(
                                                    "w-full h-14 px-6 rounded-2xl border-2 transition-all text-sm font-bold",
                                                    (isEditing && !field.readonly)
                                                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none shadow-sm cursor-text"
                                                        : "bg-slate-50 dark:bg-slate-800/80 border-transparent text-slate-600 dark:text-slate-400 cursor-not-allowed opacity-80"
                                                )}
                                                placeholder={`Ingrese ${field.label.toLowerCase()}...`}
                                            />
                                        </div>
                                    ))}

                                    {/* CAMPOS EXTRA DINÁMICOS */}
                                    {camposExtra.length > 0 && camposExtra.map(campo => (
                                        <div key={campo.id} className="space-y-3 relative">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                                                <Info size={12} className={campo.esObligatorio ? "text-rose-500" : "text-primary"} />
                                                <label>{campo.label}</label>
                                                {campo.esObligatorio && <span className="text-rose-500">*</span>}
                                                {campo.esObligatorio && (!respuestasExtra[campo.id] || respuestasExtra[campo.id].trim() === '') && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="ml-auto flex items-center gap-1 bg-rose-500/10 text-rose-500 px-2.5 py-1 rounded-full border border-rose-500/20"
                                                    >
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                        </span>
                                                        <span className="text-[8px] font-black tracking-widest">FALTA COMPLETAR</span>
                                                    </motion.div>
                                                )}
                                            </div>
                                            
                                            {campo.tipo === 'TEXTO' && (
                                                <input
                                                    type="text"
                                                    value={respuestasExtra[campo.id] || ''}
                                                    onChange={(e) => setRespuestasExtra({ ...respuestasExtra, [campo.id]: e.target.value })}
                                                    disabled={!isEditing}
                                                    className={cn(
                                                        "w-full h-14 px-6 rounded-2xl border-2 transition-all text-sm font-bold shadow-sm",
                                                        isEditing
                                                            ? (campo.esObligatorio && (!respuestasExtra[campo.id] || respuestasExtra[campo.id].trim() === ''))
                                                                ? "bg-rose-50 dark:bg-rose-900/10 border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none"
                                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                                                            : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-400 cursor-not-allowed"
                                                    )}
                                                    placeholder={`Ingrese ${campo.label.toLowerCase()}...`}
                                                />
                                            )}

                                            {campo.tipo === 'BOOLEAN' && (
                                                <div className="h-14 flex items-center">
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={respuestasExtra[campo.id] === 'true'}
                                                            onChange={(e) => setRespuestasExtra({ ...respuestasExtra, [campo.id]: e.target.checked ? 'true' : 'false' })}
                                                            disabled={!isEditing}
                                                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary transition-all"
                                                        />
                                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Marcar si aplica</span>
                                                    </label>
                                                </div>
                                            )}

                                            {(campo.tipo === 'SINGLE_SELECT' || campo.tipo === 'MULTIPLE_SELECT') && (
                                                <select
                                                    value={respuestasExtra[campo.id] || ''}
                                                    onChange={(e) => setRespuestasExtra({ ...respuestasExtra, [campo.id]: e.target.value })}
                                                    disabled={!isEditing}
                                                    className={cn(
                                                        "w-full h-14 px-6 rounded-2xl border-2 transition-all text-sm font-bold appearance-none",
                                                        isEditing
                                                            ? (campo.esObligatorio && (!respuestasExtra[campo.id] || respuestasExtra[campo.id].trim() === ''))
                                                                ? "bg-rose-50 dark:bg-rose-900/10 border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none"
                                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                                                            : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-400 cursor-not-allowed"
                                                    )}
                                                >
                                                    <option value="" disabled>Seleccionar opción...</option>
                                                    {campo.opciones && Array.isArray(campo.opciones) && campo.opciones.map((opt: any, idx: number) => (
                                                        <option key={idx} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={handleUpdate}
                                            disabled={isLoading}
                                            className="px-10 h-14 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                            Guardar Cambios
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}

                        {activeTab === 'profesional' && (
                            <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="px-4 border-l-4 border-amber-500">
                                    <h3 className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>Trayectoria Profesional</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resumen de experiencia y habilidades</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                                        <FileText size={12} className="text-amber-500" />
                                        Descripción Perfil
                                    </label>
                                    <textarea
                                        value={formData.resumenProfesional}
                                        onChange={(e) => setFormData({ ...formData, resumenProfesional: e.target.value })}
                                        disabled={!isEditing}
                                        rows={8}
                                        className={cn(
                                            "w-full p-8 rounded-2xl border-2 transition-all text-sm font-medium leading-relaxed resize-none",
                                            isEditing
                                                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none"
                                                : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-400 cursor-not-allowed"
                                        )}
                                        placeholder="Breve resumen de trayectoria..."
                                    />
                                </div>
                            </section>
                        )}

                        {activeTab === 'config' && (
                            <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="px-4 border-l-4 border-slate-500">
                                    <h3 className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>Configuración de Cuenta</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Seguridad y preferencias del sistema</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className={cn(
                                        "p-8 rounded-2xl border space-y-6",
                                        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                                <Lock size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase">Seguridad</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Cambiar contraseña</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsPasswordModalOpen(true)}
                                            className="w-full h-12 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                                        >
                                            Gestionar
                                        </button>
                                    </div>

                                    <div className={cn(
                                        "p-8 rounded-2xl border space-y-6",
                                        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                                {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase">Modo Visual</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Tema actual: {theme}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleTheme}
                                            className="w-full h-12 bg-slate-50 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all"
                                        >
                                            Alternar tema
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar Stats Area */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className={cn(
                            "p-8 rounded-[2.5rem] border space-y-8 relative overflow-hidden",
                            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
                        )}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Estado Global</h4>
                                    <Activity size={16} className="text-primary" />
                                </div>
                                <div className="space-y-5">
                                    {[
                                        { label: 'Habilitación Académica', value: 'Completa', color: 'text-emerald-500' },
                                        { label: 'Registros Aula', value: 'v2.5.0', color: 'text-slate-400 text-[8px]' },
                                        { label: 'Último Acceso', value: 'Hoy', color: 'text-slate-500' },
                                    ].map((s, i) => (
                                        <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                                            <span className={cn("text-[10px] font-black uppercase", s.color)}>{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-primary rounded-[2rem] text-white space-y-6 shadow-xl shadow-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldCheck size={120} />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                    <Zap size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-lg font-black leading-tight uppercase">Soporte PROFE</h4>
                                    <p className="text-[10px] font-medium text-white/70 uppercase tracking-widest leading-relaxed">Central de asistencia técnica y administrativa disponible.</p>
                                </div>
                                <button className="w-full h-12 bg-white text-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all">
                                    Contactar Soporte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            <AnimatePresence>
                {isPasswordModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={cn(
                                "w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl relative",
                                theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white"
                            )}
                        >
                            <button onClick={() => setIsPasswordModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>

                            <div className="space-y-8">
                                <div className="space-y-1">
                                    <h3 className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>Seguridad</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cambio de credenciales oficiales</p>
                                </div>

                                <div className="space-y-5">
                                    {['next', 'confirm'].map((k) => (
                                        <div key={k} className="space-y-3">
                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">{k === 'next' ? 'Nueva Contraseña' : 'Confirmar'}</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={(passwordData as any)[k]}
                                                    onChange={(e) => setPasswordData({ ...passwordData, [k]: e.target.value })}
                                                    className={cn(
                                                        "w-full h-12 px-5 rounded-xl border transition-all text-sm font-bold bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none",
                                                        theme === 'dark' ? "text-white border-slate-800" : "border-slate-100"
                                                    )}
                                                    placeholder="••••••••"
                                                />
                                                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex justify-center pt-2">
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={isLoading}
                                            className="w-full max-w-[240px] h-12 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Actualizar Credencial'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
