'use client';

import { useState, useMemo, Fragment } from 'react';
import {
    EvaluationPeriod,
    EvaluacionCuestionario,
    EvaluacionAdmins,
} from '@/services/evaluationService';
import { Cargo } from '@/services/cargoService';
import { Modal } from '@/components/Modal';
import {
    Search,
    Printer,
    FileSpreadsheet,
    Download,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    MapPin,
    ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReporteConsolidadoModalProps {
    isOpen: boolean;
    onClose: () => void;
    asignaciones: EvaluacionAdmins[];
    periods: EvaluationPeriod[];
    selectedPeriod: string;
    allUsers: any[];
    cargos: Cargo[];
    cuestionarios: EvaluacionCuestionario[];
    departments?: any[];
}

export interface FilaConsolidada {
    id: string;
    ci: string;
    nombreCompleto: string;
    cargo: string;
    cargosIds: string[];
    tenantNombre: string;
    criteriosValores: {
        id: string;
        nombre: string;
        orden: number;
        peso: number;
        rendimiento: number;
        aporte: number;
        isEvaluated: boolean;
    }[];
    notaFinalTotal: number;
    estado: 'CONSOLIDADO' | 'EN_PROCESO' | 'PENDIENTE';
    totalSupervisores: number;
    supervisoresCompletados: number;
    examenCompletado: boolean;
}

export function ReporteConsolidadoModal({
    isOpen,
    onClose,
    asignaciones,
    periods,
    selectedPeriod,
    allUsers,
    cargos,
    cuestionarios,
    departments = [],
}: ReporteConsolidadoModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState<string>('');
    const [filterCargo, setFilterCargo] = useState<string>('');
    const [filterDepto, setFilterDepto] = useState<string>('');
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [generatingExcel, setGeneratingExcel] = useState(false);

    const activePeriod = useMemo(() => {
        return periods.find((p) => p.id === selectedPeriod) || null;
    }, [periods, selectedPeriod]);

    // Helper para extraer nombre del cargo
    const getCargoNombre = (u: any, fallbackCargo?: any): string => {
        if (fallbackCargo?.nombre) return fallbackCargo.nombre;
        if (u?.cargoPostulacion?.nombre) return u.cargoPostulacion.nombre;
        if (u?.cargoStr) return u.cargoStr;
        if (typeof u?.cargo === 'string' && u.cargo.trim()) return u.cargo;
        if (u?.cargoPostulacionId) {
            const found = cargos.find((c) => c.id === u.cargoPostulacionId);
            if (found?.nombre) return found.nombre;
        }
        if (u?.cargoId) {
            const found = cargos.find((c) => c.id === u.cargoId);
            if (found?.nombre) return found.nombre;
        }
        return 'Sin Cargo Asignado';
    };

    // Helper para resolver el nombre oficial del Departamento / Sede
    const getDepartamentoNombre = (userObj: any, fallbackTenant?: any): string => {
        if (userObj?.tenant?.nombre) return userObj.tenant.nombre.toUpperCase();
        if (userObj?.tenant?.sigla) return userObj.tenant.sigla.toUpperCase();
        if (fallbackTenant?.nombre) return fallbackTenant.nombre.toUpperCase();
        if (fallbackTenant?.sigla) return fallbackTenant.sigla.toUpperCase();

        const tId = userObj?.tenantId || fallbackTenant?.id;
        if (tId && departments && departments.length > 0) {
            const found = departments.find((d: any) => d.id === tId);
            if (found?.nombre) return found.nombre.toUpperCase();
            if (found?.sigla) return found.sigla.toUpperCase();
        }

        if (userObj?.departamento?.nombre) return userObj.departamento.nombre.toUpperCase();
        if (typeof userObj?.departamento === 'string' && userObj.departamento.trim()) {
            return userObj.departamento.toUpperCase();
        }
        return 'LA PAZ';
    };

    // Agrupación de criterios en los 4 pilares reglamentarios oficiales (Orden 1, 2, 3 y 4)
    const criteriosAgrupados = useMemo(() => {
        return [
            {
                orden: 1,
                nombre: 'Evaluación del inmediato superior y dependientes.',
                nombreCorto: 'Inmediato Superior',
                peso: 15,
            },
            {
                orden: 2,
                nombre: 'Evaluación de Factores Asociados al Desempeño Profesional del Personal del PROFE.',
                nombreCorto: 'Factores Asociados (Examen)',
                peso: 30,
            },
            {
                orden: 3,
                nombre: 'Evaluación comunitaria.',
                nombreCorto: 'Comunitaria',
                peso: 10,
            },
            {
                orden: 4,
                nombre: 'Recolección y verificación de evidencias.',
                nombreCorto: 'Evidencias',
                peso: 45,
            },
        ];
    }, []);

    // Consolidación y ordenamiento por Departamento y Nombre
    const filasConsolidadas: FilaConsolidada[] = useMemo(() => {
        if (!activePeriod) return [];

        // 1. Obtener todos los IDs de usuarios evaluados presentes en las asignaciones de este periodo
        const mapPorEvaluado = new Map<string, EvaluacionAdmins[]>();

        asignaciones.forEach((a) => {
            const targetId = a.evaluadoId;
            if (!targetId) return;
            if (!mapPorEvaluado.has(targetId)) {
                mapPorEvaluado.set(targetId, []);
            }
            mapPorEvaluado.get(targetId)!.push(a);
        });

        // 2. Procesar cada evaluado y calcular su nota en los 4 criterios
        const filas: FilaConsolidada[] = [];

        mapPorEvaluado.forEach((asigs, evaluadoId) => {
            const userObj = allUsers.find((u) => u.id === evaluadoId) || asigs[0]?.evaluado || {};
            const cargoObj = asigs[0]?.cargo || userObj?.cargoPostulacion;
            const cargoNombre = getCargoNombre(userObj, cargoObj);
            const userCargoId = asigs[0]?.cargoId || userObj?.cargoPostulacionId || userObj?.cargoId || '';
            const deptoNombre = getDepartamentoNombre(userObj, asigs[0]?.tenantId);

            // Asignación de Examen Personal (autoevaluación - Criterio 2)
            const autoAsig = asigs.find(
                (a) => a.tipoEvaluacion === 'AUTOEVALUACION' || a.evaluadorId === a.evaluadoId
            );
            const intentosExamen = autoAsig?.intentos || [];
            const ultimoIntento = intentosExamen[0];
            const isExamenCompleted = autoAsig?.estadoEvaluacion === 'COMPLETADO';
            const notaExamen = autoAsig?.puntajeFinal !== null && autoAsig?.puntajeFinal !== undefined
                ? Number(autoAsig.puntajeFinal)
                : ultimoIntento?.puntajeObtenido !== null && ultimoIntento?.puntajeObtenido !== undefined
                    ? Number(ultimoIntento.puntajeObtenido)
                    : null;

            // Asignaciones de Supervisores (Criterios 1 y 4)
            const supervisorAsigs = asigs.filter(
                (a) => a.tipoEvaluacion !== 'AUTOEVALUACION' && a.evaluadorId !== a.evaluadoId && a.tipoEvaluacion !== 'PAR'
            );
            const totalSupervisores = supervisorAsigs.length;
            const supervisoresCompletados = supervisorAsigs.filter((s) => s.estadoEvaluacion === 'COMPLETADO');
            const notasSupervisores = supervisoresCompletados
                .map((s) => Number(s.puntajeFinal))
                .filter((n) => !isNaN(n) && n !== null);
            const promedioSupervisores = notasSupervisores.length > 0
                ? Math.round((notasSupervisores.reduce((a, b) => a + b, 0) / notasSupervisores.length) * 100) / 100
                : null;

            // Asignaciones Entre Pares (Criterio 3)
            const parAsigs = asigs.filter((a) => a.tipoEvaluacion === 'PAR');
            const paresCompletados = parAsigs.filter((s) => s.estadoEvaluacion === 'COMPLETADO');
            const notasPares = paresCompletados
                .map((s) => Number(s.puntajeFinal))
                .filter((n) => !isNaN(n) && n !== null);
            const promedioPares = notasPares.length > 0
                ? Math.round((notasPares.reduce((a, b) => a + b, 0) / notasPares.length) * 100) / 100
                : null;

            let sumaAportes = 0;
            let todosCompletados = true;
            let alMenosUnoCompletado = false;

            const criteriosValores = criteriosAgrupados.map((cg) => {
                let rendimiento = 0;
                let isEvaluated = false;

                if (cg.orden === 1) {
                    // C1: Inmediato superior (15%)
                    if (promedioSupervisores !== null) {
                        rendimiento = promedioSupervisores;
                        isEvaluated = true;
                    } else {
                        todosCompletados = false;
                    }
                } else if (cg.orden === 2) {
                    // C2: Factores asociados / Examen personal (30%)
                    if (notaExamen !== null) {
                        rendimiento = notaExamen;
                        isEvaluated = isExamenCompleted;
                        if (!isExamenCompleted) todosCompletados = false;
                    } else {
                        todosCompletados = false;
                    }
                } else if (cg.orden === 3) {
                    // C3: Evaluación comunitaria (10%)
                    const notaCom = promedioPares !== null ? promedioPares : promedioSupervisores;
                    if (notaCom !== null) {
                        rendimiento = notaCom;
                        isEvaluated = true;
                    } else {
                        todosCompletados = false;
                    }
                } else if (cg.orden === 4) {
                    // C4: Recolección y verificación de evidencias (45%)
                    if (promedioSupervisores !== null) {
                        rendimiento = promedioSupervisores;
                        isEvaluated = true;
                    } else {
                        todosCompletados = false;
                    }
                }

                if (isEvaluated) alMenosUnoCompletado = true;

                const aporte = isEvaluated ? Math.round(((rendimiento * cg.peso) / 100) * 100) / 100 : 0;
                sumaAportes += aporte;

                return {
                    id: `crit-${cg.orden}`,
                    nombre: cg.nombre,
                    orden: cg.orden,
                    peso: cg.peso,
                    rendimiento,
                    aporte,
                    isEvaluated,
                };
            });

            const notaFinalTotal = Math.round(sumaAportes * 100) / 100;
            const estado: 'CONSOLIDADO' | 'EN_PROCESO' | 'PENDIENTE' = todosCompletados
                ? 'CONSOLIDADO'
                : alMenosUnoCompletado
                    ? 'EN_PROCESO'
                    : 'PENDIENTE';

            const ciCompleto = `${userObj.ci || ''}`.trim() || 'S/CI';
            const nombreCompleto = `${userObj.nombre || ''} ${userObj.apellidos || ''}`.trim() || 'Sin Nombre';

            filas.push({
                id: evaluadoId,
                ci: ciCompleto,
                nombreCompleto,
                cargo: cargoNombre,
                cargosIds: userCargoId ? [userCargoId] : [],
                tenantNombre: deptoNombre,
                criteriosValores,
                notaFinalTotal,
                estado,
                totalSupervisores,
                supervisoresCompletados: supervisoresCompletados.length,
                examenCompletado: isExamenCompleted,
            });
        });

        // Orden estricto: Primero por Departamento (A-Z) y luego por Apellidos/Nombres (A-Z)
        return filas.sort((a, b) => {
            const depA = (a.tenantNombre || 'NACIONAL').toUpperCase();
            const depB = (b.tenantNombre || 'NACIONAL').toUpperCase();
            if (depA !== depB) {
                return depA.localeCompare(depB);
            }
            return a.nombreCompleto.localeCompare(b.nombreCompleto);
        });
    }, [activePeriod, asignaciones, allUsers, criteriosAgrupados, cargos, departments]);

    // Filtrado interactivo
    const filteredFilas = useMemo(() => {
        return filasConsolidadas.filter((f) => {
            if (filterEstado && f.estado !== filterEstado) return false;
            if (filterCargo && f.cargo !== filterCargo) return false;
            if (filterDepto && f.tenantNombre !== filterDepto) return false;

            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase().trim();
                const nom = f.nombreCompleto.toLowerCase();
                const ci = f.ci.toLowerCase();
                const car = f.cargo.toLowerCase();
                const dep = f.tenantNombre.toLowerCase();
                return nom.includes(q) || ci.includes(q) || car.includes(q) || dep.includes(q);
            }
            return true;
        });
    }, [filasConsolidadas, filterEstado, filterCargo, filterDepto, searchTerm]);

    // Departamentos únicos para el filtro
    const departamentosPresentes = useMemo(() => {
        const setD = new Set<string>();
        filasConsolidadas.forEach((f) => {
            if (f.tenantNombre) setD.add(f.tenantNombre);
        });
        return Array.from(setD).sort();
    }, [filasConsolidadas]);

    // Cargos únicos para el filtro
    const cargosPresentes = useMemo(() => {
        const setC = new Set<string>();
        filasConsolidadas.forEach((f) => {
            if (f.cargo) setC.add(f.cargo);
        });
        return Array.from(setC).sort();
    }, [filasConsolidadas]);

    // Métricas rápidas
    const metricas = useMemo(() => {
        const total = filasConsolidadas.length;
        const consolidados = filasConsolidadas.filter((f) => f.estado === 'CONSOLIDADO').length;
        const enProceso = filasConsolidadas.filter((f) => f.estado === 'EN_PROCESO').length;
        const pendientes = filasConsolidadas.filter((f) => f.estado === 'PENDIENTE').length;
        const notas = filasConsolidadas.map((f) => f.notaFinalTotal);
        const promedio = total > 0 ? Math.round((notas.reduce((a, b) => a + b, 0) / total) * 10) / 10 : 0;
        return { total, consolidados, enProceso, pendientes, promedio };
    }, [filasConsolidadas]);

    // ─────────────────────────────────────────────────────────────────────────────
    // EXPORTACIÓN A EXCEL (.XLSX) - ORDENADO POR DEPARTAMENTO
    // ─────────────────────────────────────────────────────────────────────────────
    const handleExportExcel = async () => {
        if (filteredFilas.length === 0) {
            toast.warning('No hay datos disponibles para exportar');
            return;
        }

        try {
            setGeneratingExcel(true);
            const XLSX = await import('xlsx');

            const excelRows = filteredFilas.map((f, index) => {
                const c1 = f.criteriosValores.find((v) => v.orden === 1);
                const c2 = f.criteriosValores.find((v) => v.orden === 2);
                const c3 = f.criteriosValores.find((v) => v.orden === 3);
                const c4 = f.criteriosValores.find((v) => v.orden === 4);

                return {
                    'N°': index + 1,
                    'DEPARTAMENTO / SEDE': f.tenantNombre || 'NACIONAL',
                    'CÉDULA DE IDENTIDAD': f.ci,
                    'APELLIDOS Y NOMBRES': f.nombreCompleto,
                    'CARGO / PUESTO': f.cargo,
                    'C1 - INMEDIATO SUPERIOR (15%)': c1 && c1.isEvaluated ? c1.aporte : 0,
                    'C2 - FACTORES ASOCIADOS (30%)': c2 && c2.isEvaluated ? c2.aporte : 0,
                    'C3 - COMUNITARIA (10%)': c3 && c3.isEvaluated ? c3.aporte : 0,
                    'C4 - EVIDENCIAS (45%)': c4 && c4.isEvaluated ? c4.aporte : 0,
                    'NOTA FINAL TOTAL (%)': f.notaFinalTotal,
                    'ESTADO': f.estado === 'CONSOLIDADO' ? 'CONSOLIDADO' : f.estado === 'EN_PROCESO' ? 'EN PROCESO' : 'PENDIENTE',
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(excelRows);

            worksheet['!cols'] = [
                { wch: 6 },  // N°
                { wch: 20 }, // Departamento
                { wch: 16 }, // CI
                { wch: 36 }, // Nombres
                { wch: 32 }, // Cargo
                { wch: 28 }, // C1
                { wch: 28 }, // C2
                { wch: 24 }, // C3
                { wch: 24 }, // C4
                { wch: 18 }, // Total
                { wch: 16 }, // Estado
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Notas Consolidadas');

            const fileName = `SABANA_NOTAS_PROFE_${activePeriod?.gestion || '2026'}_${activePeriod?.periodo || 'P1'}.xlsx`.replace(/\s+/g, '_');
            XLSX.writeFile(workbook, fileName);
            toast.success('Archivo Excel descargado exitosamente ordenado por departamento');
        } catch (error) {
            toast.error('Error al exportar a Excel');
        } finally {
            setGeneratingExcel(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // GENERACIÓN Y DESCARGA DE PDF OFICIAL - COLOR CLARO DORADO PRINCIPAL
    // ─────────────────────────────────────────────────────────────────────────────
    const handleDownloadPdf = async () => {
        if (filteredFilas.length === 0) {
            toast.warning('No hay datos disponibles para generar el PDF');
            return;
        }

        try {
            setGeneratingPdf(true);
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'letter',
            });

            const periodoTexto = `${activePeriod?.gestion || '2026'} - ${activePeriod?.periodo || 'PERIODO'} (${activePeriod?.semestre || 'SEMESTRE'})`;
            const fechaEmision = new Date().toLocaleDateString('es-BO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            // Paleta Oficial Institucional Dorado Claro
            const GOLD_MAIN: [number, number, number] = [201, 167, 81];     // #C9A751 Claro Dorado Principal
            const GOLD_DARK: [number, number, number] = [148, 110, 35];     // #946E23 Dorado Oscuro ejecutivo
            const GOLD_LIGHT_BG: [number, number, number] = [254, 252, 246]; // Marfil dorado claro para alternancia
            const GOLD_BORDER: [number, number, number] = [230, 201, 125];   // Bordes dorados suaves

            // Franja superior institucional en Dorado Claro Principal
            doc.setFillColor(GOLD_MAIN[0], GOLD_MAIN[1], GOLD_MAIN[2]);
            doc.rect(0, 0, 279.4, 25, 'F');

            // Línea de acento dorado fino
            doc.setFillColor(GOLD_DARK[0], GOLD_DARK[1], GOLD_DARK[2]);
            doc.rect(0, 24.2, 279.4, 0.8, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('ESTADO PLURINACIONAL DE BOLIVIA • MINISTERIO DE EDUCACIÓN', 12, 8.5);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(255, 255, 255);
            doc.text('PROGRAMA DE FORMACIÓN ESPECIALIZADA (PROFE) • SISTEMA DE EVALUACIÓN DEL DESEMPEÑO DOCENTE Y ADMINISTRATIVO', 12, 14.5);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 251, 235); // Luz dorada suave
            doc.text(`SÁBANA DE NOTAS CONSOLIDADAS • ORDENADO POR DEPARTAMENTO • ${periodoTexto.toUpperCase()}`, 12, 20.5);

            // Metadatos de emisión alineados a la derecha
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(`Fecha de Emisión: ${fechaEmision}`, 267, 11.5, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Evaluados: ${filteredFilas.length} | Promedio: ${metricas.promedio}%`, 267, 17.5, { align: 'right' });

            // Cabeceras exactas solicitadas agrupadas en 10 columnas oficiales
            const headers = [
                'N°',
                'C.I.',
                'APELLIDOS Y NOMBRES',
                'CARGO / PUESTO',
                'C1 (15%)\nInmediato\nSup.',
                'C2 (30%)\nFact. Asociados',
                'C3 (10%)\nComunitaria',
                'C4 (45%)\nEvidencias',
                'TOTAL\n(100%)',
                'ESTADO',
            ];

            // Construcción de filas con orden y agrupación visible por Departamento
            const rows: any[] = [];
            let currentDepto = '';

            filteredFilas.forEach((f, i) => {
                const deptoFila = (f.tenantNombre || 'NACIONAL').toUpperCase();

                // Fila divisoria de sección cuando cambia el departamento
                if (deptoFila !== currentDepto) {
                    currentDepto = deptoFila;
                    const countInDepto = filteredFilas.filter(
                        (item) => (item.tenantNombre || 'NACIONAL').toUpperCase() === currentDepto
                    ).length;

                    rows.push([
                        {
                            content: `DEPARTAMENTO / SEDE: ${currentDepto} (${countInDepto} EVALUADOS)`,
                            colSpan: 10,
                            styles: {
                                fillColor: [245, 237, 214], // Marfil dorado claro suave
                                textColor: GOLD_DARK,        // Dorado oscuro institucional
                                fontStyle: 'bold',
                                fontSize: 7.5,
                                halign: 'left',
                                cellPadding: 2.2,
                            },
                        },
                    ]);
                }

                const c1 = f.criteriosValores.find((v) => v.orden === 1);
                const c2 = f.criteriosValores.find((v) => v.orden === 2);
                const c3 = f.criteriosValores.find((v) => v.orden === 3);
                const c4 = f.criteriosValores.find((v) => v.orden === 4);

                rows.push([
                    i + 1,
                    f.ci,
                    f.nombreCompleto,
                    f.cargo,
                    c1 && c1.isEvaluated ? `${c1.aporte.toFixed(1)}` : '0.0',
                    c2 && c2.isEvaluated ? `${c2.aporte.toFixed(1)}` : '0.0',
                    c3 && c3.isEvaluated ? `${c3.aporte.toFixed(1)}` : '0.0',
                    c4 && c4.isEvaluated ? `${c4.aporte.toFixed(1)}` : '0.0',
                    `${f.notaFinalTotal.toFixed(1)}%`,
                    f.estado === 'CONSOLIDADO' ? 'CONSOLIDADO' : f.estado === 'EN_PROCESO' ? 'EN PROCESO' : 'PENDIENTE',
                ]);
            });

            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: 28.5,
                margin: { left: 8, right: 8 },
                theme: 'grid',
                styles: {
                    fontSize: 7,
                    cellPadding: 1.8,
                    textColor: [30, 41, 59],
                    valign: 'middle',
                    lineColor: GOLD_BORDER,
                    lineWidth: 0.12,
                },
                headStyles: {
                    fillColor: GOLD_MAIN, // Color claro dorado principal
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center',
                    fontSize: 7.2,
                    lineWidth: 0.2,
                    lineColor: GOLD_DARK,
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 8 },   // N°
                    1: { halign: 'center', cellWidth: 19, fontStyle: 'bold' }, // C.I.
                    2: { cellWidth: 60, fontStyle: 'bold' },  // APELLIDOS Y NOMBRES
                    3: { cellWidth: 52 },                   // CARGO / PUESTO
                    4: { halign: 'center', cellWidth: 21 },  // C1 (15%)
                    5: { halign: 'center', cellWidth: 23 },  // C2 (30%)
                    6: { halign: 'center', cellWidth: 21 },  // C3 (10%)
                    7: { halign: 'center', cellWidth: 21 },  // C4 (45%)
                    8: { halign: 'center', cellWidth: 18, fontStyle: 'bold', textColor: GOLD_DARK }, // TOTAL (100%)
                    9: { halign: 'center', cellWidth: 20 },  // ESTADO
                },
                alternateRowStyles: {
                    fillColor: GOLD_LIGHT_BG, // Marfil dorado suave
                },
                didDrawPage: (data) => {
                    const str = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
                    doc.setFontSize(7);
                    doc.setTextColor(GOLD_DARK[0], GOLD_DARK[1], GOLD_DARK[2]);
                    doc.text(str, 271, 208, { align: 'right' });
                    doc.text('Documento oficial generado por la Plataforma del Sistema de Evaluación PROFE - Ministerio de Educación', 8, 208);
                },
            });

            // Espacio de firmas institucionales al pie con dorado
            const finalY = (doc as any).lastAutoTable.finalY + 12;
            if (finalY < 185) {
                doc.setDrawColor(GOLD_MAIN[0], GOLD_MAIN[1], GOLD_MAIN[2]);
                doc.setLineWidth(0.5);
                doc.line(40, finalY + 12, 110, finalY + 12);
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(GOLD_DARK[0], GOLD_DARK[1], GOLD_DARK[2]);
                doc.text('RESPONSABLE DE EVALUACIÓN Y SEGUIMIENTO', 75, finalY + 16, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(71, 85, 105);
                doc.text('Comisión de Evaluación Institucional PROFE', 75, finalY + 20, { align: 'center' });

                doc.setDrawColor(GOLD_MAIN[0], GOLD_MAIN[1], GOLD_MAIN[2]);
                doc.line(170, finalY + 12, 240, finalY + 12);
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(GOLD_DARK[0], GOLD_DARK[1], GOLD_DARK[2]);
                doc.text('DIRECCIÓN GENERAL EJECUTIVA', 205, finalY + 16, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(71, 85, 105);
                doc.text('Programa de Formación Especializada - PROFE', 205, finalY + 20, { align: 'center' });
            }

            const pdfFileName = `SABANA_NOTAS_PROFE_${activePeriod?.gestion || '2026'}.pdf`;
            doc.save(pdfFileName);
            toast.success('Documento PDF oficial en dorado claro descargado con éxito');
        } catch (error) {
            toast.error('Error al generar el PDF de la sábana de notas');
        } finally {
            setGeneratingPdf(false);
        }
    };

    // Impresión directa de navegador
    const handlePrintDirect = () => {
        window.print();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Sábana Consolidada de Calificaciones y Notas"
            size="full"
        >
            <div className="space-y-6 pt-2">
                {/* Cabecera Informativa y Botones de Acción */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-[#c9a751]/10 border border-[#c9a751]/30">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-[#c9a751] text-white text-xs font-black uppercase tracking-wider shadow-sm">
                                Periodo: {activePeriod?.gestion} - {activePeriod?.periodo} ({activePeriod?.semestre})
                            </span>
                            <span className="text-xs font-bold text-foreground flex items-center gap-1">
                                <ArrowUpDown className="w-3.5 h-3.5 text-[#946e23]" /> Ordenado por Departamento
                            </span>
                        </div>
                        <h2 className="text-base font-black text-foreground uppercase tracking-tight">
                            Sábana Oficial de Calificaciones por Departamento
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Lista consolidada ordenada por Departamento y Funcionario en los 4 criterios reglamentarios (C1..C4).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleExportExcel}
                            disabled={generatingExcel}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                        >
                            {generatingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                            Exportar Excel (.xlsx)
                        </button>

                        <button
                            onClick={handleDownloadPdf}
                            disabled={generatingPdf}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#c9a751] text-white text-xs font-black uppercase tracking-wider hover:bg-[#b08e3b] transition-all shadow-md shadow-[#c9a751]/30 disabled:opacity-50 cursor-pointer"
                        >
                            {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Descargar PDF Oficial (Dorado)
                        </button>

                        <button
                            onClick={handlePrintDirect}
                            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-secondary text-secondary-foreground text-xs font-bold uppercase hover:bg-secondary/80 transition-all border border-border/40 cursor-pointer"
                            title="Imprimir pantalla actual"
                        >
                            <Printer className="w-4 h-4 text-foreground" />
                            Imprimir
                        </button>
                    </div>
                </div>

                {/* Métricas Resumen */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-4 rounded-2xl bg-card border border-border/40 text-center">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Total Evaluados</span>
                        <div className="text-xl font-black text-foreground mt-0.5">{metricas.total}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border/40 text-center">
                        <span className="text-[10px] font-black uppercase text-emerald-600">Consolidados (100%)</span>
                        <div className="text-xl font-black text-emerald-600 mt-0.5">{metricas.consolidados}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border/40 text-center">
                        <span className="text-[10px] font-black uppercase text-amber-500">En Progreso</span>
                        <div className="text-xl font-black text-amber-500 mt-0.5">{metricas.enProceso}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border/40 text-center">
                        <span className="text-[10px] font-black uppercase text-rose-500">Sin Calificar</span>
                        <div className="text-xl font-black text-rose-500 mt-0.5">{metricas.pendientes}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-[#c9a751]/30 bg-[#c9a751]/5 text-center col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-black uppercase text-[#946e23] dark:text-[#c9a751]">Promedio General</span>
                        <div className="text-xl font-black text-[#946e23] dark:text-[#c9a751] mt-0.5">{metricas.promedio}%</div>
                    </div>
                </div>

                {/* Filtros y Buscador */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-96">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por Departamento, CI, Nombre o Cargo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-border/40 bg-card text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a751]/30"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {/* Filtro Departamento */}
                        <select
                            value={filterDepto}
                            onChange={(e) => setFilterDepto(e.target.value)}
                            className="bg-card border border-border/40 text-xs font-semibold px-3 py-2 rounded-2xl text-foreground focus:ring-0"
                        >
                            <option value="">Todos los Departamentos</option>
                            {departamentosPresentes.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>

                        {/* Filtro Cargo */}
                        <select
                            value={filterCargo}
                            onChange={(e) => setFilterCargo(e.target.value)}
                            className="bg-card border border-border/40 text-xs font-semibold px-3 py-2 rounded-2xl text-foreground focus:ring-0"
                        >
                            <option value="">Todos los Cargos</option>
                            {cargosPresentes.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        {/* Filtro Estado */}
                        <select
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                            className="bg-card border border-border/40 text-xs font-semibold px-3 py-2 rounded-2xl text-foreground focus:ring-0"
                        >
                            <option value="">Todos los Estados</option>
                            <option value="CONSOLIDADO">Consolidado (100%)</option>
                            <option value="EN_PROCESO">En Progreso</option>
                            <option value="PENDIENTE">Pendiente</option>
                        </select>
                    </div>
                </div>

                {/* Tabla Sábana de Notas - Ordenada por Departamento */}
                <div className="bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-[58vh]">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-[#c9a751] text-white z-10 border-b border-[#946e23]/30 uppercase text-[10px] font-black tracking-wider shadow-sm">
                                <tr>
                                    <th className="py-3 px-3 w-12 text-center">N°</th>
                                    <th className="py-3 px-3 w-28">C.I.</th>
                                    <th className="py-3 px-4 min-w-[210px]">Apellidos y Nombres</th>
                                    <th className="py-3 px-4 min-w-[180px]">Cargo / Puesto</th>
                                    <th className="py-3 px-3 text-center min-w-[110px]">
                                        <span className="block font-black">C1 (15%)</span>
                                        <span className="block text-[8.5px] font-medium text-white/90">Inmediato Sup.</span>
                                    </th>
                                    <th className="py-3 px-3 text-center min-w-[120px]">
                                        <span className="block font-black">C2 (30%)</span>
                                        <span className="block text-[8.5px] font-medium text-white/90">Fact. Asociados</span>
                                    </th>
                                    <th className="py-3 px-3 text-center min-w-[110px]">
                                        <span className="block font-black">C3 (10%)</span>
                                        <span className="block text-[8.5px] font-medium text-white/90">Comunitaria</span>
                                    </th>
                                    <th className="py-3 px-3 text-center min-w-[110px]">
                                        <span className="block font-black">C4 (45%)</span>
                                        <span className="block text-[8.5px] font-medium text-white/90">Evidencias</span>
                                    </th>
                                    <th className="py-3 px-4 text-center min-w-[85px] font-black text-amber-100">
                                        <span className="block">TOTAL</span>
                                        <span className="block text-[8.5px] font-medium">(100%)</span>
                                    </th>
                                    <th className="py-3 px-4 text-center min-w-[100px]">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filteredFilas.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center py-12 text-muted-foreground">
                                            No se encontraron funcionarios asignados que coincidan con los filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFilas.map((f, i) => {
                                        const isFirstInDepto =
                                            i === 0 ||
                                            (filteredFilas[i - 1].tenantNombre || 'NACIONAL').toUpperCase() !==
                                            (f.tenantNombre || 'NACIONAL').toUpperCase();
                                        const deptoActual = (f.tenantNombre || 'NACIONAL').toUpperCase();
                                        const countInDepto = filteredFilas.filter(
                                            (item) => (item.tenantNombre || 'NACIONAL').toUpperCase() === deptoActual
                                        ).length;

                                        return (
                                            <Fragment key={f.id}>
                                                {isFirstInDepto && (
                                                    <tr className="bg-[#c9a751]/15 border-y border-[#c9a751]/30">
                                                        <td colSpan={10} className="py-2.5 px-4">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-black text-[#946e23] dark:text-[#c9a751] text-xs uppercase tracking-wider flex items-center gap-1.5">
                                                                    <MapPin className="w-3.5 h-3.5" />
                                                                    DEPARTAMENTO / SEDE: {deptoActual}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md border border-[#c9a751]/20">
                                                                    {countInDepto} funcionario(s)
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className="hover:bg-[#c9a751]/5 transition-colors">
                                                    <td className="py-3 px-3 text-center font-bold text-muted-foreground">{i + 1}</td>
                                                    <td className="py-3 px-3 font-black font-mono text-foreground">{f.ci}</td>
                                                    <td className="py-3 px-4 font-bold text-foreground leading-tight">
                                                        {f.nombreCompleto}
                                                    </td>
                                                    <td className="py-3 px-4 text-[11px] font-semibold text-muted-foreground leading-tight">
                                                        {f.cargo}
                                                    </td>

                                                    {/* Criterios 1 al 4 */}
                                                    {criteriosAgrupados.map((cg) => {
                                                        const cv = f.criteriosValores.find((v) => v.orden === cg.orden);
                                                        return (
                                                            <td key={cg.orden} className="py-3 px-3 text-center">
                                                                {cv && cv.isEvaluated ? (
                                                                    <div>
                                                                        <span className="font-black text-foreground">
                                                                            +{cv.aporte.toFixed(1)}
                                                                        </span>
                                                                        <span className="text-[9px] text-muted-foreground block">
                                                                            {cv.rendimiento.toFixed(0)}%
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground/50 font-bold">-</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}

                                                    {/* Nota Final Total */}
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-xl text-xs font-black tracking-tight",
                                                            f.estado === 'CONSOLIDADO'
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : f.estado === 'EN_PROCESO'
                                                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                                    : "bg-secondary text-muted-foreground"
                                                        )}>
                                                            {f.notaFinalTotal.toFixed(1)}%
                                                        </span>
                                                    </td>

                                                    {/* Estado */}
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                                                            f.estado === 'CONSOLIDADO'
                                                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                : f.estado === 'EN_PROCESO'
                                                                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                                        )}>
                                                            {f.estado === 'CONSOLIDADO' ? (
                                                                <><CheckCircle2 className="w-3 h-3" /> Consolidado</>
                                                            ) : f.estado === 'EN_PROCESO' ? (
                                                                <><Clock className="w-3 h-3" /> En Progreso</>
                                                            ) : (
                                                                <><AlertCircle className="w-3 h-3" /> Pendiente</>
                                                            )}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pie Informativo */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1">
                    <span>
                        Mostrando <strong>{filteredFilas.length}</strong> de <strong>{filasConsolidadas.length}</strong> funcionarios asignados • Ordenados por Departamento y Nombres.
                    </span>
                    <span className="italic">
                        * C1: Inmediato Superior (15%) • C2: Factores Asociados (30%) • C3: Comunitaria (10%) • C4: Evidencias (45%). Suma máxima: 100%.
                    </span>
                </div>
            </div>
        </Modal>
    );
}
