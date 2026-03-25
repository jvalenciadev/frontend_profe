'use client';

import { useEffect, useState } from 'react';
import { aulaService } from '@/services/aulaService';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, ArrowRight, User, CheckCircle2, AlertCircle, Calendar, MapPin, Clock, GraduationCap, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn, getImageUrl } from '@/lib/utils';
import { useAula } from '@/contexts/AulaContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

function PaymentBadge({ inscripcionId, theme }: { inscripcionId: string, theme: string }) {
    const [status, setStatus] = useState<'loading' | 'paid' | 'unpaid' | 'error'>('loading');

    useEffect(() => {
        if (!inscripcionId || inscripcionId === 'undefined' || inscripcionId === 'null') {
            setStatus('error');
            return;
        }
        aulaService.verificarPago(inscripcionId)
            .then(res => setStatus(res.pagoCompleto ? 'paid' : 'unpaid'))
            .catch(() => setStatus('error'));
    }, [inscripcionId]);

    if (status === 'loading') return (
        <div className="flex items-center gap-2 animate-pulse">
            <div className="w-12 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
    );

    return (
        <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-black text-[8px] uppercase tracking-widest transition-all",
            status === 'paid'
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                : "bg-rose-500/10 border-rose-500/20 text-rose-500"
        )}>
            {status === 'paid' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
            {status === 'paid' ? 'Inscrito' : 'Pendiente'}
        </div>
    );
}

export default function MisCursosPage() {
    const { user, isAuthenticated } = useAuth();
    const { theme } = useAula();
    const [programs, setPrograms] = useState<any[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            if (!isAuthenticated && !user) return;
            try {
                const data = await aulaService.getMisCursos();
                setPrograms(data.estudiante || []);
            } catch (err) {
                console.error('Error loading courses', err);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [isAuthenticated, user]);

    const filteredItems = (selectedProgram ? selectedProgram.modulos : programs).filter((item: any) =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 rounded-full" />
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[var(--aula-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[9px] animate-pulse">Consultando Matrícula Digital...</p>
        </div>
    );

    return (
        <div className="space-y-12 max-w-7xl mx-auto pb-24 px-4 pt-10">
            {/* ── CINEMATIC HEADER SYSTEM ── */}
            <AnimatePresence mode="wait">
                {selectedProgram ? (
                    <motion.header
                        key="program-header"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="relative w-full min-h-[220px] rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
                    >
                        {/* ── AMBIENT GLASS BACKGROUND ── */}
                        <div className="absolute inset-0 z-0">
                            {(selectedProgram.pro_banner || selectedProgram.banner) ? (
                                <>
                                    <img
                                        src={getImageUrl(selectedProgram.pro_banner || selectedProgram.banner)}
                                        alt={selectedProgram.nombre}
                                        className="w-full h-full object-cover transition-transform duration-700 opacity-60 dark:opacity-40 blur-[2px]"
                                    />
                                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/70 backdrop-blur-md" />
                                </>
                            ) : (
                                <div className="w-full h-full bg-slate-50 dark:bg-slate-900" />
                            )}
                            <div className="absolute left-0 top-0 w-2 h-full bg-[var(--aula-primary)]" />
                        </div>

                        {/* ── REFINED COMPACT CONTENT ── */}
                        <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center min-h-[220px]">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                <div className="space-y-4 flex-1">
                                    <button
                                        onClick={() => { setSelectedProgram(null); setSearchTerm(''); }}
                                        className="inline-flex items-center gap-2 text-slate-400 hover:text-[var(--aula-primary)] transition-all text-[10px] font-black uppercase tracking-[0.2em] group/back"
                                    >
                                        <ChevronLeft size={16} strokeWidth={3} className="group-hover/back:-translate-x-1 transition-transform" />
                                        Vover a mis programas
                                    </button>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-[var(--aula-primary)] uppercase tracking-widest bg-[var(--aula-primary)]/10 px-2.5 py-1 rounded-lg">
                                                {selectedProgram.tipo}
                                            </span>
                                            <span className="text-slate-300 dark:text-slate-700">/</span>
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                Versión {selectedProgram.version}
                                            </span>
                                        </div>
                                        <h1 className={cn(
                                            "text-3xl md:text-5xl font-black tracking-tighter leading-none",
                                            theme === 'dark' ? "text-white" : "text-slate-900"
                                        )}>
                                            {selectedProgram.nombre}
                                        </h1>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 pt-4 border-t border-slate-200/50 dark:border-slate-800/20 mt-4">
                                        <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                            <MapPin size={16} className="text-[var(--aula-primary)]/50" />
                                            {selectedProgram.sede}
                                        </div>
                                        <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                            <BookOpen size={16} className="text-[var(--aula-primary)]/50" />
                                            {selectedProgram.modulos?.length} Módulos
                                        </div>
                                        
                                        <div className="flex items-center gap-4 ml-auto">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 h-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${selectedProgram.progreso?.porcentaje || 0}%` }}
                                                        className="h-full bg-[var(--aula-primary)] shadow-[0_0_8px_var(--aula-primary)]"
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-[var(--aula-primary)] leading-none">{selectedProgram.progreso?.porcentaje || 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Compact Search Area */}
                                <div className="lg:w-72">
                                    <div className="relative group/search">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/search:text-[var(--aula-primary)] transition-colors" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar módulo..."
                                            className={cn(
                                                "w-full h-12 pl-12 pr-4 border shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-[var(--aula-primary)]/5 font-bold text-sm rounded-2xl",
                                                theme === 'dark' 
                                                    ? "bg-slate-900/40 border-slate-800 text-white focus:border-[var(--aula-primary)]/30" 
                                                    : "bg-white border-slate-200 text-slate-900 focus:border-[var(--aula-primary)]/20"
                                            )}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.header>
                ) : (
                    <motion.header
                        key="default-header"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                    >
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-[var(--aula-primary)]/5 border border-[var(--aula-primary)]/10 rounded-xl text-[var(--aula-primary)] font-black text-[9px] uppercase tracking-widest">
                                <GraduationCap size={12} />
                                Portal Estudiantil
                            </div>
                            <h1 className={cn("text-5xl md:text-7xl font-black tracking-tighter leading-none", theme === 'dark' ? "text-white" : "text-slate-950")}>
                                Mis <span className="text-[var(--aula-primary)]">Programas</span>
                            </h1>
                            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
                                Bienvenido a tu ecosistema de aprendizaje. Gestiona tus programas activos, consulta tu avance y accede a tus entornos virtuales.
                            </p>
                        </div>

                        {/* Search Bar for Programs List */}
                        <div className="relative max-w-2xl group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[var(--aula-primary)] transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Escribe el nombre del programa..."
                                className={cn(
                                    "w-full h-16 pl-16 pr-8 border-2 shadow-sm group-hover:shadow-md transition-all font-bold text-lg rounded-[2.5rem] focus:outline-none focus:ring-8 focus:ring-[var(--aula-primary)]/5",
                                    theme === 'dark' ? "bg-slate-900 border-slate-800 text-white focus:border-[var(--aula-primary)]/40" : "bg-white border-slate-100 focus:border-[var(--aula-primary)]/20 shadow-slate-200/50"
                                )}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </motion.header>
                )}
            </AnimatePresence>

            {filteredItems.length === 0 ? (
                <div className={cn(
                    "rounded-[2.5rem] p-20 text-center space-y-6 border-2 border-dashed transition-all",
                    theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100"
                )}>
                    <BookOpen size={48} className="mx-auto text-slate-200 dark:text-slate-700" />
                    <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No se encontraron {selectedProgram ? 'módulos' : 'programas'} activos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item: any, i: any) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -5 }}
                                className={cn(
                                    "group border rounded-[2.5rem] p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[320px]",
                                    theme === 'dark'
                                        ? "bg-slate-900 border-slate-800 hover:border-[var(--aula-primary)]/30"
                                        : "bg-white border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-300/50"
                                )}
                            >
                                {(() => {
                                    const now = new Date();
                                    const start = item.fechaInicio ? new Date(item.fechaInicio) : null;
                                    const end = item.fechaFin ? new Date(item.fechaFin) : null;

                                    let status = 'active';
                                    if (start && now < start) status = 'locked';
                                    else if (end && now > end) status = 'finished';

                                    const isLocked = status === 'locked';
                                    const isFinished = status === 'finished';

                                    return (
                                        <>
                                            {/* Status Badge Overlays */}
                                            {isLocked && (
                                                <div className="absolute inset-0 z-20 bg-slate-100/40 dark:bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl space-y-3 border border-slate-100 dark:border-slate-800">
                                                        <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                                                            <Calendar size={24} />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Próximamente</p>
                                                        <p className="text-xs font-bold text-slate-800 dark:text-white">Este módulo se habilita el <br /> <span className="text-primary">{start?.toLocaleDateString()}</span></p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className={cn("relative z-10 space-y-6 flex-1", isLocked && "opacity-40 grayscale")}>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                                            isFinished ? "bg-emerald-500/10 text-emerald-500" : "bg-[var(--aula-primary)]/10 text-[var(--aula-primary)]"
                                                        )}>
                                                            {selectedProgram ? <GraduationCap size={20} /> : <BookOpen size={20} />}
                                                        </div>
                                                        <div className="space-y-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "font-black uppercase tracking-[0.2em] block text-[9px] leading-none",
                                                                    isFinished ? "text-emerald-500" : "text-[var(--aula-primary)]"
                                                                )}>
                                                                    {selectedProgram ? 'Módulo' : item.tipo}
                                                                </span>
                                                                {isFinished && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase tracking-widest border border-emerald-500/10">Dictado</span>
                                                                )}
                                                            </div>
                                                            <span className="font-bold text-slate-400 uppercase tracking-widest text-[8px]">{item.codigo}</span>
                                                        </div>
                                                    </div>
                                                    {!selectedProgram && <PaymentBadge inscripcionId={item.programaInscripcionId} theme={theme} />}
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className={cn("text-xl font-black leading-tight tracking-tight group-hover:text-[var(--aula-primary)] transition-colors line-clamp-2", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                                        {item.nombre}
                                                    </h3>

                                                    <div className="grid grid-cols-1 gap-2.5">
                                                        {selectedProgram ? (
                                                            <>
                                                                <CompactInfo icon={Calendar} label="Cronograma" value={item.fechaInicio ? `${new Date(item.fechaInicio).toLocaleDateString()} - ${new Date(item.fechaFin).toLocaleDateString()}` : 'Fechas por definir'} theme={theme} />
                                                                <CompactInfo icon={User} label="Facilitador" value={item.facilitador || 'Asignación pendiente'} theme={theme} accent />

                                                                {/* Visual Progress Section */}
                                                                <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-50 dark:border-white/5">
                                                                    <div className="flex justify-between items-center px-0.5">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progreso Académico</span>
                                                                        <span className="text-[9px] font-black text-[var(--aula-primary)]">{item.progreso?.porcentaje || 0}%</span>
                                                                    </div>
                                                                    <div className={cn("h-1.5 w-full rounded-full overflow-hidden p-[1px]", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")}>
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${item.progreso?.porcentaje || 0}%` }}
                                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                                            className="h-full bg-[var(--aula-primary)] rounded-full"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CompactInfo icon={MapPin} label="Sede" value={item.sede || 'Sede Central'} theme={theme} />
                                                                <CompactInfo icon={Clock} label="Horario" value={item.turno} theme={theme} accent />

                                                                {/* Program Progress Section */}
                                                                <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-50 dark:border-white/5">
                                                                    <div className="flex justify-between items-center px-0.5">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Avance Curricular</span>
                                                                        <span className="text-[9px] font-black text-primary">{item.progreso?.porcentaje || 0}%</span>
                                                                    </div>
                                                                    <div className={cn("h-1.5 w-full rounded-full p-[1px]", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")}>
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${item.progreso?.porcentaje || 0}%` }}
                                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                                            className="h-full bg-[var(--aula-primary)] rounded-full"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between relative z-10">
                                                {selectedProgram ? (
                                                    <button
                                                        onClick={() => !isLocked && router.push(`/aula/curso/${item.id}`)}
                                                        disabled={isLocked}
                                                        className={cn(
                                                            "w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all group/btn shadow-xl shadow-primary/20 dark:shadow-none",
                                                            isLocked
                                                                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                                                                : isFinished
                                                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-95"
                                                                    : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
                                                        )}
                                                    >
                                                        {isLocked ? (
                                                            'Próximamente'
                                                        ) : (
                                                            <>
                                                                {isFinished ? 'Ver Archivo del Curso' : 'Acceder al Aula'}
                                                                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <>
                                                        <div className="space-y-1">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Módulos</span>
                                                            <div className="flex -space-x-2">
                                                                {[1, 2, 3].slice(0, Math.min(item.modulos?.length || 0, 3)).map((_, i) => (
                                                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                                                        <div className="w-full h-full bg-primary/20" />
                                                                    </div>
                                                                ))}
                                                                {(item.modulos?.length || 0) > 3 && (
                                                                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-500">
                                                                        +{(item.modulos?.length || 0) - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedProgram(item)}
                                                            className="h-12 px-7 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all hover:bg-primary/90 group/btn shadow-lg shadow-primary/20"
                                                        >
                                                            Explorar <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

function CompactInfo({ icon: Icon, label, value, theme, accent }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                accent ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
            )}>
                <Icon size={14} />
            </div>
            <div className="min-w-0">
                {label && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-0.5">{label}</span>}
                <span className={cn("text-[10px] font-black truncate block", theme === 'dark' ? "text-slate-200" : "text-slate-700")}>{value}</span>
            </div>
        </div>
    );
}
