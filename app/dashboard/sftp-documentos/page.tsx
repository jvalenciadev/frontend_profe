'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '@/lib/api';
import {
    HardDrive,
    Download,
    Upload,
    Trash2,
    FileText,
    FileSpreadsheet,
    FileArchive,
    FileImage,
    FileCode,
    File,
    RefreshCw,
    Search,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Clock,
    FolderOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal';

interface SftpDoc {
    nombre: string;
    pesoBytes: number;
    pesoFormateado: string;
    fechaModificacion: string;
    extension: string;
}

export default function SftpDocumentosPage() {
    const [documentos, setDocumentos] = useState<SftpDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const cargarDocumentos = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<SftpDoc[]>('/sftp/documentos');
            setDocumentos(data || []);
        } catch (error: any) {
            console.error('Error cargando documentos SFTP:', error);
            toast.error(error.response?.data?.message || 'Error al conectar con el repositorio SFTP');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDocumentos();
    }, []);

    // Descargar archivo mediante Blob seguro
    const handleDownload = async (filename: string) => {
        try {
            toast.loading(`Descargando ${filename}...`, { id: `dl-${filename}` });
            const response = await api.get(`/sftp/documentos/${encodeURIComponent(filename)}/download`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`Documento ${filename} descargado (Acción auditada)`, { id: `dl-${filename}` });
        } catch (error: any) {
            console.error('Error descargando archivo:', error);
            toast.error('Error al descargar el archivo', { id: `dl-${filename}` });
        }
    };

    // Subir archivo
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        const toastId = toast.loading(`Adjuntando ${file.name} al repositorio SFTP...`);

        try {
            await api.post('/sftp/documentos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success(`Archivo "${file.name}" adjuntado y registrado en auditoría`, { id: toastId });
            cargarDocumentos();
        } catch (error: any) {
            console.error('Error subiendo archivo:', error);
            toast.error(error.response?.data?.message || 'Error al adjuntar el archivo', { id: toastId });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Confirmar eliminación
    const handleConfirmDelete = async () => {
        if (!fileToDelete) return;
        setIsDeleting(true);

        try {
            await api.delete(`/sftp/documentos/${encodeURIComponent(fileToDelete)}`);
            toast.success(`Archivo "${fileToDelete}" eliminado correctamente`);
            setFileToDelete(null);
            cargarDocumentos();
        } catch (error: any) {
            console.error('Error eliminando archivo:', error);
            toast.error(error.response?.data?.message || 'No se pudo eliminar el archivo');
        } finally {
            setIsDeleting(false);
        }
    };

    // Obtener icono según extensión
    const getFileIcon = (ext: string) => {
        const e = ext.toLowerCase();
        if (['pdf'].includes(e)) return <FileText className="w-5 h-5 text-rose-500" />;
        if (['xls', 'xlsx', 'csv'].includes(e)) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
        if (['doc', 'docx', 'odt'].includes(e)) return <FileText className="w-5 h-5 text-blue-500" />;
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return <FileArchive className="w-5 h-5 text-amber-500" />;
        if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(e)) return <FileImage className="w-5 h-5 text-purple-500" />;
        if (['json', 'xml', 'sql', 'js', 'ts'].includes(e)) return <FileCode className="w-5 h-5 text-cyan-500" />;
        return <File className="w-5 h-5 text-muted-foreground" />;
    };

    // Filtrar documentos por búsqueda
    const filteredDocs = useMemo(() => {
        if (!searchTerm.trim()) return documentos;
        const q = searchTerm.toLowerCase();
        return documentos.filter(d => d.nombre.toLowerCase().includes(q) || d.extension.toLowerCase().includes(q));
    }, [documentos, searchTerm]);

    const totalBytes = useMemo(() => {
        return documentos.reduce((acc, d) => acc + d.pesoBytes, 0);
    }, [documentos]);

    const formatearTotal = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="max-w-[1300px] mx-auto p-4 sm:p-8 space-y-6">
            {/* Header del Repositorio */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-card border border-border/60 shadow-sm relative overflow-hidden">
                <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> Acceso Restringido & Auditado
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-[10px] font-mono font-bold">
                            /var/sftp/documentos
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5 text-foreground">
                        <HardDrive className="w-7 h-7 text-primary" />
                        Repositorio de Documentos SFTP
                    </h1>
                    <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                        Toda operación de consulta, descarga o adjunto queda registrada con fecha, hora, dirección IP y cuenta de usuario en la bitácora de seguridad (<code className="font-mono text-primary font-bold">audit_logs</code>).
                    </p>
                </div>

                <div className="flex items-center gap-2.5 relative z-10 flex-wrap">
                    <button
                        onClick={cargarDocumentos}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-bold text-xs hover:bg-secondary transition-all flex items-center gap-2 shadow-sm"
                        title="Refrescar lista"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        Refrescar
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-5 py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        Adjuntar Documento
                    </button>
                </div>
            </div>

            {/* Barra de Filtros y Estadísticas */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar documentos por nombre o extensión..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground px-2">
                    <span>Total: <strong className="text-foreground">{documentos.length}</strong> archivos</span>
                    <span>•</span>
                    <span>Tamaño: <strong className="text-foreground">{formatearTotal(totalBytes)}</strong></span>
                </div>
            </div>

            {/* Listado de Documentos */}
            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-card rounded-2xl border border-border/50">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-xs font-bold uppercase tracking-wider">Accediendo a /var/sftp/documentos...</p>
                </div>
            ) : filteredDocs.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-center gap-3 bg-card rounded-2xl border border-dashed border-border/80">
                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <FolderOpen className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">
                        {searchTerm ? 'No se encontraron documentos con ese criterio' : 'El repositorio SFTP está vacío'}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md">
                        {searchTerm
                            ? 'Intenta con otro término de búsqueda o limpia el filtro.'
                            : 'No se encontraron archivos en la carpeta asignada. Puedes adjuntar nuevos archivos usando el botón superior.'}
                    </p>
                </div>
            ) : (
                <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                    <div className="divide-y divide-border/40">
                        {filteredDocs.map((doc, idx) => (
                            <motion.div
                                key={doc.nombre}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/30 transition-colors"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="p-2.5 rounded-xl bg-secondary/80 flex-shrink-0">
                                        {getFileIcon(doc.extension)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[280px] sm:max-w-md">
                                            {doc.nombre}
                                        </p>
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                            <span className="font-mono font-bold">{doc.pesoFormateado}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(doc.fechaModificacion).toLocaleString('es-BO', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            <span className="px-1.5 py-0.2 rounded bg-secondary font-mono text-[9px] uppercase font-bold text-foreground">
                                                {doc.extension}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <button
                                        onClick={() => handleDownload(doc.nombre)}
                                        className="px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
                                        title="Descargar documento (Se registrará en bitácora)"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Descargar
                                    </button>

                                    <button
                                        onClick={() => setFileToDelete(doc.nombre)}
                                        className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                        title="Eliminar del repositorio"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal Confirmar Eliminación */}
            <Modal
                isOpen={Boolean(fileToDelete)}
                onClose={() => setFileToDelete(null)}
                title="Confirmar Eliminación de Archivo"
                size="md"
            >
                <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                            <p className="font-bold">Esta acción es irreversible</p>
                            <p className="text-muted-foreground">
                                El archivo <strong className="text-foreground font-mono">{fileToDelete}</strong> será eliminado permanentemente de <code className="font-mono">/var/sftp/documentos</code> y el evento se registrará en <code className="font-mono">audit_logs</code>.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setFileToDelete(null)}
                            disabled={isDeleting}
                            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 flex items-center gap-1.5"
                        >
                            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Eliminar Documento
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

