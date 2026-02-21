'use client';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import { BookOpen } from 'lucide-react';

export default function NoticiasPage() {
    return (
        <GenericPageTemplate
            title="Noticias y Blog"
            description="Actualidad educativa, artículos científicos y novedades del Programa de Formación Especializada."
            icon={BookOpen}
        />
    );
}
