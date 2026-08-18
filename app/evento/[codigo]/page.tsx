import EventoPublicoClient from './EventoPublicoClient';
import publicService from '@/services/publicService';
import { eventoPublicoService } from '@/services/eventoPublicoService';
import { Metadata } from 'next';
import { stripHtml } from '@/lib/utils';

export const revalidate = 60;

interface PageProps {
    params: Promise<{ codigo: string }>;
}

function getAbsoluteImageUrl(path?: string | null): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aulaprofe.minedu.gob.bo';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    if (!path) return `${cleanBase}/og-default.jpg`;
    if (path.startsWith('http')) return path;

    let normalized = path.startsWith('/') ? path : `/${path}`;
    if (!normalized.toLowerCase().startsWith('/uploads/')) {
        normalized = `/uploads${normalized}`;
    }
    return `${cleanBase}${normalized}`;
}

/**
 * Carga robusta de datos del evento para SSR (Server-Side Rendering)
 */
async function fetchEventoData(codigo: string): Promise<any> {
    if (!codigo) return null;

    // 1. Vía eventoPublicoService
    try {
        const evt = await eventoPublicoService.getEvento(codigo);
        if (evt && (evt.nombre || evt.id)) return evt;
    } catch (e) {
        console.error('[generateMetadata] Error en getEvento:', e);
    }

    // 2. Vía landing page data
    try {
        const data = await publicService.getLandingPageData();
        const found = (data.eventos || []).find((e: any) => e.codigo === codigo || String(e.id) === codigo);
        if (found) return found;
    } catch (e) {
        console.error('[generateMetadata] Error en getLandingPageData:', e);
    }

    // 3. Direct fetch a backend URLs
    const viewsUrl = process.env.NEXT_PUBLIC_VIEWS_API_URL || process.env.VIEWS_API_URL || 'https://aulaprofe.minedu.gob.bo/api/views';
    const endpoints = [
        `https://aulaprofe.minedu.gob.bo/api/views/public/eventos/${codigo}`,
        `${viewsUrl.endsWith('/') ? viewsUrl.slice(0, -1) : viewsUrl}/public/eventos/${codigo}`,
        `http://127.0.0.1:3005/public/eventos/${codigo}`
    ];

    for (const url of endpoints) {
        try {
            const res = await fetch(url, {
                headers: { 'X-SECRET': process.env.NEXT_PUBLIC_API_SECRET || 'qjmwyxYXMqe' },
                next: { revalidate: 60 }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && (data.nombre || data.id)) return data;
            }
        } catch { }
    }

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

        const imagePath = evento.afiche || evento.banner;
        const imageUrl = getAbsoluteImageUrl(imagePath);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aulaprofe.minedu.gob.bo';
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const pageUrl = `${cleanBase}/evento/${codigo}`;

        return {
            title: `${title} | PROFE`,
            description,
            metadataBase: new URL(cleanBase),
            openGraph: {
                title,
                description,
                url: pageUrl,
                siteName: 'PROFE - Ministerio de Educación',
                images: [
                    {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: evento.nombre,
                        type: 'image/jpeg',
                    },
                ],
                locale: 'es_BO',
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title,
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

export async function generateStaticParams() {
    try {
        const data = await publicService.getLandingPageData();
        const eventos = data.eventos || [];

        return eventos.map((evt: any) => ({
            codigo: evt.codigo || evt.id.toString(),
        }));
    } catch (error) {
        console.error("Error en generateStaticParams (eventos):", error);
        return [];
    }
}

export default async function Page() {
    return <EventoPublicoClient />;
}
