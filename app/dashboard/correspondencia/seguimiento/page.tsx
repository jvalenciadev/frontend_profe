'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, FileText, Clock, CheckCircle2, Calendar,
    X, AlertCircle, User, PenLine, Send, Inbox,
    CornerRightDown, MessageSquare, Archive, FolderOpen, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    buscarPorCite,
    ESTADO_LABELS,
    type CorDocumento,
    type CorParticipante,
} from '@/services/correspondencia.service';

const ACCION_ICONS: Record<string, React.ElementType> = {
    CREACION: PenLine,
    ENVIO: Send,
    RECEPCION: Inbox,
    DERIVACION: CornerRightDown,
    OBSERVACION: MessageSquare,
    ARCHIVADO: Archive,
};

function rolLabel(rol: string) {
    if (rol === 'DESTINATARIO') return 'Dirigido a';
    if (rol === 'VIA') return 'Vía';
    if (rol === 'REMITENTE') return 'De';
    return rol;
}

export default function SeguimientoPage() {
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CorDocumento | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const q = search.trim();
        if (!q) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const doc = await buscarPorCite(q);
            setResult(doc);
        } catch (err: any) {
            setError(err?.message ?? 'No se encontró el documento');
        } finally {
            setLoading(false);
        }
    }, [search]);

    const destinatarios = result?.participantes.filter(p => p.rol === 'DESTINATARIO') ?? [];
    const vias = result?.participantes.filter(p => p.rol === 'VIA') ?? [];
    const remitentes = result?.participantes.filter(p => p.rol === 'REMITENTE') ?? [];

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-card border border-border/50 p-8 md:p-12 shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Search className="w-64 h-64 rotate-12" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
                            Ecosistema PROFE
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                            Seguimiento de <span className="text-primary">Correspondencia</span>
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium max-w-lg leading-relaxed">
                            Ingrese el número de CITE para rastrear el estado y el historial completo de movimientos del documento.
                        </p>
                    </motion.div>

                    <motion.form
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        onSubmit={handleSearch} className="mt-10 flex flex-col md:flex-row gap-4"
                    >
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Ej: INF/PROFE Nro. 2/2026"
                                className="w-full h-16 pl-14 pr-6 rounded-2xl bg-background border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-lg"
                            />
                            {search && (
                                <button type="button" onClick={() => { setSearch(''); setResult(null); setError(null); }}
                                    className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button type="submit" disabled={loading || !search.trim()}
                            className="h-16 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50">
                            {loading ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                    <Clock className="w-5 h-5" />
                                </motion.div>
                            ) : (<><Search className="w-5 h-5" /><span>Rastrear</span></>)}
                        </button>
                    </motion.form>
                </div>
            </div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-4 p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-bold text-sm">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence mode="wait">
                {result && (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Info Card */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-xl">
                                <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Detalle del Documento
                                </h3>
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">CITE</p>
                                        <p className="text-xl font-black tracking-tight">{result.cite}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Referencia</p>
                                        <p className="text-sm font-bold italic leading-relaxed">"{result.referencia}"</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tipo</p>
                                            <span className="text-xs font-black uppercase">{result.tipo.replace('_', ' ')}</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Estado</p>
                                            <span className={cn(
                                                'inline-flex px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border',
                                                ESTADO_LABELS[result.estado]?.color ?? 'bg-muted text-muted-foreground border-border'
                                            )}>
                                                {ESTADO_LABELS[result.estado]?.label ?? result.estado}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Participantes */}
                                    <div className="pt-4 border-t border-border/50 space-y-3">
                                        {[{ label: 'Dirigido a', list: destinatarios }, { label: 'Vía', list: vias }, { label: 'De', list: remitentes }]
                                            .filter(g => g.list.length > 0)
                                            .map(group => (
                                                <div key={group.label}>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{group.label}</p>
                                                    {group.list.map((p: CorParticipante) => (
                                                        <div key={p.id} className="flex items-center gap-2">
                                                            <User className="w-3 h-3 text-primary/50" />
                                                            <span className="text-xs font-bold">{p.usuario.nombre} {p.usuario.apellidos}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="lg:col-span-2">
                            <div className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-xl">
                                <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Historial de Seguimiento
                                </h3>
                                <div className="relative pl-10 space-y-10">
                                    <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/40 to-border/20 ml-[15px]" />
                                    {result.seguimientos.map((seg, idx) => (
                                        <motion.div key={seg.id}
                                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.08 * idx }} className="relative">
                                            <div className="absolute -left-[43px] w-8 h-8 rounded-full border-4 border-card bg-primary text-white flex items-center justify-center z-10 shadow-lg shadow-primary/30">
                                                {React.createElement(ACCION_ICONS[seg.accion] ?? FolderOpen, { className: 'w-3.5 h-3.5' })}
                                            </div>
                                            <div className="p-6 rounded-2xl border border-border hover:border-primary/20 hover:shadow-lg bg-card transition-all group">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-primary/10 text-primary mb-2 inline-block">
                                                            {seg.accion}
                                                        </span>
                                                        <h4 className="text-base font-black">{seg.usuario.nombre} {seg.usuario.apellidos}</h4>
                                                        {seg.usuario.cargoStr && (
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{seg.usuario.cargoStr}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold bg-muted/50 px-3 py-1 rounded-full shrink-0">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(seg.fecha).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                {seg.detalle && (
                                                    <p className="text-sm text-muted-foreground leading-relaxed font-medium group-hover:text-foreground transition-colors">
                                                        {seg.detalle}
                                                    </p>
                                                )}
                                                {seg.archivoUrl && (
                                                    <div className="mt-4 pt-4 border-t border-border/50">
                                                        <a href={seg.archivoUrl} target="_blank" rel="noreferrer"
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">
                                                            <Download className="w-3.5 h-3.5" /> Ver Adjunto de esta etapa
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hint when empty */}
            {!result && !loading && !error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                    <div className="w-20 h-20 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/30 mx-auto mb-4">
                        <Search className="w-10 h-10" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">Ingrese un número de CITE para comenzar la búsqueda</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">Ejemplo: INF/PROFE Nro. 1/2026</p>
                </motion.div>
            )}
        </div>
    );
}
