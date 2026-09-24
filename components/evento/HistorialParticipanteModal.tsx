'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, X, User, Calendar, MapPin, CheckCircle2,
    Clock, ExternalLink, Award, AlertCircle, Phone,
    Mail, IdCard, Loader2, Sparkles, BookOpen
} from 'lucide-react';
import { eventoService } from '@/services/eventoService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

interface HistorialParticipanteModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCi?: string;
}

export function HistorialParticipanteModal({
    isOpen,
    onClose,
    initialCi = ''
}: HistorialParticipanteModalProps) {
    const [mounted, setMounted] = useState(false);
    const [ci, setCi] = useState(initialCi);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [data, setData] = useState<any | null>(null);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (initialCi) {
                setCi(initialCi);
                handleSearch(initialCi);
            }
        } else {
            document.body.style.overflow = 'unset';
            setSearched(false);
            setData(null);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, initialCi]);

    const handleSearch = async (ciToSearch?: string) => {
        const query = (ciToSearch !== undefined ? ciToSearch : ci).trim();
        if (!query) {
            toast.error('Por favor ingresa un número de CI');
            return;
        }

        try {
            setLoading(true);
            setSearched(true);
            const res = await eventoService.getHistorialByCi(query);
            setData(res);
            if (!res.found || res.inscripciones.length === 0) {
                toast.info(`No se encontraron participaciones para el CI ${query}`);
            }
        } catch (error: any) {
            console.error('Error buscando historial por CI:', error);
            toast.error(error?.response?.data?.message || 'Error al buscar historial del participante');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    if (!mounted || !isOpen) return null;

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-background/80 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
                    className="relative w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                                <Search className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                                    Buscador de Participación por CI
                                </h2>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Consulta todos los talleres y eventos en los que participó un docente
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-2xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all"
                            aria-label="Cerrar modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search Input Bar */}
                    <div className="p-6 border-b border-border/40 bg-card">
                        <div className="flex gap-2 sm:gap-3">
                            <div className="relative flex-1">
                                <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Ingresa el número de CI (ej: 14122404)..."
                                    value={ci}
                                    onChange={(e) => setCi(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary outline-none font-bold text-base text-foreground transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-muted-foreground/60"
                                    autoFocus
                                />
                                {ci && (
                                    <button
                                        type="button"
                                        onClick={() => setCi('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSearch()}
                                disabled={loading || !ci.trim()}
                                className="h-14 px-7 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Search className="w-4 h-4" />
                                        <span>Buscar</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Body Content / Results */}
                    <div className="p-6 overflow-y-auto space-y-6 flex-1">
                        {loading && (
                            <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-xs font-bold uppercase tracking-widest">Consultando registros institucionales...</p>
                            </div>
                        )}

                        {!loading && !searched && (
                            <div className="py-16 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3">
                                <div className="w-16 h-16 rounded-3xl bg-muted/40 flex items-center justify-center text-muted-foreground/60">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-wide text-foreground">
                                    Historial Centralizado de Eventos
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Ingresa la Cédula de Identidad para verificar los talleres inscritos, asistencias marcadas y resultados de evaluaciones.
                                </p>
                            </div>
                        )}

                        {!loading && searched && (!data?.found || data?.inscripciones?.length === 0) && (
                            <div className="py-14 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                                <h3 className="font-black text-base uppercase tracking-tight text-foreground">
                                    Sin participaciones registradas
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium">
                                    No se encontraron talleres o eventos asociados al CI <span className="font-bold text-foreground">{ci}</span> en la base de datos de eventos.
                                </p>
                            </div>
                        )}

                        {!loading && searched && data?.found && (
                            <div className="space-y-6">
                                {/* Participant Card */}
                                <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-md shadow-primary/30 flex-shrink-0">
                                            {data.persona.nombre1?.charAt(0)}{data.persona.apellido1?.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-primary tracking-widest block">
                                                Docente / Participante
                                            </span>
                                            <h3 className="text-lg font-black uppercase text-foreground tracking-tight">
                                                {data.persona.nombreCompleto}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground font-medium">
                                                <span className="font-mono font-bold text-foreground">
                                                    CI: {data.persona.ci}{data.persona.complemento ? `-${data.persona.complemento}` : ''} {data.persona.expedido}
                                                </span>
                                                {data.persona.celular && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3.5 h-3.5 text-primary" /> {data.persona.celular}
                                                    </span>
                                                )}
                                                {data.persona.correo && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3.5 h-3.5 text-primary" /> {data.persona.correo}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Badge */}
                                    <div className="flex gap-2">
                                        <div className="px-4 py-2 rounded-xl bg-card border border-border text-center">
                                            <span className="text-[9px] font-black uppercase text-muted-foreground block">Talleres</span>
                                            <span className="text-base font-black text-foreground">{data.totalTalleres}</span>
                                        </div>
                                        <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                                            <span className="text-[9px] font-black uppercase text-green-600 block">Asistidos</span>
                                            <span className="text-base font-black text-green-600">{data.asistidos}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* List of Workshops */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                        <span>Talleres y Actividades ({data.inscripciones.length})</span>
                                        <span className="text-[10px] font-normal normal-case opacity-70">Ordenados por fecha más reciente</span>
                                    </h4>

                                    <div className="space-y-3">
                                        {data.inscripciones.map((ins: any) => (
                                            <div
                                                key={ins.id}
                                                className="p-5 rounded-2xl bg-card border border-border/70 hover:border-primary/40 transition-all space-y-3 shadow-sm group"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                                {ins.evento?.tipo || 'Taller'}
                                                            </span>
                                                            {ins.evento?.codigo && (
                                                                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                                                                    #{ins.evento.codigo}
                                                                </span>
                                                            )}
                                                            {ins.asistencia ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                    Asistencia Confirmada
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                                                    <Clock className="w-3 h-3 text-amber-600" />
                                                                    Sin Asistencia
                                                                </span>
                                                            )}
                                                        </div>

                                                        <h5 className="font-black text-base uppercase text-foreground tracking-tight group-hover:text-primary transition-colors">
                                                            {ins.evento?.nombre}
                                                        </h5>

                                                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium pt-0.5">
                                                            <span className="flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5 text-primary/70" />
                                                                {ins.evento?.fecha ? new Date(ins.evento.fecha).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                            </span>
                                                            {ins.evento?.lugar && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <MapPin className="w-3.5 h-3.5 text-primary/70" />
                                                                    {ins.evento.lugar}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>


                                                </div>

                                                {/* Evaluaciones / Intentos */}
                                                {ins.intentos && ins.intentos.length > 0 && (
                                                    <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-2">
                                                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1 mr-1">
                                                            <Award className="w-3 h-3 text-primary" /> Evaluaciones:
                                                        </span>
                                                        {ins.intentos.map((i: any) => (
                                                            i.esEvaluativo === false ? (
                                                                <span
                                                                    key={i.id}
                                                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                                >
                                                                    <span>{i.titulo}:</span>
                                                                    <strong>Respondido</strong>
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    key={i.id}
                                                                    className={cn(
                                                                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5",
                                                                        i.aprobado
                                                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                                            : "bg-red-500/10 text-red-600 border-red-500/30"
                                                                    )}
                                                                >
                                                                    <span>{i.titulo}:</span>
                                                                    <strong className="font-mono">{i.nota !== null ? `${i.nota} pts` : '—'}</strong>
                                                                    <span>{i.aprobado ? '· Aprobado' : '· Reprobado'}</span>
                                                                </span>
                                                            )
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border/60 bg-muted/20 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 px-6 rounded-xl border border-border bg-card hover:bg-muted/50 font-black text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
