'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    X, Search, Users, Loader2, CheckCircle2,
    ChevronDown, FileDown, Printer, SortAsc
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';

interface StudentListProps {
    moduloId: string;
    turnoId: string;
    onClose: () => void;
    theme: 'light' | 'dark';
    moduloNombre?: string;
}

export default function StudentList({ moduloId, turnoId, onClose, theme, moduloNombre }: StudentListProps) {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'email'>('name');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        async function loadStudents() {
            setLoading(true);
            try {
                const data = await aulaService.getEstudiantes(moduloId, turnoId);
                setStudents(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadStudents();
    }, [moduloId, turnoId]);

    const filtered = students
        .filter(s => {
            const name = s.persona?.nombreCompleto || s.persona?.nombre || '';
            const email = s.persona?.correo || '';
            return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                email.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
            const na = (a.persona?.nombreCompleto || a.persona?.nombre || '');
            const nb = (b.persona?.nombreCompleto || b.persona?.nombre || '');
            if (sortBy === 'name') return na.localeCompare(nb);
            return (a.persona?.correo || '').localeCompare(b.persona?.correo || '');
        });

    const isDark = theme === 'dark';

    const avatarColors = [
        'bg-violet-600', 'bg-rose-600', 'bg-emerald-600',
        'bg-amber-600', 'bg-sky-600', 'bg-fuchsia-600',
    ];
    const getColor = (name: string) => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];

    const exportPDF = async () => {
        setExporting(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // 1. Fondo de documento
            try {
                doc.addImage('/fondo_doc.jpg', 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
            } catch (err) { }

            // 2. Encabezado del reporte
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(40, 44, 52);
            doc.text('NÓMINA DE ESTUDIANTES', pageWidth / 2, 45, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth / 2, 52, { align: 'center' });

            // 3. Detalles Académicos
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            const startYDetail = 65;
            const leftCol = 22;

            doc.text(`PROGRAMA:`, leftCol, startYDetail);
            doc.setFont('helvetica', 'normal');
            doc.text(`${(filtered[0] as any)?.programa?.nombre || 'PROFE'}`, leftCol + 25, startYDetail);

            doc.setFont('helvetica', 'bold');
            doc.text(`MÓDULO:`, leftCol, startYDetail + 5);
            doc.setFont('helvetica', 'normal');
            doc.text(`${moduloNombre || 'N/A'}`, leftCol + 25, startYDetail + 5);

            doc.setFont('helvetica', 'bold');
            doc.text(`TURNO:`, leftCol, startYDetail + 10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${turnoId === 'global' ? 'Global / Central' : (filtered[0] as any)?.turno?.turnoConfig?.nombre || 'Único'}`, leftCol + 25, startYDetail + 10);

            // 4. Tabla de Estudiantes
            const tableHeaders = ['#', 'Nombre Completo', 'Correo Electrónico', 'Identificación', 'Firma'];
            const tableBody = filtered.map((s, idx) => [
                idx + 1,
                (s.persona?.nombreCompleto || s.persona?.nombre || 'N/A').toUpperCase(),
                s.persona?.correo || '-',
                s.persona?.ci || '-',
                ''
            ]);

            autoTable(doc, {
                startY: 85,
                head: [tableHeaders],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8, halign: 'center', fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 3.5 },
                columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 4: { cellWidth: 35 } }
            });

            // 5. Pie de página
            const totalPages = (doc.internal as any).getNumberOfPages();
            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Página ${p} de ${totalPages}`, pageWidth - 22, pageHeight - 15, { align: 'right' });
                doc.text('PROFE — Sistema de Gestión Académica', 22, pageHeight - 15);
            }

            doc.save(`nomina_${(moduloNombre || 'modulo').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (e) {
            console.error(e);
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
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className={cn(
                    "w-full max-w-4xl flex flex-col overflow-hidden rounded-[2.5rem]",
                    "max-h-[90vh]",
                    isDark ? "bg-slate-900 border border-slate-800" : "bg-white shadow-2xl"
                )}
            >
                {/* Header */}
                <div className={cn("px-8 py-5 flex-shrink-0 flex items-center justify-between border-b", isDark ? "border-slate-800" : "border-slate-100")}>
                    <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-primary")}>
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-900")}>Nómina del Módulo</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                                {students.length} participantes inscritos
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportPDF}
                            disabled={exporting || loading}
                            className={cn(
                                "h-11 px-5 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all",
                                "bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
                            )}
                        >
                            {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                            {exporting ? 'Generando...' : 'PDF'}
                        </button>
                        <button
                            onClick={onClose}
                            className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900")}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Search + Sort */}
                <div className={cn("px-6 py-3 flex gap-3 flex-shrink-0 border-b", isDark ? "border-slate-800" : "border-slate-100")}>
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={cn(
                                "w-full h-10 pl-11 pr-4 rounded-xl border text-xs font-bold focus:outline-none transition-all",
                                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                            )}
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className={cn(
                                "h-10 pl-4 pr-10 rounded-xl border text-[10px] font-black uppercase tracking-wider appearance-none cursor-pointer focus:outline-none",
                                isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                            )}
                        >
                            <option value="name">A→Z Nombre</option>
                            <option value="email">A→Z Correo</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* List */}
                <div className={cn("flex-1 overflow-y-auto px-5 py-4", isDark ? "bg-slate-900" : "bg-slate-50/50")}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-primary" size={36} />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando nómina...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto", isDark ? "bg-slate-800" : "bg-slate-200")}>
                                <Users className="text-slate-400" size={30} />
                            </div>
                            <p className={cn("text-lg font-black", isDark ? "text-slate-400" : "text-slate-600")}>
                                {searchTerm ? 'Sin resultados' : 'Nómina vacía'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filtered.map((item, i) => {
                                const name = item.persona?.nombreCompleto || item.persona?.nombre || 'Estudiante';
                                const email = item.persona?.correo;
                                const img = item.persona?.imagen;
                                return (
                                    <div
                                        key={item.id || i}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                            isDark
                                                ? "bg-slate-800/60 border-slate-700 hover:border-slate-500"
                                                : "bg-white border-slate-200 hover:border-violet-300 hover:shadow-sm"
                                        )}
                                    >
                                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 overflow-hidden", getColor(name))}>
                                            {img ? <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" /> : name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("font-bold text-sm truncate", isDark ? "text-slate-200" : "text-slate-800")}>{name}</p>
                                            {email && <p className="text-[10px] text-slate-400 truncate">{email}</p>}
                                        </div>
                                        <div className="flex-shrink-0">
                                            <CheckCircle2 size={15} className="text-emerald-500" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={cn("px-8 py-3 border-t flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400", isDark ? "border-slate-800" : "border-slate-100")}>
                    <span>{filtered.length} de {students.length} participantes</span>
                    <span>Aula Profe</span>
                </div>
            </motion.div>
        </div>
    );
}
