'use client';

import { useState, useMemo } from 'react';
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
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    Award,
    Filter,
    Loader2,
    Building2,
    Layers,
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
}

export interface FilaConsolidada {
    id: string;
    ci: string;
    nombreCompleto: string;
    cargo: string;
    cargosIds: string[];
    tenantNombre?: string;
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
}: ReporteConsolidadoModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState<string>('');
    const [filterCargo, setFilterCargo] = useState<string>('');
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [generatingExcel, setGeneratingExcel] = useState(false);

    const activePeriod = useMemo(() => {
        return periods.find((p) => p.id === selectedPeriod) || null;
    }, [periods, selectedPeriod]);

    // Helper para detectar si un criterio corresponde a examen autónomo
    const isCriterioCuestionarioPersonal = (crit: any) => {
        if (!crit) return false;
        if (crit.cuestionarios && crit.cuestionarios.length > 0) return true;
        if (cuestionarios.some((c) => c.criterioId === crit.id)) return true;
        if (!crit.subcriterios || crit.subcriterios.length === 0) return true;
        return crit.subcriterios.some((s: any) => s.tipoPregunta && s.tipoPregunta !== 'LIKERT');
    };

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

    // Consolidación de todos los funcionarios evaluados
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
                tenantNombre: userObj.tenant?.sigla || userObj.tenant?.nombre || '',
                criteriosValores,
                notaFinalTotal,
                estado,
                totalSupervisores,
                supervisoresCompletados: supervisoresCompletados.length,
                examenCompletado: isExamenCompleted,
            });
        });

        return filas.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
    }, [activePeriod, asignaciones, allUsers, criteriosAgrupados, cargos, cuestionarios]);

    // Filtrado interactivo
    const filteredFilas = useMemo(() => {
        return filasConsolidadas.filter((f) => {
            if (filterEstado && f.estado !== filterEstado) return false;
            if (filterCargo && f.cargo !== filterCargo) return false;

            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase().trim();
                const nom = f.nombreCompleto.toLowerCase();
                const ci = f.ci.toLowerCase();
                const car = f.cargo.toLowerCase();
                return nom.includes(q) || ci.includes(q) || car.includes(q);
            }
            return true;
        });
    }, [filasConsolidadas, filterEstado, filterCargo, searchTerm]);

    // Cargos únicos presentes en las filas para el filtro
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
    // EXPORTACIÓN A EXCEL (.XLSX) - EXACTAMENTE 4 CRITERIOS
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
            toast.success('Archivo Excel descargado exitosamente con los 4 criterios agrupados');
        } catch (error) {
            toast.error('Error al exportar a Excel');
        } finally {
            setGeneratingExcel(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // GENERACIÓN Y DESCARGA DE PDF OFICIAL (LANDSCAPE CON AUTOTABLE)
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

            // Encabezado Institucional PROFE / MINEDU
            doc.setFillColor(15, 23, 42); // Slate 900
            doc.rect(0, 0, 279.4, 24, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('ESTADO PLURINACIONAL DE BOLIVIA • MINISTERIO DE EDUCACIÓN', 14, 9);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(203, 213, 225);
            doc.text('PROGRAMA DE FORMACIÓN ESPECIALIZADA (PROFE) • SISTEMA DE EVALUACIÓN DEL DESEMPEÑO DOCENTE Y ADMINISTRATIVO', 14, 15);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(234, 179, 8); // Amber 500
            doc.text(`SÁBANA DE NOTAS CONSOLIDADAS • ${periodoTexto.toUpperCase()}`, 14, 20);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(226, 232, 240);
            doc.text(`Fecha de Emisión: ${fechaEmision}`, 265, 12, { align: 'right' });
            doc.text(`Total Funcionarios: ${filteredFilas.length} | Promedio General: ${metricas.promedio}%`, 265, 18, { align: 'right' });

            // Cabeceras de tabla fijas y agrupadas en los 4 criterios
            const headers = [
                'N°',
                'C.I.',
                'APELLIDOS Y NOMBRES',
                'CARGO / PUESTO',
                'C1 (15%)\nInmediato Sup.',
                'C2 (30%)\nFact. Asociados',
                'C3 (10%)\nComunitaria',
                'C4 (45%)\nEvidencias',
                'TOTAL\n(100%)',
                'ESTADO',
            ];

            const rows = filteredFilas.map((f, i) => {
                const c1 = f.criteriosValores.find((v) => v.orden === 1);
                const c2 = f.criteriosValores.find((v) => v.orden === 2);
                const c3 = f.criteriosValores.find((v) => v.orden === 3);
                const c4 = f.criteriosValores.find((v) => v.orden === 4);

                return [
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
                ];
            });

            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: 28,
                margin: { left: 12, right: 12 },
                theme: 'grid',
                styles: {
                    fontSize: 7.5,
                    cellPadding: 2,
                    textColor: [30, 41, 59],
                    valign: 'middle',
                },
                headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center',
                    fontSize: 7.5,
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 8 },   // N°
                    1: { halign: 'center', cellWidth: 20 },  // CI
                    2: { cellWidth: 55, fontStyle: 'bold' },  // Nombres
                    3: { cellWidth: 45 },                   // Cargo
                    4: { halign: 'center', cellWidth: 22 },  // C1
                    5: { halign: 'center', cellWidth: 24 },  // C2
                    6: { halign: 'center', cellWidth: 22 },  // C3
                    7: { halign: 'center', cellWidth: 22 },  // C4
                    8: { halign: 'center', cellWidth: 20, fontStyle: 'bold', textColor: [16, 185, 129] }, // Total
                    9: { halign: 'center', cellWidth: 24 },  // Estado
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252],
                },
                didDrawPage: (data) => {
                    const str = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
                    doc.setFontSize(7);
                    doc.setTextColor(148, 163, 184);
                    doc.text(str, 265, 208, { align: 'right' });
                    doc.text('Documento oficial generado por la Plataforma del Sistema de Evaluación PROFE - Ministerio de Educación', 14, 208);
                },
            });

            // Espacio de firmas institucionales al pie
            const finalY = (doc as any).lastAutoTable.finalY + 14;
            if (finalY < 185) {
                doc.setDrawColor(203, 213, 225);
                doc.line(40, finalY + 12, 110, finalY + 12);
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(51, 65, 85);
                doc.text('RESPONSABLE DE EVALUACIÓN Y SEGUIMIENTO', 75, finalY + 16, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.text('Comisión de Evaluación Institucional PROFE', 75, finalY + 20, { align: 'center' });

                doc.line(170, finalY + 12, 240, finalY + 12);
                doc.setFont('helvetica', 'bold');
                doc.text('DIRECCIÓN GENERAL EJECUTIVA', 205, finalY + 16, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.text('Programa de Formación Especializada - PROFE', 205, finalY + 20, { align: 'center' });
            }

            const pdfFileName = `SABANA_NOTAS_PROFE_${activePeriod?.gestion || '2026'}.pdf`;
            doc.save(pdfFileName);
            toast.success('Documento PDF oficial descargado con éxito');
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-secondary/30 border border-border/40">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                                Periodo: {activePeriod?.gestion} - {activePeriod?.periodo} ({activePeriod?.semestre})
                            </span>
                            <span className="text-xs font-bold text-muted-foreground">
                                • {filasConsolidadas.length} Funcionarios Asignados
                            </span>
                        </div>
                        <h2 className="text-base font-black text-foreground uppercase tracking-tight">
                            Consolidado General de Notas por Criterio
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Visualización agrupada en 4 Criterios: C1 (15%), C2 (30%), C3 (10%), C4 (45%) y Calificación Final sobre 100%.
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
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
                        >
                            {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Descargar PDF Oficial
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
                    <div className="p-4 rounded-2xl bg-card border border-border/40 text-center col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-black uppercase text-primary">Promedio General</span>
                        <div className="text-xl font-black text-primary mt-0.5">{metricas.promedio}%</div>
                    </div>
                </div>

                {/* Filtros y Buscador */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-96">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por CI, Nombre o Cargo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-border/40 bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={filterCargo}
                            onChange={(e) => setFilterCargo(e.target.value)}
                            className="bg-card border border-border/40 text-xs font-semibold px-3 py-2 rounded-2xl text-foreground focus:ring-0 w-full sm:w-auto"
                        >
                            <option value="">Todos los Cargos</option>
                            {cargosPresentes.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                            className="bg-card border border-border/40 text-xs font-semibold px-3 py-2 rounded-2xl text-foreground focus:ring-0 w-full sm:w-auto"
                        >
                            <option value="">Todos los Estados</option>
                            <option value="CONSOLIDADO">Consolidado (100%)</option>
                            <option value="EN_PROCESO">En Progreso</option>
                            <option value="PENDIENTE">Pendiente</option>
                        </select>
                    </div>
                </div>

                {/* Tabla Sábana de Notas - 4 Criterios */}
                <div className="bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-[58vh]">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-secondary/80 backdrop-blur-md z-10 border-b border-border/40 text-muted-foreground uppercase text-[10px] font-black tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-4 w-12 text-center">N°</th>
                                    <th className="py-3.5 px-4 w-28">C.I.</th>
                                    <th className="py-3.5 px-4 min-w-[220px]">Funcionario</th>
                                    <th className="py-3.5 px-4 min-w-[180px]">Cargo</th>
                                    {criteriosAgrupados.map((c) => (
                                        <th key={c.orden} className="py-3.5 px-3 text-center min-w-[120px]">
                                            <span className="block text-foreground font-black">C{c.orden} ({c.peso}%)</span>
                                            <span className="block text-[9px] font-medium text-muted-foreground truncate max-w-[130px]" title={c.nombre}>
                                                {c.nombreCorto}
                                            </span>
                                        </th>
                                    ))}
                                    <th className="py-3.5 px-4 text-center min-w-[90px] text-primary">Total</th>
                                    <th className="py-3.5 px-4 text-center min-w-[110px]">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filteredFilas.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center py-12 text-muted-foreground">
                                            No se encontraron funcionarios asignados que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFilas.map((f, i) => (
                                        <tr key={f.id} className="hover:bg-secondary/20 transition-colors">
                                            <td className="py-3 px-4 text-center font-bold text-muted-foreground">{i + 1}</td>
                                            <td className="py-3 px-4 font-black font-mono text-foreground">{f.ci}</td>
                                            <td className="py-3 px-4 font-bold text-foreground leading-tight">
                                                {f.nombreCompleto}
                                                {f.tenantNombre && (
                                                    <span className="block text-[10px] font-medium text-muted-foreground mt-0.5">
                                                        Sede: {f.tenantNombre}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-[11px] font-semibold text-muted-foreground leading-tight">
                                                {f.cargo}
                                            </td>

                                            {/* Criterios 1 al 4 agrupados */}
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pie Informativo */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1">
                    <span>
                        Mostrando <strong>{filteredFilas.length}</strong> de <strong>{filasConsolidadas.length}</strong> funcionarios asignados.
                    </span>
                    <span className="italic">
                        * C1: Inmediato Superior (15%) • C2: Factores Asociados (30%) • C3: Comunitaria (10%) • C4: Evidencias (45%). Suma máxima: 100%.
                    </span>
                </div>
            </div>
        </Modal>
    );
}

