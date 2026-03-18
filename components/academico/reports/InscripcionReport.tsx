import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register a font for a more professional look
Font.register({
    family: 'Helvetica-Bold',
    src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptug8zPX_3oLJhcGIhdlzVCyQ.woff2'
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottom: 2,
        borderBottomColor: '#1d4ed8', // primary azul
        paddingBottom: 10,
        marginBottom: 20,
    },
    logo: {
        width: 60,
        height: 60,
    },
    titleContainer: {
        textAlign: 'right',
    },
    mainTitle: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#1d4ed8',
    },
    subtitle: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        backgroundColor: '#f3f4f6',
        padding: 6,
        marginBottom: 10,
        borderRadius: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    label: {
        width: 120,
        fontFamily: 'Helvetica-Bold',
        color: '#4b5563',
    },
    value: {
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: 'center',
        borderTop: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10,
        color: '#9ca3af',
        fontSize: 8,
    },
    signatureArea: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    signatureLine: {
        width: 150,
        borderTopWidth: 1,
        borderTopColor: '#000',
        textAlign: 'center',
        paddingTop: 5,
        fontSize: 9,
    }
});

interface InscripcionReportProps {
    inscripcion: any;
    oferta: any;
}

export const InscripcionReport = ({ inscripcion, oferta }: InscripcionReportProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}>PROFE</Text>
                    <Text>Sistema de Gestión Académica</Text>
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.mainTitle}>COMPROBANTE DE INSCRIPCIÓN</Text>
                    <Text style={styles.subtitle}>Nro. Registro: {inscripcion.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={styles.subtitle}>Fecha: {new Date().toLocaleDateString()}</Text>
                </View>
            </View>

            {/* Datos del Participante */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>DATOS DEL PARTICIPANTE</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nombres y Apellidos:</Text>
                    <Text style={styles.value}>{inscripcion.persona?.nombre} {inscripcion.persona?.apellidos}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Nro. Documento:</Text>
                    <Text style={styles.value}>{inscripcion.persona?.nroDocumento} {inscripcion.persona?.expedido}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Celular:</Text>
                    <Text style={styles.value}>{inscripcion.persona?.celular || 'S/N'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Correo Electrónico:</Text>
                    <Text style={styles.value}>{inscripcion.persona?.correo || 'S/N'}</Text>
                </View>
            </View>

            {/* Datos del Programa */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>DETALLES DEL PROGRAMA</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Programa:</Text>
                    <Text style={styles.value}>{oferta.nombre}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Sede:</Text>
                    <Text style={styles.value}>{oferta.sede?.nombre}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Turno:</Text>
                    <Text style={styles.value}>{inscripcion.turno?.turnoConfig?.nombre || 'General'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Inversión Total:</Text>
                    <Text style={styles.value}>Bs. {oferta.costo}</Text>
                </View>
            </View>

            {/* Estado Financiero */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ESTADO FINANCIERO Y PAGOS</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Monto Pagado:</Text>
                    <Text style={styles.value}>Bs. {inscripcion.baucher?.reduce((acc: number, b: any) => acc + (b.confirmado ? b.monto : 0), 0) || 0}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Saldo Pendiente:</Text>
                    <Text style={styles.value}>Bs. {oferta.costo - (inscripcion.baucher?.reduce((acc: number, b: any) => acc + (b.confirmado ? b.monto : 0), 0) || 0)}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Estado de Inscripción:</Text>
                    <Text style={styles.value}>{inscripcion.estadoInscripcion?.nombre || 'PREINSCRITO'}</Text>
                </View>
            </View>

            {/* Firmas */}
            <View style={styles.signatureArea}>
                <View style={styles.signatureLine}>
                    <Text>Firma del Participante</Text>
                </View>
                <View style={styles.signatureLine}>
                    <Text>Sello y Firma Responsable</Text>
                </View>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                Este documento es un comprobante oficial de inscripción generado por el Sistema PROFE.
                Válido únicamente con el sello de la institución y comprobante de depósito bancario.
            </Text>
        </Page>
    </Document>
);
