import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 60,
        fontSize: 11,
        fontFamily: 'Helvetica',
        lineHeight: 1.6,
        color: '#000',
    },
    title: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 30,
        textDecoration: 'underline',
    },
    paragraph: {
        marginBottom: 15,
        textAlign: 'justify',
    },
    bold: {
        fontFamily: 'Helvetica-Bold',
    },
    signatureSection: {
        marginTop: 100,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '45%',
        borderTopWidth: 1,
        borderTopColor: '#000',
        textAlign: 'center',
        paddingTop: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 8,
        color: '#666',
    }
});

interface CompromisoReportProps {
    inscripcion: any;
    oferta: any;
}

export const CompromisoReport = ({ inscripcion, oferta }: CompromisoReportProps) => (
    <Document>
        <Page style={styles.page}>
            <Text style={styles.title}>DOCUMENTO DE COMPROMISO Y ACEPTACIÓN</Text>

            <Text style={styles.paragraph}>
                Yo, <Text style={styles.bold}>{inscripcion.persona?.nombre} {inscripcion.persona?.apellidos}</Text>, con Cédula de Identidad <Text style={styles.bold}>{inscripcion.persona?.nroDocumento} {inscripcion.persona?.expedido}</Text>, declaro de manera libre y voluntaria mi inscripción en el programa académico denominado <Text style={styles.bold}>"{oferta.nombre}"</Text>, correspondiente a la gestión <Text style={styles.bold}>{oferta.version?.gestion || '2026'}</Text>.
            </Text>

            <Text style={styles.paragraph}>
                Al suscribir el presente documento, me comprometo formalmente a cumplir con los siguientes puntos:
            </Text>

            <View style={{ marginLeft: 20 }}>
                <Text style={styles.paragraph}>1. Asistir puntualmente a las sesiones programadas en el turno <Text style={styles.bold}>{inscripcion.turno?.turnoConfig?.nombre || 'asignado'}</Text>.</Text>
                <Text style={styles.paragraph}>2. Realizar el pago total de la inversión establecida (Bs. {oferta.costo}) según el cronograma de pagos vigente.</Text>
                <Text style={styles.paragraph}>3. Respetar las normas académicas y disciplinarias de la institución PROFE.</Text>
                <Text style={styles.paragraph}>4. Presentar toda la documentación física requerida en los plazos establecidos.</Text>
            </View>

            <Text style={styles.paragraph}>
                En caso de incumplimiento de mis obligaciones económicas o académicas, acepto que la institución pueda suspender mi acceso a la plataforma virtual y anular mi certificación final sin derecho a reclamos posteriores.
            </Text>

            <Text style={styles.paragraph}>
                Para constancia del compromiso adquirido, firmo el presente documento en la ciudad de {oferta.sede?.nombre || 'La Paz'}, a los {new Date().getDate()} días del mes de {new Date().toLocaleString('es-ES', { month: 'long' })} de {new Date().getFullYear()}.
            </Text>

            <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                    <Text style={styles.bold}>FIRMA DEL PARTICIPANTE</Text>
                    <Text>C.I. {inscripcion.persona?.nroDocumento}</Text>
                </View>
                <View style={styles.signatureBox}>
                    <Text style={styles.bold}>POR LA INSTITUCIÓN</Text>
                    <Text>Sello y Firma</Text>
                </View>
            </View>

            <Text style={styles.footer}>Generado electrónicamente por PROFE LMS - {new Date().toISOString()}</Text>
        </Page>
    </Document>
);
