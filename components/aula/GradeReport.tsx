'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    X, Search, FileDown, Loader2, BarChart3,
    CheckCircle2, Trophy, TrendingUp, Users
} from 'lucide-react';
import { useAula } from '@/contexts/AulaContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GradeReportProps {
    moduloId: string;
    turnoId: string;
    onClose: () => void;
    theme: 'light' | 'dark';
    moduloNombre?: string;
    moduloData?: any; // Añadido opcional
    turnoNombre?: string;
}

export default function GradeReport({ moduloId, turnoId, onClose, theme, moduloNombre, turnoNombre }: GradeReportProps) {
    const { secondaryColor } = useAula();
    const { user } = useAuth();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [exporting, setExporting] = useState(false);
    const [fullModulo, setFullModulo] = useState<any>(null);
    const [attendanceSessions, setAttendanceSessions] = useState<any[]>([]);
    const [fetchingAttendance, setFetchingAttendance] = useState(false);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [repData, modData] = await Promise.all([
                    aulaService.getReporteCalificaciones(moduloId, turnoId),
                    aulaService.getCursoDetalle(moduloId, turnoId) // Para obtener nota mínima/máxima
                ]);
                setReport(repData);
                setFullModulo(modData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [moduloId, turnoId]);

    const isDark = theme === 'dark';

    const filteredStudents = report?.estudiantes?.filter((s: any) =>
        (s.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // Group headers by categoria type (from mod_tipo_calificacion_config order)
    const headers: any[] = report?.headers || [];

    // Stats summary
    const avg = filteredStudents.length > 0
        ? Math.round(filteredStudents.reduce((s: number, e: any) => s + e.total, 0) / filteredStudents.length)
        : 0;
    const aprobados = filteredStudents.filter((s: any) => s.total >= 70).length;
    const reprobados = filteredStudents.length - aprobados;

    const notaMinima = fullModulo?.programaDos?.tipo?.notaReprobacion || 70;
    const notaMaxima = fullModulo?.programaDos?.tipo?.notaMaxima || 100;

    const hexToRgb = (hex: string): [number, number, number] => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [99, 102, 241];
    };

    const exportPDF = async (type: 'detailed' | 'attendance' | 'general') => {
        setExporting(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const isPortrait = type !== 'detailed';
            const doc = new jsPDF({ orientation: isPortrait ? 'portrait' : 'landscape', unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // 1. Fondo
            try { doc.addImage('/fondo_doc.jpg', 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST'); } catch (e) { }

            // 2. Encabezado
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(40, 44, 52);
            const titleMap: any = {
                detailed: 'Registro Matriz de Calificaciones',
                attendance: 'REPORTE EXHAUSTIVO DE ASISTENCIA',
                general: 'REPORTE GENERAL ACADÉMICO'
            };

            // Título Principal
            doc.text(titleMap[type] || 'REPORTE', pageWidth / 2, type === 'detailed' ? 42 : 45, { align: 'center' });

            // Subtítulo especial para Reporte Detallado
            if (type === 'detailed') {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100, 116, 139);
                doc.text('Ordenado por jerarquía académica (mod_tcc_orden)', pageWidth / 2, 48, { align: 'center' });
            }

            // Fecha de Generación
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 44, 52);
            const dateStr = new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.text(`Generado el: ${dateStr}`, pageWidth / 2, type === 'detailed' ? 54 : 52, { align: 'center' });

            // 3. Detalles Académicos
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            const startYDetail = type === 'detailed' ? 64 : 60;
            const leftCol = 20;
            // rightCol depends on orientation. If portrait, pageWidth is ~210, if landscape it's ~297.
            const rightCol = isPortrait ? 120 : pageWidth - 100;

            // Row 1: Programa
            doc.text(`PROGRAMA:`, leftCol, startYDetail);
            doc.setFont('helvetica', 'normal');
            const progName = fullModulo?.programaDos?.nombre || fullModulo?.programa?.nombre || 'PROFE';
            doc.text(doc.splitTextToSize(progName, rightCol - leftCol - 30), leftCol + 30, startYDetail);

            // Row 2: Módulo
            doc.setFont('helvetica', 'bold');
            doc.text(`MÓDULO:`, leftCol, startYDetail + 8);
            doc.setFont('helvetica', 'normal');
            doc.text(doc.splitTextToSize(moduloNombre || 'N/A', rightCol - leftCol - 30), leftCol + 30, startYDetail + 8);

            // Row 3: Facilitador
            doc.setFont('helvetica', 'bold');
            doc.text(`FACILITADOR/A:`, leftCol, startYDetail + 16);
            doc.setFont('helvetica', 'normal');
            const apellidoUser = (user as any)?.persona?.apellidos || (user as any)?.apellidos || '';
            const nombreUser = (user as any)?.persona?.nombre || user?.nombre || '';
            const facName = `${apellidoUser} ${nombreUser}`.trim().toUpperCase() || 'DOCENTE DESIGNADO';
            doc.text(doc.splitTextToSize(facName, rightCol - leftCol - 30), leftCol + 30, startYDetail + 16);

            // Row 1 (Right): Turno
            doc.setFont('helvetica', 'bold');
            doc.text(`TURNO:`, rightCol, startYDetail);
            doc.setFont('helvetica', 'normal');
            const turnLabel = turnoId === 'global' ? 'GLOBAL / CENTRAL' : (turnoNombre || fullModulo?.turno?.nombre || fullModulo?.turno?.turno || 'Turno Único');
            doc.text(turnLabel, rightCol + 25, startYDetail);

            // Row 2 (Right): Inscritos
            doc.setFont('helvetica', 'bold');
            doc.text(`INSCRITOS:`, rightCol, startYDetail + 8);
            doc.setFont('helvetica', 'normal');
            doc.text(`${filteredStudents.length} Estudiantes`, rightCol + 25, startYDetail + 8);

            const primaryRGB = hexToRgb(secondaryColor);

            // 4. Lógica de Tablas
            if (type === 'detailed') {
                const acts = report.headers || [];
                // Forzar todas las categorías de la configuración raíz, ordenadas
                const categories = report.categorias?.length
                    ? report.categorias.map((c: any) => c.nombre)
                    : Array.from(new Set(acts.map((h: any) => h.categoriaNombre)));

                const headRow1: any[] = [{ content: '#', rowSpan: 2 }, { content: 'Estudiante', rowSpan: 2 }];
                const headRow2: any[] = [];

                categories.forEach((cat: any) => {
                    const catActs = acts.filter((h: any) => h.categoriaNombre === cat);
                    // Buscar el peso oficial de la categoría
                    const catInfo = report.categorias?.find((c: any) => c.nombre === cat);
                    const peso = catInfo ? catInfo.peso : 0;

                    // Header de Categoría arriba (span = numActs + 1)
                    headRow1.push({ content: `${(cat as string).substring(0, 15)} (${peso}%)`, colSpan: catActs.length + 1, styles: { halign: 'center' } });

                    // Header de actividades abajo (Tipo Oficial)
                    catActs.forEach((h: any) => {
                        const tipoNombre = h.tipo ? String(h.tipo).toUpperCase() : h.titulo;
                        headRow2.push({ content: tipoNombre.substring(0, 12), styles: { halign: 'center' } });
                    });
                    // Columna sub-total por categoría
                    headRow2.push({ content: '= Pts', styles: { halign: 'center', fontStyle: 'bold' } });
                });

                headRow1.push({ content: 'Promedio', rowSpan: 2 });
                headRow1.push({ content: 'Estado', rowSpan: 2 });

                // tableBody es la correspondencia directa
                const tableBody = filteredStudents.map((s: any, idx: number) => {
                    const row: any[] = [idx + 1, s.nombre];
                    categories.forEach((cat: any) => {
                        const catActs = acts.filter((h: any) => h.categoriaNombre === cat);
                        catActs.forEach((h: any) => {
                            row.push(s.scores[h.id] || 0);
                        });
                        // El cálculo matemático y aporte final a la nota de esta categoría
                        const des = s.desglose?.find((d: any) => d.nombre === cat);
                        row.push(des?.aporte ?? 0);
                    });
                    row.push(s.total);
                    row.push(s.total === 0 ? 'ABANDONO' : s.total >= notaMinima ? 'APROBADO' : 'REPROBADO');
                    return row;
                });

                autoTable(doc, {
                    startY: 88,
                    head: [headRow1, headRow2],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: { fillColor: primaryRGB, fontSize: 6.5, halign: 'center' },
                    styles: { fontSize: 6.5, cellPadding: 2, halign: 'center' },
                    columnStyles: { 1: { halign: 'left', cellWidth: 35 } },
                    didParseCell: (data) => {
                        const totalCols = 2 + acts.length + categories.length + 2;
                        const isMainCategoryHeader = data.section === 'head' && data.row.index === 0 && data.column.index > 1;
                        if (isMainCategoryHeader) {
                            // Tono más oscuro a la fila superior (Categorías Mayores)
                            data.cell.styles.fillColor = [
                                Math.max(0, primaryRGB[0] - 30),
                                Math.max(0, primaryRGB[1] - 30),
                                Math.max(0, primaryRGB[2] - 30)
                            ];
                            data.cell.styles.fontSize = 7;
                        } else if (data.section === 'head' && data.row.index === 1 && data.cell.raw === '= Pts') {
                            // Tono diferente para distinguir la columna Pts
                            data.cell.styles.fillColor = [
                                Math.max(0, primaryRGB[0] - 15),
                                Math.max(0, primaryRGB[1] - 15),
                                Math.max(0, primaryRGB[2] - 15)
                            ];
                        }

                        // Destacar también los sub-totales en el cuerpo
                        if (data.section === 'body') {
                            let currCol = 2; // arranca post-estudiante
                            categories.forEach((cat: any) => {
                                const count = acts.filter((h: any) => h.categoriaNombre === cat).length;
                                currCol += count; // Avanza por las acts
                                if (data.column.index === currCol) {
                                    data.cell.styles.fontStyle = 'bold';
                                    data.cell.styles.textColor = [0, 0, 0];
                                }
                                currCol += 1; // Avanza el = Pts
                            });
                        }

                        // Formato de estados al final de la fila
                        if (data.column.index === totalCols - 1 && data.section === 'body') {
                            const val = data.cell.raw as string;
                            data.cell.styles.textColor = val === 'APROBADO' ? [16, 185, 129] : val === 'ABANDONO' ? [100, 116, 139] : [239, 68, 68];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                });
            } else if (type === 'attendance') {
                setFetchingAttendance(true);
                const sessions = await aulaService.getAsistenciaModulo(moduloId, turnoId);
                const tableHeaders = ['#', 'Estudiante', ...sessions.map((sess: any) => new Date(sess.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })), '%'];
                const allRegs = await Promise.all(sessions.map((sess: any) => aulaService.getRegistrosAsistencia(sess.id)));
                const tableBody = filteredStudents.map((s: any, idx: number) => {
                    const row = [idx + 1, s.nombre];
                    let pCount = 0;
                    sessions.forEach((sess: any, sIdx: number) => {
                        const reg = allRegs[sIdx].find((r: any) => r.userId === s.userId);
                        row.push(reg?.estado || '-');
                        if (reg?.estado === 'P' || reg?.estado === 'T') pCount++;
                    });
                    row.push(`${sessions.length > 0 ? Math.round((pCount / sessions.length) * 100) : 0}%`);
                    return row;
                });
                autoTable(doc, {
                    startY: 88,
                    head: [tableHeaders as any],
                    body: tableBody as any[],
                    theme: 'grid',
                    headStyles: { fillColor: primaryRGB, fontSize: 6.5, halign: 'center' },
                    styles: { fontSize: 6.5, halign: 'center', cellPadding: 1.5 },
                    columnStyles: { 1: { halign: 'left', cellWidth: 45 } }
                });
                setFetchingAttendance(false);
            } else if (type === 'general') {
                const tableHeaders = ['#', 'Estudiante', 'Promedio Notas', 'Asistencia %', 'Estado Final'];
                const tableBody = filteredStudents.map((s: any, idx: number) => [
                    idx + 1,
                    s.nombre,
                    s.total,
                    `${s.asistencia}%`,
                    s.total === 0 ? 'ABANDONO' : s.total >= notaMinima ? 'APROBADO' : 'REPROBADO'
                ]);
                autoTable(doc, {
                    startY: 88,
                    head: [tableHeaders as any],
                    body: tableBody as any[],
                    theme: 'grid',
                    headStyles: { fillColor: primaryRGB, fontSize: 9, halign: 'center' },
                    styles: { fontSize: 9, cellPadding: 4 },
                    didParseCell: (data) => {
                        if (data.column.index === 4 && data.section === 'body') {
                            const val = data.cell.raw as string;
                            data.cell.styles.textColor = val === 'APROBADO' ? [16, 185, 129] : val === 'ABANDONO' ? [100, 116, 139] : [239, 68, 68];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                });
            }

            // 5. Cuadro Resumen Matemático-Visual (Post-Tabla)
            if (['detailed', 'general'].includes(type)) {
                let finalY = (doc as any).lastAutoTable?.finalY || 100;
                if (finalY > pageHeight - 45) { // Más margen porque las tarjetas usan más altura
                    doc.addPage();
                    finalY = 20;
                }

                const totalAbandono = filteredStudents.filter((s: any) => s.total === 0).length;
                const totalAprob = filteredStudents.filter((s: any) => s.total >= notaMinima && s.total > 0).length;
                const totalReprob = filteredStudents.filter((s: any) => s.total < notaMinima && s.total > 0).length;

                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(40, 44, 52);
                doc.text(`ESTADÍSTICAS DEL MÓDULO`, 20, finalY + 15);

                // Helper para renderizar tarjetas minimalistas y coloridas
                const renderCard = (x: number, r: number, g: number, b: number, title: string, count: number, subtitle: string) => {
                    // Diseño del fondo (Tarjeta)
                    doc.setFillColor(r, g, b);
                    doc.roundedRect(x, finalY + 20, 50, 20, 3, 3, 'F');

                    // Título de la tarjeta
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(255, 255, 255);
                    doc.text(title, x + 5, finalY + 26);

                    // El Número (Grande)
                    doc.setFontSize(22);
                    doc.text(count.toString(), x + 40, finalY + 34, { align: 'center' });

                    // Condición (Pequeña abajo)
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(255, 255, 255);
                    doc.text(subtitle, x + 5, finalY + 36);
                };

                // Aprobados (Verde Esmeralda)
                renderCard(20, 16, 185, 129, 'APROBADOS', totalAprob, `Notas >= ${notaMinima} pts`);

                // Reprobados (Rojo Carmesí)
                renderCard(75, 239, 68, 68, 'REPROBADOS', totalReprob, `Notas < ${notaMinima} pts`);

                // Abandono (Plomo Grisáceo)
                renderCard(130, 100, 116, 139, 'ABANDONO', totalAbandono, `Notas igual a 0 pts`);
            }

            // Footer
            const pageCount = (doc.internal as any).getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8); doc.setTextColor(150);
                doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
                doc.text(`${moduloNombre} — Reporte Generado por Aula Profe`, 20, pageHeight - 15);
            }

            doc.save(`Reporte_${type}_${moduloNombre?.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={cn(
                    "w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden rounded-[2.5rem]",
                    isDark ? "bg-slate-900 border border-slate-800" : "bg-white shadow-2xl"
                )}
            >
                {/* Header */}
                <div className={cn("px-8 py-5 flex items-center justify-between border-b flex-shrink-0", isDark ? "border-slate-800" : "border-slate-100")}>
                    <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-primary")}>
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h2 className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-900")}>Centro de Reportes</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Gestión Académica Integral</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative group/pdf">
                            <button
                                disabled={exporting || loading || !report}
                                className="h-11 px-6 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                            >
                                {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                                {exporting ? 'Generando...' : 'Generar PDF'}
                            </button>

                            {!exporting && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover/pdf:opacity-100 group-hover/pdf:visible transition-all z-[4000] p-2 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Formatos Disponibles</p>
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                        {[
                                            { id: 'detailed', label: 'Reporte Detallado', sub: 'Categorías, actividades y puntajes', icon: FileDown, color: 'text-violet-600', bg: 'bg-violet-50' },
                                            { id: 'attendance', label: 'Por Asistencia', sub: 'Matriz de faltas y atrasos por fecha', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            { id: 'general', label: 'Reporte General', sub: 'Resumen completo de todo el módulo', icon: Search, color: 'text-rose-600', bg: 'bg-rose-50' }
                                        ].map(f => (
                                            <button key={f.id} onClick={() => exportPDF(f.id as any)} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3">
                                                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", isDark ? 'bg-slate-800' : f.bg, f.color)}>
                                                    <f.icon size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-tight leading-none mb-1">{f.label}</p>
                                                    <p className="text-[9px] text-slate-400 line-clamp-1">{f.sub}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className={cn("w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95", isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900")}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Stats bar */}
                {!loading && report && (
                    <div className={cn("px-8 py-3 flex gap-6 border-b flex-shrink-0", isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-50 bg-slate-50/50")}>
                        {[
                            { icon: Users, label: 'Estudiantes', value: filteredStudents.length, color: 'text-violet-500' },
                            { icon: TrendingUp, label: 'Promedio', value: avg, color: 'text-blue-500' },
                            { icon: CheckCircle2, label: 'Aprobados', value: aprobados, color: 'text-emerald-500' },
                        ].map((stat, i) => (
                            <div key={i} className="flex items-center gap-2" title={stat.label}>
                                <stat.icon size={14} className={stat.color} />
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>{stat.label}:</span>
                                <span className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-900")}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className={cn("px-6 py-3 border-b flex-shrink-0", isDark ? "border-slate-800" : "border-slate-100")}>
                    <div className="relative max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar estudiante..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={cn("w-full h-10 pl-11 pr-4 rounded-xl border text-xs font-bold focus:outline-none transition-all", isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800")}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-primary" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generando reporte...</p>
                        </div>
                    ) : !report ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Sin datos disponibles</p>
                        </div>
                    ) : (
                        <div className="inline-block min-w-full align-middle">
                            <table className="min-w-full border-separate border-spacing-0">
                                <thead>
                                    <tr>
                                        <th className={cn("sticky left-0 z-20 px-6 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] border-b border-r", isDark ? "bg-slate-900 text-slate-400 border-slate-800" : "bg-white text-slate-500 border-slate-100")}>
                                            Estudiante
                                        </th>
                                        {report.categorias?.map((c: any) => (
                                            <th key={c.configId || c.nombre} className={cn("px-4 py-4 text-center text-[9px] font-black uppercase tracking-tight border-b min-w-[100px]", isDark ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-100")}>
                                                <div className="text-[7px] opacity-60 mb-1">Categoría</div>
                                                <div className="mb-0.5">{c.nombre}</div>
                                                <span className="opacity-40 font-bold block text-[8px]">{c.peso}pts</span>
                                            </th>
                                        ))}
                                        <th className={cn("px-4 py-4 text-center text-[9px] font-black uppercase tracking-tight border-b min-w-[80px]", isDark ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-100")}>
                                            % Asist.
                                        </th>
                                        <th className="sticky right-0 z-20 px-6 py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] border-b border-l bg-violet-600 text-white min-w-[90px]">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((s: any) => (
                                        <tr key={s.userId} className="group">
                                            <td className={cn("sticky left-0 z-10 px-6 py-3 font-bold text-sm border-b border-r transition-colors group-hover:bg-slate-50/80", isDark ? "bg-slate-900 text-white border-slate-800 dark:group-hover:bg-slate-800/40" : "bg-white text-slate-900 border-slate-100")}>
                                                {s.nombre}
                                            </td>
                                            {report.categorias?.map((c: any) => {
                                                const catData = s.desglose?.find((d: any) => d.nombre === c.nombre);
                                                const aporte = catData?.aporte ?? 0;
                                                const perc = c.peso > 0 ? (aporte / c.peso) * 100 : 0;
                                                return (
                                                    <td key={c.configId || c.nombre} className={cn("px-4 py-3 text-center border-b font-black text-xs", isDark ? "border-slate-800" : "border-slate-100")}>
                                                        <div className={cn(
                                                            "inline-block px-2.5 py-1 rounded-lg text-[11px]",
                                                            perc >= 70 ? "text-emerald-600 bg-emerald-50" :
                                                                perc >= 50 ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50"
                                                        )}>
                                                            {aporte}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className={cn("px-4 py-3 text-center border-b font-black text-xs", isDark ? "border-slate-800" : "border-slate-100")}>
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded-lg text-[11px]",
                                                    (s.asistencia ?? 0) >= 80 ? "text-emerald-600 bg-emerald-50" :
                                                        (s.asistencia ?? 0) >= 50 ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50"
                                                )}>
                                                    {s.asistencia ?? 0}%
                                                </span>
                                            </td>
                                            <td className={cn("sticky right-0 z-10 px-6 py-3 text-center font-black text-base border-b border-l transition-colors group-hover:bg-white", isDark ? "bg-slate-900 border-slate-800 dark:group-hover:bg-slate-800" : "bg-white border-slate-100")}>
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-xl text-[13px] block text-center w-full",
                                                    s.total === 0 ? "bg-slate-500 text-white" :
                                                        s.total >= 70 ? "bg-emerald-500 text-white" :
                                                            s.total >= 51 ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                                                )}>
                                                    {s.total}
                                                </span>
                                                <div className={cn("text-[9px] mt-1.5 font-black uppercase tracking-widest", s.total === 0 ? "text-slate-500" : s.total >= 70 ? "text-emerald-500" : "text-rose-500")}>
                                                    {s.total === 0 ? 'ABANDONO' : s.total >= 70 ? 'APROBADO' : 'REPROBADO'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Legend footer */}
                <div className={cn("px-8 py-3 border-t flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400 flex-shrink-0", isDark ? "border-slate-800" : "border-slate-100")}>
                    <div className="flex gap-5">
                        {[
                            { color: 'bg-emerald-500', label: 'Aprobado ≥70' },
                            { color: 'bg-amber-500', label: 'Regular 51-69' },
                            { color: 'bg-rose-500', label: 'Insuficiente ≤50' },
                        ].map((l, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className={cn("w-2 h-2 rounded-full", l.color)} />
                                {l.label}
                            </div>
                        ))}
                    </div>
                    <div>Aula Profe</div>
                </div>
            </motion.div>
        </div>
    );
}
