'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/Modal';
import { Card } from '@/components/ui/Card';
import { inscripcionService } from '@/services/inscripcionService';
import {
    Users,
    CheckCircle2,
    XCircle,
    Image as ImageIcon,
    ExternalLink,
    Check,
    X,
    Loader2,
    Search,
    Printer,
    FileCheck,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    DollarSign,
    ChevronRight,
    ArrowRightCircle,
    Fingerprint,
    Building2,
    Calendar,
    Stamp,
    Download
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { pdf, PDFDownloadLink } from '@react-pdf/renderer';
import { InscripcionPDF } from './InscripcionPDF';

interface InscritosModalProps {
    isOpen: boolean;
    onClose: () => void;
    oferta: any;
}

export function InscritosModal({ isOpen, onClose, oferta }: InscritosModalProps) {
    const [inscritos, setInscritos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIns, setSelectedIns] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'perfil' | 'pagos'>('perfil');

    useEffect(() => {
        if (isOpen && oferta) {
            loadInscritos();
        } else {
            setSelectedIns(null);
        }
    }, [isOpen, oferta]);

    const loadInscritos = async () => {
        setLoading(true);
        try {
            const data = await inscripcionService.getByOferta(oferta.id);
            setInscritos(data || []);
            if (data?.length > 0 && !selectedIns) {
                setSelectedIns(data[0]);
            }
        } catch (error) {
            toast.error('Error al cargar inscritos');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmBaucher = async (baucherId: string, confirmed: boolean) => {
        try {
            await inscripcionService.confirmBaucher(baucherId, confirmed);
            toast.success(confirmed ? 'Pago verificado correctamente' : 'Pago rechazado');
            loadInscritos();
        } catch (error) {
            toast.error('Error al procesar el estado del pago');
        }
    };

    const handleApproveInscripcion = async (insId: string) => {
        try {
            await inscripcionService.confirmInscripcion(insId);
            toast.success('Inscripción formalizada exitosamente');
            loadInscritos();
        } catch (error) {
            toast.error('Error al formalizar inscripción');
        }
    };

    const filtered = useMemo(() => {
        return inscritos.filter(i =>
            i.persona?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.persona?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.persona?.nroDocumento?.includes(searchTerm)
        );
    }, [inscritos, searchTerm]);

    const stats = useMemo(() => {
        const total = inscritos.length;
        const inscritosCount = inscritos.filter(i => i.estadoInscripcion?.nombre === 'INSCRITO').length;
        const totalRecaudado = inscritos.reduce((sum, i) => {
            const pagos = (i.baucher || []).reduce((s: number, b: any) => s + (b.confirmado ? Number(b.monto) : 0), 0);
            return sum + pagos;
        }, 0);
        return { total, inscritosCount, totalRecaudado };
    }, [inscritos]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={undefined} // Correcting null to undefined
            size="full"
        >
            <div className="flex flex-col h-[85vh] overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* Custom Premium Header */}
                <div className="p-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-1">Centro de Gestión Académica</p>
                            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white uppercase italic">
                                {oferta?.nombre} <span className="text-indigo-600">[{oferta?.codigo}]</span>
                            </h2>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total</p>
                            <p className="text-lg font-black text-slate-800 dark:text-white">{stats.total}</p>
                        </div>
                        <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Inscritos</p>
                            <p className="text-lg font-black text-emerald-600">{stats.inscritosCount}</p>
                        </div>
                        <div className="px-6 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Recaudado</p>
                            <p className="text-lg font-black text-indigo-600">Bs. {stats.totalRecaudado.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Lateral List - Participant Cards */}
                    <div className="w-full md:w-[380px] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900/50">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar participante..."
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:border-indigo-600 text-xs font-bold transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                ))
                            ) : filtered.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin registros encontrados</p>
                                </div>
                            ) : (
                                filtered.map(i => (
                                    <button
                                        key={i.id}
                                        onClick={() => setSelectedIns(i)}
                                        className={cn(
                                            "w-full p-4 rounded-[2rem] border transition-all text-left relative group",
                                            selectedIns?.id === i.id
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm relative overflow-hidden",
                                                selectedIns?.id === i.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 text-indigo-600"
                                            )}>
                                                {i.persona?.nombre?.[0]}{i.persona?.apellidos?.[0]}
                                                {i.estadoInscripcion?.nombre === 'INSCRITO' && (
                                                    <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-[11px] font-black uppercase truncate leading-none pt-1">{i.persona?.nombre} {i.persona?.apellidos}</p>
                                                </div>
                                                <p className={cn("text-[10px] font-bold uppercase tracking-tight", selectedIns?.id === i.id ? "text-white/60" : "text-slate-400")}>
                                                    {i.persona?.nroDocumento} {i.persona?.expedido}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={cn(
                                                        "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                                                        selectedIns?.id === i.id
                                                            ? "bg-white/20 text-white"
                                                            : i.estadoInscripcion?.nombre === 'INSCRITO' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                                    )}>
                                                        {i.estadoInscripcion?.nombre || 'PREINSCRITO'}
                                                    </span>
                                                    <span className={cn("text-[9px] font-bold", selectedIns?.id === i.id ? "text-white/60" : "text-slate-400")}>
                                                        Bs. {(i.baucher || []).reduce((acc: number, b: any) => acc + (b.confirmado ? Number(b.monto) : 0), 0)}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-all", selectedIns?.id === i.id ? "text-white" : "text-slate-400")} />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Detailed Participant View */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20 p-8 custom-scrollbar">
                        {selectedIns ? (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedIns.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="max-w-4xl mx-auto space-y-8"
                                >
                                    {/* Action Header Card */}
                                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-slate-200 dark:border-slate-800">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-8 px-4">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 font-black text-[9px] uppercase tracking-[0.2em] border border-indigo-100 dark:border-indigo-500/20">Expediente Digital</span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {selectedIns.id.substring(0, 8)}</span>
                                                </div>
                                                <h3 className="text-4xl font-black tracking-tighter text-slate-800 dark:text-white uppercase leading-none">
                                                    {selectedIns.persona?.nombre} <br />
                                                    <span className="text-indigo-600">{selectedIns.persona?.apellidos}</span>
                                                </h3>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Cédula</p>
                                                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">{selectedIns.persona?.nroDocumento} {selectedIns.persona?.expedido}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Celular</p>
                                                        <p className="text-xs font-black text-slate-700 dark:text-slate-200">{selectedIns.persona?.celular || 'S/N'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Turno</p>
                                                        <p className="text-xs font-black text-indigo-600 uppercase">{selectedIns.turno?.turnoConfig?.nombre || 'Único'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Sede</p>
                                                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">{selectedIns.sede?.nombre || 'General'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-auto flex flex-col gap-3">
                                                <div className={cn(
                                                    "px-6 py-4 rounded-3xl border text-center flex flex-col gap-1",
                                                    selectedIns.estadoInscripcion?.nombre === 'INSCRITO'
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                                        : "bg-amber-500/10 border-amber-500/20 text-amber-600 shadow-lg shadow-amber-500/5 animate-pulse-slow"
                                                )}>
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Situación Académica</p>
                                                    <p className="text-xl font-black uppercase italic tracking-tight">{selectedIns.estadoInscripcion?.nombre || 'REGISTRADO'}</p>
                                                </div>

                                                {selectedIns.estadoInscripcion?.nombre !== 'INSCRITO' && (
                                                    <button
                                                        onClick={() => handleApproveInscripcion(selectedIns.id)}
                                                        className="h-16 px-10 rounded-3xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-xl shadow-indigo-600/20 group"
                                                    >
                                                        <Stamp className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                                        Formalizar Inscripción
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabs for Navigation */}
                                    <div className="flex gap-2 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
                                        <button
                                            onClick={() => setActiveTab('perfil')}
                                            className={cn(
                                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                activeTab === 'perfil' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-indigo-600"
                                            )}
                                        >
                                            Perfil e Información
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('pagos')}
                                            className={cn(
                                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                                activeTab === 'pagos' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-indigo-600"
                                            )}
                                        >
                                            Historial de Pagos
                                            {(selectedIns.baucher || []).some((b: any) => !b.confirmado) && (
                                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Main Content Area */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        <div className="lg:col-span-12">
                                            {activeTab === 'perfil' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {/* Documents and Print */}
                                                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 space-y-6">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Documentación y Comprobantes</p>
                                                        <div className="space-y-4">
                                                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-600">
                                                                        <Printer className="w-6 h-6" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-tight">Comprobante Oficial</p>
                                                                        <p className="text-[10px] font-medium text-slate-400 uppercase">Validez institucional</p>
                                                                    </div>
                                                                </div>
                                                                <PDFDownloadLink
                                                                    document={<InscripcionPDF inscripcion={selectedIns} profe={null} />}
                                                                    fileName={`Comprobante_${selectedIns.persona?.nroDocumento}.pdf`}
                                                                    className="p-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
                                                                >
                                                                    {({ loading }) => loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                                                </PDFDownloadLink>
                                                            </div>
                                                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-500/30 transition-all opacity-50 cursor-not-allowed">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400">
                                                                        <FileCheck className="w-6 h-6" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-tight">Acta de Compromiso</p>
                                                                        <p className="text-[10px] font-medium text-slate-400 uppercase">Firma obligatoria</p>
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 rounded-xl bg-slate-200 dark:bg-slate-800">
                                                                    <ExternalLink className="w-5 h-5" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Contact & Meta */}
                                                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 space-y-6">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Información de Enlace</p>
                                                        <div className="space-y-6">
                                                            <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                                                                    <Mail className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Correo Electrónico</p>
                                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedIns.persona?.email || 'No registrado'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                                                    <Phone className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">WhatsApp / Contacto</p>
                                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedIns.persona?.celular || 'Sin celular'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                                                    <MapPin className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Ubicación / Territorio</p>
                                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">{selectedIns.sede?.nombre || 'Distrital Central'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-8">
                                                    {/* Payments Section */}
                                                    <div className="flex flex-col gap-6">
                                                        {(selectedIns.baucher || []).length === 0 ? (
                                                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center gap-6">
                                                                <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200">
                                                                    <CreditCard className="w-10 h-10" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xl font-black uppercase tracking-tight text-slate-400 mb-2">Sin Depósitos Reportados</h4>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[280px]">El participante aún no ha subido comprobantes de pago a la plataforma.</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {selectedIns.baucher.map((b: any) => (
                                                                    <div key={b.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col group transition-all hover:shadow-xl hover:shadow-indigo-500/5">
                                                                        <div className="h-56 relative group/img overflow-hidden cursor-zoom-in bg-slate-100 flex items-center justify-center">
                                                                            {b.imagen ? (
                                                                                <img
                                                                                    src={getImageUrl(b.imagen)}
                                                                                    alt="Comprobante"
                                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                                                                                    onClick={() => window.open(getImageUrl(b.imagen), '_blank')}
                                                                                />
                                                                            ) : (
                                                                                <ImageIcon className="w-12 h-12 text-slate-200" />
                                                                            )}
                                                                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                                                                                <div>
                                                                                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Monto Depositado</p>
                                                                                    <p className="text-3xl font-black text-white italic tracking-tighter">Bs. {b.monto}</p>
                                                                                </div>
                                                                                <div className={cn(
                                                                                    "px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg",
                                                                                    b.confirmado ? "bg-emerald-500 text-white" : "bg-amber-500 text-white animate-pulse"
                                                                                )}>
                                                                                    {b.confirmado ? '✓ Verificado' : 'Pendiente'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="p-8 flex-1 flex flex-col justify-between">
                                                                            <div className="space-y-4">
                                                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 pb-4 border-b border-slate-50 dark:border-slate-800">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Fingerprint className="w-4 h-4 text-indigo-500" />
                                                                                        Nº Depósito: {b.nroDeposito || 'S/N'}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Calendar className="w-4 h-4 text-amber-500" />
                                                                                        {new Date(b.createdAt).toLocaleDateString()}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {!b.confirmado && (
                                                                                <div className="flex gap-4 pt-8">
                                                                                    <button
                                                                                        onClick={() => handleConfirmBaucher(b.id, true)}
                                                                                        className="flex-1 h-14 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                                                                                    >
                                                                                        <CheckCircle2 className="w-5 h-5" /> Validar
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleConfirmBaucher(b.id, false)}
                                                                                        className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                                                                                        title="Rechazar Pago"
                                                                                    >
                                                                                        <XCircle className="w-6 h-6" />
                                                                                    </button>
                                                                                </div>
                                                                            )}

                                                                            {b.confirmado && (
                                                                                <div className="flex items-center gap-3 pt-6 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                                                                    <CheckCircle2 className="w-5 h-5" /> Pago ingresado al sistema contable
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-40">
                                <div className="w-32 h-32 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-10 shadow-sm">
                                    <Users className="w-14 h-14 text-slate-100" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-slate-400 mb-2 italic">Selección de <span className="text-indigo-600">Expediente</span></h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] max-w-[320px] leading-relaxed">
                                    Haga clic en un participante del panel izquierdo para visualizar su información detallada, gestionar pagos y documentos.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

