import React from 'react';
import publicService from '@/services/publicService';
import BlogDetailClient from './BlogDetailClient';
import { Metadata } from 'next';

// ISR - 1 minuto
export const revalidate = 60;

interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Genera metadatos dinámicos para SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    
    try {
        const data = await publicService.getLandingPageData();
        const post = data.blogs?.find((b: any) => String(b.id) === id);

        if (!post) return { title: 'Artículo | PROFE' };

        return {
            title: `${post.titulo} | Blog PROFE`,
            description: post.subtitulo || post.descripcion,
            openGraph: {
                title: post.titulo,
                description: post.subtitulo,
                type: 'article',
                publishedTime: post.fecha,
                authors: [post.autor || 'Consejo Editorial PROFE'],
            }
        };
    } catch {
        return { title: 'Blog | PROFE' };
    }
}

/**
 * Pre-renderiza las rutas estáticas basadas en los blogs existentes
 */
export async function generateStaticParams() {
    try {
        const data = await publicService.getLandingPageData();
        return (data.blogs || []).map((post: any) => ({
            id: String(post.id),
        }));
    } catch {
        return [];
    }
}

export default async function BlogDetailPage({ params }: PageProps) {
    const { id } = await params;
    
    try {
        const data = await publicService.getLandingPageData();
        let post = data.blogs?.find((b: any) => String(b.id) === id);
        const profe = data.profe || null;

        if (!post) {
            post = await publicService.getBlogById(id);
        }

        return <BlogDetailClient post={post} profe={profe} />;
    } catch (error) {
        return <BlogDetailClient post={null} />;
    }
}
