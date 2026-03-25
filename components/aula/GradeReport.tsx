'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    X, Search, FileDown, Loader2, BarChart3,
    CheckCircle2, Trophy, TrendingUp, Users
} from 'lucide-react';
import { useAula } from '@/contexts/AulaContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GradeReportProps {
    moduloId: string;
    turnoId: string;
    onClose: () => void;
    theme: 'light' | 'dark';
    moduloNombre?: string;
    moduloData?: any; // Añadido opcional
}

export default function GradeReport({ moduloId, turnoId, onClose, theme, moduloNombre }: GradeReportProps) {
    const { secondaryColor } = useAula();
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
        s.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
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

    const exportPDF = async (type: 'activity' | 'summary' | 'badges' | 'attendance' | 'general') => {
        setExporting(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // 1. Fondo
            try { doc.addImage('/fondo_doc.jpg', 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST'); } catch (e) { }

            // 2. Encabezado
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(40, 44, 52);
            const titleMap = {
                activity: 'REPORTE DETALLADO POR ACTIVIDAD',
                summary: 'REPORTE DE CALIFICACIÓN POR CATEGORÍA',
                badges: 'REPORTE DE INSIGNIAS Y RECONOCIMIENTOS',
                attendance: 'REPORTE DETALLADO DE ASISTENCIA',
                general: 'REPORTE GENERAL ACADÉMICO'
            };
            doc.text(titleMap[type], pageWidth / 2, 45, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth / 2, 52, { align: 'center' });

            // 3. Detalles Académicos
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            const startYDetail = 60;
            const leftCol = 20;
            const rightCol = pageWidth - 100;

            doc.text(`PROGRAMA:`, leftCol, startYDetail);
            doc.setFont('helvetica', 'normal');
            doc.text(`${fullModulo?.programaDos?.nombre || 'PROFE'}`, leftCol + 25, startYDetail);

            doc.setFont('helvetica', 'bold');
            doc.text(`MÓDULO:`, leftCol, startYDetail + 5);
            doc.setFont('helvetica', 'normal');
            doc.text(`${moduloNombre || 'N/A'}`, leftCol + 25, startYDetail + 5);

            doc.setFont('helvetica', 'bold');
            doc.text(`TURNO:`, rightCol, startYDetail);
            doc.setFont('helvetica', 'normal');
            const turnLabel = turnoId === 'global' ? 'GLOBAL / CENTRAL' : (report?.estudiantes?.[0]?.turnoNombre || 'ÚNICO');
            doc.text(turnLabel, rightCol + 25, startYDetail);

            const primaryRGB = hexToRgb(secondaryColor);

            // 4. Lógica de Tablas
            if (type === 'activity') {
                const acts = report.headers || [];
                const tableHeaders = ['#', 'Estudiante', ...acts.map((h: any) => h.titulo.substring(0, 10)), 'Total', 'Estado'];
                const tableBody = filteredStudents.map((s: any, idx: number) => [
                    idx + 1,
                    s.nombreCompleto,
                    ...acts.map((h: any) => s.scores[h.id] || 0),
                    s.total,
                    s.total >= notaMinima ? 'APROBADO' : 'REPROBADO'
                ]);
                autoTable(doc, {
                    startY: 75,
                    head: [tableHeaders as any],
                    body: tableBody as any[],
                    theme: 'grid',
                    headStyles: { fillColor: primaryRGB, fontSize: 7, halign: 'center' },
                    styles: { fontSize: 7, cellPadding: 2.5 },
                    didParseCell: (data) => {
                        if (data.column.index === tableHeaders.length - 1 && data.section === 'body') {
                            const val = data.cell.raw as string;
                            data.cell.styles.textColor = val === 'APROBADO' ? [16, 185, 129] : [239, 68, 68];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                });
            } else if (type === 'summary') {
                const categories = Array.from(new Set(report.headers.map((h: any) => h.categoriaNombre)));
                const tableHeaders = ['#', 'Estudiante', ...categories, 'Nota Final', 'Resultado'];
                const tableBody = filteredStudents.map((s: any, idx: number) => {
                    const rowScores = categories.map(cat => {
                        const actsInCat = report.headers.filter((h: any) => h.categoriaNombre === cat);
                        return actsInCat.reduce((sum: number, h: any) => sum + (s.scores[h.id] || 0), 0);
                    });
                    return [idx + 1, s.nombreCompleto, ...rowScores, s.total, s.total >= notaMinima ? 'APROBADO' : 'REPROBADO'];
                });
                autoTable(doc, {
                    startY: 75,
                    head: [tableHeaders as any],
                    body: tableBody as any[],
                    theme: 'grid',
                    headStyles: { fillColor: primaryRGB, fontSize: 8, halign: 'center' },
                    styles: { fontSize: 8, cellPadding: 3 },
                    didParseCell: (data) => {
                        if (data.column.index === tableHeaders.length - 1 && data.section === 'body') {
                            const val = data.cell.raw as string;
                            data.cell.styles.textColor = val === 'APROBADO' ? [16, 185, 129] : [239, 68, 68];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                });
            } else if (type === 'badges') {
                const tableHeaders = ['#', 'Estudiante', 'Insignias Ganadas', 'Total Insignias'];
                const tableBody = filteredStudents.map((s: any, idx: number) => [
                    idx + 1,
                    s.nombreCompleto,
                    s.insignias?.map((i: any) => i.nombre).join(', ') || 'Sin insignias',
                    s.insignias?.length || 0
                ]);
                autoTable(doc, {
                    startY: 75,
                    head: [tableHeaders as any],
                    body: tableBody as any[],
                    theme: 'grid',
                    headStyles: { fillColor: primaryRGB, fontSize: 9, halign: 'center' },
                    styles: { fontSize: 9, cellPadding: 4 }
                });
            } else if (type === 'attendance') {
                setFetchingAttendance(true);
                const sessions = await aulaService.getAsistenciaModulo(moduloId, turnoId);
                const tableHeaders = ['#', 'Estudiante', ...sessions.map((sess: any) => new Date(sess.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })), '%'];
                const allRegs = await Promise.all(sessions.map((sess: any) => aulaService.getRegistrosAsistencia(sess.id)));
                const tableBody = filteredStudents.map((s: any, idx: number) => {
                    const row = [idx + 1, s.nombreCompleto];
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
                    startY: 75,
                    head: [tableHeaders as any],
                    body: tableBody as any[],
                    theme: 'grid',
                    headStyles: { fillColor: primaryRGB, fontSize: 6.5, halign: 'center' },
                    styles: { fontSize: 6.5, halign: 'center', cellPadding: 1.5 },
                    columnStyles: { 1: { halign: 'left', cellWidth: 45 } }
                });
                setFetchingAttendance(false);
            } else if (type === 'general') {
                const tableHeaders = ['#', 'Estudiante', 'Promedio Notas', 'Asistencia %', 'Insignias', 'Estado Final'];
                const tableBody = filteredStudents.map((s: any, idx: number) => [
                    idx + 1,
                    s.nombreCompleto,
                    s.total,
                    `${s.asistencia}%`,
                    s.insignias?.length || 0,
                    s.total >= notaMinima ? 'APROBADO' : 'REPROBADO'
                ]);
                autoTable(doc, {
                    startY: 75,
                    head: [tableHeaders as any],
                    body: tableBody as any[],
                    theme: 'grid',
                    headStyles: { fillColor: primaryRGB, fontSize: 9, halign: 'center' },
                    styles: { fontSize: 9, cellPadding: 4 },
                    didParseCell: (data) => {
                        if (data.column.index === 5 && data.section === 'body') {
                            const val = data.cell.raw as string;
                            data.cell.styles.textColor = val === 'APROBADO' ? [16, 185, 129] : [239, 68, 68];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                });
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
                                            { id: 'activity', label: 'Por Actividad', sub: 'Puntajes detallados por cada tarea/foro', icon: FileDown, color: 'text-violet-600', bg: 'bg-violet-50' },
                                            { id: 'summary', label: 'Por Categoría', sub: 'Resultado final y aprobado/reprobado', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                            { id: 'badges', label: 'Por Insignias', sub: 'Listado de logros y reconocimientos', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
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
                            { icon: Trophy, label: 'Con Insignias', value: filteredStudents.filter((s: any) => s.insignias?.length > 0).length, color: 'text-amber-500' },
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
                                        {headers.map((h: any) => (
                                            <th key={h.id} className={cn("px-4 py-4 text-center text-[9px] font-black uppercase tracking-tight border-b min-w-[100px]", isDark ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-100")}>
                                                <div className="text-[7px] opacity-60 mb-1">{h.categoriaNombre}</div>
                                                <div className="mb-0.5">{h.titulo}</div>
                                                <span className="opacity-40 font-bold block text-[8px]">/{h.puntajeMax}pts</span>
                                            </th>
                                        ))}
                                        <th className={cn("px-4 py-4 text-center text-[9px] font-black uppercase tracking-tight border-b min-w-[80px]", isDark ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-100")}>
                                            Asistencia
                                        </th>
                                        <th className={cn("px-4 py-4 text-center text-[9px] font-black uppercase tracking-tight border-b min-w-[100px]", isDark ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-100")}>
                                            Insignias
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
                                                {s.nombreCompleto}
                                            </td>
                                            {headers.map((h: any) => {
                                                const score = s.scores?.[h.id] ?? 0;
                                                const perc = h.puntajeMax > 0 ? (score / h.puntajeMax) * 100 : 0;
                                                return (
                                                    <td key={h.id} className={cn("px-4 py-3 text-center border-b font-black text-xs", isDark ? "border-slate-800" : "border-slate-100")}>
                                                        <div className={cn(
                                                            "inline-block px-2.5 py-1 rounded-lg text-[11px]",
                                                            perc >= 70 ? "text-emerald-600 bg-emerald-50" :
                                                                perc >= 50 ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50"
                                                        )}>
                                                            {score}
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
                                            <td className={cn("px-4 py-3 text-center border-b", isDark ? "border-slate-800" : "border-slate-100")}>
                                                <div className="flex justify-center -space-x-1.5">
                                                    {(s.insignias?.length ?? 0) > 0 ? s.insignias.slice(0, 3).map((ins: any, idx: number) => (
                                                        <div
                                                            key={ins.id || idx}
                                                            title={ins.nombre || ins.tipo}
                                                            className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black"
                                                            style={{ background: ins.color || '#6366f1', color: 'white' }}
                                                        >
                                                            {ins.nombre?.charAt(0) || '🏅'}
                                                        </div>
                                                    )) : (
                                                        <span className="text-slate-300 dark:text-slate-700 text-[10px]">—</span>
                                                    )}
                                                    {(s.insignias?.length || 0) > 3 && (
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-500">
                                                            +{s.insignias.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={cn("sticky right-0 z-10 px-6 py-3 text-center font-black text-base border-b border-l transition-colors group-hover:bg-white", isDark ? "bg-slate-900 border-slate-800 dark:group-hover:bg-slate-800" : "bg-white border-slate-100")}>
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-xl text-[13px]",
                                                    s.total >= 70 ? "bg-emerald-500 text-white" :
                                                        s.total >= 51 ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                                                )}>
                                                    {s.total}
                                                </span>
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
