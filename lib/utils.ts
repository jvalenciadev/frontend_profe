import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) {
        return path;
    }

    // Lógica Senior: Si estamos en el navegador, usamos rutas relativas.
    // El proxy configurado en next.config.ts se encargará de redirigir a la API.
    if (typeof window !== 'undefined') {
        let normalizedPath = path.startsWith('/') ? path : `/${path}`;
        if (!normalizedPath.toLowerCase().startsWith('/uploads/') && !normalizedPath.toLowerCase().startsWith('uploads/')) {
            normalizedPath = `/uploads${normalizedPath}`;
        }
        return normalizedPath;
    }

    // Lógica para SSR (Servidor)
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    if (baseUrl.toLowerCase().endsWith('/api')) baseUrl = baseUrl.slice(0, -4);

    let normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (!normalizedPath.toLowerCase().startsWith('/uploads/') && !normalizedPath.toLowerCase().startsWith('uploads/')) {
        normalizedPath = `/uploads${normalizedPath}`;
    }

    return `${baseUrl}${normalizedPath}`;
}

export function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
}

export function formatEventShareText(evento: any, allModalidades?: any[]): string {
    if (!evento) return '';

    const tipoNombre = evento.tipo?.nombre || (typeof evento.tipo === 'string' ? evento.tipo : 'Taller');
    const titulo = `🗒️ ${tipoNombre}: ${evento.nombre || ''}`;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aulaprofe.minedu.gob.bo';
    const codigoUrl = evento.codigo || evento.id || '';
    const urlInscripciones = `🌐 Inscripciones: ${origin}/evento/${codigoUrl}`;

    let modalidadesTexto = '';
    if (Array.isArray(allModalidades) && allModalidades.length > 0 && evento.modalidadIds) {
        modalidadesTexto = (evento.modalidadIds || '').split(',').map((id: string) => {
            return allModalidades.find((m: any) => m.id === id.trim())?.nombre;
        }).filter(Boolean).join(', ');
    }
    if (!modalidadesTexto) {
        modalidadesTexto = evento.modalidades || evento.modalidad || 'Presencial';
    }
    const modalidadText = `🟢 Modalidad de participación: ${modalidadesTexto}`;

    const lugarText = `✅ Lugar: ${evento.lugar || 'Por definir'}`;

    let fechaFormateada = 'Por definir';
    if (evento.fecha) {
        try {
            const dateStr = String(evento.fecha).trim();
            const datePart = dateStr.split('T')[0];
            const parts = datePart.split('-');
            if (parts.length === 3) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                const d = parseInt(parts[2], 10);
                const MESES = [
                    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
                ];
                if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12) {
                    fechaFormateada = `${d} ${MESES[m - 1]} de ${y}`;
                }
            }
            if (fechaFormateada === 'Por definir') {
                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) {
                    fechaFormateada = parsed.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                } else {
                    fechaFormateada = dateStr;
                }
            }
        } catch {
            fechaFormateada = String(evento.fecha);
        }
    }
    const fechaText = `🗓️ Fecha: ${fechaFormateada}`;

    let aficheLine = '';
    const afichePath = evento.afiche || evento.banner;
    if (afichePath) {
        const fullImg = getImageUrl(afichePath);
        const absoluteImgUrl = fullImg.startsWith('http') ? fullImg : `${origin}${fullImg}`;
        aficheLine = `\n🖼️ Afiche: ${absoluteImgUrl}`;
    }

    return `${titulo}\n${urlInscripciones}\n${modalidadText}\n${lugarText}\n${fechaText}${aficheLine}`;
}

