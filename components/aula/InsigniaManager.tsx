'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    X, Award, Loader2, CheckCircle2, Plus, Trash2,
    Star, Zap, Shield, Target, Trophy, Sparkles, Search
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

import { useAula } from '@/contexts/AulaContext';

const iconMap: Record<string, any> = {
    Sparkles, Star, Shield, Zap, Trophy, Target, Award
};

const gradientMap: Record<string, string> = {
    ALUMNO_ESTRELLA: 'from-amber-400 to-orange-500',
    ASISTENCIA_PERFECTA: 'from-emerald-400 to-teal-500',
    PRIMER_FORO: 'from-sky-400 to-blue-600',
    TAREA_100: 'from-violet-400 to-purple-600',
    PRIMER_PUESTO: 'from-rose-400 to-pink-500',
};

interface InsigniaManagerProps {
    moduloId: string;
    turnoId?: string;
    onClose: () => void;
    theme: 'light' | 'dark';
}

export default function InsigniaManager({ moduloId, turnoId, onClose, theme }: InsigniaManagerProps) {
    const { secondaryColor } = useAula();
    const [participantes, setParticipantes] = useState<any[]>([]);
    const [insigniasDisp, setInsigniasDisp] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [awarding, setAwarding] = useState<string | null>(null); // insigniaId being processed

    const isDark = theme === 'dark';

    const loadData = async () => {
        setLoading(true);
        try {
            const [parts, insAll] = await Promise.all([
                aulaService.getInsigniasPorModulo(moduloId, turnoId),
                aulaService.getInsigniasTodas()
            ]);
            setParticipantes(parts || []);
            setInsigniasDisp(insAll || []);
        } catch (e) {
            console.error(e);
            toast.error('Error al cargar datos de insignias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [moduloId, turnoId]);

    const filtered = participantes.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOtorgar = async (insigniaId: string) => {
        if (!selectedUser) return;
        setAwarding(insigniaId);
        try {
            const res = await aulaService.otorgarInsignia(selectedUser.userId, insigniaId);
            if (res.already) {
                toast.info('El participante ya tiene esta insignia');
            } else {
                toast.success('🏅 Insignia otorgada correctamente');
                await loadData();
                // Refresh selectedUser
                const updated = participantes.find(p => p.userId === selectedUser.userId);
                if (updated) {
                    // Si el usuario seleccionado era este, actualizamos su lista de insignias localmente
                    setSelectedUser((prev: any) => ({ ...prev, insignias: updated.insignias }));
                }
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Error al otorgar insignia');
        } finally {
            setAwarding(null);
        }
    };

    const handleRevocar = async (insigniaId: string) => {
        if (!selectedUser) return;
        setAwarding(insigniaId);
        try {
            await aulaService.revocarInsignia(selectedUser.userId, insigniaId);
            toast.success('Insignia revocada');
            await loadData();
            // Refresh selectedUser local state
            const updated = participantes.find(p => p.userId === selectedUser.userId);
            if (updated) {
                const newInsignias = (selectedUser.insignias || []).filter((i: any) => i.insigniaId !== insigniaId);
                setSelectedUser((prev: any) => ({ ...prev, insignias: newInsignias }));
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Error al revocar insignia');
        } finally {
            setAwarding(null);
        }
    };

    const userHasInsignia = (insigniaId: string) =>
        selectedUser?.insignias?.some((i: any) => i.insigniaId === insigniaId);

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                className={cn(
                    "w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden rounded-[2.5rem]",
                    isDark ? "bg-slate-900 border border-slate-800" : "bg-white shadow-2xl"
                )}
            >
                {/* Header */}
                <div className={cn("px-8 py-5 flex items-center justify-between border-b flex-shrink-0", isDark ? "border-slate-800" : "border-slate-100")}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: secondaryColor, boxShadow: `0 10px 20px ${secondaryColor}33` }}>
                            <Award size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-900")}>
                                Gestionar Insignias
                            </h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                                Selecciona un participante y asígnale insignias
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900")}
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center flex-col gap-4">
                        <Loader2 className="animate-spin" size={32} style={{ color: secondaryColor }} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando datos...</p>
                    </div>
                ) : (
                    <div className="flex-1 flex overflow-hidden">
                        {/* LEFT: Participant list */}
                        <div className={cn("w-80 flex-shrink-0 flex flex-col border-r", isDark ? "border-slate-800 bg-slate-950/30" : "border-slate-100 bg-slate-50/50")}>
                            {/* Search */}
                            <div className={cn("px-4 py-3 border-b", isDark ? "border-slate-800" : "border-slate-100")}>
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar participante..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className={cn(
                                            "w-full h-9 pl-9 pr-3 rounded-xl border text-xs font-bold focus:outline-none transition-all",
                                            isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                                        )}
                                        style={searchTerm ? { borderColor: secondaryColor } : {}}
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                {filtered.map(p => (
                                    <button
                                        key={p.userId}
                                        onClick={() => setSelectedUser(p)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                            selectedUser?.userId === p.userId
                                                ? "shadow-sm border-transparent"
                                                : isDark
                                                    ? "border-transparent hover:border-slate-700 hover:bg-slate-800/50"
                                                    : "border-transparent hover:border-slate-200 hover:bg-white"
                                        )}
                                        style={selectedUser?.userId === p.userId ? {
                                            backgroundColor: isDark ? `${secondaryColor}15` : `${secondaryColor}08`,
                                            borderColor: secondaryColor
                                        } : {}}
                                    >
                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs flex-shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-800"
                                        )}>
                                            {p.imagen
                                                ? <img src={getImageUrl(p.imagen)} className="w-full h-full object-cover" alt="" />
                                                : p.nombre.charAt(0).toUpperCase()
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("font-bold text-xs truncate", isDark ? "text-slate-200" : "text-slate-800")}>
                                                {p.nombre}
                                            </p>
                                            {p.insignias?.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {p.insignias.slice(0, 4).map((ins: any, i: number) => (
                                                        <div
                                                            key={i}
                                                            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] font-black text-white"
                                                            style={{ background: ins.color || '#6366f1' }}
                                                            title={ins.nombre}
                                                        >
                                                            {ins.nombre?.charAt(0) || '★'}
                                                        </div>
                                                    ))}
                                                    {p.insignias.length > 4 && (
                                                        <span className="text-[8px] text-slate-400 font-bold">+{p.insignias.length - 4}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {selectedUser?.userId === p.userId && (
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: secondaryColor }} />
                                        )}
                                    </button>
                                ))}
                                {filtered.length === 0 && (
                                    <div className="py-10 text-center">
                                        <p className="text-slate-400 text-xs font-bold">Sin resultados</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Badge assignment */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {!selectedUser ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                    <div className="w-20 h-20 rounded-[2rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Award size={36} className="text-slate-300" />
                                    </div>
                                    <div className="text-center">
                                        <p className={cn("font-black text-lg", isDark ? "text-slate-400" : "text-slate-500")}>
                                            Selecciona un participante
                                        </p>
                                        <p className="text-slate-400 text-sm mt-1">de la lista de la izquierda</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* User header */}
                                    <div className={cn("px-6 py-4 border-b flex items-center gap-4 flex-shrink-0", isDark ? "border-slate-800" : "border-slate-100")}>
                                        <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-lg overflow-hidden flex-shrink-0 shadow-inner">
                                            {selectedUser.imagen
                                                ? <img src={getImageUrl(selectedUser.imagen)} className="w-full h-full object-cover" alt="" />
                                                : selectedUser.nombre.charAt(0).toUpperCase()
                                            }
                                        </div>
                                        <div className="flex-1">
                                            <p className={cn("font-black text-lg leading-tight", isDark ? "text-white" : "text-slate-900")}>{selectedUser.nombre}</p>
                                            <p className="text-slate-400 text-xs">{selectedUser.correo}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border", isDark ? "border-slate-800 bg-slate-800/50" : "border-slate-100 bg-slate-50")}>
                                                <span style={{ color: secondaryColor }}>🏅 {selectedUser.insignias?.length || 0}</span> insignias
                                            </div>
                                        </div>
                                    </div>

                                    {/* Badge grid */}
                                    <div className="flex-1 overflow-y-auto p-8">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="h-4 w-1 rounded-full" style={{ backgroundColor: secondaryColor }} />
                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDark ? "text-slate-500" : "text-slate-400")}>
                                                Logros Disponibles
                                            </p>
                                        </div>

                                        {insigniasDisp.length === 0 ? (
                                            <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-950/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                                                <Award size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Sin insignias</p>
                                                <p className="text-slate-400 text-[10px] mt-2 font-medium px-10">Crea insignias desde el panel de administración para poder otorgarlas aquí.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                                {insigniasDisp.map(ins => {
                                                    const hasIt = userHasInsignia(ins.id);
                                                    const isLoading = awarding === ins.id;
                                                    const gradient = gradientMap[ins.tipo] || (ins.color?.startsWith('from-') ? ins.color : `from-[${ins.color || secondaryColor}] to-[${ins.color || secondaryColor}]`);
                                                    const Icon = iconMap[ins.icono] || Award;
                                                    const badgeColor = ins.color || secondaryColor;

                                                    return (
                                                        <motion.div
                                                            key={ins.id}
                                                            whileHover={{ y: -4 }}
                                                            className={cn(
                                                                "relative rounded-[2.5rem] border p-6 flex flex-col items-center text-center gap-4 transition-all duration-300",
                                                                hasIt
                                                                    ? isDark ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-100 bg-emerald-50/30 shadow-sm"
                                                                    : isDark ? "border-slate-800 bg-slate-800/30 hover:border-slate-700" : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-xl"
                                                            )}
                                                            style={hasIt ? { borderColor: `${secondaryColor}33` } : {}}
                                                        >
                                                            {/* Has it badge */}
                                                            {hasIt && (
                                                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                                    <CheckCircle2 size={12} className="text-white" />
                                                                </div>
                                                            )}

                                                            {/* Icon Container */}
                                                            <div className={cn(
                                                                "w-20 h-20 rounded-[2rem] flex items-center justify-center relative transition-all duration-500",
                                                                hasIt ? "shadow-xl" : "bg-slate-100 dark:bg-slate-800"
                                                            )} style={hasIt ? {
                                                                backgroundColor: badgeColor,
                                                                boxShadow: `0 10px 25px ${badgeColor}44`
                                                            } : {}}>
                                                                <Icon size={38} className={hasIt ? "text-white" : "text-slate-400"} />
                                                                {hasIt && (
                                                                    <div className="absolute inset-1.5 border border-white/20 rounded-[1.7rem] pointer-events-none" />
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="space-y-1">
                                                                <p className={cn("font-black text-sm uppercase tracking-tight leading-tight", isDark ? "text-white" : "text-slate-800")}>
                                                                    {ins.nombre}
                                                                </p>
                                                                <p className="text-slate-400 text-[9px] font-medium leading-relaxed line-clamp-2 h-7">
                                                                    {ins.descripcion}
                                                                </p>
                                                            </div>

                                                            {/* Action button */}
                                                            <button
                                                                onClick={() => hasIt ? handleRevocar(ins.id) : handleOtorgar(ins.id)}
                                                                disabled={!!awarding}
                                                                className={cn(
                                                                    "w-full h-10 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.1em] transition-all active:scale-95",
                                                                    hasIt
                                                                        ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/10"
                                                                        : "text-white hover:opacity-90 shadow-lg",
                                                                    !!awarding && "opacity-50 cursor-not-allowed"
                                                                )}
                                                                style={!hasIt ? {
                                                                    backgroundColor: secondaryColor,
                                                                    boxShadow: `0 8px 16px ${secondaryColor}33`
                                                                } : {}}
                                                            >
                                                                {isLoading ? (
                                                                    <Loader2 size={14} className="animate-spin" />
                                                                ) : hasIt ? (
                                                                    <><Trash2 size={14} /> Revocar</>
                                                                ) : (
                                                                    <><Plus size={14} /> Otorgar</>
                                                                )}
                                                            </button>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
