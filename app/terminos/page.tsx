'use client';

import { FileText } from 'lucide-react';
import GenericPageTemplate from '@/components/GenericPageTemplate';

export default function TerminosPage() {
    return (
        <GenericPageTemplate
            title="Términos y Condiciones"
            description="Marco normativo y lineamientos éticos para el uso de la plataforma académica institucional."
            icon={FileText}
        >
            <div className="max-w-4xl mx-auto space-y-16">
                <section className="space-y-8">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-950 dark:text-white">Lineamientos Generales</h2>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed">
                        Al utilizar este portal, aceptas los términos de uso establecidos para garantizar un entorno académico respetuoso, seguro y eficiente para todo el magisterio.
                    </p>
                </section>

                <div className="space-y-12">
                    {[
                        { t: 'Uso de la Cuenta', d: 'El acceso al portal es personal e intransferible. El usuario es responsable de mantener la confidencialidad de sus credenciales.' },
                        { t: 'Propiedad Intelectual', d: 'Todo el contenido, diseños y materiales pedagógicos son propiedad de la institución y están protegidos por leyes de derecho de autor.' },
                        { t: 'Conducta Académica', d: 'Se espera un comportamiento ético en todas las interacciones, foros y procesos de evaluación dentro de la plataforma.' }
                    ].map((item, i) => (
                        <div key={i} className="flex gap-8 group">
                            <div className="w-12 h-12 rounded-2xl bg-primary-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shrink-0 text-lg font-black">{i + 1}</div>
                            <div className="space-y-4">
                                <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-950 dark:text-white group-hover:text-primary-600 transition-colors">{item.t}</h4>
                                <p className="text-lg text-slate-500 font-medium leading-relaxed">{item.d}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </GenericPageTemplate>
    );
}
