'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Plus, Edit2, Trash2, ChevronLeft, ChevronRight,
    Users, CheckCircle2, Clock, Hash, Eye, Download, Search,
    ToggleLeft, ToggleRight, Copy, ExternalLink, AlertCircle,
    BarChart3, RefreshCw, Timer, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/Modal';

const TIPOS_PREGUNTA = [
    { value: 'SINGLE', label: '⚪ Selección única', desc: 'Una sola respuesta correcta' },
    { value: 'MULTIPLE', label: '☑️ Selección múltiple', desc: 'Varias respuestas correctas' },
    { value: 'TRUE_FALSE', label: '✅ Verdadero / Falso', desc: '2 opciones: Verdadero o Falso' },
    { value: 'TEXTO', label: '📝 Respuesta abierta', desc: 'El participante escribe libremente' },
];

export default function EventoOperativoPage() {
    const params = useParams();
    const router = useRouter();
    const eventoId = params.eventoId as string;

    const [evento, setEvento] = useState<any>(null);
    const [inscripciones, setInscripciones] = useState<any[]>([]);
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

    // Forms
    const [formCues, setFormCues] = useState({ titulo: '', descripcion: '', fechaInicio: '', fechaFin: '', tiempoMaximo: '', puntosMaximos: '', estado: 'activo' });
    const [formPregunta, setFormPregunta] = useState({ texto: '', tipo: 'SINGLE', puntos: 1, obligatorio: true, opciones: [{ texto: '', esCorrecta: false }, { texto: '', esCorrecta: false }] });

    useEffect(() => { loadData(); }, [eventoId]);
    useEffect(() => { if (cuestionarioActivo) loadPreguntas(cuestionarioActivo.id); }, [cuestionarioActivo]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [evtRes, insRes] = await Promise.all([
                api.get(`/eventos/${eventoId}`),
                api.get('/eventos-inscripciones', { params: { eventoId } }),
            ]);
            setEvento(evtRes.data);
            setInscripciones(Array.isArray(insRes.data) ? insRes.data : []);
            // Cargar cuestionarios del evento
            const cuesRes = await api.get('/evento-cuestionarios', { params: { eventoId } });
            const cues = Array.isArray(cuesRes.data) ? cuesRes.data : [];
            setCuestionarios(cues);
            if (cues.length > 0 && !cuestionarioActivo) setCuestionarioActivo(cues[0]);
        } catch (e) {
            // fallback
            try {
                const evtRes = await api.get(`/eventos/${eventoId}`);
                setEvento(evtRes.data);
                const cuests = evtRes.data?.cuestionarios || [];
                setCuestionarios(cuests);
                if (cuests.length > 0) setCuestionarioActivo(cuests[0]);
            } catch { toast.error('Error cargando el evento'); }
        } finally { setLoading(false); }
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
        setFormCues({ titulo: '', descripcion: '', fechaInicio: '', fechaFin: '', tiempoMaximo: '', puntosMaximos: '', estado: 'activo' });
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

    const deletePregunta = async (id: string) => {
        if (!confirm('¿Eliminar pregunta?')) return;
        try {
            await api.delete(`/evento-preguntas/${id}`);
            toast.success('Pregunta eliminada');
            loadPreguntas(cuestionarioActivo.id);
        } catch { toast.error('Error eliminando pregunta'); }
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
            const nuevoCode = codigoAsistencia || Math.random().toString(36).substring(2, 8).toUpperCase();
            await api.patch(`/eventos/${eventoId}`, { codigoAsistencia: evento?.codigoAsistencia ? null : nuevoCode });
            toast.success(evento?.codigoAsistencia ? 'Código de asistencia desactivado' : `Código activado: ${nuevoCode}`);
            setCodigoAsistencia(nuevoCode);
            loadData();
        } catch { toast.error('Error actualizando código'); }
    };

    const filteredInscripciones = inscripciones.filter(i =>
        !search || i.persona?.nombre1?.toLowerCase().includes(search.toLowerCase()) ||
        i.persona?.apellido1?.toLowerCase().includes(search.toLowerCase()) ||
        String(i.persona?.ci || '').includes(search)
    );

    const marcarAsistencia = async (inscripcionId: string, valor: boolean) => {
        try {
            await api.patch(`/eventos-inscripciones/${inscripcionId}`, { asistencia: valor });
            setInscripciones(prev => prev.map(i => i.id === inscripcionId ? { ...i, asistencia: valor } : i));
            toast.success(valor ? 'Asistencia registrada' : 'Asistencia removida');
        } catch { toast.error('Error'); }
    };

    const exportarCSV = () => {
        const rows = [['CI', 'Nombre', 'Apellido', 'Correo', 'Asistencia']];
        filteredInscripciones.forEach(i => {
            rows.push([i.persona?.ci, i.persona?.nombre1, i.persona?.apellido1, i.persona?.correo, i.asistencia ? 'Sí' : 'No']);
        });
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `inscripciones_${evento?.nombre}.csv`; a.click();
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const totalInscritos = inscripciones.length;
    const totalAsistencia = inscripciones.filter(i => i.asistencia).length;

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
                    <a href={`/eventos/${evento?.codigo || eventoId}`} target="_blank"
                        className="flex items-center gap-2 h-10 px-4 rounded-xl bg-card border border-border text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all">
                        <ExternalLink className="w-3.5 h-3.5" /> Ver Pública
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/eventos/${evento?.codigo || eventoId}`); toast.success('URL copiada'); }}
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
                    { label: 'Preguntas', val: preguntas.length, icon: Hash, color: 'text-purple-400' },
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
                        <button onClick={() => { navigator.clipboard.writeText(evento.codigoAsistencia); toast.success('Código copiado'); }}
                            className="h-10 px-4 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition-all flex items-center gap-2">
                            <Copy className="w-3.5 h-3.5" /> Copiar
                        </button>
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
                    { id: 'inscripciones', label: 'Inscripciones', icon: Users },
                    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id as any)}
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
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase text-muted-foreground">Cuestionarios</h3>
                            <button onClick={openNewCues} className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary text-white text-xs font-black transition-all hover:opacity-90">
                                <Plus className="w-3.5 h-3.5" /> Nuevo
                            </button>
                        </div>
                        {cuestionarios.length === 0 && <p className="text-sm text-muted-foreground">Sin cuestionarios. Crea uno.</p>}
                        {cuestionarios.map(c => (
                            <div key={c.id} onClick={() => setCuestionarioActivo(c)}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${cuestionarioActivo?.id === c.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'}`}>
                                <div className="flex items-center justify-between">
                                    <p className="font-black text-sm text-foreground truncate">{c.titulo}</p>
                                    <button onClick={e => { e.stopPropagation(); openEditCues(c); }} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:text-primary">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${c.estado === 'activo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {c.estado}
                                    </span>
                                    {c.tiempoMaximo && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" />{c.tiempoMaximo} min</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Preguntas del cuestionario */}
                    <div className="lg:col-span-2 space-y-4">
                        {cuestionarioActivo && (
                            <>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase text-muted-foreground">Preguntas — {cuestionarioActivo.titulo}</h3>
                                    <button onClick={openNewPregunta} className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary text-white text-xs font-black transition-all hover:opacity-90">
                                        <Plus className="w-3.5 h-3.5" /> Agregar Pregunta
                                    </button>
                                </div>

                                {preguntas.length === 0 && <p className="text-sm text-muted-foreground">Sin preguntas aún.</p>}

                                <AnimatePresence>
                                    {preguntas.map((p, idx) => (
                                        <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="bg-card border border-border rounded-2xl p-5 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                                                <div className="flex-1">
                                                    <p className="font-bold text-foreground">{p.texto}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground">{TIPOS_PREGUNTA.find(t => t.value === p.tipo)?.label || p.tipo}</span>
                                                        <span className="text-[10px] text-muted-foreground">{p.puntos || 1} pt</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => openEditPregunta(p)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:text-primary">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => deletePregunta(p.id)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:text-red-500">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            {p.opciones?.length > 0 && (
                                                <div className="ml-10 grid grid-cols-2 gap-2">
                                                    {p.opciones.map((o: any) => (
                                                        <div key={o.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${o.esCorrecta ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-muted text-muted-foreground'}`}>
                                                            {o.esCorrecta && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                            {o.texto}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input placeholder="Buscar por CI, nombre..." value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border outline-none text-sm font-bold focus:border-primary transition-all" />
                        </div>
                        <button onClick={exportarCSV} className="h-12 px-5 rounded-2xl bg-card border border-border text-xs font-black text-muted-foreground hover:text-foreground flex items-center gap-2 transition-all">
                            <Download className="w-4 h-4" /> Exportar CSV
                        </button>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left p-4 text-[10px] font-black uppercase text-muted-foreground">Participante</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase text-muted-foreground">CI</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase text-muted-foreground">Correo</th>
                                    <th className="text-center p-4 text-[10px] font-black uppercase text-muted-foreground">Asistencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInscripciones.length === 0 && (
                                    <tr><td colSpan={4} className="text-center p-8 text-muted-foreground text-sm">Sin inscripciones</td></tr>
                                )}
                                {filteredInscripciones.map(i => (
                                    <tr key={i.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                        <td className="p-4 font-bold text-foreground uppercase">
                                            {i.persona?.nombre1} {i.persona?.apellido1}
                                        </td>
                                        <td className="p-4 font-mono text-foreground">{String(i.persona?.ci || '')}</td>
                                        <td className="p-4 text-muted-foreground">{i.persona?.correo}</td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => marcarAsistencia(i.id, !i.asistencia)}
                                                className={`inline-flex items-center gap-2 h-8 px-4 rounded-xl text-xs font-black transition-all ${i.asistencia ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}>
                                                {i.asistencia ? <><CheckCircle2 className="w-3.5 h-3.5" /> Presente</> : 'Marcar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TAB ESTADÍSTICAS ── */}
            {tab === 'estadisticas' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Tasa de asistencia</p>
                            <p className="text-4xl font-black text-foreground">
                                {totalInscritos ? Math.round((totalAsistencia / totalInscritos) * 100) : 0}%
                            </p>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${totalInscritos ? (totalAsistencia / totalInscritos) * 100 : 0}%` }} />
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Inscritos</p>
                            <p className="text-4xl font-black text-foreground">{totalInscritos}</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Confirmaron asistencia</p>
                            <p className="text-4xl font-black text-green-400">{totalAsistencia}</p>
                        </div>
                    </div>

                    {cuestionarios.map(c => (
                        <div key={c.id} className="bg-card border border-border rounded-2xl p-6">
                            <h3 className="font-black text-foreground mb-4">{c.titulo}</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-muted-foreground">Pts máximos:</span> <span className="font-black text-foreground">{c.puntosMaximos || 'Auto'}</span></div>
                                <div><span className="text-muted-foreground">Tiempo límite:</span> <span className="font-black text-foreground">{c.tiempoMaximo ? `${c.tiempoMaximo} min` : 'Sin límite'}</span></div>
                                <div><span className="text-muted-foreground">Preguntas:</span> <span className="font-black text-foreground">{c.preguntas?.length || 0}</span></div>
                                <div><span className="text-muted-foreground">Estado:</span> <span className={`font-black ${c.estado === 'activo' ? 'text-green-400' : 'text-red-400'}`}>{c.estado}</span></div>
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
                    <textarea placeholder="Descripción..." value={formCues.descripcion}
                        onChange={e => setFormCues(p => ({ ...p, descripcion: e.target.value }))}
                        className="w-full p-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-foreground resize-none h-20 transition-all" />
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
                    </div>
                    <select value={formCues.estado} onChange={e => setFormCues(p => ({ ...p, estado: e.target.value }))}
                        className="w-full h-12 px-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-sm font-bold text-foreground transition-all">
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
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
                    <textarea placeholder="Texto de la pregunta..." value={formPregunta.texto}
                        onChange={e => setFormPregunta(p => ({ ...p, texto: e.target.value }))}
                        className="w-full p-5 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-foreground font-bold resize-none h-24 transition-all" />

                    {/* Tipo */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase">Tipo de pregunta</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TIPOS_PREGUNTA.map(t => (
                                <button key={t.value} onClick={() => changeTipoPregunta(t.value)}
                                    className={`p-3 rounded-2xl border-2 text-left transition-all ${formPregunta.tipo === t.value ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}>
                                    <p className="font-black text-sm text-foreground">{t.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{t.desc}</p>
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
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-muted-foreground uppercase">Opciones</label>
                                {formPregunta.tipo !== 'TRUE_FALSE' && (
                                    <button onClick={() => setFormPregunta(p => ({ ...p, opciones: [...p.opciones, { texto: '', esCorrecta: false }] }))}
                                        className="flex items-center gap-1 h-7 px-3 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all">
                                        <Plus className="w-3 h-3" /> Agregar
                                    </button>
                                )}
                            </div>
                            {formPregunta.opciones.map((opt, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <input type={formPregunta.tipo === 'MULTIPLE' ? 'checkbox' : 'radio'}
                                        checked={opt.esCorrecta}
                                        onChange={() => {
                                            const newOpts = formPregunta.opciones.map((o, j) => ({
                                                ...o,
                                                esCorrecta: formPregunta.tipo === 'MULTIPLE' ? (j === i ? !o.esCorrecta : o.esCorrecta) : j === i
                                            }));
                                            setFormPregunta(p => ({ ...p, opciones: newOpts }));
                                        }}
                                        name="opcion-correcta"
                                        className="w-5 h-5 accent-green-500 cursor-pointer shrink-0" />
                                    <input placeholder={`Opción ${i + 1}`} value={opt.texto}
                                        onChange={e => { const o = [...formPregunta.opciones]; o[i] = { ...o[i], texto: e.target.value }; setFormPregunta(p => ({ ...p, opciones: o })); }}
                                        disabled={formPregunta.tipo === 'TRUE_FALSE'}
                                        className="flex-1 h-10 px-4 rounded-xl bg-muted/40 border-2 border-transparent focus:border-primary outline-none text-sm text-foreground font-bold transition-all disabled:opacity-50" />
                                    {formPregunta.tipo !== 'TRUE_FALSE' && formPregunta.opciones.length > 2 && (
                                        <button onClick={() => setFormPregunta(p => ({ ...p, opciones: p.opciones.filter((_, j) => j !== i) }))}
                                            className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <p className="text-[10px] text-muted-foreground">Marca el círculo/checkbox para indicar la respuesta correcta</p>
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
        </div>
    );
}
