'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAbility } from '@/hooks/useAbility';
import {
    Send, FileText, Users, CornerRightDown,
    Eye, Check, X, UserPlus, Type, AlignLeft, Search,
    CheckCircle2, AlertCircle, Loader2, Sparkles,
    ArrowRight, Info, Layers, Calendar, Hash,
    Download, Upload, FileUp, Monitor, ShieldCheck
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import {
    crearCorrespondencia,
    buscarUsuarios,
    subirPdf,
    avanzarEstado,
    PREFIJOS,
    type CorTipoDocumento,
    type CorUsuario,
    type CorDocumento,
} from '@/services/correspondencia.service';
import { useAuth } from '@/contexts/AuthContext';
import { uploadService } from '@/services/uploadService';
import { toast } from 'sonner';
import api from '@/lib/api';

const DOCUMENT_TYPES: { id: CorTipoDocumento; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'INFORME', label: 'Informe (INF)', icon: FileText, color: 'from-blue-500 to-indigo-600' },
    { id: 'NOTA_INTERNA', label: 'Nota Interna (NI)', icon: AlignLeft, color: 'from-emerald-500 to-teal-600' },
    { id: 'MEMORANDUM', label: 'Memorándum (MEM)', icon: Type, color: 'from-amber-500 to-orange-600' },
    { id: 'INSTRUCTIVO', label: 'Instructivo (INS)', icon: Users, color: 'from-purple-500 to-pink-600' },
];

interface ParticipanteConCargo extends CorUsuario {
    cargoLiteral?: string;
}

export default function NuevaNotaPage() {
    const { user } = useAuth();
    const { can } = useAbility();
    const router = useRouter();
    const [tipo, setTipo] = useState<CorTipoDocumento>('INFORME');
    const [hr, setHr] = useState('');
    const [referencia, setReferencia] = useState('');
    const [contenido, setContenido] = useState('');
    const [destinatarios, setDestinatarios] = useState<ParticipanteConCargo[]>([]);
    const [vias, setVias] = useState<ParticipanteConCargo[]>([]);
    const [remitentes, setRemitentes] = useState<ParticipanteConCargo[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<CorDocumento | null>(null);
    const [uploading, setUploading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (user && remitentes.length === 0) {
            setRemitentes([{ id: user.id, nombre: user.nombre, apellidos: user.apellidos, cargoStr: user.cargoStr || null, cargoLiteral: user.cargoStr || '' }]);
        }
    }, [user]);

    // Guard CASL
    useEffect(() => {
        if (!can('manage', 'CorDocumento') && !can('create', 'CorDocumento')) {
            router.replace('/dashboard/correspondencia/bandeja');
        }
    }, [can, router]);

    const currentYear = new Date().getFullYear();
    const currentDateFormatted = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

    const updateCargo = (setter: any) => (id: string, val: string) => {
        setter((prev: any) => prev.map((u: any) => u.id === id ? { ...u, cargoLiteral: val } : u));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!referencia.trim()) { toast.error('La referencia es obligatoria'); return; }
        if (destinatarios.length === 0) { toast.error('Seleccione al menos un destinatario'); return; }
        setLoading(true);
        try {
            const doc = await crearCorrespondencia({
                tipo, hr: hr.trim() || undefined, referencia: referencia.trim(), contenido: contenido.trim() || undefined,
                destinatarios: destinatarios.map(u => ({ userId: u.id, cargoLiteral: u.cargoLiteral })),
                vias: vias.map(u => ({ userId: u.id, cargoLiteral: u.cargoLiteral })),
                remitentes: remitentes.map(u => ({ userId: u.id, cargoLiteral: u.cargoLiteral })),
            });
            setSuccess(doc);
            localStorage.setItem('profe_current_cor_id', doc.id); // Lógica Senior: Persistencia
            toast.success('CITE reservado correctamente');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al emitir');
        } finally { setLoading(false); }
    };

    const handleConfirmarEnvio = async () => {
        if (!success || confirming) return;
        setConfirming(true);
        try {
            // Siempre usamos ENVIO: el backend registra el estado como ENVIADO
            // permitiendo al remitente cancelar si es necesario.
            // Si hay vías, el detalle lo indica para el historial.
            const detalle = vias.length > 0
                ? `Documento enviado oficialmente. Pasa por Vía: ${vias.map(v => v.nombre).join(', ')} antes de llegar a: ${destinatarios.map(d => d.nombre).join(', ')}`
                : `Documento enviado oficialmente a: ${destinatarios.map(d => d.nombre).join(', ')}`;
            await avanzarEstado(success.id, 'ENVIO', detalle);
            localStorage.removeItem('profe_current_cor_id');
            toast.success('Documento enviado oficialmente');
            router.push('/dashboard/correspondencia/bandeja');
        } catch (err) {
            toast.error('Error al confirmar el envío');
        } finally { setConfirming(false); }
    };

    const downloadWord = async () => {
        const citeFinal = success?.cite || `${PREFIJOS[tipo]}/PROFE Nro. #/${currentYear}`;
        const hrFinal = success?.hr || hr || 'S/N';

        // Lógica Senior: Obtener Base64 real para MHTML
        let base64Image = "";
        try {
            const response = await fetch("/fondo_doc_profe.jpg");
            const blob = await response.blob();
            const rawBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
            base64Image = rawBase64.split(',')[1];
        } catch (e) {
            console.error("Error cargando fondo:", e);
        }

        // Estructura MHTML de Nivel Senior: Header/Footer con Anclaje VML
        const boundary = "----=_NextPart_01D9F1B2.B8E1B3E0";
        const imageCid = "institucional_bg_001";

        const htmlBody = `
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DisplayBackgroundShape/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <!--[if gte vml 1]>
    <v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" stroked="f" filled="f">
        <v:stroke joinstyle="miter"/><v:formulas><v:f eqn="if lineDrawn pixelLineWidth 0"/><v:f eqn="sum @0 1 0"/><v:f eqn="sum 0 0 @1"/><v:f eqn="prod @2 1 2"/><v:f eqn="prod @3 21600 pixelWidth"/><v:f eqn="prod @3 21600 pixelHeight"/><v:f eqn="sum @0 0 1"/><v:f eqn="prod @6 1 2"/><v:f eqn="prod @7 21600 pixelWidth"/><v:f eqn="sum @8 21600 0"/><v:f eqn="prod @7 21600 pixelHeight"/><v:f eqn="sum @10 21600 0"/></v:formulas>
        <v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/><o:lock v:ext="edit" aspectratio="t"/>
    </v:shapetype>
    <![endif]-->
    <style>
        @page Section1 {
            size: 21.59cm 27.94cm;
            margin: 4.5cm 2.5cm 3cm 3cm;
            mso-header: h1;
            mso-footer: f1;
            mso-header-margin: 0pt;
            mso-footer-margin: 0pt;
        }
        div.Section1 { page: Section1; }
        body { font-family: 'Arial', sans-serif; font-size: 11pt; }
        
        /* Soporte Tiptap */
        h1 { font-size: 14pt; font-weight: bold; margin-top: 12pt; }
        h2 { font-size: 12pt; font-weight: bold; margin-top: 10pt; }
        ul, ol { margin-left: 25pt; }
        
        .header-title { font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 5pt; }
        .meta-table { width: 100%; border-collapse: collapse; margin-top: 10pt; line-height: 1.15; }
        .meta-label { width: 60pt; font-weight: bold; vertical-align: top; }
        .meta-value { vertical-align: top; }
        .content-body { margin-top: 10pt; text-align: justify; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="Section1">
        <div class="header-title">${tipo.replace('_', ' ')}</div>
        <div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 12pt;">
            HR: ${hrFinal}<br>CITE: ${citeFinal}
        </div>
        
        <table class="meta-table" style="font-family: 'Arial'; font-size: 11pt;">
            ${destinatarios.map((u, i) => `<tr><td class="meta-label" style="padding-bottom: 3pt;">${i === 0 ? 'A:' : ''}</td><td class="meta-value" style="padding-bottom: 3pt;">${(u.nombre + ' ' + u.apellidos).toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}<br><span style="font-size: 11pt; text-transform: uppercase;"><b>${u.cargoLiteral || u.cargoStr || 'PERSONAL PROFE'}</b></span></td></tr>`).join('')}
            ${vias.map((u, i) => `<tr><td class="meta-label" style="padding-bottom: 3pt;">${i === 0 ? 'Vía:' : ''}</td><td class="meta-value" style="padding-bottom: 3pt;">${(u.nombre + ' ' + u.apellidos).toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}<br><span style="font-size: 11pt; text-transform: uppercase;"><b>${u.cargoLiteral || u.cargoStr || 'PERSONAL PROFE'}</b></span></td></tr>`).join('')}
            ${remitentes.map((u, i) => `<tr><td class="meta-label" style="padding-bottom: 3pt;">${i === 0 ? 'De:' : ''}</td><td class="meta-value" style="padding-bottom: 3pt;">${(u.nombre + ' ' + u.apellidos).toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}<br><span style="font-size: 11pt; text-transform: uppercase;"><b>${u.cargoLiteral || u.cargoStr || 'PERSONAL PROFE'}</b></span></td></tr>`).join('')}
            <tr><td class="meta-label" style="padding-bottom: 3pt;">Ref.:</td><td class="meta-value" style="padding-bottom: 3pt;"><b>${(referencia || 'SIN REFERENCIA').toUpperCase()}</b></td></tr>
            <tr><td class="meta-label" style="padding-bottom: 3pt;">Fecha:</td><td class="meta-value" style="padding-bottom: 3pt;">La Paz, ${currentDateFormatted}</td></tr>
        </table>
        
        <hr style="border: none; border-top: solid black 2.25pt; margin-top: 8pt; margin-bottom: 12pt;" />
        <div class="content-body">${contenido || '---'}</div>
    </div>
    
    <!-- Capas Oficiales de Word (Posicionadas fuera del flujo para evitar duplicados) -->
    <div style='mso-element:header; position:absolute; top:-1000px;' id=h1>
        <p class="MsoHeader" style='margin:0;'>
            <!--[if gte mso 9]>
            <v:shape id="WordHeaderBg" o:spid="_x0000_s1025" type="#_x0000_t75" 
                style='position:absolute;left:0;top:0;width:21.59cm;height:27.94cm;z-index:-251658240;
                mso-position-horizontal:left;mso-position-horizontal-relative:page;
                mso-position-vertical:top;mso-position-vertical-relative:page'>
                <v:imagedata src="cid:${imageCid}" />
            </v:shape>
            <![endif]-->
        </p>
    </div>
    
    <div style='mso-element:footer; position:absolute; top:-1000px;' id=f1>
        <p class="MsoFooter" style='margin:0;'>
            &nbsp;
        </p>
    </div>
</body>
</html>`.trim();

        const mhtmlContent = [
            'MIME-Version: 1.0',
            `Content-Type: multipart/related; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset="utf-8"',
            'Content-Location: document.html',
            '',
            htmlBody,
            '',
            `--${boundary}`,
            'Content-Type: image/jpeg',
            'Content-Transfer-Encoding: base64',
            `Content-ID: <${imageCid}>`,
            'Content-Location: fondo_doc_profe.jpg',
            'Content-Disposition: inline; filename="fondo_doc_profe.jpg"',
            '',
            base64Image,
            '',
            `--${boundary}--`
        ].join('\r\n');

        const blob = new Blob([mhtmlContent], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${tipo.replace('_', '')}_${citeFinal.replace(/\//g, '_')}.doc`;
        link.click();
    };


    const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!success || !e.target.files?.[0]) return;
        const file = e.target.files[0];

        // Lógica Senior: Validación de tamaño (5MB = 5 * 1024 * 1024 bytes)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            toast.error('El archivo es demasiado grande. El límite máximo es de 5MB.');
            e.target.value = ''; // Limpiar el input
            return;
        }

        setUploading(true);
        try {
            // Generar URL local para previsualización inmediata (evita errores de IP/Conexión)
            const localUrl = URL.createObjectURL(file);
            setPreviewUrl(localUrl);

            const response = await uploadService.uploadFile(file, 'correspondencia');
            const relativePath = response.data.path;

            await subirPdf(success.id, relativePath);
            setPdfUrl(relativePath);
            setShowPreview(true);
            toast.success('PDF subido y procesado correctamente');
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || 'Error al conectar con el servidor de carga';
            toast.error(`Fallo en la carga: ${errorMsg}`);
            console.error('Upload Error:', err);
        } finally { setUploading(false); }
    };

    useEffect(() => {
        const recoverDraft = async () => {
            const savedId = localStorage.getItem('profe_current_cor_id');
            if (savedId && !success) {
                try {
                    const { data } = await api.get(`/correspondencia/buscar-id/${savedId}`);
                    if (data && data.estado === 'ELABORACION') {
                        setTipo(data.tipo);
                        setReferencia(data.referencia || '');
                        setContenido(data.contenido || '');

                        // Reconstruir participantes (mapeo Senior con cargos literales)
                        const parts = data.participantes || [];
                        const dests = parts.filter((p: any) => p.rol === 'DESTINATARIO').map((p: any) => ({ ...p.usuario, cargoLiteral: p.cargoLiteral || p.usuario?.cargoStr || '' }));
                        const vs = parts.filter((p: any) => p.rol === 'VIA').map((p: any) => ({ ...p.usuario, cargoLiteral: p.cargoLiteral || p.usuario?.cargoStr || '' }));
                        const rems = parts.filter((p: any) => p.rol === 'REMITENTE').map((p: any) => ({ ...p.usuario, cargoLiteral: p.cargoLiteral || p.usuario?.cargoStr || '' }));

                        setDestinatarios(dests);
                        setVias(vs);
                        setRemitentes(rems);

                        if (data.archivoPdf) setPdfUrl(data.archivoPdf);
                        setSuccess(data); // Al final para disparar el renderizado completo
                    }
                } catch (e) {
                    localStorage.removeItem('profe_current_cor_id');
                }
            }
        };
        recoverDraft();
    }, []);

    // Guard de render: sin permisos de escritura, no mostrar la UI
    if (!can('manage', 'CorDocumento') && !can('create', 'CorDocumento')) return null;

    if (success) {
        return (
            <>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto py-20 text-center space-y-12">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-28 h-28 rounded-[2.5rem] bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl">
                        <CheckCircle2 className="w-14 h-14" />
                    </motion.div>
                    <div className="space-y-4">
                        <h2 className="text-5xl font-black tracking-tighter">CITE <span className="text-emerald-500">Asignado</span></h2>
                        <p className="text-muted-foreground text-lg font-medium">Descargue el Word oficial, firme y suba el escaneado.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-card border-2 border-emerald-500/20 rounded-[3rem] p-10 shadow-2xl flex flex-col items-center">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">CITE OFICIAL</p>
                            <p className="text-4xl font-black tracking-tighter">{success.cite}</p>
                            <button onClick={downloadWord} className="mt-8 h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3">
                                <Download className="w-5 h-5" /> Descargar Word
                            </button>
                        </div>
                        <div className="bg-card border-2 border-primary/20 rounded-[3rem] p-10 shadow-2xl flex flex-col items-center">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">SUBIR ESCANEADO</p>
                            {pdfUrl ? (
                                <button onClick={() => setShowPreview(true)} className="mt-8 h-14 px-8 rounded-2xl bg-primary/10 text-primary font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-3">
                                    <Monitor className="w-5 h-5" /> Ver y Enviar
                                </button>
                            ) : (
                                <label className="mt-8 h-14 px-8 rounded-2xl border-2 border-dashed border-primary/50 text-primary font-black uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center gap-3 cursor-pointer">
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                                    {uploading ? 'SUBIENDO...' : 'SUBIR PDF'}
                                    <input type="file" accept="application/pdf" className="hidden" onChange={handleUploadPdf} disabled={uploading} />
                                </label>
                            )}
                            <p className="mt-4 text-[9px] text-muted-foreground font-bold uppercase tracking-widest text-center">
                                {vias.length > 0 ? '⚠️ El documento pasará por VÍA primero.' : 'El documento irá al DESTINATARIO.'}
                            </p>
                        </div>
                    </div>
                </motion.div>
                <AnimatePresence>
                    {showPreview && pdfUrl && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                                <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Eye className="w-5 h-5" /></div>
                                        <div><h3 className="text-sm font-black uppercase tracking-widest">Previsualización de Documento</h3><p className="text-[10px] text-muted-foreground font-bold uppercase">{success.cite}</p></div>
                                    </div>
                                    <button onClick={() => setShowPreview(false)} className="w-10 h-10 rounded-xl hover:bg-muted transition-colors flex items-center justify-center"><X className="w-6 h-6" /></button>
                                </div>
                                <div className="flex-1 bg-muted/10 p-0 overflow-hidden">
                                    <embed src={`${previewUrl || getImageUrl(pdfUrl)}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" className="w-full h-full" />
                                </div>
                                <div className="p-6 bg-card border-t border-border flex justify-end gap-4">
                                    <button onClick={() => setShowPreview(false)} className="px-8 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border border-border hover:bg-muted transition-all">Cancelar</button>
                                    <button onClick={handleConfirmarEnvio} disabled={confirming} className="px-8 h-12 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                                        {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {confirming ? 'PROCESANDO...' : 'CONFIRMAR Y ENVIAR'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3"><span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">Professional Drafting System</span></div>
                    <h1 className="text-6xl font-black tracking-tighter leading-none">Nueva <span className="text-primary italic">Correspondencia</span></h1>
                </div>
                <div className="flex items-center gap-3 bg-card/50 p-2 rounded-2xl border border-border/50 backdrop-blur-xl">
                    <button onClick={handleSubmit} disabled={loading} className="h-12 px-8 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{loading ? 'GENERANDO...' : 'GENERAR CITE'}
                    </button>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8">
                    <div className="bg-white text-black rounded-[2.5rem] shadow-2xl min-h-[1000px] relative overflow-hidden border border-border/50">
                        <div className="p-16 pt-32 space-y-8">
                            <div className="text-center font-bold text-xl space-y-1 mb-8">
                                <p className="uppercase">{tipo.replace('_', ' ')}</p>
                                <div className="flex items-center justify-center gap-2 text-sm text-primary/60">
                                    <span>HR:</span>
                                    <span className="bg-primary/5 px-4 py-0.5 rounded-full border border-primary/10 font-mono italic">Auto-generado</span>
                                </div>
                                <p className="text-sm">CITE: {PREFIJOS[tipo]}/PROFE Nro. #/{currentYear}</p>
                            </div>
                            <div className="space-y-4 text-sm">
                                <UserSelectorBlock label="A:" list={destinatarios} />
                                {vias.length > 0 && <UserSelectorBlock label="Vía:" list={vias} />}
                                <UserSelectorBlock label="De:" list={remitentes} />
                                <div className="flex gap-10 pt-2"><span className="w-16 font-black uppercase text-xs pt-1">Ref.:</span><div className="flex-1"><textarea value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Referencia del documento..." className="w-full bg-primary/5 rounded-xl px-4 py-2 font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 resize-none h-12" /></div></div>
                                <div className="flex gap-10"><span className="w-16 font-black uppercase text-xs">Fecha:</span><div className="flex-1 font-bold text-gray-800">La Paz, {currentDateFormatted}</div></div>
                            </div>
                            <div className="h-[2.5pt] bg-black w-full" />
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black text-primary/40 uppercase tracking-widest px-1">
                                    <span>Contenido del Documento</span>
                                    <span>{contenido.length}/150</span>
                                </div>
                                <textarea
                                    value={contenido}
                                    onChange={e => setContenido(e.target.value.slice(0, 150))}
                                    placeholder="Para su conocimiento..."
                                    maxLength={150}
                                    className="w-full bg-transparent min-h-[400px] outline-none resize-none font-serif text-lg leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-4 space-y-8">
                    <ConfigSidebar tipo={tipo} setTipo={setTipo} />
                    <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-xl space-y-10">
                        <UserSelector label="Dirigido a" icon={Users} selected={destinatarios} excludeId={user?.id} onAdd={(u: any) => setDestinatarios(p => [...p, u])} onRemove={(id: any) => setDestinatarios(p => p.filter(u => u.id !== id))} onUpdateCargo={updateCargo(setDestinatarios)} />
                        <div className="h-px bg-border/20" /><UserSelector label="Vía" icon={CornerRightDown} selected={vias} excludeId={user?.id} onAdd={(u: any) => setVias(p => [...p, u])} onRemove={(id: any) => setVias(p => p.filter(u => u.id !== id))} onUpdateCargo={updateCargo(setVias)} /><div className="h-px bg-border/20" /><UserSelector label="De" icon={Check} selected={remitentes} onAdd={(u: any) => setRemitentes(p => [...p, u])} onRemove={(id: any) => setRemitentes(p => p.filter(u => u.id !== id))} onUpdateCargo={updateCargo(setRemitentes)} />
                    </div>
                </div>
            </form>
        </div>
    );
}

function UserSelectorBlock({ label, list }: { label: string, list: any[] }) {
    return (
        <div className="flex gap-10">
            <span className="w-16 font-black uppercase text-xs pt-1">{label}</span>
            <div className="flex-1 space-y-2">
                {list.length === 0 && <span className="text-gray-300 italic">Seleccione...</span>}
                {list.map(u => (<div key={u.id}><p className="font-bold leading-tight">{u.nombre} {u.apellidos}</p><p className="uppercase text-[11px] font-black opacity-80 text-primary">{u.cargoLiteral || u.cargoStr || 'Personal PROFE'}</p></div>))}
            </div>
        </div>
    );
}

function ConfigSidebar({ tipo, setTipo }: any) {
    return (
        <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-6"><Layers className="w-4 h-4 text-primary" /><h3 className="text-xs font-black uppercase tracking-widest">Configuración</h3></div>
            <div className="grid grid-cols-2 gap-3">{DOCUMENT_TYPES.map(t => (<button key={t.id} type="button" onClick={() => setTipo(t.id)} className={cn("p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2", tipo === t.id ? "border-primary bg-primary/5" : "border-border/50 bg-background")}><t.icon className={cn("w-6 h-6", tipo === t.id ? "text-primary" : "text-muted-foreground")} /><span className="text-[8px] font-black uppercase">{t.id.replace('_', ' ')}</span></button>))}</div>
        </div>
    );
}

function UserSelector({ label, icon: Icon, selected, excludeId, onAdd, onRemove, onUpdateCargo }: any) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<CorUsuario[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const timerRef = useRef<any>(null);
    const search = useCallback(async (query: string) => {
        if (!query.trim()) { setResults([]); return; }
        setLoading(true);
        try {
            const data = await buscarUsuarios(query);
            setResults(data.filter((u: any) => u.id !== excludeId && !selected.some((s: any) => s.id === u.id)));
        } finally { setLoading(false); }
    }, [selected, excludeId]);
    const handleChange = (e: any) => { const val = e.target.value; setQ(val); setOpen(true); if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = setTimeout(() => search(val), 350); };
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Icon className="w-3.5 h-3.5" /></div><span className="text-[11px] font-black text-foreground uppercase tracking-widest">{label}</span></div></div>
            <div className="space-y-2">{selected.map((u: any) => (<UserBadge key={u.id} u={u} onRemove={() => onRemove(u.id)} onUpdateCargo={(val) => onUpdateCargo(u.id, val)} />))}</div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" value={q} onChange={handleChange} onFocus={() => q && setOpen(true)} placeholder={`Buscar para ${label.toLowerCase()}...`} className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-xs font-bold transition-all shadow-inner" />
                <AnimatePresence>{open && results.length > 0 && (<motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto" onMouseDown={e => e.preventDefault()}>{results.map((u: any) => (<button key={u.id} type="button" onClick={() => { onAdd({ ...u, cargoLiteral: u.cargoStr || '' }); setQ(''); setOpen(false); setResults([]); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left border-b border-border/30 last:border-0"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black shrink-0">{u.nombre?.[0]}</div><div className="flex-1"><p className="text-xs font-bold">{u.nombre} {u.apellidos}</p><p className="text-[9px] text-muted-foreground truncate">{u.cargoStr || 'Sin cargo'}</p></div></button>))}</motion.div>)}</AnimatePresence>
            </div>
        </div>
    );
}

function UserBadge({ u, onRemove, onUpdateCargo }: { u: ParticipanteConCargo; onRemove?: () => void; onUpdateCargo?: (val: string) => void }) {
    const initials = (u.nombre?.[0] || '') + (u.apellidos?.[0] || '');
    return (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col gap-2 p-3 rounded-2xl bg-background border border-border/50 shadow-sm group hover:border-primary/30 transition-all w-full max-w-sm">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black uppercase">{initials}</div><div className="flex flex-col leading-none flex-1"><span className="text-[11px] font-black text-foreground">{u.nombre} {u.apellidos}</span><span className="text-[9px] text-muted-foreground italic">Base: {u.cargoStr || 'Sin cargo'}</span></div>{onRemove && (<button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>)}</div>
            <div className="relative group/input"><p className="text-[8px] font-black text-primary/50 uppercase tracking-widest mb-1 ml-1">Cargo en Documento</p><input type="text" value={u.cargoLiteral ?? u.cargoStr ?? ''} onChange={(e) => onUpdateCargo?.(e.target.value)} placeholder="Ej: DIRECTOR a.i." className="w-full bg-muted/50 border-none rounded-lg px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" /></div>
        </motion.div>
    );
}
