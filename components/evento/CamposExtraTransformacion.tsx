'use client';

import React, { useMemo } from 'react';
import {
    ECE_ID_FECHA,
    ECE_ID_INSTITUCION,
    ECE_ID_MESA,
    INSTITUCIONES_EVENTO_TRANSFORMACION,
    MESAS_EVENTO_TRANSFORMACION,
    calcularDisponibilidadMesas,
    CUPO_MAXIMO_GLOBAL_MESA,
    normalizarTexto
} from '@/lib/constants/eventoTransformacion';
import { ClipboardList, Building2, Layers, Check, AlertCircle, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    camposExtras: any[];
    respuestasExtras: Record<string, any>;
    errores: Record<string, boolean>;
    cuposGlobales: Record<string, number>;
    cuposInstitucion: Record<string, Record<string, number>>;
    onChangeRespuesta: (campoId: string, valor: any) => void;
    onClearError: (campoId: string) => void;
    onRefreshCupos: () => void;
}

export function CamposExtraTransformacion({
    camposExtras,
    respuestasExtras,
    errores,
    cuposGlobales,
    cuposInstitucion,
    onChangeRespuesta,
    onClearError,
    onRefreshCupos
}: Props) {
    const campoFecha = camposExtras.find(c => c.id === ECE_ID_FECHA);
    const campoInstitucion = camposExtras.find(c => c.id === ECE_ID_INSTITUCION);
    const campoMesa = camposExtras.find(c => c.id === ECE_ID_MESA);

    const valorFecha = String(respuestasExtras[ECE_ID_FECHA] || '').trim().toUpperCase();
    // Detectar si la opción seleccionada requiere institución y mesa de trabajo
    // (cualquier variante que contenga "06 DE NOVIEMBRE" o sea "AMBAS FECHAS")
    const requiereMesasEInstitucion =
        valorFecha.includes('06 DE NOVIEMBRE') || valorFecha === 'AMBAS FECHAS';

    const valorInstitucion = String(respuestasExtras[ECE_ID_INSTITUCION] || '').trim();
    const valorMesa = String(respuestasExtras[ECE_ID_MESA] || '').trim();

    // Instituciones ordenadas alfabéticamente para búsqueda rápida en el select
    const institucionesOrdenadas = useMemo(() => {
        return [...INSTITUCIONES_EVENTO_TRANSFORMACION].sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        );
    }, []);

    // Cálculo de disponibilidad de mesas según reglas de negocio
    const disponibilidadMesas = useMemo(() => {
        if (!valorInstitucion) return {};
        return calcularDisponibilidadMesas({
            institucionNombre: valorInstitucion,
            cuposGlobales,
            cuposInstitucion
        });
    }, [valorInstitucion, cuposGlobales, cuposInstitucion]);

    // Opciones del campo Fecha
    const opcionesFecha = useMemo(() => {
        if (!campoFecha?.opciones) return ['05 DE NOVIEMBRE (ACTO DE INAGURACIÓN)', '06 DE NOVIEMBRE (Monoblock UMSA)', 'AMBAS FECHAS'];
        try {
            const raw = campoFecha.opciones;
            if (typeof raw === 'string') return JSON.parse(raw);
            if (Array.isArray(raw)) return raw;
        } catch {}
        return ['05 DE NOVIEMBRE (ACTO DE INAGURACIÓN)', '06 DE NOVIEMBRE (Monoblock UMSA)', 'AMBAS FECHAS'];
    }, [campoFecha]);

    const handleSelectFecha = (opcion: string) => {
        onChangeRespuesta(ECE_ID_FECHA, opcion);
        onClearError(ECE_ID_FECHA);

        // Solo limpiar institución/mesa si eligió la fecha de INAUGURACIÓN (sin mesas)
        if (!opcion.toUpperCase().includes('06 DE NOVIEMBRE') && opcion.toUpperCase() !== 'AMBAS FECHAS') {
            onChangeRespuesta(ECE_ID_INSTITUCION, '');
            onChangeRespuesta(ECE_ID_MESA, '');
            onClearError(ECE_ID_INSTITUCION);
            onClearError(ECE_ID_MESA);
        } else {
            onRefreshCupos();
        }
    };

    const handleSelectInstitucion = (nombreInst: string) => {
        onChangeRespuesta(ECE_ID_INSTITUCION, nombreInst);
        onClearError(ECE_ID_INSTITUCION);
        onRefreshCupos();

        // Si ya tenía una mesa seleccionada, verificar si sigue disponible con la nueva institución
        if (valorMesa) {
            const nuevaDisp = calcularDisponibilidadMesas({
                institucionNombre: nombreInst,
                cuposGlobales,
                cuposInstitucion
            });
            if (!nuevaDisp[valorMesa]?.disponible) {
                onChangeRespuesta(ECE_ID_MESA, '');
            }
        }
    };

    const handleSelectMesa = (mesa: string, disponible: boolean) => {
        if (!disponible) return;
        onChangeRespuesta(ECE_ID_MESA, mesa);
        onClearError(ECE_ID_MESA);
    };

    return (
        <div className="md:col-span-2 space-y-6">
            {/* 1. CAMPO FECHA */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ClipboardList className="w-4 h-4 text-primary" />
                    </div>
                    <label className="text-[11px] font-black uppercase text-foreground tracking-widest pl-1">
                        {campoFecha?.label || 'Fecha de Asistencia'} <span className="text-red-500">*</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {opcionesFecha.map((opt: string) => {
                        const isSelected = valorFecha === opt.toUpperCase();
                        return (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => handleSelectFecha(opt)}
                                className={cn(
                                    "px-5 py-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group cursor-pointer",
                                    isSelected
                                        ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/30"
                                        : errores[ECE_ID_FECHA]
                                            ? "border-red-500 bg-red-500/5"
                                            : "border-border bg-muted/10 text-muted-foreground hover:border-primary/20"
                                )}
                            >
                                <span className={cn("text-xs font-bold", isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
                                    {opt}
                                </span>
                                {isSelected ? (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-border group-hover:border-primary/30" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. CAMPO INSTITUCIÓN (Sin buscador confuso, selector limpio directo) */}
            {requiereMesasEInstitucion && (
                <div className="space-y-3 p-5 rounded-3xl bg-muted/20 border border-border/60">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <label className="text-[11px] font-black uppercase text-foreground tracking-widest pl-1">
                                {campoInstitucion?.label || 'Institución a la que representa'} <span className="text-red-500">*</span>
                            </label>
                        </div>
                        {valorInstitucion && (
                            <span className="text-[10px] font-bold text-primary px-3 py-1 rounded-full bg-primary/10">
                                Seleccionada
                            </span>
                        )}
                    </div>

                    {/* Selector de institución desplegable */}
                    <div className="relative">
                        <select
                            value={valorInstitucion}
                            onChange={e => handleSelectInstitucion(e.target.value)}
                            className={cn(
                                "w-full h-14 pl-5 pr-10 rounded-2xl bg-card border-2 font-bold text-xs uppercase tracking-wide outline-none appearance-none cursor-pointer transition-all",
                                errores[ECE_ID_INSTITUCION]
                                    ? "border-red-500 bg-red-500/5 text-red-500"
                                    : "border-border text-foreground focus:border-primary hover:border-primary/40"
                            )}
                        >
                            <option value="">-- SELECCIONE SU INSTITUCIÓN --</option>
                            {institucionesOrdenadas.map(inst => (
                                <option key={inst.nombre} value={inst.nombre}>
                                    {inst.nombre}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Resumen de cupos de la institución seleccionada */}
                    {valorInstitucion && (() => {
                        const conf = INSTITUCIONES_EVENTO_TRANSFORMACION.find(
                            i => normalizarTexto(i.nombre) === normalizarTexto(valorInstitucion)
                        );
                        const instKey = Object.keys(cuposInstitucion).find(
                            k => normalizarTexto(k) === normalizarTexto(valorInstitucion)
                        );
                        const conteoInstMap = instKey ? cuposInstitucion[instKey] : (cuposInstitucion[valorInstitucion] || {});
                        const totalInscritosInst = Object.values(conteoInstMap).reduce((a, b) => a + (Number(b) || 0), 0);

                        return (
                            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground">
                                    Participantes inscritos de su institución:
                                </span>
                                <span className="font-black text-primary font-mono text-sm">
                                    {totalInscritosInst} inscritos
                                </span>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* 3. CAMPO MESA / ÁREA TEMÁTICA (Solo si seleccionó Institución) */}
            {requiereMesasEInstitucion && valorInstitucion && (
                <div className="space-y-3 p-5 rounded-3xl bg-muted/20 border border-border/60">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Layers className="w-4 h-4 text-primary" />
                            </div>
                            <label className="text-[11px] font-black uppercase text-foreground tracking-widest pl-1">
                                {campoMesa?.label || 'Mesa Temática / Área de Participación'} <span className="text-red-500">*</span>
                            </label>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">
                            Máx. {CUPO_MAXIMO_GLOBAL_MESA} por mesa
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {MESAS_EVENTO_TRANSFORMACION.map(mesa => {
                            const isSelected = valorMesa === mesa;
                            const dispInfo = disponibilidadMesas[mesa] || {
                                disponible: true,
                                conteoMesa: 0,
                                conteoInst: 0,
                                limiteInstMesa: null
                            };
                            const disponible = dispInfo.disponible;

                            return (
                                <button
                                    key={mesa}
                                    type="button"
                                    disabled={!disponible && !isSelected}
                                    onClick={() => handleSelectMesa(mesa, disponible)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 group relative overflow-hidden",
                                        isSelected
                                            ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/40"
                                            : !disponible
                                                ? "border-border/40 bg-muted/10 opacity-55 cursor-not-allowed text-muted-foreground"
                                                : errores[ECE_ID_MESA]
                                                    ? "border-red-500 bg-red-500/5 hover:border-red-500"
                                                    : "border-border bg-card text-foreground hover:border-primary/40 cursor-pointer"
                                    )}
                                >
                                    <div className="flex items-start justify-between w-full">
                                        <span className={cn("text-xs font-black uppercase", isSelected ? "text-primary" : "text-foreground")}>
                                            {mesa}
                                        </span>
                                        {isSelected ? (
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border-2 shrink-0",
                                                disponible ? "border-border group-hover:border-primary/40" : "border-border/30"
                                            )} />
                                        )}
                                    </div>

                                    {/* Métricas de cupos */}
                                    <div className="flex items-center justify-between text-[10px] w-full pt-1 border-t border-border/40 font-medium">
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <Users className="w-3 h-3" />
                                            Nacional: <strong className={dispInfo.conteoMesa >= CUPO_MAXIMO_GLOBAL_MESA ? "text-red-500" : "text-foreground"}>{dispInfo.conteoMesa}/{CUPO_MAXIMO_GLOBAL_MESA}</strong>
                                        </span>
                                        <span className="text-muted-foreground">
                                            Su inst.: <strong className={dispInfo.conteoInst >= (dispInfo.limiteInstMesa || 1) ? "text-amber-500" : "text-foreground"}>{dispInfo.conteoInst}</strong>
                                        </span>
                                    </div>

                                    {!disponible && dispInfo.motivo && (
                                        <div className="flex items-center gap-1 text-[9.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 p-1.5 rounded-lg w-full">
                                            <AlertCircle className="w-3 h-3 shrink-0" />
                                            <span className="line-clamp-2 leading-tight">{dispInfo.motivo}</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
