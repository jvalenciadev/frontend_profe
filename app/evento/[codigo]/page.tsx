import EventoPublicoClient from './EventoPublicoClient';
import publicService from '@/services/publicService';
import { eventoPublicoService } from '@/services/eventoPublicoService';
import { Metadata } from 'next';
import { stripHtml } from '@/lib/utils';

/**
 * REVALIDACIÓN (ISR):
 * Cada 60 segundos, Next.js intentará actualizar la versión estática de la página
 * si hay nuevas visitas. Esto garantiza que la info del evento esté siempre fresca.
 */
export const revalidate = 60;

interface PageProps {
    params: Promise<{ codigo: string }>;
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
 * Genera dinámicamente las etiquetas HTML Open Graph (og:image, og:title, og:description)
 * y Twitter Card para que WhatsApp, Facebook, Telegram, etc., muestren la imagen del afiche
 * del evento en la previsualización al compartir la URL.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const resolvedParams = await (params as any);
        const codigo = resolvedParams?.codigo;
        if (!codigo) return { title: 'Evento | PROFE' };

        const evento = await eventoPublicoService.getEvento(codigo);
        if (!evento) return { title: 'Evento | PROFE' };

        const title = `${evento.nombre} | PROFE`;
        const description = stripHtml(evento.descripcion || '').slice(0, 160) || 'Evento del Programa de Formación Especializada (PROFE)';
        
        const imagePath = evento.afiche || evento.banner;
        const imageUrl = getAbsoluteImageUrl(imagePath);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aulaprofe.minedu.gob.bo';
        const pageUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/evento/${codigo}`;

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
 * Esta es la función que convierte las rutas dinámicas en estáticas durante el build.
 */
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

/**
 * SERVER COMPONENT:
 * Componente de servidor que permite a Next.js manejar el SEO, Open Graph y la generación estática.
 */
export default async function Page() {
    return <EventoPublicoClient />;
}
