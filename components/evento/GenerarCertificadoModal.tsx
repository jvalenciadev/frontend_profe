'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, X, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2,
    ArrowRight, ArrowLeft, Search, RefreshCw, Users, BookOpen,
    GraduationCap, CheckSquare, Square, ChevronRight, School, Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { toast } from 'sonner';
import { type Evento } from '@/services/eventoService';

// ─── Estructura de Ciclos y Talleres ──────────────────────────────────────────
export interface TallerDef {
    numero: number;
    nombre: string;
}

export interface CicloDef {
    id: number;
    numero: number;
    nivel: 'Primaria' | 'Secundaria';
    nombre: string;
    requisito: string;
    talleres: TallerDef[];
}

export const CICLOS_LIST: CicloDef[] = [
    {
        id: 1,
        numero: 1,
        nivel: 'Primaria',
        nombre: 'Ciclo 1 - Primaria',
        requisito: 'Completar los 3 talleres del Ciclo 1 + Evidencia',
        talleres: [
            { numero: 1, nombre: 'Capacidades comunicativas (lectura y escritura)' },
            { numero: 2, nombre: 'Pensamiento lógico matemático' },
            { numero: 3, nombre: 'Pensamiento científico e investigación' },
        ],
    },
    {
        id: 2,
        numero: 2,
        nivel: 'Primaria',
        nombre: 'Ciclo 2 - Primaria',
        requisito: 'Completar los 3 talleres del Ciclo 2 + Evidencia',
        talleres: [
            { numero: 1, nombre: 'Capacidades comunicativas (lectura y escritura)' },
            { numero: 2, nombre: 'Pensamiento lógico matemático' },
            { numero: 3, nombre: 'Inteligencia Artificial para recursos educativos' },
        ],
    },
    {
        id: 3,
        numero: 3,
        nivel: 'Primaria',
        nombre: 'Ciclo 3 - Primaria',
        requisito: 'Completar los 3 talleres del Ciclo 3 + Evidencia',
        talleres: [
            { numero: 1, nombre: 'Capacidades comunicativas (lectura y escritura)' },
            { numero: 2, nombre: 'Pensamiento lógico matemático' },
            { numero: 3, nombre: 'Dificultades de aprendizaje en el nivel primario' },
        ],
    },
    {
        id: 4,
        numero: 4,
        nivel: 'Secundaria',
        nombre: 'Ciclo 4 - Secundaria',
        requisito: 'Completar los 3 talleres del Ciclo 4 + Evidencia',
        talleres: [
            { numero: 1, nombre: 'Capacidades comunicativas (lectura y escritura)' },
            { numero: 2, nombre: 'Pensamiento lógico matemático' },
            { numero: 3, nombre: 'Neuroeducación de la enseñanza en la EPJA' },
        ],
    },
    {
        id: 5,
        numero: 5,
        nivel: 'Secundaria',
        nombre: 'Ciclo 5 - Secundaria',
        requisito: 'Completar los 3 talleres del Ciclo 5 + Evidencia',
        talleres: [
            { numero: 1, nombre: 'Capacidades comunicativas (lectura y escritura)' },
            { numero: 2, nombre: 'Pensamiento lógico matemático' },
            { numero: 3, nombre: 'Inteligencia Artificial para recursos educativos' },
        ],
    },
    {
        id: 6,
        numero: 6,
        nivel: 'Secundaria',
        nombre: 'Ciclo 6 - Secundaria',
        requisito: 'Completar los 3 talleres del Ciclo 6 + Evidencia',
        talleres: [
            { numero: 1, nombre: 'Estrategias de enseñanza en Física' },
            { numero: 2, nombre: 'Estrategias de enseñanza en Química' },
            { numero: 3, nombre: 'Laboratorios virtuales' },
        ],
    },
];

// Estructura consolidada del participante
export interface ParticipanteTallerInfo {
    inscrito: boolean;
    asistio: boolean;
    inscripcionId?: string;
}

export interface ParticipanteConsolidado {
    ci: string;
    complemento: string;
    nombres: string;
    apellidos: string;
    celular: string;
    correo: string;
    taller1: ParticipanteTallerInfo;
    taller2: ParticipanteTallerInfo;
    taller3: ParticipanteTallerInfo;
    totalInscritos: number;
    totalAsistidos: number;
}

interface GenerarCertificadoModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventosDisponibles: Evento[];
}

export function GenerarCertificadoModal({
    isOpen,
    onClose,
    eventosDisponibles,
}: GenerarCertificadoModalProps) {
    const [mounted, setMounted] = useState(false);
    // Pasos: 1 = Elegir Ciclo, 2 = Asignar Talleres a Eventos, 3 = Consolidado y Generar
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Selección de Ciclo
    const [selectedCiclo, setSelectedCiclo] = useState<CicloDef | null>(null);
    const [filtroNivel, setFiltroNivel] = useState<'TODOS' | 'Primaria' | 'Secundaria'>('TODOS');

    // Mapeo de evento por taller: { 1: eventoId, 2: eventoId, 3: eventoId }
    const [tallerEventos, setTallerEventos] = useState<Record<number, string>>({
        1: '',
        2: '',
        3: '',
    });

    // Carga y consolidación de participantes
    const [loadingConsolidado, setLoadingConsolidado] = useState(false);
    const [participantes, setParticipantes] = useState<ParticipanteConsolidado[]>([]);
    const [rawInscripcionesTaller, setRawInscripcionesTaller] = useState<Record<number, any[]>>({
        1: [],
        2: [],
        3: [],
    });

    // Filtros de la tabla consolidada
    const [searchQuery, setSearchQuery] = useState('');
    const [filtroAsistencia, setFiltroAsistencia] = useState<'TODOS' | 'ASISTIO_3' | 'ASISTIO_2' | 'ASISTIO_1' | 'PENDIENTES'>('TODOS');
    const [modificandoAsistenciaId, setModificandoAsistenciaId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Reset state
            setStep(1);
            setSelectedCiclo(null);
            setTallerEventos({ 1: '', 2: '', 3: '' });
            setParticipantes([]);
            setSearchQuery('');
            setFiltroAsistencia('TODOS');
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Intentar auto-asignar eventos basados en nombres parecidos al seleccionar ciclo
    const handleSelectCiclo = (ciclo: CicloDef) => {
        setSelectedCiclo(ciclo);
        const nuevoMapeo: Record<number, string> = { 1: '', 2: '', 3: '' };

        ciclo.talleres.forEach((taller) => {
            const tallerNombreNorm = taller.nombre.toLowerCase();
            const match = eventosDisponibles.find((e) => {
                const evNorm = (e.nombre || '').toLowerCase();
                return evNorm.includes(tallerNombreNorm) || tallerNombreNorm.includes(evNorm);
            });
            if (match) {
                nuevoMapeo[taller.numero] = match.id;
            }
        });

        setTallerEventos(nuevoMapeo);
        setStep(2);
    };

    // Carga de inscripciones de los 3 eventos asociados
    const handleCargarYConsolidar = async () => {
        if (!tallerEventos[1] && !tallerEventos[2] && !tallerEventos[3]) {
            toast.error('Debe seleccionar al menos un evento para los talleres');
            return;
        }

        setLoadingConsolidado(true);
        try {
            const fetchEventInscripciones = async (eventoId: string) => {
                if (!eventoId) return [];
                try {
                    // Intento 1: exportación sin paginación (rápida)
                    const res = await api.get(`/eventos-inscripciones/export/${eventoId}`);
                    const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
                    if (data && data.length > 0) return data;
                } catch {
                    // Fallback a listado estándar con limit alto
                    try {
                        const resFallback = await api.get('/eventos-inscripciones', {
                            params: { eventoId, limit: 5000, page: 1 },
                        });
                        const dataFallback = Array.isArray(resFallback.data)
                            ? resFallback.data
                            : (resFallback.data?.data ?? []);
                        return dataFallback;
                    } catch (e) {
                        console.error('Error cargando inscripciones de evento:', eventoId, e);
                        return [];
                    }
                }
                return [];
            };

            const [ins1, ins2, ins3] = await Promise.all([
                fetchEventInscripciones(tallerEventos[1]),
                fetchEventInscripciones(tallerEventos[2]),
                fetchEventInscripciones(tallerEventos[3]),
            ]);

            setRawInscripcionesTaller({ 1: ins1, 2: ins2, 3: ins3 });

            // Consolidación por C.I.
            const mapCi: Record<string, ParticipanteConsolidado> = {};

            const procesarInscripciones = (lista: any[], numTaller: 1 | 2 | 3) => {
                lista.forEach((item) => {
                    const persona = item.persona || {};
                    const ci = String(persona.ci || item.ci || '').trim();
                    if (!ci) return;

                    const complemento = persona.complemento || '';
                    const nombres = `${persona.nombre || persona.nombre1 || ''} ${persona.nombre2 || ''}`.trim() || item.nombre || 'Sin Nombre';
                    const apellidos = `${persona.apellidos || ''} ${persona.apellido1 || ''} ${persona.apellido2 || ''}`.trim() || item.apellidos || '';
                    const celular = String(persona.celular || item.celular || '');
                    const correo = String(persona.correo || item.correo || '');
                    const asistio = Boolean(item.asistencia);

                    if (!mapCi[ci]) {
                        mapCi[ci] = {
                            ci,
                            complemento,
                            nombres,
                            apellidos,
                            celular,
                            correo,
                            taller1: { inscrito: false, asistio: false },
                            taller2: { inscrito: false, asistio: false },
                            taller3: { inscrito: false, asistio: false },
                            totalInscritos: 0,
                            totalAsistidos: 0,
                        };
                    }

                    // Asignar al taller correspondiente
                    const tallerKey = `taller${numTaller}` as 'taller1' | 'taller2' | 'taller3';
                    mapCi[ci][tallerKey] = {
                        inscrito: true,
                        asistio,
                        inscripcionId: item.id,
                    };
                });
            };

            procesarInscripciones(ins1, 1);
            procesarInscripciones(ins2, 2);
            procesarInscripciones(ins3, 3);

            // Calcular totales de inscripción y asistencia
            const resultado: ParticipanteConsolidado[] = Object.values(mapCi).map((p) => {
                const totalInscritos = (p.taller1.inscrito ? 1 : 0) + (p.taller2.inscrito ? 1 : 0) + (p.taller3.inscrito ? 1 : 0);
                const totalAsistidos = (p.taller1.asistio ? 1 : 0) + (p.taller2.asistio ? 1 : 0) + (p.taller3.asistio ? 1 : 0);
                return {
                    ...p,
                    totalInscritos,
                    totalAsistidos,
                };
            });

            // Ordenar: primero los que tienen 3 asistencias, luego 2, luego 1
            resultado.sort((a, b) => {
                if (b.totalAsistidos !== a.totalAsistidos) {
                    return b.totalAsistidos - a.totalAsistidos;
                }
                return a.nombres.localeCompare(b.nombres);
            });

            setParticipantes(resultado);
            setStep(3);
            toast.success(`Datos consolidados: ${resultado.length} participantes encontrados`);
        } catch (error) {
            console.error('Error al consolidar participantes:', error);
            toast.error('Error al cargar datos de participantes de los eventos');
        } finally {
            setLoadingConsolidado(false);
        }
    };

    // Marcar asistencia en caliente a través de inscritos
    const handleToggleAsistencia = async (
        ci: string,
        numTaller: 1 | 2 | 3,
        nuevoValor: boolean
    ) => {
        const pIndex = participantes.findIndex((p) => p.ci === ci);
        if (pIndex === -1) return;

        const participante = participantes[pIndex];
        const tallerKey = `taller${numTaller}` as 'taller1' | 'taller2' | 'taller3';
        const tallerInfo = participante[tallerKey];

        if (!tallerInfo.inscripcionId) {
            toast.error('El participante no está inscrito en este taller');
            return;
        }

        setModificandoAsistenciaId(`${ci}-${numTaller}`);
        try {
            await api.patch(`/eventos-inscripciones/${tallerInfo.inscripcionId}`, {
                asistencia: nuevoValor,
            });

            // Actualizar estado local
            setParticipantes((prev) => {
                const copy = [...prev];
                const target = { ...copy[pIndex] };
                const updatedTaller = { ...target[tallerKey], asistio: nuevoValor };
                target[tallerKey] = updatedTaller;

                target.totalAsistidos =
                    (target.taller1.asistio ? 1 : 0) +
                    (target.taller2.asistio ? 1 : 0) +
                    (target.taller3.asistio ? 1 : 0);

                copy[pIndex] = target;
                return copy;
            });

            toast.success(
                nuevoValor
                    ? `Asistencia registrada para ${participante.nombres} en Taller ${numTaller}`
                    : `Asistencia removida para ${participante.nombres} en Taller ${numTaller}`
            );
        } catch (err) {
            console.error('Error al actualizar asistencia:', err);
            toast.error('Error al actualizar el estado de asistencia');
        } finally {
            setModificandoAsistenciaId(null);
        }
    };

    // Estadísticas
    const stats = useMemo(() => {
        const total = participantes.length;
        const asistio3 = participantes.filter((p) => p.totalAsistidos === 3).length;
        const asistio2 = participantes.filter((p) => p.totalAsistidos === 2).length;
        const asistio1 = participantes.filter((p) => p.totalAsistidos === 1).length;
        const asistio0 = participantes.filter((p) => p.totalAsistidos === 0).length;

        const inscritos3 = participantes.filter((p) => p.totalInscritos === 3).length;
        const inscritos2 = participantes.filter((p) => p.totalInscritos === 2).length;
        const inscritos1 = participantes.filter((p) => p.totalInscritos === 1).length;

        return {
            total,
            asistio3,
            asistio2,
            asistio1,
            asistio0,
            inscritos3,
            inscritos2,
            inscritos1,
        };
    }, [participantes]);

    // Filtrado de participantes
    const filteredParticipantes = useMemo(() => {
        return participantes.filter((p) => {
            const matchSearch =
                !searchQuery ||
                p.ci.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.apellidos.toLowerCase().includes(searchQuery.toLowerCase());

            let matchFiltro = true;
            if (filtroAsistencia === 'ASISTIO_3') matchFiltro = p.totalAsistidos === 3;
            else if (filtroAsistencia === 'ASISTIO_2') matchFiltro = p.totalAsistidos === 2;
            else if (filtroAsistencia === 'ASISTIO_1') matchFiltro = p.totalAsistidos === 1;
            else if (filtroAsistencia === 'PENDIENTES')
                matchFiltro = p.totalInscritos === 3 && p.totalAsistidos < 3;

            return matchSearch && matchFiltro;
        });
    }, [participantes, searchQuery, filtroAsistencia]);

    // ── Exportación a Excel de 4 Hojas ──────────────────────────────────────────
    const exportarExcel4Hojas = () => {
        if (!selectedCiclo) return;

        try {
            const wb = XLSX.utils.book_new();

            // 1ra HOJA: CENTRALIZADOR
            // Formato exacto requerido:
            // No | C.I. | COMPLEMENTO | NOMBRES | APELLIDOS | CELULAR | CORREO | ASISTIO 3 TALLERES | URL
            const centralizadorRows = participantes.map((p, idx) => [
                idx + 1,
                p.ci,
                p.complemento || '',
                p.nombres,
                p.apellidos,
                p.celular,
                p.correo,
                p.totalAsistidos === 3 ? 'SI' : 'NO',
                '', // URL con datos vacíos
            ]);

            const wsCentralizador = XLSX.utils.aoa_to_sheet([
                ['No', 'C.I.', 'COMPLEMENTO', 'NOMBRES', 'APELLIDOS', 'CELULAR', 'CORREO', 'ASISTIO 3 TALLERES', 'URL'],
                ...centralizadorRows,
            ]);
            // Anchos de columna
            wsCentralizador['!cols'] = [
                { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(wb, wsCentralizador, 'Centralizador');

            // Función para generar hoja por taller
            // No | C.I. | COMPLEMENTO | NOMBRES | APELLIDOS | CELULAR | CORREO | ASISTENCIA
            const generarHojaTaller = (numTaller: 1 | 2 | 3, sheetName: string) => {
                const tallerKey = `taller${numTaller}` as 'taller1' | 'taller2' | 'taller3';
                const listaTaller = participantes.filter((p) => p[tallerKey].inscrito);

                const rows = listaTaller.map((p, idx) => [
                    idx + 1,
                    p.ci,
                    p.complemento || '',
                    p.nombres,
                    p.apellidos,
                    p.celular,
                    p.correo,
                    p[tallerKey].asistio ? 'PRESENTE' : 'AUSENTE',
                ]);

                const ws = XLSX.utils.aoa_to_sheet([
                    ['No', 'C.I.', 'COMPLEMENTO', 'NOMBRES', 'APELLIDOS', 'CELULAR', 'CORREO', 'ASISTENCIA'],
                    ...rows,
                ]);
                ws['!cols'] = [
                    { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 14 }, { wch: 28 }, { wch: 15 }
                ];
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            };

            // 2da HOJA: Taller 1
            generarHojaTaller(1, 'Taller 1');

            // 3ra HOJA: Taller 2
            generarHojaTaller(2, 'Taller 2');

            // 4ta HOJA: Taller 3
            generarHojaTaller(3, 'Taller 3');

            const nombreArchivo = `Certificados_${selectedCiclo.nombre.replace(/[\s-]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, nombreArchivo);

            toast.success(`Excel con 4 hojas generado y descargado: ${nombreArchivo}`);
        } catch (error) {
            console.error('Error al exportar Excel:', error);
            toast.error('Error al generar el libro de Excel');
        }
    };

    if (!mounted || !isOpen) return null;

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
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
                    className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-card border border-border/80 shadow-2xl rounded-3xl overflow-hidden z-10 my-auto text-foreground"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                                <Award className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                                    Generar Certificado por Ciclo
                                </h2>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {step === 1 && 'Paso 1: Antes de generar seleccione a qué ciclo pertenece'}
                                    {step === 2 && `Paso 2: Asignar Eventos a los Talleres de ${selectedCiclo?.nombre}`}
                                    {step === 3 && `Paso 3: Consolidado de Asistencias & Exportación Excel (4 Hojas)`}
                                </p>
                            </div>
                        </div>

                        {/* Stepper Pills */}
                        <div className="hidden sm:flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-2xl border border-border">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${step === 1 ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                                1. Ciclo
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${step === 2 ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                                2. Talleres
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${step === 3 ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                                3. Consolidado
                            </span>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body Content */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-6">

                        {/* ── PASO 1: SELECCIONAR CICLO ────────────────────────────────────── */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-foreground">
                                                Antes de generar seleccione a qué ciclo pertenece:
                                            </p>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                Cada ciclo contempla 3 talleres específicos obligatorios + evidencia para la emisión de certificación.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-background p-1 rounded-xl border border-border">
                                        {(['TODOS', 'Primaria', 'Secundaria'] as const).map((nivel) => (
                                            <button
                                                key={nivel}
                                                type="button"
                                                onClick={() => setFiltroNivel(nivel)}
                                                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                                    filtroNivel === nivel
                                                        ? 'bg-amber-500 text-white shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {nivel}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {CICLOS_LIST
                                        .filter((c) => filtroNivel === 'TODOS' || c.nivel === filtroNivel)
                                        .map((ciclo) => {
                                            const isSelected = selectedCiclo?.id === ciclo.id;
                                            return (
                                                <div
                                                    key={ciclo.id}
                                                    onClick={() => handleSelectCiclo(ciclo)}
                                                    className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                                        isSelected
                                                            ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                                                            : 'border-border/80 bg-card hover:border-amber-500/50 hover:bg-muted/20'
                                                    }`}
                                                >
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/20">
                                                                {ciclo.nivel}
                                                            </span>
                                                            <span className="text-[11px] font-black text-muted-foreground">
                                                                3 Talleres
                                                            </span>
                                                        </div>

                                                        <h3 className="text-base font-black text-foreground group-hover:text-amber-500 transition-colors">
                                                            {ciclo.nombre}
                                                        </h3>

                                                        <div className="space-y-2 pt-2 border-t border-border/40">
                                                            {ciclo.talleres.map((t) => (
                                                                <div key={t.numero} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                                    <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground shrink-0 mt-0.5">
                                                                        {t.numero}
                                                                    </span>
                                                                    <span className="font-medium text-foreground/90">{t.nombre}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                                                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                                                            {ciclo.requisito}
                                                        </p>
                                                        <span className="w-8 h-8 rounded-xl bg-amber-500/20 group-hover:bg-amber-500 group-hover:text-white text-amber-500 flex items-center justify-center transition-all">
                                                            <ArrowRight className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* ── PASO 2: ASIGNAR TALLERES A EVENTOS ────────────────────────────── */}
                        {step === 2 && selectedCiclo && (
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary">
                                            {selectedCiclo.nivel}
                                        </span>
                                        <h3 className="text-lg font-black text-foreground mt-1">
                                            {selectedCiclo.nombre}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            Vincule a qué evento del sistema corresponde cada uno de los 3 talleres obligatorios.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Cambiar Ciclo
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {selectedCiclo.talleres.map((taller) => {
                                        const evSeleccionado = eventosDisponibles.find(
                                            (e) => e.id === tallerEventos[taller.numero]
                                        );

                                        return (
                                            <div
                                                key={taller.numero}
                                                className="p-5 rounded-2xl border border-border bg-card/60 space-y-3"
                                            >
                                                <div className="flex items-center justify-between flex-wrap gap-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-black">
                                                            {taller.numero}
                                                        </span>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                                                                Taller {taller.numero}
                                                            </p>
                                                            <h4 className="text-sm font-bold text-foreground">
                                                                {taller.nombre}
                                                            </h4>
                                                        </div>
                                                    </div>

                                                    {evSeleccionado && (
                                                        <div className="flex items-center gap-3 text-xs bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60">
                                                            <span className="text-muted-foreground font-medium">
                                                                Inscritos: <strong className="text-foreground">{evSeleccionado.inscritos || 0}</strong>
                                                            </span>
                                                            <span className="text-muted-foreground font-medium">
                                                                Asistidos: <strong className="text-foreground">{evSeleccionado.asistidos || 0}</strong>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <select
                                                        value={tallerEventos[taller.numero] || ''}
                                                        onChange={(e) =>
                                                            setTallerEventos((prev) => ({
                                                                ...prev,
                                                                [taller.numero]: e.target.value,
                                                            }))
                                                        }
                                                        className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-amber-500 text-xs font-bold text-foreground outline-none transition-all"
                                                    >
                                                        <option value="">-- Seleccionar evento que corresponde a este taller --</option>
                                                        {eventosDisponibles.map((ev) => (
                                                            <option key={ev.id} value={ev.id}>
                                                                {ev.nombre} ({ev.fecha ? ev.fecha.slice(0, 10) : 'Sin fecha'}) — {ev.inscritos || 0} inscritos
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-4 border-t border-border flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-5 h-11 rounded-xl bg-card border border-border text-xs font-black uppercase tracking-wider hover:bg-muted/30 transition-all flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Volver a Ciclos
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCargarYConsolidar}
                                        disabled={loadingConsolidado || (!tallerEventos[1] && !tallerEventos[2] && !tallerEventos[3])}
                                        className="px-6 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-black uppercase tracking-wider hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-2.5 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {loadingConsolidado ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Consolidando Asistencias...
                                            </>
                                        ) : (
                                            <>
                                                Revisar Asistencias e Inscripciones <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── PASO 3: CONSOLIDADO, MARCAR ASISTENCIA Y EXPORTAR EXCEL ────────── */}
                        {step === 3 && selectedCiclo && (
                            <div className="space-y-6">
                                {/* Banner de Ciclo y Estadísticas */}
                                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-500">
                                                {selectedCiclo.nivel}
                                            </span>
                                            <h3 className="text-xl font-black text-foreground mt-1">
                                                Consolidado: {selectedCiclo.nombre}
                                            </h3>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                Participantes registrados en los 3 talleres del ciclo. Puede marcar asistencia a los talleres faltantes directamente desde esta lista.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleCargarYConsolidar}
                                                disabled={loadingConsolidado}
                                                className="px-4 h-11 rounded-xl bg-card border border-border text-xs font-black uppercase tracking-wider hover:bg-muted/40 transition-all flex items-center gap-2"
                                                title="Recargar datos de asistencia"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${loadingConsolidado ? 'animate-spin' : ''}`} />
                                                Actualizar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={exportarExcel4Hojas}
                                                className="px-6 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-lg shadow-green-600/20 active:scale-95"
                                            >
                                                <FileSpreadsheet className="w-4 h-4" />
                                                Generar Excel (4 Hojas)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Resumen de Asistencias e Inscripciones */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/50">
                                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                                                Asistió a 3 Talleres (Aptos)
                                            </p>
                                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                {stats.asistio3}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground font-semibold">
                                                Completaron el ciclo
                                            </span>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                                                Asistió a 2 Talleres
                                            </p>
                                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                                                {stats.asistio2}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground font-semibold">
                                                Falta 1 asistencia
                                            </span>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">
                                                Asistió a 1 Taller
                                            </p>
                                            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                                                {stats.asistio1}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground font-semibold">
                                                Faltan 2 asistencias
                                            </span>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                                                Inscritos a los 3
                                            </p>
                                            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                                                {stats.inscritos3}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground font-semibold">
                                                Total en el ciclo: {stats.total}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de Filtros y Búsqueda */}
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="relative flex-1 min-w-[260px]">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Buscar por C.I. o Nombre del participante..."
                                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-xs font-medium outline-none focus:border-amber-500 transition-all"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl border border-border flex-wrap">
                                        {[
                                            { id: 'TODOS', label: `Todos (${stats.total})` },
                                            { id: 'ASISTIO_3', label: `Asistió a 3 (${stats.asistio3})` },
                                            { id: 'ASISTIO_2', label: `Asistió a 2 (${stats.asistio2})` },
                                            { id: 'ASISTIO_1', label: `Asistió a 1 (${stats.asistio1})` },
                                            { id: 'PENDIENTES', label: `Inscrito a 3 con falta` },
                                        ].map((f) => (
                                            <button
                                                key={f.id}
                                                type="button"
                                                onClick={() => setFiltroAsistencia(f.id as any)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                                    filtroAsistencia === f.id
                                                        ? 'bg-amber-500 text-white shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tabla Consolidada de Participantes */}
                                <div className="border border-border rounded-2xl overflow-hidden bg-card">
                                    <div className="overflow-x-auto max-h-[460px]">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead className="sticky top-0 bg-muted/90 backdrop-blur-md border-b border-border z-10">
                                                <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                    <th className="py-3 px-3 w-12 text-center">No</th>
                                                    <th className="py-3 px-3">C.I.</th>
                                                    <th className="py-3 px-4">Participante</th>
                                                    <th className="py-3 px-3 text-center">Taller 1</th>
                                                    <th className="py-3 px-3 text-center">Taller 2</th>
                                                    <th className="py-3 px-3 text-center">Taller 3</th>
                                                    <th className="py-3 px-3 text-center">Inscrito</th>
                                                    <th className="py-3 px-3 text-center">Asistencias</th>
                                                    <th className="py-3 px-3 text-center">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/60 font-medium">
                                                {filteredParticipantes.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="py-8 text-center text-muted-foreground">
                                                            No se encontraron participantes con los filtros seleccionados
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredParticipantes.map((p, idx) => {
                                                        const isApto = p.totalAsistidos === 3;

                                                        return (
                                                            <tr
                                                                key={p.ci}
                                                                className={`hover:bg-muted/30 transition-colors ${
                                                                    isApto ? 'bg-emerald-500/[0.02]' : ''
                                                                }`}
                                                            >
                                                                <td className="py-2.5 px-3 text-center text-muted-foreground text-[11px] font-bold">
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                                                                    {p.ci}
                                                                    {p.complemento && (
                                                                        <span className="ml-1 text-[10px] text-muted-foreground">
                                                                            -{p.complemento}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2.5 px-4">
                                                                    <div className="font-bold text-foreground">
                                                                        {p.nombres} {p.apellidos}
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground">
                                                                        {p.celular ? `Cel: ${p.celular}` : ''}{' '}
                                                                        {p.correo ? `• ${p.correo}` : ''}
                                                                    </div>
                                                                </td>

                                                                {/* TALLER 1 */}
                                                                <td className="py-2.5 px-3 text-center">
                                                                    {p.taller1.inscrito ? (
                                                                        <button
                                                                            type="button"
                                                                            disabled={modificandoAsistenciaId === `${p.ci}-1`}
                                                                            onClick={() =>
                                                                                handleToggleAsistencia(p.ci, 1, !p.taller1.asistio)
                                                                            }
                                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                                                                p.taller1.asistio
                                                                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                                                                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                                                                            }`}
                                                                            title="Haz clic para marcar o desmarcar asistencia"
                                                                        >
                                                                            {p.taller1.asistio ? (
                                                                                <>
                                                                                    <CheckCircle2 className="w-3 h-3" /> Asistió
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Square className="w-3 h-3" /> Falta
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-[10px] text-muted-foreground italic">
                                                                            No Inscrito
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* TALLER 2 */}
                                                                <td className="py-2.5 px-3 text-center">
                                                                    {p.taller2.inscrito ? (
                                                                        <button
                                                                            type="button"
                                                                            disabled={modificandoAsistenciaId === `${p.ci}-2`}
                                                                            onClick={() =>
                                                                                handleToggleAsistencia(p.ci, 2, !p.taller2.asistio)
                                                                            }
                                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                                                                p.taller2.asistio
                                                                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                                                                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                                                                            }`}
                                                                            title="Haz clic para marcar o desmarcar asistencia"
                                                                        >
                                                                            {p.taller2.asistio ? (
                                                                                <>
                                                                                    <CheckCircle2 className="w-3 h-3" /> Asistió
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Square className="w-3 h-3" /> Falta
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-[10px] text-muted-foreground italic">
                                                                            No Inscrito
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* TALLER 3 */}
                                                                <td className="py-2.5 px-3 text-center">
                                                                    {p.taller3.inscrito ? (
                                                                        <button
                                                                            type="button"
                                                                            disabled={modificandoAsistenciaId === `${p.ci}-3`}
                                                                            onClick={() =>
                                                                                handleToggleAsistencia(p.ci, 3, !p.taller3.asistio)
                                                                            }
                                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                                                                p.taller3.asistio
                                                                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                                                                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                                                                            }`}
                                                                            title="Haz clic para marcar o desmarcar asistencia"
                                                                        >
                                                                            {p.taller3.asistio ? (
                                                                                <>
                                                                                    <CheckCircle2 className="w-3 h-3" /> Asistió
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Square className="w-3 h-3" /> Falta
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-[10px] text-muted-foreground italic">
                                                                            No Inscrito
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* TOTAL INSCRITOS */}
                                                                <td className="py-2.5 px-3 text-center">
                                                                    <span className="font-bold text-foreground">
                                                                        {p.totalInscritos} / 3
                                                                    </span>
                                                                </td>

                                                                {/* TOTAL ASISTIDOS */}
                                                                <td className="py-2.5 px-3 text-center">
                                                                    <span
                                                                        className={`inline-block px-2.5 py-1 rounded-lg font-black text-[11px] ${
                                                                            p.totalAsistidos === 3
                                                                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                                                : p.totalAsistidos === 2
                                                                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                                                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                                                        }`}
                                                                    >
                                                                        asistio a {p.totalAsistidos}
                                                                    </span>
                                                                </td>

                                                                {/* ESTADO DE CERTIFICADO */}
                                                                <td className="py-2.5 px-3 text-center">
                                                                    {isApto ? (
                                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white">
                                                                            APTO (3/3)
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-muted text-muted-foreground">
                                                                            PENDIENTE
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Footer con acciones */}
                                <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="px-5 h-11 rounded-xl bg-card border border-border text-xs font-black uppercase tracking-wider hover:bg-muted/30 transition-all flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Volver a Talleres
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={exportarExcel4Hojas}
                                            className="px-6 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-lg shadow-green-600/20 active:scale-95"
                                        >
                                            <FileSpreadsheet className="w-4 h-4" />
                                            Generar Excel (Centralizador + 3 Talleres)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
