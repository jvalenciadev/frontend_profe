'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aulaService } from '@/services/aulaService';
import {
    Calendar as CalendarIcon,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Plus,
    ChevronRight,
    Save,
    Search,
    FileDown,
    QrCode,
    Printer,
    FileText,
    Download,
    RefreshCw,
    ExternalLink,
    Shield,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, getImageUrl } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/navigation';

import { useAula } from '@/contexts/AulaContext';

const QR_TTL_MS = 60 * 60 * 1000; // 60 minutos (coincide con el backend)

interface AttendanceManagerProps {
    moduloId: string;
    theme?: 'light' | 'dark';
    moduloData?: any;
    turnoId?: string;
}

export default function AttendanceManager({ moduloId, theme: themeProp, moduloData, turnoId }: AttendanceManagerProps) {
    const { theme: contextTheme, primaryColor } = useAula();
    const theme = themeProp || contextTheme;

    const hexToRgb = (hex: string): [number, number, number] => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [79, 70, 229];
    };
    const router = useRouter();
    const [sesiones, setSesiones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSesion, setSelectedSesion] = useState<any>(null);
    const [registros, setRegistros] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showQRModal, setShowQRModal] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [showConfirmCreate, setShowConfirmCreate] = useState(false);
    const [isPresencial, setIsPresencial] = useState(true);

    // ─── Estado QR seguro ────────────────────────────────────────────────────
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [qrExpiry, setQrExpiry] = useState<number>(0);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrRemaining, setQrRemaining] = useState(0); // segundos
    const qrTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Helper para evitar desfases de zona horaria al mostrar fechas
    const parseLocalDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        const cleanDate = dateStr.split('T')[0];
        return new Date(cleanDate + 'T12:00:00');
    };

    // ─── Generar token QR seguro ─────────────────────────────────────────────
    const fetchQrToken = useCallback(async (sesionId: string) => {
        setQrLoading(true);
        setQrToken(null);
        if (qrTimerRef.current) clearInterval(qrTimerRef.current);
        try {
            const data = await aulaService.getQrToken(sesionId);
            setQrToken(data.token);
            setQrExpiry(data.expiry);
            const secs = Math.floor((data.expiry - Date.now()) / 1000);
            setQrRemaining(secs);
            toast.success('Código QR generado — válido 60 minutos');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al generar el QR');
        } finally {
            setQrLoading(false);
        }
    }, []);

    // Countdown del QR
    useEffect(() => {
        if (!showQRModal || qrRemaining <= 0) return;
        qrTimerRef.current = setInterval(() => {
            setQrRemaining(prev => {
                if (prev <= 1) { clearInterval(qrTimerRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(qrTimerRef.current!);
    }, [showQRModal, qrRemaining > 0]);

    // Al abrir el modal, genera el token automáticamente
    const handleOpenQRModal = (sesion: any) => {
        setShowQRModal(true);
        fetchQrToken(sesion.id);
    };

    const formatQrTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const loadSesiones = async () => {
        try {
            setLoading(true);
            const data = await aulaService.getAsistenciaModulo(moduloId, turnoId);
            setSesiones(data);
        } catch (err) {
            toast.error('Error al cargar sesiones de asistencia');
        } finally {
            setLoading(false);
        }
    };

    const loadRegistros = async (sesionId: string) => {
        try {
            const data = await aulaService.getRegistrosAsistencia(sesionId);
            setRegistros(data);
        } catch (err) {
            toast.error('Error al cargar registros de alumnos');
        }
    };

    useEffect(() => {
        loadSesiones();
    }, [moduloId, turnoId]);

    const handleCreateSesion = async () => {
        try {
            const fecha = format(new Date(), 'yyyy-MM-dd');
            await aulaService.crearSesionAsistencia(moduloId, { fecha, turnoId, esPresencial: isPresencial });
            toast.success('Sesión de asistencia creada correctamente');
            setShowConfirmCreate(false);
            loadSesiones();
        } catch (err) {
            toast.error('Error al crear sesión');
        }
    };

    const handleOpenSesion = (sesion: any) => {
        setSelectedSesion(sesion);
        loadRegistros(sesion.id);
    };

    const handleSaveAsistencia = async () => {
        try {
            setSaving(true);
            await aulaService.registrarAsistencia(selectedSesion.id, { registros });
            toast.success('Asistencia guardada correctamente');
            loadSesiones(); // Actualizar indicadores
        } catch (err) {
            toast.error('Error al guardar asistencia');
        } finally {
            setSaving(false);
        }
    };

    const updateEstado = (userId: string, nuevoEstado: string) => {
        setRegistros(regs => regs.map(r => r.userId === userId ? { ...r, estado: nuevoEstado } : r));
    };

    const filteredRegistros = registros.filter(r =>
        r.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Legend
    const STATUS_CONFIG: any = {
        P: { label: 'Presente', color: 'emerald', description: 'El estudiante asistió a clase' },
        F: { label: 'Falta', color: 'rose', description: 'Inasistencia no justificada' },
        L: { label: 'Licencia', color: 'amber', description: 'Permiso o licencia médica' },
        T: { label: 'Atraso', color: 'blue', description: 'Llegada después de la hora' },
    };

    const exportToPDF = async () => {
        if (!selectedSesion) return;
        try {
            setIsGeneratingPDF(true);
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;

            // 1. Fondo de documento (Si existe fondo_doc.jpg)
            try {
                // Intentamos cargar el fondo desde public
                doc.addImage('/fondo_doc.jpg', 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
            } catch (err) {
                console.warn('Fondo no encontrado, continuando con PDF plano');
            }

            // 2. Encabezado del reporte
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(40, 44, 52);
            doc.text('REPORTE DE ASISTENCIA', pageWidth / 2, 45, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Fecha: ${format(parseLocalDate(selectedSesion.fecha), "dd 'de' MMMM, yyyy", { locale: es })}`, pageWidth / 2, 52, { align: 'center' });

            // 2.5 Detalles Académicos
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            const startYDetail = 60;
            const leftCol = 20;
            const rightCol = 130; // Ajustado para dar más espacio

            doc.text(`PROGRAMA:`, leftCol, startYDetail);
            doc.setFont('helvetica', 'normal');
            const progName = moduloData?.programaDos?.nombre || moduloData?.programa_dos?.nombre || 'N/A';
            doc.text(`${progName}`, leftCol + 25, startYDetail);

            doc.setFont('helvetica', 'bold');
            doc.text(`MÓDULO:`, leftCol, startYDetail + 5);
            doc.setFont('helvetica', 'normal');
            doc.text(`${moduloData?.nombre || 'N/A'}`, leftCol + 25, startYDetail + 5);

            doc.setFont('helvetica', 'bold');
            doc.text(`SEDE:`, leftCol, startYDetail + 10);
            doc.setFont('helvetica', 'normal');
            const sedeName = selectedSesion.turnoId 
                ? (moduloData?.programaDos?.sede?.nombre || moduloData?.sede?.nombre || 'Sede Central')
                : 'TODAS LAS SEDES / GLOBAL';
            doc.text(`${sedeName}`, leftCol + 25, startYDetail + 10);

            doc.setFont('helvetica', 'bold');
            doc.text(`MODALIDAD:`, leftCol, startYDetail + 15);
            doc.setFont('helvetica', 'normal');
            doc.text(`${selectedSesion.esPresencial ? 'PRESENCIAL' : 'VIRTUAL (REMOTO)'}`, leftCol + 25, startYDetail + 15);

            doc.text(`TURNO:`, rightCol, startYDetail);
            doc.setFont('helvetica', 'normal');
            const sessionTurnoName = selectedSesion.turnoNombre || 'Global';
            doc.text(`${sessionTurnoName}`, rightCol + 25, startYDetail);

            doc.setFont('helvetica', 'bold');
            doc.text(`GENERADO:`, rightCol, startYDetail + 5);
            doc.setFont('helvetica', 'normal');
            doc.text(`${format(new Date(), "dd/MM/yyyy HH:mm")}`, rightCol + 25, startYDetail + 5);

            // 3. Tabla de datos
            const tableData = filteredRegistros.map((reg, i) => [
                i + 1,
                reg.nombre,
                reg.turnoNombre || 'Global',
                STATUS_CONFIG[reg.estado]?.label || reg.estado,
                format(new Date(), 'HH:mm') // Hora de reporte
            ]);

            autoTable(doc, {
                startY: 75,
                head: [['#', 'Nombre del Estudiante', 'Turno', 'Estado', 'Hora']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: hexToRgb(primaryColor),
                    textColor: 255,
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 4,
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    2: { halign: 'center', cellWidth: 30 },
                    3: { halign: 'center', cellWidth: 30 }
                },
                margin: { left: 20, right: 20 }
            });

            // 4. Pie de página
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Generado automáticamente por Aula Profe - Sistema de Inteligencia Educativa', pageWidth / 2, pageHeight - 15, { align: 'center' });

            doc.save(`Asistencia_${format(parseLocalDate(selectedSesion.fecha), 'yyyy-MM-dd')}.pdf`);
            toast.success('Reporte PDF generado correctamente');
        } catch (err) {
            console.error(err);
            toast.error('Error al generar el PDF');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-primary animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando Control de Asistencia...</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar: Sessions List */}
            <div className="lg:col-span-4 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className={cn("text-lg font-black uppercase tracking-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>Sesiones</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historial de registros</p>
                    </div>
                    <button
                        onClick={() => setShowConfirmCreate(true)}
                        className="group flex items-center gap-2 px-5 h-11 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={16} /> Generar Hoy
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                    {sesiones.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => handleOpenSesion(s)}
                            className={cn(
                                "w-full p-4 rounded-[2rem] border transition-all flex items-center justify-between group relative overflow-hidden",
                                selectedSesion?.id === s.id
                                    ? "bg-primary border-primary text-white shadow-xl shadow-primary/30"
                                    : s.esPresencial 
                                        ? (theme === 'dark' ? "bg-slate-900 border-slate-800 text-slate-400 hover:border-emerald-500/50" : "bg-white border-slate-100 text-slate-500 hover:border-emerald-500/30")
                                        : (theme === 'dark' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:border-indigo-500/50 backdrop-blur-sm" : "bg-indigo-50/50 border-indigo-100 text-indigo-600 hover:border-indigo-400/30 backdrop-blur-sm")
                            )}
                        >
                            <div className="flex items-center gap-4 relative z-10 w-full">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all shadow-sm shrink-0",
                                    selectedSesion?.id === s.id 
                                        ? "bg-white/20 text-white" 
                                        : s.esPresencial ? "bg-emerald-500/10 text-emerald-600" : "bg-indigo-500/10 text-indigo-500"
                                )}>
                                    <span className="text-[7px] font-black leading-none mb-0.5">{format(parseLocalDate(s.fecha), 'MMM', { locale: es }).toUpperCase()}</span>
                                    <span className="text-sm font-black leading-none">{format(parseLocalDate(s.fecha), 'dd')}</span>
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className={cn("font-black text-[11px] uppercase tracking-tight truncate", 
                                            selectedSesion?.id === s.id ? "text-white" : theme === 'dark' ? "text-white" : "text-slate-800"
                                        )}>
                                            {s.actividad?.titulo || 'Sesión de Asistencia'}
                                        </p>
                                        <div className={cn("px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                                            selectedSesion?.id === s.id ? "bg-white/20 text-white" : s.esPresencial ? "bg-emerald-500/10 text-emerald-600" : "bg-indigo-500/10 text-indigo-500"
                                        )}>
                                            {s.esPresencial ? 'Presencial' : 'Virtual'}
                                        </div>
                                    </div>
                                    <p className={cn("text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-60", selectedSesion?.id === s.id ? "text-white" : "")}>
                                        {format(parseLocalDate(s.fecha), 'HH:mm')} • {s.turnoNombre || 'Global'}
                                    </p>
                                </div>
                                <ChevronRight size={14} className={cn("transition-all shrink-0", selectedSesion?.id === s.id ? "text-white translate-x-1" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1")} />
                            </div>
                        </button>
                    ))}
                    {sesiones.length === 0 && (
                        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] space-y-3">
                            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-300">
                                <CalendarIcon size={20} />
                            </div>
                            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Sin sesiones registradas</p>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className={cn("p-8 rounded-[2.5rem] border space-y-6", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leyenda de Estados</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]: [string, any]) => (
                            <div key={key} className="flex items-center gap-4 group">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-lg transition-transform group-hover:scale-110",
                                    cfg.color === 'emerald' ? 'bg-emerald-500 shadow-emerald-500/20' :
                                        cfg.color === 'rose' ? 'bg-rose-500 shadow-rose-500/20' :
                                            cfg.color === 'amber' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-500 shadow-blue-500/20'
                                )}>
                                    {key}
                                </div>
                                <div>
                                    <span className={cn("text-[10px] font-black uppercase tracking-tight block", theme === 'dark' ? "text-slate-200" : "text-slate-800")}>{cfg.label}</span>
                                    <span className="text-[9px] font-medium text-slate-500">{cfg.description}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Area: Registration */}
            <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                    {selectedSesion ? (
                        <motion.div
                            key={selectedSesion.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={cn(
                                "rounded-[2.5rem] border overflow-hidden flex flex-col h-full min-h-[600px]",
                                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/50"
                            )}
                        >
                            <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-4 bg-slate-50/30 dark:bg-slate-800/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-primary">
                                        <CalendarIcon size={24} />
                                    </div>
                                    <div>
                                        <h4 className={cn("text-lg font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                            {selectedSesion.actividad?.titulo || 'Asistencia'}
                                        </h4>
                                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                                            {format(parseLocalDate(selectedSesion.fecha), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => handleOpenQRModal(selectedSesion)}
                                        className="h-10 px-4 rounded-xl border-2 border-primary/40 text-primary bg-primary/5 flex items-center gap-2 font-black text-[9px] uppercase tracking-widest hover:bg-primary/10 transition-all shadow-sm"
                                    >
                                        <QrCode size={14} /> QR
                                    </button>
                                    <button
                                        onClick={exportToPDF}
                                        disabled={isGeneratingPDF}
                                        className="h-10 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 flex items-center gap-2 font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                    >
                                        {isGeneratingPDF ? <Printer size={14} className="animate-spin" /> : <Download size={14} />} PDF
                                    </button>
                                    <button
                                        onClick={() => setRegistros(rs => rs.map(r => ({ ...r, estado: 'P' })))}
                                        className="h-10 px-4 rounded-xl bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        Todos P
                                    </button>
                                </div>

                                <div className="relative w-full xl:w-48">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Filtrar..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className={cn(
                                            "w-full h-10 pl-10 pr-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all focus:outline-none focus:ring-4",
                                            theme === 'dark' ? "bg-slate-800 border-slate-700 text-white focus:ring-primary/10" : "bg-white border-slate-100 focus:bg-white"
                                        )}
                                    />
                                </div>
                            </header>

                            <div className="flex-1 overflow-y-auto p-6 space-y-2 no-scrollbar">
                                {filteredRegistros.map((reg) => (
                                    <div
                                        key={reg.userId}
                                        className={cn(
                                            "flex items-center justify-between p-3 px-5 rounded-2xl border transition-all",
                                            theme === 'dark' ? "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50" : "bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg hover:border-primary/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                                {reg.imagen ? <img src={getImageUrl(reg.imagen)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><Users size={16} /></div>}
                                            </div>
                                            <div>
                                                <p className={cn("font-black text-xs", theme === 'dark' ? "text-white" : "text-slate-800")}>{reg.nombre}</p>
                                                <p className="text-[9px] font-black text-primary uppercase tracking-tighter">{reg.turnoNombre}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-1.5">
                                            <StatusButton
                                                active={reg.estado === 'P'}
                                                label="P"
                                                color="emerald"
                                                fullName="Presente"
                                                onClick={() => updateEstado(reg.userId, 'P')}
                                                theme={theme}
                                            />
                                            <StatusButton
                                                active={reg.estado === 'F'}
                                                label="F"
                                                color="rose"
                                                fullName="Falta"
                                                onClick={() => updateEstado(reg.userId, 'F')}
                                                theme={theme}
                                            />
                                            <StatusButton
                                                active={reg.estado === 'L'}
                                                label="L"
                                                color="amber"
                                                fullName="Licencia"
                                                onClick={() => updateEstado(reg.userId, 'L')}
                                                theme={theme}
                                            />
                                            <StatusButton
                                                active={reg.estado === 'T'}
                                                label="T"
                                                color="blue"
                                                fullName="Atraso"
                                                onClick={() => updateEstado(reg.userId, 'T')}
                                                theme={theme}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <footer className="p-6 px-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex justify-end">
                                <button
                                    onClick={handleSaveAsistencia}
                                    disabled={saving}
                                    style={{ backgroundColor: 'var(--aula-primary)' }}
                                    className="px-8 h-12 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                                >
                                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                    {saving ? 'Guardando...' : 'Guardar Asistencia'}
                                </button>
                            </footer>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-200">
                                <CalendarIcon size={48} />
                            </div>
                            <div className="space-y-2">
                                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Selecciona una sesión</p>
                                <p className="text-slate-300 text-sm max-w-xs mx-auto">Elige una fecha de la lista para gestionar el control de asistencia de tus alumnos.</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── QR Modal Seguro ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {showQRModal && selectedSesion && (() => {
                    const qrUrl = qrToken
                        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/aula/asistencia/marcar?token=${encodeURIComponent(qrToken)}`
                        : '';
                    const pct = qrRemaining > 0 ? (qrRemaining / (QR_TTL_MS / 1000)) * 100 : 0;
                    const isWarn = qrRemaining < 300;
                    const isDanger = qrRemaining < 60;
                    const isExpired = qrRemaining <= 0 && !!qrToken;

                    return (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                className={cn(
                                    "max-w-md w-full rounded-[3rem] overflow-hidden relative shadow-2xl",
                                    theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white"
                                )}
                            >
                                {/* Accent top */}
                                <div className="h-1.5 w-full" style={{ backgroundColor: 'var(--aula-primary)' }} />

                                <div className="p-8 space-y-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <QrCode size={20} style={{ color: 'var(--aula-primary)' }} />
                                                <h3 className={cn("text-xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>Asistencia QR</h3>
                                            </div>
                                            <p className="text-slate-400 text-xs font-medium">
                                                {format(parseLocalDate(selectedSesion.fecha), "dd 'de' MMMM, yyyy", { locale: es })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Botón página completa */}
                                            <button
                                                onClick={() => {
                                                    const modNombre = encodeURIComponent(moduloData?.nombre || 'Módulo');
                                                    const fecha = encodeURIComponent(format(parseLocalDate(selectedSesion.fecha), 'dd/MM/yyyy'));
                                                    router.push(`/aula/asistencia/qr?sesionId=${selectedSesion.id}&modulo=${modNombre}&fecha=${fecha}`);
                                                }}
                                                title="Abrir en página completa (con impresión)"
                                                className={cn(
                                                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110",
                                                    theme === 'dark' ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"
                                                )}
                                            >
                                                <ExternalLink size={15} />
                                            </button>
                                            <button
                                                onClick={() => { setShowQRModal(false); clearInterval(qrTimerRef.current!); }}
                                                className={cn(
                                                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110",
                                                    theme === 'dark' ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"
                                                )}
                                            >
                                                <X size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* QR Display */}
                                    <div className="flex justify-center">
                                        {qrLoading ? (
                                            <div className="w-52 h-52 flex items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--aula-primary)' }} />
                                            </div>
                                        ) : isExpired ? (
                                            <div className="w-52 h-52 flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-rose-300 bg-rose-50 dark:bg-rose-950/20">
                                                <XCircle size={40} className="text-rose-500" />
                                                <p className="text-rose-500 font-black text-xs">Código expirado</p>
                                            </div>
                                        ) : qrUrl ? (
                                            <div className={cn(
                                                "p-4 rounded-3xl border-2 transition-colors duration-500",
                                                isDanger ? "border-rose-400" : isWarn ? "border-amber-400" : "border-slate-100 dark:border-slate-700"
                                            )}>
                                                <QRCodeSVG
                                                    value={qrUrl}
                                                    size={192}
                                                    level="H"
                                                    includeMargin={false}
                                                    fgColor={theme === 'dark' ? '#ffffff' : '#0f172a'}
                                                    bgColor={theme === 'dark' ? '#0f172a' : '#ffffff'}
                                                />
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Countdown */}
                                    {!qrLoading && !isExpired && qrRemaining > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5 text-slate-400">
                                                    <Clock size={11} /> Validez
                                                </span>
                                                <span className={cn(
                                                    "font-mono text-base",
                                                    isDanger ? "text-rose-500" : isWarn ? "text-amber-500" : "text-emerald-500"
                                                )}>
                                                    {formatQrTime(qrRemaining)}
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: isDanger ? '#ef4444' : isWarn ? '#f59e0b' : 'var(--aula-primary)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Info seguridad */}
                                    <div className={cn(
                                        "rounded-2xl p-3 text-xs flex items-start gap-2",
                                        theme === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"
                                    )}>
                                        <Shield size={12} className="shrink-0 mt-0.5" style={{ color: 'var(--aula-primary)' }} />
                                        <span className="font-medium leading-relaxed">
                                            Token firmado · solo válido para <strong>este turno y sede</strong> · expira en 60 min · no reutilizable
                                        </span>
                                    </div>

                                    {/* Acciones */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => fetchQrToken(selectedSesion.id)}
                                            disabled={qrLoading}
                                            className={cn(
                                                "h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border",
                                                theme === 'dark'
                                                    ? "bg-slate-800 border-slate-700 text-white"
                                                    : "bg-slate-100 border-slate-200 text-slate-700"
                                            )}
                                        >
                                            <RefreshCw size={14} className={qrLoading ? 'animate-spin' : ''} />
                                            {isExpired ? 'Nuevo QR' : 'Renovar'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!qrToken || isExpired) return toast.error('Genera un nuevo QR antes de imprimir');
                                                const modNombre = encodeURIComponent(moduloData?.nombre || 'Módulo');
                                                const fecha = encodeURIComponent(format(parseLocalDate(selectedSesion.fecha), 'dd/MM/yyyy'));
                                                router.push(`/aula/asistencia/qr?sesionId=${selectedSesion.id}&modulo=${modNombre}&fecha=${fecha}`);
                                            }}
                                            disabled={!qrToken || isExpired}
                                            className="h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                                            style={{ backgroundColor: 'var(--aula-primary)' }}
                                        >
                                            <Printer size={14} />
                                            Ver / Imprimir
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>

            <ConfirmCreateModal
                isOpen={showConfirmCreate}
                onClose={() => setShowConfirmCreate(false)}
                onConfirm={handleCreateSesion}
                theme={theme}
                isPresencial={isPresencial}
                setIsPresencial={setIsPresencial}
            />
        </div>
    );
}

function LegendItem({ label, name, color }: { label: string, name: string, color: string }) {
    const colors: any = {
        emerald: 'bg-emerald-500',
        rose: 'bg-rose-500',
        amber: 'bg-amber-500',
        blue: 'bg-blue-500',
    };
    return (
        <div className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0", colors[color])}>
                {label}
            </div>
            <span className="text-[10px] font-bold text-slate-500 truncate">{name}</span>
        </div>
    );
}

function StatusButton({ active, label, color, fullName, onClick, theme }: any) {
    const colors: any = {
        emerald: active ? 'bg-emerald-500 border-emerald-500 text-white' : 'hover:border-emerald-500 text-emerald-500 bg-emerald-500/5',
        rose: active ? 'bg-rose-500 border-rose-500 text-white' : 'hover:border-rose-500 text-rose-500 bg-rose-500/5',
        amber: active ? 'bg-amber-500 border-amber-500 text-white' : 'hover:border-amber-500 text-amber-500 bg-amber-500/5',
        blue: active ? 'bg-blue-500 border-blue-500 text-white' : 'hover:border-blue-500 text-blue-500 bg-blue-500/5',
    };

    return (
        <button
            title={fullName}
            onClick={onClick}
            className={cn(
                "w-8 h-8 rounded-lg border-2 font-black text-[10px] transition-all flex items-center justify-center",
                colors[color]
            )}
        >
            {label}
        </button>
    );
}

// ─── Modal de Confirmación Generación ────────────────────────
function ConfirmCreateModal({ isOpen, onClose, onConfirm, theme, isPresencial, setIsPresencial }: any) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={cn(
                            "max-w-sm w-full rounded-[2.5rem] p-10 text-center space-y-8 relative overflow-hidden shadow-2xl",
                            theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white"
                        )}
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />
                        
                        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                            <CalendarIcon size={40} />
                        </div>

                        <div className="space-y-6">
                            <h3 className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                ¿Generar asistencia?
                            </h3>
                            
                            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                <button 
                                    onClick={() => setIsPresencial(true)}
                                    className={cn("flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", 
                                        isPresencial ? "bg-white dark:bg-slate-700 text-primary shadow-md" : "text-slate-400"
                                    )}
                                >
                                    Presencial
                                </button>
                                <button 
                                    onClick={() => setIsPresencial(false)}
                                    className={cn("flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", 
                                        !isPresencial ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-md" : "text-slate-400"
                                    )}
                                >
                                    Virtual
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={onClose}
                                className={cn(
                                    "h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
                                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                )}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onConfirm}
                                style={{ backgroundColor: isPresencial ? 'var(--aula-primary)' : '#6366f1' }}
                                className="h-14 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                            >
                                Sí, Generar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
