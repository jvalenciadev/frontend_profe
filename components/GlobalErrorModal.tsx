'use client';

import { useState, useEffect } from 'react';
import { errorStore } from '@/lib/error-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    X,
    ShieldAlert,
    Database,
    Globe,
    Clock,
    ChevronRight,
    Lock,
    Search,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function GlobalErrorModal() {
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        return errorStore.subscribe((err) => {
            setError(err);
        });
    }, []);

    if (!error) return null;

    const getStatusConfig = (code: number) => {
        switch (code) {
            case 400: return {
                icon: AlertCircle,
                color: 'text-amber-500',
                bg: 'bg-amber-500/10',
                title: 'Validación de Datos',
                desc: 'Bad Request',
                help: 'Verifique los campos obligatorios o el formato de la información enviada.'
            };
            case 401: return {
                icon: Lock,
                color: 'text-rose-500',
                bg: 'bg-rose-500/10',
                title: 'No Iniciaste Sesión',
                desc: 'Unauthorized',
                help: 'Su sesión ha expirado o no tiene acceso actualmente. Reingrese al sistema.'
            };
            case 403: return {
                icon: ShieldAlert,
                color: 'text-rose-600',
                bg: 'bg-rose-600/10',
                title: 'Acceso Restringido',
                desc: 'Forbidden',
                help: 'No tiene los permisos necesarios para realizar esta acción. Contacte a un administrador.'
            };
            case 404: return {
                icon: Search,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
                title: 'Recurso No Encontrado',
                desc: 'Not Found',
                help: 'Lo que busca no existe o el enlace es incorrecto.'
            };
            case 409: return {
                icon: AlertTriangle,
                color: 'text-orange-500',
                bg: 'bg-orange-500/10',
                title: 'Conflicto Lógico / Bloqueo',
                desc: 'Conflict',
                help: 'La acción choca con una regla del sistema (ej: registro duplicado o turno ocupado).'
            };
            case 500: return {
                icon: Database,
                color: 'text-red-600',
                bg: 'bg-red-600/10',
                title: 'Error Crítico de Código',
                desc: 'Internal Server Error',
                help: 'Algo se rompió en el servidor. El equipo técnico ha sido notificado.'
            };
            case 503: return {
                icon: Clock,
                color: 'text-purple-600',
                bg: 'bg-purple-600/10',
                title: 'Servidor en Mantenimiento',
                desc: 'Service Unavailable',
                help: 'El servidor está temporalmente sobrecargado o fuera de línea por mantenimiento.'
            };
            default: return {
                icon: AlertTriangle,
                color: 'text-gray-500',
                bg: 'bg-gray-500/10',
                title: 'Error de Procesamiento',
                desc: 'Unexpected Error',
                help: 'Ocurrió un error desconocido. Intente nuevamente en unos momentos.'
            };
        }
    };

    const config = getStatusConfig(error.statusCode);
    const Icon = config.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => errorStore.setError(null)}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-[2.5rem] overflow-hidden"
                >
                    {/* Header with status effect */}
                    <div className={cn("p-8 flex items-start gap-6 border-b border-border/50", config.bg)}>
                        <div className={cn("p-4 rounded-3xl bg-card shadow-xl", config.color)}>
                            <Icon className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", config.color)}>
                                    Status {error.statusCode} • {config.desc}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground uppercase italic underline decoration-4 decoration-primary/20 underline-offset-4">
                                {config.title}
                            </h2>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                                <p className="text-sm font-bold text-foreground leading-relaxed">
                                    {error.message || 'Ha ocurrido un error inesperado al procesar su solicitud.'}
                                </p>
                            </div>

                            {/* Technical Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
                                    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                        <Globe className="w-3 h-3" /> Endpoint
                                    </div>
                                    <p className="text-[10px] font-bold text-foreground truncate">{error.path}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
                                    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                        <Clock className="w-3 h-3" /> Timestamp
                                    </div>
                                    <p className="text-[10px] font-bold text-foreground">
                                        {new Date(error.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="col-span-2 p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-1">
                                    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-primary">
                                        <ShieldAlert className="w-3 h-3" /> Internal Error Code
                                    </div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                                        {error.errorCode || 'UNKNOWN_ERROR'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recommendation based on error */}
                        <div className="pt-4 flex items-center gap-3">
                            <div className="h-px flex-1 bg-border/50" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sugerencia</span>
                            <div className="h-px flex-1 bg-border/50" />
                        </div>

                        <p className="text-[10px] text-center text-muted-foreground font-medium italic">
                            {config.help}
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-muted/20 border-t border-border/50 flex gap-3">
                        <button
                            onClick={() => errorStore.setError(null)}
                            className="flex-1 h-14 rounded-2xl bg-foreground text-background font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            Entendido
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
