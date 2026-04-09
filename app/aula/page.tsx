'use client';

import { useEffect, useState } from 'react';
import { aulaService } from '@/services/aulaService';
import { InscripcionPDF } from '@/components/academico/InscripcionPDF';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, GraduationCap, ArrowRight, ShieldCheck, Timer, Award,
    User as UserIcon, Calendar, Bell, ChevronRight, Activity, Zap,
    Search, ChevronLeft, Users, Clock, Lock, CheckCircle2, Download,
    FileText, X, AlertTriangle, Check, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn, getImageUrl } from '@/lib/utils';
import { useAula } from '@/contexts/AulaContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const PDFDownloadLink = dynamic<any>(() => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink), { ssr: false });
const PDFViewer = dynamic<any>(() => import('@react-pdf/renderer').then(mod => mod.PDFViewer), { ssr: false });

export default function AulaMainPage() {
    const { theme, isFacilitator } = useAula();
    const { user, isAuthenticated } = useAuth();
    const [courses, setCourses] = useState<{ estudiante: any[], facilitador: any[] } | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmingInscripcion, setConfirmingInscripcion] = useState<any>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [acceptedCommitment, setAcceptedCommitment] = useState(false);
    const [isProcessingConfirmation, setIsProcessingConfirmation] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            if (!isAuthenticated && !user) return;
            try {
                const data = await aulaService.getMisCursos();
                setCourses(data);
            } catch (err) {
                console.error('Error loading courses', err);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [isAuthenticated, user]);

    const filteredEstudiante = (selectedProgram ? selectedProgram.modulos : (courses?.estudiante || [])).filter((item: any) =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const averageProg = (courses?.estudiante || []).length > 0
        ? Math.round((courses?.estudiante || []).reduce((acc: number, curr: any) => acc + (curr.progreso?.porcentaje || 0), 0) / (courses?.estudiante || []).length)
        : 0;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={24} />
                </div>
                <img src="/logo_aula.svg" alt="Aula Profe" className="h-20 w-auto animate-pulse" />
                <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[8px] animate-pulse">Iniciando Portal Académico</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-32 relative">
            {/* Background Texture Detail */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 space-y-12">
                {/* Header / Hero Section */}
                <header className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className={cn(
                        "lg:col-span-2 relative overflow-hidden rounded-[2rem] p-8 md:p-10 text-white shadow-xl transition-all group",
                        theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-primary"
                    )}>
                        {/* Visual Details & Patterns (No Gradients) */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            <div className="absolute top-0 right-0 w-1/2 h-full border-l border-white/20" />
                            <div className="absolute bottom-0 left-0 w-full h-1/2 border-t border-white/20" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100">
                                        <img src="/logo_aula.svg" alt="Aula Profe" className="h-10 md:h-14 w-auto transition-all hover:scale-105 duration-300" />
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                                    <Calendar size={14} className="text-white/70" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] font-black uppercase text-white/50 tracking-widest">Gestión Activa</p>
                                                    <p className="text-[10px] font-bold text-white uppercase tracking-wider">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                                </div>
                                            </div>
                                            <div className="w-px h-6 bg-white/10" />
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                                    <Clock size={14} className="text-white/70" />
                                                </div>
                                                <p className="text-sm font-black text-white tabular-nums">{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>

                                        {selectedProgram && (
                                            <button
                                                onClick={() => setSelectedProgram(null)}
                                                className="flex items-center gap-2 text-white/80 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest bg-white/10 px-6 py-3 rounded-2xl border border-white/20 shadow-xl"
                                            >
                                                <ChevronLeft size={14} /> Regresar
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
                                        {selectedProgram ? (
                                            <>Gestión de <br /><span className="text-white/70 italic">{selectedProgram.nombre}</span></>
                                        ) : (
                                            <>¡Hola de nuevo, <br /><span className="text-white/70 italic">{user?.nombre?.split(' ')[0]}!</span></>
                                        )}
                                    </h1>
                                    <div className="h-1 w-20 bg-white" />
                                    <p className="text-white/80 text-sm font-medium max-w-md leading-relaxed">
                                        {selectedProgram
                                            ? 'Explora los módulos disponibles y accede a tu material de estudio actualizado.'
                                            : `Panel centralizado de capacitación. Tienes ${courses?.estudiante?.length || 0} programas activos en seguimiento.`
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                {!selectedProgram ? (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => router.push('/aula/cursos')}
                                            className="px-6 h-11 bg-white text-primary rounded-sm font-black uppercase tracking-widest text-[10px] flex items-center gap-2 border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all"
                                        >
                                            <BookOpen size={16} />
                                            Ver Programas
                                        </button>
                                        <div className="h-11 px-4 bg-white/10 rounded-sm border border-white/20 flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-primary bg-slate-200" />)}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">+120 Colegas</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-full max-w-md">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Filtrar módulos por nombre o código..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-black/20 border border-white/20 rounded-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-xs font-bold"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Stats / Info */}
                    <div className="space-y-6">
                        <div className={cn(
                            "rounded-[2rem] border overflow-hidden",
                            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                        )}>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-primary">Estadísticas</p>
                                    <h3 className={cn("text-lg font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>Tu Actividad</h3>
                                </div>
                                <div className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center">
                                    <Activity size={16} />
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {[
                                    { title: 'Programas Académicos', count: (courses?.estudiante?.length || 0) + ' Registrados', icon: BookOpen, color: 'text-primary' },
                                    { title: 'Carga Docente', count: (courses?.facilitador?.length || 0) + ' Registrados', icon: GraduationCap, color: 'text-amber-600' },
                                    { title: 'Progreso Promedio', count: averageProg + '% Completado', icon: Activity, color: 'text-emerald-600' },
                                ].map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-2 h-2 rounded-full", i === 0 ? 'bg-primary' : i === 1 ? 'bg-amber-500' : 'bg-emerald-500')} />
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.title}</p>
                                                <p className={cn("text-sm font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>{item.count}</p>
                                            </div>
                                        </div>
                                        <item.icon size={14} className={cn("opacity-20 group-hover:opacity-100 transition-opacity", item.color)} />
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 pt-0">
                                <button
                                    onClick={() => router.push('/aula/perfil')}
                                    className="w-full h-11 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all border-b-4 border-black/10 active:border-b-0 active:translate-y-1"
                                >
                                    <UserIcon size={14} /> Gestionar Perfil
                                </button>
                            </div>
                        </div>

                        {/* Additional Tooltip/Notice Detail */}
                        <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
                            <div className="flex gap-3">
                                <Zap size={18} className="text-amber-600 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-amber-800 tracking-widest">Aviso Importante</p>
                                    <p className="text-[10px] font-medium text-amber-700 leading-tight">Recuerda completar tus evaluaciones antes del cierre de gestión.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
                    {/* Left Column: Courses list */}
                    <div className="xl:col-span-3 space-y-12">
                        <section className="space-y-10">
                            <div className="flex items-center justify-between px-4 border-l-4 border-primary">
                                <div>
                                    <h2 className={cn("text-2xl font-black flex items-center gap-4", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                        {selectedProgram ? 'Módulos Disponibles' : 'Mis Programas Académicos'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de formación continua y especialización</p>
                                </div>
                                {!selectedProgram && (
                                    <button onClick={() => router.push('/aula/cursos')} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest rounded-sm hover:bg-primary hover:text-white transition-all">
                                        Ver Catálogo Completo
                                    </button>
                                )}
                            </div>

                            {filteredEstudiante.length === 0 ? (
                                <div className={cn("p-20 text-center border-2 border-dashed rounded-xl group hover:border-primary/30 transition-colors", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <BookOpen size={32} className="text-slate-300" />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">No hay registros activos</h4>
                                    <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto mb-8 tracking-widest uppercase">Actualmente no cuentas con programas habilitados en esta categoría.</p>
                                    <button
                                        onClick={() => selectedProgram ? setSelectedProgram(null) : router.push('/aula/cursos')}
                                        className="px-8 py-3 bg-primary text-white rounded-sm font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                                    >
                                        Explorar Oferta Académica
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredEstudiante.map((item: any, i: number) => (
                                        <CourseDashboardCard
                                            key={item.id}
                                            course={item}
                                            theme={theme}
                                            isModule={!!selectedProgram}
                                            onConfirm={() => setConfirmingInscripcion(item)}
                                            onClick={() => {
                                                if (selectedProgram) {
                                                    router.push(`/aula/curso/${item.id}`);
                                                } else {
                                                    // Si es PREINSCRITO, obligar a confirmar
                                                    if (item.statusName === 'PREINSCRITO') {
                                                        setConfirmingInscripcion(item);
                                                        return;
                                                    }
                                                    setSelectedProgram(item);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* MODAL DE CONFIRMACIÓN DE COMPROMISO */}
                            <AnimatePresence>
                                {confirmingInscripcion && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => !isProcessingConfirmation && !showPreview && setConfirmingInscripcion(null)}
                                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                        />
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                            className={cn(
                                                "relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] shadow-2xl border flex flex-col",
                                                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                                            )}
                                        >
                                            <div className="p-8 md:p-12 space-y-8">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-2">
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                                                            Acción Requerida
                                                        </div>
                                                        <h3 className={cn("text-3xl font-black uppercase tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                                            Confirmación de Inscripción
                                                        </h3>
                                                    </div>
                                                    <button
                                                        onClick={() => setConfirmingInscripcion(null)}
                                                        className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 transition-colors"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>

                                                {confirmingInscripcion.statusName !== 'CONFIRMADO' ? (
                                                    <div className="space-y-8">
                                                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                                            <AlertTriangle size={20} />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="font-black text-[10px] uppercase tracking-widest text-amber-600">Registro Detectado</p>
                                                            <p className="text-[11px] text-slate-500 leading-tight font-bold">
                                                                Ya te encuentras registrado en el programa <span className="text-slate-900 dark:text-white uppercase">"{confirmingInscripcion.nombre}"</span>.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                        <div 
                                                            className="flex items-start gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all cursor-pointer select-none"
                                                            onClick={() => setAcceptedCommitment(prev => !prev)}
                                                        >
                                                            <div className={cn(
                                                                "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                                                acceptedCommitment ? "bg-primary border-primary shadow-lg shadow-primary/20" : "border-slate-300 dark:border-white/20"
                                                            )}>
                                                                {acceptedCommitment && <Check size={14} className="text-white" />}
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <p className={cn("text-xs font-black leading-tight", theme === 'dark' ? "text-slate-200" : "text-slate-800")}>
                                                                    Acepto las condiciones establecidas en el Formulario de Compromiso de Permanencia y Conclusión
                                                                </p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Es obligatorio para finalizar su inscripción oficial.</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-4">
                                                            <button
                                                                disabled={!acceptedCommitment || isProcessingConfirmation}
                                                                onClick={async () => {
                                                                    setIsProcessingConfirmation(true);
                                                                    try {
                                                                        await aulaService.confirmarInscripcion(confirmingInscripcion.inscripcionId);
                                                                        toast.success('Inscripción confirmada. ¡Bienvenido!');
                                                                        const data = await aulaService.getMisCursos();
                                                                        setCourses(data);
                                                                        setConfirmingInscripcion({ ...confirmingInscripcion, statusName: 'CONFIRMADO' });
                                                                    } catch (e) {
                                                                        toast.error('Error al confirmar inscripción');
                                                                    } finally {
                                                                        setIsProcessingConfirmation(false);
                                                                    }
                                                                }}
                                                                className="flex-1 h-16 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                                            >
                                                                {isProcessingConfirmation ? <Loader2 className="animate-spin w-5 h-5" /> : <ShieldCheck size={20} />}
                                                                Confirmar Compromiso
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-8">
                                                        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 space-y-4">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                                                    <Check size={24} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="font-black text-sm uppercase tracking-tight text-emerald-600">Inscripción Confirmada</p>
                                                                    <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase">
                                                                        DEBE DESCARGAR E IMPRIMIR ESTE DOCUMENTO Y PRESENTARLO EN LA SEDE <span className="text-emerald-700">"{confirmingInscripcion.sede || 'CENTRAL'}"</span>.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <button
                                                                onClick={() => setShowPreview(true)}
                                                                className="h-16 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <Search size={18} />
                                                                Previsualizar
                                                            </button>

                                                            <PDFDownloadLink
                                                                document={<InscripcionPDF inscripcion={confirmingInscripcion} />}
                                                                fileName={`Comprobante_${confirmingInscripcion.id}.pdf`}
                                                                className="h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                                            >
                                                                {({ loading }: any) => loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Download size={18} />}
                                                                Descargar PDF
                                                            </PDFDownloadLink>
                                                        </div>

                                                        <button
                                                            onClick={() => setConfirmingInscripcion(null)}
                                                            className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-slate-400 font-black uppercase tracking-widest text-[9px] hover:bg-slate-50 transition-all"
                                                        >
                                                            Cerrar y Continuar al Aula
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {showPreview && confirmingInscripcion && (
                                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
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
                                            className="relative w-full max-w-5xl h-[90vh] bg-white rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
                                        >
                                            <div className="h-16 border-b flex items-center justify-between px-8 bg-slate-50">
                                                <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-800">Vista Previa: Carta de Compromiso</h4>
                                                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="flex-1 w-full bg-slate-200">
                                                <PDFViewer width="100%" height="100%" showToolbar={true}>
                                                    <InscripcionPDF inscripcion={confirmingInscripcion} />
                                                </PDFViewer>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </section>

                        {isFacilitator && !selectedProgram && (
                            <section className="space-y-10">
                                <div className="flex items-center justify-between px-4">
                                    <div className="space-y-1">
                                        <h2 className={cn("text-3xl font-black flex items-center gap-4", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                            <div className="w-4 h-12 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20" />
                                            Gestión de <span className="text-amber-500">Docencia</span>
                                        </h2>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-8">Panel de Administración para Facilitadores</p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/aula/docencia')}
                                        className="px-6 py-3 rounded-2xl bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-100"
                                    >
                                        Panel Completo
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {courses?.facilitador?.slice(0, 3).map((mod: any, i: number) => (
                                        <motion.div
                                            key={mod.id}
                                            whileHover={{ y: -5 }}
                                            className={cn(
                                                "p-8 rounded-[3rem] border group hover:border-amber-500/30 transition-all flex flex-col justify-between relative overflow-hidden",
                                                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white shadow-xl shadow-slate-200/50"
                                            )}
                                        >
                                            <div className="space-y-4 relative z-10">
                                                <div className="flex items-center justify-between">
                                                    <div className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                                                        {mod.tipo || 'Módulo'}
                                                    </div>
                                                    <div className="text-slate-300">
                                                        <Users size={16} />
                                                    </div>
                                                </div>
                                                <h4 className={cn("text-xl font-black leading-tight", theme === 'dark' ? "text-white" : "text-slate-800 group-hover:text-amber-500 transition-colors")}>
                                                    {mod.nombre}
                                                </h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mod.codigo || 'S/C'}</p>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/aula/docencia`)}
                                                className="mt-10 px-6 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm"
                                            >
                                                Administrar <ArrowRight size={14} />
                                            </button>
                                            {/* Abstract background light */}
                                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column: Achievements & Quick Tools */}
                    <div className="space-y-10">
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-4">
                                <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] text-primary")}>Centro de Mensajes</h3>
                                <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                            </div>
                            <div className={cn("p-6 rounded-xl border space-y-4", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                                {[
                                    { title: 'Nuevo material', desc: 'Módulo 2 disponible', time: 'Hoy' },
                                    { title: 'Evaluación próxima', desc: 'Faltan 2 días', time: 'Ayer' },
                                ].map((note, i) => (
                                    <div key={i} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                            <Bell size={14} className="text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-800 dark:text-white truncate">{note.title}</p>
                                            <p className="text-[9px] font-medium text-slate-400 truncate">{note.desc}</p>
                                        </div>
                                        <span className="ml-auto text-[8px] font-black text-slate-400">{note.time}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-4">
                                <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] text-primary")}>Logros y Rango</h3>
                                <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                            </div>
                            <div className={cn("p-6 rounded-xl border text-center space-y-5", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                                <div className="relative inline-block group">
                                    <Award size={64} className="text-amber-500 mx-auto group-hover:scale-110 transition-transform" />
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[9px] font-black">Lv2</div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className={cn("text-sm font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>Especialista Académico</h4>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">340 / 500 XP para Senior</p>
                                </div>
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-2/3" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-4">
                                <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] text-primary")}>Utilidades Aula</h3>
                                <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Notas', icon: Award, href: '/aula/calificaciones' },
                                    { label: 'Trámites', icon: ShieldCheck, href: '#' },
                                    { label: 'Calendario', icon: Calendar, href: '#' },
                                    { label: 'Ayuda', icon: Zap, href: '#' },
                                ].map((tool: any, i: number) => (
                                    <button key={i} onClick={() => tool.href !== '#' && router.push(tool.href)} className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-all hover:border-primary group", theme === 'dark' ? "bg-slate-900 border-slate-800 hover:bg-slate-800" : "bg-white hover:bg-slate-50")}>
                                        <tool.icon size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{tool.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CourseDashboardCard({ course, theme, isModule, onClick }: any) {
    const now = new Date();
    const isLocked = isModule && (
        (course.fechaInicio && new Date(course.fechaInicio) > now) ||
        (course.fechaFin && new Date(new Date(course.fechaFin).setHours(23, 59, 59, 999)) < now)
    );

    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleCardClick = () => {
        if (isLocked) return;
        onClick();
    };

    return (
        <motion.div
            whileHover={!isLocked ? { y: -4 } : {}}
            onClick={handleCardClick}
            className={cn(
                "group relative rounded-xl p-0 border transition-all duration-300 overflow-hidden",
                isLocked ? "cursor-not-allowed grayscale-[0.6] opacity-80" : "cursor-pointer",
                theme === 'dark'
                    ? cn("bg-slate-900 border-slate-800", !isLocked && "hover:border-primary/50")
                    : cn("bg-white border-slate-200 shadow-sm", !isLocked && "hover:shadow-md hover:border-primary")
            )}
        >
            <div className="flex flex-col h-full">
                {/* Visual Header Detail */}
                <div className={cn("h-1.5 w-full", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />

                <div className="p-6 space-y-5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", isLocked ? "bg-slate-400" : "bg-primary")} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {course.codigo}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {isLocked && <Lock size={12} className="text-amber-500" />}
                            <div className="px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded-sm text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                {isModule ? 'Módulo' : course.tipo}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        {!isModule && course.imagen && (
                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 bg-slate-50">
                                <img src={getImageUrl(course.imagen)} className="w-full h-full object-cover" alt="" />
                            </div>
                        )}
                        <div className="space-y-1">
                            <h3 className={cn(
                                "text-lg font-black leading-tight line-clamp-2",
                                theme === 'dark' ? "text-white" : "text-slate-800",
                                !isLocked && "group-hover:text-primary transition-colors"
                            )}>
                                {course.nombre}
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full flex items-center justify-center", isLocked ? "bg-slate-200" : "bg-emerald-500/20")}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full", isLocked ? "bg-slate-400" : "bg-emerald-500")} />
                                </div>
                                <span className={cn("text-[9px] font-bold uppercase tracking-widest", isLocked ? "text-slate-400" : "text-emerald-600")}>
                                    {isLocked ? 'Acceso Restringido' : 'Activo'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Progreso Académico</span>
                            <span className={cn("font-black text-xs", isLocked ? "text-slate-400" : "text-primary")}>{course.progreso?.porcentaje || 0}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${course.progreso?.porcentaje || 0}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn("h-full", isLocked ? "bg-slate-400" : "bg-primary")}
                            />
                        </div>

                        <div className="flex justify-between items-center gap-2 pt-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800">
                                <Calendar size={12} className="text-primary/70" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
                                    {isModule ? (course.fechaFin ? `Cierre: ${new Date(course.fechaFin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}` : 'Vigente') : (course.modulos?.length || 0) + ' Módulos'}
                                </span>
                            </div>
                            {isModule ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 max-w-[130px]">
                                    <UserIcon size={12} className="text-slate-400" />
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
                                        {course.facilitador || 'Facilitador'}
                                    </span>
                                </div>
                            ) : (
                                <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                    {course.progreso?.completadas || 0}/{course.progreso?.total || 0} Completado
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "mt-auto p-4 border-t transition-colors flex items-center justify-between",
                    theme === 'dark' ? "border-slate-800 bg-slate-800/20" : "border-slate-100 bg-slate-50/50"
                )}>
                    <div className="flex items-center gap-2">
                        <div className={cn("w-7 h-7 rounded-lg text-white flex items-center justify-center",
                            isLocked ? "bg-slate-400" : course.statusName === 'PREINSCRITO' ? "bg-amber-500" : "bg-primary")}>
                            {isLocked ? <Lock size={14} /> : course.statusName === 'PREINSCRITO' ? <AlertTriangle size={14} /> : <ArrowRight size={14} />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                            {isLocked ? 'Bloqueado' : course.statusName === 'PREINSCRITO' ? 'Pendiente' : 'Gestionar'}
                        </span>
                    </div>
                    {isClient && course.statusName === 'CONFIRMADO' && (
                        <PDFDownloadLink
                            document={<InscripcionPDF inscripcion={course} />}
                            fileName={`Comprobante_${course.id}.pdf`}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-primary transition-all"
                        >
                            {({ loading }: any) => loading ? <Clock size={14} className="animate-pulse" /> : <Download size={14} />}
                        </PDFDownloadLink>
                    )}
                    {isLocked && course.fechaInicio && new Date(course.fechaInicio) > now && (
                        <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-sm">
                            Disponible el {new Date(course.fechaInicio).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Visual Detail: Corner Triangle (Institutional Detail) */}
            <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                <div className="absolute top-0 right-0 w-full h-full bg-primary/5 [clip-path:polygon(100%_0,0_0,100%_100%)]" />
            </div>
        </motion.div>
    );
}
