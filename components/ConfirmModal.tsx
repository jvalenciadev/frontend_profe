'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriangleAlert, X, Check, Info, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    loading = false
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    const variantStyles = {
        danger: {
            icon: <ShieldAlert className="w-8 h-8 text-red-500" />,
            bg: 'bg-red-500/10',
            button: 'bg-red-600 hover:bg-red-700 shadow-red-500/20',
            title: 'text-red-950 dark:text-red-100'
        },
        warning: {
            icon: <TriangleAlert className="w-8 h-8 text-amber-500" />,
            bg: 'bg-amber-500/10',
            button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',
            title: 'text-amber-950 dark:text-amber-100'
        },
        info: {
            icon: <Info className="w-8 h-8 text-blue-500" />,
            bg: 'bg-blue-500/10',
            button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
            title: 'text-blue-950 dark:text-blue-100'
        },
        success: {
            icon: <Check className="w-8 h-8 text-emerald-500" />,
            bg: 'bg-emerald-500/10',
            button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
            title: 'text-emerald-950 dark:text-emerald-100'
        }
    };

    const style = variantStyles[variant];

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        {/* Header Decoration */}
                        <div className={cn("absolute top-0 left-0 w-full h-1", style.button)} />

                        <div className="p-8 space-y-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className={cn("p-4 rounded-[1.5rem]", style.bg)}>
                                    {style.icon}
                                </div>
                                <div className="space-y-2">
                                    <h3 className={cn("text-xl font-black uppercase tracking-tight", style.title)}>
                                        {title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                                        {description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={cn(
                                        "w-full h-14 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2",
                                        style.button,
                                        loading && "opacity-70 cursor-not-allowed"
                                    )}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Procesando...
                                        </>
                                    ) : confirmText}
                                </button>

                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </div>

                        {/* Decoration */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-100 dark:bg-slate-800/40 rounded-full blur-3xl -z-10" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
