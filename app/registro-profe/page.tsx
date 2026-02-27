'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Lock, IdCard, Calendar, Briefcase, Building2,
    ArrowRight, CheckCircle, AlertCircle, Loader2, ArrowLeft, Upload,
    Sparkles, ShieldCheck, GraduationCap, MapPin, Phone, Hash, Eye
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useProfe } from '@/contexts/ProfeContext';
import { bancoProfesionalService } from '@/services/bancoProfesionalService';

export default function RegistroProfePage() {
    const router = useRouter();
    const { config: profe } = useProfe();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState<{ cargos: any[], departamentos: any[], categorias: any[] }>({ cargos: [], departamentos: [], categorias: [] });
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showVerificationInput, setShowVerificationInput] = useState(false);

    const IMG = (src: string | null) => {
        if (!src) return null;
        return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    };

    const [form, setForm] = useState({
        ci: '',
        nombre: '',
        apellidos: '',
        fechaNac: '',
        correo: '',
        username: '',
        password: '',
        cargoId: '',
        tenantId: '',
        celular: '',
        imagen: '',
        verificationCode: '',
        rda: '',
        rdaPdf: '',
        categoriaId: '',
        esMaestro: false,
        idiomas: '',
        resumenProfesional: '',
        habilidades: ''
    });

    useEffect(() => {
        async function loadConfig() {
            try {
                const [cargosResp, deptsResp, catsResp] = await Promise.all([
                    api.get('/public/banco-profesional/config/cargos'),
                    api.get('/public/departamentos'),
                    api.get('/public/banco-profesional/config/categorias')
                ]);
                setConfig({
                    cargos: Array.isArray(cargosResp.data) ? cargosResp.data : (cargosResp.data?.data || []),
                    departamentos: Array.isArray(deptsResp.data) ? deptsResp.data : (deptsResp.data?.data || []),
                    categorias: Array.isArray(catsResp.data) ? catsResp.data : (catsResp.data?.data || [])
                });
            } catch (error) {
                console.error('Error loading config:', error);
            }
        }
        loadConfig();
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const { data } = await api.post('/public/banco-profesional/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = data.data?.path || data.path;
            const cleanUrl = url.includes('/uploads/') ? '/uploads/' + url.split('/uploads/')[1] : url;
            setForm({ ...form, imagen: cleanUrl });
            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            toast.error('Error al subir imagen');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestVerification = async () => {
        if (!form.correo) {
            toast.error('Ingresa tu correo primero');
            return;
        }
        setIsSendingVerification(true);
        try {
            await bancoProfesionalService.requestVerification(form.correo);
            toast.success('Código de verificación enviado');
            setShowVerificationInput(true);
            setCountdown(60);
        } catch (error) {
            toast.error('Error al enviar código');
        } finally {
            setIsSendingVerification(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            if (step === 2 && !isEmailVerified) {
                toast.error('Debes verificar tu correo antes de continuar');
                return;
            }
            setStep(step + 1);
            return;
        }

        setIsLoading(true);
        try {
            const submitData = {
                ...form,
                tenantId: form.tenantId === '' ? null : form.tenantId,
                per_ci: form.ci,
                bp_ci: form.ci,
                esMaestro: form.esMaestro,
            };

            await api.post('/public/banco-profesional/registrar', submitData);
            toast.success('¡Registro exitoso!', {
                description: 'Bienvenido a la red elite del magisterio.',
            });
            router.push('/login');
        } catch (error: any) {
            const backendMessage = error.response?.data?.message;
            toast.error('Error al registrar', {
                description: Array.isArray(backendMessage) ? backendMessage.join(', ') : (backendMessage || 'Ocurrió un error inesperado.'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        { title: 'Identidad', icon: User },
        { title: 'Credenciales', icon: Lock },
        { title: 'Candidatura', icon: Briefcase }
    ];

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-primary-950 flex overflow-hidden">

            {/* ── LEFT SIDE: THE EXPERIENCE ── */}
            <div className="hidden lg:flex w-1/3 bg-primary-950 p-20 flex-col justify-between relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(20,116,166,0.15),transparent)] z-0" />

                <div className="relative z-10 space-y-12">
                    <Link href="/" className="inline-block">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden p-2.5">
                            {profe?.imagen ? (
                                <img src={IMG(profe.imagen) || undefined} className="w-full h-full object-contain" alt="Logo" />
                            ) : (
                                <span className="text-slate-950 font-black text-2xl">P</span>
                            )}
                        </div>
                    </Link>

                    <div className="space-y-6">
                        <span className="text-primary-500 font-black text-[10px] uppercase tracking-[0.5em]">PLATAFORMA NACIONAL</span>
                        <h2 className="text-5xl font-black text-white leading-tight tracking-tighter uppercase italic">
                            Red de <br /> <span className="text-primary-500">Excelencia.</span>
                        </h2>
                        <p className="text-lg text-slate-400 font-medium">Únete a la elite de facilitadores y gestores del sistema educativo plurinacional.</p>
                    </div>

                    <div className="space-y-10">
                        {[
                            { i: ShieldCheck, t: 'Prestigio Estatal', d: 'Acreditación oficial como especialista del sistema.' },
                            { i: GraduationCap, t: 'Impacto Formativo', d: 'Lidera programas de alta especialización nacional.' },
                            { i: Sparkles, t: 'Desarrollo Continuo', d: 'Acceso a la vanguardia pedagógica del estado.' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex gap-6 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform">
                                    <item.i className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none">{item.t}</h4>
                                    <p className="text-xs text-slate-500 font-medium">{item.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    Ministerio de Educación © {new Date().getFullYear()} PROFE Bolivia
                </div>
            </div>

            {/* ── RIGHT SIDE: THE FORM ── */}
            <div className="flex-1 flex flex-col relative overflow-y-auto scrollbar-hide">

                {/* Header Portátil */}
                <div className="p-8 lg:p-12 flex items-center justify-between">
                    <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>

                    <div className="flex items-center gap-4">
                        {steps.map((s, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step === i + 1 ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : (step > i + 1 ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400')}`}>
                                    {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className={`hidden md:block text-[10px] font-black uppercase tracking-widest ${step === i + 1 ? 'text-primary-600' : 'text-slate-400'}`}>{s.title}</span>
                                {i < 2 && <div className="w-4 h-px bg-slate-200 dark:bg-white/10 hidden md:block" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-8 pb-12">
                    <form onSubmit={handleSubmit} className="space-y-12">

                        <AnimatePresence mode="wait">
                            {/* ── STEP 1: IDENTITY ── */}
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                    <div className="space-y-4">
                                        <h3 className="text-4xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">Información <span className="text-primary-600">Personal.</span></h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">Comencmos con tus datos básicos de identificación.</p>
                                    </div>

                                    <div className="flex justify-center">
                                        <div className="relative group">
                                            <div className="w-40 h-40 rounded-[3rem] bg-slate-50 dark:bg-white/5 border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                                                {form.imagen ? (
                                                    <img src={form.imagen.startsWith('http') ? form.imagen : `${process.env.NEXT_PUBLIC_API_URL}${form.imagen}`} className="w-full h-full object-cover" alt="Perfil" />
                                                ) : <User className="w-16 h-16 text-slate-300" />}
                                                <label className="absolute inset-0 bg-primary-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                                                    <Upload className="w-10 h-10 text-white mb-2" />
                                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Cambiar</span>
                                                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                                </label>
                                            </div>
                                            {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 rounded-[3rem]"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cédula de Identidad</label>
                                            <div className="relative group">
                                                <IdCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                <Input name="ci" value={form.ci} onChange={handleChange} placeholder="Número de Documento" className="pl-14 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none" required />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Fecha de Nacimiento</label>
                                            <div className="relative group">
                                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                <Input type="date" name="fechaNac" value={form.fechaNac} onChange={handleChange} className="pl-14 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none" required />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombres</label>
                                            <Input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Como figura en tu CI" className="h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Apellidos</label>
                                            <Input name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Paterno y Materno" className="h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none" required />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── STEP 2: CREDENTIALS ── */}
                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                    <div className="space-y-4">
                                        <h3 className="text-4xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">Acceso & <span className="text-primary-600">Contacto.</span></h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">Configura cómo accederás a la plataforma y cómo te contactaremos.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="col-span-full space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Correo Electrónico</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                <Input type="email" name="correo" value={form.correo} onChange={(e) => {
                                                    handleChange(e);
                                                    setIsEmailVerified(false);
                                                }} placeholder="ejemplo@bolivia.bo" className="pl-14 pr-32 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none" required />
                                                <button
                                                    type="button"
                                                    disabled={isSendingVerification || countdown > 0 || isEmailVerified}
                                                    onClick={handleRequestVerification}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all"
                                                >
                                                    {isEmailVerified ? (
                                                        <span className="flex items-center gap-1 text-emerald-300"><CheckCircle className="w-3 h-3" /> Verificado</span>
                                                    ) : (
                                                        countdown > 0 ? `Reenviar en ${countdown}s` : 'Verificar'
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {(showVerificationInput || isEmailVerified) && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="col-span-full space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Código de Verificación</label>
                                                <div className="relative group">
                                                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                    <Input
                                                        name="verificationCode"
                                                        value={form.verificationCode}
                                                        onChange={(e) => {
                                                            handleChange(e);
                                                            if (e.target.value.length === 6) {
                                                                setIsEmailVerified(true);
                                                                toast.success('Correo verificado localmente (se validará al enviar)');
                                                            }
                                                        }}
                                                        placeholder="Ingresa el código de 6 dígitos"
                                                        className="pl-14 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none"
                                                        maxLength={6}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre de Usuario</label>
                                            <div className="relative group">
                                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                <Input name="username" value={form.username} onChange={handleChange} placeholder="Nombre de usuario único" className="pl-14 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none" required />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contraseña</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                <Input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Seguridad alta" className="pl-14 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none" required />
                                            </div>
                                        </div>
                                        <div className="col-span-full space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Número de Celular</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                <Input name="celular" value={form.celular} onChange={handleChange} placeholder="WhatsApp para coordinaciones" className="pl-14 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none" required />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── STEP 3: CANDIDACY ── */}
                            {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                    <div className="space-y-4">
                                        <h3 className="text-4xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">Selección <span className="text-primary-600">Institucional.</span></h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">Indica tu área de interés y ubicación para tu postulación.</p>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Departamento de Postulación</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors z-10" />
                                                <select name="tenantId" value={form.tenantId} onChange={handleChange} className="w-full pl-14 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none appearance-none font-bold text-sm text-slate-900 dark:text-white" required>
                                                    <option value="" disabled>Selecciona tu sede territorial</option>
                                                    {config.departamentos.map((d: any) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Área de Especialidad (Cargo)</label>
                                            <div className="relative group">
                                                <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors z-10" />
                                                <select name="cargoId" value={form.cargoId} onChange={handleChange} className="w-full pl-14 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-8 focus:ring-primary-600/5 transition-all outline-none appearance-none font-bold text-sm text-slate-900 dark:text-white" required>
                                                    <option value="" disabled>Selecciona tu rol profesional</option>
                                                    {config.cargos.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-[2.5rem] bg-muted/20 border border-border/50 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-foreground">¿Eres Personal Magisterio?</h4>
                                                    <p className="text-[10px] text-muted-foreground font-medium italic">Marca esta opción si posees un registro RDA activo.</p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    name="esMaestro"
                                                    checked={form.esMaestro}
                                                    onChange={(e) => setForm({ ...form, esMaestro: e.target.checked })}
                                                    className="w-6 h-6 rounded-lg accent-primary cursor-pointer shadow-sm"
                                                />
                                            </div>

                                            <AnimatePresence>
                                                {form.esMaestro && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="space-y-6 pt-4 border-t border-border/40"
                                                    >
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número RDA</label>
                                                            <div className="relative group">
                                                                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                                                <Input
                                                                    type="number"
                                                                    name="rda"
                                                                    value={form.rda}
                                                                    onChange={handleChange}
                                                                    placeholder="Tu registro oficial"
                                                                    className="pl-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Certificado RDA (PDF)</label>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center px-5 border border-transparent overflow-hidden">
                                                                    {form.rdaPdf ? (
                                                                        <div className="flex items-center justify-between w-full">
                                                                            <span className="text-[10px] font-bold text-primary truncate uppercase">Certificado Cargado</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const url = IMG(form.rdaPdf);
                                                                                    if (url) window.open(url, '_blank');
                                                                                }}
                                                                                className="p-2 hover:bg-primary/10 rounded-xl transition-colors text-primary"
                                                                                title="Ver PDF"
                                                                            >
                                                                                <Eye className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">Sin archivo</span>
                                                                    )}
                                                                </div>
                                                                <label className="shrink-0 h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                                                                    <Upload className="w-5 h-5" />
                                                                    <input type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            setIsLoading(true);
                                                                            const formData = new FormData();
                                                                            formData.append('file', file);
                                                                            try {
                                                                                const { data } = await api.post('/public/banco-profesional/upload', formData, {
                                                                                    headers: { 'Content-Type': 'multipart/form-data' }
                                                                                });
                                                                                const url = data.data?.path || data.path;
                                                                                const cleanUrl = url.includes('/uploads/') ? '/uploads/' + url.split('/uploads/')[1] : url;
                                                                                setForm({ ...form, rdaPdf: cleanUrl });
                                                                                toast.success('RDA cargado correctamente');
                                                                            } catch (error) {
                                                                                toast.error('Error al subir PDF');
                                                                            } finally {
                                                                                setIsLoading(false);
                                                                            }
                                                                        }
                                                                    }} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                                                            <div className="relative group">
                                                                <select
                                                                    name="categoriaId"
                                                                    value={form.categoriaId}
                                                                    onChange={handleChange}
                                                                    className="w-full h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-transparent px-5 text-sm font-bold focus:bg-white dark:focus:bg-white/10 outline-none appearance-none"
                                                                >
                                                                    <option value="">Selecciona tu categoría</option>
                                                                    {config.categorias.map((c: any) => (
                                                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="space-y-6 pt-6 border-t border-border/40">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Idiomas (Ej: Quechua, Inglés...)</label>
                                                    <Input
                                                        name="idiomas"
                                                        value={form.idiomas}
                                                        onChange={handleChange}
                                                        placeholder="Idiomas que dominas"
                                                        className="h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-transparent px-5"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil/Resumen Profesional</label>
                                                    <textarea
                                                        name="resumenProfesional"
                                                        value={form.resumenProfesional}
                                                        onChange={(e) => setForm({ ...form, resumenProfesional: e.target.value })}
                                                        placeholder="Describe brevemente tu formación y experiencia..."
                                                        className="w-full h-32 p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-white/10 outline-none font-bold text-xs resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-[2rem] bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 flex gap-6">
                                            <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
                                            <p className="text-xs text-amber-800 dark:text-amber-500 font-medium leading-relaxed italic">
                                                * Al registrarte, entrarás en un proceso de evaluación técnica por parte de la Dirección Nacional. Asegúrate de que tus datos sean verídicos.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="pt-8">
                            <Button type="submit" disabled={isLoading} className="w-full py-10 rounded-full text-xs font-black uppercase tracking-[0.4em] shadow-3xl shadow-primary-600/20 active:scale-95 transition-all flex items-center justify-center gap-4">
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <> {step === 3 ? 'Finalizar Postulación' : 'Continuar al Paso Siguiente'} <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" /> </>
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Ya eres parte de la red? <Link href="/login" className="text-primary-600 hover:underline ml-2">Acceso Portal</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ChevronDown = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
);
