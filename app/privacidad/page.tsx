'use client';

import { ShieldCheck } from 'lucide-react';
import GenericPageTemplate from '@/components/GenericPageTemplate';

export default function PrivacidadPage() {
    return (
        <GenericPageTemplate
            title="Políticas de Privacidad"
            description="Compromiso absoluto con la protección y seguridad de los datos institucionales y personales del magisterio."
            icon={ShieldCheck}
        >
            <div className="max-w-4xl mx-auto space-y-16">
                <section className="space-y-8">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-950 dark:text-white">Transparencia y Seguridad</h2>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed">
                        Nuestra institución garantiza que la información recolectada a través de este portal se utiliza exclusivamente para fines académicos, administrativos y de comunicación oficial de acuerdo con la normativa nacional vigente.
                    </p>
                </section>

                <div className="grid grid-cols-1 gap-12">
                    {[
                        { t: 'Recolección de Datos', d: 'Solo solicitamos la información necesaria para procesos de inscripción, seguimiento académico y acreditación.' },
                        { t: 'Uso de Información', d: 'Tus datos son fundamentales para la emisión de certificaciones, carnets y registros ante las autoridades educativas.' },
                        { t: 'Compromiso Ético', d: 'No compartimos información personal con terceros para fines comerciales o publicitarios ajenos a la institución.' }
                    ].map((item, i) => (
                        <div key={i} className="p-10 rounded-[3rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
                            <h4 className="text-xl font-black uppercase tracking-widest text-primary-600">{item.t}</h4>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">{item.d}</p>
                        </div>
                    ))}
                </div>
            </div>
        </GenericPageTemplate>
    );
}
