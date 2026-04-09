'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ArrowRight, Calendar, Clock, MapPin, Users,
    Upload, CheckCircle2, X, Search, Loader2, BadgeCheck,
    CreditCard, AlertCircle, ChevronRight, ShieldCheck,
    Building2, GraduationCap, User, AlertTriangle, Info,
    BookOpen, Sparkles, ChevronDown, Check, School
} from 'lucide-react';
import { publicService } from '@/services/publicService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { InscripcionPDF } from '@/components/academico/InscripcionPDF';

import dynamic from 'next/dynamic';
const PDFDownloadLink = dynamic<any>(() => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink), { ssr: false });
const PDFViewer = dynamic<any>(() => import('@react-pdf/renderer').then(mod => mod.PDFViewer), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const IMG = (src?: string | null) => {
    if (!src) return '';
    return src.startsWith('http') ? src : `${API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
};

const fmt = (dStr?: string | Date | null) => {
    if (!dStr) return '—';
    try {
        const dateStr = typeof dStr === 'string' ? dStr.split('T')[0] : dStr.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('es-BO', {
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
    const [showModal, setShowModal] = useState(true);
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
            <header className="relative h-[60vh] min-h-[500px] overflow-hidden">
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
                                <span className="text-sm font-bold uppercase tracking-widest">
                                    {(programa.sede?.departamento?.nombre || programa.sede?.dep?.nombre || programa.sede?.departamento) ? `${(programa.sede?.departamento?.nombre || programa.sede?.dep?.nombre || programa.sede?.departamento)} - ` : ''}
                                    {programa.sede?.nombre || 'Sede Central'}
                                </span>
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

                        {/* Horarios / Turnos Disponibles */}
                        {programa.turnos?.length > 0 && (
                            <div className="space-y-8">
                                <h4 className="text-2xl font-black uppercase tracking-widest px-8">Horarios Disponibles</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {programa.turnos.map((t: any) => {
                                        const inscritos = t._count?.inscripciones || 0;
                                        const capacidad = t.cupo || 0;
                                        const porcentaje = capacidad > 0 ? Math.min((inscritos / capacidad) * 100, 100) : 0;
                                        const isFull = capacidad > 0 && inscritos >= capacidad;
                                        const isUnlimited = capacidad === 0;

                                        return (
                                            <div key={t.id} className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-6 relative overflow-hidden">
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                        <Clock className="w-6 h-6" />
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</p>
                                                        <span className={cn("text-[11px] font-black uppercase px-3 py-1 rounded-full border", isUnlimited ? "text-indigo-500 border-indigo-500/20 bg-indigo-500/5" : isFull ? "text-rose-500 border-rose-500/20 bg-rose-500/5" : "text-emerald-500 border-emerald-500/20 bg-emerald-500/5")}>
                                                            {isUnlimited ? 'Cupos Ilimitados' : isFull ? 'Cupos Agotados' : 'Vacantes Disponibles'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 relative z-10">
                                                    <h5 className="text-xl font-black uppercase tracking-tight">{t.turnoConfig?.nombre || 'General'}</h5>
                                                    {t.turnoConfig && (
                                                        <p className="text-sm font-bold text-slate-500">
                                                            {t.turnoConfig.horaInicio?.substring(0, 5)} — {t.turnoConfig.horaFin?.substring(0, 5)}
                                                            {t.turnoConfig.descripcion && <span className="block text-[10px] text-slate-400 uppercase tracking-widest mt-1">{t.turnoConfig.descripcion}</span>}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-slate-400">Cupos Reservados</span>
                                                        <span className={isFull ? "text-rose-500" : "text-primary text-xs"}>{inscritos} / {isUnlimited ? '∞' : capacidad}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: isUnlimited ? '15%' : `${porcentaje}%` }}
                                                            className={cn("h-full rounded-full", isFull ? "bg-rose-500" : isUnlimited ? "bg-indigo-500 opacity-50" : "bg-primary")}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DERECHA: INSCRIPCION (4 Cols) */}
                    <div className="lg:col-span-4 order-2 lg:order-2 hidden lg:block">
                        <div className="sticky top-32 space-y-8">

                            {/* Sedes si hay múltiples */}
                            {programa.sedesDisponibles?.length > 1 && (
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 space-y-6 shadow-sm">
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
                                                    <div className="space-y-0.5">
                                                        <p className={cn("text-[8px] font-black uppercase opacity-60", programa.id === s.id ? "text-white" : "")}>
                                                            {(s.sede?.departamento?.nombre || s.sede?.dep?.nombre || s.sede?.departamento || '')}
                                                        </p>
                                                        <span className="text-xs font-black uppercase tracking-tight">{s.sede?.nombre}</span>
                                                    </div>
                                                </div>
                                                {programa.id === s.id && <Check className="w-5 h-5" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                        </div>
                    </div>

                    {/* MOBILE FLOATING CTA */}
                    <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[60]">
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-[2.5rem] shadow-4xl flex items-center justify-between gap-4 backdrop-blur-xl"
                        >
                            <div className="pl-3">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Inversión única</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{programa.costo} Bs.</p>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                disabled={!programa.estadoInscripcion}
                                className="flex-1 h-14 rounded-2xl text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                style={{ backgroundColor: brandColor }}
                            >
                                <ShieldCheck className="w-5 h-5" />
                                Postular Ahora
                            </button>
                        </motion.div>
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
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [persona, setPersona] = useState<any>(null);
    const [personaFound, setPersonaFound] = useState<boolean | null>(null);
    const [personaSource, setPersonaSource] = useState<'map_persona' | 'admins' | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Identificación
    const [ci, setCi] = useState('');
    const [complemento, setComplemento] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');

    // Datos Personales
    const [manualData, setManualData] = useState({
        nombre: '', apellidos: '', correo: '', correoConfirmacion: '', celular: '',
        unidadEducativa: '', nivel: '', area: ''
    });
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Baucher
    const [baucher, setBaucher] = useState({
        nroDeposito: '', monto: programa?.costo?.toString() || '',
        fecha: new Date().toISOString().split('T')[0], imagen: '', imagenPreview: ''
    });

    // Preferencias
    const [selectedSedeId, setSelectedSedeId] = useState(programa.id);
    const [selectedTurnoId, setSelectedTurnoId] = useState('');

    const currentProgram = useMemo(() => {
        if (selectedSedeId === programa.id) return programa;
        return (programa.sedesDisponibles || []).find((s: any) => s.id === selectedSedeId) || programa;
    }, [selectedSedeId, programa]);

    useEffect(() => {
        if (programa.id) setSelectedSedeId(programa.id);
    }, [programa.id]);

    useEffect(() => {
        if (currentProgram.turnos?.length > 0) {
            setSelectedTurnoId(currentProgram.turnos[0].id);
        } else {
            setSelectedTurnoId('');
        }
    }, [currentProgram]);

    useEffect(() => {
        if (persona?.alreadyEnrolled?.estadoNombre === 'CONFIRMADO') {
            setIsConfirmed(true);
        }
    }, [persona]);

    // CAMPOS EXTRA
    const [camposExtra, setCamposExtra] = useState<any[]>([]);
    const [userExtraResponses, setUserExtraResponses] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const fetchExtras = async () => {
            try {
                const data = await publicService.getCamposExtra();
                setCamposExtra(data);
            } catch (error) {
                console.error("Error fetching extra fields");
            }
        };
        fetchExtras();
    }, []);

    const handleSearch = async () => {
        if (!ci || !fechaNacimiento) return toast.error('Complete la identificación');
        setIsSearching(true);
        try {
            const data = await publicService.checkPersonaByDate(ci.trim(), fechaNacimiento, complemento.trim() || undefined, programa.id);

            if (data?.alreadyEnrolled) {
                // REDIRECCIÓN A ÉXITO (MODO COMPROBANTE)
                setPersona(data);
                setPersonaFound(true);
                setManualData(p => ({
                    ...p,
                    correo: data.correo || '',
                    celular: data.celular || '',
                    nombre: data.nombre || '',
                    apellidos: [data.apellidoPaterno, data.apellidoMaterno].filter(Boolean).join(' ')
                }));
                setStep(7);
                return;
            }

            if (!data?.found) {
                toast.error('Su identificación no se encuentra registrada para este programa');
                return;
            }

            setPersona(data);
            setPersonaFound(true);
            setPersonaSource(data.source || null);
            setManualData(p => ({
                ...p,
                correo: data.correo || '',
                correoConfirmacion: data.correo || '',
                celular: data.celular || '',
                nombre: data.nombre || '',
                apellidos: [data.apellidoPaterno, data.apellidoMaterno].filter(Boolean).join(' ')
            }));

            // Populate extra responses if user exists
            if (data.mod_campos_extra_regs) {
                const responses: { [key: string]: string } = {};
                data.mod_campos_extra_regs.forEach((reg: any) => {
                    responses[reg.campoExtraId] = reg.valor;
                });
                setUserExtraResponses(responses);
            }

            toast.success('Identidad verificada correctamente');
            setStep(2);
        } catch (err) { toast.error('Error al verificar identidad'); } finally { setIsSearching(false); }
    };

    const handleManualNext = async () => {
        if (!manualData.correo || manualData.correo !== manualData.correoConfirmacion) return toast.error('Los correos no coinciden');
        if (!manualData.celular) return toast.error('Ingrese su número de celular');
        setStep(3);
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
                programaId: currentProgram.id,
                turnoId: selectedTurnoId,
                sedeId: currentProgram.sede?.id, // CORRECTO: El ID de la tabla Sede, no el ID del programa
                baucher,
                datosPersona: {
                    ci, complemento, fechaNacimiento,
                    nombre: manualData.nombre,
                    apellidos: manualData.apellidos,
                    correo: manualData.correo,
                    celular: manualData.celular,
                },
                mod_campos_extra_regs: userExtraResponses
            });
            if (res.success) setStep(7);
        } catch { toast.error('Error al procesar inscripción'); } finally { setIsLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-4xl overflow-hidden flex flex-col"
            >
                <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">Registro Académico</h3>
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest">{currentProgram.modalidad?.nombre}</span>
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[400px]">
                            {currentProgram.version?.numero ? `VERSIÓN ${currentProgram.version.numero} (${currentProgram.version.gestion})` : 'VERSIÓN ÚNICA'} • {currentProgram.nombre}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 sm:p-3 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-400 shrink-0"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 sm:px-8 pt-4 pb-8 lg:px-12 lg:pt-2 lg:pb-12">
                    {/* Stepper Moderno */}
                    {step < 7 && (
                        <div className="flex gap-2 mb-10">
                            {[1, 2, 3, 4, 5, 6].map(n => (
                                <div key={n} className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                    <div className={cn("h-full transition-all duration-500", step >= n ? "bg-primary" : "w-0")} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Step 1: Identificación */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Número de Identidad (CI)</label>
                                <input value={ci} onChange={e => setCi(e.target.value)} className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-xl font-black focus:border-primary outline-none transition-all" placeholder="0000000" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Fecha de Nacimiento</label>
                                <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-base font-black focus:border-primary outline-none transition-all" />
                            </div>
                            <button onClick={handleSearch} disabled={isSearching} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-[11px] hover:brightness-110 active:scale-95 shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-4">
                                {isSearching ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
                                Verificar Identidad
                            </button>
                        </div>
                    )}

                    {/* Step 2: Personales */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {personaFound && (
                                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-lg shadow-emerald-500/20 shrink-0"><BadgeCheck className="h-6 w-6" /></div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Verificado en {personaSource === 'map_persona' ? 'Padrón Minedu' : 'Sistema Profe'}</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{persona.nombre} {persona.nombre2} {[persona.apellidoPaterno, persona.apellidoMaterno].join(' ')}</p>
                                    </div>
                                </div>
                            )}
                            {!personaFound && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input value={manualData.nombre} onChange={e => setManualData(p => ({ ...p, nombre: e.target.value.toUpperCase() }))} className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold text-sm" placeholder="NOMBRE(S)" />
                                    <input value={manualData.apellidos} onChange={e => setManualData(p => ({ ...p, apellidos: e.target.value.toUpperCase() }))} className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold text-sm" placeholder="APELLIDO(S)" />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input value={manualData.correo} onChange={e => setManualData(p => ({ ...p, correo: e.target.value.toLowerCase() }))} className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold text-sm" placeholder="CORREO ELECTRÓNICO" />
                                <input value={manualData.celular} onChange={e => setManualData(p => ({ ...p, celular: e.target.value }))} className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold text-sm" placeholder="NRO. CELULAR (WHATSAPP)" />
                            </div>
                            {!personaFound && (
                                <div className="space-y-4">
                                    <input value={manualData.correoConfirmacion} onChange={e => setManualData(p => ({ ...p, correoConfirmacion: e.target.value.toLowerCase() }))} className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold text-sm" placeholder="REPETIR CORREO ELECTRÓNICO" />
                                </div>
                            )}

                            {/* Dynamic Extra Fields */}
                            {camposExtra.length > 0 && (
                                <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Información Adicional Requerida</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {camposExtra.map((campo) => (
                                            <div key={campo.id} className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">
                                                    {campo.label} {campo.esObligatorio && <span className="text-rose-500">*</span>}
                                                </label>
                                                {campo.tipo === 'SINGLE_SELECT' ? (
                                                    <select
                                                        value={userExtraResponses[campo.id] || ''}
                                                        onChange={(e) => setUserExtraResponses(prev => ({ ...prev, [campo.id]: e.target.value }))}
                                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold text-sm outline-none focus:border-primary transition-all"
                                                    >
                                                        <option value="">Seleccione...</option>
                                                        {(campo.opciones || []).map((opt: string) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={campo.tipo === 'BOOLEAN' ? 'checkbox' : 'text'}
                                                        value={userExtraResponses[campo.id] || ''}
                                                        onChange={(e) => setUserExtraResponses(prev => ({ ...prev, [campo.id]: e.target.value }))}
                                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold text-sm outline-none focus:border-primary transition-all"
                                                        placeholder={campo.label}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isEmailSent && (
                                <div className="pt-4 space-y-3">
                                    <p className="text-center text-[10px] font-black uppercase tracking-widest text-primary">Ingresa el código enviado a tu correo</p>
                                    <input value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="w-full h-20 rounded-2xl bg-primary/5 border-2 border-primary text-center text-4xl font-black tracking-[0.5em] outline-none" placeholder="000000" />
                                </div>
                            )}

                            <button onClick={handleManualNext} disabled={isVerifying} className="w-full h-16 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.15em] text-[11px] hover:brightness-110 shadow-xl transition-all flex items-center justify-center gap-4">
                                {isVerifying && <Loader2 className="animate-spin h-5 w-5" />}
                                {personaFound ? 'Confirmar y Continuar' : isEmailSent ? 'Verificar Código' : 'Solicitar Código de Acceso'}
                            </button>
                        </div>
                    )}

                    {/* Step 3: Sede, Turno y Datos Académicos */}
                    {step === 3 && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="space-y-10">
                                {/* SECCIÓN: UBICACIÓN GEOGRÁFICA */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><MapPin className="w-4 h-4" /></div>
                                            I. Ubicación de Sede
                                        </h4>
                                        <span className="text-[9px] font-black uppercase text-primary px-3 py-1 bg-primary/5 rounded-full border border-primary/10">{(programa.sedesDisponibles?.length || 0) > 1 ? `${programa.sedesDisponibles.length} sedes disponibles` : 'Sede única habilitada'}</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(programa.sedesDisponibles || [programa]).map((s: any) => {
                                            const isActive = String(selectedSedeId) === String(s.id);
                                            const dep = s.sede?.departamento?.nombre || s.sede?.dep?.nombre || '';
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => setSelectedSedeId(s.id)}
                                                    className={cn(
                                                        "group p-5 rounded-[2rem] text-left border-2 transition-all relative overflow-hidden",
                                                        isActive
                                                            ? "bg-primary border-primary text-white shadow-2xl shadow-primary/20 scale-[1.02]"
                                                            : "bg-slate-50 dark:bg-white/5 border-transparent hover:border-primary/20 hover:scale-[1.01]"
                                                    )}
                                                >
                                                    <div className="relative z-10 space-y-1">
                                                        <p className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "text-white/60" : "text-slate-400")}>{dep}</p>
                                                        <p className="text-sm font-black uppercase tracking-tight leading-none">{s.sede?.nombre || 'Sede Central'}</p>
                                                    </div>
                                                    {isActive && <CheckCircle2 className="absolute top-6 right-6 w-5 h-5 text-white/50 animate-in zoom-in" />}
                                                    {!isActive && <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* SECCIÓN: HORARIOS Y CUPOS */}
                                <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Clock className="w-4 h-4" /></div>
                                            II. Elección de Turno
                                        </h4>
                                    </div>

                                    {currentProgram.turnos?.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {currentProgram.turnos.map((t: any) => {
                                                const isActive = String(selectedTurnoId) === String(t.id);
                                                const inscritos = t._count?.inscripciones || 0;
                                                const capacidad = t.cupo || 0;
                                                const isUnlimited = capacidad === 0;
                                                const porcentaje = capacidad > 0 ? Math.min((inscritos / capacidad) * 100, 100) : 0;
                                                const colorClase = porcentaje > 90 ? 'bg-rose-500' : porcentaje > 70 ? 'bg-amber-500' : 'bg-emerald-500';

                                                return (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setSelectedTurnoId(t.id)}
                                                        disabled={!isUnlimited && inscritos >= capacidad}
                                                        className={cn(
                                                            "group p-6 rounded-[2.5rem] text-left border-2 transition-all flex flex-col gap-5 relative overflow-hidden",
                                                            isActive
                                                                ? "bg-white dark:bg-slate-800 border-primary shadow-2xl shadow-primary/10 scale-[1.02]"
                                                                : "bg-slate-50 dark:bg-white/5 border-transparent hover:border-primary/20",
                                                            (!isUnlimited && inscritos >= capacidad) && "opacity-40 grayscale pointer-events-none"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all", isActive ? "bg-primary text-white" : "bg-white dark:bg-white/5 shadow-sm text-primary group-hover:scale-110")}>
                                                                <Clock className="w-6 h-6" />
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "text-primary" : "text-slate-400")}>{isUnlimited ? 'Cupos' : 'Cupos Libres'}</p>
                                                                <p className="text-sm font-black">{isUnlimited ? '∞' : capacidad - inscritos}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div>
                                                                <span className="text-xs font-black uppercase tracking-tight block mb-1">{t.turnoConfig?.nombre || 'Turno Único'}</span>
                                                                {t.turnoConfig?.horaInicio && t.turnoConfig?.horaFin && (
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                                                        {t.turnoConfig.horaInicio.substring(0, 5)} — {t.turnoConfig.horaFin.substring(0, 5)}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                                                                    <span className="text-slate-400">{isUnlimited ? 'Participantes' : 'Progreso'}</span>
                                                                    <span className={cn(isActive ? "text-primary" : "text-slate-400")}>{inscritos} / {isUnlimited ? '∞' : capacidad}</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                                    <motion.div initial={{ width: 0 }} animate={{ width: isUnlimited ? '15%' : `${porcentaje}%` }} transition={{ duration: 1, ease: "easeOut" }} className={cn("h-full rounded-full transition-all", isActive ? (isUnlimited ? 'bg-indigo-500' : colorClase) : "bg-slate-300 dark:bg-white/20")} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isActive && <CheckCircle2 className="absolute top-6 right-6 w-5 h-5 text-primary animate-in zoom-in" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-12 rounded-[3rem] bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 text-center space-y-3">
                                            <Calendar className="w-10 h-10 mx-auto text-slate-300" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No se requieren turnos para esta sede</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-8">
                                <button onClick={() => setStep(2)} className="h-20 px-10 rounded-[2rem] bg-slate-100 dark:bg-white/5 font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all flex items-center gap-3">
                                    <ArrowLeft className="w-4 h-4" /> Atrás
                                </button>
                                <button
                                    onClick={() => setStep(Number(currentProgram.costo) > 0 ? 4 : 5)}
                                    disabled={(!selectedTurnoId && currentProgram.turnos?.length > 0)}
                                    className="flex-1 h-20 rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                                >
                                    Siguiente Paso <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Baucher */}
                    {step === 4 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4">
                            <div className="aspect-square rounded-3xl bg-slate-50 dark:bg-white/5 border-4 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center relative group overflow-hidden">
                                {baucher.imagenPreview ? (
                                    <img src={baucher.imagenPreview} className="w-full h-full object-cover" alt="Baucher" />
                                ) : (
                                    <div className="text-center space-y-3 opacity-30">
                                        <Upload className="w-12 h-12 mx-auto" />
                                        <p className="text-[9px] font-black uppercase tracking-widest">Subir Depósito</p>
                                    </div>
                                )}
                                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Número de Depósito</label>
                                    <input value={baucher.nroDeposito} onChange={e => setBaucher(p => ({ ...p, nroDeposito: e.target.value }))} className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 font-bold text-sm" />
                                </div>
                                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Monto Confirmado</p>
                                    <p className="text-3xl font-black">{programa.costo} Bs.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setStep(3)} className="h-16 px-6 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase tracking-widest text-[11px]">Atrás</button>
                                    <button onClick={() => setStep(5)} disabled={!baucher.imagen || !baucher.nroDeposito} className="flex-1 h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-primary/20">Continuar al Resumen</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Resumen */}
                    {step === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-2">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h4 className="text-2xl font-black uppercase tracking-tight">Verificación de Registro</h4>
                            <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left border-2 border-slate-100 dark:border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Postulante</p>
                                    <p className="font-black text-lg uppercase tracking-tight truncate">
                                        {personaFound ? persona.nombre : manualData.nombre} {personaFound ? [persona.apellidoPaterno, persona.apellidoMaterno].filter(Boolean).join(' ') : manualData.apellidos}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Programa / Curso</p>
                                    <p className="font-black text-lg uppercase tracking-tight truncate">{programa.nombre}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Versión Inscrita</p>
                                    <p className="font-black text-lg uppercase tracking-tight">
                                        {programa.version?.numero ? `VERSIÓN ${programa.version.numero} (${programa.version.gestion})` : 'VERSIÓN ÚNICA'}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Sede de Estudios</p>
                                    <p className="font-black text-lg uppercase tracking-tight">
                                        {(() => {
                                            const s = (programa.sedesDisponibles || []).find((x: any) => String(x.id) === String(selectedSedeId));
                                            const prog = s || programa;
                                            const d = prog.sede?.departamento?.nombre || prog.sede?.dep?.nombre;
                                            const n = prog.sede?.nombre || 'SEDE CENTRAL';
                                            return d ? `${d} - ${n}` : n;
                                        })()}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Horario / Turno</p>
                                    <p className="font-black text-lg uppercase tracking-tight">
                                        {(() => {
                                            const t = currentProgram.turnos?.find((x: any) => String(x.id) === String(selectedTurnoId));
                                            if (!t) return 'NO REQUERIDO';
                                            const n = t.turnoConfig?.nombre || 'ÚNICO';
                                            const hasTime = t.turnoConfig?.horaInicio && t.turnoConfig?.horaFin;
                                            const h = hasTime ? `${t.turnoConfig.horaInicio.substring(0, 5)} - ${t.turnoConfig.horaFin.substring(0, 5)}` : '';
                                            return h ? `${n} (${h})` : n;
                                        })()}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Identificación CI</p>
                                    <p className="font-black text-lg uppercase tracking-tight">{ci} {complemento}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Contacto Directo</p>
                                    <p className="font-black text-sm uppercase tracking-tight truncate">{manualData.celular} • {manualData.correo}</p>
                                </div>

                                {/* CAMPOS EXTRA DINÁMICOS (mod_campo_extra) */}
                                {programa.mod_campo_extra && Object.keys(programa.mod_campo_extra).length > 0 && (
                                    <div className="col-span-full pt-6 mt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {Object.entries(programa.mod_campo_extra).map(([k, v]: any) => (
                                            <div key={k} className="space-y-1">
                                                <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">{k.replace(/_/g, ' ')}</p>
                                                <p className="font-black text-xs uppercase tracking-tight">{v}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setStep(Number(programa.costo) > 0 ? 4 : 3)} className="h-20 px-8 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase tracking-widest text-[11px]">Atrás</button>
                                <button onClick={handleSubmit} disabled={isLoading} className="flex-1 h-20 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all text-[11px] flex items-center justify-center gap-4">
                                    {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                                    Finalizar y Enviar Inscripción
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 7: Éxito o Comprobante de Ya Inscrito */}
                    {step === 7 && (
                        <div className="py-0 space-y-2 animate-in zoom-in">
                            <div className="text-center space-y-4">
                                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 max-w-sm mx-auto">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-black text-[10px] uppercase tracking-widest text-amber-600">Registro Detectado</p>
                                            <p className="text-[11px] text-slate-500 leading-tight font-bold">
                                                Usted ya se encuentra registrado en este programa académico.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COMPROBANTE DE INSCRIPCIÓN */}
                            <div className="bg-slate-50 dark:bg-white/5 rounded-[2rem] p-5 sm:p-8 border border-slate-100 dark:border-white/10 space-y-6 sm:space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <ShieldCheck className="w-32 h-32" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 relative z-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Postulante</p>
                                        <p className="font-black text-sm uppercase truncate">
                                            {persona?.alreadyEnrolled?.persona?.nombre} {persona?.alreadyEnrolled?.persona?.apellidos}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Curso / Programa</p>
                                        <p className="font-black text-sm uppercase">{programa.nombre}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Versión / Gestión</p>
                                        <p className="font-black text-sm uppercase">
                                            {programa.version?.numero ? `VERSIÓN ${programa.version.numero} (${programa.version.gestion})` : 'VERSIÓN 1 (2026)'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Sede de Estudios</p>
                                        <p className="font-black text-sm uppercase">
                                            {persona?.alreadyEnrolled
                                                ? `${persona.alreadyEnrolled.departamento || ''} - ${persona.alreadyEnrolled.sede || 'Sede Central'}`
                                                : `${currentProgram.sede?.departamento?.nombre || ''} - ${currentProgram.sede?.nombre || 'Sede Central'}`}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Turno Habilitado</p>
                                        <p className="font-black text-sm uppercase tracking-widest">
                                            {persona?.alreadyEnrolled
                                                ? persona.alreadyEnrolled.turno || 'ÚNICO'
                                                : currentProgram.turnos?.find((x: any) => String(x.id) === String(selectedTurnoId))?.turnoConfig?.nombre || 'ÚNICO'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Contacto Registrado</p>
                                        <p className="font-black text-sm uppercase tracking-tight">
                                            {persona?.alreadyEnrolled?.persona?.celular || manualData.celular} • {persona?.alreadyEnrolled?.persona?.correo || manualData.correo}
                                        </p>
                                    </div>
                                </div>

                                {persona?.alreadyEnrolled && (
                                    <div className="pt-6 border-t border-slate-200 dark:border-white/10 space-y-6">
                                        {!isConfirmed && (
                                            <div
                                                className="flex items-start gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all cursor-pointer select-none group"
                                                onClick={() => setAcceptedTerms(!acceptedTerms)}
                                            >
                                                <div className={cn(
                                                    "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                                    acceptedTerms ? "bg-primary border-primary shadow-lg shadow-primary/20" : "border-slate-300 dark:border-white/20"
                                                )}>
                                                    {acceptedTerms && <Check size={14} className="text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-black leading-tight text-slate-800 dark:text-slate-200">
                                                        Acepto las condiciones establecidas en el Formulario de Compromiso de Permanencia y Conclusión
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Obligatorio para finalizar su inscripción.</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {!isConfirmed ? (
                                                <button
                                                    disabled={!acceptedTerms || isLoading}
                                                    onClick={async () => {
                                                        try {
                                                            setIsLoading(true);
                                                            await publicService.confirmarInscripcion(persona.alreadyEnrolled.id);
                                                            setIsConfirmed(true);
                                                            toast.success('Compromiso confirmado correctamente');
                                                        } catch (e) {
                                                            toast.error('Error al confirmar compromiso');
                                                        } finally {
                                                            setIsLoading(false);
                                                        }
                                                    }}
                                                    className="flex-1 h-14 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                                                >
                                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                    Confirmar Inscripción
                                                </button>
                                            ) : (
                                                <div className="flex-1 flex flex-col gap-4">
                                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
                                                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                        <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 leading-tight">
                                                            DEBE DESCARGAR, IMPRIMIR Y ENTREGAR ESTE COMPROMISO FIRMADO EN LA <span className="uppercase">{persona.alreadyEnrolled.sede || 'Sede Central'}</span>.
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => setShowPreview(true)}
                                                            className="flex-1 h-14 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                                                        >
                                                            <Search className="w-4 h-4" />
                                                            Previsualizar
                                                        </button>

                                                        {isClient && (
                                                            <PDFDownloadLink
                                                                document={<InscripcionPDF inscripcion={persona.alreadyEnrolled} />}
                                                                fileName={`Inscripcion_${persona.alreadyEnrolled.id}.pdf`}
                                                                className="flex-1 h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                                            >
                                                                {({ loading }: any) => (
                                                                    <>
                                                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 rotate-180" />}
                                                                        Descargar PDF
                                                                    </>
                                                                )}
                                                            </PDFDownloadLink>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                                <button 
                                    onClick={onClose} 
                                    className="w-full h-14 sm:h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[11px] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20"
                                >
                                    {isConfirmed ? 'Finalización Exitosa' : 'Cerrar Ventana'}
                                </button>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {showPreview && isClient && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowPreview(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative w-full max-w-5xl h-[85vh] bg-white rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
                            >
                                <div className="h-16 border-b flex items-center justify-between px-8 bg-slate-50">
                                    <h4 className="font-black uppercase tracking-widest text-xs text-slate-800">Vista Previa de Compromiso</h4>
                                    <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 w-full bg-slate-200">
                                    <PDFViewer width="100%" height="100%" showToolbar={true}>
                                        <InscripcionPDF inscripcion={persona.alreadyEnrolled} />
                                    </PDFViewer>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
