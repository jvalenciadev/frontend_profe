'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    const { isSidebarCollapsed } = useTheme();

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        '2xl': 'max-w-7xl',
        full: 'max-w-[95vw]'
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className={cn(
            "fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 transition-all duration-500 ease-in-out",
            isSidebarCollapsed ? "md:pl-24" : "md:pl-80"
        )}>
            {/* Backdrop */}
            <div className="modal-backdrop" onClick={onClose} />

            {/* Modal Container */}
            <div className={`modal-container animate-in zoom-in-95 fade-in ${sizeClasses[size]}`}>
                {title && (
                    <div className="modal-header">
                        <div className="modal-title-wrapper">
                            <h3 className="modal-title">{title}</h3>
                            <div className="modal-title-accent" />
                        </div>
                        <button onClick={onClose} className="modal-close-btn">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
