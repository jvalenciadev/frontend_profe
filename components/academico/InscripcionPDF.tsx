import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { getImageUrl } from '@/lib/utils';

// Styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 10
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textTransform: 'uppercase'
    },
    subtitle: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 2
    },
    section: {
        marginTop: 20,
        marginBottom: 10
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: '#f8fafc',
        padding: 5,
        color: '#1e3a8a',
        marginBottom: 10,
        textTransform: 'uppercase'
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    field: {
        width: '48%',
        marginBottom: 8
    },
    label: {
        fontSize: 8,
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 2
    },
    value: {
        fontSize: 10,
        color: '#1e293b',
        fontWeight: 'bold'
    },
    table: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden'
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    col1: { width: '40%', fontSize: 9 },
    col2: { width: '30%', fontSize: 9 },
    col3: { width: '30%', fontSize: 9, textAlign: 'right' },
    summary: {
        marginTop: 20,
        alignItems: 'flex-end'
    },
    total: {
        flexDirection: 'row',
        gap: 10,
        padding: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 4
    },
    commitment: {
        marginTop: 40,
        padding: 20,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
        borderRadius: 8
    },
    commitmentTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10
    },
    commitmentText: {
        fontSize: 8,
        lineHeight: 1.6,
        color: '#475569',
        textAlign: 'justify'
    },
    signatures: {
        marginTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    signatureLine: {
        width: 150,
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 5,
        alignItems: 'center'
    },
    signatureText: {
        fontSize: 8,
        color: '#64748b'
    }
});

interface Props {
    inscripcion: any;
    profe?: any;
}

export const InscripcionPDF: React.FC<Props> = ({ inscripcion: ins, profe }) => {
    // Buscar respuestas extras para los espacios punteados
    const extra = ins.respuestasExtra || [];
    const getExtraVal = (labelPart: string) => {
        const found = extra.find((e: any) => e.campoExtra?.mod_ce_label?.toLowerCase().includes(labelPart.toLowerCase()));
        return found ? found.valor : '................................';
    };

    const ue = getExtraVal('unidad educativa');
    const gestion = getExtraVal('gestión');
    const domicilio = ins.persona?.direccion || '................................';
    const ciudad = ins.sede?.nombre || 'La Paz';

    return (
        <Document>
            {/* PAGINA 1: CARTA DE COMPROMISO */}
            <Page size="LETTER" style={styles.page}>
                {/* Fondo de Hoja Completa */}
                <Image 
                    src="/fondo_doc.jpg" 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    }} 
                />

                <View style={{ position: 'relative' }}>
                    <View style={{ textAlign: 'center', marginBottom: 15, marginTop: 30 }}>
                        <Text style={{ fontSize: 11, marginBottom: 3 }}>FORMULARIO DE COMPROMISO DE PERMANENCIA Y CONCLUSIÓN</Text>
                        <Text style={{ fontSize: 11 }}>PROGRAMA PUENTE "NIVELACIÓN PARA EL FUTURO"</Text>
                    </View>

                    <Text style={{ fontSize: 9, lineHeight: 1.25, textAlign: 'justify', marginBottom: 8 }}>
                        Yo, {ins.persona?.nombre} {ins.persona?.apellidos}, con Cédula de Identidad N° {ins.persona?.nroDocumento}, expedido en {ins.persona?.expedido || '.......'}, bachiller de la unidad educativa/centro de educación alternativa {ue} gestión {gestion}, domiciliado en {domicilio}, número de celular {ins.persona?.celular || '.......'} y correo electrónico {ins.persona?.email || '.......'}.
                    </Text>

                    <Text style={{ fontSize: 9, lineHeight: 1.2, textAlign: 'justify', marginBottom: 8 }}>
                        En pleno uso de mis facultades y habiendo sido informada(o) de las características, requisitos y exigencias del Programa Puente "Nivelación para el Futuro", manifiesto mi voluntad de participar en el mismo y asumo los siguientes COMPROMISOS:
                    </Text>

                    <Text style={{ fontSize: 9, lineHeight: 1.2, textAlign: 'justify', marginBottom: 6 }}>
                        PRIMERO (Asistencia y Permanencia), me comprometo a asistir de manera puntual y regular a la totalidad de las sesiones del programa, tanto a las actividades presenciales como a las virtuales, durante las 16 semanas de duración. Entiendo que la inasistencia injustificada a más del 50% de las sesiones dará lugar a mi exclusión automática del programa.
                    </Text>

                    <Text style={{ fontSize: 9, lineHeight: 1.2, textAlign: 'justify', marginBottom: 6 }}>
                        SEGUNDO (Dedicación y Aprovechamiento), me comprometo a dedicar el tiempo y el esfuerzo necesarios para cumplir con las 240 horas pedagógicas del programa. Esto incluye la participación activa en clases, la realización de tareas, trabajos prácticos y evaluaciones en las áreas de Lenguaje y Matemática, con el objetivo de fortalecer mis competencias académicas.
                    </Text>

                    <Text style={{ fontSize: 9, lineHeight: 1.2, textAlign: 'justify', marginBottom: 6 }}>
                        TERCERO (Recursos y Conectividad), declaro que cuento con un dispositivo móvil inteligente o computadora y con acceso a internet (móvil o wifi) que me permitirán participar sin inconvenientes en las actividades virtuales del programa, siendo consciente de que la falta de estos no será una excusa válida para el incumplimiento.
                    </Text>

                    <Text style={{ fontSize: 9, lineHeight: 1.2, textAlign: 'justify', marginBottom: 6 }}>
                        CUARTO (Normas de Convivencia), me comprometo a mantener un comportamiento respetuoso, ético y colaborativo con mis Facilitadores, Tutores y Compañeros, tanto en los espacios presenciales como en las Plataformas virtuales, contribuyendo a un ambiente de aprendizaje propositivo, proactivo y participativo.
                    </Text>

                    <Text style={{ fontSize: 9, lineHeight: 1.2, textAlign: 'justify', marginBottom: 8 }}>
                        QUINTO (Veracidad de la Información), afirmo que los datos proporcionados en mi ficha de inscripción son verídicos y que no me encuentro cursando actualmente ninguna carrera en educación superior, cumpliendo así con uno de los requisitos de participación.
                    </Text>

                    <Text style={{ fontSize: 9, marginBottom: 20 }}>
                        Para constancia y en señal de conformidad, firmo el presente compromiso en la ciudad de {ciudad}, a los {new Date().getDate()} días del mes de {new Date().toLocaleString('es-ES', { month: 'long' })} de 2026.
                    </Text>

                    <View style={{ marginTop: 25, alignItems: 'center' }}>
                        <View style={{ width: 180, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 4, alignItems: 'center' }}>
                            <Text style={{ fontSize: 9 }}>Firma del Estudiante</Text>
                            <Text style={{ fontSize: 8 }}>Nombres y apellidos: {ins.persona?.nombre} {ins.persona?.apellidos}</Text>
                            <Text style={{ fontSize: 8 }}>CI: {ins.persona?.nroDocumento} {ins.persona?.expedido}</Text>
                        </View>
                    </View>

                    <View style={{ marginTop: 25 }}>
                        <Text style={{ fontSize: 8, fontStyle: 'italic', textAlign: 'center' }}>El presente documento tiene carácter de declaración jurada</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
