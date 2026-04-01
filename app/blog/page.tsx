import React from 'react';
import publicService from '@/services/publicService';
import BlogListClient from './BlogListClient';

// Habilitar Regeneración Estática Incremental (ISR) - 1 minuto
export const revalidate = 60;

export default async function BlogPage() {
    let blogs = [];
    let profe = null;
    
    try {
        // Obtenemos los datos de la landing (donde están los blogs y la info institucional)
        const data = await publicService.getLandingPageData();
        blogs = data.blogs || [];
        profe = data.profe || null;
    } catch (error) {
        console.error('Error fetching blogs for SSG:', error);
    }

    return <BlogListClient initialBlogs={blogs} profe={profe} />;
}
