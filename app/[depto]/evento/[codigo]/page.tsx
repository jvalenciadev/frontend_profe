import EventoPublicoClient from '@/app/evento/[codigo]/EventoPublicoClient';
import publicService from '@/services/publicService';

/**
 * REVALIDACIÓN (ISR):
 * Revalidación periódica para mantener fresca la información del evento departamental.
 */
export const revalidate = 60;

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
 * Ejemplo: /LP/evento/bases-para-la-implementacion-de-la-educacion-inclusiva
 * Ejemplo: /CB/evento/bases-para-la-implementacion-...
 */
export default async function DepartmentalEventPage() {
    return <EventoPublicoClient />;
}
