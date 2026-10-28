'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Download, Printer, RotateCcw, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    persona: any;
    evento: any;
    mesa?: string;
    institucion?: string;
    fechaAsistencia?: string;
    onBackToStart: () => void;
    onRegisterOther: () => void;
}

export function GafeteTransformacion({
    persona,
    evento,
    mesa,
    institucion,
    fechaAsistencia,
    onBackToStart,
    onRegisterOther
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const nombreCompleto = [
        persona?.nombre1,
        persona?.nombre2,
        persona?.apellido1,
        persona?.apellido2
    ].filter(Boolean).map(s => String(s).trim()).filter(Boolean).join(' ').toUpperCase();

    const ciCompleto = String(persona?.ci || '').trim() + (persona?.complemento ? `-${persona.complemento}` : '');
    const ciSoloNumero = String(persona?.ci || '').split('-')[0].trim();

    const tieneMesa = Boolean(mesa && String(mesa).trim() !== '');

    // Generar la imagen compuesta en el Canvas
    const renderGafeteCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const baseImg = new Image();
        baseImg.crossOrigin = 'anonymous';
        baseImg.src = '/gafete.png';

        baseImg.onload = async () => {
            canvas.width = baseImg.width || 1085;
            canvas.height = baseImg.height || 1186;

            const W = canvas.width;
            const H = canvas.height;

            // 1. Dibujar imagen de fondo base
            ctx.clearRect(0, 0, W, H);
            ctx.drawImage(baseImg, 0, 0, W, H);

            // 2. Generar código de barras en canvas auxiliar temporal
            try {
                const { default: JsBarcode } = await import('jsbarcode');
                const barcodeCanvas = document.createElement('canvas');
                JsBarcode(barcodeCanvas, ciSoloNumero, {
                    format: 'CODE128',
                    width: 3.5,
                    height: 110,
                    displayValue: true,
                    fontSize: 22,
                    textMargin: 6,
                    margin: 12,
                    background: '#ffffff',
                    lineColor: '#000000',
                    font: 'monospace'
                });

                // 3. Dibujar Código de Barras en el lado DERECHO (centrado verticalmente)
                // Lado derecho: centro en X ~ 75% del ancho
                const bcW = barcodeCanvas.width;
                const bcH = barcodeCanvas.height;
                const posX_Right = Math.round(W * 0.73 - bcW / 2);
                const posY_Right = Math.round((H - bcH) / 2);

                // Tarjeta contenedora blanca con esquinas redondeadas para el barcode
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                ctx.shadowBlur = 16;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 6;
                ctx.fillStyle = '#ffffff';

                const pad = 12;
                const rad = 14;
                const rx = posX_Right - pad;
                const ry = posY_Right - pad;
                const rw = bcW + pad * 2;
                const rh = bcH + pad * 2;

                ctx.beginPath();
                ctx.roundRect(rx, ry, rw, rh, rad);
                ctx.fill();
                ctx.restore();

                // Borde suave
                ctx.save();
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(rx, ry, rw, rh, rad);
                ctx.stroke();
                ctx.restore();

                // Estampar el código de barras
                ctx.drawImage(barcodeCanvas, posX_Right, posY_Right);
            } catch (err) {
                console.error('Error generando código de barras en gafete:', err);
            }

            // 4. Dibujar Texto en el lado IZQUIERDO (centrado vertical y horizontalmente en su cuadrante)
            // Lado izquierdo: centro en X ~ 28% del ancho
            const centroX_Left = Math.round(W * 0.28);
            const centroY_Left = Math.round(H * 0.50);

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Ajuste dinámico de tamaño de fuente para el nombre
            let fontSizeNombre = 38;
            if (nombreCompleto.length > 30) fontSizeNombre = 30;
            if (nombreCompleto.length > 40) fontSizeNombre = 24;

            // División de nombre en dos líneas si es muy largo
            const palabras = nombreCompleto.split(' ');
            let linea1 = nombreCompleto;
            let linea2 = '';

            if (palabras.length > 3 && nombreCompleto.length > 25) {
                const mitad = Math.ceil(palabras.length / 2);
                linea1 = palabras.slice(0, mitad).join(' ');
                linea2 = palabras.slice(mitad).join(' ');
            }

            // Posicionamiento de bloques en Y
            const offsetNombre = tieneMesa ? -45 : 0;

            // ── NOMBRE COMPLETO ──
            ctx.fillStyle = '#0f172a'; // Slate oscuro de alta legibilidad
            ctx.font = `900 ${fontSizeNombre}px 'Inter', system-ui, sans-serif`;

            if (linea2) {
                ctx.fillText(linea1, centroX_Left, centroY_Left + offsetNombre - 20);
                ctx.fillText(linea2, centroX_Left, centroY_Left + offsetNombre + 20);
            } else {
                ctx.fillText(linea1, centroX_Left, centroY_Left + offsetNombre);
            }

            // ── CÉDULA DE IDENTIDAD (Subtítulo del nombre) ──
            ctx.fillStyle = '#64748b';
            ctx.font = `700 20px monospace`;
            const posCiY = linea2 ? centroY_Left + offsetNombre + 55 : centroY_Left + offsetNombre + 35;
            ctx.fillText(`C.I. ${ciCompleto}`, centroX_Left, posCiY);

            // ── MESA DE TRABAJO (Abajo del nombre si compete) ──
            if (tieneMesa) {
                const posY_Mesa = centroY_Left + 65;

                // Badge / Pastilla para la mesa
                const textoMesa = `MESA: ${String(mesa).toUpperCase()}`;
                ctx.font = `900 22px 'Inter', system-ui, sans-serif`;
                const textMetrics = ctx.measureText(textoMesa);
                const badgeW = textMetrics.width + 36;
                const badgeH = 44;

                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#1e293b'; // Fondo contrastado oscuro
                ctx.beginPath();
                ctx.roundRect(centroX_Left - badgeW / 2, posY_Mesa - badgeH / 2, badgeW, badgeH, 22);
                ctx.fill();
                ctx.restore();

                // Texto de la mesa en blanco brillante
                ctx.fillStyle = '#ffffff';
                ctx.font = `900 20px 'Inter', system-ui, sans-serif`;
                ctx.fillText(textoMesa, centroX_Left, posY_Mesa + 1);

                // Si viene institución, mostrarla abajo en fuente secundaria
                if (institucion) {
                    ctx.fillStyle = '#334155';
                    ctx.font = `bold 16px 'Inter', system-ui, sans-serif`;
                    const instTexto = String(institucion).toUpperCase();
                    const instAbrev = instTexto.length > 36 ? instTexto.substring(0, 34) + '...' : instTexto;
                    ctx.fillText(instAbrev, centroX_Left, posY_Mesa + 42);
                }
            }

            ctx.restore();

            // Guardar preview en estado para renderizado reactivo
            const dataUrl = canvas.toDataURL('image/png');
            setPreviewUrl(dataUrl);
            setImageLoaded(true);
        };

        baseImg.onerror = () => {
            console.error('No se pudo cargar la imagen base /gafete.png');
            toast.error('No se encontró la plantilla /gafete.png en el servidor.');
        };
    }, [nombreCompleto, ciSoloNumero, ciCompleto, tieneMesa, mesa, institucion]);

    useEffect(() => {
        renderGafeteCanvas();
    }, [renderGafeteCanvas]);

    // Descarga directa de la imagen generada
    const handleDownloadImage = () => {
        if (!canvasRef.current) return;
        setGenerating(true);
        try {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            const safeName = nombreCompleto.replace(/\s+/g, '_').toLowerCase();
            link.download = `boleta_gafete_${ciSoloNumero}_${safeName}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('¡Boleta de inscripción descargada con éxito!');
        } catch (e: any) {
            toast.error('Error al generar la descarga: ' + e.message);
        } finally {
            setGenerating(false);
        }
    };

    // Impresión directa del gafete
    const handlePrint = () => {
        if (!previewUrl) return;
        const win = window.open('', '_blank', 'width=900,height=900');
        if (!win) {
            window.print();
            return;
        }

        win.document.documentElement.innerHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Boleta de Inscripción — ${nombreCompleto}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; }
    img { max-width: 95vw; max-height: 95vh; object-fit: contain; box-shadow: 0 8px 30px rgba(0,0,0,0.12); border-radius: 12px; }
    @media print {
      body { background: transparent; }
      img { width: 100%; height: auto; max-width: 100%; box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <img src="${previewUrl}" alt="Gafete" />
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;
        win.document.close();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header de Confirmación */}
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 text-center space-y-3 shadow-xl relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
                    ¡Inscripción Confirmada!
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground font-semibold max-w-lg mx-auto">
                    Tu boleta oficial de acreditación para el Encuentro Nacional ha sido generada. Descarga o imprime tu credencial con código de barras para el ingreso.
                </p>
            </div>

            {/* Vista previa interactiva de la imagen generada */}
            <div className="bg-card border border-border rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col items-center">
                <div className="w-full max-w-2xl rounded-2xl overflow-hidden border-2 border-border/80 shadow-lg bg-muted/10 relative">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Boleta de Acreditación"
                            className="w-full h-auto object-contain block"
                        />
                    ) : (
                        <div className="aspect-[1085/1186] w-full flex items-center justify-center text-muted-foreground text-xs font-bold animate-pulse">
                            Generando boleta personalizada...
                        </div>
                    )}
                </div>

                {/* Canvas oculto para composición en resolución nativa */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Barra de Acciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                    onClick={handleDownloadImage}
                    disabled={!imageLoaded || generating}
                    className="h-14 px-6 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                    <Download className="w-4 h-4" />
                    Descargar Imagen
                </button>

                <button
                    onClick={handlePrint}
                    disabled={!imageLoaded}
                    className="h-14 px-6 rounded-2xl bg-muted border border-border font-black text-xs uppercase tracking-widest text-foreground hover:bg-muted/80 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    <Printer className="w-4 h-4" />
                    Imprimir Boleta
                </button>

                <button
                    onClick={onRegisterOther}
                    className="h-14 px-6 rounded-2xl bg-card border border-border font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    Nueva Inscripción
                </button>

                <button
                    onClick={onBackToStart}
                    className="h-14 px-6 rounded-2xl bg-card border border-border font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Evento
                </button>
            </div>
        </div>
    );
}

