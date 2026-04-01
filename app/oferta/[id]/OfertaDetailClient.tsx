'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Calendar, Clock, MapPin, Users,
    Upload, CheckCircle2, X, Search, Loader2, BadgeCheck,
    CreditCard, AlertCircle, ChevronRight, ShieldCheck,
    Building2, GraduationCap, User, AlertTriangle, Info,
    BookOpen, Sparkles, ChevronDown, Check
} from 'lucide-react';
import { publicService } from '@/services/publicService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const IMG = (src?: string | null) => {
    if (!src) return '';
    return src.startsWith('http') ? src : `${API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
};

const fmt = (d?: string | Date | null) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('es-BO', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    } catch { return '—'; }
};

interface Props {
    initialPrograma: any;
    profe: any;
}

export default function OfertaDetailClient({ initialPrograma, profe }: Props) {
    const router = useRouter();
    const [programa, setPrograma] = useState(initialPrograma);
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const brandColor = profe?.color || '#3b82f6'; // Fallback to blue-500

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-40 selection:bg-primary selection:text-white">

            {/* ── NAVEGACIÓN FLOTANTE ── */}
            <nav className="fixed top-8 left-8 md:left-12 z-50">
                <button
                    onClick={() => router.back()}
                    className="group w-14 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-2xl hover:scale-110 active:scale-95"
                >
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
            </nav>

            {/* ── CINEMATIC HERO ── */}
            <header className="relative h-[70vh] min-h-[600px] overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={IMG(programa.banner || programa.imagen)}
                        className="w-full h-full object-cover scale-105 blur-[2px] opacity-40"
                        alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-slate-950 dark:via-slate-950/80" />
                </div>

                <div className="relative h-full max-w-7xl mx-auto px-8 flex flex-col justify-end pb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="flex flex-wrap gap-3">
                            {programa.tipo && (
                                <span className="px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                                    {programa.tipo.nombre}
                                </span>
                            )}
                            {programa.modalidad && (
                                <span className="px-5 py-2 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest">
                                    {programa.modalidad.nombre}
                                </span>
                            )}
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tight max-w-5xl uppercase">
                            {programa.nombre}
                        </h1>

                        <div className="flex flex-wrap items-center gap-10 pt-4">
                            {programa.version && (
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <p className="text-xs font-black uppercase tracking-widest">
                                        Versión {programa.version.numero} • {programa.version.gestion}
                                    </p>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-slate-400">
                                <MapPin className="w-5 h-5 text-primary" />
                                <span className="text-sm font-bold uppercase tracking-widest">{programa.sede?.nombre || 'Sede Central'}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* ── CONTENIDO ── */}
            <main className="max-w-7xl mx-auto px-8 -mt-20 relative z-10">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* IZQUIERDA: DETALLES (8 Cols) */}
                    <div className="lg:col-span-8 space-y-12">

                        {/* Tarjeta Principal de Información */}
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-3xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-white/5 space-y-16">

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-slate-100 dark:border-white/5">
                                {[
                                    { label: 'Carga Horaria', value: `${programa.cargaHoraria} Horas`, icon: Clock, color: 'text-blue-500' },
                                    { label: 'Costo Inversión', value: `${programa.costo} Bs.`, icon: CreditCard, color: 'text-emerald-500' },
                                    { label: 'Modalidad', value: programa.modalidad?.nombre, icon: Building2, color: 'text-purple-500' },
                                    { label: 'Estado', value: programa.estadoInscripcion ? 'Abierto' : 'Cerrado', icon: ShieldCheck, color: 'text-amber-500' },
                                ].map((s, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <div className={cn("w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center", s.color)}>
                                            <s.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                                            <p className="text-base font-black text-slate-900 dark:text-white">{s.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Descripción Editorial */}
                            <article className="prose prose-slate dark:prose-invert lg:prose-xl max-w-none">
                                <h3 className="text-3xl font-black uppercase tracking-tight flex items-center gap-4 text-slate-900 dark:text-white">
                                    <BookOpen className="w-8 h-8 text-primary" />
                                    Sobre este Programa
                                </h3>
                                <div className="mt-8 font-medium leading-relaxed opacity-80"
                                    dangerouslySetInnerHTML={{ __html: programa.contenido || '' }} />
                            </article>
                        </div>

                        {/* Mallas / Módulos */}
                        {programa.modulos?.length > 0 && (
                            <div className="space-y-8">
                                <h4 className="text-2xl font-black uppercase tracking-widest px-8">Plan de Estudios</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {programa.modulos.map((mod: any, idx: number) => (
                                        <div key={mod.id} className="group flex flex-col md:flex-row gap-8 p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-primary/30 transition-all shadow-sm">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-2xl font-black text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                                                {idx + 1}
                                            </div>
                                            <div className="space-y-3">
                                                <h5 className="text-xl font-black uppercase tracking-tight">{mod.nombre}</h5>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium line-clamp-2">{mod.descripcion}</p>
                                                <div className="flex items-center gap-6 pt-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inicia: {fmt(mod.fechaInicio)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DERECHA: INSCRIPCION (4 Cols) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-32 space-y-8">

                            {/* Card de Acción (INSTITUTIONAL COLOR) */}
                            <div className="rounded-[3rem] p-10 text-white shadow-3xl shadow-primary/30 space-y-10 relative overflow-hidden group"
                                style={{ backgroundColor: brandColor }}>

                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[80px] group-hover:scale-125 transition-transform duration-700" />
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/20 blur-[60px]" />

                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Convocatoria Vigente</p>
                                    </div>
                                    <h5 className="text-4xl font-black leading-none uppercase tracking-tighter">
                                        Inicia tu Inscripción Oficial
                                    </h5>
                                </div>

                                <div className="space-y-6 pt-8 border-t border-white/20 relative z-10">
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="space-y-1">
                                            <span className="font-bold opacity-70 block uppercase text-[10px] tracking-widest">Inversión / Matrícula</span>
                                            <span className="font-black text-3xl">{programa.costo} Bs.</span>
                                        </div>
                                        <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/20">
                                            <span className="text-[10px] font-black uppercase">{programa.costo > 0 ? 'Pago único' : 'Gratuito'}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="space-y-1">
                                            <span className="font-bold opacity-70 block uppercase text-[10px] tracking-widest">Plazo Máximo</span>
                                            <span className="font-black text-xl">{fmt(programa.fechaFinInscripcion)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowModal(true)}
                                    disabled={!programa.estadoInscripcion}
                                    className="w-full h-15 rounded-[2rem] bg-white text-slate-900 font-black uppercase tracking-[0.2em] text-[11px] hover:scale-[1.03] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-30 relative z-10 group/btn"
                                >
                                    <ShieldCheck className="w-6 h-6 text-primary group-hover/btn:rotate-12 transition-transform" />
                                    Postular al Programa
                                </button>

                            </div>

                            {/* Sedes si hay múltiples */}
                            {programa.sedesDisponibles?.length > 1 && (
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 space-y-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Otras Sedes para este programa</p>
                                    <div className="space-y-2">
                                        {programa.sedesDisponibles.map((s: any) => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    const sedesList = programa.sedesDisponibles;
                                                    setPrograma({ ...s, sedesDisponibles: sedesList });
                                                    window.history.replaceState(null, '', `/oferta/${s.id}`);
                                                }}
                                                className={cn(
                                                    "w-full p-6 rounded-2xl text-left flex justify-between items-center transition-all border-2",
                                                    programa.id === s.id
                                                        ? "bg-primary border-primary text-white shadow-xl shadow-primary/20"
                                                        : "bg-slate-50 dark:bg-white/5 border-transparent hover:border-primary/20"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <MapPin className={cn("w-5 h-5", programa.id === s.id ? "text-white" : "text-primary")} />
                                                    <span className="text-xs font-black uppercase tracking-tight">{s.sede?.nombre}</span>
                                                </div>
                                                {programa.id === s.id && <Check className="w-5 h-5" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>

            {/* ── MODAL MODERN (GLASS) ── */}
            {mounted && showModal && (
                <InscripcionModal
                    programa={programa}
                    onClose={() => setShowModal(false)}
                    brandColor={brandColor}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE INSCRIPCIÓN (MODERNO / REDONDEADO)
// ─────────────────────────────────────────────────────────────────────────────
function InscripcionModal({ programa, onClose, brandColor }: { programa: any; onClose: () => void; brandColor: string }) {
    const [step, setStep] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [persona, setPersona] = useState<any>(null);
    const [personaFound, setPersonaFound] = useState<boolean | null>(null);
    const [personaSource, setPersonaSource] = useState<'map_persona' | 'admins' | null>(null);

    // Identificación
    const [ci, setCi] = useState('');
    const [complemento, setComplemento] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');

    // Datos Personales
    const [manualData, setManualData] = useState({
        nombre: '', apellidos: '', correo: '', correoConfirmacion: '', celular: ''
    });
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Pago
    const [baucher, setBaucher] = useState({
        nroDeposito: '', monto: programa?.costo?.toString() || '',
        fecha: new Date().toISOString().split('T')[0], imagen: '', imagenPreview: ''
    });

    const turnoId = programa.turnos?.[0]?.id || '';
    const sedeId = programa.sedeId || programa.sede?.id || programa.id;

    const handleSearch = async () => {
        if (!ci || !fechaNacimiento) return toast.error('Complete la identificación');
        setIsSearching(true);
        try {
            const data = await publicService.checkPersonaByDate(ci.trim(), fechaNacimiento, complemento.trim() || undefined, programa.id);
            setPersona(data);
            setPersonaFound(data?.found ?? false);
            setPersonaSource(data?.source ?? null);
            if (data?.alreadyEnrolled) {
                toast.error('Usted ya cuenta con una inscripción activa');
                return;
            }
            if (data?.found) {
                setManualData(p => ({ ...p, correo: data.correo || '', correoConfirmacion: data.correo || '', celular: data.celular || '' }));
                toast.success('Información cargada del padrón');
            }
            setStep(2);
        } catch (err) { toast.error('Error al verificar identidad'); } finally { setIsSearching(false); }
    };

    const handleManualNext = async () => {
        if (!personaFound && (!manualData.nombre || !manualData.apellidos)) return toast.error('Complete sus datos personales');
        if (!manualData.correo || manualData.correo !== manualData.correoConfirmacion) return toast.error('Los correos no coinciden');

        if (!personaFound) {
            if (!isEmailSent) {
                setIsVerifying(true);
                try {
                    await publicService.sendVerificationCode(manualData.correo, `${manualData.nombre} ${manualData.apellidos}`);
                    setIsEmailSent(true);
                    toast.success('Código de seguridad enviado');
                } catch { toast.error('Error al enviar código'); } finally { setIsVerifying(false); }
                return;
            } else {
                if (!verificationCode) return toast.error('Ingrese el código');
                setIsVerifying(true);
                try {
                    await publicService.verifyCode(manualData.correo, verificationCode);
                    setStep(Number(programa.costo) > 0 ? 3 : 4);
                } catch { toast.error('Código incorrecto'); } finally { setIsVerifying(false); }
                return;
            }
        }
        setStep(Number(programa.costo) > 0 ? 3 : 4);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const res = await publicService.uploadBaucher(file);
        if (res.success) {
            setBaucher(p => ({ ...p, imagen: res.data.path, imagenPreview: URL.createObjectURL(file) }));
            toast.success('Documento adjunto');
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const res = await publicService.registerInscripcion({
                userId: persona?.userId || null,
                programaId: programa.id,
                turnoId,
                sedeId,
                baucher,
                datosPersona: {
                    ci, complemento, fechaNacimiento,
                    nombre: personaFound ? persona.nombre : manualData.nombre,
                    apellidos: personaFound ? [persona.apellidoPaterno, persona.apellidoMaterno].filter(Boolean).join(' ') : manualData.apellidos,
                    correo: manualData.correo,
                },
            });
            if (res.success) setStep(5);
        } catch { toast.error('Error al procesar inscripción'); } finally { setIsLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">Registro Académico</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{programa.nombre}</p>
                    </div>
                    <button onClick={onClose} className="p-4 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-all"><X /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-12">

                    {/* Stepper Moderno */}
                    {step < 5 && (
                        <div className="flex gap-4 mb-16">
                            {[1, 2, 3, 4].map(n => (
                                <div key={n} className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                    <div className={cn("h-full transition-all duration-500", step >= n ? "bg-primary" : "w-0")} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Step 1: Identificación */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">Número de Identidad (CI)</label>
                                <input value={ci} onChange={e => setCi(e.target.value)} className="w-full h-20 px-8 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-2xl font-black focus:border-primary outline-none transition-all" placeholder="0000000" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">Fecha de Nacimiento</label>
                                <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} className="w-full h-20 px-8 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-lg font-black focus:border-primary outline-none transition-all" />
                            </div>
                            <button onClick={handleSearch} disabled={isSearching} className="w-full h-20 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-6">
                                {isSearching ? <Loader2 className="animate-spin h-6 w-6" /> : <Search className="h-6 w-6" />}
                                Verificar Información
                            </button>
                        </div>
                    )}

                    {/* Step 2: Personales */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            {personaFound && (
                                <div className="p-8 rounded-[2rem] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center"><BadgeCheck className="h-8 w-8" /></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Verificado en {personaSource === 'map_persona' ? 'Padrón Minedu' : 'Sistema Profe'}</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white uppercase">{persona.nombre} {persona.nombre2} {[persona.apellidoPaterno, persona.apellidoMaterno].join(' ')}</p>
                                    </div>
                                </div>
                            )}

                            {!personaFound && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <input value={manualData.nombre} onChange={e => setManualData(p => ({ ...p, nombre: e.target.value.toUpperCase() }))} className="w-full h-20 px-8 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold" placeholder="NOMBRE(S)" />
                                    <input value={manualData.apellidos} onChange={e => setManualData(p => ({ ...p, apellidos: e.target.value.toUpperCase() }))} className="w-full h-20 px-8 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold" placeholder="APELLIDO(S)" />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input value={manualData.correo} onChange={e => setManualData(p => ({ ...p, correo: e.target.value.toLowerCase() }))} className="w-full h-20 px-8 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold" placeholder="CORREO ELECTRÓNICO" />
                                <input value={manualData.correoConfirmacion} onChange={e => setManualData(p => ({ ...p, correoConfirmacion: e.target.value.toLowerCase() }))} className="w-full h-20 px-8 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold" placeholder="REPETIR CORREO" />
                            </div>

                            {isEmailSent && (
                                <div className="pt-8 space-y-4">
                                    <p className="text-center text-xs font-black uppercase tracking-widest text-primary">Ingresa el código enviado a tu correo</p>
                                    <input value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="w-full h-24 rounded-[1.5rem] bg-primary/5 border-2 border-primary text-center text-5xl font-black tracking-[0.5em] outline-none" placeholder="000000" />
                                </div>
                            )}

                            <button onClick={handleManualNext} disabled={isVerifying} className="w-full h-20 rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest hover:scale-[1.02] shadow-xl transition-all flex items-center justify-center gap-4">
                                {isVerifying && <Loader2 className="animate-spin h-6 w-6" />}
                                {personaFound ? 'Confirmar y Continuar' : isEmailSent ? 'Verificar Código' : 'Solicitar Código de Acceso'}
                            </button>
                        </div>
                    )}

                    {/* Step 3: Baucher */}
                    {step === 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4">
                            <div className="aspect-square rounded-[3rem] bg-slate-50 dark:bg-white/5 border-4 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center relative group overflow-hidden">
                                {baucher.imagenPreview ? (
                                    <img src={baucher.imagenPreview} className="w-full h-full object-cover" alt="Baucher" />
                                ) : (
                                    <div className="text-center space-y-4 opacity-40">
                                        <Upload className="w-16 h-16 mx-auto" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Subir Imagen del Depósito</p>
                                    </div>
                                )}
                                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Número de Depósito</label>
                                    <input value={baucher.nroDeposito} onChange={e => setBaucher(p => ({ ...p, nroDeposito: e.target.value }))} className="w-full h-20 px-8 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold" />
                                </div>
                                <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Monto a Confirmar</p>
                                    <p className="text-4xl font-black">{programa.costo} Bs.</p>
                                </div>
                                <button onClick={() => setStep(4)} disabled={!baucher.imagen || !baucher.nroDeposito} className="w-full h-20 rounded-2xl bg-primary text-white font-black uppercase tracking-widest">Continuar al Resumen</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Resumen */}
                    {step === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-center">
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
                                <CheckCircle2 className="h-12 w-12" />
                            </div>
                            <h4 className="text-3xl font-black uppercase tracking-tight">Verifica tu Información</h4>
                            <div className="bg-slate-50 dark:bg-white/5 rounded-[2.5rem] p-10 grid grid-cols-2 gap-8 text-left">
                                <div>
                                    <p className="text-[10px] font-black opacity-40 uppercase">Postulante</p>
                                    <p className="font-black text-lg uppercase">{personaFound ? persona.nombre : manualData.nombre} {personaFound ? [persona.apellidoPaterno, persona.apellidoMaterno].join(' ') : manualData.apellidos}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black opacity-40 uppercase">Programa</p>
                                    <p className="font-black text-lg uppercase">{programa.nombre}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black opacity-40 uppercase">Cédula</p>
                                    <p className="font-black text-lg uppercase">{ci} {complemento}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black opacity-40 uppercase">Inversión</p>
                                    <p className="font-black text-lg uppercase">{baucher.monto} Bs.</p>
                                </div>
                            </div>
                            <button onClick={handleSubmit} disabled={isLoading} className="w-full h-24 rounded-[2rem] bg-emerald-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-6">
                                {isLoading ? <Loader2 className="animate-spin h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
                                Confirmar Inscripción Oficial
                            </button>
                        </div>
                    )}

                    {/* Step 5: Éxito */}
                    {step === 5 && (
                        <div className="py-20 text-center space-y-10 animate-in zoom-in">
                            <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white shadow-3xl shadow-emerald-500/30">
                                <CheckCircle2 className="h-20 w-20" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-5xl font-black uppercase tracking-tighter">¡Inscripción Exitosa!</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">Tu solicitud ha sido registrada correctamente. Recibirás un correo electrónico con tus credenciales de acceso una vez validemos tu depósito.</p>
                            </div>
                            <button onClick={onClose} className="px-16 h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs">Cerrar Ventana</button>
                        </div>
                    )}

                </div>
            </motion.div>
        </div>
    );
}
