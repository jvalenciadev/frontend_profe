'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
    mapPersonaService,
    mapCargoService,
    mapCategoriaService,
    mapNivelService,
    mapSubsistemaService,
    mapEspecialidadService,
    mapAreaService,
    mapGeneroService,
    MapPersona,
    MapCatalogo,
    ImportJobStatus,
    MapStats,
} from '@/services/mapPersonaService';
import { Card } from '@/components/ui/Card';
import {
    Users,
    Search,
    FileUp,
    CheckCircle2,
    Loader2,
    Database,
    ChevronLeft,
    ChevronRight,
    X,
    Briefcase,
    BookOpen,
    AlertTriangle,
    Tags,
    UserCheck,
    Globe,
    Layers,
    BarChart3,
    Activity,
    ShieldCheck,
    ArrowUpRight,
    History,
    User,
    Download,
    StopCircle,
    Zap,
    PieChart,
    Calendar,
    Phone,
    Mail,
    FileText,
    FileSpreadsheet,
    RotateCcw,
    LayoutDashboard,
    TrendingUp,
    Clock,
    Target,
    Shield,
    BarChart2,
    Cpu,
    ExternalLink,
    Medal,
    Server,
    Fingerprint,
    Info,
    Ghost,
    EyeOff,
    Handshake,
    Sparkles,
    UserSearch,
    Smartphone,
    Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import { useTheme } from '@/contexts/ThemeContext';

export default function MapPersonasPage() {
    const { primaryColor } = useTheme();
    const [activeTab, setActiveTab] = useState<'personas' | 'catalogos' | 'reportes'>('personas');
    const [data, setData] = useState<{ data: MapPersona[]; total: number; totalPages: number }>({
        data: [], total: 0, totalPages: 0
    });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const [stats, setStats] = useState<MapStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [currentJobStatus, setCurrentJobStatus] = useState<ImportJobStatus | null>(null);
    const [openModal, setOpenModal] = useState(false);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    const [selectedCatalog, setSelectedCatalog] = useState<string>('cargos');
    const [catalogItems, setCatalogItems] = useState<MapCatalogo[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await mapPersonaService.getAll({
                search: search || undefined,
                page,
                limit: 12
            });
            setData(result);
        } catch (error) { toast.error('Error datos'); }
        finally { setLoading(false); }
    }, [search, page]);

    const loadStats = useCallback(async () => {
        try {
            setLoadingStats(true);
            const res = await mapPersonaService.getStats();
            setStats(res);
        } catch (error) { console.error(error); }
        finally { setLoadingStats(false); }
    }, []);

    const loadCatalogItems = useCallback(async (catalogName: string) => {
        try {
            setLoadingCatalog(true);
            let items: MapCatalogo[] = [];
            switch (catalogName) {
                case 'cargos': items = await mapCargoService.getAll(); break;
                case 'categorias': items = await mapCategoriaService.getAll(); break;
                case 'niveles': items = await mapNivelService.getAll(); break;
                case 'subsistemas': items = await mapSubsistemaService.getAll(); break;
                case 'especialidades': items = await mapEspecialidadService.getAll(); break;
                case 'areas': items = await mapAreaService.getAll(); break;
                case 'generos': items = await mapGeneroService.getAll(); break;
            }
            setCatalogItems(items);
        } catch (error) { toast.error('Error catálogo'); }
        finally { setLoadingCatalog(false); }
    }, []);

    useEffect(() => {
        if (activeTab === 'personas') {
            const timer = setTimeout(loadData, 500);
            return () => clearTimeout(timer);
        } else if (activeTab === 'catalogos') {
            loadCatalogItems(selectedCatalog);
        } else if (activeTab === 'reportes') {
            loadStats();
        }
    }, [loadData, activeTab, selectedCatalog, loadCatalogItems, loadStats]);

    useEffect(() => {
        if (jobId && isProcessing) {
            pollInterval.current = setInterval(async () => {
                try {
                    const status = await mapPersonaService.getImportStatus(jobId);
                    setCurrentJobStatus(status);
                    if (status.status !== 'processing') {
                        setIsProcessing(false);
                        if (pollInterval.current) clearInterval(pollInterval.current);
                        if (status.status === 'completed') {
                            toast.success('Migración completada');
                            localStorage.setItem('last_map_migration', JSON.stringify(status));
                            loadData();
                            loadStats();
                        }
                    }
                } catch (error) { }
            }, 1000);
        }
        return () => { if (pollInterval.current) clearInterval(pollInterval.current); };
    }, [jobId, isProcessing, loadData, loadStats]);

    useEffect(() => {
        const saved = localStorage.getItem('last_map_migration');
        if (saved) setCurrentJobStatus(JSON.parse(saved));
        loadStats();
    }, [loadStats]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const newJobId = `job_${Date.now()}`;
        try {
            setIsProcessing(true);
            setJobId(newJobId);
            setOpenModal(true);
            await mapPersonaService.startImport(file, newJobId);
        } catch (error) {
            toast.error('Error inicio');
            setIsProcessing(false);
        } finally { if (e.target) e.target.value = ''; }
    };

    const downloadTemplate = () => {
        const templateData = [
            {
                'CI': '4730591',
                'Complemento': '',
                'Nombre1': 'JORGE',
                'Nombre2': '',
                'Paterno': 'QUISPE',
                'Materno': 'MAMANI',
                'RDA': '7379386',
                'Genero': '1',
                'Cargo': 'DOCENTE',
                'Especialidad': 'NORMALISTA TECNICA',
                'Categoria': 'QUINTA',
                'Nivel': 'SECUNDARIA',
                'Subsistema': 'REGULAR',
                'Area': 'URBANA',
                'EnFuncion': 'SI',
                'LibretaMilitar': 'SI',
                'Celular': '70000000',
                'Correo': 'ejemplo@correo.com',
                'FechaNacimiento': '1985-05-20'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Migracion");
        XLSX.writeFile(wb, "plantilla_migracion_map.xlsx");
        toast.success('Plantilla descargada. Úsela como base para sus datos.');
    };

    const getInitials = (p: MapPersona) => {
        const n = (p.nombre1 || '').trim().charAt(0);
        const a = (p.apellido1 || '').trim().charAt(0);
        return n && a ? `${n}${a}` : <User className="w-4 h-4" />;
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex flex-col">
            {/* Top Security Nav */}
            <div className="h-10 bg-primary/5 border-b border-primary/10 flex items-center justify-between px-8 text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>SISTEMA DE AUDITORÍA MAP</span>
                    </div>
                    <span className="opacity-30">|</span>
                    <div className="flex items-center gap-2">
                        <Database className="w-3 h-3" />
                        <span>SINCRO: {stats?.total.toLocaleString() || '...'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1"><Server className="w-2.5 h-2.5" /> NODO: CENTRAL-PROFE</span>
                    <span className="opacity-30">|</span>
                    <Clock className="w-3 h-3" />
                    <span>{new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            <header className="px-8 md:px-12 py-8 space-y-8">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-2xl bg-primary shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-help group">
                            <Shield className="w-8 h-8 text-primary-foreground group-hover:rotate-12 transition-transform" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl md:text-3xl font-black tracking-tight uppercase leading-none">
                                    Inteligencia <span className="text-primary italic">Soberana</span>
                                </h1>
                                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Live Stats</div>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.3em] mt-2">Arquitectura de Análisis Comparativo Multidimensional</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                        {[
                            { id: 'personas', label: 'Escalafón', icon: Users },
                            { id: 'catalogos', label: 'Diccionarios', icon: Tags },
                            { id: 'reportes', label: 'Inteligencia', icon: PieChart },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as any)}
                                className={cn(
                                    "flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                                    activeTab === t.id
                                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                                        : "text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-white/5"
                                )}
                            >
                                <t.icon className="w-4 h-4" />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={downloadTemplate}
                            className="h-12 px-6 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-3 text-muted-foreground hover:text-primary transition-all font-bold text-[10px] uppercase tracking-widest group shadow-sm"
                            title="Descargar Excel de Ejemplo"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Descargar Plantilla</span>
                        </button>
                        <label className={cn("h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all cursor-pointer shadow-lg group", isProcessing ? "bg-slate-900 text-white" : "bg-primary text-primary-foreground")}>
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                            <span>{isProcessing ? 'Sincronizando' : 'Sincronizar'}</span>
                            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={isProcessing} />
                        </label>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-8 md:px-12 pb-12 overflow-x-hidden">
                <AnimatePresence mode='wait'>
                    {activeTab === 'personas' ? (
                        <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            {/* KPIS RAPIDOS */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { lab: 'CATÁLOGO TOTAL', val: data.total, sub: 'Auditados', col: 'primary', ic: Activity },
                                    { lab: 'REGISTROS NUEVOS', val: currentJobStatus?.success || 0, sub: 'Inscritos', col: 'emerald', ic: Zap },
                                    { lab: 'ACTUALIZADOS', val: currentJobStatus?.updated || 0, sub: 'Sincronía', col: 'indigo', ic: RotateCcw },
                                    { lab: 'ANOMALÍAS', val: currentJobStatus?.errors.length || 0, sub: 'Corregir', col: 'rose', ic: AlertTriangle, act: () => setOpenModal(true) },
                                ].map((k, i) => (
                                    <Card key={i} onClick={k.act} className={cn("p-6 border-none shadow-sm flex items-center justify-between group cursor-default relative overflow-hidden", k.act && 'cursor-pointer hover:bg-rose-500/5')}>
                                        <div className="space-y-1 relative z-10">
                                            <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">{k.lab}</p>
                                            <div className="flex items-baseline gap-2">
                                                <h4 className="text-3xl font-black tracking-tighter">{k.val.toLocaleString()}</h4>
                                                <span className={cn("text-[9px] font-black uppercase tracking-widest", `text-${k.col}-500`)}>{k.sub}</span>
                                            </div>
                                        </div>
                                        <div className={cn("p-3 rounded-xl bg-slate-50 dark:bg-white/10 relative z-10", `text-${k.col}-500 group-hover:scale-110 transition-transform`)}><k.ic className="w-5 h-5" /></div>
                                        <div className={cn("absolute -bottom-4 -right-4 w-24 h-24 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity", `text-${k.col}-500`)}><k.ic className="w-full h-full" /></div>
                                    </Card>
                                ))}
                            </div>

                            <div className="relative group mx-auto">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Consultar CI, Nombre o RDA..."
                                    className="w-full h-14 pl-14 pr-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold uppercase tracking-widest placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all outline-none shadow-sm"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {loading ? (
                                    Array(8).fill(0).map((_, i) => <div key={i} className="h-64 animate-pulse bg-white dark:bg-white/5 rounded-3xl border border-slate-50 dark:border-white/5" />)
                                ) : (
                                    data.data.map((p, idx) => (
                                        <Card key={p.id} className="p-0 border-none shadow-sm hover:shadow-2xl transition-all group rounded-[2rem] relative overflow-hidden bg-white dark:bg-white/5 flex flex-col">
                                            {/* Header Ficha */}
                                            <div className="p-6 pb-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shadow-inner group-hover:scale-105 transition-transform border border-primary/20">
                                                        {getInitials(p)}
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-1">
                                                        <div className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter", p.enFuncion ? "bg-indigo-500/10 text-indigo-600" : "bg-slate-200 text-slate-500")}>
                                                            {p.enFuncion ? 'Habilitado' : 'En Reserva'}
                                                        </div>
                                                        <div className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter", p.rda ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
                                                            {p.rda ? 'Vinculado' : 'Acéfalo'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-black text-[13px] leading-tight uppercase group-hover:text-primary transition-colors">
                                                        {p.nombre1} {p.nombre2 || ''} {p.apellido1} {p.apellido2 || ''}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                                                        <p className="text-[11px] font-bold text-slate-500 tracking-tighter">CI: {p.ci} {p.complemento ? `-${p.complemento}` : ''}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detalles Técnicos */}
                                            <div className="p-6 space-y-4 flex-1">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">RDA Registro</p>
                                                        <div className="flex items-center gap-2">
                                                            <Target className="w-3 h-3 text-indigo-500" />
                                                            <span className="text-[10px] font-black tabular-nums">{p.rda || '---'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">Militar</p>
                                                        <div className="flex items-center gap-2">
                                                            <Medal className={cn("w-3 h-3", p.libretaMilitar ? "text-amber-500" : "text-slate-300")} />
                                                            <span className="text-[10px] font-black uppercase">{p.libretaMilitar ? 'PRESENTÓ' : 'PENDIENTE'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 pt-2 border-t border-slate-50 dark:border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-white/5"><Briefcase className="w-3.5 h-3.5 text-indigo-500" /></div>
                                                        <div className="min-w-0">
                                                            <p className="text-[7px] font-black opacity-40 uppercase tracking-widest">Cargo Designado</p>
                                                            <p className="text-[10px] font-black uppercase truncate leading-tight">{p.cargo?.nombre || 'SIN DESIGNACIÓN'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-white/5"><BookOpen className="w-3.5 h-3.5 text-emerald-500" /></div>
                                                        <div className="min-w-0">
                                                            <p className="text-[7px] font-black opacity-40 uppercase tracking-widest">Especialidad</p>
                                                            <p className="text-[10px] font-black uppercase truncate leading-tight">{p.especialidad?.nombre || 'COMPLEMENTARIO'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-white/5"><Layers className="w-3.5 h-3.5 text-amber-500" /></div>
                                                        <div className="min-w-0">
                                                            <p className="text-[7px] font-black opacity-40 uppercase tracking-widest">Categoria / Escalafón</p>
                                                            <p className="text-[10px] font-black uppercase truncate leading-tight">{p.categoria?.nombre || 'PRIMER NIVEL'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/5"><Network className="w-3.5 h-3.5 text-slate-500" /></div>
                                                        <div className="min-w-0">
                                                            <p className="text-[7px] font-black opacity-40 uppercase tracking-widest">Nivel / Subsistema</p>
                                                            <p className="text-[10px] font-black uppercase truncate leading-tight">{p.nivel?.nombre || '---'} | {p.subsistema?.nombre || '---'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-slate-50 dark:border-white/5 grid grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <Smartphone className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[9px] font-bold tabular-nums">{p.celular || 'S/N'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Mail className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[9px] font-bold truncate">{p.correo || 'S/C'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer Acciones */}
                                            <div className="p-4 bg-slate-50/30 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <Globe className="w-3 h-3 text-primary" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">{p.area?.nombre || 'NACIONAL'}</span>
                                                </div>
                                                <button className="p-2 rounded-xl hover:bg-white dark:hover:bg-white/10 shadow-sm transition-all text-primary">
                                                    <UserSearch className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    ) : activeTab === 'reportes' ? (
                        <motion.div key="r" className="space-y-12">
                            {/* COMPARATIVOS ESTRATÉGICOS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[
                                    {
                                        label: 'Estado de Servicio',
                                        primary: { val: stats?.kpis.operativos, label: 'En Función', color: 'emerald', icon: Activity },
                                        secondary: { val: stats?.kpis.noOperativos, label: 'En Reserva', color: 'slate', icon: Ghost }
                                    },
                                    {
                                        label: 'Cobertura RDA',
                                        primary: { val: stats?.kpis.conRda, label: 'Vinculados', color: 'primary', icon: Fingerprint },
                                        secondary: { val: stats?.kpis.sinRda, label: 'Sin RDA', color: 'rose', icon: EyeOff }
                                    },
                                    {
                                        label: 'Requisito Militar',
                                        primary: { val: stats?.kpis.libretaMilitar, label: 'Cumple', color: 'amber', icon: Medal },
                                        secondary: { val: stats?.kpis.noLibretaMilitar, label: 'Pendiente', color: 'orange', icon: AlertTriangle }
                                    },
                                    {
                                        label: 'Madurez Digital',
                                        primary: { val: stats?.kpis.coberturaCorreo, label: 'Email Verif.', color: 'indigo', icon: Mail },
                                        secondary: { val: `${stats?.kpis.digitalizacion}%`, label: 'Integridad', color: 'emerald', icon: Sparkles }
                                    },
                                ].map((group, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                        <Card className="p-8 border-none bg-white dark:bg-white/5 shadow-sm rounded-[2.5rem] relative overflow-hidden group">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 border-b border-slate-50 dark:border-white/5 pb-2">{group.label}</p>

                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className={cn("text-[8px] font-black uppercase tracking-widest", `text-${group.primary.color}-500/60`)}>{group.primary.label}</p>
                                                        <h4 className="text-3xl font-black tracking-tighter">{group.primary.val?.toLocaleString()}</h4>
                                                    </div>
                                                    <group.primary.icon className={cn("w-8 h-8 opacity-20", `text-${group.primary.color}-500`)} />
                                                </div>

                                                <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex">
                                                    <motion.div
                                                        className={cn("h-full", `bg-${group.primary.color}-500`)}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: typeof group.secondary.val === 'string' ? '100%' : `${(group.primary.val! / (group.primary.val! + group.secondary.val!)) * 100}%` }}
                                                    />
                                                    {typeof group.secondary.val === 'number' && (
                                                        <motion.div
                                                            className={cn("h-full opacity-30", `bg-${group.secondary.color}-500`)}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(group.secondary.val / (group.primary.val! + group.secondary.val)) * 100}%` }}
                                                        />
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between opacity-60">
                                                    <div className="flex items-center gap-2">
                                                        <group.secondary.icon className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-bold uppercase">{group.secondary.label}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black">{group.secondary.val?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* ESTRUCTURA DE CARGOS */}
                                <Card className="p-8 border-none bg-white dark:bg-white/5 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col h-[700px]">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Briefcase className="w-32 h-32" /></div>
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-inner"><Handshake className="w-6 h-6" /></div>
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tight">Estructura de Cargos</h3>
                                                <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-0.5">Ranking de Asignación Nacional</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full text-[9px] font-black uppercase opacity-60">
                                            {stats?.cargos.length || 0} Registros
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-2 relative z-10">
                                        {stats?.cargos.map((item, idx) => (
                                            <div key={idx} className="group/row flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/10">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-muted-foreground group-hover/row:bg-indigo-500 group-hover/row:text-white transition-all shadow-sm">
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[11px] font-black uppercase tracking-tight truncate pr-4 opacity-70 group-hover/row:opacity-100">{item.name}</span>
                                                        <span className="text-[12px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{item.value.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-200/50 dark:bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-indigo-500/80 rounded-full"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(item.value / stats.cargos[0].value) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* ESPECIALIDADES CRITICAS */}
                                <Card className="p-8 border-none bg-white dark:bg-white/5 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col h-[700px]">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><BookOpen className="w-32 h-32" /></div>
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 shadow-inner"><Medal className="w-6 h-6" /></div>
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tight">Especialidades Críticas</h3>
                                                <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-0.5">Demanda de Menciones Académicas</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full text-[9px] font-black uppercase opacity-60">
                                            {stats?.especialidades.length || 0} Registros
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-2 relative z-10">
                                        {stats?.especialidades.map((item, idx) => (
                                            <div key={idx} className="group/row flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/10">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-muted-foreground group-hover/row:bg-amber-500 group-hover/row:text-white transition-all shadow-sm">
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[11px] font-black uppercase tracking-tight truncate pr-4 opacity-70 group-hover/row:opacity-100">{item.name}</span>
                                                        <span className="text-[12px] font-black text-amber-600 dark:text-amber-500 tabular-nums">{item.value.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-200/50 dark:bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-amber-500/80 rounded-full"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(item.value / stats.especialidades[0].value) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            {/* MAS DATOS (CATEGORIAS + AREAS) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="p-10 border-none bg-white dark:bg-white/5 rounded-[2.5rem] shadow-sm">
                                    <div className="flex items-center gap-3 mb-8">
                                        <Layers className="w-4 h-4 text-primary" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Escalafón Docente por Categoría</h4>
                                    </div>
                                    <div className="space-y-6">
                                        {stats?.categorias.map((c, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase">
                                                    <span className="truncate max-w-[70%] opacity-60">{c.name}</span>
                                                    <span className="text-primary">{Math.round((c.value / stats.total) * 100)}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-primary"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(c.value / stats.total) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                <Card className="p-10 border-none bg-white dark:bg-white/5 rounded-[2.5rem] shadow-sm flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-10">
                                        <Globe className="w-4 h-4 text-emerald-500" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Distribución Territorial Nacional</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        {stats?.areas.map((a, i) => (
                                            <div key={i} className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] group hover:scale-105 transition-transform">
                                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors", a.name === 'URBANA' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600')}>
                                                    <Globe className="w-8 h-8" />
                                                </div>
                                                <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-1">{a.name}</p>
                                                <p className="text-4xl font-black tracking-tighter tabular-nums">{Math.round((a.value / stats.total) * 100)}%</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                    ) : activeTab === 'catalogos' ? (
                        <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                            {/* Selector de Diccionarios */}
                            <div className="flex flex-wrap gap-3 justify-center p-2 bg-slate-100/50 dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/10 max-w-5xl mx-auto shadow-sm">
                                {[
                                    { id: 'cargos', label: 'Maestro de Cargos', icon: Briefcase },
                                    { id: 'especialidades', label: 'Especialidades', icon: BookOpen },
                                    { id: 'subsistemas', label: 'Subsistemas', icon: Globe },
                                    { id: 'areas', label: 'Áreas Geográficas', icon: LayoutDashboard },
                                    { id: 'categorias', label: 'Escalafón', icon: Layers },
                                    { id: 'niveles', label: 'Niveles', icon: Tags },
                                    { id: 'generos', label: 'Géneros', icon: Users },
                                ].map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCatalog(cat.id)}
                                        className={cn(
                                            "flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            selectedCatalog === cat.id
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                                : "text-muted-foreground hover:bg-slate-200 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <cat.icon className="w-4 h-4" />
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Grid de Items del Diccionario */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {loadingCatalog ? (
                                    Array(12).fill(0).map((_, i) => (
                                        <div key={i} className="h-28 animate-pulse bg-white dark:bg-white/5 rounded-[1.5rem] border border-slate-100 dark:border-white/5" />
                                    ))
                                ) : (
                                    catalogItems.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.02 }}
                                        >
                                            <Card className="p-6 border-none bg-white dark:bg-white/5 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group rounded-[1.5rem] relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:opacity-10 shadow-indigo-500">
                                                    <Fingerprint className="w-12 h-12" />
                                                </div>
                                                <div className="relative z-10 space-y-3">
                                                    <p className="text-[11px] font-black uppercase tracking-tight text-center leading-snug min-h-[40px] flex items-center justify-center group-hover:text-primary transition-colors">
                                                        {item.nombre}
                                                    </p>
                                                    <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
                                                        <div className="h-0.5 w-8 bg-primary/40 rounded-full" />
                                                        <span className="text-[7px] font-black tracking-[0.2em] uppercase">Registrado</span>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-transparent group-hover:bg-primary/20 transition-all" />
                                            </Card>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {catalogItems.length === 0 && !loadingCatalog && (
                                <div className="text-center py-20 space-y-4 opacity-30">
                                    <Search className="w-12 h-12 mx-auto" />
                                    <p className="font-black uppercase tracking-widest text-sm">No hay registros en este diccionario</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                            <Layers className="w-20 h-20" />
                            <h3 className="font-black text-4xl uppercase tracking-[0.5em]">Módulo Inactivo</h3>
                            <p className="text-xs font-bold uppercase tracking-widest">Seleccione una pestaña superior</p>
                        </div>
                    )}
                </AnimatePresence>
            </main>

            <Modal isOpen={openModal} onClose={() => !isProcessing && setOpenModal(false)} title="PROCESO DE SINCRONIZACIÓN NACIONAL" size="md">
                {currentJobStatus && (
                    <div className="space-y-8 p-6">
                        {isProcessing && (
                            <div className="space-y-6 text-center">
                                <div className="relative inline-block">
                                    <div className="text-6xl font-black text-primary animate-pulse">{Math.round((currentJobStatus.current / currentJobStatus.total) * 100)}%</div>
                                    <div className="absolute -top-2 -right-2"><Activity className="w-4 h-4 text-emerald-500 animate-bounce" /></div>
                                </div>
                                <div className="h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5">
                                    <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${(currentJobStatus.current / currentJobStatus.total) * 100}%` }} />
                                </div>
                                <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.3em]">PROCESANDO: {currentJobStatus.current.toLocaleString()} / {currentJobStatus.total.toLocaleString()}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-6">
                            {[
                                { lab: 'ÉXITO', val: currentJobStatus.success, col: 'emerald', ic: Zap },
                                { lab: 'SINCRO', val: currentJobStatus.updated, col: 'primary', ic: RotateCcw },
                                { lab: 'ERROR', val: currentJobStatus.errors.length, col: 'rose', ic: AlertTriangle },
                            ].map((s, i) => (
                                <div key={i} className={cn("p-6 rounded-[1.5rem] text-center border-b-8 shadow-sm transition-all", `bg-${s.col}-500/5 border-${s.col}-500/20`)}>
                                    <s.ic className={cn("w-5 h-5 mx-auto mb-3 opacity-40", `text-${s.col}-600`)} />
                                    <p className={cn("text-[9px] font-black uppercase mb-1 tracking-widest", `text-${s.col}-600`)}>{s.lab}</p>
                                    <p className={cn("text-3xl font-black tracking-tighter", `text-${s.col}-700`)}>{s.val.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                        {!isProcessing && (
                            <div className="space-y-4">
                                {currentJobStatus.errors.length > 0 && (
                                    <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/10 text-[10px] font-bold text-rose-600 uppercase text-center tracking-widest">
                                        Se detectaron {currentJobStatus.errors.length} anomalías estructurales
                                    </div>
                                )}
                                <button onClick={() => setOpenModal(false)} className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-[0.4em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">FINALIZAR AUDITORÍA</button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
            `}</style>
        </div>
    );
}
