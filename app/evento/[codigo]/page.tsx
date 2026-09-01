import EventoPublicoClient from './EventoPublicoClient';
import publicService from '@/services/publicService';
import { Metadata } from 'next';
import { stripHtml } from '@/lib/utils';

/**
 * RENDERIZADO DINÁMICO (Force Dynamic):
 * Fuerza a Next.js a evaluar generateMetadata dinámicamente en cada solicitud de WhatsApp / redes sociales
 * para garantizar la imagen og:image y metadatos actualizados desde el backend.
 */
// ISR: revalida cada 5 minutos → el crawler obtiene HTML con meta tags sin timeout
export const revalidate = 300;

interface PageProps {
    params: Promise<{ codigo: string }>;
}

function getAbsoluteImageUrl(path?: string | null): string {
    // Usar directamente la URL del backend para evitar el proxy /uploads de Next.js
    // WhatsApp debe poder acceder directamente a la imagen sin reescritura
    const apiBase = (
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_URL ||
        'http://172.20.34.60:3000'
    ).replace(/\/api$/, '').replace(/\/$/, '');

    const siteBase = 'https://aulaprofe.minedu.gob.bo';

    if (!path) return `${siteBase}/og-default.jpg`;
    if (path.startsWith('http')) return path;

    let normalized = path.startsWith('/') ? path : `/${path}`;
    if (!normalized.toLowerCase().startsWith('/uploads/')) {
        normalized = `/uploads${normalized}`;
    }
    // Intentar con la URL pública primero (accesible por WhatsApp)
    return `${siteBase}${normalized}`;
}

/**
 * Carga de datos del evento para SSR
 */
async function fetchEventoData(codigo: string): Promise<any> {
    if (!codigo) return null;

    const viewsUrl = (
        // VIEWS_API_URL sin prefijo NEXT_PUBLIC_ = disponible solo en servidor (runtime)
        // http://backend:3005 = nombre de servicio Docker (red interna, más confiable que IP)
        process.env.VIEWS_API_URL ||
        process.env.NEXT_PUBLIC_VIEWS_API_URL ||
        'http://172.20.34.60:3005'
    ).replace(/\/$/, '');
    const secret = process.env.API_SECRET || process.env.NEXT_PUBLIC_API_SECRET || 'mQsYt86mu5wiiqjmwyxYXMqeHVo4lRqIT6dQUwqYqzM=';

    const endpoints = [
        `${viewsUrl}/public/eventos/${codigo}`,
        `http://172.20.34.60:3005/public/eventos/${codigo}`,
        `http://127.0.0.1:3005/public/eventos/${codigo}`,
    ];

    for (const url of endpoints) {
        try {
            console.log(`[OG] fetchEvento: ${url}`);
            const res = await fetch(url, {
                headers: { 'X-SECRET': secret },
                next: { revalidate: 300 },
                signal: AbortSignal.timeout(5000),
            });
            if (res.ok) {
                const data = await res.json();
                if (data && (data.nombre || data.id)) {
                    console.log(`[OG] Evento encontrado: ${data.nombre}`);
                    return data;
                }
            } else {
                console.warn(`[OG] HTTP ${res.status} en ${url}`);
            }
        } catch (e) {
            console.warn(`[OG] Error en ${url}:`, e);
        }
    }

    // Fallback: landing page data
    try {
        const data = await publicService.getLandingPageData();
        const found = (data.eventos || []).find((e: any) => e.codigo === codigo || String(e.id) === codigo);
        if (found) return found;
    } catch { }

    return null;
}

/**
 * GENERATE METADATA:
 * Genera metadatos dinámicos Open Graph (og:title, og:description, og:image) para
 * previsualización de tarjetas en WhatsApp, Telegram, Facebook, etc.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const resolvedParams = await (params as any);
        const codigo = resolvedParams?.codigo;
        const evento = codigo ? await fetchEventoData(codigo) : null;

        if (!evento) {
            return {
                title: 'Evento | PROFE',
                description: 'Programa de Formación Especializada - Ministerio de Educación de Bolivia',
            };
        }

        const tipoNombre = evento.tipo?.nombre || (typeof evento.tipo === 'string' ? evento.tipo : 'TALLER');
        const title = `${tipoNombre.toUpperCase()}: ${evento.nombre}`;
        const rawDesc = stripHtml(evento.descripcion || '').trim();
        const description = rawDesc.length > 0
            ? (rawDesc.length > 200 ? `${rawDesc.slice(0, 197)}...` : rawDesc)
            : `Inscríbete al evento ${evento.nombre} en el Ministerio de Educación.`;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aulaprofe.minedu.gob.bo';
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const pageUrl = `${cleanBase}/evento/${codigo}`;

        // OG image servida desde el propio dominio Next.js → siempre accesible por crawlers
        const imageUrl = `${cleanBase}/api/og/${codigo}`;

        return {
            title: `${title} | PROFE`,
            description,
            metadataBase: new URL(cleanBase),
            openGraph: {
                title: `${title} | PROFE`,
                description,
                url: pageUrl,
                siteName: 'PROFE - Ministerio de Educación',
                images: [
                    {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: evento.nombre,
                        type: 'image/png',
                    },
                ],
                locale: 'es_BO',
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: `${title} | PROFE`,
                description,
                images: [imageUrl],
            },
        };
    } catch {
        return {
            title: 'Evento | PROFE',
            description: 'Programa de Formación Especializada - Ministerio de Educación de Bolivia',
        };
    }
}

export default async function Page() {
    return <EventoPublicoClient />;
}
