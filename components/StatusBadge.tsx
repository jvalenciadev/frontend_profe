import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export type StatusType =
    | 'ACTIVO' | 'INACTIVO' | 'PENDIENTE'
    | 'APROBADO' | 'RECHAZADO' | 'BLOQUEADO'
    | 'ELIMINADO' | 'FINALIZADO' | 'CANCELADO'
    | 'OPERATIVO' | 'BAJA' | string;

interface StatusBadgeProps {
    status: StatusType;
    className?: string;
    showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showIcon = true }) => {
    const s = status?.toUpperCase() || 'DESCONOCIDO';

    const getStyles = () => {
        switch (s) {
            case 'ACTIVO':
            case 'APROBADO':
            case 'OPERATIVO':
            case 'OPEN':
            case 'PUBLICADO':
                return {
                    bg: 'bg-emerald-500/10',
                    text: 'text-emerald-600',
                    border: 'border-emerald-500/20',
                    icon: <CheckCircle2 className="w-3 h-3" />,
                    dot: 'bg-emerald-500'
                };
            case 'PENDIENTE':
            case 'EN REVISION':
            case 'REVISIÓN':
                return {
                    bg: 'bg-amber-500/10',
                    text: 'text-amber-600',
                    border: 'border-amber-500/20',
                    icon: <Clock className="w-3 h-3" />,
                    dot: 'bg-amber-500'
                };
            case 'INACTIVO':
            case 'BLOQUEADO':
            case 'BAJA':
            case 'ELIMINADO':
            case 'CANCELADO':
            case 'RECHAZADO':
            case 'CLOSED':
            case 'CERRADO':
                return {
                    bg: 'bg-rose-500/10',
                    text: 'text-rose-600',
                    border: 'border-rose-500/20',
                    icon: <XCircle className="w-3 h-3" />,
                    dot: 'bg-rose-500'
                };
            case 'FINALIZADO':
                return {
                    bg: 'bg-indigo-500/10',
                    text: 'text-indigo-600',
                    border: 'border-indigo-500/20',
                    icon: <CheckCircle2 className="w-3 h-3" />,
                    dot: 'bg-indigo-500'
                };
            default:
                return {
                    bg: 'bg-slate-500/10',
                    text: 'text-slate-600',
                    border: 'border-slate-500/20',
                    icon: <AlertCircle className="w-3 h-3" />,
                    dot: 'bg-slate-500'
                };
        }
    };

    const styles = getStyles();

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
            styles.bg,
            styles.text,
            styles.border,
            className
        )}>
            {showIcon && styles.icon}
            {!showIcon && <div className={cn("w-1.5 h-1.5 rounded-full", styles.dot)} />}
            {s}
        </div>
    );
};
