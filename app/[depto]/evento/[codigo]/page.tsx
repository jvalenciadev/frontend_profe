import EventoPublicoClient from '@/app/evento/[codigo]/EventoPublicoClient';
import publicService from '@/services/publicService';
import { eventoPublicoService } from '@/services/eventoPublicoService';
import { Metadata } from 'next';
import { stripHtml } from '@/lib/utils';

export const revalidate = 60;

interface PageProps {
    params: Promise<{ depto: string; codigo: string }>;
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

async function fetchEventoData(codigo: string): Promise<any> {
    if (!codigo) return null;

    try {
        const evt = await eventoPublicoService.getEvento(codigo);
        if (evt && (evt.nombre || evt.id)) return evt;
    } catch { }

    try {
        const data = await publicService.getLandingPageData();
        const found = (data.eventos || []).find((e: any) => e.codigo === codigo || String(e.id) === codigo);
        if (found) return found;
    } catch { }

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
        const departamentos = await publicService.getDepartamentos();

        const params: { depto: string; codigo: string }[] = [];

        for (const dep of departamentos) {
            const deptoCode = dep.abreviacion || dep.codigo;
            if (!deptoCode) continue;

            for (const evt of eventos) {
                params.push({
                    depto: deptoCode.toUpperCase(),
                    codigo: evt.codigo || evt.id.toString(),
                });
            }
        }

        return params;
    } catch (error) {
        return [];
    }
}

export default async function DepartmentalEventPage() {
    return <EventoPublicoClient />;
}
