'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import api from '@/lib/api';
import {
    Search, ChevronDown, ChevronUp, Terminal, Globe, User, Clock,
    Activity, ShieldAlert, CheckCircle2, RotateCw, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AuditLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuditLogsModal({ isOpen, onClose }: AuditLogsModalProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedAction, setSelectedAction] = useState<string>('ALL');
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/audit-logs');
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching audit logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    const toggleExpand = (id: string) => {
        setExpandedLogId(expandedLogId === id ? null : id);
    };

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

    const filteredLogs = logs.filter((log) => {
        const matchesAction = selectedAction === 'ALL' || log.action.toUpperCase() === selectedAction;
        const searchLower = search.toLowerCase();
        
        const matchesSearch = 
            log.resource.toLowerCase().includes(searchLower) ||
            (log.resourceId && log.resourceId.toLowerCase().includes(searchLower)) ||
            (log.user && (
                log.user.nombre.toLowerCase().includes(searchLower) ||
                log.user.apellidos.toLowerCase().includes(searchLower) ||
                log.user.correo.toLowerCase().includes(searchLower) ||
                (log.user.ci && log.user.ci.toLowerCase().includes(searchLower))
            ));
            
        return matchesAction && matchesSearch;
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Historial de Auditoría Global" size="xl">
            <div className="space-y-6 pt-2">
                {/* Cabecera de filtros */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por recurso, ID, usuario o CI..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
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
                                onClick={() => setSelectedAction(action)}
                                className={cn(
                                    "px-3.5 h-9 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all",
                                    selectedAction === action
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                        : "bg-card border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/20"
                                )}
                            >
                                {action === 'ALL' ? 'Todos' : action}
                            </button>
                        ))}
                        
                        <button
                            onClick={fetchLogs}
                            disabled={loading}
                            className="p-2.5 rounded-xl border border-border/40 bg-card text-muted-foreground hover:text-foreground hover:border-primary/20 active:scale-95 transition-all ml-auto md:ml-2 disabled:opacity-50"
                            title="Recargar logs"
                        >
                            <RotateCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </button>
                    </div>
                </div>

                {/* Contenido / Listado */}
                <div className="border border-border/40 rounded-2xl bg-card overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-primary/25 border-t-primary rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Cargando registros de auditoría...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-primary mb-4">
                                <Activity className="w-8 h-8" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-wider text-foreground">Sin registros</h4>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1">
                                No se encontraron registros de auditoría que coincidan con la búsqueda o filtros aplicados.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {/* Header de tabla virtual */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 bg-muted/20 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40">
                                <div className="col-span-2">Fecha y Hora</div>
                                <div className="col-span-2">Acción</div>
                                <div className="col-span-3">Recurso</div>
                                <div className="col-span-3">Usuario Autor</div>
                                <div className="col-span-2 text-right">Detalles</div>
                            </div>

                            {filteredLogs.map((log) => {
                                const isExpanded = expandedLogId === log.id;
                                const formattedDate = new Date(log.timestamp).toLocaleString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                });
                                const userFullName = log.user 
                                    ? `${log.user.nombre} ${log.user.apellidos}`
                                    : 'Sistema / Servidor';

                                return (
                                    <div key={log.id} className="transition-colors hover:bg-muted/10">
                                        {/* Fila principal */}
                                        <div 
                                            onClick={() => toggleExpand(log.id)}
                                            className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-center text-xs cursor-pointer select-none"
                                        >
                                            {/* Celda: Fecha */}
                                            <div className="col-span-2 flex lg:block items-center gap-2">
                                                <span className="lg:hidden text-[9px] font-black uppercase tracking-widest text-muted-foreground min-w-[70px]">Fecha:</span>
                                                <div className="flex items-center gap-2 text-muted-foreground font-bold">
                                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                                    {formattedDate}
                                                </div>
                                            </div>

                                            {/* Celda: Acción */}
                                            <div className="col-span-2 flex lg:block items-center gap-2">
                                                <span className="lg:hidden text-[9px] font-black uppercase tracking-widest text-muted-foreground min-w-[70px]">Acción:</span>
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0",
                                                    getActionBadgeColor(log.action)
                                                )}>
                                                    {log.action}
                                                </span>
                                            </div>

                                            {/* Celda: Recurso */}
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

                                            {/* Celda: Usuario */}
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

                                            {/* Botón expandir */}
                                            <div className="col-span-2 flex lg:block items-center justify-end">
                                                <button className="p-1.5 rounded-lg border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Fila expandida */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden bg-muted/20 border-t border-border/30"
                                                >
                                                    <div className="px-6 py-5 space-y-4 text-xs">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* Información de red */}
                                                            <div className="space-y-2 p-4 rounded-xl border border-border/40 bg-card/60 shadow-sm">
                                                                <h5 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
                                                                    <Globe className="w-3.5 h-3.5" />
                                                                    Origen de la Conexión
                                                                </h5>
                                                                <p className="font-bold text-foreground">IP: <span className="font-normal text-muted-foreground">{log.ip || 'Local / Desconocido'}</span></p>
                                                                <p className="font-bold text-foreground leading-relaxed">Navegador: <span className="font-normal text-muted-foreground">{log.userAgent || 'Desconocido'}</span></p>
                                                            </div>

                                                            {/* Detalles del endpoint */}
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
                                                                        "inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                                                                        log.details?.status === 'SUCCESS' 
                                                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                                                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                                    )}>
                                                                        {log.details?.status === 'SUCCESS' ? (
                                                                            <>
                                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                                                Completado
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <ShieldAlert className="w-3 h-3 text-rose-500" />
                                                                                Error
                                                                            </>
                                                                        )}
                                                                    </span>
                                                                </p>
                                                                {log.details?.errorMessage && (
                                                                    <p className="text-rose-500 font-bold">Mensaje de error: <span className="font-normal">{log.details.errorMessage}</span></p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Parámetros de petición (JSON) */}
                                                        {log.details?.body && Object.keys(log.details.body).length > 0 && (
                                                            <div className="space-y-1.5">
                                                                <h5 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Payload de Datos (Body):</h5>
                                                                <div className="p-4 rounded-xl border border-border/40 bg-card font-mono text-[10px] text-foreground/90 overflow-x-auto shadow-sm">
                                                                    <pre>{JSON.stringify(log.details.body, null, 2)}</pre>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
