'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Inbox, Search, FileText, Clock,
    ArrowUpRight, CheckCircle2, Calendar,
    User, RefreshCw, ChevronRight, Loader2, AlertCircle,
    Send, Archive, Hash, X, ShieldCheck, Download, ArrowRight,
    FileUp, Building2, Layers, History, GitBranch, Filter, BarChart3,
    ChevronDown, Activity, Landmark, MapPin, Copy, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    obtenerBandeja,
    avanzarEstado,
    buscarUsuarios,
    obtenerHistorialTenants,
    ESTADO_LABELS,
    type CorDocumento,
    type CorUsuario,
    type CorHistorialTenantResponse,
    type CorHistorialItem
} from '@/services/correspondencia.service';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { uploadService } from '@/services/uploadService';
import { getImageUrl } from '@/lib/utils';
import { useAbility } from '@/hooks/useAbility';
import { useRouter } from 'next/navigation';

const TABS = [
    { id: 'recibidos', label: 'Recibidos', icon: Inbox },
    { id: 'enviados', label: 'Enviados', icon: Send },
    { id: 'enProceso', label: 'Borradores', icon: Clock },
    { id: 'archivados', label: 'Archivados', icon: Archive },
    { id: 'historial', label: 'Historial de Auditoría', icon: History },
] as const;

type TabType = typeof TABS[number]['id'];

const DEPARTAMENTOS_LIST = [
    { id: 'TODOS', label: 'Todos los Departamentos', sigla: 'TODOS' },
    { id: 'MESC', label: 'Dirección Nacional (MESC)', sigla: 'MESC' },
    { id: 'LP', label: 'La Paz (LP)', sigla: 'LP' },
    { id: 'CB', label: 'Cochabamba (CB)', sigla: 'CB' },
    { id: 'CH', label: 'Chuquisaca (CH)', sigla: 'CH' },
    { id: 'OR', label: 'Oruro (OR)', sigla: 'OR' },
    { id: 'PT', label: 'Potosí (PT)', sigla: 'PT' },
    { id: 'TJ', label: 'Tarija (TJ)', sigla: 'TJ' },
    { id: 'SC', label: 'Santa Cruz (SC)', sigla: 'SC' },
    { id: 'BN', label: 'Beni (BN)', sigla: 'BN' },
    { id: 'PD', label: 'Pando (PD)', sigla: 'PD' },
];

export default function BandejaPage() {
    const { user } = useAuth();
    const { can } = useAbility();
    const router = useRouter();

    // — Pestaña Activa —
    const [tab, setTab] = useState<TabType>('recibidos');

    // — Bandeja State —
    const [bandeja, setBandeja] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<CorDocumento | null>(null);
    const [avanzando, setAvanzando] = useState(false);

    // — Agrupación y Filtro por Departamento —
    const [vistaAgrupada, setVistaAgrupada] = useState(false);
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('TODOS');

    // — Historial de Auditoría State —
    const [historialData, setHistorialData] = useState<CorHistorialTenantResponse | null>(null);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [historialSearch, setHistorialSearch] = useState('');
    const [historialAccionFilter, setHistorialAccionFilter] = useState('TODAS');

    // Estados para Derivación Dinámica
    const [accionSeleccionada, setAccionSeleccionada] = useState<string | null>(null);
    const [nuevoDest, setNuevoDest] = useState<any>(null);
    const [archivoUrl, setArchivoUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [detalle, setDetalle] = useState('');

    // Guard CASL
    useEffect(() => {
        if (!can('read', 'CorDocumento')) {
            router.replace('/dashboard');
        }
    }, [can, router]);

    const fetchBandeja = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerBandeja();
            setBandeja(data);
        } catch (err: any) {
            setError(err?.message ?? 'Error al cargar la bandeja');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistorial = useCallback(async () => {
        setLoadingHistorial(true);
        try {
            const deptParam = selectedDeptFilter !== 'TODOS' ? selectedDeptFilter : undefined;
            const data = await obtenerHistorialTenants(deptParam);
            setHistorialData(data);
        } catch (err: any) {
            toast.error('Error al cargar el historial de auditoría');
        } finally {
            setLoadingHistorial(false);
        }
    }, [selectedDeptFilter]);

    useEffect(() => {
        if (tab === 'historial') {
            fetchHistorial();
        } else {
            fetchBandeja();
        }
    }, [tab, fetchBandeja, fetchHistorial]);

    useEffect(() => {
        if (tab === 'historial') {
            fetchHistorial();
        }
    }, [selectedDeptFilter, tab, fetchHistorial]);

    // Limpiar estado del panel de acción al cambiar documento seleccionado
    useEffect(() => {
        setAccionSeleccionada(null);
        setNuevoDest(null);
        setArchivoUrl(null);
        setDetalle('');
    }, [selected?.id]);

    const docs = tab !== 'historial' ? (bandeja?.[tab] || []) : [];

    // Documentos filtrados por búsqueda y por Departamento
    const filtered = useMemo(() => {
        return docs.filter((doc: any) => {
            const docSigla = doc.tenantInfo?.abreviacion || doc.cite?.match(/PROFE\/([A-Z]+)\b/i)?.[1]?.toUpperCase() || 'NAC';
            const matchDept = selectedDeptFilter === 'TODOS' || docSigla === selectedDeptFilter || doc.tenantId === selectedDeptFilter;
            const matchSearch = !search || [doc.cite, doc.hr, doc.referencia]
                .some(s => s?.toLowerCase().includes(search.toLowerCase()));
            return matchDept && matchSearch;
        });
    }, [docs, search, selectedDeptFilter]);

    // Agrupamiento por Departamento para la vista de tarjetas agrupadas
    const groupedByDept = useMemo(() => {
        const map = new Map<string, { tenantId: string; nombre: string; abreviacion: string; docs: CorDocumento[] }>();

        filtered.forEach((doc: any) => {
            const sigla = doc.tenantInfo?.abreviacion || doc.cite?.match(/PROFE\/([A-Z]+)\b/i)?.[1]?.toUpperCase() || 'NAC';
            const nombre = doc.tenantInfo?.nombre || `Departamento ${sigla}`;
            const key = sigla;

            if (!map.has(key)) {
                map.set(key, {
                    tenantId: doc.tenantId || key,
                    nombre,
                    abreviacion: sigla,
                    docs: [],
                });
            }
            map.get(key)!.docs.push(doc);
        });

        return Array.from(map.values());
    }, [filtered]);

    // Historial filtrado
    const historialFiltrado = useMemo(() => {
        if (!historialData?.historial) return [];
        return historialData.historial.filter((item: CorHistorialItem) => {
            const matchAccion = historialAccionFilter === 'TODAS' || item.accion === historialAccionFilter;
            const matchSearch = !historialSearch || [
                item.id,
                item.documento?.cite,
                item.documento?.hr,
                item.documento?.referencia,
                item.usuario?.nombre,
                item.usuario?.apellidos,
                item.detalle
            ].some(s => s?.toLowerCase().includes(historialSearch.toLowerCase()));
            return matchAccion && matchSearch;
        });
    }, [historialData, historialSearch, historialAccionFilter]);

    const handleAvanzar = async (doc: CorDocumento, accion: string) => {
        if (accion === 'DERIVACION' && !nuevoDest) {
            toast.error('Debe seleccionar a quién derivar el trámite');
            return;
        }
        setAvanzando(true);
        try {
            await avanzarEstado(
                doc.id,
                (accion === 'RECEPCION' && nuevoDest) ? 'DERIVACION' : accion,
                detalle || `Acción "${accion}" registrada desde la bandeja.`,
                archivoUrl || undefined,
                nuevoDest?.id || undefined
            );
            const mensajes: Record<string, string> = {
                ENVIO: 'Documento enviado oficialmente',
                RECEPCION: 'Recepción confirmada',
                DERIVACION: 'Documento derivado correctamente',
                DEVOLUCION: 'Documento devuelto al remitente',
                CANCELAR: 'Operación realizada correctamente',
                ARCHIVADO: 'Documento archivado',
            };
            toast.success(mensajes[accion] ?? `Acción "${accion}" registrada`);
            setNuevoDest(null);
            setArchivoUrl(null);
            setDetalle('');
            setAccionSeleccionada(null);
            await fetchBandeja();
            setSelected(null);
        } catch (err: any) {
            if (!err.status) {
                toast.error('Error de conexión. Verifique su red e intente de nuevo.');
            }
        } finally {
            setAvanzando(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('El archivo excede el límite de 5MB');
            return;
        }

        setUploading(true);
        try {
            const res = await uploadService.uploadFile(file, 'correspondencia');
            setArchivoUrl(res.data.path);
            toast.success('Archivo adjunto listo');
        } catch (err) {
            toast.error('Fallo al subir archivo');
        } finally {
            setUploading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado al portapapeles`);
    };

    const renderActions = (doc: CorDocumento) => {
        if (accionSeleccionada) {
            return (
                <div className="space-y-6 mt-4 p-6 rounded-[2rem] bg-accent/30 border border-accent/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Confirmar {accionSeleccionada}</span>
                        <button onClick={() => { setAccionSeleccionada(null); setNuevoDest(null); setArchivoUrl(null); }} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {(accionSeleccionada === 'DERIVACION' || accionSeleccionada === 'RECEPCION') && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                {accionSeleccionada === 'DERIVACION' ? '¿A quién derivar?' : 'Derivar a (Opcional - Envío Directo)'}
                            </p>
                            <UserSearchInline onSelect={setNuevoDest} selected={nuevoDest} />
                        </div>
                    )}

                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Archivo Adjunto (Opcional - Máx 5MB)</p>
                        <div className="relative group">
                            <input type="file" accept="application/pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className={cn(
                                "h-14 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all",
                                archivoUrl ? "bg-emerald-500/10 border-emerald-500 text-emerald-600" : "bg-card border-border group-hover:border-primary/50 group-hover:bg-primary/5"
                            )}>
                                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : archivoUrl ? <CheckCircle2 className="w-5 h-5" /> : <FileUp className="w-5 h-5 opacity-40" />}
                                <span className="text-[10px] font-black uppercase">{uploading ? 'Subiendo...' : archivoUrl ? 'Archivo Listo' : 'Subir Respuesta PDF'}</span>
                            </div>
                        </div>
                        {archivoUrl && (
                            <div className="rounded-xl overflow-hidden border border-border h-48 bg-muted/50 animate-in fade-in slide-in-from-top-2">
                                <embed src={`${getImageUrl(archivoUrl)}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" className="w-full h-full" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Detalle o Comentario</p>
                        <textarea value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Escriba observaciones de custodia..."
                            className="w-full h-24 p-3 text-xs rounded-xl bg-card border border-border outline-none focus:border-primary" />
                    </div>

                    <button onClick={() => handleAvanzar(doc, accionSeleccionada)} disabled={avanzando}
                        className="w-full h-12 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                        {avanzando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Operación'}
                    </button>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 gap-3 mt-4">
                {tab === 'recibidos' && (
                    <>
                        <button onClick={() => setAccionSeleccionada('RECEPCION')}
                            className="h-12 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Recibir Trámite
                        </button>
                        <button onClick={() => setAccionSeleccionada('DERIVACION')}
                            className="h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <ArrowUpRight className="w-4 h-4" /> Derivar Trámite
                        </button>
                        <button onClick={() => setAccionSeleccionada('DEVOLUCION')}
                            className="h-12 rounded-xl bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white border border-orange-500/20 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 col-span-2">
                            <AlertCircle className="w-4 h-4" /> Devolver al Remitente
                        </button>
                    </>
                )}

                {tab === 'enProceso' && (
                    <>
                        <button onClick={() => handleAvanzar(doc, 'ENVIO')} disabled={avanzando}
                            className="h-12 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 col-span-2 shadow-lg shadow-primary/20">
                            {avanzando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Oficializar y Enviar
                        </button>
                        <Link href={`/dashboard/correspondencia/nuevo?id=${doc.id}`}
                            className="h-12 rounded-xl border border-border font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all flex items-center justify-center gap-2 col-span-2">
                            Editar Borrador
                        </Link>
                    </>
                )}

                {tab === 'enviados' && (
                    <>
                        <button onClick={() => handleAvanzar(doc, 'CANCELAR')} disabled={avanzando}
                            className="h-12 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 col-span-2">
                            {avanzando ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Cancelar Envío
                        </button>
                    </>
                )}

                {doc.estado !== 'ARCHIVADO' && (
                    <button onClick={() => handleAvanzar(doc, 'ARCHIVADO')} disabled={avanzando}
                        className="h-12 rounded-xl bg-accent text-muted-foreground hover:text-foreground font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 col-span-2">
                        <Archive className="w-4 h-4" /> Archivar Definitivamente
                    </button>
                )}
            </div>
        );
    };

    const UserSearchInline = ({ onSelect, selected }: { onSelect: (u: any) => void; selected: any }) => {
        const [q, setQ] = useState('');
        const [results, setResults] = useState<any[]>([]);
        const [open, setOpen] = useState(false);

        const search = async (val: string) => {
            if (val.length < 2) { setResults([]); return; }
            try {
                const data = await buscarUsuarios(val);
                setResults(data);
                setOpen(true);
            } catch (err) { }
        };

        return (
            <div className="relative">
                {selected ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-black">{selected.nombre[0]}</div>
                            <div>
                                <p className="text-xs font-bold">{selected.nombre} {selected.apellidos}</p>
                                <p className="text-[8px] text-muted-foreground uppercase font-black">{selected.cargoStr}</p>
                            </div>
                        </div>
                        <button onClick={() => onSelect(null)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input type="text" value={q} onChange={e => { setQ(e.target.value); search(e.target.value); }} placeholder="Buscar usuario para derivación..."
                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner" />
                        </div>
                        <AnimatePresence>
                            {open && results.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                    className="absolute z-50 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                    {results.map(u => (
                                        <button key={u.id} onClick={() => { onSelect(u); setOpen(false); setQ(''); }}
                                            className="w-full flex items-center gap-3 p-4 hover:bg-primary/5 transition-colors text-left border-b border-border/30 last:border-0">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">{u.nombre[0]}</div>
                                            <div className="flex-1">
                                                <p className="text-[11px] font-bold">{u.nombre} {u.apellidos}</p>
                                                <p className="text-[8px] text-muted-foreground uppercase font-black truncate">{u.cargoStr}</p>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
        );
    };

    if (!can('read', 'CorDocumento')) return null;

    return (
        <div className="space-y-8 pb-20">
            {/* Header Principal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                        <Inbox className="w-8 h-8 text-primary" />
                        Bandeja Vía PROFE
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2">
                        Control de Trámites, Hojas de Ruta y Auditoría de <span className="font-bold text-primary">cor_seguimiento</span> por Departamento.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={tab === 'historial' ? fetchHistorial : fetchBandeja} disabled={loading || loadingHistorial}
                        className="w-12 h-12 rounded-2xl border border-border/60 hover:bg-accent flex items-center justify-center transition-all bg-card shadow-sm">
                        <RefreshCw className={cn('w-4 h-4', (loading || loadingHistorial) && 'animate-spin text-primary')} />
                    </button>

                    <Link href="/dashboard/correspondencia/nuevo"
                        className="px-6 h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                        <ArrowUpRight className="w-4 h-4" /> Nuevo Documento
                    </Link>
                </div>
            </div>

            {/* Barra de Filtros Superior: Tabs + Buscador + Agrupación por Departamento */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Tabs Principales integradas */}
                <div className="flex flex-wrap items-center gap-2 bg-card/60 p-1.5 rounded-2xl border border-border/60 backdrop-blur-md shadow-sm">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
                            className={cn('px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2',
                                tab === t.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-accent')}>
                            <t.icon className="w-3.5 h-3.5" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab !== 'historial' && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
                        {/* Buscador */}
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por CITE, HR o asunto..."
                                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border/60 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold text-sm transition-all shadow-sm" />
                        </div>

                        {/* Selector de Departamento */}
                        <div className="relative w-full sm:w-64">
                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            <select value={selectedDeptFilter} onChange={e => setSelectedDeptFilter(e.target.value)}
                                className="w-full h-12 pl-10 pr-8 rounded-2xl bg-card border border-border/60 font-black text-[11px] uppercase tracking-wider outline-none focus:border-primary appearance-none cursor-pointer shadow-sm">
                                {DEPARTAMENTOS_LIST.map(d => (
                                    <option key={d.id} value={d.id}>{d.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none" />
                        </div>

                        {/* Toggle Vista Lista vs Vista Agrupada por Departamento */}
                        <button onClick={() => setVistaAgrupada(!vistaAgrupada)}
                            className={cn('h-12 px-4 rounded-2xl border border-border/60 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 shadow-sm',
                                vistaAgrupada ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground hover:bg-accent')}>
                            {vistaAgrupada ? <Layers className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
                            {vistaAgrupada ? 'Agrupado por Departamento' : 'Vista Lista'}
                        </button>
                    </div>
                )}
            </div>

            {/* Mensaje de Error */}
            {error && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-bold text-sm">{error}</p>
                </div>
            )}

            {/* SECCIÓN BANDEJA: VISTAS (LISTA O AGRUPADA) */}
            {tab !== 'historial' && (
                <>
                    {vistaAgrupada ? (
                        <div className="space-y-8">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-36 gap-4 bg-card rounded-[2.5rem] border border-border/50">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Agrupando Documentos por Departamento...</p>
                                </div>
                            ) : groupedByDept.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-[2.5rem] border border-border/50">
                                    <Building2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                                    <h3 className="text-lg font-black text-muted-foreground">No se encontraron trámites para este Departamento</h3>
                                </div>
                            ) : (
                                groupedByDept.map((group) => (
                                    <div key={group.abreviacion} className="bg-card border border-border/60 rounded-[2.5rem] overflow-hidden shadow-lg">
                                        <div className="px-8 py-5 bg-accent/40 border-b border-border/50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-md">
                                                    {group.abreviacion}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-base tracking-tight">{group.nombre}</h3>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                        <Building2 className="w-3 h-3 text-primary" />
                                                        Departamento: <span className="text-primary font-mono">{group.abreviacion}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                                {group.docs.length} {group.docs.length === 1 ? 'Documento' : 'Documentos'}
                                            </span>
                                        </div>

                                        <div className="divide-y divide-border/30">
                                            {group.docs.map((doc: any) => {
                                                const ultimoSeguimiento = doc.seguimientos?.[0];
                                                const remitente = doc.participantes?.find((p: any) => p.rol === 'REMITENTE')?.usuario;
                                                const remitenteNombre = remitente ? `${remitente.nombre} ${remitente.apellidos}` : null;

                                                return (
                                                    <div key={doc.id}
                                                        onClick={() => setSelected(selected?.id === doc.id ? null : doc)}
                                                        className={cn("p-6 hover:bg-primary/5 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4",
                                                            selected?.id === doc.id && "bg-primary/5")}>
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-muted flex flex-col items-center justify-center shrink-0 border border-border/50">
                                                                <span className="text-[8px] font-black leading-none mb-1 opacity-50">{doc.gestion}</span>
                                                                <Hash className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-black tracking-tight">{doc.cite}</span>
                                                                    {doc.hr && (
                                                                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[9px] font-black border border-emerald-500/20">
                                                                            HR: {doc.hr}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs font-bold text-muted-foreground mt-1 line-clamp-1">{doc.referencia}</p>
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-medium text-muted-foreground mt-1">
                                                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                                        <User className="w-3 h-3 text-emerald-500" />
                                                                        Creador: {remitenteNombre || 'N/A'}
                                                                    </span>
                                                                    {ultimoSeguimiento?.usuario && (
                                                                        <span className="flex items-center gap-1">
                                                                            <User className="w-3 h-3 text-primary" />
                                                                            Último: {ultimoSeguimiento.usuario.nombre} {ultimoSeguimiento.usuario.apellidos}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-end gap-4">
                                                            <span className={cn(
                                                                'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border',
                                                                ESTADO_LABELS[doc.estado]?.color ?? 'bg-muted text-muted-foreground'
                                                            )}>
                                                                {ESTADO_LABELS[doc.estado]?.label ?? doc.estado}
                                                            </span>
                                                            <Link href={`/dashboard/correspondencia/seguimiento?cite=${encodeURIComponent(doc.cite)}`}
                                                                onClick={e => e.stopPropagation()}
                                                                className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all">
                                                                <FileText className="w-4 h-4" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* VISTA LISTA TRADICIONAL */
                        <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-xl min-h-[400px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-40 gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando Bandeja...</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-muted/10">
                                    <div className="w-20 h-20 rounded-[2rem] bg-muted flex items-center justify-center text-muted-foreground/30 mb-4">
                                        <Inbox className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight text-muted-foreground">Bandeja Vacía</h3>
                                    <p className="text-sm text-muted-foreground/60 mt-1 italic">No se encontraron documentos en "{TABS.find(t => t.id === tab)?.label}".</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-muted/30">
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Identificación / Departamento</th>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Referencia y Custodia</th>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estado</th>
                                                <th className="px-8 py-5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {filtered.map((doc: any) => {
                                                const ultimoSeguimiento = doc.seguimientos?.[0];
                                                const deptSigla = doc.tenantInfo?.abreviacion || doc.cite?.match(/PROFE\/([A-Z]+)\b/i)?.[1]?.toUpperCase() || 'NAC';
                                                const remitente = doc.participantes?.find((p: any) => p.rol === 'REMITENTE')?.usuario;
                                                const remitenteNombre = remitente ? `${remitente.nombre} ${remitente.apellidos}` : null;

                                                return (
                                                    <motion.tr key={doc.id}
                                                        whileHover={{ backgroundColor: 'rgba(var(--primary-rgb), 0.02)' }}
                                                        className={cn("group cursor-pointer transition-colors", selected?.id === doc.id && "bg-primary/5")}
                                                        onClick={() => {
                                                            setAccionSeleccionada(null);
                                                            setNuevoDest(null);
                                                            setArchivoUrl(null);
                                                            setDetalle('');
                                                            setSelected(selected?.id === doc.id ? null : doc);
                                                        }}>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-muted flex flex-col items-center justify-center shrink-0 border border-border/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                    <span className="text-[8px] font-black leading-none mb-1 opacity-50">{doc.gestion}</span>
                                                                    <Hash className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs font-black tracking-tight">{doc.cite}</span>
                                                                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-1">
                                                                            <Building2 className="w-2.5 h-2.5" /> {deptSigla}
                                                                        </span>
                                                                    </div>
                                                                    {doc.hr && (
                                                                        <div className="flex items-center gap-1.5 mb-1">
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">HR:</span>
                                                                            <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">{doc.hr}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                                                        <span className="text-[10px] font-bold text-muted-foreground">
                                                                            {new Date(doc.createdAt).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="space-y-1.5">
                                                                <p className="text-sm font-bold text-foreground leading-tight">{doc.referencia}</p>
                                                                <div className="flex flex-col gap-1 text-[10px] font-medium text-muted-foreground pt-0.5">
                                                                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                                                        <User className="w-3 h-3 text-emerald-500 shrink-0" />
                                                                        <span>Creador: {remitenteNombre || 'N/A'}</span>
                                                                    </div>
                                                                    {ultimoSeguimiento?.usuario && (
                                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                            <User className="w-3 h-3 text-primary shrink-0" />
                                                                            <span>Último: {ultimoSeguimiento.usuario.nombre} {ultimoSeguimiento.usuario.apellidos}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col gap-2">
                                                                <span className={cn(
                                                                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border',
                                                                    ESTADO_LABELS[doc.estado]?.color ?? 'bg-muted text-muted-foreground border-border'
                                                                )}>
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                                    {ESTADO_LABELS[doc.estado]?.label ?? doc.estado}
                                                                </span>

                                                                {doc.diasMora > 0 && tab === 'recibidos' && (
                                                                    <span className={cn(
                                                                        "text-[8px] font-black uppercase tracking-widest flex items-center gap-1",
                                                                        doc.nivelAlerta === 'CRITICO' ? "text-red-600 animate-pulse" :
                                                                            doc.nivelAlerta === 'MORA' ? "text-orange-600" : "text-muted-foreground"
                                                                    )}>
                                                                        <Clock className="w-2.5 h-2.5" />
                                                                        {doc.diasMora} Días en Custodia {doc.alerta && <ShieldAlert className="w-3 h-3 text-red-500 inline ml-0.5" />}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Link href={`/dashboard/correspondencia/seguimiento?cite=${encodeURIComponent(doc.cite)}`}
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-sm">
                                                                    <FileText className="w-4 h-4" />
                                                                </Link>
                                                                <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                                    <ChevronRight className={cn('w-4 h-4 transition-transform', selected?.id === doc.id && 'rotate-90')} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* SECCIÓN 2: HISTORIAL DE AUDITORÍA (COR_SEGUIMIENTO & SEGUIMIENTO_ID) */}
            {tab === 'historial' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* KPIs por Departamento */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Movimientos Totales</span>
                                <Activity className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-3xl font-black">{historialFiltrado.length}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground mt-1">Registros en cor_seguimiento</p>
                        </div>

                        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hojas de Ruta Creadas</span>
                                <FileUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h3 className="text-3xl font-black">
                                {historialFiltrado.filter(i => i.accion === 'CREACION').length}
                            </h3>
                            <p className="text-[10px] font-bold text-emerald-600 mt-1">Nuevos trámites registrados</p>
                        </div>

                        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Derivaciones Inter-Departamento</span>
                                <ArrowUpRight className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="text-3xl font-black">
                                {historialFiltrado.filter(i => i.accion === 'DERIVACION' || i.accion === 'ENVIO').length}
                            </h3>
                            <p className="text-[10px] font-bold text-amber-600 mt-1">Transferencias de custodia</p>
                        </div>

                        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Finalizados / Archivados</span>
                                <Archive className="w-5 h-5 text-blue-500" />
                            </div>
                            <h3 className="text-3xl font-black">
                                {historialFiltrado.filter(i => i.accion === 'ARCHIVADO').length}
                            </h3>
                            <p className="text-[10px] font-bold text-blue-600 mt-1">Trámites concluidos</p>
                        </div>
                    </div>

                    {/* Toolbar de Filtros para Historial */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border/60 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input type="text" value={historialSearch} onChange={e => setHistorialSearch(e.target.value)}
                                placeholder="Buscar por seguimiento_id, CITE, HR, funcionario o detalle..."
                                className="w-full h-11 pl-11 pr-4 rounded-2xl bg-muted/40 border border-border text-xs font-bold outline-none focus:border-primary" />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Filtro por Acción */}
                            <select value={historialAccionFilter} onChange={e => setHistorialAccionFilter(e.target.value)}
                                className="h-11 px-4 rounded-2xl bg-muted/40 border border-border font-black text-[10px] uppercase tracking-wider outline-none focus:border-primary cursor-pointer">
                                <option value="TODAS">Todas las Acciones</option>
                                <option value="CREACION">CREACIÓN</option>
                                <option value="ENVIO">ENVÍO</option>
                                <option value="RECEPCION">RECEPCIÓN</option>
                                <option value="DERIVACION">DERIVACIÓN</option>
                                <option value="DEVOLUCION">DEVOLUCIÓN</option>
                                <option value="ARCHIVADO">ARCHIVADO</option>
                            </select>

                            {/* Filtro por Departamento */}
                            <select value={selectedDeptFilter} onChange={e => setSelectedDeptFilter(e.target.value)}
                                className="h-11 px-4 rounded-2xl bg-muted/40 border border-border font-black text-[10px] uppercase tracking-wider outline-none focus:border-primary cursor-pointer">
                                {DEPARTAMENTOS_LIST.map(d => (
                                    <option key={d.id} value={d.id}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Timeline de Seguimiento Auditable cor_seguimiento */}
                    <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-xl">
                        {loadingHistorial ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Cargando Historial de cor_seguimiento...</p>
                            </div>
                        ) : historialFiltrado.length === 0 ? (
                            <div className="text-center py-20">
                                <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                <h3 className="text-lg font-black text-muted-foreground">Sin registros de auditoría para este filtro</h3>
                            </div>
                        ) : (
                            <div className="relative border-l-2 border-primary/20 ml-6 space-y-8 pl-8">
                                {historialFiltrado.map((item: CorHistorialItem) => {
                                    const origenSigla = item.docTenant?.abreviacion || 'NAC';
                                    const destSigla = item.destTenant?.abreviacion || 'EXT';

                                    return (
                                        <div key={item.id} className="relative group">
                                            {/* Indicador de Nodo en Timeline */}
                                            <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-card border-4 border-primary shadow-md flex items-center justify-center" />

                                            <div className="bg-muted/30 border border-border/60 rounded-3xl p-6 hover:border-primary/40 transition-all shadow-sm">
                                                {/* Header del Registro de Auditoría */}
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* departamento origen */}
                                                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-black text-[10px] uppercase border border-primary/20 flex items-center gap-1">
                                                            <Building2 className="w-3 h-3" /> {origenSigla}
                                                        </span>
                                                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {/* departamento destino */}
                                                        <span className="px-3 py-1 rounded-full bg-accent text-foreground font-black text-[10px] uppercase border border-border flex items-center gap-1">
                                                            <Building2 className="w-3 h-3 text-muted-foreground" /> {destSigla}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-muted-foreground ml-2 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> {new Date(item.fecha).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {/* Badge de seguimiento_id */}
                                                        <button onClick={() => copyToClipboard(item.id, 'seguimiento_id')}
                                                            title="Haz clic para copiar seguimiento_id"
                                                            className="px-2.5 py-1 rounded-lg bg-card border border-border/80 text-muted-foreground hover:text-primary hover:border-primary/50 text-[9px] font-mono font-bold transition-all flex items-center gap-1">
                                                            <Hash className="w-3 h-3 text-primary" />
                                                            <span className="truncate max-w-[120px]">id: {item.id.slice(0, 8)}...</span>
                                                            <Copy className="w-2.5 h-2.5 opacity-60" />
                                                        </button>

                                                        {/* Badge de Acción */}
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                            item.accion === 'CREACION' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                                item.accion === 'RECEPCION' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                                    item.accion === 'DERIVACION' ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                                                                        item.accion === 'DEVOLUCION' ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                                                                            "bg-accent text-muted-foreground border-border"
                                                        )}>
                                                            {item.accion}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Detalle del Trámite y Funcionario */}
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-border/30 pt-4">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                            <FileText className="w-3 h-3" /> Documento & HR
                                                        </p>
                                                        <p className="text-xs font-black text-primary mt-0.5">{item.documento?.cite}</p>
                                                        {item.documento?.hr && (
                                                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono text-[9px] font-bold border border-emerald-500/20">
                                                                HR: {item.documento.hr}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                            <User className="w-3 h-3 text-emerald-500" /> Creador Original
                                                        </p>
                                                        <p className="text-xs font-bold mt-0.5 text-foreground">
                                                            {item.documento?.creador ? `${item.documento.creador.nombre} ${item.documento.creador.apellidos}` : 'Remitente N/A'}
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">
                                                            {item.documento?.creador?.cargoStr || 'Elaborador del CITE'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                            <User className="w-3 h-3 text-primary" /> Ejecutado por
                                                        </p>
                                                        <p className="text-xs font-bold mt-0.5">{item.usuario?.nombre} {item.usuario?.apellidos}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">{item.usuario?.cargoStr || 'Funcionario'}</p>

                                                        {item.destinatario && (
                                                            <div className="mt-2 pt-1.5 border-t border-border/40">
                                                                <p className="text-[9px] font-black uppercase text-primary flex items-center gap-1">
                                                                    <Send className="w-3 h-3 text-primary" /> Enviado a (Destinatario)
                                                                </p>
                                                                <p className="text-xs font-bold mt-0.5 text-foreground">{item.destinatario.nombre} {item.destinatario.apellidos}</p>
                                                                <p className="text-[9px] text-muted-foreground uppercase">{item.destinatario.cargoStr || 'Destinatario'}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                            <Activity className="w-3 h-3" /> Observaciones / Detalle
                                                        </p>
                                                        <p className="text-xs font-medium italic text-foreground/80 line-clamp-2 mt-0.5">
                                                            "{item.detalle || 'Sin observaciones'}"
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Adjunto PDF de Resguardo */}
                                                {item.archivoUrl && (
                                                    <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                                                        <span className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1.5">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Archivo PDF Adjunto en esta Acción
                                                        </span>
                                                        <a href={getImageUrl(item.archivoUrl)} target="_blank" rel="noreferrer"
                                                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5">
                                                            <Download className="w-3 h-3" /> Descargar PDF
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PANEL LATERAL DE CUSTODIA (SLIDE-OVER) */}
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
                        className="fixed top-0 right-0 bottom-0 w-full md:w-[450px] bg-card border-l border-border shadow-[0_0_50px_rgba(0,0,0,0.2)] z-[100] p-10 flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-xl font-black tracking-tight italic">Gestión de Custodia</h2>
                            <button onClick={() => setSelected(null)} className="w-12 h-12 rounded-2xl hover:bg-accent flex items-center justify-center transition-colors border border-border/50">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-8 overflow-y-auto pr-4">
                            <div className="p-6 rounded-3xl bg-muted/30 border border-border/50 space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Documento Seleccionado</p>
                                    <h3 className="text-lg font-black tracking-tighter leading-tight">{selected.cite}</h3>
                                    {selected.hr && (
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Hoja de Ruta:</span>
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black tracking-wide border border-emerald-500/20">{selected.hr}</span>
                                        </div>
                                    )}
                                    <p className="text-xs font-bold text-foreground/90 mt-2 line-clamp-2 italic">"{selected.referencia}"</p>
                                </div>

                                {/* Botón Directo: Ver Documento PDF / Detalle */}
                                {selected.archivoPdf ? (
                                    <a href={getImageUrl(selected.archivoPdf)} target="_blank" rel="noreferrer"
                                        className="w-full h-11 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                        <FileText className="w-4 h-4" /> Ver Documento PDF
                                    </a>
                                ) : (
                                    <Link href={`/dashboard/correspondencia/seguimiento?cite=${encodeURIComponent(selected.cite)}`}
                                        className="w-full h-11 rounded-xl bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm">
                                        <FileText className="w-4 h-4" /> Ver Detalle Documento
                                    </Link>
                                )}

                                <div className="space-y-3 pt-2 border-t border-border/40">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-muted-foreground">Estado Actual:</span>
                                        <span className="text-primary">{ESTADO_LABELS[selected.estado]?.label}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-muted-foreground">Tu Rol:</span>
                                        <span className="uppercase">{selected.participantes.find(p => p.userId === user?.id)?.rol}</span>
                                    </div>

                                    {selected.tenantInfo && (
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-muted-foreground">Departamento:</span>
                                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase border border-primary/20 flex items-center gap-1">
                                                <Building2 className="w-2.5 h-2.5" /> {selected.tenantInfo.nombre} ({selected.tenantInfo.abreviacion})
                                            </span>
                                        </div>
                                    )}

                                    {selected.estado === 'DEVUELTO' && selected.seguimientos?.[0] && (
                                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 my-3 animate-in zoom-in-95 duration-300">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertCircle className="w-4 h-4 text-red-600" />
                                                <span className="text-[10px] font-black uppercase text-red-600 tracking-widest">Documento Devuelto / Observado</span>
                                            </div>
                                            <p className="text-[11px] font-bold text-foreground">
                                                Devuelto por: {selected.seguimientos[0].usuario.nombre} {selected.seguimientos[0].usuario.apellidos}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Acciones de Gestión Legal
                                </p>
                                {renderActions(selected)}
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-border flex flex-col gap-2">
                            <Link href={`/dashboard/correspondencia/seguimiento?cite=${encodeURIComponent(selected.hr || selected.cite)}`}
                                className="w-full h-14 rounded-2xl border border-border font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-accent transition-all">
                                Ver Historial Completo <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
