import EventoPublicoClient from './EventoPublicoClient';
import publicService from '@/services/publicService';

/**
 * REVALIDACIÓN (ISR):
 * Cada 60 segundos, Next.js intentará actualizar la versión estática de la página
 * si hay nuevas visitas. Esto garantiza que la info del evento esté siempre fresca.
 */
export const revalidate = 60;

/**
 * GENERATE STATIC PARAMS (●):
 * Esta es la función que convierte las rutas dinámicas en estáticas durante el build.
 * Next.js llamará a tu servicio, obtendrá todos los eventos y creará los archivos HTML
 * para cada uno de ellos de forma anticipada. 
 * ¡Esto hace que las páginas carguen instantáneamente!
 */
export async function generateStaticParams() {
    try {
        // Obtenemos todos los eventos disponibles del servicio público
        const data = await publicService.getLandingPageData();
        const eventos = data.eventos || [];

        // Retornamos un array con los parámetros para cada página dinámica.
        // El nombre de la clave (codigo) debe coincidir con el nombre de la carpeta [codigo].
        return eventos.map((evt: any) => ({
            codigo: evt.codigo || evt.id.toString(),
        }));
    } catch (error) {
        console.error("Error en generateStaticParams (eventos):", error);
        // Si falla, devolvemos un array vacío. Las páginas se generarán dinámicamente.
        return [];
    }
}

/**
 * SERVER COMPONENT:
 * Este archivo ya no tiene 'use client' al principio, lo que lo convierte en un 
 * componente de servidor. Esto permite a Next.js manejar el SEO y la generación estática.
 * 
 * Toda la interactividad (formularios, timers, animaciones) se queda guardada 
 * en 'EventoPublicoClient.tsx'.
 */
export default async function Page() {
    return <EventoPublicoClient />;
}
