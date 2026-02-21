'use client';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import { Briefcase } from 'lucide-react';

export default function ConvocatoriasPage() {
    return (
        <GenericPageTemplate
            title="Convocatorias"
            description="Únete a nuestro equipo. Oportunidades laborales para profesionales comprometidos con la educación."
            icon={Briefcase}
        />
    );
}
