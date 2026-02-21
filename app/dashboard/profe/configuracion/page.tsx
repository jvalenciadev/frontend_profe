'use client';

import { Shield, Settings, Info, Share2, MapPin, Save, Loader2, Image as ImageIcon, Globe, Facebook, Youtube, Palette, Hash } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useState, useEffect } from 'react';
import { profeService, Profe } from '@/services/profeService';
import { uploadService } from '@/services/uploadService';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useProfe } from '@/contexts/ProfeContext';

export default function ProfeConfigPage() {
    const { refreshConfig } = useProfe();
    const [config, setConfig] = useState<Profe | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'vision' | 'social' | 'media' | 'legal'>('general');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await profeService.get();
            if (data) {
                // El backend puede devolver un objeto o un array de un solo elemento
                const configData = Array.isArray(data) ? data[0] : data;
                if (configData && configData.id) {
                    setConfig(configData);
                }
            }
        } catch (error) {
            toast.error('Error al cargar la configuración institucional');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!config) return;
        try {
            setSaving(true);
            await profeService.update(config.id, config);
            await refreshConfig();
            toast.success('Configuración actualizada correctamente');
        } catch (error) {
            toast.error('Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof Profe) => {
        const file = e.target.files?.[0];
        if (!file || !config) return;

        try {
            setSaving(true);
            const result = await uploadService.uploadFile(file, 'profe');
            const newConfig = { ...config, [field]: result.data.path };
            setConfig(newConfig);
            await profeService.update(config.id, newConfig);
            await refreshConfig();
            toast.success('Imagen cargada y guardada');
        } catch (error) {
            toast.error('Error al subir la imagen');
        } finally {
            setSaving(false);
        }
    };

    const handleCreate = async () => {
        try {
            setSaving(true);
            const defaultData: Partial<Profe> = {
                nombre: 'PROFE - Programa de Formación de Especialistas',
                nombreAbreviado: 'PROFE',
                actividad: 'Educación y Formación',
                descripcion: 'Plataforma de gestión institucional',
                sobreNosotros: 'Descripción de la institución...',
                mision: 'Nuestra misión...',
                vision: 'Nuestra visión...',
                ubicacion: 'Sin ubicación',
                fechaCreacion: new Date().toISOString(),
                banner: '',
                imagen: '',
                afiche: '',
                convocatoria: '',
                color: '#1474a6',
                colorSecundario: '#4f46e5',
            };
            const newData = await profeService.create(defaultData);
            setConfig(newData);
            await refreshConfig();
            toast.success('Configuración inicializada correctamente');
        } catch (error) {
            toast.error('Error al inicializar la configuración');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-10 text-center space-y-8 max-w-2xl mx-auto">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                    <Shield className="w-32 h-32 mx-auto text-primary relative z-10 opacity-40" />
                </motion.div>

                <div className="space-y-4 relative z-10">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Configuración <span className="text-primary italic">Inexistente</span></h2>
                    <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                        Parece que es la primera vez que accedes al módulo. Para comenzar a gestionar la identidad de la plataforma, es necesario inicializar el registro base.
                    </p>
                </div>

                <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="group relative h-20 px-12 rounded-[30px] bg-primary text-white font-black text-sm uppercase tracking-[0.3em] overflow-hidden hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.4)] transition-all active:scale-95 disabled:opacity-50"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="relative flex items-center gap-4">
                        {saving ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                        )}
                        <span>Inicializar Datos de PROFE</span>
                    </div>
                </button>
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: 'Datos Generales', icon: Info },
        { id: 'vision', label: 'Misión y Visión', icon: Shield },
        { id: 'social', label: 'Contacto y Redes', icon: Share2 },
        { id: 'media', label: 'Identidad Visual', icon: ImageIcon },
        { id: 'legal', label: 'Convocatoria y Legal', icon: Globe },
    ];

    return (
        <div className="p-6 md:p-10 space-y-10 max-w-[1200px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <Settings className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            Datos <span className="text-primary italic">Institucionales</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium ml-1">
                        Configura la identidad, misión, visión y presencia digital de PROFE.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Cambios
                </button>
            </div>

            {/* Content Tabs */}
            <div className="flex gap-2 bg-muted/20 p-2 rounded-[24px] border border-border/40 overflow-x-auto scrollbar-none">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                                active
                                    ? "bg-white text-primary shadow-xl scale-[1.02]"
                                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", active && "animate-pulse")} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Forms */}
            <div className="bg-card border border-border/40 rounded-[40px] p-8 md:p-12 shadow-sm">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                >
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre de la Institución</label>
                                <input
                                    type="text"
                                    className="w-full h-14 px-5 rounded-2xl bg-muted/30 border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    value={config.nombre}
                                    onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre Abreviado</label>
                                <input
                                    type="text"
                                    className="w-full h-14 px-5 rounded-2xl bg-muted/30 border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    placeholder="Ej: PROFE"
                                    value={config.nombreAbreviado || ''}
                                    onChange={(e) => setConfig({ ...config, nombreAbreviado: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Actividad Principal</label>
                                <input
                                    type="text"
                                    className="w-full h-14 px-5 rounded-2xl bg-muted/30 border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    value={config.actividad}
                                    onChange={(e) => setConfig({ ...config, actividad: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha de Creación</label>
                                <input
                                    type="date"
                                    className="w-full h-14 px-5 rounded-2xl bg-muted/30 border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    value={config.fechaCreacion ? config.fechaCreacion.split('T')[0] : ''}
                                    onChange={(e) => setConfig({ ...config, fechaCreacion: new Date(e.target.value).toISOString() })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Slogan o Lema</label>
                                <input
                                    type="text"
                                    className="w-full h-14 px-5 rounded-2xl bg-muted/30 border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    placeholder="Ej: Formación con soberanía tecnológica"
                                    value={config.descripcion}
                                    onChange={(e) => setConfig({ ...config, descripcion: e.target.value })}
                                />
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sobre Nosotros (Historia y Contexto)</label>
                                <textarea
                                    className="w-full p-5 rounded-2xl bg-muted/30 border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none min-h-[150px]"
                                    value={config.sobreNosotros}
                                    onChange={(e) => setConfig({ ...config, sobreNosotros: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'vision' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nuestra Misión</label>
                                </div>
                                <textarea
                                    className="w-full p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 min-h-[200px] text-sm leading-relaxed"
                                    value={config.mision}
                                    onChange={(e) => setConfig({ ...config, mision: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nuestra Visión</label>
                                </div>
                                <textarea
                                    className="w-full p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 min-h-[200px] text-sm leading-relaxed"
                                    value={config.vision}
                                    onChange={(e) => setConfig({ ...config, vision: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Correo Institucional</label>
                                <div className="relative group/field">
                                    <input type="email" className="w-full h-12 pl-10 rounded-xl bg-muted/30 border border-border focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={config.correo || ''} onChange={(e) => setConfig({ ...config, correo: e.target.value })} />
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Celular / WhatsApp</label>
                                <div className="relative group/field">
                                    <input type="text" className="w-full h-12 pl-10 rounded-xl bg-muted/30 border border-border focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={config.celular || ''} onChange={(e) => setConfig({ ...config, celular: e.target.value })} />
                                    <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Teléfono Fijo</label>
                                <div className="relative group/field">
                                    <input type="text" className="w-full h-12 pl-10 rounded-xl bg-muted/30 border border-border focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={config.telefono || ''} onChange={(e) => setConfig({ ...config, telefono: e.target.value })} />
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sitio Web Oficial</label>
                                <div className="relative group/field">
                                    <input type="text" className="w-full h-12 pl-10 rounded-xl bg-muted/30 border border-border focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={config.pagina || ''} onChange={(e) => setConfig({ ...config, pagina: e.target.value })} />
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Facebook URL</label>
                                <div className="relative text-blue-600 group/field">
                                    <input type="text" className="w-full h-12 pl-10 rounded-xl bg-muted/30 border border-border focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={config.facebook || ''} onChange={(e) => setConfig({ ...config, facebook: e.target.value })} />
                                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">YouTube Channel</label>
                                <div className="relative text-red-600 group/field">
                                    <input type="text" className="w-full h-12 pl-10 rounded-xl bg-muted/30 border border-border focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={config.youtube || ''} onChange={(e) => setConfig({ ...config, youtube: e.target.value })} />
                                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">TikTok</label>
                                <div className="relative text-primary group/field">
                                    <input type="text" className="w-full h-12 pl-10 rounded-xl bg-muted/30 border border-border focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={config.tiktok || ''} onChange={(e) => setConfig({ ...config, tiktok: e.target.value })} />
                                    <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                                </div>
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ubicación Física</label>
                                <div className="relative group/field">
                                    <input type="text" className="w-full h-12 pl-10 rounded-xl bg-muted/30 border border-border focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={config.ubicacion} onChange={(e) => setConfig({ ...config, ubicacion: e.target.value })} />
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-primary" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase">Banner Institucional</h4>
                                <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-border group bg-muted/20">
                                    {config.banner ? (
                                        <img src={config.banner.startsWith('http') ? config.banner : `${process.env.NEXT_PUBLIC_API_URL}${config.banner}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                            <ImageIcon className="w-12 h-12 text-muted-foreground opacity-20" />
                                            <p className="text-[10px] font-black uppercase opacity-20">Sin Banner</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="px-6 py-3 bg-white text-black font-black text-[10px] uppercase rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all">
                                            Cambiar Banner
                                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'banner')} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase text-primary">Logo Principal (Ministerio/Dependencia)</h4>
                                <div className="relative h-48 w-full md:w-64 mx-auto rounded-3xl overflow-hidden border-2 border-dashed border-border group bg-white shadow-inner">
                                    {config.logoPrincipal ? (
                                        <img src={config.logoPrincipal.startsWith('http') ? config.logoPrincipal : `${process.env.NEXT_PUBLIC_API_URL}${config.logoPrincipal}`} className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105 duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                            <img src="/logo-principal.png" className="w-20 opacity-40 grayscale" alt="Logo Ministerio" />
                                            <p className="text-[10px] font-black uppercase opacity-20">Logo Dependencia</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="p-2 bg-white text-black font-black text-[10px] uppercase rounded-xl cursor-pointer">
                                            Subir Logo Dependencia
                                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'logoPrincipal')} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase text-primary">Logo del Programa (PROFE)</h4>
                                <div className="relative h-48 w-full md:w-64 mx-auto rounded-3xl overflow-hidden border-2 border-dashed border-border group bg-white shadow-inner">
                                    {config.imagen ? (
                                        <img src={config.imagen.startsWith('http') ? config.imagen : `${process.env.NEXT_PUBLIC_API_URL}${config.imagen}`} className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105 duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                            <img src="/logo.svg" className="w-16 h-16 opacity-50" alt="Default Logo" />
                                            <p className="text-[10px] font-black uppercase opacity-20">Logo PROFE</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="p-2 bg-white text-black font-black text-[10px] uppercase rounded-xl cursor-pointer">
                                            Subir Logo PROFE
                                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'imagen')} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase flex items-center gap-2">
                                    Afiche Promocional
                                    <span className="text-[9px] font-medium text-muted-foreground normal-case">(Se muestra en la Landing)</span>
                                </h4>
                                <div className="relative aspect-[3/4] max-w-[300px] mx-auto rounded-3xl overflow-hidden border-2 border-dashed border-border group bg-muted/20">
                                    {config.afiche ? (
                                        <img src={config.afiche.startsWith('http') ? config.afiche : `${process.env.NEXT_PUBLIC_API_URL}${config.afiche}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                            <ImageIcon className="w-12 h-12 text-muted-foreground opacity-20" />
                                            <p className="text-[10px] font-black uppercase opacity-20">Sin Afiche</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="px-6 py-3 bg-white text-black font-black text-[10px] uppercase rounded-xl cursor-pointer">
                                            Subir Afiche
                                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'afiche')} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-full space-y-8 pt-10 border-t border-border/40">
                                <h4 className="text-sm font-black uppercase flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <Palette className="w-4 h-4" />
                                    </div>
                                    Colores de Marca (Sistema)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-8 rounded-[32px] bg-muted/20 border border-border flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl relative overflow-hidden shrink-0 shadow-lg border-2 border-white">
                                            <input
                                                type="color"
                                                className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-0"
                                                value={config.color || '#1474a6'}
                                                onChange={(e) => setConfig({ ...config, color: e.target.value })}
                                            />
                                            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: config.color || '#1474a6' }} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Color Primario</p>
                                            <div className="flex items-center gap-2">
                                                <Hash className="w-3 h-3 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    className="bg-transparent border-none outline-none font-bold text-sm uppercase w-full"
                                                    value={(config.color || '#1474a6').replace('#', '')}
                                                    onChange={(e) => setConfig({ ...config, color: '#' + e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 rounded-[32px] bg-muted/20 border border-border flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl relative overflow-hidden shrink-0 shadow-lg border-2 border-white">
                                            <input
                                                type="color"
                                                className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-0"
                                                value={config.colorSecundario || '#4f46e5'}
                                                onChange={(e) => setConfig({ ...config, colorSecundario: e.target.value })}
                                            />
                                            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: config.colorSecundario || '#4f46e5' }} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Color Secundario</p>
                                            <div className="flex items-center gap-2">
                                                <Hash className="w-3 h-3 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    className="bg-transparent border-none outline-none font-bold text-sm uppercase w-full"
                                                    value={(config.colorSecundario || '#4f46e5').replace('#', '')}
                                                    onChange={(e) => setConfig({ ...config, colorSecundario: '#' + e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium italic">
                                    * Estos colores se aplicarán automáticamente a la landing page, botones, y elementos destacados del sistema.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'legal' && (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">URL de Convocatoria Vigente</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full h-14 px-5 pl-12 rounded-2xl bg-muted/30 border border-border outline-none focus:border-primary transition-all"
                                        placeholder="https://drive.google.com/..."
                                        value={config.convocatoria}
                                        onChange={(e) => setConfig({ ...config, convocatoria: e.target.value })}
                                    />
                                    < Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic ml-1">Enlace directo al documento PDF de la convocatoria actual.</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
