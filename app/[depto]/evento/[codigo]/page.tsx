import EventoPublicoClient from '@/app/evento/[codigo]/EventoPublicoClient';
import publicService from '@/services/publicService';
import { Metadata } from 'next';
import { stripHtml } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ depto: string; codigo: string }>;
}

function getAbsoluteImageUrl(path?: string | null): string {
    const siteBase = 'https://aulaprofe.minedu.gob.bo';

    if (!path) return `${siteBase}/og-default.jpg`;
    if (path.startsWith('http')) return path;

    let normalized = path.startsWith('/') ? path : `/${path}`;
    if (!normalized.toLowerCase().startsWith('/uploads/')) {
        normalized = `/uploads${normalized}`;
    }
    return `${siteBase}${normalized}`;
}

async function fetchEventoData(codigo: string): Promise<any> {
    if (!codigo) return null;

    const viewsUrl = (
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
            console.log(`[OG-depto] fetchEvento: ${url}`);
            const res = await fetch(url, {
                headers: { 'X-SECRET': secret },
                cache: 'no-store',
                signal: AbortSignal.timeout(5000),
            });
            if (res.ok) {
                const data = await res.json();
                if (data && (data.nombre || data.id)) return data;
            } else {
                console.warn(`[OG-depto] HTTP ${res.status} en ${url}`);
            }
        } catch (e) {
            console.warn(`[OG-depto] Error en ${url}:`, e);
        }
    }

    try {
        const data = await publicService.getLandingPageData();
        const found = (data.eventos || []).find((e: any) => e.codigo === codigo || String(e.id) === codigo);
        if (found) return found;
    } catch { }

    return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const resolvedParams = await (params as any);
        const codigo = resolvedParams?.codigo;
        const depto = resolvedParams?.depto;
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
        const pageUrl = depto 
            ? `${cleanBase}/${depto}/evento/${codigo}`
            : `${cleanBase}/evento/${codigo}`;

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
                        type: 'image/jpeg',
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

export default async function DepartmentalEventPage() {
    return <EventoPublicoClient />;
}
