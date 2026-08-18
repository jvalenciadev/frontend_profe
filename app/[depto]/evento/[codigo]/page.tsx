import EventoPublicoClient from '@/app/evento/[codigo]/EventoPublicoClient';
import publicService from '@/services/publicService';
import { eventoPublicoService } from '@/services/eventoPublicoService';
import { Metadata } from 'next';
import { stripHtml } from '@/lib/utils';

/**
 * REVALIDACIÓN (ISR):
 * Revalidación periódica para mantener fresca la información del evento departamental.
 */
export const revalidate = 60;

interface PageProps {
    params: Promise<{ depto: string; codigo: string }>;
}

function getAbsoluteImageUrl(path?: string | null): string {
    if (!path) return 'https://aulaprofe.minedu.gob.bo/og-default.jpg';
    if (path.startsWith('http')) return path;

    let normalized = path.startsWith('/') ? path : `/${path}`;
    if (!normalized.toLowerCase().startsWith('/uploads/') && !normalized.toLowerCase().startsWith('uploads/')) {
        normalized = `/uploads${normalized}`;
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aulaprofe.minedu.gob.bo';
    return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${normalized}`;
}

/**
 * GENERATE METADATA:
 * Genera metadatos Open Graph (og:image) para vistas departamentales del evento.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const resolvedParams = await (params as any);
        const codigo = resolvedParams?.codigo;
        const depto = resolvedParams?.depto;
        if (!codigo) return { title: 'Evento | PROFE' };

        const evento = await eventoPublicoService.getEvento(codigo);
        if (!evento) return { title: 'Evento | PROFE' };

        const title = `${evento.nombre} | PROFE`;
        const description = stripHtml(evento.descripcion || '').slice(0, 160) || 'Evento del Programa de Formación Especializada (PROFE)';

        const imagePath = evento.afiche || evento.banner;
        const imageUrl = getAbsoluteImageUrl(imagePath);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aulaprofe.minedu.gob.bo';
        const pageUrl = depto
            ? `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/${depto}/evento/${codigo}`
            : `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/evento/${codigo}`;

        return {
            title,
            description,
            openGraph: {
                title: evento.nombre,
                description,
                url: pageUrl,
                siteName: 'PROFE - Ministerio de Educación',
                images: [
                    {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: evento.nombre,
                    },
                ],
                locale: 'es_BO',
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: evento.nombre,
                description,
                images: [imageUrl],
            },
        };
    } catch {
        return { title: 'Evento | PROFE' };
    }
}

/**
 * GENERATE STATIC PARAMS (●):
 * Permite generación dinámica de parámetros departamentales.
 */
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

/**
 * SERVER COMPONENT PARA EVENTOS DEPARTAMENTALES (/[depto]/evento/[codigo])
 */
export default async function DepartmentalEventPage() {
    return <EventoPublicoClient />;
}
