'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, X, FileJson, Calendar, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { aulaService } from '@/services/aulaService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MigrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    moduloId: string;
    turnoId?: string | null;
    cursoTitulo?: string;
    onSuccess: () => void;
    theme: 'light' | 'dark';
}

export default function MigrationModal({
    isOpen,
    onClose,
    moduloId,
    turnoId,
    cursoTitulo,
    onSuccess,
    theme
}: MigrationModalProps) {
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [fileData, setFileData] = useState<any>(null);
    const [fileName, setFileName] = useState<string>('');
    const [ajustarFechas, setAjustarFechas] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDark = theme === 'dark';

    if (!isOpen) return null;

    // --- MANEJO DE EXPORTACIÓN ---
    const handleExport = async () => {
        setLoading(true);
        try {
            const data = await aulaService.exportarCurso(moduloId, turnoId || undefined);

            // Crear el blob del JSON
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(data, null, 2)
            )}`;
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', jsonString);

            // Nombre de archivo descriptivo
            const sanitizeTitle = (cursoTitulo || 'curso')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/(^_+|_+$)/g, '');
            downloadAnchor.setAttribute('download', `banco_aula_${sanitizeTitle}.json`);

            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            toast.success('Estructura académica exportada con éxito');
        } catch (err: any) {
            toast.error('Error al exportar la estructura académica del curso');
        } finally {
            setLoading(false);
        }
    };

    // --- PROCESAR ARCHIVO SUBIDO ---
    const processFile = (file: File) => {
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            return toast.error('Tipo de archivo no válido. Solo se admiten archivos JSON.');
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target?.result as string);
                if (!parsed.unidades || !Array.isArray(parsed.unidades)) {
                    throw new Error('Estructura inválida. Falta el campo "unidades".');
                }
                setFileData(parsed);
                setFileName(file.name);
                toast.success('Archivo de curso cargado correctamente');
            } catch (err: any) {
                toast.error('Archivo corrupto o con formato no compatible de Aula Profe');
            }
        };
        reader.readAsText(file);
    };

    // --- DRAG AND DROP EVENTS ---
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    // --- MANEJO DE IMPORTACIÓN ---
    const handleImport = async () => {
        if (!fileData) return toast.error('Por favor, cargue un archivo JSON válido primero');
        setLoading(true);
        try {
            await aulaService.importarCurso(moduloId, fileData, ajustarFechas, turnoId || undefined);
            toast.success('Curso migrado y recreado con éxito');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al importar y migrar el contenido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={cn(
                    "w-full max-w-2xl rounded-[3rem] p-8 md:p-10 space-y-6 md:space-y-8 relative overflow-hidden border shadow-2xl transition-all duration-300",
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                )}
            >
                {/* Header */}
                <header className="flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                        </div>
                        <div>
                            <h2 className={cn("text-xl md:text-2xl font-black tracking-tight leading-none mb-1.5", isDark ? "text-white" : "text-slate-900")}>
                                Migración de <span className="text-primary">Curso</span>
                            </h2>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                Exporta o importa contenidos académicos completos
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="group w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all active:scale-95"
                    >
                        <X size={18} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </header>

                <div className="space-y-6 overflow-y-auto no-scrollbar max-h-[70vh] pr-1">
                    {/* Sección 1: Exportar */}
                    <div className={cn("p-6 rounded-3xl border transition-all", isDark ? "bg-slate-800/20 border-slate-800" : "bg-slate-50/50 border-slate-100")}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className={cn("text-xs font-black uppercase tracking-widest flex items-center gap-2", isDark ? "text-white" : "text-slate-800")}>
                                    <Download size={14} className="text-primary" /> Respaldar / Exportar Curso
                                </h3>
                                <p className="text-[10px] font-medium text-slate-400 leading-relaxed mt-1">
                                    Genera un archivo JSON portátil con todas las unidades temáticas, actividades (foros, tareas, cuestionarios con preguntas y opciones) y recursos actuales.
                                </p>
                            </div>
                            <button
                                onClick={handleExport}
                                disabled={loading}
                                className="h-12 px-6 shrink-0 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Download size={14} /> Descargar JSON
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">O Importar en este Curso</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    </div>

                    {/* Sección 2: Importar / Subir */}
                    <div className="space-y-4">
                        {/* Drag and Drop Zone */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[160px]",
                                dragActive
                                    ? "border-primary bg-primary/5 scale-[0.99]"
                                    : (isDark ? "border-slate-800 hover:border-slate-700 bg-slate-900/40" : "border-slate-200 hover:border-slate-300 bg-slate-50/20")
                            )}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />

                            {fileData ? (
                                <>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                                        <FileJson size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className={cn("text-xs font-black", isDark ? "text-white" : "text-slate-800")}>{fileName}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                            {fileData.unidades?.length || 0} Unidades detectadas
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-lg shadow-primary/5">
                                        <Upload size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className={cn("text-xs font-black", isDark ? "text-white" : "text-slate-800")}>
                                            Arrastra el archivo JSON o haz clic para buscar
                                        </p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                            Solo archivos .json de Aula Profe
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {fileData && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {/* Ajuste de fechas toggle */}
                                <div className={cn("p-4 rounded-2xl border flex items-center justify-between gap-4", isDark ? "bg-slate-800/10 border-slate-800" : "bg-slate-50/30 border-slate-100")}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                            <Calendar size={16} />
                                        </div>
                                        <div>
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-white" : "text-slate-800")}>Ajustar fechas cronológicamente</p>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Desplaza el inicio de todas las actividades al día de hoy</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAjustarFechas(!ajustarFechas)}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-all relative shrink-0",
                                            ajustarFechas ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                                        )}
                                    >
                                        <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all", ajustarFechas ? "left-[26px]" : "left-0.5")} />
                                    </button>
                                </div>

                                {/* Advertencia */}
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[9px] font-black uppercase text-amber-600 leading-normal">
                                        ADVERTENCIA: Esta acción poblará el curso actual con todas las unidades e ítems del archivo. No eliminará el contenido preexistente, pero duplicará elementos si los importa dos veces.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className={cn(
                            "h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
                            isDark ? "text-slate-400" : "text-slate-500"
                        )}
                    >
                        Cerrar
                    </button>
                    {fileData && (
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="h-12 px-8 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <CheckCircle2 size={14} />
                            )}
                            Importar Contenido
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
