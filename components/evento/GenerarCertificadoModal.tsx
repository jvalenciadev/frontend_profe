'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, X, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2,
    ArrowRight, ArrowLeft, Search, RefreshCw, Users, BookOpen,
    GraduationCap, CheckSquare, Square, ChevronRight, School, Sparkles,
    Calendar, Check, ChevronDown, ChevronUp, AlertTriangle, Lock, Link2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { eventoService, type Evento } from '@/services/eventoService';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/ConfirmModal';

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
    eventoId?: string;
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
    onEventosUpdated?: () => void;
}

export function GenerarCertificadoModal({
    isOpen,
    onClose,
    eventosDisponibles,
    onEventosUpdated,
}: GenerarCertificadoModalProps) {
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Selección de Ciclo
    const [selectedCiclo, setSelectedCiclo] = useState<CicloDef | null>(null);
    const [filtroNivel, setFiltroNivel] = useState<'TODOS' | 'Primaria' | 'Secundaria'>('TODOS');

    // FILTRO ESTRICTO: Solo eventos NO finalizados (estado === 'activo')
    const eventosActivos = useMemo(() => {
        return (eventosDisponibles || []).filter((e) => {
            const est = (e.estado || '').toLowerCase().trim();
            return est === 'activo';
        });
    }, [eventosDisponibles]);

    // Mapeo MÚLTIPLE de eventos por taller: { 1: string[], 2: string[], 3: string[] }
    const [tallerEventos, setTallerEventos] = useState<Record<number, string[]>>({
        1: [],
        2: [],
        3: [],
    });

    // Filtros de búsqueda en la selección de eventos del paso 2
    const [searchTaller, setSearchTaller] = useState<Record<number, string>>({
        1: '',
        2: '',
        3: '',
    });
    const [tallerOpenAccordion, setTallerOpenAccordion] = useState<Record<number, boolean>>({
        1: true,
        2: false,
        3: false,
    });

    // Carga y consolidación de participantes
    const [loadingConsolidado, setLoadingConsolidado] = useState(false);
    const [participantes, setParticipantes] = useState<ParticipanteConsolidado[]>([]);

    // Filtros de la tabla consolidada
    const [searchQuery, setSearchQuery] = useState('');
    const [filtroAsistencia, setFiltroAsistencia] = useState<'TODOS' | 'ASISTIO_3' | 'ASISTIO_2' | 'ASISTIO_1' | 'PENDIENTES'>('TODOS');
    const [modificandoAsistenciaId, setModificandoAsistenciaId] = useState<string | null>(null);

    // Modal de Confirmación para Finalizar Eventos y Generar Excel
    const [isConfirmingExcel, setIsConfirmingExcel] = useState(false);
    const [finalizandoEventos, setFinalizandoEventos] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setStep(1);
            setSelectedCiclo(null);
            setTallerEventos({ 1: [], 2: [], 3: [] });
            setSearchTaller({ 1: '', 2: '', 3: '' });
            setTallerOpenAccordion({ 1: true, 2: false, 3: false });
            setParticipantes([]);
            setSearchQuery('');
            setFiltroAsistencia('TODOS');
            setIsConfirmingExcel(false);
            setFinalizandoEventos(false);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Seleccionar ciclo y auto-sugerir únicamente eventos ACTIVOS con nombres coincidentes
    const handleSelectCiclo = (ciclo: CicloDef) => {
        setSelectedCiclo(ciclo);
        const nuevoMapeo: Record<number, string[]> = { 1: [], 2: [], 3: [] };

        ciclo.talleres.forEach((taller) => {
            const tallerNombreNorm = taller.nombre.toLowerCase();
            const matches = eventosActivos
                .filter((e) => {
                    const evNorm = (e.nombre || '').toLowerCase();
                    return evNorm.includes(tallerNombreNorm) || tallerNombreNorm.includes(evNorm);
                })
                .map((e) => e.id);
            nuevoMapeo[taller.numero] = matches;
        });

        setTallerEventos(nuevoMapeo);
        setStep(2);
    };

    // Alternar selección de un evento dentro de un taller específico
    const toggleEventoEnTaller = (numTaller: number, eventoId: string) => {
        setTallerEventos((prev) => {
            const actuales = prev[numTaller] || [];
            const existe = actuales.includes(eventoId);
            const actualizados = existe
                ? actuales.filter((id) => id !== eventoId)
                : [...actuales, eventoId];
            return {
                ...prev,
                [numTaller]: actualizados,
            };
        });
    };

    // Seleccionar o deseleccionar todos los eventos filtrados para un taller
    const toggleTodosVisiblesEnTaller = (numTaller: number, eventosIdsVisibles: string[]) => {
        setTallerEventos((prev) => {
            const actuales = prev[numTaller] || [];
            const todosSeleccionados = eventosIdsVisibles.every((id) => actuales.includes(id));
            let actualizados: string[];
            if (todosSeleccionados) {
                actualizados = actuales.filter((id) => !eventosIdsVisibles.includes(id));
            } else {
                actualizados = Array.from(new Set([...actuales, ...eventosIdsVisibles]));
            }
            return {
                ...prev,
                [numTaller]: actualizados,
            };
        });
    };

    // Resumen de eventos únicos seleccionados en total
    const totalEventosSeleccionados = useMemo(() => {
        const setIds = new Set<string>();
        (tallerEventos[1] || []).forEach((id) => setIds.add(id));
        (tallerEventos[2] || []).forEach((id) => setIds.add(id));
        (tallerEventos[3] || []).forEach((id) => setIds.add(id));
        return setIds;
    }, [tallerEventos]);

    // Lista detallada de eve_codigo y URLs vinculadas por taller
    const listaEventosAsignadosConDetalle = useMemo(() => {
        if (!selectedCiclo) return [];

        const items: {
            tallerNumero: number;
            tallerNombre: string;
            eventoId: string;
            nombre: string;
            codigo: string;
            url: string;
            inscritos: number;
            asistidos: number;
            estado: string;
        }[] = [];

        selectedCiclo.talleres.forEach((taller) => {
            const ids = tallerEventos[taller.numero] || [];
            ids.forEach((id) => {
                const ev = eventosDisponibles.find((e) => e.id === id);
                if (ev) {
                    const cod = ev.codigo || ev.id;
                    items.push({
                        tallerNumero: taller.numero,
                        tallerNombre: taller.nombre,
                        eventoId: ev.id,
                        nombre: ev.nombre,
                        codigo: cod,
                        url: `/evento/${cod}`,
                        inscritos: ev.inscritos || 0,
                        asistidos: ev.asistidos || 0,
                        estado: ev.estado || 'activo',
                    });
                }
            });
        });

        return items;
    }, [selectedCiclo, tallerEventos, eventosDisponibles]);

    // Carga de inscripciones de TODOS los eventos seleccionados en los 3 talleres
    const handleCargarYConsolidar = async () => {
        const total = (tallerEventos[1]?.length || 0) + (tallerEventos[2]?.length || 0) + (tallerEventos[3]?.length || 0);
        if (total === 0) {
            toast.error('Debe seleccionar al menos un evento activo en alguno de los talleres');
            return;
        }

        setLoadingConsolidado(true);
        try {
            const fetchEventInscripciones = async (eventoId: string) => {
                if (!eventoId) return [];
                try {
                    const res = await api.get(`/eventos-inscripciones/export/${eventoId}`);
                    const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
                    if (data && data.length > 0) return data;
                } catch {
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

            // Cargar en paralelo todas las inscripciones por taller
            const [listasTaller1, listasTaller2, listasTaller3] = await Promise.all([
                Promise.all((tallerEventos[1] || []).map((id) => fetchEventInscripciones(id))),
                Promise.all((tallerEventos[2] || []).map((id) => fetchEventInscripciones(id))),
                Promise.all((tallerEventos[3] || []).map((id) => fetchEventInscripciones(id))),
            ]);

            const ins1 = listasTaller1.flat();
            const ins2 = listasTaller2.flat();
            const ins3 = listasTaller3.flat();

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

                    const tallerKey = `taller${numTaller}` as 'taller1' | 'taller2' | 'taller3';
                    const prevInfo = mapCi[ci][tallerKey];

                    mapCi[ci][tallerKey] = {
                        inscrito: true,
                        asistio: prevInfo.asistio || asistio,
                        inscripcionId: item.id || prevInfo.inscripcionId,
                        eventoId: item.eventoId || prevInfo.eventoId,
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

            resultado.sort((a, b) => {
                if (b.totalAsistidos !== a.totalAsistidos) {
                    return b.totalAsistidos - a.totalAsistidos;
                }
                return a.nombres.localeCompare(b.nombres);
            });

            setParticipantes(resultado);
            setStep(3);
            toast.success(`Datos consolidados de ${total} eventos activos: ${resultado.length} participantes únicos encontrados`);
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

    // ── Exportación a Excel de 4 Hojas + Hoja de Trazabilidad URLs ───────────────
    const ejecutarGeneracionExcelYFinalizar = async () => {
        if (!selectedCiclo) return;

        setFinalizandoEventos(true);
        try {
            // 1. Cambiar estado a 'finalizado' para todos los eventos seleccionados
            const uniqueEventIds = Array.from(totalEventosSeleccionados);
            if (uniqueEventIds.length > 0) {
                const toastCloseId = toast.loading(`Finalizando ${uniqueEventIds.length} eventos y cerrando URLs...`);
                await Promise.all(
                    uniqueEventIds.map((id) =>
                        eventoService.update(id, {
                            estado: 'finalizado',
                            inscripcionAbierta: false,
                        })
                    )
                );
                toast.dismiss(toastCloseId);
            }

            // 2. Construir el Excel con las hojas requeridas
            const wb = XLSX.utils.book_new();

            // 1ra HOJA: CENTRALIZADOR
            const centralizadorRows = participantes.map((p, idx) => [
                idx + 1,
                p.ci,
                p.complemento || '',
                p.nombres,
                p.apellidos,
                p.celular,
                p.correo,
                p.totalAsistidos === 3 ? 'SI' : 'NO',
                '', // URL con datos vacíos tal como fue solicitado
            ]);

            const wsCentralizador = XLSX.utils.aoa_to_sheet([
                ['No', 'C.I.', 'COMPLEMENTO', 'NOMBRES', 'APELLIDOS', 'CELULAR', 'CORREO', 'ASISTIO 3 TALLERES', 'URL'],
                ...centralizadorRows,
            ]);
            wsCentralizador['!cols'] = [
                { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(wb, wsCentralizador, 'Centralizador');

            // Función para generar hoja por taller
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

            // 5ta HOJA: Trazabilidad de eve_codigo y URLs utilizadas
            const rowsUrls = listaEventosAsignadosConDetalle.map((item, idx) => [
                idx + 1,
                `Taller ${item.tallerNumero}`,
                item.tallerNombre,
                item.codigo,
                item.url,
                item.nombre,
                item.inscritos,
                item.asistidos,
                'finalizado',
            ]);

            const wsUrls = XLSX.utils.aoa_to_sheet([
                ['No', 'TALLER', 'TALLER_NOMBRE', 'EVE_CODIGO', 'URL', 'NOMBRE_EVENTO', 'INSCRITOS', 'ASISTIDOS', 'ESTADO_FINAL'],
                ...rowsUrls,
            ]);
            wsUrls['!cols'] = [
                { wch: 6 }, { wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 28 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(wb, wsUrls, 'URLs_Eventos');

            const nombreArchivo = `Certificados_${selectedCiclo.nombre.replace(/[\s-]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, nombreArchivo);

            toast.success(`Excel generado y descargado exitosamente. Se finalizaron ${uniqueEventIds.length} eventos.`);
            setIsConfirmingExcel(false);

            if (onEventosUpdated) {
                onEventosUpdated();
            }
        } catch (error) {
            console.error('Error al generar Excel o finalizar eventos:', error);
            toast.error('Ocurrió un error al finalizar los eventos o generar el Excel');
        } finally {
            setFinalizandoEventos(false);
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
                                    {step === 2 && `Paso 2: Asignar Eventos Activos a los Talleres de ${selectedCiclo?.nombre} (${totalEventosSeleccionados.size} eventos seleccionados)`}
                                    {step === 3 && `Paso 3: Consolidado de Asistencias & Exportación Excel (4 Hojas + URLs)`}
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
                                2. Talleres ({totalEventosSeleccionados.size})
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
                                                Solo se mostrarán eventos en estado <span className="font-bold text-amber-500 uppercase">Activo</span> (los finalizados quedan excluidos automáticamente).
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

                        {/* ── PASO 2: ASIGNAR MÚLTIPLES EVENTOS ACTIVOS A LOS TALLERES ─────── */}
                        {step === 2 && selectedCiclo && (
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary">
                                                {selectedCiclo.nivel}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                                Solo Eventos Activos ({eventosActivos.length} disponibles)
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-500">
                                                {totalEventosSeleccionados.size} seleccionados
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-foreground mt-1">
                                            {selectedCiclo.nombre}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            Seleccione uno o más eventos activos para cada taller. Podrá visualizar el código de evento (<code>eve_codigo</code>) y su URL pública.
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
                                        const seleccionadosIds = tallerEventos[taller.numero] || [];
                                        const busqueda = (searchTaller[taller.numero] || '').toLowerCase();
                                        const isOpenAccordion = tallerOpenAccordion[taller.numero] ?? false;

                                        // Filtrar ÚNICAMENTE sobre eventosActivos
                                        const eventosFiltrados = eventosActivos.filter((e) => {
                                            if (!busqueda) return true;
                                            const nom = (e.nombre || '').toLowerCase();
                                            const lug = (e.lugar || '').toLowerCase();
                                            const cod = (e.codigo || '').toLowerCase();
                                            return nom.includes(busqueda) || lug.includes(busqueda) || cod.includes(busqueda);
                                        });

                                        const eventosSeleccionadosObjs = eventosActivos.filter((e) =>
                                            seleccionadosIds.includes(e.id)
                                        );
                                        const sumaInscritos = eventosSeleccionadosObjs.reduce(
                                            (acc, e) => acc + (e.inscritos || 0),
                                            0
                                        );
                                        const sumaAsistidos = eventosSeleccionadosObjs.reduce(
                                            (acc, e) => acc + (e.asistidos || 0),
                                            0
                                        );

                                        return (
                                            <div
                                                key={taller.numero}
                                                className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs"
                                            >
                                                {/* Header del Taller */}
                                                <div
                                                    onClick={() =>
                                                        setTallerOpenAccordion((prev) => ({
                                                            ...prev,
                                                            [taller.numero]: !isOpenAccordion,
                                                        }))
                                                    }
                                                    className="p-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between flex-wrap gap-3 border-b border-border/50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                                                            {taller.numero}
                                                        </span>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                                                                    Taller {taller.numero}
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                                                                    {seleccionadosIds.length} eventos asignados
                                                                </span>
                                                            </div>
                                                            <h4 className="text-sm font-bold text-foreground">
                                                                {taller.nombre}
                                                            </h4>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2 text-xs bg-card px-3 py-1.5 rounded-xl border border-border">
                                                            <span className="text-muted-foreground font-medium">
                                                                Inscritos: <strong className="text-foreground">{sumaInscritos}</strong>
                                                            </span>
                                                            <span className="text-muted-foreground font-medium">
                                                                • Asistidos: <strong className="text-foreground">{sumaAsistidos}</strong>
                                                            </span>
                                                        </div>
                                                        <span className="text-muted-foreground">
                                                            {isOpenAccordion ? (
                                                                <ChevronUp className="w-5 h-5" />
                                                            ) : (
                                                                <ChevronDown className="w-5 h-5" />
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Contenido Desplegable: Buscador y Checklist de Eventos */}
                                                {isOpenAccordion && (
                                                    <div className="p-4 space-y-4">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <div className="relative flex-1 min-w-[220px]">
                                                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                                <input
                                                                    type="text"
                                                                    value={searchTaller[taller.numero] || ''}
                                                                    onChange={(e) =>
                                                                        setSearchTaller((prev) => ({
                                                                            ...prev,
                                                                            [taller.numero]: e.target.value,
                                                                        }))
                                                                    }
                                                                    placeholder={`Buscar evento activo por nombre o eve_codigo...`}
                                                                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-background border border-border text-xs font-medium outline-none focus:border-amber-500 transition-all"
                                                                />
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleTodosVisiblesEnTaller(
                                                                        taller.numero,
                                                                        eventosFiltrados.map((e) => e.id)
                                                                    )
                                                                }
                                                                className="h-10 px-4 rounded-xl bg-background border border-border hover:border-amber-500/50 text-xs font-bold text-foreground flex items-center gap-2 transition-all shrink-0"
                                                            >
                                                                <CheckSquare className="w-4 h-4 text-amber-500" />
                                                                {eventosFiltrados.every((e) => seleccionadosIds.includes(e.id))
                                                                    ? 'Deseleccionar visibles'
                                                                    : 'Seleccionar todos los visibles'}
                                                            </button>
                                                        </div>

                                                        {/* Lista de Eventos con eve_codigo y URL */}
                                                        <div className="max-h-60 overflow-y-auto border border-border/80 rounded-xl divide-y divide-border/60 bg-background/50">
                                                            {eventosFiltrados.length === 0 ? (
                                                                <div className="p-6 text-center text-xs text-muted-foreground">
                                                                    No hay eventos activos que coincidan con la búsqueda.
                                                                </div>
                                                            ) : (
                                                                eventosFiltrados.map((ev) => {
                                                                    const isSelected = seleccionadosIds.includes(ev.id);
                                                                    const cod = ev.codigo || ev.id;
                                                                    return (
                                                                        <label
                                                                            key={ev.id}
                                                                            className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/40 transition-colors text-xs ${
                                                                                isSelected ? 'bg-amber-500/10' : ''
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isSelected}
                                                                                    onChange={() =>
                                                                                        toggleEventoEnTaller(taller.numero, ev.id)
                                                                                    }
                                                                                    className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                                                                                />
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="font-bold text-foreground">
                                                                                            {ev.nombre}
                                                                                        </p>
                                                                                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                                                                            {cod}
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                                        URL: <span className="font-mono text-muted-foreground">/evento/{cod}</span>
                                                                                        {ev.fecha ? ` • Fecha: ${ev.fecha.slice(0, 10)}` : ''}
                                                                                        {ev.lugar ? ` • Lugar: ${ev.lugar}` : ''}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center gap-2 shrink-0">
                                                                                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                                                                                    {ev.inscritos || 0} inscritos
                                                                                </span>
                                                                                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                                                    {ev.asistidos || 0} asistidos
                                                                                </span>
                                                                            </div>
                                                                        </label>
                                                                    );
                                                                })
                                                            )}
                                                        </div>

                                                        {/* Chips de Eventos Seleccionados con eve_codigo */}
                                                        {eventosSeleccionadosObjs.length > 0 && (
                                                            <div className="pt-2">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                                                    Eventos activos asignados a Taller {taller.numero} ({eventosSeleccionadosObjs.length}):
                                                                </p>
                                                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                                                    {eventosSeleccionadosObjs.map((ev) => (
                                                                        <span
                                                                            key={ev.id}
                                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-foreground"
                                                                        >
                                                                            <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
                                                                                [{ev.codigo || ev.id}]
                                                                            </span>
                                                                            <span className="truncate max-w-[180px]">{ev.nombre}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    toggleEventoEnTaller(taller.numero, ev.id)
                                                                                }
                                                                                className="hover:text-red-500 transition-colors ml-0.5"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                                        disabled={loadingConsolidado || totalEventosSeleccionados.size === 0}
                                        className="px-6 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-black uppercase tracking-wider hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-2.5 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {loadingConsolidado ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Consolidando Asistencias de {totalEventosSeleccionados.size} eventos...
                                            </>
                                        ) : (
                                            <>
                                                Revisar Asistencias e Inscripciones ({totalEventosSeleccionados.size} eventos) <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── PASO 3: CONSOLIDADO, LISTA DE EVE_CODIGO/URLS Y GENERAR ───────── */}
                        {step === 3 && selectedCiclo && (
                            <div className="space-y-6">
                                {/* Banner de Ciclo y Estadísticas */}
                                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-500">
                                                    {selectedCiclo.nivel}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary">
                                                    {totalEventosSeleccionados.size} eventos consolidados
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-foreground mt-1">
                                                Consolidado: {selectedCiclo.nombre}
                                            </h3>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                Participantes registrados en los talleres del ciclo. Puede marcar asistencia a los talleres faltantes directamente desde esta lista antes de generar el Excel.
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
                                                onClick={() => setIsConfirmingExcel(true)}
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

                                {/* ── LISTA DE EVE_CODIGO Y URLS DE LAS CUALES SE SACÓ Y A QUÉ TALLER PERTENECIÓ ── */}
                                <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                                <Link2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                                                    Lista de Códigos de Eventos (eve_codigo) y URLs Utilizadas ({listaEventosAsignadosConDetalle.length})
                                                </h4>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Detalle de origen: a qué taller perteneció cada URL de registro.
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                            Pasarán a Finalizado
                                        </span>
                                    </div>

                                    <div className="max-h-52 overflow-y-auto rounded-xl border border-border divide-y divide-border/60 bg-muted/10">
                                        {listaEventosAsignadosConDetalle.map((item, idx) => (
                                            <div
                                                key={`${item.eventoId}-${idx}`}
                                                className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                                        T{item.tallerNumero}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-foreground truncate">
                                                            {item.nombre}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground truncate">
                                                            Perteneció a: <strong className="text-foreground">{item.tallerNombre}</strong>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="text-right">
                                                        <span className="font-mono text-[11px] font-black bg-primary/15 text-primary px-2.5 py-0.5 rounded-md border border-primary/20">
                                                            {item.codigo}
                                                        </span>
                                                        <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                                                            {item.url}
                                                        </p>
                                                    </div>
                                                    <div className="text-right text-[10px]">
                                                        <span className="font-bold text-foreground block">
                                                            {item.inscritos} ins.
                                                        </span>
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                                                            {item.asistidos} asis.
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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
                                    <div className="overflow-x-auto max-h-[440px]">
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
                                            onClick={() => setIsConfirmingExcel(true)}
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

                {/* MODAL DE CONFIRMACIÓN OBLIGATORIA CON LISTADO DE EVE_CODIGO Y URLS */}
                <ConfirmModal
                    isOpen={isConfirmingExcel}
                    onClose={() => setIsConfirmingExcel(false)}
                    onConfirm={ejecutarGeneracionExcelYFinalizar}
                    title="¿Estás seguro de generar el Excel?"
                    description={
                        <div className="space-y-3 text-xs">
                            <p className="font-semibold text-foreground">
                                Ten en cuenta que esas URL no se podrán usar, ya que el estado del evento estará en <span className="font-bold text-amber-500 uppercase">finalizado</span>.
                            </p>
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 space-y-2">
                                <div className="flex items-center gap-2 font-bold text-xs">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                                    <span>Se finalizarán {listaEventosAsignadosConDetalle.length} URLs de eventos ({totalEventosSeleccionados.size} eventos únicos):</span>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
                                    {listaEventosAsignadosConDetalle.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-background/60 border border-amber-500/20">
                                            <span className="font-bold text-foreground truncate">
                                                [T{item.tallerNumero}] {item.nombre}
                                            </span>
                                            <span className="text-primary font-bold shrink-0">
                                                {item.codigo} ({item.url})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] leading-relaxed opacity-80 pt-1.5 border-t border-amber-500/20">
                                    Se cambiará permanentemente su estado a <code>finalizado</code> y se cerrará el acceso a sus URLs.
                                </p>
                            </div>
                        </div>
                    }
                    confirmText="Sí, finalizar eventos y generar Excel"
                    cancelText="Cancelar y revisar"
                    variant="warning"
                    loading={finalizandoEventos}
                    maxWidth="max-w-xl"
                />
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
