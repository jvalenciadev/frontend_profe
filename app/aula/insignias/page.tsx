'use client';

import { useAula } from '@/contexts/AulaContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, Zap, Star, Shield, Target, Trophy,
    Lock, Sparkles, CheckCircle2, Clock, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { aulaService } from '@/services/aulaService';

const iconMap: Record<string, any> = {
    Sparkles, Star, Shield, Zap, Trophy, Target, Award,
    Lock, CheckCircle2, Clock
};

// TIPO → visual config mapping
const tipoConfig: Record<string, { gradient: string; icon: any; labelColor: string }> = {
    ALUMNO_ESTRELLA:      { gradient: 'from-amber-400 to-orange-500',   icon: Star,    labelColor: 'text-amber-600' },
    ASISTENCIA_PERFECTA:  { gradient: 'from-emerald-400 to-teal-500',   icon: CheckCircle2, labelColor: 'text-emerald-600' },
    PRIMER_FORO:          { gradient: 'from-sky-400 to-blue-600',       icon: Sparkles, labelColor: 'text-sky-600' },
    TAREA_100:            { gradient: 'from-violet-400 to-purple-600',  icon: Trophy,  labelColor: 'text-violet-600' },
    PRIMER_PUESTO:        { gradient: 'from-rose-400 to-pink-500',      icon: Award,   labelColor: 'text-rose-600' },
    DEFAULT:              { gradient: 'from-slate-400 to-slate-600',    icon: Shield,  labelColor: 'text-slate-500' },
};

function getConfig(tipo: string) {
    return tipoConfig[tipo] || tipoConfig['DEFAULT'];
}

export default function InsigniasPage() {
    const { theme, secondaryColor } = useAula();
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any | null>(null);
    const isDark = theme === 'dark';

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const [all, mine] = await Promise.all([
                    aulaService.getInsigniasTodas(),
                    aulaService.getMisInsignias()
                ]);

                const mapped = (all || []).map((b: any) => {
                    const earned = (mine || []).find((m: any) => m.insigniaId === b.id);
                    const cfg = getConfig(b.tipo);
                    return {
                        id: b.id,
                        tipo: b.tipo,
                        title: b.nombre,
                        description: b.descripcion,
                        unlocked: !!earned,
                        color: b.color || '#6366f1',
                        gradient: b.color?.startsWith('from-') ? b.color : cfg.gradient,
                        Icon: iconMap[b.icono] || cfg.icon,
                        labelColor: cfg.labelColor,
                        date: earned?.otorgadoEn ? new Date(earned.otorgadoEn).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : null,
                        requirement: getRequirement(b.tipo),
                    };
                });
                setBadges(mapped);
            } catch (error) {
                console.error('Error fetching badges:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBadges();
    }, []);

    function getRequirement(tipo: string): string {
        const map: Record<string, string> = {
            ALUMNO_ESTRELLA: 'Obtener nota final ≥ 90 pts',
            ASISTENCIA_PERFECTA: 'Asistir al 100% de las clases (mín. 6 sesiones)',
            PRIMER_FORO: 'Participar en tu primer foro del módulo',
            TAREA_100: 'Lograr 100/100 en una tarea',
            PRIMER_PUESTO: 'Ser el estudiante con mayor puntaje del módulo',
        };
        return map[tipo] || 'Requisito especial — otorgado por el facilitador';
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${secondaryColor}33`, borderTopColor: secondaryColor }} />
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>Cargando logros...</p>
                </div>
            </div>
        );
    }

    const unlocked = badges.filter(b => b.unlocked);
    const locked = badges.filter(b => !b.unlocked);
    const progress = badges.length > 0 ? Math.round((unlocked.length / badges.length) * 100) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* ── HERO ─────────────────────────────── */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden"
            >
                <div className={cn(
                    "relative rounded-[3rem] p-10 overflow-hidden border",
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl"
                )}>
                    {/* Background decoration */}
                    <div className="absolute -top-16 -right-16 w-64 h-64 blur-3xl rounded-full pointer-events-none" style={{ backgroundColor: `${secondaryColor}10` }} />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-500/5 blur-3xl rounded-full pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl flex-shrink-0" style={{ backgroundColor: secondaryColor, boxShadow: `0 20px 40px ${secondaryColor}33` }}>
                            <Trophy size={42} className="text-white" />
                        </div>

                        <div className="flex-1 space-y-3">
                            <h1 className={cn("text-4xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                Mis <span style={{ color: secondaryColor }}>Logros</span>
                            </h1>
                            <p className={cn("font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                                Insignias y reconocimientos otorgados por tu desempeño académico.
                            </p>

                            {/* Progress bar */}
                            <div className="space-y-2 max-w-sm">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className={isDark ? "text-slate-400" : "text-slate-500"}>{unlocked.length} de {badges.length} desbloqueados</span>
                                    <span style={{ color: secondaryColor }}>{progress}%</span>
                                </div>
                                <div className="h-3 rounded-full overflow-hidden" style={{ background: isDark ? '#1e293b' : '#f1f5f9' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: secondaryColor }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="flex gap-4 flex-shrink-0">
                            {[
                                { label: 'Desbloqueadas', value: unlocked.length, color: secondaryColor },
                                { label: 'Por ganar', value: locked.length, color: isDark ? '#475569' : '#94a3b8' },
                            ].map((stat, i) => (
                                <div key={i} className={cn(
                                    "flex flex-col items-center justify-center w-28 h-28 rounded-[2rem] border transition-all",
                                    isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50 shadow-sm"
                                )}>
                                    <span className="text-4xl font-black leading-none" style={{ color: stat.color }}>
                                        {stat.value}
                                    </span>
                                    <span className={cn("text-[9px] font-black uppercase tracking-widest mt-2 text-center leading-tight", isDark ? "text-slate-500" : "text-slate-400")}>
                                        {stat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* ── UNLOCKED BADGES ───────────────────── */}
            {unlocked.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="h-4 w-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
                        <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", isDark ? "text-slate-200" : "text-slate-700")}>
                            Insignias Obtenidas
                        </h2>
                        <div className="flex-1 h-[1px]" style={{ backgroundColor: isDark ? '#ffffff10' : '#00000005' }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {unlocked.map((badge, i) => (
                            <BadgeCard key={badge.id} badge={badge} i={i} isDark={isDark} secondaryColor={secondaryColor} onClick={() => setSelected(badge)} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── LOCKED BADGES ─────────────────────── */}
            {locked.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="h-4 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", isDark ? "text-slate-500" : "text-slate-400")}>
                            Por Desbloquear
                        </h2>
                        <div className="flex-1 h-[1px]" style={{ backgroundColor: isDark ? '#ffffff10' : '#00000005' }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {locked.map((badge, i) => (
                            <BadgeCard key={badge.id} badge={badge} i={i} isDark={isDark} secondaryColor={secondaryColor} onClick={() => setSelected(badge)} />
                        ))}
                    </div>
                </section>
            )}

            {badges.length === 0 && (
                <div className={cn("text-center py-32 rounded-[3.5rem] border", isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100")}>
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                        <Award size={48} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className={cn("text-2xl font-black uppercase tracking-tight", isDark ? "text-slate-400" : "text-slate-500")}>No hay insignias configuradas aún</p>
                    <p className="text-slate-400 font-medium text-sm mt-3 max-w-sm mx-auto leading-relaxed">El administrador o facilitador puede crear insignias en la sección de configuración académica.</p>
                </div>
            )}

            {/* ── DETAIL MODAL ─────────────────────── */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
                        onClick={() => setSelected(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className={cn(
                                "w-full max-w-md rounded-[3.5rem] p-12 text-center space-y-8 border shadow-2xl relative overflow-hidden",
                                isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"
                            )}
                        >
                            <div className="absolute top-0 inset-x-0 h-2" style={{ backgroundColor: selected.unlocked ? (selected.color || secondaryColor) : '#cbd5e1' }} />

                            <div className={cn(
                                "w-40 h-40 rounded-[3rem] mx-auto flex items-center justify-center shadow-2xl relative transition-transform duration-700 hover:rotate-[10deg]",
                                selected.unlocked ? "" : "bg-slate-100 dark:bg-slate-800"
                            )} style={selected.unlocked ? { backgroundColor: selected.color || secondaryColor, boxShadow: `0 20px 50px ${(selected.color || secondaryColor)}33` } : {}}>
                                <selected.Icon size={80} className={selected.unlocked ? "text-white" : "text-slate-400"} />
                                
                                {selected.unlocked && (
                                    <motion.div 
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="absolute -inset-10 blur-3xl rounded-full -z-10" 
                                        style={{ backgroundColor: selected.color || secondaryColor }}
                                    />
                                )}
                            </div>

                            <div className="space-y-3">
                                <h3 className={cn("text-3xl font-black tracking-tight uppercase", isDark ? "text-white" : "text-slate-900")}>{selected.title}</h3>
                                <p className={cn("text-base font-medium leading-relaxed px-4", isDark ? "text-slate-400" : "text-slate-500")}>{selected.description}</p>
                            </div>

                            <div className={cn("p-6 rounded-3xl text-left space-y-4 border", isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100")}>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                        <Target size={18} className="text-slate-500 dark:text-slate-400" />
                                    </div>
                                    <div>
                                        <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", isDark ? "text-slate-500" : "text-slate-400")}>Requisito</p>
                                        <p className={cn("text-sm font-bold leading-tight", isDark ? "text-slate-300" : "text-slate-700")}>{selected.requirement}</p>
                                    </div>
                                </div>
                                {selected.unlocked && selected.date && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 size={18} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", isDark ? "text-slate-500" : "text-slate-400")}>Fecha de Logro</p>
                                            <p className={cn("text-sm font-bold text-emerald-500 leading-tight")}>{selected.date}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setSelected(null)}
                                className={cn(
                                    "w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95",
                                    isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-750" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                            >
                                Entendido
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function BadgeCard({ badge, i, isDark, secondaryColor, onClick }: { badge: any; i: number; isDark: boolean; secondaryColor: string; onClick: () => void }) {
    const cardColor = badge.unlocked ? (badge.color || secondaryColor) : '#94a3b8';
    
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 100 }}
            onClick={onClick}
            className={cn(
                "relative rounded-[3rem] border overflow-hidden cursor-pointer transition-all duration-500 group",
                badge.unlocked
                    ? isDark ? "bg-slate-900 border-slate-800 hover:border-slate-600" : "bg-white border-slate-100 shadow-lg hover:shadow-2xl"
                    : isDark ? "bg-slate-950 border-slate-900 opacity-60 grayscale" : "bg-slate-50 border-slate-200/50 opacity-60 grayscale"
            )}
        >
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="p-8 flex flex-col items-center text-center gap-6">
                {/* Icon Container */}
                <div 
                    className={cn(
                        "w-24 h-24 rounded-[2.5rem] flex items-center justify-center relative transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-xl",
                        badge.unlocked ? "" : "bg-slate-200 dark:bg-slate-800"
                    )}
                    style={badge.unlocked ? { 
                        backgroundColor: cardColor,
                        boxShadow: `0 15px 35px ${cardColor}44`
                    } : {}}
                >
                    <badge.Icon size={48} className={badge.unlocked ? "text-white" : "text-slate-500"} />
                    
                    {/* Ring decoration */}
                    {badge.unlocked && (
                        <div className="absolute inset-2 border-2 border-white/20 rounded-[2rem] pointer-events-none" />
                    )}
                    
                    {/* Glow effect */}
                    {badge.unlocked && (
                        <div className="absolute -inset-4 blur-2xl opacity-0 group-hover:opacity-30 rounded-full transition-opacity -z-10" style={{ backgroundColor: cardColor }} />
                    )}
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                    <h3 className={cn("text-xl font-black tracking-tight uppercase leading-tight", isDark ? "text-white" : "text-slate-800")}>
                        {badge.title}
                    </h3>
                    <p className={cn("text-xs font-medium line-clamp-2 leading-relaxed h-8 px-2", isDark ? "text-slate-500" : "text-slate-400")}>
                        {badge.description}
                    </p>
                </div>

                {/* Footer Status */}
                <div className={cn("w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 transition-colors", 
                    badge.unlocked 
                        ? (isDark ? "bg-slate-800 group-hover:bg-slate-750" : "bg-slate-50 group-hover:bg-slate-100")
                        : "bg-transparent border border-dashed border-slate-200 dark:border-slate-800"
                )}>
                    {badge.unlocked ? (
                        <>
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <CheckCircle2 size={12} className="text-white" />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.15em]", isDark ? "text-slate-300" : "text-slate-600")}>
                                {badge.date ? `Obtenida el ${badge.date}` : 'Desbloqueada'}
                            </span>
                        </>
                    ) : (
                        <>
                            <Lock size={12} className="text-slate-400" />
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                                Por desbloquear
                            </span>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
