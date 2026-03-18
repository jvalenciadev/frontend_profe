'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Calendar, Clock, MapPin, Users,
    Upload, CheckCircle2, X, Search, Loader2, BadgeCheck,
    CreditCard, AlertCircle, ChevronRight, ShieldCheck,
    Building2, GraduationCap, User, AlertTriangle, Info
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
    try { return new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch { return '—'; }
};

// ── STEPPER STEPS ─────────────────────────────────────────────────────────────
// 1: Identificación   2: Datos personales (si no en padrón)
// 3: Comprobante      4: Confirmación      5: Éxito

export default function OfertaDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [programa, setPrograma] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!id) return;
        publicService.getProgramaById(id as string)
            .then(setPrograma)
            .catch(() => toast.error('No se pudo cargar el programa'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>
    );

    if (!programa) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#FDFDFD]">
            <p className="text-2xl font-black text-slate-400 uppercase tracking-widest">Programa no encontrado</p>
            <Link href="/oferta" className="px-8 py-4 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest text-xs">
                Ver Oferta
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-950 text-slate-900 dark:text-white">
            {/* ── HERO BANNER ── */}
            <div className="relative h-[55vh] min-h-[450px] overflow-hidden">
                {programa.banner ? (
                    <img src={IMG(programa.banner)} alt={programa.nombre} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-900 to-primary-700" />
                )}
                <div className="absolute inset-x-0 bottom-0 z-10 pb-12 md:pb-16 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent">
                    <div className="max-w-5xl mx-auto px-10">
                        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} className="flex flex-col items-start gap-8">
                            
                            {/* Back Button - Integrated into the bottom stack for safety */}
                            <button onClick={() => router.back()} className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver a Ofertas
                            </button>

                            <div className="space-y-6 w-full">
                                <div className="flex flex-wrap gap-3">
                                    {programa.tipo && (
                                        <div className="px-5 py-2 rounded-xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-600/30">
                                            {programa.tipo.nombre}
                                        </div>
                                    )}
                                    {programa.modalidad && (
                                        <div className="px-5 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                                            {programa.modalidad.nombre}
                                        </div>
                                    )}
                                    {programa.estadoInscripcion && (
                                        <div className="px-5 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-[11px] font-black uppercase tracking-[0.2em] backdrop-blur-sm">
                                            Inscripciones Abiertas
                                        </div>
                                    )}
                                </div>

                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.85] tracking-tighter uppercase max-w-4xl drop-shadow-2xl">
                                    {programa.nombre}
                                </h1>

                                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                                    {programa.nombreAbreviado && (
                                        <p className="text-white/40 text-xs font-bold uppercase tracking-[0.4em] border-l-2 border-primary-600 pl-4 leading-none">
                                            {programa.nombreAbreviado}
                                        </p>
                                    )}
                                    {programa.version && (
                                        <div className="flex items-center gap-3 text-white/30 text-[10px] font-black uppercase tracking-widest leading-none">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                            Versión {programa.version.numero} - {programa.version.gestion}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16 space-y-16">

                {/* Sedes Disponibles - Selector Institucional y Creativo */}
                {programa.sedesDisponibles?.length > 1 && (
                    <div className="relative py-10 px-8 rounded-[3rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 overflow-hidden">
                        {/* Fondo Decorativo */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative space-y-10">
                            <div className="text-center space-y-3">
                                <div className="flex items-center justify-center gap-4">
                                    <div className="h-px bg-primary-600/20 w-12" />
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600">Disponibilidad Regional</h2>
                                    <div className="h-px bg-primary-600/20 w-12" />
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Seleccione su Sede Académica</h3>
                                <p className="text-slate-500 text-sm max-w-xl mx-auto">
                                    Este programa se imparte de forma descentralizada. Por favor, seleccione la ubicación donde desea realizar sus estudios para ver cronogramas y turnos específicos.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {programa.sedesDisponibles.map((s: any) => (
                                    <motion.button
                                        key={s.id}
                                        whileHover={{ y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            const sedesList = programa.sedesDisponibles;
                                            setPrograma({ ...s, sedesDisponibles: sedesList });
                                            window.history.replaceState(null, '', `/oferta/${s.id}`);
                                            toast.success(`Cargando información de la sede ${s.sede?.nombre}`, {
                                                icon: <MapPin className="w-4 h-4 text-primary-600" />,
                                                className: "font-bold"
                                            });
                                        }}
                                        className={cn(
                                            "group relative flex flex-col p-6 rounded-[2.5rem] border-2 transition-all duration-500 text-left",
                                            programa.id === s.id 
                                                ? "bg-white dark:bg-slate-900 border-primary-600 shadow-[0_20px_40px_-15px_rgba(var(--primary-rgb),0.2)]" 
                                                : "bg-white/50 dark:bg-white/5 border-transparent hover:border-primary-600/30 grayscale hover:grayscale-0"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                                programa.id === s.id ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-primary-600"
                                            )}>
                                                <MapPin className="w-6 h-6" />
                                            </div>
                                            {programa.id === s.id && (
                                                <span className="px-3 py-1 rounded-full bg-primary-600/10 text-primary-600 text-[9px] font-black uppercase tracking-widest border border-primary-600/20">
                                                    Seleccionada
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <p className={cn(
                                                "text-[9px] font-black uppercase tracking-widest leading-none",
                                                programa.id === s.id ? "text-primary-600" : "text-slate-400"
                                            )}>
                                                Sede Académica
                                            </p>
                                            <h4 className={cn(
                                                "text-xl font-black uppercase tracking-tight leading-tight",
                                                programa.id === s.id ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                                            )}>
                                                {s.sede?.nombre}
                                            </h4>
                                        </div>

                                        {/* Indicador inferior decorativo en activa */}
                                        {programa.id === s.id && (
                                            <motion.div layoutId="activeSede" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-600 rounded-t-full" />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Meta cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Clock, label: 'Duración', value: programa.duracion?.nombre || `${programa.cargaHoraria}h` },
                        { icon: Calendar, label: 'Inicio Clases', value: fmt(programa.fechaInicioClases) },
                        { icon: MapPin, label: 'Sede', value: programa.sede?.nombre || 'Nacional' },
                        { icon: Users, label: 'Inversión', value: `${programa.costo} Bs.` },
                    ].map((m, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                            className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm space-y-3">
                            <m.icon className="w-6 h-6 text-primary-600" />
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">{m.label}</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{m.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Inscripción window */}
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border border-primary-200 dark:border-primary-500/20">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">Período de Inscripciones en {programa.sede?.nombre}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">
                                {fmt(programa.fechaInicioInscripcion)} — {fmt(programa.fechaFinInscripcion)}
                            </p>
                            <div className="flex items-center gap-2">
                                <div className={cn('w-2 h-2 rounded-full', programa.estadoInscripcion ? 'bg-green-500 animate-pulse' : 'bg-red-400')} />
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                    {programa.estadoInscripcion ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            disabled={!programa.estadoInscripcion}
                            className="shrink-0 px-10 py-5 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest text-xs hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary-600/25 flex items-center gap-3"
                        >
                            <GraduationCap className="w-5 h-5" />
                            Inscribirse Ahora
                        </button>
                    </div>
                </div>


                {/* Turnos disponibles */}
                {programa.turnos?.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Turnos Disponibles</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {programa.turnos.map((t: any) => (
                                <div key={t.id} className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Turno</p>
                                        <p className="font-black text-slate-900 dark:text-white">{t.turnoConfig?.nombre || 'General'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cupos</p>
                                        <p className="font-black text-primary-600 text-lg">{t.cupo}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Descripción */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                                <GraduationCap className="w-8 h-8 text-primary-600" />
                                Acerca del Programa
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed text-lg"
                                dangerouslySetInnerHTML={{ __html: programa.contenido || '' }} />
                        </div>

                        {/* Módulos */}
                        {programa.modulos && programa.modulos.length > 0 && (
                            <div className="space-y-8 pt-8">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">Plan de Estudios</h3>
                                    <p className="text-slate-500 text-sm italic">Conoce los módulos que forman parte de este programa de formación.</p>
                                </div>
                                <div className="space-y-4">
                                    {programa.modulos.map((mod: any, idx: number) => (
                                        <div key={mod.id} className="group p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-primary-600/30 transition-all">
                                            <div className="flex gap-6 items-start">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center font-black text-primary-600 shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-all text-xl">
                                                    {mod.orden || idx + 1}
                                                </div>
                                                <div className="space-y-3">
                                                    <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{mod.nombre}</h4>
                                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{mod.descripcion}</p>
                                                    <div className="flex flex-wrap gap-4 pt-2">
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {fmt(mod.fechaInicio)} — {fmt(mod.fechaFin)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-8 sticky top-24">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Información Adicional</h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Carga Horaria</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{programa.cargaHoraria} Horas Académicas</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Modalidad</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <p className="font-black text-slate-800 dark:text-slate-200">{programa.modalidad?.nombre}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Sede Designada</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <p className="font-black text-slate-800 dark:text-slate-200">{programa.sede?.nombre}</p>
                                    </div>
                                </div>

                                {programa.horario && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Horario de Clases</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <p className="font-black text-slate-800 dark:text-slate-200 capitalize">
                                                {programa.horario === 'sa' ? 'Sábados' : 
                                                 programa.horario === 'do' ? 'Domingos' : 
                                                 programa.horario === 'lu-vi' ? 'Lunes a Viernes' : 
                                                 programa.horario}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setShowModal(true)} disabled={!programa.estadoInscripcion}
                                className="w-full py-4 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-600/30 text-xs">
                                <BadgeCheck className="w-5 h-5" /> Inscribirme Ahora
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── INSCRIPTION MODAL ── */}
            {mounted && showModal && (
                <InscripcionModal
                    programa={programa}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE INSCRIPCIÓN  (steps: 1=ID  2=Personal  3=Baucher  4=Confirm  5=OK)
// ─────────────────────────────────────────────────────────────────────────────
function InscripcionModal({ programa, onClose }: { programa: any; onClose: () => void }) {
    const [step, setStep] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [persona, setPersona] = useState<any>(null);
    const [personaFound, setPersonaFound] = useState<boolean | null>(null);
    const [personaSource, setPersonaSource] = useState<'map_persona' | 'admins' | null>(null);
    const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

    // Step 1
    const [ci, setCi] = useState('');
    const [complemento, setComplemento] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');

    useEffect(() => {
        setAlreadyEnrolled(false);
    }, [ci, complemento, fechaNacimiento]);

    // Step 2 (datos personales o validación)
    const [manualData, setManualData] = useState({
        nombre: '', apellidos: '', correo: '', correoConfirmacion: '', celular: ''
    });
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Step 3 – baucher
    const [baucher, setBaucher] = useState({
        nroDeposito: '', monto: programa?.costo?.toString() || '',
        fecha: new Date().toISOString().split('T')[0], imagen: '', imagenPreview: ''
    });

    const turno = programa.turnos?.[0] || null;
    const turnoId = turno?.id || '';
    const sedeId = programa.sedeId || programa.sede?.id || '';

    // ── Helpers ────────────────────────────────────────────────────────────────
    const displayNombre = personaFound
        ? [persona?.nombre, persona?.nombre2, persona?.apellidoPaterno, persona?.apellidoMaterno].filter(Boolean).join(' ')
        : [manualData.nombre, manualData.apellidos].filter(Boolean).join(' ');

    // ── Step 1: Buscar persona ─────────────────────────────────────────────────
    const handleSearch = async () => {
        if (!ci || !fechaNacimiento) return toast.error('Ingrese CI y fecha de nacimiento');
        setIsSearching(true);
        try {
            const data = await publicService.checkPersonaByDate(
                ci.trim(), fechaNacimiento, complemento.trim() || undefined, programa.id
            );
            setPersona(data);
            setPersonaFound(data?.found ?? false);
            setPersonaSource(data?.source ?? null);
            setAlreadyEnrolled(data?.alreadyEnrolled ?? false);

            if (data?.alreadyEnrolled) {
                toast.error('Usted ya se encuentra inscrito en este programa (o en otra sede de esta misma versión)');
                return;
            }
            if (data?.found) {
                setManualData(prev => ({
                    ...prev,
                    correo: data.correo || '',
                    correoConfirmacion: data.correo || '',
                    celular: data.celular || ''
                }));
                toast.success('¡Persona encontrada! Verifique sus datos de contacto.');
            } else {
                toast.info('No encontrado en el padrón ni en base de datos local. Complete sus datos manualmente.');
            }
            // SIEMPRE vamos al step 2 para confirmar correo
            setStep(2);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al buscar datos');
        } finally {
            setIsSearching(false);
        }
    };

    // ── Step 2 → Step 3 ────────────────────────────────────────────────────────
    const handleManualNext = async () => {
        if (!personaFound) {
            if (!manualData.nombre || !manualData.apellidos) return toast.error('Nombre y apellidos son obligatorios');
        }
        if (!manualData.correo) return toast.error('El correo es obligatorio');
        if (manualData.correo !== manualData.correoConfirmacion) return toast.error('Los correos electrónicos no coinciden');

        if (!personaFound) {
            if (!isEmailSent) {
                // Generar y enviar código
                setIsVerifying(true);
                try {
                    await publicService.sendVerificationCode(manualData.correo, `${manualData.nombre} ${manualData.apellidos}`);
                    setIsEmailSent(true);
                    toast.success('Código de verificación enviado. Revisa tu bandeja de entrada o spam.');
                } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Error al enviar código');
                } finally {
                    setIsVerifying(false);
                }
                return; // Pausar para que introduzca el código
            } else {
                // Verificar código
                if (!verificationCode) return toast.error('Ingrese el código de verificación');

                setIsVerifying(true);
                try {
                    await publicService.verifyCode(manualData.correo, verificationCode);
                    toast.success('Correo verificado exitosamente ✓');
                    setStep(Number(programa.costo) > 0 ? 3 : 4); // Continuar
                } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Código incorrecto');
                } finally {
                    setIsVerifying(false);
                }
                return;
            }
        }

        // Si ya está verificado porque fue encontrado en padrón/admins
        setStep(Number(programa.costo) > 0 ? 3 : 4);
    };

    // ── Step 3: Upload baucher ─────────────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 1 * 1024 * 1024) return toast.error('El archivo no puede superar 1MB');
        // Preview local inmediato
        const preview = URL.createObjectURL(file);
        setBaucher(prev => ({ ...prev, imagenPreview: preview }));
        try {
            const res = await publicService.uploadBaucher(file);
            if (res.success) {
                setBaucher(prev => ({ ...prev, imagen: res.data.path, imagenPreview: preview }));
                toast.success('Comprobante subido correctamente');
            }
        } catch {
            toast.error('Error al subir el comprobante');
            setBaucher(prev => ({ ...prev, imagenPreview: '' }));
        }
    };

    const handleBaucherNext = () => {
        if (!baucher.imagen) return toast.error('Suba la imagen del comprobante');
        if (!baucher.nroDeposito) return toast.error('Ingrese el número de depósito');
        setStep(4);
    };

    // ── Step 4 → Submitting ────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!turnoId) return toast.error('Este programa no tiene turnos configurados');
        if (!sedeId) return toast.error('Este programa no tiene sede asignada');

        setIsLoading(true);
        try {
            const res = await publicService.registerInscripcion({
                userId: persona?.userId || null,
                programaId: programa.id,
                turnoId,
                sedeId,
                baucher,
                datosPersona: !personaFound ? {
                    ci, complemento, fechaNacimiento,
                    nombre: manualData.nombre,
                    apellidos: manualData.apellidos,
                    correo: manualData.correo,
                } : {
                    // Si fue encontrado pero actualizó su correo/celular
                    ci, complemento, fechaNacimiento,
                    nombre: persona.nombre,
                    apellidos: [persona.apellidoPaterno, persona.apellidoMaterno].filter(Boolean).join(' '),
                    correo: manualData.correo,
                },
            });
            if (res.success) {
                setStep(5);
                toast.success('¡Inscripción registrada exitosamente!');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al procesar inscripción');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Stepper config ─────────────────────────────────────────────────────────
    const steps = [
        { n: 1, label: 'Verificación', icon: BadgeCheck },
        { n: 2, label: 'Datos', icon: User },
        { n: 3, label: 'Comprobante', icon: CreditCard },
        { n: 4, label: 'Confirmar', icon: ShieldCheck },
        { n: 5, label: 'Listo', icon: CheckCircle2 },
    ];

    // Visible steps (ya no saltamos el step 2)
    const visibleSteps = Number(programa.costo) > 0 ? steps : steps.filter(s => s.n !== 3);
    const displayStep = step;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={step < 4 ? onClose : undefined} />

            <motion.div initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 max-h-[92vh] overflow-y-auto">

                {/* ── Header ── */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 rounded-t-[2.5rem]">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary-600 mb-0.5">Inscripción al Programa</p>
                        <h2 className="text-base font-black uppercase tracking-tighter leading-tight max-w-lg">{programa.nombre}</h2>
                    </div>
                    {step < 5 && (
                        <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shrink-0">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* ── Stepper ── */}
                <div className="flex items-center gap-0 px-8 py-4 border-b border-slate-100 dark:border-white/10 overflow-x-auto">
                    {visibleSteps.map((s, idx) => {
                        const active = displayStep === idx + 1;
                        const done = displayStep > idx + 1;
                        return (
                            <div key={s.n} className="flex items-center gap-0 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                                        active ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' :
                                            done ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                    )}>
                                        {done ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                                    </div>
                                    <span className={cn('text-[10px] font-black uppercase tracking-widest hidden sm:block',
                                        active ? 'text-primary-600' : done ? 'text-green-600' : 'text-slate-300 dark:text-slate-700')}>
                                        {s.label}
                                    </span>
                                </div>
                                {idx < visibleSteps.length - 1 && (
                                    <div className={cn('w-8 h-px mx-2', done ? 'bg-green-400' : 'bg-slate-200 dark:bg-white/10')} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Body ── */}
                <div className="p-8">
                    <AnimatePresence mode="wait">

                        {/* ═══ STEP 1: Verificación ═══ */}
                        {step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">Verificación de Identidad</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Ingrese su CI y fecha de nacimiento. El sistema buscará automáticamente sus datos en el padrón del Ministerio de Educación y en nuestra base de datos.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cédula de Identidad *</label>
                                        <input value={ci} onChange={e => setCi(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none font-bold text-lg transition-all"
                                            placeholder="Ej: 14122404" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Complemento (si tiene)</label>
                                        <input value={complemento} onChange={e => setComplemento(e.target.value.toUpperCase())}
                                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none font-bold transition-all"
                                            placeholder="Ej: 1A" maxLength={4} />
                                    </div>
                                    <div className="space-y-2 col-span-full">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha de Nacimiento *</label>
                                        <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)}
                                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none font-bold transition-all" />
                                    </div>
                                </div>

                                {alreadyEnrolled ? (
                                    <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-500/20 flex gap-4 items-start shadow-sm">
                                        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight text-sm">Ya se encuentra inscrito</p>
                                            <p className="text-xs text-amber-800/80 dark:text-amber-500/60 leading-relaxed font-medium">
                                                Detectamos que ya tienes una inscripción activa para la <span className="font-bold">v{programa.version?.numero}</span> de este programa. 
                                                Por favor, revisa tu panel de participante o contacta con soporte si crees que esto es un error.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex gap-3 items-start">
                                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-700 dark:text-blue-400">
                                            Su CI se busca en el padrón SIE del Ministerio de Educación y también en nuestra base de datos. Si está registrado, sus datos se cargarán automáticamente.
                                        </p>
                                    </div>
                                )}

                                <button onClick={handleSearch} disabled={isSearching}
                                    className="w-full h-14 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-primary-600/20">
                                    {isSearching
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Buscando en el padrón...</>
                                        : <><Search className="w-5 h-5" /> Verificar Identidad y Continuar</>}
                                </button>
                            </motion.div>
                        )}

                        {/* ═══ STEP 2: Datos manuales o Validación de Correo ═══ */}
                        {step === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">
                                        {personaFound ? 'Tus Datos de Contacto' : 'Sus Datos Personales'}
                                    </h3>
                                    <p className="text-slate-500 text-sm">
                                        {personaFound ? 'Verifica y actualiza tu correo y número de celular si es necesario.' : 'Complete sus datos para continuar con la inscripción.'}
                                    </p>
                                </div>

                                {personaFound ? (
                                    <div className="p-5 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 flex gap-3 items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-green-800 dark:text-green-400 uppercase tracking-wider">
                                                {personaSource === 'map_persona' ? 'Verificado en Padrón (Ministerio)' : 'Verificado en Base de Datos (PROFE)'}
                                            </p>
                                            <p className="text-xs text-green-700 dark:text-green-500 font-bold">
                                                {[persona?.nombre, persona?.nombre2, persona?.apellidoPaterno, persona?.apellidoMaterno].filter(Boolean).join(' ')}
                                            </p>
                                            <p className="text-xs text-green-700/80 dark:text-green-500/80 font-medium mt-1">
                                                Complete su información de contacto a continuación.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex gap-3 items-start">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">No encontrado en el padrón</p>
                                            <p className="text-xs text-amber-700 dark:text-amber-500">
                                                CI <strong>{ci}</strong> no fue encontrado. Complete sus datos profesionales.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {!personaFound && [
                                        { label: 'Nombres completos *', key: 'nombre', ph: '......', upper: true },
                                        { label: 'Apellidos completos *', key: 'apellidos', ph: '.....', upper: true },
                                    ].map(f => (
                                        <div key={f.key} className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{f.label}</label>
                                            <input
                                                value={(manualData as any)[f.key]}
                                                disabled={isEmailSent}
                                                onChange={e => {
                                                    const val = f.upper ? e.target.value.toUpperCase() : e.target.value;
                                                    setManualData(prev => ({ ...prev, [f.key]: val }));
                                                }}
                                                placeholder={f.ph}
                                                style={f.upper ? { textTransform: 'uppercase' } : {}}
                                                className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none font-bold transition-all disabled:opacity-60" />
                                        </div>
                                    ))}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo electrónico *</label>
                                        <input
                                            type="email"
                                            value={manualData.correo}
                                            disabled={isEmailSent}
                                            onChange={e => setManualData(prev => ({ ...prev, correo: e.target.value.toLowerCase() }))}
                                            placeholder="correo@ejemplo.com"
                                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none font-bold transition-all disabled:opacity-60" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmar Correo *</label>
                                        <input
                                            type="email"
                                            value={manualData.correoConfirmacion}
                                            disabled={isEmailSent}
                                            onChange={e => setManualData(prev => ({ ...prev, correoConfirmacion: e.target.value.toLowerCase() }))}
                                            placeholder="correo@ejemplo.com"
                                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none font-bold transition-all disabled:opacity-60" />
                                    </div>

                                    <div className="space-y-2 col-span-full md:col-span-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Celular</label>
                                        <input
                                            value={manualData.celular}
                                            disabled={isEmailSent}
                                            onChange={e => setManualData(prev => ({ ...prev, celular: e.target.value }))}
                                            placeholder="76000000"
                                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none font-bold transition-all disabled:opacity-60" />
                                    </div>

                                    {/* Campo Código de Verificación visible solo tras enviar el correo */}
                                    {!personaFound && isEmailSent && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 col-span-full">
                                            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 mb-2">
                                                <p className="text-xs text-indigo-800 dark:text-indigo-400 font-bold">Hemos enviado un código de 6 dígitos al correo {manualData.correo}</p>
                                                <p className="text-[10px] text-indigo-600 dark:text-indigo-500 italic mt-1">Revise su bandeja de entrada (y la carpeta SPAM).</p>
                                            </div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Código de Verificación *</label>
                                            <input
                                                value={verificationCode}
                                                onChange={e => setVerificationCode(e.target.value)}
                                                placeholder="Ej: 123456"
                                                maxLength={6}
                                                className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-indigo-600 outline-none font-bold text-lg text-center tracking-widest transition-all" />
                                        </motion.div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => { setStep(1); setIsEmailSent(false); }} className="px-8 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">
                                        Atrás
                                    </button>
                                    <button onClick={handleManualNext} disabled={isVerifying} className="flex-1 h-14 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest text-xs hover:brightness-110 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                                        {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                        {personaFound ? 'Continuar' : !isEmailSent ? 'Enviar Código' : 'Verificar y Continuar'}
                                        {!isVerifying && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ STEP 3: Comprobante ═══ */}
                        {step === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">Comprobante de Depósito</h3>
                                    <p className="text-slate-500 text-sm">Suba la imagen de su comprobante de depósito bancario.</p>
                                </div>

                                {/* Banner persona */}
                                {personaFound ? (
                                    <div className="p-5 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-green-600">
                                                {personaSource === 'map_persona' ? 'Verificado en Padrón Ministerial ✓' : 'Verificado en Base de Datos ✓'}
                                            </p>
                                            <p className="font-black text-green-800 dark:text-green-300 text-sm">
                                                {[persona?.nombre, persona?.nombre2, persona?.apellidoPaterno, persona?.apellidoMaterno].filter(Boolean).join(' ')}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Datos Ingresados Manualmente</p>
                                            <p className="font-black text-slate-700 dark:text-slate-200 text-sm">
                                                {manualData.nombre} {manualData.apellidos}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Campos */}
                                    <div className="space-y-5">
                                        <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-500/20 flex items-center gap-3">
                                            <CreditCard className="w-5 h-5 text-primary-600 shrink-0" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-primary-500">Monto a depositar</p>
                                                <p className="text-xl font-black text-primary-700 dark:text-primary-400">{programa.costo} Bs.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nro. Depósito / Operación *</label>
                                            <input value={baucher.nroDeposito} onChange={e => setBaucher(p => ({ ...p, nroDeposito: e.target.value }))}
                                                placeholder="Ej: 0012345678"
                                                className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none font-bold transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha de Depósito *</label>
                                            <input type="date" value={baucher.fecha} onChange={e => setBaucher(p => ({ ...p, fecha: e.target.value }))}
                                                className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none font-bold transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monto depositado (Bs.)</label>
                                            <input type="number" value={baucher.monto} onChange={e => setBaucher(p => ({ ...p, monto: e.target.value }))}
                                                className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-600 outline-none font-bold transition-all" />
                                        </div>
                                    </div>

                                    {/* Image upload */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imagen del Comprobante *</label>
                                        <input type="file" id="baucher-file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                        <label htmlFor="baucher-file" className="block rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-primary-500 transition-all cursor-pointer bg-slate-50 dark:bg-white/[0.02] overflow-hidden h-64">
                                            {baucher.imagenPreview ? (
                                                <div className="relative h-full">
                                                    <img src={baucher.imagenPreview} alt="Comprobante" className="w-full h-full object-contain p-3" />
                                                    <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/40 flex items-center justify-center transition-all group">
                                                        <span className="text-white text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all bg-slate-900/70 px-4 py-2 rounded-xl">Cambiar imagen</span>
                                                    </div>
                                                    {baucher.imagen && (
                                                        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-4 py-2 bg-green-500">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Comprobante subido</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                                                        <Upload className="w-7 h-7 text-slate-400" />
                                                    </div>
                                                    <div className="text-center space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Subir imagen</p>
                                                        <p className="text-[9px] text-slate-300 dark:text-slate-600">JPG, PNG, WEBP · Máx 1MB</p>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(personaFound ? 1 : 2)} className="px-8 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">
                                        Atrás
                                    </button>
                                    <button onClick={handleBaucherNext} className="flex-1 h-14 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2">
                                        Revisar y Confirmar <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ STEP 4: CONFIRMACIÓN ═══ */}
                        {step === 4 && (
                            <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">Confirmar Inscripción</h3>
                                    <p className="text-slate-500 text-sm">Verifique que toda la información sea correcta antes de confirmar.</p>
                                </div>

                                {/* Alerta de confirmación */}
                                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-300 dark:border-amber-500/30 flex gap-3 items-start">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
                                        ¿Está seguro de que desea inscribirse? Esta acción creará su registro en el sistema. Verifique que toda la información sea correcta.
                                    </p>
                                </div>

                                {/* Tarjeta de resumen */}
                                <div className="rounded-3xl border-2 border-primary-200 dark:border-primary-500/30 overflow-hidden">
                                    {/* Cabecera del programa */}
                                    <div className="bg-primary-600 px-8 py-6 space-y-1">
                                        <p className="text-[9px] font-black text-primary-200 uppercase tracking-[0.3em]">Usted se está inscribiendo en</p>
                                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{programa.nombre}</h4>
                                        {programa.nombreAbreviado && <p className="text-primary-300 text-sm font-bold">{programa.nombreAbreviado}</p>}
                                    </div>

                                    {/* Detalles */}
                                    <div className="divide-y divide-slate-100 dark:divide-white/10">
                                        {/* Participante */}
                                        <div className="flex items-center gap-4 px-8 py-5">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                                                <User className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Participante</p>
                                                <p className="font-black text-slate-900 dark:text-white text-sm truncate">{displayNombre}</p>
                                                {(persona?.correo || manualData.correo) && (
                                                    <p className="text-xs text-slate-400">{persona?.correo || manualData.correo}</p>
                                                )}
                                            </div>
                                            {personaFound && (
                                                <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-3 py-1.5 rounded-full">
                                                    {personaSource === 'map_persona' ? 'Padrón ✓' : 'BD ✓'}
                                                </span>
                                            )}
                                        </div>

                                        {/* CI */}
                                        <div className="flex items-center gap-4 px-8 py-5">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                                                <BadgeCheck className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cédula de Identidad</p>
                                                <p className="font-black text-slate-900 dark:text-white text-sm">
                                                    {ci}{complemento ? ` ${complemento}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Sede */}
                                        <div className="flex items-center gap-4 px-8 py-5">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                                                <Building2 className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sede</p>
                                                <p className="font-black text-slate-900 dark:text-white text-sm">{programa.sede?.nombre || 'No especificada'}</p>
                                            </div>
                                        </div>

                                        {/* Turno */}
                                        {turno && (
                                            <div className="flex items-center gap-4 px-8 py-5">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                                                    <Clock className="w-5 h-5 text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Turno</p>
                                                    <p className="font-black text-slate-900 dark:text-white text-sm">{turno.turnoConfig?.nombre || 'General'}</p>
                                                    <p className="text-xs text-slate-400">{turno.cupo} cupos disponibles</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Modalidad */}
                                        <div className="flex items-center gap-4 px-8 py-5">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                                                <GraduationCap className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Modalidad / Carga Horaria</p>
                                                <p className="font-black text-slate-900 dark:text-white text-sm">
                                                    {programa.modalidad?.nombre || '—'} · {programa.cargaHoraria}h
                                                </p>
                                                <p className="text-xs text-slate-400">Inicio: {fmt(programa.fechaInicioClases)}</p>
                                            </div>
                                        </div>

                                        {/* Comprobante */}
                                        {Number(programa.costo) > 0 && (
                                            <div className="flex items-start gap-4 px-8 py-5">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 mt-1">
                                                    <CreditCard className="w-5 h-5 text-slate-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Comprobante de Pago</p>
                                                    <p className="font-black text-slate-900 dark:text-white text-sm">Nro. {baucher.nroDeposito}</p>
                                                    <p className="text-xs text-slate-400">Fecha: {fmt(baucher.fecha)} · Monto: {baucher.monto} Bs.</p>
                                                </div>
                                                {baucher.imagenPreview && (
                                                    <img src={baucher.imagenPreview} alt="Comprobante" className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(Number(programa.costo) > 0 ? 3 : 2)} className="px-8 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">
                                        Corregir
                                    </button>
                                    <button onClick={handleSubmit} disabled={isLoading}
                                        className="flex-1 h-16 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 disabled:opacity-50 transition-all shadow-xl shadow-primary-600/20 text-sm">
                                        {isLoading
                                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                                            : <><ShieldCheck className="w-5 h-5" /> Sí, confirmar mi inscripción</>}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ STEP 5: Éxito ═══ */}
                        {step === 5 && (
                            <motion.div key="s5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-12 space-y-10 text-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-green-400/20 blur-[80px] rounded-full" />
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2, stiffness: 160 }}
                                        className="w-32 h-32 rounded-full bg-green-500 text-white flex items-center justify-center relative z-10 shadow-2xl shadow-green-500/30">
                                        <CheckCircle2 className="w-16 h-16" />
                                    </motion.div>
                                </div>
                                <div className="space-y-4 max-w-sm">
                                    <h3 className="text-4xl font-black uppercase tracking-tighter">¡Inscripción<br />Exitosa!</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Su inscripción al programa <strong className="text-slate-700 dark:text-slate-300">{programa.nombre}</strong> ha sido registrada correctamente.
                                        {Number(programa.costo) > 0
                                            ? ' Una vez validado el comprobante de pago, recibirá confirmación.'
                                            : ' Ya puedes acceder a los contenidos del programa.'}
                                    </p>
                                </div>
                                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-left w-full max-w-sm space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resumen</p>
                                    <p className="font-black text-slate-900 dark:text-white text-sm">{displayNombre}</p>
                                    <p className="text-xs text-slate-500">{programa.sede?.nombre || 'Sede Nacional'} · {turno?.turnoIds || 'Turno asignado'}</p>
                                </div>
                                <button onClick={onClose} className="px-16 py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all">
                                    Cerrar
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
