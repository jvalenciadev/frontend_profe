'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import {
    HardDrive,
    Download,
    FileText,
    FileSpreadsheet,
    FileArchive,
    FileImage,
    FileCode,
    File,
    Folder,
    FolderOpen,
    ChevronRight,
    ArrowLeft,
    RefreshCw,
    Search,
    ShieldCheck,
    Clock,
    Lock,
    Loader2,
    Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SftpItem {
    nombre: string;
    rutaRelativa: string;
    tipo: 'CARPETA' | 'ARCHIVO';
    pesoBytes?: number;
    pesoFormateado?: string;
    fechaModificacion: string;
    extension?: string;
    totalElementos?: number;
}

interface SftpResponse {
    rutaActual: string;
    carpetas: SftpItem[];
    archivos: SftpItem[];
    totalCarpetas: number;
    totalArchivos: number;
}

export default function SftpDocumentosPage() {
    const [currentPath, setCurrentPath] = useState<string>('');
    const [carpetas, setCarpetas] = useState<SftpItem[]>([]);
    const [archivos, setArchivos] = useState<SftpItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [downloadingFolder, setDownloadingFolder] = useState<string | null>(null);

    // Cargar directorio actual
    const cargarDirectorio = async (subpath: string = currentPath) => {
        setLoading(true);
        try {
            const { data } = await api.get<SftpResponse>('/sftp/documentos', {
                params: { subpath: subpath || '' },
            });
            setCurrentPath(data.rutaActual || '');
            setCarpetas(data.carpetas || []);
            setArchivos(data.archivos || []);
        } catch (error: any) {
            console.error('Error explorando repositorio SFTP:', error);
            toast.error(error.response?.data?.message || 'Error al conectar con el repositorio SFTP');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDirectorio(currentPath);
    }, [currentPath]);

    // Navegar a una carpeta
    const handleEntrarCarpeta = (rutaRelativa: string) => {
        setSearchTerm('');
        setCurrentPath(rutaRelativa);
    };

    // Subir un nivel en la jerarquía (Carpeta padre)
    const handleVolverAtras = () => {
        if (!currentPath) return;
        const partes = currentPath.split('/').filter(Boolean);
        partes.pop();
        const nuevaRuta = partes.join('/');
        setCurrentPath(nuevaRuta);
    };

    // Descargar archivo mediante Blob seguro
    const handleDownload = async (item: SftpItem) => {
        try {
            setDownloadingFile(item.nombre);
            toast.loading(`Descargando ${item.nombre}...`, { id: `dl-${item.nombre}` });

            const response = await api.get('/sftp/documentos/download', {
                params: { filepath: item.rutaRelativa },
                responseType: 'blob',
            });

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.nombre;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`"${item.nombre}" descargado (Acción auditada)`, { id: `dl-${item.nombre}` });
        } catch (error: any) {
            console.error('Error descargando archivo:', error);
            toast.error('Error al descargar el documento', { id: `dl-${item.nombre}` });
        } finally {
            setDownloadingFile(null);
        }
    };

    // Descargar carpeta completa como ZIP
    const handleDownloadFolder = async (carpeta: SftpItem, e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar navegar a la carpeta al hacer clic en el botón
        const toastId = `dlf-${carpeta.nombre}`;
        try {
            setDownloadingFolder(carpeta.nombre);
            toast.loading(`Comprimiendo "${carpeta.nombre}"... puede tardar unos segundos`, { id: toastId });

            const response = await api.get('/sftp/documentos/download-folder', {
                params: { folderpath: carpeta.rutaRelativa },
                responseType: 'blob',
                timeout: 300000, // 5 minutos para carpetas grandes
            });

            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${carpeta.nombre}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`"${carpeta.nombre}.zip" descargado (Acción auditada)`, { id: toastId });
        } catch (error: any) {
            console.error('Error descargando carpeta:', error);
            toast.error(`Error al comprimir "${carpeta.nombre}"`, { id: toastId });
        } finally {
            setDownloadingFolder(null);
        }
    };

    // Breadcrumbs dinámicos estilo Google Drive
    const breadcrumbs = useMemo(() => {
        const partes = currentPath ? currentPath.split('/').filter(Boolean) : [];
        const result: { label: string; ruta: string }[] = [{ label: 'Inicio', ruta: '' }];
        let acum = '';
        partes.forEach((p) => {
            acum = acum ? `${acum}/${p}` : p;
            result.push({ label: p, ruta: acum });
        });
        return result;
    }, [currentPath]);

    // Filtrar carpetas y archivos por búsqueda local
    const carpetasFiltradas = useMemo(() => {
        if (!searchTerm.trim()) return carpetas;
        const q = searchTerm.toLowerCase();
        return carpetas.filter((c) => c.nombre.toLowerCase().includes(q));
    }, [carpetas, searchTerm]);

    const archivosFiltrados = useMemo(() => {
        if (!searchTerm.trim()) return archivos;
        const q = searchTerm.toLowerCase();
        return archivos.filter(
            (a) => a.nombre.toLowerCase().includes(q) || (a.extension && a.extension.toLowerCase().includes(q)),
        );
    }, [archivos, searchTerm]);

    // Icono según tipo de archivo
    const getFileIcon = (ext?: string) => {
        const e = (ext || '').toLowerCase();
        if (['pdf'].includes(e)) return <FileText className="w-5 h-5 text-rose-500" />;
        if (['xls', 'xlsx', 'csv'].includes(e)) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
        if (['doc', 'docx', 'odt'].includes(e)) return <FileText className="w-5 h-5 text-blue-500" />;
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return <FileArchive className="w-5 h-5 text-amber-500" />;
        if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(e)) return <FileImage className="w-5 h-5 text-purple-500" />;
        if (['json', 'xml', 'sql', 'js', 'ts'].includes(e)) return <FileCode className="w-5 h-5 text-cyan-500" />;
        return <File className="w-5 h-5 text-muted-foreground" />;
    };

    return (
        <div className="max-w-[1300px] mx-auto p-4 sm:p-8 space-y-6">
            {/* Header del Repositorio */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-card border border-border/60 shadow-sm relative overflow-hidden">
                <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> Acceso de Solo Lectura & Descarga
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-[10px] font-mono font-bold">
                            /var/sftp/documentos
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5 text-foreground">
                        <HardDrive className="w-7 h-7 text-primary" />
                        Explorador de Documentos SFTP
                    </h1>
                    <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                        Explorador jerárquico de carpetas y archivos. Toda navegación y descarga queda auditada con IP, dispositivo y fecha en <code className="font-mono text-primary font-bold">audit_logs</code>.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 relative z-10">
                    <button
                        onClick={() => cargarDirectorio(currentPath)}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-bold text-xs hover:bg-secondary transition-all flex items-center gap-2 shadow-sm"
                        title="Refrescar vista"
                    >
                        <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                        Refrescar
                    </button>
                </div>
            </div>

            {/* Barra de Navegación (Breadcrumbs) y Búsqueda */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 p-4 rounded-2xl border border-border/60 backdrop-blur-sm">
                {/* Migas de pan estilo Google Drive */}
                <div className="flex items-center gap-1 text-xs overflow-x-auto py-1">
                    {currentPath && (
                        <button
                            onClick={handleVolverAtras}
                            className="p-1.5 rounded-lg border border-border hover:bg-secondary text-foreground mr-1 flex items-center gap-1 text-[11px] font-bold"
                            title="Subir un nivel"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Atrás
                        </button>
                    )}

                    {breadcrumbs.map((b, idx) => (
                        <React.Fragment key={b.ruta}>
                            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                            <button
                                onClick={() => handleEntrarCarpeta(b.ruta)}
                                className={cn(
                                    'px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap',
                                    idx === breadcrumbs.length - 1
                                        ? 'bg-primary/10 text-primary font-black'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                                )}
                            >
                                {idx === 0 && <HardDrive className="w-3.5 h-3.5 text-primary" />}
                                {b.label}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {/* Buscador de archivos en la carpeta actual */}
                <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Filtrar en esta carpeta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {/* Contenido Principal (Carpetas y Archivos) */}
            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-card rounded-2xl border border-border/50">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-xs font-bold uppercase tracking-wider">Cargando contenido...</p>
                </div>
            ) : carpetasFiltradas.length === 0 && archivosFiltrados.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-center gap-3 bg-card rounded-2xl border border-dashed border-border/80">
                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <FolderOpen className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">
                        {searchTerm ? 'No hay elementos que coincidan con la búsqueda' : 'Esta carpeta está vacía'}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md">
                        {currentPath
                            ? 'No se encontraron archivos en este subdirectorio.'
                            : 'El repositorio /var/sftp/documentos no contiene archivos visibles.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* SECCIÓN CARPETAS */}
                    {carpetasFiltradas.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Folder className="w-4 h-4 text-primary" />
                                Carpetas ({carpetasFiltradas.length})
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {carpetasFiltradas.map((carpeta) => (
                                    <div
                                        key={carpeta.rutaRelativa}
                                        onClick={() => handleEntrarCarpeta(carpeta.rutaRelativa)}
                                        className="p-3.5 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-secondary/40 transition-all cursor-pointer flex items-center justify-between group shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                                                <Folder className="w-5 h-5 fill-amber-500/20" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                                                    {carpeta.nombre}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {carpeta.totalElementos ?? 0} elemento{(carpeta.totalElementos ?? 0) !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {/* Botón descargar carpeta como ZIP */}
                                            <button
                                                onClick={(e) => handleDownloadFolder(carpeta, e)}
                                                disabled={downloadingFolder === carpeta.nombre}
                                                title={`Descargar "${carpeta.nombre}" como ZIP`}
                                                className="p-1.5 rounded-lg bg-secondary/80 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                            >
                                                {downloadingFolder === carpeta.nombre ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                                ) : (
                                                    <Download className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN ARCHIVOS */}
                    {archivosFiltrados.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Archivos Disponibles ({archivosFiltrados.length})
                            </h2>

                            <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                                <div className="divide-y divide-border/40">
                                    {archivosFiltrados.map((archivo, idx) => (
                                        <motion.div
                                            key={archivo.rutaRelativa}
                                            initial={{ opacity: 0, y: 3 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.015 }}
                                            className="p-3.5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="p-2 rounded-xl bg-secondary/80 flex-shrink-0">
                                                    {getFileIcon(archivo.extension)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[280px] sm:max-w-xl">
                                                        {archivo.nombre}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                                        <span className="font-mono font-bold text-foreground">
                                                            {archivo.pesoFormateado}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(archivo.fechaModificacion).toLocaleString('es-BO', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                        <span className="px-1.5 py-0.2 rounded bg-secondary font-mono text-[9px] uppercase font-bold text-foreground">
                                                            {archivo.extension}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-center">
                                                <button
                                                    onClick={() => handleDownload(archivo)}
                                                    disabled={downloadingFile === archivo.nombre}
                                                    className="px-4 py-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-50"
                                                    title="Descargar este documento (Se registrará en bitácora con hash SHA-256)"
                                                >
                                                    {downloadingFile === archivo.nombre ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Download className="w-3.5 h-3.5" />
                                                    )}
                                                    Descargar
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
}
