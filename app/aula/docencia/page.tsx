'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import { useAula } from '@/contexts/AulaContext';
import {
    Users,
    BookOpen,
    Search,
    Loader2,
    ExternalLink,
    GraduationCap,
    Clock,
    Inbox,
    Hash,
    BarChart3,
    MapPin,
    CheckCircle,
    ChevronLeft,
    Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import StudentList from '@/components/aula/StudentList';
import GradeReport from '@/components/aula/GradeReport';
import InsigniaManager from '@/components/aula/InsigniaManager';
import { QrCode, ClipboardList, Award } from 'lucide-react';

export default function DocenciaPage() {
    const { theme, secondaryColor } = useAula();
    const { user, isAuthenticated } = useAuth();
    const [programs, setPrograms] = useState<any[]>([]);
    const [selectedProg, setSelectedProg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMod, setSelectedMod] = useState<any>(null);
    const [showStudents, setShowStudents] = useState(false);
    const [showGrades, setShowGrades] = useState(false);
    const [showInsignias, setShowInsignias] = useState(false);

    useEffect(() => {
        if (isAuthenticated || user) {
            loadDocencia();
        }
    }, [isAuthenticated, user]);

    const loadDocencia = async () => {
        if (!isAuthenticated && !user) return;
        setLoading(true);
        try {
            const data = await aulaService.getDocencia();
            setPrograms(data);
        } catch (error) {
            toast.error('Error al cargar carga académica');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = (selectedProg ? selectedProg.modulos : programs).filter((item: any) =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalStudents = programs.reduce((acc, p) => acc + (p.modulos?.reduce((a: any, m: any) => a + (m.studentCount || 0), 0) || 0), 0);
    const isDark = theme === 'dark';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin" size={48} style={{ color: secondaryColor }} />
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Cargando Panel de Docencia...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">

            {/* ── Hero Header — color institucional sólido, sin degradados ── */}
            <header
                className="relative overflow-hidden rounded-[3rem] p-10 md:p-14"
                style={{ backgroundColor: secondaryColor }}
            >
                {/* Patrón de puntos sutil */}
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }}
                />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            {selectedProg ? (
                                <button
                                    onClick={() => { setSelectedProg(null); setSearchTerm(''); }}
                                    className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all text-white"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <GraduationCap size={24} className="text-white" />
                                </div>
                            )}
                            <span className="text-white/60 font-black uppercase tracking-widest text-[10px]">
                                {selectedProg ? 'Volver a Programas' : 'Panel del Facilitador'}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                            {selectedProg ? (
                                <><span className="text-white/70">Módulos:</span> {selectedProg.nombre}</>
                            ) : (
                                <>Área de <span className="text-white/70">Docencia</span></>
                            )}
                        </h1>
                        <p className="text-white/60 font-medium text-base mt-3 max-w-xl">
                            {selectedProg
                                ? 'Administra el contenido y estudiantes de los módulos asignados en este programa.'
                                : 'Administración central de tus programas y carga académica asignada.'
                            }
                        </p>
                    </div>

                    {/* Stats pills */}
                    {!selectedProg && (
                        <div className="flex gap-4 flex-wrap">
                            <div className="text-center px-8 py-5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                                <p className="text-3xl font-black text-white">{programs.length}</p>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">Programas</p>
                            </div>
                            <div className="text-center px-8 py-5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                                <p className="text-3xl font-black text-white">{totalStudents}</p>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">Estudiantes</p>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* ── Search bar ── */}
            <div className="relative group">
                <Search
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors"
                    size={20}
                />
                <input
                    type="text"
                    placeholder={selectedProg ? "Buscar por módulo..." : "Buscar por programa..."}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={cn(
                        "w-full h-16 pl-16 pr-8 border-2 transition-all font-bold text-base rounded-[2rem] focus:outline-none",
                        isDark
                            ? "bg-slate-900 border-slate-800 text-white focus:border-slate-600"
                            : "bg-white border-slate-200 text-slate-800 focus:border-slate-300"
                    )}
                />
            </div>

            {/* ── Result count ── */}
            <p className={cn("text-[10px] font-black uppercase tracking-widest px-2", isDark ? "text-slate-500" : "text-slate-400")}>
                {filteredItems.length} {filteredItems.length === 1 ? (selectedProg ? 'módulo' : 'programa') : (selectedProg ? 'módulos' : 'programas')}
                {searchTerm && ' · filtrado'}
            </p>

            {/* ── Cards grid ── */}
            {selectedProg ? (
                <div className="space-y-16">
                    {(Object.entries(
                        filteredItems.reduce((acc: any, item: any) => {
                            const key = item.nombre;
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(item);
                            return acc;
                        }, {})
                    ) as [string, any][])
                    .sort(([a]: any, [b]: any) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
                    .map(([moduloNombre, instances]: [string, any[]], modIdx: number) => (
                        <motion.div 
                            key={moduloNombre} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: modIdx * 0.1 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-4 px-2">
                                <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
                                <h2 className={cn("text-2xl font-black uppercase tracking-tight", isDark ? "text-white" : "text-slate-800")}>
                                    {moduloNombre}
                                </h2>
                                <div className="flex-1 h-[1px] bg-slate-100 dark:bg-white/5" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-lg">
                                    {instances.length} {instances.length === 1 ? 'Turno' : 'Turnos'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {instances
                                    .sort((a: any, b: any) => (a.turno || '').localeCompare(b.turno || ''))
                                    .map((item: any, i: number) => (
                                        <ModuloCard
                                            key={item.id}
                                            item={item}
                                            progItem={selectedProg}
                                            index={i}
                                            theme={theme}
                                            secondaryColor={secondaryColor}
                                            onViewStudents={() => { setSelectedMod(item); setShowStudents(true); }}
                                            onViewGrades={() => { setSelectedMod(item); setShowGrades(true); }}
                                            onViewInsignias={() => { setSelectedMod(item); setShowInsignias(true); }}
                                        />
                                    ))
                                }
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredItems.map((item: any, i: number) => (
                        <ProgramaCard
                            key={item.id}
                            item={item}
                            index={i}
                            theme={theme}
                            secondaryColor={secondaryColor}
                            onSelect={() => { setSelectedProg(item); setSearchTerm(''); }}
                        />
                    ))}
                </div>
            )}

            {/* ── Empty state ── */}
            {filteredItems.length === 0 && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-40 text-center space-y-6"
                >
                    <div className={cn("w-28 h-28 rounded-full flex items-center justify-center mx-auto", isDark ? "bg-slate-900" : "bg-slate-100")}>
                        <Inbox size={52} className="text-slate-300" />
                    </div>
                    <div>
                        <p className={cn("text-2xl font-black uppercase tracking-widest", isDark ? "text-slate-600" : "text-slate-300")}>
                            {searchTerm ? 'Sin resultados' : 'Sin carga académica'}
                        </p>
                        <p className="text-slate-400 font-medium text-sm mt-3 max-w-sm mx-auto">
                            {searchTerm
                                ? 'Intenta con otro término de búsqueda.'
                                : 'No tienes módulos asignados. Contacta al administrador.'}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* ── Student List Modal ── */}
            <AnimatePresence>
                {showStudents && selectedMod && (
                    <StudentList
                        key="student-list-modal"
                        moduloId={selectedMod.moduloId || selectedMod.id}
                        turnoId={selectedMod.turnoId}
                        onClose={() => { setShowStudents(false); setSelectedMod(null); }}
                        theme={theme}
                        moduloNombre={selectedMod.moduloNombre || selectedMod.nombre}
                    />
                )}
                {showGrades && selectedMod && (
                    <GradeReport
                        key="grade-report-modal"
                        moduloId={selectedMod.moduloId || selectedMod.id}
                        turnoId={selectedMod.turnoId}
                        onClose={() => { setShowGrades(false); setSelectedMod(null); }}
                        theme={theme as any}
                        moduloNombre={selectedMod.moduloNombre || selectedMod.nombre}
                    />
                )}
                {showInsignias && selectedMod && (
                    <InsigniaManager
                        key="insignia-manager-modal"
                        moduloId={selectedMod.moduloId || selectedMod.id}
                        turnoId={selectedMod.turnoId}
                        onClose={() => { setShowInsignias(false); setSelectedMod(null); }}
                        theme={theme as any}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────────────────────────
// ProgramaCard
// ─────────────────────────────────────────────
function ProgramaCard({ item, index, theme, secondaryColor, onSelect }: any) {
    const isDark = theme === 'dark';
    const totalStudents = item.modulos?.reduce((a: any, m: any) => a + (m.studentCount || 0), 0) || 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={onSelect}
            className={cn(
                "group cursor-pointer rounded-[2.5rem] border p-1 transition-all duration-300",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 hover:shadow-2xl"
            )}
        >
            <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: secondaryColor }}>
                        <BookOpen size={24} />
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500")}>
                            {item.tipo}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1">{item.codigo}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className={cn("text-2xl font-black leading-tight tracking-tight transition-colors line-clamp-2", isDark ? "text-white" : "text-slate-900")} style={{ '--hover-color': secondaryColor } as any}>
                        {item.nombre}
                    </h3>
                    <p className="text-slate-400 font-medium text-xs flex items-center gap-2">
                        <MapPin size={12} /> {item.sede}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50 dark:border-white/5">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulos</p>
                        <p className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-800")}>{item.modulos?.length || 0}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alumnos Totales</p>
                        <p className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-800")}>{totalStudents}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// ModuloCard
// ─────────────────────────────────────────────
function ModuloCard({ item, progItem, index, theme, secondaryColor, onViewStudents, onViewGrades, onViewInsignias }: any) {
    const isDark = theme === 'dark';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4 }}
            className={cn(
                "rounded-[2.5rem] border overflow-hidden flex flex-col transition-all duration-300",
                isDark
                    ? "bg-slate-900 border-slate-800 hover:border-slate-600"
                    : "bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl"
            )}
        >
            <div className="h-1.5 w-full" style={{ backgroundColor: secondaryColor }} />

            <div className="p-7 flex flex-col gap-5 flex-1">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: secondaryColor }}>
                            <GraduationCap size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest truncate" style={{ color: secondaryColor }}>
                                {item.turno}
                            </p>
                            <h3 className={cn("text-xl font-black leading-tight mt-0.5 truncate", isDark ? "text-white" : "text-slate-900")}>
                                {item.nombre}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <InfoTile icon={Users} label="Alumnos" value={item.studentCount} isDark={isDark} secondaryColor={secondaryColor} />
                    <InfoTile icon={Calendar} label="Cronograma" value={item.fechaInicio ? `${new Date(item.fechaInicio).toLocaleDateString()} - ${new Date(item.fechaFin).toLocaleDateString()}` : 'Por definir'} isDark={isDark} secondaryColor={secondaryColor} />
                </div>

                <div className="flex flex-wrap gap-4 px-2">
                    <span className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <Hash size={12} style={{ color: secondaryColor }} /> {item.codigo || 'S/C'}
                    </span>
                    <span className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <Clock size={12} style={{ color: secondaryColor }} /> {item.turno}
                    </span>
                </div>

                <div className={cn("border-t", isDark ? "border-slate-800" : "border-slate-100")} />

                <div className="space-y-4">
                    {/* Primary Action */}
                    <Link
                        href={`/aula/curso/${item.moduloId || item.id}${item.turnoId ? `?turnoId=${item.turnoId}` : ''}`}
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-white shadow-lg shadow-primary/20 hover:brightness-110"
                        style={{ backgroundColor: secondaryColor }}
                    >
                        <ExternalLink size={18} />
                        Entrar al Aula
                    </Link>

                    {/* Quick Tools Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        <ActionButton 
                            icon={Users} 
                            label="Nómina" 
                            onClick={onViewStudents} 
                            isDark={isDark} 
                        />
                        <ActionButton 
                            icon={ClipboardList} 
                            label="Notas" 
                            onClick={onViewGrades} 
                            isDark={isDark} 
                        />
                        <ActionButton 
                            icon={Award} 
                            label="Logros" 
                            onClick={onViewInsignias} 
                            isDark={isDark} 
                            accent 
                        />
                        <Link
                            href={`/aula/asistencia/qr?sesionId=hoy&moduloId=${item.moduloId || item.id}&modulo=${encodeURIComponent(item.nombre)}&turnoId=${item.turnoId || ''}`}
                            className={cn(
                                "h-16 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 border",
                                isDark 
                                    ? "bg-slate-800 border-slate-700 text-amber-500 hover:border-amber-500/40" 
                                    : "bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100"
                            )}
                        >
                            <QrCode size={18} />
                            <span className="text-[8px] font-black uppercase tracking-widest">QR</span>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ActionButton({ icon: Icon, label, onClick, isDark, accent }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "h-16 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 border group",
                accent 
                    ? isDark ? "bg-primary/10 border-primary/20 text-primary" : "bg-primary/5 border-primary/10 text-primary"
                    : isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-900"
            )}
        >
            <Icon size={18} className="transition-transform group-hover:scale-110" />
            <span className="text-[8px] font-black uppercase tracking-widest leading-none">{label}</span>
        </button>
    );
}

function InfoTile({ icon: Icon, label, value, isDark, secondaryColor }: any) {
    return (
        <div className={cn("p-3.5 rounded-2xl flex flex-col items-center gap-1.5", isDark ? "bg-slate-800" : "bg-slate-50")}>
            <Icon size={15} style={{ color: secondaryColor }} />
            <p className={cn("text-base font-black leading-none text-center truncate w-full", isDark ? "text-white" : "text-slate-800")}>
                {value}
            </p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
    );
}
