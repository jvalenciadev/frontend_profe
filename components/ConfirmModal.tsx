'use client';

import { Modal } from './Modal';
import { AlertCircle, Trash2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger',
    isLoading = false
}: ConfirmModalProps) {

    const iconMap = {
        danger: <Trash2 className="w-12 h-12" />,
        warning: <AlertCircle className="w-12 h-12" />,
        info: <HelpCircle className="w-12 h-12" />
    };

    const colorMap = {
        danger: 'bg-destructive/10 text-destructive border-destructive/20 shadow-destructive/10',
        warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/10',
        info: 'bg-primary/10 text-primary border-primary/20 shadow-primary/10'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirmación de Sistema"
            size="sm"
        >
            <div className="space-y-8 text-center py-6">
                <div className={cn(
                    "w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto border-2 shadow-xl transition-all",
                    colorMap[type]
                )}>
                    {iconMap[type]}
                </div>

                <div className="space-y-3">
                    <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase">{title}</h3>
                    <p className="text-[14px] text-muted-foreground px-6 leading-relaxed font-bold italic">
                        "{description}"
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "h-16 w-full rounded-[2rem] text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50",
                            type === 'danger' ? "bg-primary shadow-primary/40" : "bg-primary shadow-primary/40"
                        )}
                    >
                        {isLoading ? 'Procesando...' : confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="h-16 w-full rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
