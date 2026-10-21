import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export interface FormularioEvaluado {
    no?: number;
    codigo: string;
    nombre: string;
    pesoPorcentaje: number;
    resultado: number;
}

export interface HojaConceptoDatos {
    evaluado: {
        id?: string;
        nombreCompleto?: string;
        apellidos?: string;
        nombre?: string;
        ci: string;
        expedido?: string;
        departamento?: string;
        esfm?: string;
        cargo: string;
        codigo?: string; // RDA o código de verificación
    };
    periodo: {
        gestion: string;
        periodo: string; // e.g. "1RA. FASE" o "1ER SEMESTRE"
        semestre?: string;
    };
    formularios: FormularioEvaluado[];
    puntajeTotal: number;
    codigoVerificacion?: string;
    qrUrl?: string;
}

/**
 * Determina la calificación cualitativa según la escala oficial:
 * Destacado: 91 - 100 puntos
 * Bueno: 81 - 90 puntos
 * Aceptable: 61 - 80 puntos
 * Insuficiente: 1 - 60 puntos
 */
export function getCalificacionOficial(puntaje: number): 'DESTACADO' | 'BUENO' | 'ACEPTABLE' | 'INSUFICIENTE' {
    const p = Math.round(puntaje * 100) / 100;
    if (p >= 91) return 'DESTACADO';
    if (p >= 81) return 'BUENO';
    if (p >= 61) return 'ACEPTABLE';
    return 'INSUFICIENTE';
}

/**
 * Obtiene el base64 del logo institucional
 */
async function loadLogoBase64(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
        const response = await fetch('/logo-principal.png');
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

/**
 * Dibuja una página con la Hoja de Concepto oficial de una persona
 */
export async function renderHojaConceptoPagina(
    doc: jsPDF,
    datos: HojaConceptoDatos,
    logoBase64: string | null
): Promise<void> {
    const pageW = doc.internal.pageSize.getWidth(); // 215.9 mm
    const margin = 14;
    const contentW = pageW - margin * 2; // ~187.9 mm

    // ── 1. CABECERA: LOGO & ESCUDO INSTITUCIONAL ─────────────────────────────
    let currentY = 12;

    if (logoBase64) {
        try {
            // El logo oficial de Minedu incluye el Escudo Nacional y "MINISTERIO DE EDUCACIÓN"
            doc.addImage(logoBase64, 'PNG', margin + 4, currentY, 52, 16);
        } catch {
            // Fallback tipográfico si la imagen falla
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(148, 110, 35); // Dorado
            doc.text('MINISTERIO', margin + 4, currentY + 6);
            doc.setTextColor(0, 0, 0);
            doc.text('DE EDUCACIÓN', margin + 4, currentY + 12);
        }
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(148, 110, 35);
        doc.text('ESTADO PLURINACIONAL DE BOLIVIA', margin + 4, currentY + 5);
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text('MINISTERIO DE EDUCACIÓN', margin + 4, currentY + 12);
    }

    currentY += 19;

    // ── 2. TÍTULO DEL DOCUMENTO ──────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const titulo1 = 'EVALUACIÓN DE DESEMPEÑO PROFESIONAL DEL PERSONAL DE LAS ESCUELAS';
    const titulo2 = 'SUPERIORES DE FORMACIÓN DE MAESTRAS Y MAESTROS Y SUS UNIDADES ACADÉMICAS';
    const gestionTexto = `GESTIÓN ${datos.periodo.gestion || '2026'} - ${(datos.periodo.periodo || '1RA. FASE').toUpperCase()}`;

    doc.text(titulo1, pageW / 2, currentY, { align: 'center' });
    currentY += 4.2;
    doc.text(titulo2, pageW / 2, currentY, { align: 'center' });
    currentY += 4.5;
    doc.text(gestionTexto, pageW / 2, currentY, { align: 'center' });
    currentY += 5;

    // ── 3. CUADRO DE DATOS DEL EVALUADO ──────────────────────────────────────
    const apellidosNombres = datos.evaluado.nombreCompleto ||
        `${datos.evaluado.apellidos || ''} ${datos.evaluado.nombre || ''}`.trim() || '---';
    const ci = datos.evaluado.ci || '---';
    const expedido = datos.evaluado.expedido || (datos.evaluado.departamento ? datos.evaluado.departamento.slice(0, 2).toUpperCase() : '---');
    const departamento = (datos.evaluado.departamento || 'LA PAZ').toUpperCase();
    const codigoFuncionario = datos.evaluado.codigo || datos.codigoVerificacion || `601-${ci}`;
    const esfmUa = (datos.evaluado.esfm || 'SEDE CENTRAL').toUpperCase();
    const cargo = (datos.evaluado.cargo || 'DOCENTE').toUpperCase();

    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        theme: 'grid',
        tableWidth: contentW,
        styles: {
            fontSize: 8,
            cellPadding: 1.8,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            textColor: [0, 0, 0],
            font: 'helvetica',
        },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: [229, 231, 235], cellWidth: 36, halign: 'right' },
            1: { cellWidth: 70, fontStyle: 'normal' },
            2: { fontStyle: 'bold', fillColor: [229, 231, 235], cellWidth: 16, halign: 'right' },
            3: { cellWidth: 26, fontStyle: 'normal' },
            4: { fontStyle: 'bold', fillColor: [229, 231, 235], cellWidth: 18, halign: 'right' },
            5: { cellWidth: 21.9, fontStyle: 'normal' },
        },
        body: [
            [
                { content: 'Apellidos y Nombres:' },
                { content: apellidosNombres },
                { content: 'C.I.:' },
                { content: ci },
                { content: 'Expedido:' },
                { content: expedido }
            ],
            [
                { content: 'Departamento:' },
                { content: departamento },
                { content: 'Código:' },
                { content: codigoFuncionario, colSpan: 3 }
            ],
            [
                { content: 'ESFM/UA:' },
                { content: esfmUa, colSpan: 5 }
            ],
            [
                { content: 'Cargo:' },
                { content: cargo, colSpan: 5 }
            ]
        ]
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    // ── 4. TEXTO REGLAMENTARIO OFICIAL ─────────────────────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(0, 0, 0);

    const resolucionTexto =
        `La Dirección General de Formación de Maestros dependiente del Viceministerio de Educación Superior de Formación Profesional del Ministerio de Educación, desarrolló el proceso de Evaluación de Desempeño Profesional del Personal de las ESFM/UA, Gestión ${datos.periodo.gestion || '2026'} - ${datos.periodo.periodo || 'Primera Fase'}, en la cual se evaluó el cumplimiento de funciones profesionales para el desarrollo de una gestión académica e institucional acorde a los lineamientos, objetivos, principios del Modelo Educativo Sociocomunitario Productivo, en el marco de la Ley Nº 070 de la Educación "Avelino Siñani – Elizardo Pérez", Art. 53 y 57 del Reglamento General de las Escuelas Superiores de Formación de Maestras y Maestros/Unidades Académicas, aprobado mediante Resolución Ministerial Nº 2938/2017 de fecha 22 de diciembre de 2017 y Manual de Organización de Funciones de las ESFM/UA, aprobado con la Resolución Ministerial Nº 2726/2017 de fecha 20 de octubre de 2017.`;

    const splitTexto = doc.splitTextToSize(resolucionTexto, contentW);
    doc.text(splitTexto, margin, currentY, { align: 'justify', maxWidth: contentW });
    currentY += splitTexto.length * 3.3 + 3;

    // ── 5. PARÁMETROS DE RENDIMIENTO ──────────────────────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Los parámetros de rendimiento son:', margin, currentY);
    currentY += 2;

    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin + (contentW - 80) },
        tableWidth: 80,
        theme: 'grid',
        styles: {
            fontSize: 7.5,
            cellPadding: 1.4,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            textColor: [0, 0, 0],
            halign: 'center',
            font: 'helvetica',
        },
        headStyles: {
            fillColor: [229, 231, 235],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
        },
        head: [['Destacado', 'Bueno', 'Aceptable', 'Insuficiente']],
        body: [['91 – 100 puntos', '81 – 90 puntos', '61 – 80 puntos', '1 – 60 puntos']]
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    // ── 6. TABLA DE FORMULARIOS APLICADOS Y RESULTADO ────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('El resultado obtenido por su persona en los formularios aplicados, es el siguiente:', margin, currentY);
    currentY += 2;

    const calificacionCualitativa = getCalificacionOficial(datos.puntajeTotal);

    // Preparar filas de formularios
    const rowsFormularios: any[] = (datos.formularios.length > 0 ? datos.formularios : [
        { codigo: 'DO01', nombre: 'Evaluación del inmediato superior y dependientes.', pesoPorcentaje: 15, resultado: 0 },
        { codigo: 'DO02', nombre: 'Evaluación de Factores Asociados al Desempeño Profesional del Personal del PROFE.', pesoPorcentaje: 30, resultado: 0 },
        { codigo: 'DO03', nombre: 'Evaluación comunitaria.', pesoPorcentaje: 10, resultado: 0 },
        { codigo: 'DO04', nombre: 'Recolección y verificación de evidencias.', pesoPorcentaje: 45, resultado: 0 }
    ]).map((f, idx) => [
        { content: String(idx + 1), styles: { halign: 'center' } },
        { content: f.nombre },
        { content: `${f.pesoPorcentaje}%`, styles: { halign: 'center' } },
        { content: `${Math.round(f.resultado * 10) / 10}`, styles: { halign: 'center', fontStyle: 'bold' } }
    ]);

    // Fila final de Resultado y Calificación Total (Total: 5 columnas: 2 + 1 + 1 + 1)
    rowsFormularios.push([
        {
            content: 'RESULTADO Y CALIFICACIÓN TOTAL:',
            colSpan: 2,
            styles: { fontStyle: 'bold', halign: 'left' }
        },
        {
            content: calificacionCualitativa,
            styles: { fontStyle: 'bold', halign: 'center' }
        },
        {
            content: '100%',
            styles: { fontStyle: 'bold', halign: 'center' }
        },
        {
            content: `${Math.round(datos.puntajeTotal * 10) / 10}`,
            styles: { fontStyle: 'bold', halign: 'center' }
        }
    ]);

    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        tableWidth: contentW,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            textColor: [0, 0, 0],
            font: 'helvetica',
        },
        headStyles: {
            fillColor: [229, 231, 235],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
        },
        columnStyles: {
            0: { cellWidth: 14 },
            1: { cellWidth: 127.9 },
            2: { cellWidth: 22 },
            3: { cellWidth: 24 }
        },
        head: [['No.', 'Formulario Aplicado', '%', 'Resultado']],
        body: rowsFormularios
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;

    // ── 7. TEXTO DE VALORACIÓN CUALITATIVA ────────────────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('De acuerdo a la valoración realizada en la Evaluación de Desempeño su calificación es: ', margin, currentY);
    const labelW = doc.getTextWidth('De acuerdo a la valoración realizada en la Evaluación de Desempeño su calificación es: ');
    doc.setFont('helvetica', 'bold');
    doc.text(calificacionCualitativa, margin + labelW, currentY);

    // ── 8. SECCIÓN INFERIOR: QR & FIRMA DE RECEPCIÓN ──────────────────────────
    const bottomY = 222;

    // Código QR
    const qrCodeValue = datos.qrUrl || (
        typeof window !== 'undefined'
            ? `${window.location.origin}/verificar-evaluacion?code=${datos.codigoVerificacion || datos.evaluado.id || 'EVAL-2026'}`
            : `https://aulaprofe.minedu.gob.bo/verificar-evaluacion?code=${datos.codigoVerificacion || 'EVAL-2026'}`
    );

    try {
        const qrDataUrl = await QRCode.toDataURL(qrCodeValue, {
            margin: 0,
            width: 250,
            errorCorrectionLevel: 'M',
        });
        doc.addImage(qrDataUrl, 'PNG', margin + 2, bottomY, 26, 26);
    } catch {
        doc.rect(margin + 2, bottomY, 26, 26);
        doc.setFontSize(6);
        doc.text('QR CODE', margin + 8, bottomY + 14);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(0, 0, 0);
    const qrAclaracion = doc.splitTextToSize(
        'Por favor, valide que el QR corresponde a los resultados de la hoja oficial de evaluación firmada.',
        42
    );
    doc.text(qrAclaracion, margin + 2, bottomY + 29.5);

    // Firma de recepción
    const firmaX = pageW - margin - 75;
    const firmaY = bottomY + 18;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(firmaX, firmaY, firmaX + 65, firmaY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Recibido', firmaX + 32.5, firmaY + 4, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(apellidosNombres.toUpperCase(), firmaX + 32.5, firmaY + 8.5, { align: 'center' });

    // ── 9. PIE DE PÁGINA INFORMATIVO ──────────────────────────────────────────
    const footerY = 268;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(
        'En señal de aceptación de los resultados descritos, la parte evaluada ratifica este documento con su firma.',
        pageW / 2,
        footerY,
        { align: 'center' }
    );
}

/**
 * Descarga la Hoja de Concepto de una sola persona
 */
export async function descargarHojaConceptoIndividual(datos: HojaConceptoDatos): Promise<void> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
    });

    const logoBase64 = await loadLogoBase64();
    await renderHojaConceptoPagina(doc, datos, logoBase64);

    const filename = `Hoja_Concepto_${(datos.evaluado.nombreCompleto || 'Evaluacion').replace(/\s+/g, '_')}_${datos.periodo.gestion || '2026'}.pdf`;
    doc.save(filename);
}

/**
 * Genera y descarga un PDF consolidado con 1 página por persona (separado por persona)
 */
export async function descargarHojasConceptoMultiples(listaDatos: HojaConceptoDatos[], nombreArchivo?: string): Promise<void> {
    if (listaDatos.length === 0) return;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
    });

    const logoBase64 = await loadLogoBase64();

    for (let i = 0; i < listaDatos.length; i++) {
        if (i > 0) doc.addPage('letter', 'portrait');
        await renderHojaConceptoPagina(doc, listaDatos[i], logoBase64);
    }

    const filename = nombreArchivo || `Hojas_de_Concepto_Consolidado_PROFE_${listaDatos[0]?.periodo.gestion || '2026'}.pdf`;
    doc.save(filename);
}
