'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Inbox, Search, FileText, Clock, 
    ArrowUpRight, CheckCircle2, Calendar,
    User, RefreshCw, ChevronRight, Loader2, AlertCircle,
    Send, Archive, Hash, X, ShieldCheck, Download, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    obtenerBandeja,
    avanzarEstado,
    buscarUsuarios,
    ESTADO_LABELS,
    type CorDocumento,
    type CorUsuario
} from '@/services/correspondencia.service';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { uploadService } from '@/services/uploadService';
import api from '@/lib/api';

const TABS = [
    { id: 'recibidos', label: 'Recibidos', icon: Inbox },
    { id: 'enviados', label: 'Enviados', icon: Send },
    { id: 'enProceso', label: 'Borradores', icon: Clock },
    { id: 'archivados', label: 'Archivados', icon: Archive },
] as const;

export default function BandejaPage() {
    const { user } = useAuth();
    const [tab, setTab] = useState<typeof TABS[number]['id']>('recibidos');
    const [bandeja, setBandeja] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<CorDocumento | null>(null);
    const [avanzando, setAvanzando] = useState(false);

    // Estados para Derivación Dinámica
    const [accionSeleccionada, setAccionSeleccionada] = useState<string | null>(null);
    const [nuevoDest, setNuevoDest] = useState<any>(null);
    const [archivoUrl, setArchivoUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [detalle, setDetalle] = useState('');

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

    useEffect(() => { fetchBandeja(); }, [fetchBandeja]);

    const docs = bandeja?.[tab] || [];
    const filtered = docs.filter((doc: any) => {
        const matchSearch = !search || [doc.cite, doc.referencia]
            .some(s => s?.toLowerCase().includes(search.toLowerCase()));
        return matchSearch;
    });

    const handleAvanzar = async (doc: CorDocumento, accion: string) => {
        if (accion === 'DERIVACION' && !nuevoDest) {
            toast.error('Debe seleccionar a quién derivar el trámite');
            return;
        }
        setAvanzando(true);
        try {
            await avanzarEstado(
                doc.id, 
                accion, 
                detalle || `Acción "${accion}" registrada desde la bandeja.`,
                archivoUrl || undefined,
                nuevoDest?.id || undefined
            );
            toast.success(`Documento actualizado: ${accion}`);
            setNuevoDest(null);
            setArchivoUrl(null);
            setDetalle('');
            await fetchBandeja();
            setSelected(null);
        } catch (err: any) {
            toast.error(err?.message ?? 'Error al avanzar estado');
        } finally {
            setAvanzando(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validación Senior 5MB
        if (file.size > 5 * 1024 * 1024) {
            toast.error('El archivo excede el límite de 5MB');
            return;
        }

        setUploading(true);
        try {
            const res = await uploadService.uploadFile(file, 'correspondencia');
            // Construir URL absoluta
            const baseUrl = api.defaults.baseURL?.replace(/\/$/, '') || '';
            const path = res.data.path.replace(/^\//, '').replace(/\\/g, '/');
            setArchivoUrl(`${baseUrl}/${path}`);
            toast.success('Archivo adjunto listo');
        } catch (err) {
            toast.error('Fallo al subir archivo');
        } finally {
            setUploading(false);
        }
    };

    // Lógica Senior de Custodia: ¿Qué puede hacer el usuario actual?
    const renderActions = (doc: CorDocumento) => {
        const miParticipacion = doc.participantes.find(p => p.userId === user?.id);
        const rol = miParticipacion?.rol;
        
        if (accionSeleccionada) {
            return (
                <div className="space-y-6 mt-4 p-6 rounded-[2rem] bg-accent/30 border border-accent/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Confirmar {accionSeleccionada}</span>
                        <button onClick={() => { setAccionSeleccionada(null); setNuevoDest(null); setArchivoUrl(null); }} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {accionSeleccionada === 'DERIVACION' && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">¿A quién derivar?</p>
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
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Detalle / Instrucción</p>
                        <textarea value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Escriba el detalle de la acción..."
                            className="w-full h-24 rounded-xl bg-card border border-border p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all" />
                    </div>

                    <button disabled={avanzando || uploading} onClick={() => handleAvanzar(doc, accionSeleccionada)}
                        className="w-full h-14 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        {avanzando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Confirmar Acción
                    </button>
                </div>
            );
        }

        const actions = [];
        
        // El REMITENTE solo puede enviar si está en ELABORACION
        if (doc.estado === 'ELABORACION' && rol === 'REMITENTE') {
            actions.push({ accion: 'ENVIO', label: 'Enviar Oficialmente', color: 'bg-primary text-white shadow-primary/20' });
        }
        
        // DESTINATARIOS y VIAS solo pueden recibir si está ENVIADO
        if (doc.estado === 'ENVIADO' && (rol === 'DESTINATARIO' || rol === 'VIA')) {
            actions.push({ accion: 'RECEPCION', label: 'Confirmar Recepción', color: 'bg-emerald-500 text-white shadow-emerald-500/20' });
        }
        
        // Una vez RECIBIDO, pueden derivar o archivar
        if (doc.estado === 'RECIBIDO' && (rol === 'DESTINATARIO' || rol === 'VIA')) {
            actions.push({ accion: 'DERIVACION', label: 'Derivar / Tramitar', color: 'bg-purple-500 text-white shadow-purple-500/20' });
            actions.push({ accion: 'ARCHIVADO', label: 'Finalizar y Archivar', color: 'bg-muted text-muted-foreground' });
        }

        if (actions.length === 0) return (
            <div className="flex flex-col items-center gap-3 p-6 bg-muted/20 rounded-3xl border border-dashed border-border/50">
                <AlertCircle className="w-6 h-6 text-muted-foreground opacity-40" />
                <p className="text-[10px] font-bold text-muted-foreground italic text-center uppercase tracking-widest leading-relaxed">
                    No tienes la custodia actual para realizar acciones.<br/>El documento está en trámite en otra oficina.
                </p>
            </div>
        );

        return (
            <div className="space-y-3 mt-4">
                {actions.map(btn => (
                    <button key={btn.accion} disabled={avanzando}
                        onClick={() => setAccionSeleccionada(btn.accion)}
                        className={cn('w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2', btn.color)}>
                        {btn.label}
                    </button>
                ))}
            </div>
        );
    };

    // Sub-componente de Búsqueda de Usuarios Inline
    const UserSearchInline = ({ onSelect, selected }: any) => {
        const [q, setQ] = useState('');
        const [results, setResults] = useState<CorUsuario[]>([]);
        const [open, setOpen] = useState(false);
        
        const search = async (val: string) => {
            if (!val.trim()) { setResults([]); return; }
            const data = await buscarUsuarios(val);
            setResults(data);
            setOpen(true);
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

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                        <Inbox className="w-8 h-8 text-primary" />
                        Bandeja de Gestión
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2">
                        Sistema Centralizado de Correspondencia Institucional.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchBandeja} disabled={loading}
                        className="w-12 h-12 rounded-xl border border-border hover:bg-accent flex items-center justify-center transition-all">
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-primary')} />
                    </button>
                    <Link href="/dashboard/correspondencia/nuevo"
                        className="px-6 h-12 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                        <ArrowUpRight className="w-4 h-4" /> Nuevo Documento
                    </Link>
                </div>
            </div>

            {/* Tabs + Search */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                <div className="flex flex-wrap items-center gap-2 bg-card/50 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
                            className={cn('px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2',
                                tab === t.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-accent')}>
                            <t.icon className="w-3.5 h-3.5" />
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por CITE, referencia o asunto..."
                        className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold text-sm transition-all" />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-bold text-sm">{error}</p>
                </div>
            )}

            {/* Table */}
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
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Identificación</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Referencia y Custodia</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estado</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filtered.map((doc: any) => {
                                    const miParticipacion = doc.participantes.find((p: any) => p.userId === user?.id);
                                    const ultimoSeguimiento = doc.seguimientos?.[0];

                                    return (
                                        <motion.tr key={doc.id}
                                            whileHover={{ backgroundColor: 'rgba(var(--primary-rgb), 0.02)' }}
                                            className={cn("group cursor-pointer transition-colors", selected?.id === doc.id && "bg-primary/5")}
                                            onClick={() => setSelected(selected?.id === doc.id ? null : doc)}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-muted flex flex-col items-center justify-center shrink-0 border border-border/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <span className="text-[8px] font-black leading-none mb-1 opacity-50">{doc.gestion}</span>
                                                        <Hash className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-black tracking-tight">{doc.cite}</span>
                                                        </div>
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
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-foreground leading-tight">{doc.referencia}</p>
                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                                                        <User className="w-3 h-3" />
                                                        <span>Último: {ultimoSeguimiento?.usuario?.nombre} {ultimoSeguimiento?.usuario?.apellidos}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border',
                                                    ESTADO_LABELS[doc.estado]?.color ?? 'bg-muted text-muted-foreground border-border'
                                                )}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                    {ESTADO_LABELS[doc.estado]?.label ?? doc.estado}
                                                </span>
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

            {/* Panel de Custodia Dinámico */}
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
                            <div className="p-6 rounded-3xl bg-muted/30 border border-border/50">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Documento Seleccionado</p>
                                <h3 className="text-lg font-black tracking-tighter leading-tight mb-4">{selected.cite}</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-muted-foreground">Estado Actual:</span>
                                        <span className="text-primary">{ESTADO_LABELS[selected.estado]?.label}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-muted-foreground">Tu Rol:</span>
                                        <span className="uppercase">{selected.participantes.find(p => p.userId === user?.id)?.rol}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Acciones de Gestión Legal
                                </p>
                                {renderActions(selected)}
                            </div>

                            {selected.archivoPdf && (
                                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Resguardo Digital</p>
                                    <a href={selected.archivoPdf} target="_blank" rel="noreferrer"
                                        className="w-full h-12 rounded-xl bg-white border border-primary/20 flex items-center justify-center gap-3 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all shadow-sm">
                                        <Download className="w-4 h-4" /> Ver PDF Escaneado
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-8 border-t border-border">
                            <Link href={`/dashboard/correspondencia/seguimiento?cite=${encodeURIComponent(selected.cite)}`}
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
