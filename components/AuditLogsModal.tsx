'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from '@/components/Modal';
import api from '@/lib/api';
import {
    Search, ChevronDown, ChevronUp, Terminal, Globe, User, Clock,
    Activity, ShieldAlert, CheckCircle2, RotateCw, Filter,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PAGE_SIZE = 50;

export function AuditLogsModal({ isOpen, onClose }: AuditLogsModalProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedAction, setSelectedAction] = useState<string>('ALL');
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchLogs = useCallback(async (opts: {
        action?: string; search?: string; page?: number;
    } = {}) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (opts.action && opts.action !== 'ALL') params.set('action', opts.action);
            if (opts.search) params.set('search', opts.search);
            params.set('page', String(opts.page ?? 1));
            params.set('limit', String(PAGE_SIZE));

            const { data } = await api.get(`/audit-logs?${params.toString()}`);
            // Support both old (array) and new (paginated) response shapes
            if (Array.isArray(data)) {
                setLogs(data);
                setTotal(data.length);
            } else {
                setLogs(data.data ?? []);
                setTotal(data.total ?? 0);
            }
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on open / page / action change (immediate)
    useEffect(() => {
        if (!isOpen) return;
        fetchLogs({ action: selectedAction, search, page });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selectedAction, page]);

    // Debounce search input (500 ms) — resets to page 1
    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            fetchLogs({ action: selectedAction, search: value, page: 1 });
        }, 500);
    };

    const handleActionChange = (action: string) => {
        setSelectedAction(action);
        setPage(1);
        setExpandedLogId(null);
    };

    const toggleExpand = (id: string) => {
        setExpandedLogId(expandedLogId === id ? null : id);
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const getActionBadgeColor = (action: string) => {
        switch (action.toUpperCase()) {
            case 'CREATE':
                return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-400';
            case 'UPDATE':
                return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-400';
            case 'DELETE':
                return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-400';
            default:
                return 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:bg-violet-500/5 dark:text-violet-400';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Historial de Auditoría Global" size="xl">
            <div className="space-y-5 pt-2">
                {/* Filters row */}
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar recurso, ID, usuario..."
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-xs font-bold uppercase tracking-wider placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 rounded-xl border border-border/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            <Filter className="w-3.5 h-3.5" />
                            Acción:
                        </div>
                        {['ALL', 'CREATE', 'UPDATE', 'DELETE'].map((action) => (
                            <button
                                key={action}
                                onClick={() => handleActionChange(action)}
                                className={cn(
                                    'px-3.5 h-9 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all',
                                    selectedAction === action
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                        : 'bg-card border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/20'
                                )}
                            >
                                {action === 'ALL' ? 'Todos' : action}
                            </button>
                        ))}

                        <button
                            onClick={() => fetchLogs({ action: selectedAction, search, page })}
                            disabled={loading}
                            className="p-2.5 rounded-xl border border-border/40 bg-card text-muted-foreground hover:text-foreground hover:border-primary/20 active:scale-95 transition-all ml-auto md:ml-2 disabled:opacity-50"
                            title="Recargar logs"
                        >
                            <RotateCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                        </button>
                    </div>
                </div>

                {/* Count badge */}
                {!loading && (
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {total.toLocaleString()} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                        {totalPages > 1 && ` · Página ${page} de ${totalPages}`}
                    </p>
                )}

                {/* Table */}
                <div className="border border-border/40 rounded-2xl bg-card overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-primary/25 border-t-primary rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Cargando registros...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-primary mb-4">
                                <Activity className="w-8 h-8" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-wider text-foreground">Sin registros</h4>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1">
                                No se encontraron registros que coincidan con los filtros aplicados.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {/* Table header */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 bg-muted/20 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40">
                                <div className="col-span-2">Fecha y Hora</div>
                                <div className="col-span-2">Acción</div>
                                <div className="col-span-3">Recurso</div>
                                <div className="col-span-3">Usuario</div>
                                <div className="col-span-2 text-right">Detalles</div>
                            </div>

                            {logs.map((log) => {
                                const isExpanded = expandedLogId === log.id;
                                const formattedDate = new Date(log.timestamp).toLocaleString('es-ES', {
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                                });
                                const userFullName = log.user
                                    ? `${log.user.nombre} ${log.user.apellidos}`
                                    : 'Sistema / Servidor';

                                return (
                                    <div key={log.id} className="transition-colors hover:bg-muted/10">
                                        {/* Main row */}
                                        <div
                                            onClick={() => toggleExpand(log.id)}
                                            className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-center text-xs cursor-pointer select-none"
                                        >
                                            <div className="col-span-2 flex lg:block items-center gap-2">
                                                <span className="lg:hidden text-[9px] font-black uppercase tracking-widest text-muted-foreground min-w-[70px]">Fecha:</span>
                                                <div className="flex items-center gap-2 text-muted-foreground font-bold">
                                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                                    {formattedDate}
                                                </div>
                                            </div>

                                            <div className="col-span-2 flex lg:block items-center gap-2">
                                                <span className="lg:hidden text-[9px] font-black uppercase tracking-widest text-muted-foreground min-w-[70px]">Acción:</span>
                                                <span className={cn(
                                                    'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0',
                                                    getActionBadgeColor(log.action)
                                                )}>
                                                    {log.action}
                                                </span>
                                            </div>

                                            <div className="col-span-3 flex lg:block items-center gap-2">
                                                <span className="lg:hidden text-[9px] font-black uppercase tracking-widest text-muted-foreground min-w-[70px]">Recurso:</span>
                                                <div className="min-w-0">
                                                    <span className="font-black text-foreground uppercase tracking-wider">{log.resource}</span>
                                                    {log.resourceId && (
                                                        <span className="block text-[9px] font-bold text-muted-foreground/75 truncate" title={log.resourceId}>
                                                            ID: {log.resourceId}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-span-3 flex lg:block items-center gap-2">
                                                <span className="lg:hidden text-[9px] font-black uppercase tracking-widest text-muted-foreground min-w-[70px]">Usuario:</span>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="p-1.5 bg-muted rounded-lg text-muted-foreground shrink-0">
                                                        <User className="w-3 h-3" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-foreground truncate">{userFullName}</p>
                                                        {log.user?.ci && (
                                                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                                                CI: {log.user.ci}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-2 flex lg:block items-center justify-end">
                                                <button className="p-1.5 rounded-lg border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded detail — no AnimatePresence, plain conditional render */}
                                        {isExpanded && (
                                            <div className="overflow-hidden bg-muted/20 border-t border-border/30 px-6 py-5 space-y-4 text-xs">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2 p-4 rounded-xl border border-border/40 bg-card/60 shadow-sm">
                                                        <h5 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
                                                            <Globe className="w-3.5 h-3.5" />
                                                            Origen de la Conexión
                                                        </h5>
                                                        <p className="font-bold text-foreground">IP: <span className="font-normal text-muted-foreground">{log.ip || 'Local / Desconocido'}</span></p>
                                                        <p className="font-bold text-foreground leading-relaxed">Navegador: <span className="font-normal text-muted-foreground">{log.userAgent || 'Desconocido'}</span></p>
                                                    </div>

                                                    <div className="space-y-2 p-4 rounded-xl border border-border/40 bg-card/60 shadow-sm">
                                                        <h5 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
                                                            <Terminal className="w-3.5 h-3.5" />
                                                            Llamada del Sistema
                                                        </h5>
                                                        <p className="font-bold text-foreground">Endpoint: <span className="font-mono text-[10px] text-primary">{log.details?.method} {log.details?.url}</span></p>
                                                        <p className="font-bold text-foreground">Controlador: <span className="font-normal text-muted-foreground">{log.details?.handler || 'Desconocido'}</span></p>
                                                        <p className="font-bold text-foreground flex items-center gap-2">
                                                            Estado:
                                                            <span className={cn(
                                                                'inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border',
                                                                log.details?.status === 'SUCCESS'
                                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                            )}>
                                                                {log.details?.status === 'SUCCESS' ? (
                                                                    <><CheckCircle2 className="w-3 h-3 text-emerald-500" />Completado</>
                                                                ) : (
                                                                    <><ShieldAlert className="w-3 h-3 text-rose-500" />Error</>
                                                                )}
                                                            </span>
                                                        </p>
                                                        {log.details?.errorMessage && (
                                                            <p className="text-rose-500 font-bold">Mensaje de error: <span className="font-normal">{log.details.errorMessage}</span></p>
                                                        )}
                                                    </div>
                                                </div>

                                                {log.details?.body && Object.keys(log.details.body).length > 0 && (
                                                    <div className="space-y-1.5">
                                                        <h5 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Payload de Datos (Body):</h5>
                                                        <div className="p-4 rounded-xl border border-border/40 bg-card font-mono text-[10px] text-foreground/90 overflow-x-auto shadow-sm max-h-48 overflow-y-auto">
                                                            <pre>{JSON.stringify(log.details.body, null, 2)}</pre>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            className="flex items-center gap-2 px-4 h-9 rounded-xl border border-border/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/20 disabled:opacity-40 transition-all"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Anterior
                        </button>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                            className="flex items-center gap-2 px-4 h-9 rounded-xl border border-border/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/20 disabled:opacity-40 transition-all"
                        >
                            Siguiente
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
