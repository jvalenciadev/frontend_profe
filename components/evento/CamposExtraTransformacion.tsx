'use client';

import React, { useMemo, useState } from 'react';
import {
    ECE_ID_FECHA,
    ECE_ID_INSTITUCION,
    ECE_ID_MESA,
    INSTITUCIONES_EVENTO_TRANSFORMACION,
    MESAS_EVENTO_TRANSFORMACION,
    calcularDisponibilidadMesas,
    obtenerEstadoCupoInstitucion,
    CUPO_MAXIMO_GLOBAL_MESA,
    normalizarTexto
} from '@/lib/constants/eventoTransformacion';
import { ClipboardList, Building2, Layers, Check, AlertCircle, Users, ChevronDown, Search, X } from 'lucide-react';
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

    const valorInstitucion = String(respuestasExtras[ECE_ID_INSTITUCION] || '').trim();
    const valorFecha = String(respuestasExtras[ECE_ID_FECHA] || '').trim().toUpperCase();
    const valorMesa = String(respuestasExtras[ECE_ID_MESA] || '').trim();

    // Mesas solo si la fecha elegida incluye el 06 de noviembre
    const requiereMesas =
        valorFecha.includes('06 DE NOVIEMBRE') || valorFecha === 'AMBAS FECHAS';

    // Estado del buscador de institución
    const [filtroInstitucion, setFiltroInstitucion] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // Instituciones ordenadas alfabéticamente
    const institucionesOrdenadas = useMemo(() => {
        return [...INSTITUCIONES_EVENTO_TRANSFORMACION].sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        );
    }, []);

    // Instituciones filtradas según búsqueda
    const institucionesFiltradas = useMemo(() => {
        if (!filtroInstitucion.trim()) return institucionesOrdenadas;
        const fNorm = normalizarTexto(filtroInstitucion);
        return institucionesOrdenadas.filter(inst =>
            normalizarTexto(inst.nombre).includes(fNorm)
        );
    }, [institucionesOrdenadas, filtroInstitucion]);

    // Cálculo de disponibilidad de mesas según reglas de negocio
    const disponibilidadMesas = useMemo(() => {
        if (!valorInstitucion) return {};
        return calcularDisponibilidadMesas({
            institucionNombre: valorInstitucion,
            cuposGlobales,
            cuposInstitucion
        });
    }, [valorInstitucion, cuposGlobales, cuposInstitucion]);

    // Estado del cupo general de la institución seleccionada
    const estadoInstitucion = useMemo(() => {
        if (!valorInstitucion) return null;
        return obtenerEstadoCupoInstitucion({
            institucionNombre: valorInstitucion,
            cuposInstitucion
        });
    }, [valorInstitucion, cuposInstitucion]);

    // Opciones del campo Fecha (leídas del backend; fallback hardcoded)
    const opcionesFecha = useMemo(() => {
        if (!campoFecha?.opciones) return [
            '05 DE NOVIEMBRE (ACTO DE INAGURACIÓN)',
            '06 DE NOVIEMBRE (Monoblock UMSA)',
            'AMBAS FECHAS'
        ];
        try {
            const raw = campoFecha.opciones;
            if (typeof raw === 'string') return JSON.parse(raw);
            if (Array.isArray(raw)) return raw;
        } catch { }
        return [
            '05 DE NOVIEMBRE (ACTO DE INAGURACIÓN)',
            '06 DE NOVIEMBRE (Monoblock UMSA)',
            'AMBAS FECHAS'
        ];
    }, [campoFecha]);

    const handleSelectInstitucion = (nombreInst: string) => {
        onChangeRespuesta(ECE_ID_INSTITUCION, nombreInst);
        onClearError(ECE_ID_INSTITUCION);
        // Limpiar fecha y mesa al cambiar institución
        onChangeRespuesta(ECE_ID_FECHA, '');
        onChangeRespuesta(ECE_ID_MESA, '');
        onClearError(ECE_ID_FECHA);
        onClearError(ECE_ID_MESA);
        onRefreshCupos();
    };

    const handleSelectFecha = (opcion: string) => {
        onChangeRespuesta(ECE_ID_FECHA, opcion);
        onClearError(ECE_ID_FECHA);
        // Limpiar mesa si la nueva fecha no requiere mesas
        const nuevaFecha = opcion.toUpperCase();
        if (!nuevaFecha.includes('06 DE NOVIEMBRE') && nuevaFecha !== 'AMBAS FECHAS') {
            onChangeRespuesta(ECE_ID_MESA, '');
            onClearError(ECE_ID_MESA);
        } else {
            onRefreshCupos();
        }
    };

    const handleSelectMesa = (mesa: string, disponible: boolean) => {
        if (!disponible) return;
        onChangeRespuesta(ECE_ID_MESA, mesa);
        onClearError(ECE_ID_MESA);
    };

    return (
        <div className="md:col-span-2 space-y-6">

            {/* 1. CAMPO INSTITUCIÓN — siempre visible */}
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

                {/* Combobox buscador con lista visible */}
                <div className="relative">
                    {/* Barra de entrada / selección */}
                    <div className={cn(
                        "flex items-center min-h-[3.5rem] rounded-2xl bg-card border-2 px-4 gap-3 transition-all cursor-text",
                        errores[ECE_ID_INSTITUCION]
                            ? "border-red-500 bg-red-500/5 ring-2 ring-red-500/20"
                            : showDropdown
                                ? "border-primary ring-2 ring-primary/20 shadow-md"
                                : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setShowDropdown(true)}
                    >
                        <Search className="w-4 h-4 text-primary shrink-0" />
                        <input
                            type="text"
                            placeholder={valorInstitucion ? valorInstitucion : "Escribe para buscar tu institución (ej: UMSA, Tamayo, Llica, Potosí)..."}
                            value={showDropdown ? filtroInstitucion : (valorInstitucion || '')}
                            onFocus={() => {
                                setFiltroInstitucion('');
                                setShowDropdown(true);
                            }}
                            onChange={e => {
                                setFiltroInstitucion(e.target.value);
                                if (!showDropdown) setShowDropdown(true);
                            }}
                            onBlur={() => {
                                // Pequeño delay para permitir clic en las opciones
                                setTimeout(() => setShowDropdown(false), 200);
                            }}
                            className={cn(
                                "flex-1 bg-transparent outline-none text-xs font-bold uppercase tracking-wide placeholder:normal-case placeholder:font-medium truncate",
                                valorInstitucion && !showDropdown
                                    ? "text-primary"
                                    : "text-foreground placeholder:text-muted-foreground/60"
                            )}
                        />
                        {valorInstitucion ? (
                            <button
                                type="button"
                                onMouseDown={e => {
                                    e.preventDefault();
                                    handleSelectInstitucion('');
                                    setFiltroInstitucion('');
                                    setShowDropdown(false);
                                }}
                                className="shrink-0 text-muted-foreground hover:text-red-500 p-1 transition-colors"
                                title="Limpiar selección"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onMouseDown={e => {
                                    e.preventDefault();
                                    setShowDropdown(prev => !prev);
                                }}
                                className="shrink-0 text-muted-foreground p-1"
                            >
                                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showDropdown && "rotate-180")} />
                            </button>
                        )}
                    </div>

                    {/* Menú desplegable con lista visible filtrable */}
                    {showDropdown && (
                        <div className="absolute z-50 w-full mt-2 rounded-2xl bg-card border-2 border-border shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* Cabecera del dropdown con conteo */}
                            <div className="px-4 py-2.5 bg-muted/60 border-b border-border flex items-center justify-between text-[11px]">
                                <span className="font-black uppercase tracking-wider text-muted-foreground">
                                    Listado de Instituciones
                                </span>
                                <span className="font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-[10px]">
                                    {institucionesFiltradas.length} encontrada{institucionesFiltradas.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            {/* Opciones clickeables */}
                            <ul className="max-h-64 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
                                {institucionesFiltradas.length === 0 ? (
                                    <li className="p-6 text-center text-xs text-muted-foreground">
                                        No se encontraron resultados para <strong>"{filtroInstitucion}"</strong>.
                                    </li>
                                ) : (
                                    institucionesFiltradas.map(inst => {
                                        const isSelected = inst.nombre === valorInstitucion;
                                        return (
                                            <li key={inst.nombre}>
                                                <button
                                                    type="button"
                                                    onMouseDown={e => {
                                                        e.preventDefault();
                                                        handleSelectInstitucion(inst.nombre);
                                                        setFiltroInstitucion('');
                                                        setShowDropdown(false);
                                                    }}
                                                    className={cn(
                                                        "w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer",
                                                        isSelected
                                                            ? "bg-primary/10 text-primary"
                                                            : "hover:bg-muted/70 text-foreground"
                                                    )}
                                                >
                                                    <span className="flex-1 leading-snug">
                                                        {inst.nombre}
                                                    </span>
                                                    {inst.cupo !== null && (
                                                        <span className="text-[10px] font-semibold text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-md">
                                                            Cupo: {inst.cupo}
                                                        </span>
                                                    )}
                                                    {isSelected && (
                                                        <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })
                                )}
                            </ul>
                        </div>
                    )}

                {/* Resumen de cupo o alerta de cupo lleno */}
                {valorInstitucion && estadoInstitucion && (
                    estadoInstitucion.estaLleno ? (
                        <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/30 flex items-start gap-3 animate-in fade-in duration-200">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-xs font-black uppercase tracking-wide text-red-600 dark:text-red-400">
                                    Cupo Institucional Completo
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    La institución <strong>{valorInstitucion}</strong> ya completó su límite asignado de <strong>{estadoInstitucion.cupoTotal}</strong> participante(s) ({estadoInstitucion.totalInscritos}/{estadoInstitucion.cupoTotal}). Ya no es posible registrar más inscripciones para esta institución.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-foreground">
                                Cupo de su institución:
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-primary font-mono text-sm">
                                    {estadoInstitucion.totalInscritos}{estadoInstitucion.cupoTotal !== null ? ` / ${estadoInstitucion.cupoTotal}` : ''} participantes
                                </span>
                                {estadoInstitucion.cuposDisponibles !== null && (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                                        Quedan {estadoInstitucion.cuposDisponibles} cupo{estadoInstitucion.cuposDisponibles === 1 ? '' : 's'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                )}
            </div>

            {/* 2. CAMPO FECHA — visible si hay institución y tiene cupo */}
            {valorInstitucion && !estadoInstitucion?.estaLleno && (
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
            )}

            {/* 3. CAMPO MESA — solo si la fecha requiere mesas, hay institución y tiene cupo */}
            {valorInstitucion && requiereMesas && !estadoInstitucion?.estaLleno && (
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
