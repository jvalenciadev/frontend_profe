import React from 'react';
import { publicService } from '@/services/publicService';
import OfertaDetailClient from './OfertaDetailClient';
import { Metadata } from 'next';

export const revalidate = 60; // ISR cada 60 segundos

interface Props {
    params: Promise<{ id: string }>; // En Next 15/16 params es una Promesa
}

/**
 * Metadata dinámica para SEO institucional
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { id } = await params;
        const programa = await publicService.getProgramaById(id);
        if (!programa) return { title: 'Programa no encontrado | PROFE' };

        return {
            title: `${programa.nombre} | Oferta Académica PROFE`,
            description: programa.descripcionCorta || `Infórmate sobre el programa ${programa.nombre}. Inscripciones abiertas.`,
            openGraph: {
                title: programa.nombre,
                description: programa.descripcionCorta,
                images: [programa.banner || programa.imagen || ''],
            },
        };
    } catch {
        return { title: 'Oferta Académica | PROFE' };
    }
}

/**
 * SSG: Genera los parámetros estáticos para todos los programas al momento del build
 */
export async function generateStaticParams() {
    try {
        const data = await publicService.getLandingPageData();
        return (data.programas || []).map((p: any) => ({
            id: p.id.toString(),
        }));
    } catch (error) {
        console.error('Error in generateStaticParams (Oferta):', error);
        return [];
    }
}

/**
 * Componente Servidor principal para la página de detalle de oferta
 */
export default async function OfertaDetailPage({ params }: Props) {
    const { id } = await params; // IMPORTANTE: Await params en Next.js 15/16

    // Fetch de datos en el servidor para SSG/ISR
    const [programa, landingData] = await Promise.all([
        publicService.getProgramaById(id).catch((err) => {
            console.error(`Error fetching programa ${id}:`, err.message);
            return null;
        }),
        publicService.getLandingPageData().catch(() => ({ profe: null }))
    ]);

    if (!programa) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-12">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-8 font-fraunces text-slate-900">Contenido no disponible</h1>
                <p className="text-slate-400 mb-12 uppercase tracking-widest text-sm max-w-md mx-auto">
                    El programa solicitado no existe, ha sido retirado o hubo un error de conexión con el servidor.
                </p>
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">ID: {id}</p>
                    <a href="/oferta" className="inline-block px-12 py-5 bg-slate-950 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all">
                        Volver al Catálogo
                    </a>
                </div>
            </div>
        );
    }

    return (
        <OfertaDetailClient 
            initialPrograma={programa} 
            profe={landingData.profe} 
        />
    );
}
