'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Plus, Edit2, Trash2, ChevronLeft, ChevronRight,
    Users, CheckCircle2, Clock, Hash, Eye, Download, Search,
    ToggleLeft, ToggleRight, Copy, ExternalLink, AlertCircle,
    BarChart3, RefreshCw, Timer, BookOpen,
    CircleDot, CheckSquare, Settings2, AlignLeft, Trophy,
    Mail, Phone, Play, QrCode, QrCode as QrIcon
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { RichTextEditor } from '@/components/RichTextEditor';

const TIPOS_PREGUNTA = [
    { value: 'SINGLE', label: 'Selección Única', icon: CircleDot, desc: 'Una sola respuesta correcta' },
    { value: 'MULTIPLE', label: 'Selección Múltiple', icon: CheckSquare, desc: 'Varias respuestas permitidas' },
    { value: 'TRUE_FALSE', label: 'Verdadero / Falso', icon: Settings2, desc: 'Alternativa binaria clásica' },
    { value: 'TEXTO', label: 'Respuesta Abierta', icon: AlignLeft, desc: 'El participante redacta libremente' },
];

export default function EventoOperativoPage() {
    const params = useParams();
    const router = useRouter();
    const eventoId = params.eventoId as string;

    const [evento, setEvento] = useState<any>(null);
    // ── Inscripciones server-side ───────────────────────────────────────────────
    const [inscripciones, setInscripciones] = useState<any[]>([]);
    const [insTotal, setInsTotal] = useState(0);
    const [insPage, setInsPage] = useState(1);
    const [insSearch, setInsSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [insLoading, setInsLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    // Stats separadas (COUNT query, ultra rápido)
    const [stats, setStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'cuestionarios' | 'inscripciones' | 'estadisticas'>('cuestionarios');
    const [search, setSearch] = useState('');

    // Cuestionario
    const [cuestionarios, setCuestionarios] = useState<any[]>([]);
    const [cuestionarioActivo, setCuestionarioActivo] = useState<any>(null);
    const [preguntas, setPreguntas] = useState<any[]>([]);
    const [modalCues, setModalCues] = useState(false);
    const [modalPregunta, setModalPregunta] = useState(false);
    const [editingCues, setEditingCues] = useState<any>(null);
    const [editingPregunta, setEditingPregunta] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [modalQR, setModalQR] = useState(false);

    const [confirmDeletePregunta, setConfirmDeletePregunta] = useState<{
        isOpen: boolean;
        itemId: string | null;
        loading: boolean;
    }>({
        isOpen: false,
        itemId: null,
        loading: false
    });

    // Forms
    const [formCues, setFormCues] = useState({
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        tiempoMaximo: '',
        puntosMaximos: '',
        estado: 'activo',
        orden: 1,
        esObligatorio: true,
        esEvaluativo: true,
        urlVideo: '',
        cantidadPreguntas: '',
        esAleatorio: false,
        limiteIntentos: '',
        puntajeMinimo: '0',
    });
    const [formPregunta, setFormPregunta] = useState({ texto: '', tipo: 'SINGLE', puntos: 1, obligatorio: true, opciones: [{ texto: '', esCorrecta: false }, { texto: '', esCorrecta: false }] });

    const INS_LIMIT = 100;

    useEffect(() => { loadData(); }, [eventoId]);
    useEffect(() => { if (cuestionarioActivo) loadPreguntas(cuestionarioActivo.id); }, [cuestionarioActivo]);
    useEffect(() => { loadInscripciones(1, insSearch); }, [eventoId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [evtRes, cuesRes] = await Promise.all([
                api.get(`/eventos/${eventoId}`),
                api.get('/evento-cuestionarios', { params: { eventoId } }),
            ]);
            setEvento(evtRes.data);
            const cues = Array.isArray(cuesRes.data) ? cuesRes.data : [];
            setCuestionarios(cues);
            if (cues.length > 0 && !cuestionarioActivo) setCuestionarioActivo(cues[0]);
        } catch (e) {
            try {
                const evtRes = await api.get(`/eventos/${eventoId}`);
                setEvento(evtRes.data);
                const cuests = evtRes.data?.cuestionarios || [];
                setCuestionarios(cuests);
                if (cuests.length > 0) setCuestionarioActivo(cuests[0]);
            } catch { toast.error('Error cargando el evento'); }
        } finally { setLoading(false); }
    };

    // Carga paginada server-side de inscripciones
    const loadInscripciones = async (page: number, search: string) => {
        setInsLoading(true);
        try {
            const res = await api.get('/eventos-inscripciones', {
                params: { eventoId, page, limit: INS_LIMIT, ...(search ? { search } : {}) }
            });
            const payload = res.data;
            setInscripciones(Array.isArray(payload) ? payload : (payload?.data ?? []));
            setInsTotal(payload?.total ?? (Array.isArray(payload) ? payload.length : 0));
            setInsPage(page);
        } catch { toast.error('Error cargando inscripciones'); }
        finally { setInsLoading(false); }
    };

    // Stats ultra-rápidas via COUNT query
    const loadStats = async () => {
        setStatsLoading(true);
        try {
            const res = await api.get(`/eventos-inscripciones/stats/${eventoId}`);
            setStats(res.data);
        } catch { toast.error('Error cargando estadísticas'); }
        finally { setStatsLoading(false); }
    };

    const loadPreguntas = async (cuestionarioId: string) => {
        try {
            const res = await api.get('/evento-preguntas', { params: { cuestionarioId } });
            const data = Array.isArray(res.data) ? res.data : [];
            setPreguntas(data);
        } catch {
            setPreguntas(cuestionarioActivo?.preguntas || []);
        }
    };

    // ─── CUESTIONARIO CRUD ───────────────────────────────────────────────────
    const openNewCues = () => {
        setEditingCues(null);
        setFormCues({
            titulo: '',
            descripcion: '',
            fechaInicio: '',
            fechaFin: '',
            tiempoMaximo: '',
            puntosMaximos: '',
            estado: 'activo',
            orden: cuestionarios.length + 1,
            esObligatorio: true,
            esEvaluativo: true,
            urlVideo: '',
            cantidadPreguntas: '',
            esAleatorio: false,
            limiteIntentos: '',
            puntajeMinimo: '0',
        });
        setModalCues(true);
    };

    const openEditCues = (c: any) => {
        setEditingCues(c);
        setFormCues({
            titulo: c.titulo,
            descripcion: c.descripcion,
            fechaInicio: c.fechaInicio ? new Date(new Date(c.fechaInicio).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
            fechaFin: c.fechaFin ? new Date(new Date(c.fechaFin).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
            tiempoMaximo: c.tiempoMaximo?.toString() || '',
            puntosMaximos: c.puntosMaximos?.toString() || '',
            estado: c.estado,
            orden: c.orden || 1,
            esObligatorio: c.esObligatorio ?? true,
            esEvaluativo: c.esEvaluativo ?? true,
            urlVideo: c.urlVideo || '',
            cantidadPreguntas: c.cantidadPreguntas?.toString() || '',
            esAleatorio: c.esAleatorio ?? false,
            limiteIntentos: c.limiteIntentos?.toString() || '',
            puntajeMinimo: c.puntajeMinimo?.toString() || '0',
        });
        setModalCues(true);
    };

    const saveCuestionario = async () => {
        setSubmitting(true);
        try {
            const payload = {
                ...formCues,
                eventoId,
                fechaInicio: formCues.fechaInicio ? new Date(formCues.fechaInicio).toISOString() : null,
                fechaFin: formCues.fechaFin ? new Date(formCues.fechaFin).toISOString() : null,
                tiempoMaximo: formCues.tiempoMaximo ? parseInt(formCues.tiempoMaximo) : null,
                puntosMaximos: formCues.puntosMaximos ? parseInt(formCues.puntosMaximos) : null,
                orden: parseInt(formCues.orden as any) || 1,
                cantidadPreguntas: formCues.cantidadPreguntas ? parseInt(formCues.cantidadPreguntas) : null,
                limiteIntentos: formCues.limiteIntentos ? parseInt(formCues.limiteIntentos) : null,
                puntajeMinimo: parseInt(formCues.puntajeMinimo) || 0,
            };
            if (editingCues) {
                await api.patch(`/evento-cuestionarios/${editingCues.id}`, payload);
                toast.success('Cuestionario actualizado');
            } else {
                await api.post('/evento-cuestionarios', payload);
                toast.success('Cuestionario creado');
            }
            setModalCues(false);
            loadData();
        } catch { toast.error('Error guardando cuestionario'); }
        finally { setSubmitting(false); }
    };

    // ─── PREGUNTA CRUD ───────────────────────────────────────────────────────
    const openNewPregunta = () => {
        if (!cuestionarioActivo) return;
        setEditingPregunta(null);
        const defaultOpts = formPregunta.tipo === 'TRUE_FALSE'
            ? [{ texto: 'Verdadero', esCorrecta: false }, { texto: 'Falso', esCorrecta: false }]
            : [{ texto: '', esCorrecta: false }, { texto: '', esCorrecta: false }];
        setFormPregunta({ texto: '', tipo: 'SINGLE', puntos: 1, obligatorio: true, opciones: defaultOpts });
        setModalPregunta(true);
    };

    const openEditPregunta = (p: any) => {
        setEditingPregunta(p);
        setFormPregunta({
            texto: p.texto,
            tipo: p.tipo,
            puntos: p.puntos || 1,
            obligatorio: p.obligatorio,
            opciones: p.opciones?.length ? p.opciones : [{ texto: '', esCorrecta: false }, { texto: '', esCorrecta: false }],
        });
        setModalPregunta(true);
    };

    const savePregunta = async () => {
        if (!cuestionarioActivo) return;
        setSubmitting(true);
        try {
            const payload = { ...formPregunta, cuestionarioId: cuestionarioActivo.id };
            if (editingPregunta) {
                await api.patch(`/evento-preguntas/${editingPregunta.id}`, payload);
                toast.success('Pregunta actualizada');
            } else {
                await api.post('/evento-preguntas', payload);
                toast.success('Pregunta creada');
            }
            setModalPregunta(false);
            loadPreguntas(cuestionarioActivo.id);
        } catch { toast.error('Error guardando pregunta'); }
        finally { setSubmitting(false); }
    };

    const deletePregunta = (id: string) => {
        setConfirmDeletePregunta({
            isOpen: true,
            itemId: id,
            loading: false
        });
    };

    const confirmDeletePreguntaAction = async () => {
        if (!confirmDeletePregunta.itemId) return;
        try {
            setConfirmDeletePregunta(prev => ({ ...prev, loading: true }));
            await api.delete(`/evento-preguntas/${confirmDeletePregunta.itemId}`);
            toast.success('Pregunta eliminada');
            loadPreguntas(cuestionarioActivo.id);
            setConfirmDeletePregunta(prev => ({ ...prev, isOpen: false }));
        } catch {
            toast.error('Error eliminando pregunta');
        } finally {
            setConfirmDeletePregunta(prev => ({ ...prev, loading: false }));
        }
    };

    // Cambiar tipo de pregunta
    const changeTipoPregunta = (tipo: string) => {
        let opciones = formPregunta.opciones;
        if (tipo === 'TRUE_FALSE') opciones = [{ texto: 'Verdadero', esCorrecta: false }, { texto: 'Falso', esCorrecta: false }];
        else if (tipo === 'TEXTO') opciones = [];
        else if (opciones.length < 2) opciones = [{ texto: '', esCorrecta: false }, { texto: '', esCorrecta: false }];
        setFormPregunta(p => ({ ...p, tipo, opciones }));
    };

    // Asistencia por CI
    const [modalAsistencia, setModalAsistencia] = useState(false);
    const [codigoAsistencia, setCodigoAsistencia] = useState('');
    const toggleCodigoAsistencia = async () => {
        try {
            if (evento?.codigoAsistencia) {
                // Desactivar
                await api.patch(`/eventos/${eventoId}`, { codigoAsistencia: null });
                toast.success('Código de asistencia desactivado');
                setCodigoAsistencia('');
            } else {
                // Activar (usar custom o generar)
                const nuevoCode = codigoAsistencia || Math.random().toString(36).substring(2, 8).toUpperCase();
                await api.patch(`/eventos/${eventoId}`, { codigoAsistencia: nuevoCode });
                toast.success(`Código activado: ${nuevoCode}`);
                setCodigoAsistencia(''); // Limpiar input
            }
            loadData();
        } catch { toast.error('Error actualizando código'); }
    };

    const totalPages = Math.ceil(insTotal / INS_LIMIT);

    // Búsqueda server-side: dispara loadInscripciones cuando el usuario presiona Enter o el botón
    const handleSearch = () => {
        setInsSearch(searchInput);
        loadInscripciones(1, searchInput);
    };

    const marcarAsistencia = async (inscripcionId: string, valor: boolean) => {
        try {
            await api.patch(`/eventos-inscripciones/${inscripcionId}`, { asistencia: valor });
            setInscripciones(prev => prev.map(i => i.id === inscripcionId ? { ...i, asistencia: valor } : i));
            toast.success(valor ? 'Asistencia registrada' : 'Asistencia removida');
        } catch { toast.error('Error'); }
    };

    // Exportar Excel: pide TODOS los registros al endpoint de export (sin límite)
    const exportarExcel = async () => {
        setExporting(true);
        const toastId = toast.loading(`Preparando reporte de ${insTotal.toLocaleString()} registros...`);
        try {
            const res = await api.get(`/eventos-inscripciones/export/${eventoId}`);
            const allData: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);

            const camposExtras = evento?.camposExtras || [];
            const cuesActivos = cuestionarios.filter(c => c.estado === 'activo');

            const header = ['CI', 'Complemento', 'Nombres', 'Apellidos', 'Celular', 'Correo', 'Asistencia',
                ...camposExtras.map((c: any) => c.label),
                ...cuesActivos.map((c: any) => `${c.titulo} (Estado)`),
            ];

            const rows = allData.map((i: any) => [
                String(i.persona?.ci || 'N/A'),
                i.persona?.complemento || '',
                `${i.persona?.nombre || i.persona?.nombre1 || ''} ${i.persona?.nombre2 || ''}`.trim(),
                `${i.persona?.apellidos || ''} ${i.persona?.apellido1 || ''} ${i.persona?.apellido2 || ''}`.trim() || 'N/A',
                i.persona?.celular || 'N/A',
                i.persona?.correo || 'N/A',
                i.asistencia ? 'PRESENTE' : 'AUSENTE',
                ...camposExtras.map((campo: any) => {
                    const resp = i.respuestasExtras?.find((r: any) => r.campoExtraId === campo.id);
                    return resp?.valor || 'Sin respuesta';
                }),
                ...cuesActivos.map((c: any) => {
                    const intents = i.persona?.eventoCuestionarioIntentos || [];
                    return intents.find((it: any) => it.cuestionarioId === c.id && it.estado === 'finished') ? 'REALIZADO' : 'PENDIENTE';
                }),
            ]);

            // Hoja de estadísticas usando datos del servidor
            const s = stats;
            const statsRows: any[] = [
                ['RESUMEN GENERAL DEL EVENTO'],
                [''],
                ['Total Inscritos', insTotal],
                ['Con Asistencia', s?.conAsistencia ?? '—'],
                ['Sin Asistencia', s?.sinAsistencia ?? '—'],
                ['% Asistencia', s ? `${s.porcentajeAsistencia}%` : '—'],
            ];

            const workbook = XLSX.utils.book_new();
            const wsInscritos = XLSX.utils.aoa_to_sheet([header, ...rows]);
            // Auto-ancho de columnas
            wsInscritos['!cols'] = header.map(() => ({ wch: 22 }));
            XLSX.utils.book_append_sheet(workbook, wsInscritos, 'Participantes');
            const wsStats = XLSX.utils.aoa_to_sheet(statsRows);
            XLSX.utils.book_append_sheet(workbook, wsStats, 'Resumen');

            XLSX.writeFile(workbook, `Reporte_${evento?.nombre?.replace(/\s+/g, '_') || 'Evento'}_${new Date().toLocaleDateString('es-BO').replace(/\//g, '-')}.xlsx`);
            toast.success(`✅ Excel generado con ${allData.length.toLocaleString()} registros`, { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Error al generar el Excel', { id: toastId });
        } finally { setExporting(false); }
    };

    const getInscripcionStats = useCallback((i: any) => {
        const activeCues = cuestionarios.filter(c => c.estado === 'activo');
        if (activeCues.length === 0) return { label: 'N/A', count: 0, total: 0, completed: true, color: 'text-muted-foreground bg-muted/10 border-muted/20' };

        const personaIntents = i.persona?.eventoCuestionarioIntentos || [];
        const finishedIntents = personaIntents.filter((it: any) => it.estado === 'finished');

        // Mapeamos los IDs de cuestionarios activos que ya tienen un intento finalizado
        const completedIds = activeCues.filter(ac => finishedIntents.some((fi: any) => fi.cuestionarioId === ac.id)).map(ac => ac.id);
        const count = completedIds.length;
        const total = activeCues.length;
        const completed = count === total;

        if (completed) return { label: 'Realizado', count, total, completed, color: 'text-green-500 bg-green-500/10 border-green-500/20' };
        if (count > 0) return { label: 'En progreso', count, total, completed, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
        return { label: 'Pendiente', count, total, completed, color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    }, [cuestionarios]);

    const totalInscritos = insTotal;
    const totalAsistencia = stats?.conAsistencia ?? inscripciones.filter(i => i.asistencia).length;

    const totalCompletos = useMemo(() => {
        return inscripciones.filter(i => getInscripcionStats(i).completed).length;
    }, [inscripciones, getInscripcionStats]);

    const totalPreguntasGlobal = useMemo(() => {
        return cuestionarios.reduce((sum, c) => sum + (c.preguntas?.length || 0), 0);
    }, [cuestionarios]);

    // Estadísticas de Campos Extras (PROCESADAS DESDE EL BACKEND stats.porCampoExtra)
    const extraFieldsStats = useMemo(() => {
        if (!stats?.porCampoExtra || !evento?.camposExtras) return [];

        return evento.camposExtras.map((campo: any) => {
            const rawData = stats.porCampoExtra.filter((p: any) => p.campoExtraId === campo.id);
            const chartData = rawData.map((d: any) => ({
                name: d.valor || 'Sin respuesta',
                value: d._count?.valor || d._count || 0
            }));

            // Solo mostrar si hay datos
            return {
                id: campo.id,
                label: campo.label,
                tipo: campo.tipo,
                chartData: chartData.sort((a: any, b: any) => b.value - a.value)
            };
        }).filter((s: any) => s.chartData.length > 0);
    }, [stats, evento]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center hover:border-primary transition-all">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">Panel Operativo</p>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">{evento?.nombre || 'Evento'}</h1>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <a href={`/evento/${evento?.codigo || eventoId}`} target="_blank"
                        className="flex items-center gap-2 h-10 px-4 rounded-xl bg-card border border-border text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all">
                        <ExternalLink className="w-3.5 h-3.5" /> Ver Pública
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/evento/${evento?.codigo || eventoId}`); toast.success('URL copiada'); }}
                        className="flex items-center gap-2 h-10 px-4 rounded-xl bg-card border border-border text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all">
                        <Copy className="w-3.5 h-3.5" /> Copiar URL
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Inscritos', val: totalInscritos, icon: Users, color: 'text-blue-400' },
                    { label: 'Asistencia', val: totalAsistencia, icon: CheckCircle2, color: 'text-green-400' },
                    { label: 'Cuestionarios', val: cuestionarios.length, icon: FileText, color: 'text-amber-400' },
                    { label: 'Preguntas', val: totalPreguntasGlobal, icon: Hash, color: 'text-purple-400' },
                ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                        <s.icon className={`w-6 h-6 ${s.color}`} />
                        <div>
                            <p className="text-2xl font-black text-foreground">{s.val}</p>
                            <p className="text-[10px] font-black uppercase text-muted-foreground">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Código asistencia */}
            <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className="flex-1">
                    <p className="text-xs font-black uppercase text-muted-foreground">Código de Asistencia (para transmisión)</p>
                    <p className="font-black text-2xl tracking-widest text-foreground font-mono mt-1">
                        {evento?.codigoAsistencia || '— No activo'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {evento?.codigoAsistencia && (
                        <>
                            <button onClick={() => { navigator.clipboard.writeText(evento.codigoAsistencia); toast.success('Código copiado'); }}
                                className="h-10 px-4 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition-all flex items-center gap-2">
                                <Copy className="w-3.5 h-3.5" /> Copiar Código
                            </button>
                            <button onClick={() => setModalQR(true)}
                                className="h-10 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-black uppercase transition-all flex items-center gap-2 border border-primary/20">
                                <QrCode className="w-4 h-4" /> Generar QR Asistencia
                            </button>
                        </>
                    )}
                    <input type="text" placeholder="Código custom..." value={codigoAsistencia}
                        onChange={e => setCodigoAsistencia(e.target.value.toUpperCase())}
                        className="h-10 px-4 w-36 rounded-xl bg-muted border-transparent focus:border-primary border-2 outline-none text-sm font-mono tracking-widest text-foreground" />
                    <button onClick={toggleCodigoAsistencia}
                        className={`h-10 px-4 rounded-xl font-black text-xs uppercase transition-all ${evento?.codigoAsistencia ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-primary text-white hover:opacity-90'}`}>
                        {evento?.codigoAsistencia ? 'Desactivar' : 'Activar'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { id: 'cuestionarios', label: 'Cuestionarios', icon: FileText },
                    { id: 'inscripciones', label: `Inscripciones (${insTotal.toLocaleString()})`, icon: Users },
                    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
                ].map(t => (
                    <button key={t.id} onClick={() => {
                        setTab(t.id as any);
                        if (t.id === 'estadisticas' && !stats) loadStats();
                    }}
                        className={`flex items-center gap-2 h-10 px-5 rounded-xl text-xs font-black uppercase transition-all ${tab === t.id ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB CUESTIONARIOS ── */}
            {tab === 'cuestionarios' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lista cuestionarios */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                                Módulos Evaluativos
                            </h3>
                            <button onClick={openNewCues} className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-wider hover:bg-primary-600 hover:scale-105 shadow-md shadow-primary/20 transition-all">
                                <Plus className="w-3.5 h-3.5" /> Nuevo
                            </button>
                        </div>
                        {cuestionarios.length === 0 && (
                            <div className="p-8 text-center rounded-[1.5rem] border-2 border-dashed border-border bg-muted/20">
                                <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground font-medium">No hay evaluaciones registradas</p>
                            </div>
                        )}
                        <div className="space-y-3">
                            {cuestionarios.map(c => (
                                <div key={c.id} onClick={() => setCuestionarioActivo(c)}
                                    className={`group relative p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all overflow-hidden ${cuestionarioActivo?.id === c.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'}`}>

                                    {/* Indicador activo lateral */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all ${cuestionarioActivo?.id === c.id ? 'bg-primary' : 'bg-transparent group-hover:bg-primary/30'}`} />

                                    <div className="flex gap-4">
                                        {/* Icono Principal */}
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${cuestionarioActivo?.id === c.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                            <FileText className="w-5 h-5" />
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-start justify-between">
                                                <p className={`font-black uppercase text-sm leading-tight pr-2 ${cuestionarioActivo?.id === c.id ? 'text-primary' : 'text-foreground'}`}>
                                                    {c.titulo}
                                                </p>
                                                <button onClick={e => { e.stopPropagation(); openEditCues(c); }}
                                                    className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all shrink-0">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${c.estado === 'activo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                    {c.estado === 'activo' ? 'Publicado' : 'Borrador'}
                                                </span>
                                                {c.tiempoMaximo && (
                                                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-lg">
                                                        <Timer className="w-3 h-3 text-primary/70" /> {c.tiempoMaximo} min
                                                    </span>
                                                )}
                                                {c.puntosMaximos && (
                                                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-lg">
                                                        <Trophy className="w-3 h-3 text-amber-500" /> {c.puntosMaximos} pts
                                                    </span>
                                                )}
                                                {c.urlVideo && (
                                                    <span className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-0.5 rounded-lg border border-red-500/20">
                                                        <Eye className="w-3 h-3" /> Video
                                                    </span>
                                                )}
                                                {c.limiteIntentos && (
                                                    <span className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-lg border border-blue-500/20">
                                                        <RefreshCw className="w-3 h-3 text-blue-500/70" /> {c.limiteIntentos} Intentos
                                                    </span>
                                                )}
                                                {c.esAleatorio && (
                                                    <span className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-lg border border-purple-500/20">
                                                        <Hash className="w-3 h-3 text-purple-500/70" /> Aleatorio
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preguntas del cuestionario */}
                    <div className="lg:col-span-2 space-y-4">
                        {cuestionarioActivo && (
                            <>
                                <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
                                    <div>
                                        <h3 className="text-sm font-black uppercase text-foreground">Banco de Preguntas</h3>
                                        {preguntas.length > 0 && (
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                Total construidos: <span className="text-primary">{preguntas.length} Preguntas</span> • Puntaje total: <span className="text-amber-500">{preguntas.reduce((a, b) => a + (b.puntos || 1), 0)} pts</span>
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={openNewPregunta} className="shrink-0 flex items-center gap-1.5 h-10 px-4 rounded-[1rem] bg-primary text-white text-[11px] font-black uppercase tracking-wider hover:bg-primary-600 hover:scale-105 shadow-md shadow-primary/20 transition-all">
                                        <Plus className="w-4 h-4" /> Agregar Pregunta
                                    </button>
                                </div>

                                {preguntas.length === 0 && <p className="text-sm text-muted-foreground">Sin preguntas aún.</p>}

                                <AnimatePresence>
                                    {preguntas.map((p, idx) => (
                                        <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className="group bg-card hover:bg-muted/10 border-2 border-border/60 hover:border-primary/30 rounded-[1.5rem] p-5 md:p-6 transition-all shadow-sm hover:shadow-lg relative overflow-hidden">

                                            {/* Decoración lateral para destacar hover */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                {/* Número de pregunta */}
                                                <div className="w-10 h-10 rounded-2xl bg-primary shadow-lg shadow-primary/20 text-white text-sm font-black flex items-center justify-center shrink-0">
                                                    Q{idx + 1}
                                                </div>

                                                <div className="flex-1 space-y-4">
                                                    {/* Encabezado: Texto y Metadatos */}
                                                    <div>
                                                        <h4 className="text-base md:text-lg font-black text-foreground leading-tight">{p.texto}</h4>
                                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                                                                {(() => {
                                                                    const t = TIPOS_PREGUNTA.find(x => x.value === p.tipo);
                                                                    return t ? <><t.icon className="w-3 h-3" /> {t.label}</> : p.tipo;
                                                                })()}
                                                            </span>
                                                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest">
                                                                {p.puntos || 1} {p.puntos === 1 ? 'Punto' : 'Puntos'}
                                                            </span>
                                                            {p.obligatorio && (
                                                                <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest">
                                                                    Obligatorio
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Opciones Renderizadas */}
                                                    {p.opciones?.length > 0 && p.tipo !== 'TEXTO' && (
                                                        <div className="pt-2">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                                                {p.opciones.map((o: any, oIdx: number) => (
                                                                    <div key={o.id || oIdx}
                                                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${o.esCorrecta ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400' : 'bg-muted/40 border-border/50 text-muted-foreground'}`}>
                                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${o.esCorrecta ? 'bg-green-500 text-white' : 'bg-background border border-border'}`}>
                                                                            {o.esCorrecta && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                                        </div>
                                                                        <span className="text-sm font-semibold">{o.texto}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Acciones de Pregunta */}
                                                <div className="flex gap-2 self-start mt-4 md:mt-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditPregunta(p)}
                                                        title="Editar Pregunta"
                                                        className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => deletePregunta(p.id)}
                                                        title="Eliminar Pregunta"
                                                        className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </>
                        )}
                        {!cuestionarioActivo && cuestionarios.length > 0 && (
                            <p className="text-sm text-muted-foreground">Selecciona un cuestionario</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB INSCRIPCIONES ── */}
            {tab === 'inscripciones' && (
                <div className="space-y-4">
                    {/* Alerta informativa */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                        <Users className="w-4 h-4 shrink-0" />
                        <p className="text-[11px] font-bold">
                            Mostrando los últimos <strong>100</strong> inscritos. Para buscar entre los <strong>{insTotal.toLocaleString()}</strong> registros totales,
                            ingresa el CI exacto en el buscador.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    placeholder="Buscar por CI (exacto), Nombre o Apellido..."
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border outline-none text-sm font-bold focus:border-primary transition-all shadow-sm"
                                />
                            </div>
                            <button onClick={handleSearch} disabled={insLoading}
                                className="h-12 px-5 rounded-2xl bg-card border border-border text-xs font-black text-muted-foreground hover:text-primary hover:border-primary transition-all flex items-center gap-2">
                                {insLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Buscar
                            </button>
                            {insSearch && (
                                <button onClick={() => { setSearchInput(''); setInsSearch(''); loadInscripciones(1, ''); }}
                                    className="h-12 px-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-black hover:bg-red-500/20 transition-all">
                                    Limpiar
                                </button>
                            )}
                        </div>
                        <button onClick={exportarExcel} disabled={exporting}
                            className="h-12 px-6 rounded-2xl bg-green-600 shadow-lg shadow-green-600/20 text-xs font-black text-white hover:opacity-90 flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {exporting ? 'Generando...' : `Exportar ${insTotal.toLocaleString()} Registros`}
                        </button>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

                        {/* CONTROLES DE PAGINACIÓN SUPERIOR */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                            <div className="flex gap-4 flex-wrap">
                                <span className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">
                                    {insSearch ? 'Resultados:' : 'Últimos 100:'} <span className="text-primary">{inscripciones.length}</span>
                                    {!insSearch && <span className="text-muted-foreground"> de {insTotal.toLocaleString()} total</span>}
                                </span>
                                <span className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">
                                    Completaron: <span className="text-green-500">{totalCompletos}</span>
                                </span>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => loadInscripciones(insPage - 1, insSearch)} disabled={insPage === 1 || insLoading}
                                        className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center disabled:opacity-50 hover:bg-muted">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-bold px-2">Pág {insPage} de {totalPages}</span>
                                    <button onClick={() => loadInscripciones(insPage + 1, insSearch)} disabled={insPage === totalPages || insLoading}
                                        className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center disabled:opacity-50 hover:bg-muted">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/10">
                                        <th className="text-left p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest whitespace-nowrap">Participante & Contacto</th>
                                        <th className="text-left p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Identidad (CI)</th>
                                        <th className="text-left p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Evaluaciones</th>
                                        <th className="text-center p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Asistencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {insLoading && (
                                        <tr><td colSpan={4} className="text-center p-8">
                                            <div className="flex items-center justify-center gap-3 text-muted-foreground">
                                                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                                                <span className="text-sm font-bold">Buscando...</span>
                                            </div>
                                        </td></tr>
                                    )}
                                    {!insLoading && inscripciones.length === 0 && (
                                        <tr><td colSpan={4} className="text-center p-8 text-muted-foreground text-sm font-medium">No se encontraron inscripciones con ese criterio.</td></tr>
                                    )}
                                    {!insLoading && inscripciones.map((i: any) => (
                                        <tr key={i.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                                                        {i.persona?.nombre1?.charAt(0)}{i.persona?.apellido1?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground uppercase text-[13px] leading-tight">
                                                            {[
                                                                i.persona?.nombre1,
                                                                i.persona?.nombre2,
                                                                i.persona?.apellido1,
                                                                i.persona?.apellido2
                                                            ].filter(Boolean).join(' ')}
                                                        </p>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate max-w-[150px]" title={i.persona?.correo}>
                                                                <Mail className="w-3 h-3 text-primary/60" /> {i.persona?.correo || 'Sin correo'}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                                                                <Phone className="w-3 h-3 text-primary/60" /> {i.persona?.celular || 'Sin celular'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-mono text-[13px] font-black text-foreground bg-muted/30 px-3 py-1.5 rounded-lg inline-block">
                                                    {String(i.persona?.ci || 'N/A')} {i.persona?.complemento ? `-${i.persona.complemento}` : ''}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {(() => {
                                                    const stats = getInscripcionStats(i);
                                                    return (
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${stats.color}`}>
                                                            {stats.completed ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                            {stats.label} {stats.total > 0 && `(${stats.count}/${stats.total})`}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => marcarAsistencia(i.id, !i.asistencia)}
                                                    className={`inline-flex items-center gap-2 h-9 px-4 rounded-[1rem] text-xs font-black transition-all ${i.asistencia ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-sm border border-green-500/20' : 'bg-card border-2 border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>
                                                    {i.asistencia ? <><CheckCircle2 className="w-4 h-4" /> Presente</> : 'Marcar Asistencia'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB ESTADÍSTICAS ── */}
            {tab === 'estadisticas' && (
                <div className="space-y-6">
                    {statsLoading && (
                        <div className="flex items-center justify-center gap-3 p-12 text-muted-foreground">
                            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                            <span className="font-bold">Calculando estadísticas de {insTotal.toLocaleString()} registros...</span>
                        </div>
                    )}
                    {!statsLoading && stats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Inscritos', val: insTotal.toLocaleString(), color: 'text-primary', sub: 'Registros totales en BD', icon: Users },
                                { label: 'Con Asistencia', val: (stats?.conAsistencia ?? 0).toLocaleString(), color: 'text-green-400', sub: `${stats?.porcentajeAsistencia ?? 0}% de asistencia real`, icon: CheckCircle2 },
                                { label: 'Sin Asistencia', val: (stats?.sinAsistencia ?? 0).toLocaleString(), color: 'text-red-400', sub: 'Pendientes por validar', icon: Clock },
                                { label: 'Completados (Muestra)', val: totalCompletos.toLocaleString(), color: 'text-blue-400', sub: 'De los últimos 100 cargados', icon: Trophy },
                            ].map(s => (
                                <div key={s.label} className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.label}</p>
                                        <s.icon className={`w-4 h-4 ${s.color.split(' ')[0]}`} />
                                    </div>
                                    <p className={`text-4xl font-black ${s.color}`}>{s.val}</p>
                                    <div className="space-y-1.5">
                                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/50 rounded-full transition-all duration-1000" style={{ width: stats && s.label === 'Con Asistencia' ? `${stats.porcentajeAsistencia}%` : '100%' }} />
                                        </div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-70 tracking-tighter">{s.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!statsLoading && extraFieldsStats.length > 0 && (
                        <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center gap-3 border-b border-border pb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">Análisis Demográfico Global</h2>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Basado en los {insTotal.toLocaleString()} inscritos</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {extraFieldsStats.map((stat: any) => (
                                    <div key={stat.id} className="group bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500">
                                        <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                            <div>
                                                <h4 className="font-black text-sm uppercase text-foreground tracking-tight group-hover:text-primary transition-colors">{stat.label}</h4>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Frecuencia de respuestas</p>
                                            </div>
                                            <span className="text-[9px] font-black bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full uppercase tracking-tighter">
                                                {stat.tipo?.replace('_', ' ') || 'Dato'}
                                            </span>
                                        </div>

                                        <div className="h-72 w-full relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                {stat.chartData.length <= 5 ? (
                                                    <PieChart>
                                                        <Pie
                                                            data={stat.chartData}
                                                            cx="45%"
                                                            cy="50%"
                                                            innerRadius={65}
                                                            outerRadius={85}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {stat.chartData.map((_: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip
                                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '11px', color: '#fff' }}
                                                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                                        />
                                                        <Legend
                                                            layout="vertical"
                                                            verticalAlign="middle"
                                                            align="right"
                                                            iconType="circle"
                                                            formatter={(val) => <span className="text-[10px] font-black uppercase text-muted-foreground ml-1">{val}</span>}
                                                        />
                                                    </PieChart>
                                                ) : (
                                                    <BarChart data={stat.chartData.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                                                        <XAxis type="number" hide />
                                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: '900', fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                        <RechartsTooltip
                                                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                                                        />
                                                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                                                            {stat.chartData.map((_: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!statsLoading && !stats && (
                        <div className="text-center py-8">
                            <button onClick={loadStats} className="h-12 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase hover:opacity-90 flex items-center gap-2 mx-auto">
                                <BarChart3 className="w-4 h-4" /> Cargar Estadísticas
                            </button>
                        </div>
                    )}

                    {cuestionarios.map(c => (
                        <div key={c.id} className="group bg-card border border-border rounded-[2rem] p-6 space-y-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500">
                            <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                <h3 className="font-black text-foreground text-xl uppercase tracking-tight group-hover:text-primary transition-colors">{c.titulo}</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                        c.estado === 'activo' ? 'bg-green-500/10 text-green-500' : 
                                        c.estado === 'prologa' ? 'bg-blue-500/10 text-blue-500' :
                                        'bg-red-500/10 text-red-500'
                                    }`}>
                                        {c.estado === 'activo' ? 'Publicado' : 
                                         c.estado === 'prologa' ? 'Próximamente' :
                                         'Borrador'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm">
                                <div className="space-y-3 p-4 rounded-2xl bg-muted/20 border border-border/40">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Trophy className="w-3 h-3 text-amber-500" /> Información de Logro
                                    </p>
                                    <div className="space-y-2">
                                        <p className="flex justify-between items-center"><span className="text-muted-foreground font-medium">Puntos máximos:</span> <span className="font-black text-foreground">{c.puntosMaximos || 'Auto-calculado'}</span></p>
                                        <p className="flex justify-between items-center"><span className="text-primary font-medium">Nota Mínima (Aprobación):</span> <span className="font-black text-primary">{c.puntajeMinimo || 0} pts</span></p>
                                        <p className="flex justify-between items-center"><span className="text-muted-foreground font-medium">Tiempo límite:</span> <span className="font-black text-foreground">{c.tiempoMaximo ? `${c.tiempoMaximo} min` : 'Sin límite'}</span></p>
                                        <p className="flex justify-between items-center"><span className="text-muted-foreground font-medium">Límite Intentos:</span> <span className="font-black text-foreground">{c.limiteIntentos || 'Ilimitado'}</span></p>
                                    </div>
                                </div>

                                <div className="space-y-3 p-4 rounded-2xl bg-muted/20 border border-border/40">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Settings2 className="w-3 h-3 text-blue-500" /> Reglas de Negocio
                                    </p>
                                    <div className="flex flex-wrap gap-2 py-1">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${c.esObligatorio ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border/50'}`}>
                                            {c.esObligatorio ? 'Requerido' : 'Opcional'}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${c.esEvaluativo ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-muted text-muted-foreground border-border/50'}`}>
                                            {c.esEvaluativo ? 'Puntuable' : 'Informativo'}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${c.esAleatorio ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-muted text-muted-foreground border-border/50'}`}>
                                            {c.esAleatorio ? 'Mezclado' : 'Orden Fijo'}
                                        </span>
                                    </div>
                                    <div className="space-y-2 border-t border-border/40 pt-2">
                                        <p className="flex justify-between items-center"><span className="text-muted-foreground font-medium">Preguntas:</span> <span className="font-black text-foreground">{c.preguntas?.length || 0}</span></p>
                                        <p className="flex justify-between items-center"><span className="text-muted-foreground font-medium">Cant. a mostrar:</span> <span className="font-black text-primary">{c.cantidadPreguntas || 'Todas'}</span></p>
                                    </div>
                                </div>

                                <div className="space-y-3 p-4 rounded-2xl bg-muted/20 border border-border/40">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Play className="w-3 h-3 text-red-500" /> Prerrequisito Visual
                                    </p>
                                    {c.urlVideo ? (
                                        <div className="mt-1 p-3 rounded-xl bg-card border border-border/60 shadow-inner">
                                            <p className="text-[11px] font-black text-foreground truncate max-w-full flex items-center gap-2">
                                                <ExternalLink className="w-3 h-3 text-primary" /> {c.urlVideo}
                                            </p>
                                            <p className="text-[9px] text-muted-foreground font-medium mt-2 leading-relaxed">
                                                El participante <span className="text-red-500 font-bold">DEBE</span> visualizar este contenido para habilitar su participación.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="h-20 flex items-center justify-center rounded-xl border border-dashed border-border/60">
                                            <p className="text-xs text-muted-foreground italic font-medium">Sin video previo requerido</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                </div>
            )}

            {/* ── MODAL CUESTIONARIO ── */}
            <Modal isOpen={modalCues} onClose={() => setModalCues(false)} title={editingCues ? 'Editar Cuestionario' : 'Nuevo Cuestionario'}>
                <div className="space-y-4">
                    <input placeholder="Título del cuestionario" value={formCues.titulo}
                        onChange={e => setFormCues(p => ({ ...p, titulo: e.target.value }))}
                        className="w-full h-12 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all" />
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Descripción del Cuestionario</label>
                        <RichTextEditor
                            value={formCues.descripcion}
                            onChange={val => setFormCues(p => ({ ...p, descripcion: val }))}
                            placeholder="Escribe la descripción, instrucciones o introducción..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase">Fecha inicio</label>
                            <input type="datetime-local" value={formCues.fechaInicio}
                                onChange={e => setFormCues(p => ({ ...p, fechaInicio: e.target.value }))}
                                className="w-full h-12 px-4 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-sm text-foreground transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase">Fecha fin</label>
                            <input type="datetime-local" value={formCues.fechaFin}
                                onChange={e => setFormCues(p => ({ ...p, fechaFin: e.target.value }))}
                                className="w-full h-12 px-4 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-sm text-foreground transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase">Tiempo máximo (min)</label>
                            <input type="number" placeholder="Ej: 30" value={formCues.tiempoMaximo}
                                onChange={e => setFormCues(p => ({ ...p, tiempoMaximo: e.target.value }))}
                                className="w-full h-12 px-4 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-sm text-foreground transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase">Puntos máximos</label>
                            <input type="number" placeholder="Auto-calculado" value={formCues.puntosMaximos}
                                onChange={e => setFormCues(p => ({ ...p, puntosMaximos: e.target.value }))}
                                className="w-full h-12 px-4 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-sm text-foreground transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-primary uppercase">Nota Mínima (Para aprobar)</label>
                            <input type="number" placeholder="Ej: 51" value={formCues.puntajeMinimo}
                                onChange={e => setFormCues(p => ({ ...p, puntajeMinimo: e.target.value }))}
                                className="w-full h-12 px-4 rounded-2xl bg-primary/5 border-2 border-primary/20 focus:border-primary outline-none text-sm font-black text-primary transition-all" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase">Video de YouTube (Prerrequisito)</label>
                        <input type="text" placeholder="https://youtu.be/... o ID del video" value={formCues.urlVideo}
                            onChange={e => setFormCues(p => ({ ...p, urlVideo: e.target.value }))}
                            className="w-full h-12 px-4 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-sm text-foreground transition-all" />
                        <p className="text-[9px] text-muted-foreground ml-2">Si se define, el participante DEBE ver el video para habilitar las preguntas.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase">Cant. a Mostrar</label>
                            <input type="number" placeholder="Vacío = todas" value={formCues.cantidadPreguntas}
                                onChange={e => setFormCues(p => ({ ...p, cantidadPreguntas: e.target.value }))}
                                className="w-full h-12 px-4 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-sm text-foreground transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase">Límite Intentos</label>
                            <input type="number" placeholder="Vacío = ilimitado" value={formCues.limiteIntentos}
                                onChange={e => setFormCues(p => ({ ...p, limiteIntentos: e.target.value }))}
                                className="w-full h-12 px-4 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-sm text-foreground transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <label className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border-2 border-transparent hover:border-primary/30 cursor-pointer transition-all">
                            <input type="checkbox" checked={formCues.esObligatorio} onChange={e => setFormCues(p => ({ ...p, esObligatorio: e.target.checked }))} className="w-5 h-5 rounded accent-primary" />
                            <div className="space-y-0.5">
                                <p className="text-xs font-black uppercase text-foreground">Obligatorio</p>
                                <p className="text-[9px] text-muted-foreground">Requerido para aprobación</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border-2 border-transparent hover:border-primary/30 cursor-pointer transition-all">
                            <input type="checkbox" checked={formCues.esEvaluativo} onChange={e => setFormCues(p => ({ ...p, esEvaluativo: e.target.checked }))} className="w-5 h-5 rounded accent-primary" />
                            <div className="space-y-0.5">
                                <p className="text-xs font-black uppercase text-foreground">Puntuable</p>
                                <p className="text-[9px] text-muted-foreground">Genera nota y puntaje</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border-2 border-transparent hover:border-primary/30 cursor-pointer transition-all">
                            <input type="checkbox" checked={formCues.esAleatorio} onChange={e => setFormCues(p => ({ ...p, esAleatorio: e.target.checked }))} className="w-5 h-5 rounded accent-primary" />
                            <div className="space-y-0.5">
                                <p className="text-xs font-black uppercase text-foreground">Aleatorio</p>
                                <p className="text-[9px] text-muted-foreground">Preguntas y opciones mezcladas</p>
                            </div>
                        </label>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Orden aparición</label>
                            <input type="number" value={formCues.orden} onChange={e => setFormCues(p => ({ ...p, orden: parseInt(e.target.value) || 1 }))}
                                className="w-full h-12 px-4 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all text-sm" />
                        </div>
                    </div>

                    <select value={formCues.estado} onChange={e => setFormCues(p => ({ ...p, estado: e.target.value }))}
                        className="w-full h-12 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-sm font-bold text-foreground transition-all">
                        <option value="activo">Activo</option>
                        <option value="prologa">Prólogo (Próximamente)</option>
                        <option value="inactivo">Inactivo (Borrador)</option>
                    </select>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setModalCues(false)} className="flex-1 h-12 rounded-2xl bg-muted text-muted-foreground font-black text-xs uppercase hover:text-foreground transition-all">Cancelar</button>
                        <button onClick={saveCuestionario} disabled={!formCues.titulo || submitting}
                            className="flex-1 h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Guardar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── MODAL PREGUNTA ── */}
            <Modal isOpen={modalPregunta} onClose={() => setModalPregunta(false)} title={editingPregunta ? 'Editar Pregunta' : 'Nueva Pregunta'} size="lg">
                <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-2">Texto de la Pregunta</label>
                        <RichTextEditor
                            value={formPregunta.texto}
                            onChange={val => setFormPregunta(p => ({ ...p, texto: val }))}
                            placeholder="Escribe la pregunta aquí..."
                            className="min-h-[150px]"
                        />
                    </div>

                    {/* Tipo */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2 block">
                            Naturaleza de la Pregunta
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {TIPOS_PREGUNTA.map(t => (
                                <button key={t.value} onClick={() => changeTipoPregunta(t.value)}
                                    className={`p-4 rounded-[1.5rem] border-2 text-left transition-all flex items-start gap-4 ${formPregunta.tipo === t.value ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${formPregunta.tipo === t.value ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                        <t.icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1 mt-0.5">
                                        <p className={`font-black uppercase text-[11px] tracking-wide ${formPregunta.tipo === t.value ? 'text-primary' : 'text-foreground'}`}>{t.label}</p>
                                        <p className="text-[10px] text-muted-foreground leading-tight">{t.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Puntos */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase">Puntos</label>
                            <input type="number" min={1} value={formPregunta.puntos}
                                onChange={e => setFormPregunta(p => ({ ...p, puntos: parseInt(e.target.value) || 1 }))}
                                className="w-full h-12 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-sm font-black text-foreground transition-all" />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer mt-5">
                            <input type="checkbox" checked={formPregunta.obligatorio}
                                onChange={e => setFormPregunta(p => ({ ...p, obligatorio: e.target.checked }))}
                                className="w-5 h-5 rounded accent-primary cursor-pointer" />
                            <span className="text-sm font-bold text-foreground">Obligatoria</span>
                        </label>
                    </div>

                    {/* Opciones */}
                    {formPregunta.tipo !== 'TEXTO' && (
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                                    Posibles Respuestas
                                </label>
                                {formPregunta.tipo !== 'TRUE_FALSE' && (
                                    <button onClick={() => setFormPregunta(p => ({ ...p, opciones: [...p.opciones, { texto: '', esCorrecta: false }] }))}
                                        className="flex items-center gap-1.5 h-8 px-4 rounded-[1rem] bg-primary text-white text-[11px] font-black uppercase tracking-wider hover:bg-primary-600 hover:scale-105 shadow-md shadow-primary/20 transition-all">
                                        <Plus className="w-3.5 h-3.5" /> Añadir Opción
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {formPregunta.opciones.map((opt, i) => {
                                    const isCorrect = opt.esCorrecta;
                                    return (
                                        <div key={i} className={`flex items-center gap-3 p-3 rounded-[1.25rem] border-2 transition-all group ${isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-transparent bg-muted/40 hover:bg-muted/60'}`}>

                                            {/* Selector de Correcta */}
                                            <button
                                                onClick={() => {
                                                    const newOpts = formPregunta.opciones.map((o, j) => ({
                                                        ...o,
                                                        esCorrecta: formPregunta.tipo === 'MULTIPLE' ? (j === i ? !o.esCorrecta : o.esCorrecta) : j === i
                                                    }));
                                                    setFormPregunta(p => ({ ...p, opciones: newOpts }));
                                                }}
                                                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCorrect ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-background border-2 border-border text-muted-foreground hover:border-green-500/50 hover:text-green-500'}`}
                                                title="Marcar como respuesta correcta"
                                            >
                                                <CheckCircle2 className={`w-5 h-5 ${isCorrect ? 'opacity-100' : 'opacity-30'}`} />
                                            </button>

                                            {/* Input de Texto */}
                                            <input
                                                placeholder={`Escribe la opción ${i + 1}...`}
                                                value={opt.texto}
                                                onChange={e => { const o = [...formPregunta.opciones]; o[i] = { ...o[i], texto: e.target.value }; setFormPregunta(p => ({ ...p, opciones: o })); }}
                                                disabled={formPregunta.tipo === 'TRUE_FALSE'}
                                                className={`flex-1 h-10 bg-transparent outline-none text-sm font-bold transition-all disabled:opacity-50 ${isCorrect ? 'text-green-700 dark:text-green-400 placeholder:text-green-500/50' : 'text-foreground placeholder:text-muted-foreground'}`}
                                            />

                                            {/* Botón Eliminar */}
                                            {formPregunta.tipo !== 'TRUE_FALSE' && formPregunta.opciones.length > 2 && (
                                                <button onClick={() => setFormPregunta(p => ({ ...p, opciones: p.opciones.filter((_, j) => j !== i) }))}
                                                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shrink-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2 px-1">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                    Presiona el icono <CheckCircle2 className="w-3 h-3 inline pb-0.5" /> para marcar la(s) respuesta(s) correcta(s)
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setModalPregunta(false)} className="flex-1 h-12 rounded-2xl bg-muted text-muted-foreground font-black text-xs uppercase hover:text-foreground transition-all">Cancelar</button>
                        <button onClick={savePregunta} disabled={!formPregunta.texto || submitting}
                            className="flex-1 h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Guardar Pregunta
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmDeletePregunta.isOpen}
                onClose={() => setConfirmDeletePregunta({ ...confirmDeletePregunta, isOpen: false })}
                onConfirm={confirmDeletePreguntaAction}
                title="Eliminar Pregunta"
                description="¿Estás seguro de eliminar esta pregunta? Esta acción no se puede deshacer y los participantes no podrán visualizarla."
                loading={confirmDeletePregunta.loading}
            />
            <Modal isOpen={modalQR} onClose={() => setModalQR(false)} title="QR DE ASISTENCIA">
                <div className="p-6 space-y-8 flex flex-col items-center">
                    <div className="text-center space-y-2">
                        <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Escanea para registrar asistencia</p>
                        <h3 className="text-xl font-black uppercase text-foreground leading-tight">{evento?.nombre}</h3>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            <span className="text-[10px] font-black uppercase tracking-widest">Código:</span>
                            <span className="font-black font-mono text-sm tracking-widest">{evento?.codigoAsistencia}</span>
                        </div>
                    </div>

                    <div className="p-8 bg-white rounded-[3rem] shadow-2xl shadow-primary/10 border-4 border-primary/10 relative group">
                        <QRCodeCanvas
                            id="qr-attendance-canvas"
                            value={`${window.location.origin}/evento/${evento?.codigo}?step=asistencia&code=${evento?.codigoAsistencia}`}
                            size={280}
                            level="H"
                            includeMargin={false}
                        />
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[2.5rem]" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <button
                            onClick={() => {
                                const canvas = document.getElementById('qr-attendance-canvas') as HTMLCanvasElement;
                                if (canvas) {
                                    const link = document.createElement('a');
                                    link.download = `QR_Asistencia_${evento?.codigo}.png`;
                                    link.href = canvas.toDataURL();
                                    link.click();
                                    toast.success('Imagen guardada');
                                }
                            }}
                            className="h-14 rounded-2xl bg-muted text-muted-foreground font-black text-xs uppercase hover:text-foreground transition-all flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Bajar Imagen
                        </button>
                        <button
                            onClick={async () => {
                                const canvas = document.getElementById('qr-attendance-canvas') as HTMLCanvasElement;
                                if (!canvas) return;

                                const qrData = canvas.toDataURL('image/png');
                                const doc = new jsPDF();
                                const pageWidth = doc.internal.pageSize.getWidth();

                                // Diseño del PDF
                                doc.setFillColor(99, 102, 241); // Color primary
                                doc.rect(0, 0, pageWidth, 40, 'F');

                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(24);
                                doc.setFont('helvetica', 'bold');
                                doc.text('REGISTRO DE ASISTENCIA', pageWidth / 2, 20, { align: 'center' });
                                doc.setFontSize(10);
                                doc.text('SISTEMA PROFE BOLIVIA', pageWidth / 2, 30, { align: 'center' });

                                doc.setTextColor(40, 44, 52);
                                doc.setFontSize(18);
                                doc.text(evento?.nombre?.toLocaleUpperCase(), pageWidth / 2, 60, { align: 'center', maxWidth: 170 });

                                // QR
                                doc.addImage(qrData, 'PNG', (pageWidth - 120) / 2, 80, 120, 120);

                                doc.setFontSize(14);
                                doc.text(`CÓDIGO: ${evento?.codigoAsistencia}`, pageWidth / 2, 215, { align: 'center' });

                                doc.setFontSize(10);
                                doc.setFont('helvetica', 'normal');
                                doc.setTextColor(100, 116, 139);
                                doc.text('Escanea este código QR con tu celular para registrar tu asistencia', pageWidth / 2, 230, { align: 'center' });
                                doc.text('en la plataforma oficial del evento.', pageWidth / 2, 235, { align: 'center' });

                                doc.setFontSize(8);
                                doc.text(`Generado el: ${new Date().toLocaleString()}`, pageWidth / 2, 280, { align: 'center' });

                                doc.save(`QR_Asistencia_${evento?.codigo}.pdf`);
                                toast.success('PDF generado con éxito');
                            }}
                            className="h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                        >
                            <FileText className="w-4 h-4" /> Imprimir PDF
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

