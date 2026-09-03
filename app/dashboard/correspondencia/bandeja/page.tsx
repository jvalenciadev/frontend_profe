'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Inbox, Search, FileText, Clock,
    ArrowUpRight, CheckCircle2, Calendar,
    User, RefreshCw, ChevronRight, Loader2, AlertCircle,
    Send, Archive, Hash, X, ShieldCheck, Download, ArrowRight,
    FileUp, Building2, Layers, History, GitBranch, Filter, BarChart3,
    ChevronDown, Activity, Landmark, MapPin, Copy, ShieldAlert,
    Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    obtenerBandeja,
    avanzarEstado,
    buscarUsuarios,
    obtenerHistorialTenants,
    exportarHojasRuta,
    ESTADO_LABELS,
    type CorDocumento,
    type CorUsuario,
    type CorHistorialTenantResponse,
    type CorHistorialItem
} from '@/services/correspondencia.service';
import { ComplianceMatrixWidget } from '@/components/correspondencia/ComplianceMatrixWidget';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { uploadService } from '@/services/uploadService';
import { getImageUrl } from '@/lib/utils';
import { useAbility } from '@/hooks/useAbility';
import { useRouter } from 'next/navigation';

const TABS = [
    { id: 'recibidos', label: 'Recibidos', icon: Inbox },
    { id: 'enviados', label: 'Enviados', icon: Send },
    { id: 'enProceso', label: 'Borradores', icon: Clock },
    { id: 'archivados', label: 'Archivados', icon: Archive },
    { id: 'historial', label: 'Historial de Auditoría', icon: History },
] as const;

type TabType = typeof TABS[number]['id'];

const DEPARTAMENTOS_LIST = [
    { id: 'TODOS', label: 'Todos los Departamentos', sigla: 'TODOS' },
    { id: 'MESC', label: 'Dirección Nacional (MESC)', sigla: 'MESC' },
    { id: 'LP', label: 'La Paz (LP)', sigla: 'LP' },
    { id: 'CB', label: 'Cochabamba (CB)', sigla: 'CB' },
    { id: 'CH', label: 'Chuquisaca (CH)', sigla: 'CH' },
    { id: 'OR', label: 'Oruro (OR)', sigla: 'OR' },
    { id: 'PT', label: 'Potosí (PT)', sigla: 'PT' },
    { id: 'TJ', label: 'Tarija (TJ)', sigla: 'TJ' },
    { id: 'SC', label: 'Santa Cruz (SC)', sigla: 'SC' },
    { id: 'BN', label: 'Beni (BN)', sigla: 'BN' },
    { id: 'PD', label: 'Pando (PD)', sigla: 'PD' },
];

export default function BandejaPage() {
    const { user } = useAuth();
    const { can } = useAbility();
    const router = useRouter();

    // — Pestaña Activa —
    const [tab, setTab] = useState<TabType>('recibidos');

    // — Bandeja State —
    const [bandeja, setBandeja] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<CorDocumento | null>(null);
    const [avanzando, setAvanzando] = useState(false);

    // — Agrupación y Filtro por Departamento —
    const [vistaAgrupada, setVistaAgrupada] = useState(false);
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('TODOS');

    // — Historial de Auditoría State —
    const [historialData, setHistorialData] = useState<CorHistorialTenantResponse | null>(null);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [historialSearch, setHistorialSearch] = useState('');
    const [historialAccionFilter, setHistorialAccionFilter] = useState('TODAS');

    // Estados para Derivación Dinámica
    const [accionSeleccionada, setAccionSeleccionada] = useState<string | null>(null);
    const [nuevoDest, setNuevoDest] = useState<any>(null);
    const [archivoUrl, setArchivoUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [detalle, setDetalle] = useState('');

    // Modal de Confirmación de Devolución
    const [confirmDevolucion, setConfirmDevolucion] = useState<{ doc: CorDocumento; creador: any } | null>(null);
    // Modal de Confirmación de Archivado
    const [confirmArchivado, setConfirmArchivado] = useState<CorDocumento | null>(null);
    // Modal de Confirmación de Cancelar Envío/Derivación
    const [confirmCancelar, setConfirmCancelar] = useState<{ doc: CorDocumento; label: string } | null>(null);

    // Guard CASL
    useEffect(() => {
        if (!can('read', 'CorDocumento')) {
            router.replace('/dashboard');
        }
    }, [can, router]);

    const fetchBandeja = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerBandeja();
            setBandeja(data);
        } catch (err: any) {
            setError(err?.message ?? 'Error al cargar la bandeja');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistorial = useCallback(async () => {
        setLoadingHistorial(true);
        try {
            const deptParam = selectedDeptFilter !== 'TODOS' ? selectedDeptFilter : undefined;
            const data = await obtenerHistorialTenants(deptParam);
            setHistorialData(data);
        } catch (err: any) {
            toast.error('Error al cargar el historial de auditoría');
        } finally {
            setLoadingHistorial(false);
        }
    }, [selectedDeptFilter]);

    // Cerrar panel SOLO cuando cambia el tab
    useEffect(() => {
        setSelected(null);
    }, [tab]);

    // Fetch principal al cambiar tab (sin fetchHistorial en deps — evita re-disparos por selectedDeptFilter)
    useEffect(() => {
        if (tab === 'historial') {
            fetchHistorial();
        } else {
            fetchBandeja();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    // Re-fetch historial cuando cambia el filtro de departamento
    useEffect(() => {
        if (tab === 'historial') {
            fetchHistorial();
        }
    }, [selectedDeptFilter, tab, fetchHistorial]);

    // Re-fetch bandeja cuando fetchBandeja se actualiza (mount inicial)
    useEffect(() => {
        if (tab !== 'historial') {
            fetchBandeja();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchBandeja]);

    // Limpiar estado del panel de acción al cambiar documento seleccionado
    useEffect(() => {
        setAccionSeleccionada(null);
        setNuevoDest(null);
        setArchivoUrl(null);
        setDetalle('');
    }, [selected?.id]);

    const docs = tab !== 'historial' ? (bandeja?.[tab] || []) : [];

    // Documentos filtrados por búsqueda y por Departamento
    const filtered = useMemo(() => {
        return docs.filter((doc: any) => {
            const docSigla = doc.tenantInfo?.abreviacion || doc.cite?.match(/PROFE\/([A-Z]+)\b/i)?.[1]?.toUpperCase() || 'NAC';
            const matchDept = selectedDeptFilter === 'TODOS' || docSigla === selectedDeptFilter || doc.tenantId === selectedDeptFilter;
            const matchSearch = !search || [doc.cite, doc.hr, doc.referencia]
                .some(s => s?.toLowerCase().includes(search.toLowerCase()));

            // En Recibidos: ocultar solo si el usuario actual en sesión ya emitió una respuesta a este documento
            const yaRespondidoPorEsteUsuario = tab === 'recibidos' && Boolean(
                doc.documentosHijos?.some((hijo: any) =>
                    hijo.participantes?.some((p: any) => p.rol === 'REMITENTE' && p.userId === user?.id)
                )
            );

            return matchDept && matchSearch && !yaRespondidoPorEsteUsuario;
        });
    }, [docs, search, selectedDeptFilter, tab, user?.id]);

    // Agrupamiento por Departamento para la vista de tarjetas agrupadas
    const groupedByDept = useMemo(() => {
        const map = new Map<string, { tenantId: string; nombre: string; abreviacion: string; docs: CorDocumento[] }>();

        filtered.forEach((doc: any) => {
            const sigla = doc.tenantInfo?.abreviacion || doc.cite?.match(/PROFE\/([A-Z]+)\b/i)?.[1]?.toUpperCase() || 'NAC';
            const nombre = doc.tenantInfo?.nombre || `Departamento ${sigla}`;
            const key = sigla;

            if (!map.has(key)) {
                map.set(key, {
                    tenantId: doc.tenantId || key,
                    nombre,
                    abreviacion: sigla,
                    docs: [],
                });
            }
            map.get(key)!.docs.push(doc);
        });

        return Array.from(map.values());
    }, [filtered]);

    // Historial filtrado
    const historialFiltrado = useMemo(() => {
        if (!historialData?.historial) return [];
        return historialData.historial.filter((item: CorHistorialItem) => {
            const matchAccion = historialAccionFilter === 'TODAS' || item.accion === historialAccionFilter;
            const matchSearch = !historialSearch || [
                item.id,
                item.documento?.cite,
                item.documento?.hr,
                item.documento?.referencia,
                item.usuario?.nombre,
                item.usuario?.apellidos,
                item.detalle
            ].some(s => s?.toLowerCase().includes(historialSearch.toLowerCase()));
            return matchAccion && matchSearch;
        });
    }, [historialData, historialSearch, historialAccionFilter]);

    // Exportar TODAS las Hojas de Ruta del tenant del usuario (filtra en backend por tenantId JWT)
    const handleExportExcel = useCallback(async () => {
        try {
            toast.loading('Generando Excel...');
            const docs = await exportarHojasRuta();
            toast.dismiss();

            if (!docs || docs.length === 0) {
                toast.warning('No hay Hojas de Ruta para exportar en su sede.');
                return;
            }

            const dataToExport = docs.map((doc: any) => {
                const remitente = doc.participantes?.find((p: any) => p.rol === 'REMITENTE')?.usuario;
                const remNombre = remitente
                    ? `${remitente.nombre} ${remitente.apellidos || ''}`.trim()
                    : 'N/A';

                const ultimoMov = doc.seguimientos?.[0];
                const destNombre = ultimoMov?.destinatario
                    ? `${ultimoMov.destinatario.nombre} ${ultimoMov.destinatario.apellidos || ''}`.trim()
                    : doc.participantes
                        ?.filter((p: any) => p.rol === 'DESTINATARIO' || p.rol === 'VIA')
                        ?.map((p: any) => p.usuario ? `${p.usuario.nombre} ${p.usuario.apellidos || ''}` : '')
                        .filter(Boolean)
                        .join(', ') || 'N/A';

                return {
                    'FECHA REGISTRO': new Date(doc.createdAt).toLocaleString('es-BO'),
                    'ÚLTIMO MOVIMIENTO': ultimoMov
                        ? new Date(ultimoMov.fecha).toLocaleString('es-BO')
                        : new Date(doc.createdAt).toLocaleString('es-BO'),
                    'V.E.R / TIPO': doc.tipo || 'HOJA DE RUTA',
                    'H.R.': doc.hr || 'N/A',
                    'CITE': doc.cite || 'N/A',
                    'PROCEDENCIA / REMITENTE': remNombre,
                    'REFERENCIA / ASUNTO': doc.referencia || 'Sin Asunto',
                    'DERIVADO A / DESTINATARIO': destNombre,
                    'ESTADO ACTUAL': ESTADO_LABELS[doc.estado as keyof typeof ESTADO_LABELS]?.label || doc.estado,
                    'DEPARTAMENTO / SEDE': doc.tenantInfo?.nombre || doc.tenantInfo?.abreviacion || doc.tenantId || 'NAC',
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const colWidths = Object.keys(dataToExport[0]).map((key) => ({ wch: Math.max(key.length + 4, 18) }));
            worksheet['!cols'] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Hojas_de_Ruta');

            const fileName = `Hojas_de_Ruta_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            toast.success(`Excel descargado: ${docs.length} Hojas de Ruta.`);
        } catch (e: any) {
            toast.dismiss();
            toast.error('Error al generar el Excel: ' + (e?.message || 'Error desconocido'));
        }
    }, []);

    const handleAvanzar = async (doc: CorDocumento, accion: string) => {
        if (accion === 'DERIVACION' && !nuevoDest) {
            toast.error('Debe seleccionar a quién derivar el trámite');
            return;
        }
        setAvanzando(true);
        try {
            await avanzarEstado(
                doc.id,
                (accion === 'RECEPCION' && nuevoDest) ? 'DERIVACION' : accion,
                detalle || `Acción "${accion}" registrada desde la bandeja.`,
                archivoUrl || undefined,
                nuevoDest?.id || undefined
            );
            const mensajes: Record<string, string> = {
                ENVIO: 'Documento enviado oficialmente',
                RECEPCION: 'Recepción confirmada',
                DERIVACION: 'Documento derivado correctamente',
                DEVOLUCION: 'Documento devuelto al remitente',
                CANCELAR: 'Operación realizada correctamente',
                ARCHIVADO: 'Documento archivado',
            };
            toast.success(mensajes[accion] ?? `Acción "${accion}" registrada`);
            setNuevoDest(null);
            setArchivoUrl(null);
            setDetalle('');
            setAccionSeleccionada(null);
            await fetchBandeja();
            setSelected(null);
        } catch (err: any) {
            if (!err.status) {
                toast.error('Error de conexión. Verifique su red e intente de nuevo.');
            }
        } finally {
            setAvanzando(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('El archivo excede el límite de 5MB');
            return;
        }

        setUploading(true);
        try {
            const res = await uploadService.uploadFile(file, 'correspondencia');
            setArchivoUrl(res.data.path);
            toast.success('Archivo adjunto listo');
        } catch (err) {
            toast.error('Fallo al subir archivo');
        } finally {
            setUploading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado al portapapeles`);
    };



    const renderActions = (doc: CorDocumento) => {
        const isDevuelto = doc.estado === 'DEVUELTO';
        const miParticipante = doc.participantes?.find((p: any) => p.userId === user?.id);
        const miRol = miParticipante?.rol || (tab === 'enviados' ? 'REMITENTE' : 'DESTINATARIO');

        // Si el último movimiento de TRANSFERENCIA (DERIVACION/ENVIO/DEVOLUCION con destinatario)
        // apunta al usuario actual, se le trata como destinatario activo aunque su rol formal sea REMITENTE.
        // Se ignora RECEPCION ya que no transfiere la responsabilidad, solo confirma la recepción.
        const ultimoTransferSeg = (doc.seguimientos || []).find(
            (s: any) => s.destinatario && (s.accion === 'DERIVACION' || s.accion === 'ENVIO' || s.accion === 'DEVOLUCION')
        );
        const soyDestinatarioActual = ultimoTransferSeg?.destinatario?.id === user?.id;
        const isRemitente = miRol === 'REMITENTE' && !soyDestinatarioActual;
        const esCreadorOriginalDoc = (doc.participantes || []).some(
            (p: any) => p.rol === 'REMITENTE' && p.userId === user?.id
        );

        // Lógica Senior de Cancelación:
        const diasTranscurridos = (Date.now() - new Date(doc.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const plazoMax = doc.plazoDias || 7;
        const excedioPlazo = diasTranscurridos > plazoMax;

        const yaRespondidoGlobal = Boolean((doc as any).documentosHijos?.length) ||
            (doc.seguimientos || []).some((s: any) => s.accion === 'RESPUESTA');

        // El usuario actual ya emitió su respuesta a esta Hoja de Ruta
        const yaRespondidoEsteUsuario = (doc.documentosHijos || []).some(
            (hijo: any) => hijo.participantes?.some((p: any) => p.rol === 'REMITENTE' && p.userId === user?.id)
        ) || (doc.seguimientos || []).some((s: any) => s.accion === 'RESPUESTA' && s.usuario?.id === user?.id);

        const yaRecibidoODerivado = (doc.seguimientos || []).some((s: any) =>
            s.accion === 'RECEPCION' || (s.accion === 'DERIVACION' && s.usuario?.id !== user?.id) || s.accion === 'DEVOLUCION' || s.accion === 'ARCHIVADO'
        );

        // El usuario actual ya confirmó recepción â†’ ocultar botón Recibir Trámite
        const yaRecibioEsteUsuario = (doc.seguimientos || []).some((s: any) =>
            s.accion === 'RECEPCION' && s.usuario?.id === user?.id
        );

        const ultimoMov = doc.seguimientos?.[0];
        const fuiUltimoEmisor = ultimoMov?.usuario?.id === user?.id && (ultimoMov?.accion === 'ENVIO' || ultimoMov?.accion === 'DERIVACION');

        // Se puede cancelar ÚNICAMENTE si no se ha respondido, el destinatario no ha recepcionado/derivado, no ha excedido 7 días y se es el remitente o emisor de la derivación.
        const puedeCancelar = !excedioPlazo && !yaRespondidoGlobal && !yaRecibidoODerivado && (isRemitente || fuiUltimoEmisor) && doc.estado !== 'ARCHIVADO' && doc.estado !== 'CANCELADO';

        if (accionSeleccionada) {
            const isReenvioDevolucion = isDevuelto && (accionSeleccionada === 'ENVIO' || accionSeleccionada === 'DERIVACION');

            return (
                <div className="space-y-6 mt-4 p-6 rounded-[2rem] bg-accent/30 border border-accent/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            {isReenvioDevolucion ? 'Subsanar Observación y Reenviar' : `Confirmar ${accionSeleccionada}`}
                        </span>
                        <button onClick={() => { setAccionSeleccionada(null); setNuevoDest(null); setArchivoUrl(null); }} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {(accionSeleccionada === 'DERIVACION' || isReenvioDevolucion) && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                {isReenvioDevolucion ? 'Reenviar a (Seleccionar VÍA o Destinatario)' : '¿A quién derivar?'}
                            </p>
                            <UserSearchInline onSelect={setNuevoDest} selected={nuevoDest} />
                        </div>
                    )}

                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            {isReenvioDevolucion ? 'Adjuntar Nuevo Documento Corregido (PDF de Subsanación)' : 'Archivo Adjunto (Opcional - Máx 5MB)'}
                        </p>
                        <div className="relative group">
                            <input type="file" accept="application/pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className={cn(
                                "h-14 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all",
                                archivoUrl ? "bg-emerald-500/10 border-emerald-500 text-emerald-600" : "bg-card border-border group-hover:border-primary/50 group-hover:bg-primary/5"
                            )}>
                                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : archivoUrl ? <CheckCircle2 className="w-5 h-5" /> : <FileUp className="w-5 h-5 opacity-40" />}
                                <span className="text-[10px] font-black uppercase">{uploading ? 'Subiendo...' : archivoUrl ? 'Documento Corregido Listo' : isReenvioDevolucion ? 'Subir PDF Corregido' : 'Subir Respuesta PDF'}</span>
                            </div>
                        </div>
                        {archivoUrl && (
                            <div className="rounded-xl overflow-hidden border border-border h-48 bg-muted/50 animate-in fade-in slide-in-from-top-2">
                                <embed src={`${getImageUrl(archivoUrl)}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" className="w-full h-full" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            {isReenvioDevolucion ? 'Detalle de Subsanación / Respuesta a la Observación' : 'Detalle o Comentario'}
                        </p>
                        <textarea value={detalle} onChange={e => setDetalle(e.target.value)}
                            placeholder={isReenvioDevolucion ? "Describa las correcciones realizadas para subsanar..." : "Escriba observaciones de custodia..."}
                            className="w-full h-24 p-3 text-xs rounded-xl bg-card border border-border outline-none focus:border-primary font-medium" />
                    </div>

                    <button onClick={() => handleAvanzar(doc, isDevuelto ? 'ENVIO' : accionSeleccionada)} disabled={avanzando}
                        className="w-full h-12 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                        {avanzando ? <Loader2 className="w-4 h-4 animate-spin" /> : isReenvioDevolucion ? 'Confirmar Subsanación y Reenviar' : 'Confirmar Operación'}
                    </button>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 gap-3 mt-4">
                {/* 1. DOCUMENTO DEVUELTO */}
                {isDevuelto ? (
                    <>
                        <button onClick={() => {
                            const devueltoPor = doc.seguimientos?.[0]?.usuario;
                            setNuevoDest(devueltoPor ?? null);
                            setAccionSeleccionada('ENVIO');
                        }}
                            className="h-12 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 col-span-2 shadow-lg shadow-primary/20">
                            <RefreshCw className="w-4 h-4" /> Subsanar Observación y Reenviar
                        </button>
                        <Link href={`/dashboard/correspondencia/nuevo?id=${doc.id}`}
                            className="h-12 rounded-xl border border-border font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all flex items-center justify-center gap-2 col-span-2">
                            Editar Contenido del Borrador
                        </Link>
                    </>
                ) : isRemitente || tab === 'enviados' ? (
                    /* 2. SI EL USUARIO ES EL REMITENTE (O PESTAÑA ENVIADOS) */
                    <>
                        {puedeCancelar && (
                            <button onClick={() => setConfirmCancelar({ doc, label: fuiUltimoEmisor && !isRemitente ? 'Cancelar Derivación' : 'Cancelar Envío' })} disabled={avanzando}
                                className="h-12 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 col-span-2">
                                <X className="w-4 h-4" /> {fuiUltimoEmisor && !isRemitente ? 'Cancelar Derivación' : 'Cancelar Envío'}
                            </button>
                        )}
                        {doc.estado === 'BORRADOR' && (
                            <>
                                <button onClick={() => handleAvanzar(doc, 'ENVIO')} disabled={avanzando}
                                    className="h-12 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 col-span-2 shadow-lg shadow-primary/20">
                                    {avanzando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Oficializar y Enviar
                                </button>
                                <Link href={`/dashboard/correspondencia/nuevo?id=${doc.id}`}
                                    className="h-12 rounded-xl border border-border font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all flex items-center justify-center gap-2 col-span-2">
                                    Editar Borrador
                                </Link>
                            </>
                        )}
                    </>
                ) : (
                    /* 3. SI EL USUARIO ES EL DESTINATARIO / VIA EN RECIBIDOS */
                    <>
                        {puedeCancelar && (
                            <button onClick={() => setConfirmCancelar({ doc, label: 'Cancelar Derivación' })} disabled={avanzando}
                                className="h-12 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 col-span-2">
                                <X className="w-4 h-4" /> Cancelar Derivación
                            </button>
                        )}
                        {/* 1. RECIBIR — acción primaria obligatoria antes de cualquier otra gestión */}
                        {!yaRecibioEsteUsuario && (
                            <button onClick={() => handleAvanzar(doc, 'RECEPCION')} disabled={avanzando}
                                className="h-12 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 col-span-2">
                                {avanzando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Recibir Trámite
                            </button>
                        )}

                        {/* Los siguientes botones SOLO se habilitan después de recepcionar */}
                        {yaRecibioEsteUsuario && (
                            <>
                                {/* 2. RESPONDER — solo si este usuario aún no ha respondido */}
                                {!yaRespondidoEsteUsuario && (
                                    <Link href={`/dashboard/correspondencia/nuevo?padreId=${doc.id}&hrPadre=${encodeURIComponent(doc.hr || '')}`}
                                        className="h-12 rounded-xl bg-teal-500/10 text-teal-600 hover:bg-teal-500 hover:text-white border border-teal-500/20 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 col-span-2 shadow-sm">
                                        <FileText className="w-4 h-4" /> Responder con Nuevo Informe / CITE
                                    </Link>
                                )}
                                {/* 3. DERIVAR */}
                                {doc.estado !== 'ARCHIVADO' && (
                                    <button onClick={() => setAccionSeleccionada('DERIVACION')}
                                        className="h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                        <ArrowUpRight className="w-4 h-4" /> Derivar Trámite
                                    </button>
                                )}
                                {/* 4. DEVOLVER — reservado únicamente para destinatarios que NO sean el creador original */}
                                {doc.estado !== 'ARCHIVADO' && !esCreadorOriginalDoc && (
                                    <button onClick={() => {
                                        const creador = doc.participantes?.find((p: any) => p.rol === 'REMITENTE');
                                        setConfirmDevolucion({ doc, creador: creador?.usuario ?? null });
                                    }}
                                        className="h-12 rounded-xl bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white border border-orange-500/20 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 col-span-2">
                                        <AlertCircle className="w-4 h-4" /> Devolver al Remitente
                                    </button>
                                )}
                                {/* 5. ARCHIVAR — el backend valida que solo el creador original pueda ejecutar esta acción */}
                                {doc.estado !== 'ARCHIVADO' && (
                                    <button onClick={() => { setConfirmArchivado(doc); setDetalle(''); }} disabled={avanzando}
                                        className="h-12 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 col-span-2">
                                        <Archive className="w-4 h-4" /> Archivar Definitivamente
                                    </button>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        );
    };

    const UserSearchInline = ({ onSelect, selected }: { onSelect: (u: any) => void; selected: any }) => {
        const [q, setQ] = useState('');
        const [results, setResults] = useState<any[]>([]);
        const [open, setOpen] = useState(false);

        const search = async (val: string) => {
            if (val.length < 2) { setResults([]); return; }
            try {
                const data = await buscarUsuarios(val);
                setResults(data);
                setOpen(true);
            } catch (err) { }
        };

        return (
            <div className="relative">
                {selected ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-black">{selected.nombre[0]}</div>
                            <div>
                                <p className="text-xs font-bold">{selected.nombre} {selected.apellidos}</p>
                                <p className="text-[8px] text-muted-foreground uppercase font-black">{selected.cargoStr}</p>
                            </div>
                        </div>
                        <button onClick={() => onSelect(null)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input type="text" value={q} onChange={e => { setQ(e.target.value); search(e.target.value); }} placeholder="Buscar usuario para derivación..."
                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border text-[11px] font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner" />
                        </div>
                        <AnimatePresence>
                            {open && results.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                    className="absolute z-50 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                    {results.map(u => (
                                        <button key={u.id} onClick={() => { onSelect(u); setOpen(false); setQ(''); }}
                                            className="w-full flex items-center gap-3 p-4 hover:bg-primary/5 transition-colors text-left border-b border-border/30 last:border-0">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">{u.nombre[0]}</div>
                                            <div className="flex-1">
                                                <p className="text-[11px] font-bold">{u.nombre} {u.apellidos}</p>
                                                <p className="text-[8px] text-muted-foreground uppercase font-black truncate">{u.cargoStr}</p>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
        );
    };

    if (!can('read', 'CorDocumento')) return null;

    return (
        <div className="space-y-8 pb-20">

            {/* ===== MODAL DE CONFIRMACIÓN DE CANCELAR ENVÍO ===== */}
            <AnimatePresence>
                {confirmCancelar && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
                            onClick={() => { setConfirmCancelar(null); setDetalle(''); }} />
                        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-full max-w-md bg-card border border-destructive/30 rounded-[2.5rem] shadow-[0_0_80px_rgba(239,68,68,0.15)] p-10 space-y-6">

                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center shrink-0">
                                    <X className="w-7 h-7 text-destructive" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black tracking-tight">¿{confirmCancelar.label}?</h3>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                        ¿Estás seguro? El documento volverá a <span className="font-black text-foreground">Borradores</span> y no podrá deshacerse fácilmente. Los destinatarios ya no tendrán acceso al envío activo.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-2">
                                <p className="text-[9px] font-black uppercase text-destructive tracking-widest">Documento a Cancelar</p>
                                <p className="text-sm font-black">{confirmCancelar.doc.cite}</p>
                                {confirmCancelar.doc.hr && (
                                    <p className="text-xs text-muted-foreground font-bold">HR: {confirmCancelar.doc.hr}</p>
                                )}
                                <p className="text-[11px] italic text-foreground/80 line-clamp-2">"{confirmCancelar.doc.referencia}"</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Motivo de Cancelación (Opcional)</p>
                                <textarea
                                    value={detalle}
                                    onChange={e => setDetalle(e.target.value)}
                                    placeholder="Especifique el motivo por el cual cancela este envío..."
                                    className="w-full h-24 p-3 text-xs rounded-xl bg-muted/50 border border-border outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20 font-medium resize-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { setConfirmCancelar(null); setDetalle(''); }}
                                    className="h-12 rounded-xl border border-border font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all">
                                    Volver
                                </button>
                                <button
                                    disabled={avanzando}
                                    onClick={async () => {
                                        await handleAvanzar(confirmCancelar.doc, 'CANCELAR');
                                        setConfirmCancelar(null);
                                    }}
                                    className="h-12 rounded-xl bg-destructive text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-destructive/20">
                                    {avanzando ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                    Sí, {confirmCancelar.label}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ===== MODAL DE CONFIRMACIÓN DE DEVOLUCIÓN ===== */}
            <AnimatePresence>
                {confirmDevolucion && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
                            onClick={() => setConfirmDevolucion(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-full max-w-md bg-card border border-orange-500/30 rounded-[2.5rem] shadow-[0_0_80px_rgba(249,115,22,0.2)] p-10 space-y-6">

                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-7 h-7 text-orange-500" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black tracking-tight">¿Confirmar Devolución?</h3>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                        El documento será enviado de vuelta al creador original del trámite.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-2">
                                <p className="text-[9px] font-black uppercase text-orange-500 tracking-widest">Documento</p>
                                <p className="text-sm font-black">{confirmDevolucion.doc.cite}</p>
                                {confirmDevolucion.doc.hr && (
                                    <p className="text-xs text-muted-foreground font-bold">HR: {confirmDevolucion.doc.hr}</p>
                                )}
                                <p className="text-[11px] italic text-foreground/80 line-clamp-2">"{confirmDevolucion.doc.referencia}"</p>
                            </div>

                            {confirmDevolucion.creador && (
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-accent/50 border border-border/50">
                                    <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-[11px] font-black shrink-0">
                                        {confirmDevolucion.creador.nombre?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Se devolverá al Creador Original</p>
                                        <p className="text-xs font-black">{confirmDevolucion.creador.nombre} {confirmDevolucion.creador.apellidos}</p>
                                        <p className="text-[9px] text-muted-foreground">{confirmDevolucion.creador.cargoStr}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Motivo de la Devolución (Obligatorio)</p>
                                <textarea
                                    value={detalle}
                                    onChange={e => setDetalle(e.target.value)}
                                    placeholder="Describa el motivo de la devolución u observación al remitente..."
                                    className="w-full h-24 p-3 text-xs rounded-xl bg-muted/50 border border-border outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium resize-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { setConfirmDevolucion(null); setDetalle(''); }}
                                    className="h-12 rounded-xl border border-border font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all">
                                    Cancelar
                                </button>
                                <button
                                    disabled={!detalle.trim() || avanzando}
                                    onClick={async () => {
                                        await handleAvanzar(confirmDevolucion.doc, 'DEVOLUCION');
                                        setConfirmDevolucion(null);
                                    }}
                                    className="h-12 rounded-xl bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
                                    {avanzando ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                                    Confirmar Devolución
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ===== MODAL DE CONFIRMACIÓN DE ARCHIVADO ===== */}
            <AnimatePresence>
                {confirmArchivado && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
                            onClick={() => { setConfirmArchivado(null); setDetalle(''); }} />
                        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-full max-w-md bg-card border border-destructive/30 rounded-[2.5rem] shadow-[0_0_80px_rgba(239,68,68,0.2)] p-10 space-y-6">

                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center shrink-0">
                                    <Archive className="w-7 h-7 text-destructive" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black tracking-tight">¿Archivar Definitivamente?</h3>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                        Esta acción cerrará la Hoja de Ruta <span className="font-black text-foreground">para todos los participantes</span>. Ya no se podrá modificar, derivar ni responder.
                                    </p>
                                </div>
                            </div>

                            {/* Alerta informativa prominente */}
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex gap-3 items-start">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Importante — Antes de Archivar</p>
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                        Si el proceso <span className="font-black">aún no ha concluido</span>, los destinatarios deben <span className="font-black">responder a la Hoja de Ruta</span> primero. Archivar antes de recibir todas las respuestas cerrará el trámite de forma permanente.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-2">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Documento a Archivar</p>
                                <p className="text-sm font-black">{confirmArchivado.cite}</p>
                                {confirmArchivado.hr && (
                                    <p className="text-xs text-muted-foreground font-bold">HR: {confirmArchivado.hr}</p>
                                )}
                                <p className="text-[11px] italic text-foreground/80 line-clamp-2">"{confirmArchivado.referencia}"</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Mensaje / Motivo de Archivado (Opcional)</p>
                                <textarea
                                    value={detalle}
                                    onChange={e => setDetalle(e.target.value)}
                                    placeholder="Escriba una observación o motivo por el cual archiva la Hoja de Ruta..."
                                    className="w-full h-24 p-3 text-xs rounded-xl bg-muted/50 border border-border outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20 font-medium resize-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { setConfirmArchivado(null); setDetalle(''); }}
                                    className="h-12 rounded-xl border border-border font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all">
                                    Cancelar
                                </button>
                                <button
                                    disabled={avanzando}
                                    onClick={async () => {
                                        await handleAvanzar(confirmArchivado, 'ARCHIVADO');
                                        setConfirmArchivado(null);
                                    }}
                                    className="h-12 rounded-xl bg-destructive text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-destructive/20">
                                    {avanzando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                                    Confirmar Archivado
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* Header Principal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                        <Inbox className="w-8 h-8 text-primary" />
                        Bandeja Vía PROFE
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2">
                        Control de Trámites, Hojas de Ruta y Auditoría de <span className="font-bold text-primary">Seguimiento</span> por Departamento.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {can('export', 'CorExport') && (
                        <button onClick={handleExportExcel}
                            title="Descargar todas las Hojas de Ruta de su sede en Excel"
                            className="px-5 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer">
                            <Download className="w-4 h-4" /> Exportar Excel
                        </button>
                    )}

                    <button onClick={tab === 'historial' ? fetchHistorial : fetchBandeja} disabled={loading || loadingHistorial}
                        className="w-12 h-12 rounded-2xl border border-border/60 hover:bg-accent flex items-center justify-center transition-all bg-card shadow-sm">
                        <RefreshCw className={cn('w-4 h-4', (loading || loadingHistorial) && 'animate-spin text-primary')} />
                    </button>

                    <Link href="/dashboard/correspondencia/nuevo"
                        className="px-6 h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                        <ArrowUpRight className="w-4 h-4" /> Nuevo Documento
                    </Link>
                </div>
            </div>

            {/* Barra de Filtros Superior: Tabs + Buscador + Agrupación por Departamento */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Tabs Principales integradas */}
                <div className="flex flex-wrap items-center gap-2 bg-card/60 p-1.5 rounded-2xl border border-border/60 backdrop-blur-md shadow-sm">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
                            className={cn('px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2',
                                tab === t.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-accent')}>
                            <t.icon className="w-3.5 h-3.5" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab !== 'historial' && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
                        {/* Buscador */}
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por CITE, HR o asunto..."
                                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border/60 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold text-sm transition-all shadow-sm" />
                        </div>

                        {/* Selector de Departamento */}
                        <div className="relative w-full sm:w-64">
                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            <select value={selectedDeptFilter} onChange={e => setSelectedDeptFilter(e.target.value)}
                                className="w-full h-12 pl-10 pr-8 rounded-2xl bg-card border border-border/60 font-black text-[11px] uppercase tracking-wider outline-none focus:border-primary appearance-none cursor-pointer shadow-sm">
                                {DEPARTAMENTOS_LIST.map(d => (
                                    <option key={d.id} value={d.id}>{d.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none" />
                        </div>

                        {/* Toggle Vista Lista vs Vista Agrupada por Departamento */}
                        <button onClick={() => setVistaAgrupada(!vistaAgrupada)}
                            className={cn('h-12 px-4 rounded-2xl border border-border/60 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 shadow-sm',
                                vistaAgrupada ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground hover:bg-accent')}>
                            {vistaAgrupada ? <Layers className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
                            {vistaAgrupada ? 'Agrupado por Departamento' : 'Vista Lista'}
                        </button>
                    </div>
                )}
            </div>

            {/* Mensaje de Error */}
            {error && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-bold text-sm">{error}</p>
                </div>
            )}

            {/* SECCIÓN BANDEJA: VISTAS (LISTA O AGRUPADA) */}
            {tab !== 'historial' && (
                <>
                    {vistaAgrupada ? (
                        <div className="space-y-8">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-36 gap-4 bg-card rounded-[2.5rem] border border-border/50">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Agrupando Documentos por Departamento...</p>
                                </div>
                            ) : groupedByDept.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-[2.5rem] border border-border/50">
                                    <Building2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                                    <h3 className="text-lg font-black text-muted-foreground">No se encontraron trámites para este Departamento</h3>
                                </div>
                            ) : (
                                groupedByDept.map((group) => (
                                    <div key={group.abreviacion} className="bg-card border border-border/60 rounded-[2.5rem] overflow-hidden shadow-lg">
                                        <div className="px-8 py-5 bg-accent/40 border-b border-border/50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-md">
                                                    {group.abreviacion}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-base tracking-tight">{group.nombre}</h3>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                        <Building2 className="w-3 h-3 text-primary" />
                                                        Departamento: <span className="text-primary font-mono">{group.abreviacion}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                                {group.docs.length} {group.docs.length === 1 ? 'Documento' : 'Documentos'}
                                            </span>
                                        </div>

                                        <div className="divide-y divide-border/30">
                                            {group.docs.map((doc: any) => {
                                                const ultimoSeguimiento = doc.seguimientos?.[0];
                                                const remitente = doc.participantes?.find((p: any) => p.rol === 'REMITENTE')?.usuario;
                                                const remitenteNombre = remitente ? `${remitente.nombre} ${remitente.apellidos}` : null;

                                                // Badge de Plazo (vista agrupada)
                                                const fechaLimiteG = doc.fechaLimite ? new Date(doc.fechaLimite) : null;
                                                const hoyG = new Date();
                                                const diasRestantesG = fechaLimiteG ? Math.ceil((fechaLimiteG.getTime() - hoyG.getTime()) / (1000 * 60 * 60 * 24)) : null;
                                                const plazoBadgeG = tab === 'recibidos' && fechaLimiteG ? (
                                                    diasRestantesG === null ? null :
                                                        diasRestantesG < 0 ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 text-[8px] font-black uppercase tracking-widest">
                                                                <Clock className="w-2.5 h-2.5" /> Vencido hace {Math.abs(diasRestantesG)}d
                                                            </span>
                                                        ) : diasRestantesG === 0 ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[8px] font-black uppercase tracking-widest animate-pulse">
                                                                <Clock className="w-2.5 h-2.5" /> Vence Hoy
                                                            </span>
                                                        ) : diasRestantesG <= 2 ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 text-[8px] font-black uppercase tracking-widest">
                                                                <Clock className="w-2.5 h-2.5" /> {diasRestantesG}d restantes
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                                                                <Clock className="w-2.5 h-2.5" /> {diasRestantesG}d restantes
                                                            </span>
                                                        )
                                                ) : null;

                                                return (
                                                    <div key={doc.id}
                                                        onClick={() => setSelected(selected?.id === doc.id ? null : doc)}
                                                        className={cn("p-6 hover:bg-primary/5 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4",
                                                            selected?.id === doc.id && "bg-primary/5")}>
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-muted flex flex-col items-center justify-center shrink-0 border border-border/50">
                                                                <span className="text-[8px] font-black leading-none mb-1 opacity-50">{doc.gestion}</span>
                                                                <Hash className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-black tracking-tight">{doc.cite}</span>
                                                                    {doc.hr && (
                                                                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[9px] font-black border border-emerald-500/20">
                                                                            HR: {doc.hr}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs font-bold text-muted-foreground mt-1 line-clamp-1">{doc.referencia}</p>
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-medium text-muted-foreground mt-1">
                                                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                                        <User className="w-3 h-3 text-emerald-500" />
                                                                        Creador: {remitenteNombre || 'N/A'}
                                                                    </span>
                                                                    {ultimoSeguimiento?.usuario && (
                                                                        <span className="flex items-center gap-1">
                                                                            <User className="w-3 h-3 text-primary" />
                                                                            Último: {ultimoSeguimiento.usuario.nombre} {ultimoSeguimiento.usuario.apellidos}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-end gap-4">
                                                            <div className="flex flex-col items-end gap-1">
                                                                {(() => {
                                                                    const esRespondidoConcluido = doc.estado !== 'ARCHIVADO' && doc.estado !== 'CANCELADO' && Boolean(doc.documentosHijos?.length);
                                                                    const estadoObj = esRespondidoConcluido
                                                                        ? { label: 'Respondido / Concluido', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-black' }
                                                                        : (ESTADO_LABELS[doc.estado] ?? { label: doc.estado, color: 'bg-muted text-muted-foreground' });
                                                                    return (
                                                                        <span className={cn(
                                                                            'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border',
                                                                            estadoObj.color
                                                                        )}>
                                                                            {estadoObj.label}
                                                                        </span>
                                                                    );
                                                                })()}
                                                                {plazoBadgeG}
                                                            </div>
                                                            <Link href={`/dashboard/correspondencia/seguimiento?cite=${encodeURIComponent(doc.cite)}`}
                                                                onClick={e => e.stopPropagation()}
                                                                className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all">
                                                                <FileText className="w-4 h-4" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* VISTA LISTA TRADICIONAL */
                        <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-xl min-h-[400px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-40 gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando Bandeja...</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-muted/10">
                                    <div className="w-20 h-20 rounded-[2rem] bg-muted flex items-center justify-center text-muted-foreground/30 mb-4">
                                        <Inbox className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight text-muted-foreground">Bandeja Vacía</h3>
                                    <p className="text-sm text-muted-foreground/60 mt-1 italic">No se encontraron documentos en "{TABS.find(t => t.id === tab)?.label}".</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-muted/30">
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Identificación / Departamento</th>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Referencia y Custodia</th>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estado</th>
                                                <th className="px-8 py-5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {filtered.map((doc: any) => {
                                                const ultimoSeguimiento = doc.seguimientos?.[0];
                                                const deptSigla = doc.tenantInfo?.abreviacion || doc.cite?.match(/PROFE\/([A-Z]+)\b/i)?.[1]?.toUpperCase() || 'NAC';
                                                const remitente = doc.participantes?.find((p: any) => p.rol === 'REMITENTE')?.usuario;
                                                const remitenteNombre = remitente ? `${remitente.nombre} ${remitente.apellidos}` : null;

                                                // Badge de Plazo
                                                const fechaLimite = doc.fechaLimite ? new Date(doc.fechaLimite) : null;
                                                const hoy = new Date();
                                                const diasRestantes = fechaLimite ? Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : null;
                                                const plazoBadge = tab === 'recibidos' && fechaLimite ? (
                                                    diasRestantes === null ? null :
                                                        diasRestantes < 0 ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 text-[8px] font-black uppercase tracking-widest">
                                                                <Clock className="w-2.5 h-2.5" /> Vencido hace {Math.abs(diasRestantes)}d
                                                            </span>
                                                        ) : diasRestantes === 0 ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[8px] font-black uppercase tracking-widest animate-pulse">
                                                                <Clock className="w-2.5 h-2.5" /> Vence Hoy
                                                            </span>
                                                        ) : diasRestantes <= 2 ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 text-[8px] font-black uppercase tracking-widest">
                                                                <Clock className="w-2.5 h-2.5" /> {diasRestantes}d restantes
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                                                                <Clock className="w-2.5 h-2.5" /> {diasRestantes}d restantes
                                                            </span>
                                                        )
                                                ) : null;

                                                return (
                                                    <motion.tr key={doc.id}
                                                        whileHover={{ backgroundColor: 'rgba(var(--primary-rgb), 0.02)' }}
                                                        className={cn("group cursor-pointer transition-colors", selected?.id === doc.id && "bg-primary/5")}
                                                        onClick={() => {
                                                            setAccionSeleccionada(null);
                                                            setNuevoDest(null);
                                                            setArchivoUrl(null);
                                                            setDetalle('');
                                                            setSelected(selected?.id === doc.id ? null : doc);
                                                        }}>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-muted flex flex-col items-center justify-center shrink-0 border border-border/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                    <span className="text-[8px] font-black leading-none mb-1 opacity-50">{doc.gestion}</span>
                                                                    <Hash className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs font-black tracking-tight">{doc.cite}</span>
                                                                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-1">
                                                                            <Building2 className="w-2.5 h-2.5" /> {deptSigla}
                                                                        </span>
                                                                    </div>
                                                                    {doc.hr && (
                                                                        <div className="flex items-center gap-1.5 mb-1">
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">HR:</span>
                                                                            <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">{doc.hr}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                                                        <span className="text-[10px] font-bold text-muted-foreground">
                                                                            {new Date(doc.createdAt).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="space-y-1.5">
                                                                <p className="text-sm font-bold text-foreground leading-tight">{doc.referencia}</p>
                                                                <div className="flex flex-col gap-1 text-[10px] font-medium text-muted-foreground pt-0.5">
                                                                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                                                        <User className="w-3 h-3 text-emerald-500 shrink-0" />
                                                                        <span>Creador: {remitenteNombre || 'N/A'}</span>
                                                                    </div>
                                                                    {ultimoSeguimiento?.usuario && (
                                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                            <User className="w-3 h-3 text-primary shrink-0" />
                                                                            <span>Último: {ultimoSeguimiento.usuario.nombre} {ultimoSeguimiento.usuario.apellidos}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col gap-2">
                                                                <span className={cn(
                                                                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border',
                                                                    ESTADO_LABELS[doc.estado]?.color ?? 'bg-muted text-muted-foreground border-border'
                                                                )}>
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                                    {ESTADO_LABELS[doc.estado]?.label ?? doc.estado}
                                                                </span>

                                                                {doc.diasMora > 0 && tab === 'recibidos' && (
                                                                    <span className={cn(
                                                                        "text-[8px] font-black uppercase tracking-widest flex items-center gap-1",
                                                                        doc.nivelAlerta === 'CRITICO' ? "text-red-600 animate-pulse" :
                                                                            doc.nivelAlerta === 'MORA' ? "text-orange-600" : "text-muted-foreground"
                                                                    )}>
                                                                        <Clock className="w-2.5 h-2.5" />
                                                                        {doc.diasMora} Días en Custodia {doc.alerta && <ShieldAlert className="w-3 h-3 text-red-500 inline ml-0.5" />}
                                                                    </span>
                                                                )}
                                                                {plazoBadge}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Link href={`/dashboard/correspondencia/seguimiento?cite=${encodeURIComponent(doc.cite)}`}
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-sm">
                                                                    <FileText className="w-4 h-4" />
                                                                </Link>
                                                                <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                                    <ChevronRight className={cn('w-4 h-4 transition-transform', selected?.id === doc.id && 'rotate-90')} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* SECCIÓN 2: HISTORIAL DE AUDITORÍA (COR_SEGUIMIENTO & SEGUIMIENTO_ID) */}
            {tab === 'historial' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* KPIs por Departamento */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Movimientos Totales</span>
                                <Activity className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-3xl font-black">{historialFiltrado.length}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground mt-1">Registros en Seguimiento</p>
                        </div>

                        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hojas de Ruta Creadas</span>
                                <FileUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h3 className="text-3xl font-black">
                                {historialFiltrado.filter(i => i.accion === 'CREACION').length}
                            </h3>
                            <p className="text-[10px] font-bold text-emerald-600 mt-1">Nuevos trámites registrados</p>
                        </div>

                        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Derivaciones Inter-Departamento</span>
                                <ArrowUpRight className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="text-3xl font-black">
                                {historialFiltrado.filter(i => i.accion === 'DERIVACION' || i.accion === 'ENVIO').length}
                            </h3>
                            <p className="text-[10px] font-bold text-amber-600 mt-1">Transferencias de custodia</p>
                        </div>

                        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Finalizados / Archivados</span>
                                <Archive className="w-5 h-5 text-blue-500" />
                            </div>
                            <h3 className="text-3xl font-black">
                                {historialFiltrado.filter(i => i.accion === 'ARCHIVADO').length}
                            </h3>
                            <p className="text-[10px] font-bold text-blue-600 mt-1">Trámites concluidos</p>
                        </div>
                    </div>

                    {/* Toolbar de Filtros para Historial */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border/60 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input type="text" value={historialSearch} onChange={e => setHistorialSearch(e.target.value)}
                                placeholder="Buscar por seguimiento_id, CITE, HR, funcionario o detalle..."
                                className="w-full h-11 pl-11 pr-4 rounded-2xl bg-muted/40 border border-border text-xs font-bold outline-none focus:border-primary" />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Filtro por Acción */}
                            <select value={historialAccionFilter} onChange={e => setHistorialAccionFilter(e.target.value)}
                                className="h-11 px-4 rounded-2xl bg-muted/40 border border-border font-black text-[10px] uppercase tracking-wider outline-none focus:border-primary cursor-pointer">
                                <option value="TODAS">Todas las Acciones</option>
                                <option value="CREACION">CREACIÓN</option>
                                <option value="ENVIO">ENVÍO</option>
                                <option value="RECEPCION">RECEPCIÓN</option>
                                <option value="DERIVACION">DERIVACIÓN</option>
                                <option value="DEVOLUCION">DEVOLUCIÓN</option>
                                <option value="ARCHIVADO">ARCHIVADO</option>
                            </select>

                            {/* Filtro por Departamento */}
                            <select value={selectedDeptFilter} onChange={e => setSelectedDeptFilter(e.target.value)}
                                className="h-11 px-4 rounded-2xl bg-muted/40 border border-border font-black text-[10px] uppercase tracking-wider outline-none focus:border-primary cursor-pointer">
                                {DEPARTAMENTOS_LIST.map(d => (
                                    <option key={d.id} value={d.id}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Timeline de Seguimiento Auditable Seguimiento */}
                    <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-xl">
                        {loadingHistorial ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Cargando Historial de Seguimiento...</p>
                            </div>
                        ) : historialFiltrado.length === 0 ? (
                            <div className="text-center py-20">
                                <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                <h3 className="text-lg font-black text-muted-foreground">Sin registros de auditoría para este filtro</h3>
                            </div>
                        ) : (
                            <div className="relative border-l-2 border-primary/20 ml-6 space-y-8 pl-8">
                                {historialFiltrado.map((item: CorHistorialItem) => {
                                    const origenSigla = item.docTenant?.abreviacion || 'NAC';
                                    const destSigla = item.destTenant?.abreviacion || 'EXT';

                                    return (
                                        <div key={item.id} className="relative group">
                                            {/* Indicador de Nodo en Timeline */}
                                            <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-card border-4 border-primary shadow-md flex items-center justify-center" />

                                            <div className="bg-muted/30 border border-border/60 rounded-3xl p-6 hover:border-primary/40 transition-all shadow-sm">
                                                {/* Header del Registro de Auditoría */}
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* departamento origen */}
                                                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-black text-[10px] uppercase border border-primary/20 flex items-center gap-1">
                                                            <Building2 className="w-3 h-3" /> {origenSigla}
                                                        </span>
                                                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {/* departamento destino */}
                                                        <span className="px-3 py-1 rounded-full bg-accent text-foreground font-black text-[10px] uppercase border border-border flex items-center gap-1">
                                                            <Building2 className="w-3 h-3 text-muted-foreground" /> {destSigla}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-muted-foreground ml-2 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> {new Date(item.fecha).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {/* Badge de seguimiento_id */}
                                                        <button onClick={() => copyToClipboard(item.id, 'seguimiento_id')}
                                                            title="Haz clic para copiar seguimiento_id"
                                                            className="px-2.5 py-1 rounded-lg bg-card border border-border/80 text-muted-foreground hover:text-primary hover:border-primary/50 text-[9px] font-mono font-bold transition-all flex items-center gap-1">
                                                            <Hash className="w-3 h-3 text-primary" />
                                                            <span className="truncate max-w-[120px]">id: {item.id.slice(0, 8)}...</span>
                                                            <Copy className="w-2.5 h-2.5 opacity-60" />
                                                        </button>

                                                        {/* Badge de Cumplimiento de Plazo */}
                                                        {item.estadoPlazo && (
                                                            <span className={cn(
                                                                "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1",
                                                                item.estadoPlazo === 'EN_PLAZO' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                                            )}>
                                                                {item.estadoPlazo === 'EN_PLAZO' ? 'ðŸŸ¢ A Tiempo' : 'ðŸ”´ Fuera de Plazo'}
                                                            </span>
                                                        )}

                                                        {/* Badge de Acción */}
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                            item.accion === 'CREACION' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                                item.accion === 'RECEPCION' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                                    item.accion === 'DERIVACION' ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                                                                        item.accion === 'DEVOLUCION' ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                                                                            item.accion === 'RESPUESTA' ? "bg-teal-500/10 text-teal-600 border-teal-500/20" :
                                                                                "bg-accent text-muted-foreground border-border"
                                                        )}>
                                                            {item.accion}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Detalle del Trámite y Funcionario */}
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-border/30 pt-4">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                            <FileText className="w-3 h-3" /> Documento & HR
                                                        </p>
                                                        <p className="text-xs font-black text-primary mt-0.5">{item.documento?.cite}</p>
                                                        {item.documento?.hr && (
                                                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono text-[9px] font-bold border border-emerald-500/20">
                                                                HR: {item.documento.hr}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                            <User className="w-3 h-3 text-emerald-500" /> Creador Original
                                                        </p>
                                                        <p className="text-xs font-bold mt-0.5 text-foreground">
                                                            {item.documento?.creador ? `${item.documento.creador.nombre} ${item.documento.creador.apellidos}` : 'Remitente N/A'}
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">
                                                            {item.documento?.creador?.cargoStr || 'Elaborador del CITE'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                            <User className="w-3 h-3 text-primary" /> Ejecutado por
                                                        </p>
                                                        <p className="text-xs font-bold mt-0.5">{item.usuario?.nombre} {item.usuario?.apellidos}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">{item.usuario?.cargoStr || 'Funcionario'}</p>

                                                        {item.destinatario && (
                                                            <div className="mt-2 pt-1.5 border-t border-border/40">
                                                                <p className="text-[9px] font-black uppercase text-primary flex items-center gap-1">
                                                                    <Send className="w-3 h-3 text-primary" /> Enviado a (Destinatario)
                                                                </p>
                                                                <p className="text-xs font-bold mt-0.5 text-foreground">{item.destinatario.nombre} {item.destinatario.apellidos}</p>
                                                                <p className="text-[9px] text-muted-foreground uppercase">{item.destinatario.cargoStr || 'Destinatario'}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                            <Activity className="w-3 h-3" /> Observaciones / Detalle
                                                        </p>
                                                        <p className="text-xs font-medium italic text-foreground/80 line-clamp-2 mt-0.5">
                                                            "{item.detalle || 'Sin observaciones'}"
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Adjunto PDF de Resguardo */}
                                                {item.archivoUrl && (
                                                    <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                                                        <span className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1.5">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Archivo PDF Adjunto en esta Acción
                                                        </span>
                                                        <a href={getImageUrl(item.archivoUrl)} target="_blank" rel="noreferrer"
                                                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5">
                                                            <Download className="w-3 h-3" /> Descargar PDF
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PANEL LATERAL DE CUSTODIA (SLIDE-OVER) */}
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
                        className="fixed top-0 right-0 bottom-0 w-full md:w-1/2 bg-card border-l border-border shadow-[0_0_50px_rgba(0,0,0,0.2)] z-[100] p-10 flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-xl font-black tracking-tight italic">Gestión de Custodia</h2>
                            <button onClick={() => setSelected(null)} className="w-12 h-12 rounded-2xl hover:bg-accent flex items-center justify-center transition-colors border border-border/50">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-8 overflow-y-auto pr-4">
                            <div className="p-6 rounded-3xl bg-muted/30 border border-border/50 space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Documento Seleccionado</p>
                                    <h3 className="text-lg font-black tracking-tighter leading-tight">{selected.cite}</h3>
                                    {selected.hr && (
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Hoja de Ruta:</span>
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black tracking-wide border border-emerald-500/20">{selected.hr}</span>
                                        </div>
                                    )}
                                    <p className="text-xs font-bold text-foreground/90 mt-2 line-clamp-2 italic">"{selected.referencia}"</p>
                                </div>

                                {/* Botón Directo: Ver Documento PDF / Detalle */}
                                {selected.archivoPdf ? (
                                    <a href={getImageUrl(selected.archivoPdf)} target="_blank" rel="noreferrer"
                                        className="w-full h-11 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                        <FileText className="w-4 h-4" /> Ver Documento PDF Principal
                                    </a>
                                ) : (
                                    <Link href={`/dashboard/correspondencia/seguimiento?cite=${encodeURIComponent(selected.cite)}`}
                                        className="w-full h-11 rounded-xl bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm">
                                        <FileText className="w-4 h-4" /> Ver Detalle Documento
                                    </Link>
                                )}

                                {/* Lista de Adjuntos / Anexos adicionales */}
                                {Array.isArray((selected as any).adjuntos) && (selected as any).adjuntos.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-border/40">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                                            <Paperclip className="w-3.5 h-3.5" /> Anexos / Adjuntos ({((selected as any).adjuntos).length})
                                        </p>
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                            {((selected as any).adjuntos as string[]).map((url, i) => (
                                                <a key={i} href={getImageUrl(url)} target="_blank" rel="noreferrer"
                                                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-primary/10 border border-border/40 text-xs font-bold text-foreground hover:text-primary transition-all truncate">
                                                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    <span className="truncate">Adjunto {i + 1} — {url.split('/').pop()}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 pt-2 border-t border-border/40">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-muted-foreground">Estado Actual:</span>
                                        <span className={cn(
                                            "font-black uppercase",
                                            selected.estado === 'ARCHIVADO' || Boolean(selected.documentosHijos?.length)
                                                ? 'text-emerald-600'
                                                : 'text-primary'
                                        )}>
                                            {selected.estado === 'ARCHIVADO'
                                                ? 'Concluido / Archivado'
                                                : Boolean(selected.documentosHijos?.length)
                                                    ? 'Respondido / Concluido'
                                                    : (ESTADO_LABELS[selected.estado]?.label || selected.estado)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-muted-foreground">Tu Rol:</span>
                                        <span className="uppercase">
                                            {(() => {
                                                const ultimoTransfer = (selected.seguimientos || []).find(
                                                    (s: any) => s.destinatario && (s.accion === 'DERIVACION' || s.accion === 'ENVIO' || s.accion === 'DEVOLUCION')
                                                );
                                                if (ultimoTransfer?.destinatario?.id === user?.id) {
                                                    return 'DESTINATARIO';
                                                }
                                                return selected.participantes?.find(p => p.userId === user?.id)?.rol || (tab === 'enviados' ? 'REMITENTE' : 'DESTINATARIO');
                                            })()}
                                        </span>
                                    </div>

                                    {selected.tenantInfo && (
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-muted-foreground">Departamento:</span>
                                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase border border-primary/20 flex items-center gap-1">
                                                <Building2 className="w-2.5 h-2.5" /> {selected.tenantInfo.nombre} ({selected.tenantInfo.abreviacion})
                                            </span>
                                        </div>
                                    )}

                                    {selected.estado === 'DEVUELTO' && selected.seguimientos?.[0] && (
                                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 my-3 animate-in zoom-in-95 duration-300">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertCircle className="w-4 h-4 text-red-600" />
                                                <span className="text-[10px] font-black uppercase text-red-600 tracking-widest">Documento Devuelto / Observado</span>
                                            </div>
                                            <p className="text-[11px] font-bold text-foreground">
                                                Devuelto por: {selected.seguimientos[0].usuario.nombre} {selected.seguimientos[0].usuario.apellidos}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Matriz de Cumplimiento de Respuestas y Plazos */}
                            <ComplianceMatrixWidget doc={selected} />

                            {selected.estado !== 'ARCHIVADO' && selected.estado !== 'CANCELADO' && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Acciones de Gestión Legal
                                    </p>
                                    {renderActions(selected)}
                                </div>
                            )}

                            {/* HISTORIAL / LISTA DE SEGUIMIENTO COMPLETA DE ESTE TRÁMITE */}
                            <div className="space-y-4 pt-6 border-t border-border/50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-primary" /> Historial de Movimientos (Trazabilidad)
                                </p>

                                {(!selected.seguimientos || selected.seguimientos.length === 0) ? (
                                    <p className="text-xs text-muted-foreground italic">Sin movimientos registrados aún.</p>
                                ) : (
                                    <div className="relative border-l-2 border-primary/20 ml-3 space-y-4 pl-4">
                                        {selected.seguimientos.map((seg: any) => (
                                            <div key={seg.id} className="relative group">
                                                <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-card shadow-sm" />

                                                <div className="bg-muted/40 border border-border/50 rounded-2xl p-4 space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={cn(
                                                            "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border",
                                                            seg.accion === 'CREACION' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                                seg.accion === 'RECEPCION' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                                    seg.accion === 'DERIVACION' ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                                                                        seg.accion === 'DEVOLUCION' ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                                                                            "bg-primary/10 text-primary border-primary/20"
                                                        )}>
                                                            {seg.accion}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> {new Date(seg.fecha).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <div className="text-xs font-bold space-y-1">
                                                        <p className="text-foreground">
                                                            <span className="text-muted-foreground font-medium text-[9px] uppercase">Ejecutado por: </span>
                                                            {seg.usuario ? `${seg.usuario.nombre} ${seg.usuario.apellidos}` : 'Sistema'}
                                                        </p>
                                                        {seg.destinatario && (
                                                            <p className="text-emerald-600">
                                                                <span className="text-muted-foreground font-medium text-[9px] uppercase">Enviado a: </span>
                                                                {seg.destinatario.nombre} {seg.destinatario.apellidos}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {seg.detalle && (
                                                        <p className="text-[11px] italic text-muted-foreground bg-background/60 p-2.5 rounded-xl border border-border/40">
                                                            "{seg.detalle}"
                                                        </p>
                                                    )}

                                                    {seg.archivoUrl && (
                                                        <a href={getImageUrl(seg.archivoUrl)} target="_blank" rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-600 hover:underline pt-1">
                                                            <Download className="w-3 h-3" /> Descargar PDF de esta acción
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-border flex flex-col gap-2">
                            <Link href={`/dashboard/correspondencia/seguimiento?cite=${encodeURIComponent(selected.hr || selected.cite)}`}
                                className="w-full h-14 rounded-2xl border border-border font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-accent transition-all">
                                Ver Historial Completo <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


