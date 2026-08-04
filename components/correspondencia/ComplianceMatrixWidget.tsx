'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2, AlertCircle, User,
    FileText, ShieldCheck, Calendar,
    BadgeCheck, TimerOff, Hourglass,
    CircleDot, BarChart3,
    CheckCircle,
    Clock,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CorDocumento } from '@/services/correspondencia.service';

interface ComplianceMatrixWidgetProps {
    doc: CorDocumento;
}

export function ComplianceMatrixWidget({ doc }: ComplianceMatrixWidgetProps) {
    if (!doc) return null;

    const fechaLimite = doc.fechaLimite ? new Date(doc.fechaLimite) : null;
    const hoy = new Date();

    // Destinatarios y Vías configurados en el trámite inicial
    const destinatariosYVias = doc.participantes?.filter(
        p => p.rol === 'DESTINATARIO' || p.rol === 'VIA'
    ) || [];

    const hijos = doc.documentosHijos || [];

    const docCreatedAt = doc.createdAt ? new Date(doc.createdAt) : null;
    const totalPlazoDias = doc.plazoDias || (
        docCreatedAt && fechaLimite
            ? Math.max(1, Math.round((fechaLimite.getTime() - docCreatedAt.getTime()) / (1000 * 60 * 60 * 24)))
            : null
    );

    // Mapear cada respuesta registrada
    const respuestasMap = hijos.map((hijo) => {
        const remitente = hijo.participantes?.find(p => p.rol === 'REMITENTE')?.usuario;
        const fechaResp = hijo.createdAt ? new Date(hijo.createdAt) : null;

        let aTiempo = true;
        let diasDiferencia = 0;
        let diasTomados: number | null = null;
        let diasAnticipacion: number | null = null;

        if (docCreatedAt && fechaResp) {
            diasTomados = Math.max(1, Math.ceil((fechaResp.getTime() - docCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));
        }

        if (fechaLimite && fechaResp) {
            aTiempo = fechaResp.getTime() <= fechaLimite.getTime();
            const diffMs = fechaResp.getTime() - fechaLimite.getTime();
            diasDiferencia = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (aTiempo) {
                diasAnticipacion = Math.max(0, Math.floor((fechaLimite.getTime() - fechaResp.getTime()) / (1000 * 60 * 60 * 24)));
            }
        }

        return {
            hijoId: hijo.id,
            cite: hijo.cite,
            tipo: hijo.tipo || 'INFORME',
            referencia: hijo.referencia,
            remitente,
            fechaResp,
            aTiempo,
            diasDiferencia,
            diasTomados,
            diasAnticipacion,
        };
    });

    // Detectar destinatarios pendientes que no han respondido aún
    // Si el trámite ya está ARCHIVADO o CANCELADO, no hay pendientes (concluyó)
    const esConcluido = doc.estado === 'ARCHIVADO' || doc.estado === 'CANCELADO';
    const idsQueRespondieron = new Set(respuestasMap.map(r => r.remitente?.id).filter(Boolean));

    let pendientes: Array<{ id?: string; usuario?: any; rol: string }> = [];

    if (!esConcluido) {
        // Ordenar seguimientos por fecha descendente si existen
        const seguimientosOrdenados = [...(doc.seguimientos || [])].sort(
            (a, b) => new Date(b.createdAt || b.fecha || 0).getTime() - new Date(a.createdAt || a.fecha || 0).getTime()
        );
        // Buscar el último movimiento que TRANSFIRIÓ el documento a alguien (con destinatario)
        const ultimoTransfer = seguimientosOrdenados.find(s =>
            s.destinatario && (s.accion === 'DERIVACION' || s.accion === 'ENVIO' || s.accion === 'DEVOLUCION')
        );

        if (ultimoTransfer) {
            const ultimoTs = new Date(ultimoTransfer.createdAt || ultimoTransfer.fecha || 0).getTime();
            // Agrupar TODOS los transfers del mismo instante (±5s) para capturar envíos multi-destinatario simultáneos
            const transfersUltimos = seguimientosOrdenados.filter(s =>
                s.destinatario &&
                (s.accion === 'DERIVACION' || s.accion === 'ENVIO' || s.accion === 'DEVOLUCION') &&
                Math.abs(new Date(s.createdAt || s.fecha || 0).getTime() - ultimoTs) <= 5000
            );
            // Generar pendientes para cada destinatario del lote, excluyendo quienes ya respondieron
            const seenIds = new Set<string>();
            pendientes = transfersUltimos
                .filter(s => s.destinatario && !idsQueRespondieron.has(s.destinatario.id))
                .map(s => ({
                    id: s.destinatario!.id,
                    usuario: s.destinatario!,
                    rol: s.accion === 'DEVOLUCION' ? 'REMITENTE ORIGINAL (Devuelto)' : 'DESTINATARIO ACTUAL'
                }))
                .filter(p => {
                    if (p.id && seenIds.has(p.id)) return false;
                    if (p.id) seenIds.add(p.id);
                    return true;
                });
        } else {
            // Sin transferencias registradas aún: usar participantes iniciales
            pendientes = destinatariosYVias.filter(p => !idsQueRespondieron.has(p.usuario?.id));
        }
    }

    const totalRequeridos = respuestasMap.length + pendientes.length;
    const totalDest = totalRequeridos > 0 ? totalRequeridos : destinatariosYVias.length;

    const totalEnPlazo = respuestasMap.filter(r => r.aTiempo).length;
    const totalFueraPlazo = respuestasMap.filter(r => !r.aTiempo).length;
    const totalPendientes = pendientes.length;

    // Tasa de cumplimiento: Porcentaje de respuestas a tiempo sobre el total de requeridos activos (respuestas + pendientes)
    const pctCumplimiento = totalDest > 0
        ? Math.round((totalEnPlazo / totalDest) * 100)
        : 0;

    const kpis = [
        {
            label: 'Respuestas',
            sublabel: totalDest > 0 ? `de ${totalDest} asignados` : 'registradas',
            value: respuestasMap.length,
            icon: FileText,
            color: 'text-sky-600',
            iconBg: 'bg-sky-500/15',
        },
        {
            label: 'En Plazo',
            sublabel: 'dentro de la fecha límite',
            value: totalEnPlazo,
            icon: BadgeCheck,
            color: 'text-emerald-600',
            iconBg: 'bg-emerald-500/15',
        },
        {
            label: 'Fuera de Plazo',
            sublabel: 'excedieron la fecha límite',
            value: totalFueraPlazo,
            icon: TimerOff,
            color: 'text-rose-600',
            iconBg: 'bg-rose-500/15',
        },
        {
            label: 'Pendientes',
            sublabel: 'sin respuesta aún',
            value: totalPendientes,
            icon: Hourglass,
            color: 'text-amber-600',
            iconBg: 'bg-amber-500/15',
        },
    ];

    return (
        <div className="bg-card border border-border/60 rounded-[2.5rem] overflow-hidden shadow-xl">

            {/* ── Header con barra de progreso ── */}
            <div className="px-8 pt-8 pb-6 border-b border-border/50 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary block mb-0.5">
                                Control de Trazabilidad
                            </span>
                            <h3 className="text-base font-black tracking-tight leading-tight">
                                Matriz de Respuestas y Plazos
                            </h3>
                        </div>
                    </div>

                    {fechaLimite && (
                        <div className="flex items-center gap-3 bg-muted/50 px-4 py-3 rounded-2xl border border-border/60 shrink-0">
                            <Calendar className="w-4 h-4 text-primary shrink-0" />
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                                    Fecha Límite Oficial
                                </p>
                                <p className="text-sm font-bold text-foreground leading-none">
                                    {fechaLimite.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Barra de progreso de cumplimiento */}
                {totalDest > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <BarChart3 className="w-3.5 h-3.5" />
                                Tasa de cumplimiento
                            </span>
                            <span className="font-black text-primary">{pctCumplimiento}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden border border-border/40">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pctCumplimiento}%` }}
                                transition={{ duration: 0.9, ease: 'easeOut' }}
                                className={cn(
                                    'h-full rounded-full',
                                    pctCumplimiento >= 80 ? 'bg-emerald-500' :
                                        pctCumplimiento >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                )}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-border/40 border-b border-border/50">
                {kpis.map(({ label, sublabel, value, icon: Icon, color, iconBg }) => (
                    <div key={label} className="p-5 flex flex-col gap-3">
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
                            <Icon className={cn('w-4 h-4', color)} />
                        </div>
                        <div>
                            <span className={cn('text-3xl font-black leading-none', color)}>{value}</span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground mt-1 leading-tight">{label}</p>
                            <p className="text-[9px] text-muted-foreground font-medium leading-tight mt-0.5">{sublabel}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Detalle de respuestas ── */}
            <div className="p-6 md:p-8 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    Detalle de Respuestas por Hoja de Ruta
                </h4>

                {respuestasMap.length === 0 && pendientes.length === 0 ? (
                    <div className="py-10 rounded-2xl bg-muted/20 border border-border/40 text-center space-y-2">
                        <CircleDot className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                        <p className="text-xs text-muted-foreground font-medium">
                            Sin respuestas ni asignaciones múltiples registradas.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Respuestas recibidas */}
                        {respuestasMap.map((resp, idx) => (
                            <motion.div
                                key={resp.hijoId || idx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 }}
                                className={cn(
                                    'rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all',
                                    resp.aTiempo
                                        ? 'bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/50'
                                        : 'bg-rose-500/5 border-rose-500/25 hover:border-rose-500/50'
                                )}
                            >
                                <div className="flex items-start gap-4 min-w-0">
                                    <div className={cn(
                                        'w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm text-white',
                                        resp.aTiempo ? 'bg-emerald-500' : 'bg-rose-500'
                                    )}>
                                        {resp.remitente?.nombre?.[0]?.toUpperCase() || 'R'}
                                    </div>

                                    <div className="min-w-0 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Cite de Respuesta explícito */}
                                            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                                                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                                                    Cite Resp:
                                                </span>
                                                <span className="text-xs font-black tracking-tight text-foreground">
                                                    {resp.cite}
                                                </span>
                                            </div>

                                            {/* Estado del plazo */}
                                            <span className={cn(
                                                'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 shrink-0',
                                                resp.aTiempo
                                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                            )}>
                                                {resp.aTiempo
                                                    ? <><CheckCircle2 className="w-3 h-3" /> En Plazo</>
                                                    : <><AlertCircle className="w-3 h-3" /> Fuera +{resp.diasDiferencia}d</>
                                                }
                                            </span>

                                            {/* Días de plazo otorgados */}
                                            {totalPlazoDias !== null && totalPlazoDias !== undefined && (
                                                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-muted/80 text-muted-foreground border border-border/60 flex items-center gap-1.5 shrink-0">
                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                    Plazo: {totalPlazoDias} {totalPlazoDias === 1 ? 'día' : 'días'}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs font-semibold text-foreground leading-tight">
                                            Respondió:{' '}
                                            <span className="text-primary font-black">
                                                {resp.remitente ? `${resp.remitente.nombre} ${resp.remitente.apellidos}` : 'Funcionario Registrado'}
                                            </span>
                                            {resp.remitente?.cargoStr && (
                                                <span className="text-[10px] text-muted-foreground font-medium ml-1.5 opacity-75">
                                                    &mdash; {resp.remitente.cargoStr}
                                                </span>
                                            )}
                                        </p>
                                        {resp.referencia && (
                                            <p className="text-[11px] italic text-muted-foreground mt-1 line-clamp-1 font-medium">
                                                &ldquo;{resp.referencia}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:items-end shrink-0 text-xs gap-0.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Fecha de Respuesta
                                    </span>
                                    <span className="font-bold text-foreground">
                                        {resp.fechaResp
                                            ? resp.fechaResp.toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : 'N/A'}
                                    </span>
                                    <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                                        {resp.aTiempo
                                            ? (resp.diasTomados ? `Respondió en ${resp.diasTomados}d (${resp.diasAnticipacion ?? 0}d antes del plazo)` : 'Dentro del plazo')
                                            : `Excedió ${resp.diasDiferencia}d del plazo`}
                                    </span>
                                </div>
                            </motion.div>
                        ))}

                        {/* Pendientes */}
                        {pendientes.map((p, idx) => {
                            const estaVencido = fechaLimite ? hoy.getTime() > fechaLimite.getTime() : false;
                            const diasVencido = fechaLimite ? Math.max(0, Math.ceil((hoy.getTime() - fechaLimite.getTime()) / (1000 * 60 * 60 * 24))) : 0;
                            const diasRestantes = fechaLimite && !estaVencido ? Math.max(0, Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))) : 0;

                            return (
                                <motion.div
                                    key={p.id || idx}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (respuestasMap.length + idx) * 0.06 }}
                                    className={cn(
                                        'rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all',
                                        estaVencido
                                            ? 'bg-rose-500/5 border-rose-500/25'
                                            : 'bg-amber-500/5 border-amber-500/25'
                                    )}
                                >
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div className={cn(
                                            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                                            estaVencido ? 'bg-rose-500/20' : 'bg-amber-500/20'
                                        )}>
                                            <User className={cn('w-5 h-5', estaVencido ? 'text-rose-600' : 'text-amber-600')} />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="text-sm font-black tracking-tight">
                                                    {p.usuario?.nombre} {p.usuario?.apellidos}
                                                </span>
                                                <span className={cn(
                                                    'px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 shrink-0',
                                                    estaVencido
                                                        ? 'bg-rose-500/15 text-rose-700 border-rose-500/30 animate-pulse'
                                                        : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                                                )}>
                                                    {estaVencido
                                                        ? <><TimerOff className="w-3 h-3" /> Vencido +{diasVencido}d</>
                                                        : <><Hourglass className="w-3 h-3" /> Pendiente</>
                                                    }
                                                </span>
                                                {totalPlazoDias !== null && totalPlazoDias !== undefined && (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-muted/80 text-muted-foreground border border-border/60 flex items-center gap-1.5 shrink-0">
                                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                                        Plazo: {totalPlazoDias} {totalPlazoDias === 1 ? 'día' : 'días'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                                                Rol: {p.rol}{p.usuario?.cargoStr ? ` — ${p.usuario.cargoStr}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:items-end shrink-0 text-xs gap-0.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Estado del Plazo
                                        </span>
                                        <span className={cn('font-bold', estaVencido ? 'text-rose-600' : 'text-amber-600')}>
                                            {estaVencido ? 'Plazo expirado sin respuesta' : 'Dentro del plazo otorgado'}
                                        </span>
                                        <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                                            {estaVencido
                                                ? `Vencido por ${diasVencido}d`
                                                : (totalPlazoDias ? `Quedan ${diasRestantes}d de ${totalPlazoDias}d` : 'En plazo')}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
