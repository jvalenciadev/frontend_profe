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
    const totalPagado = (ins.baucher || []).reduce((acc: number, b: any) => acc + (b.confirmado ? Number(b.monto) : 0), 0);
    const saldo = (ins.programa?.costo || 0) - totalPagado;

    return (
        <Document>
            {/* PAGINA 1: COMPROBANTE DE INSCRIPCIÓN Y PAGOS */}
            <Page size="LETTER" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Comprobante de Inscripción</Text>
                        <Text style={styles.subtitle}>{profe?.nombre || 'PROGRAMA DE FORMACIÓN ESPECIALIZADA'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Nº REG: {ins.id?.substring(0, 8).toUpperCase()}</Text>
                        <Text style={{ fontSize: 8, color: '#94a3b8' }}>Fecha: {new Date().toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* DATOS DEL PARTICIPANTE */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Datos del Participante</Text>
                    <View style={styles.grid}>
                        <View style={styles.field}>
                            <Text style={styles.label}>Nombres y Apellidos</Text>
                            <Text style={styles.value}>{ins.persona?.nombre} {ins.persona?.apellidos}</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Cédula de Identidad</Text>
                            <Text style={styles.value}>{ins.persona?.nroDocumento} {ins.persona?.expedido}</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Celular / Contacto</Text>
                            <Text style={styles.value}>{ins.persona?.celular || 'N/A'}</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Correo Electrónico</Text>
                            <Text style={styles.value}>{ins.persona?.email || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* DETALLE ACADÉMICO */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalle de Inscripción</Text>
                    <View style={styles.grid}>
                        <View style={styles.field}>
                            <Text style={styles.label}>Programa</Text>
                            <Text style={styles.value}>{ins.programa?.nombre}</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Código / Gestión</Text>
                            <Text style={styles.value}>{ins.programa?.codigo} / {ins.programa?.version?.gestion}</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Sede</Text>
                            <Text style={styles.value}>{ins.sede?.nombre || 'Central'}</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Turno</Text>
                            <Text style={styles.value}>{ins.turno?.turnoConfig?.nombre || 'Único'}</Text>
                        </View>
                    </View>
                </View>

                {/* ESTADO DE PAGOS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Estado de Cuentas y Pagos</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.col1}>Referencia / Depósito</Text>
                            <Text style={styles.col2}>Fecha</Text>
                            <Text style={styles.col3}>Monto (Bs.)</Text>
                        </View>
                        {(ins.baucher || []).map((b: any, idx: number) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={styles.col1}>{b.nroDeposito} {b.confirmado ? '✓' : '(Pendiente)'}</Text>
                                <Text style={styles.col2}>{new Date(b.createdAt).toLocaleDateString()}</Text>
                                <Text style={styles.col3}>{Number(b.monto).toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.summary}>
                        <View style={styles.total}>
                            <View>
                                <Text style={styles.label}>Costo Total</Text>
                                <Text style={[styles.value, { color: '#1e3a8a' }]}>Bs. {Number(ins.programa?.costo || 0).toFixed(2)}</Text>
                            </View>
                            <View>
                                <Text style={styles.label}>Total Pagado</Text>
                                <Text style={[styles.value, { color: '#059669' }]}>Bs. {totalPagado.toFixed(2)}</Text>
                            </View>
                            <View>
                                <Text style={styles.label}>Saldo Pendiente</Text>
                                <Text style={[styles.value, { color: saldo > 0 ? '#dc2626' : '#059669' }]}>Bs. {saldo.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.signatures}>
                    <View style={styles.signatureLine}>
                        <Text style={styles.signatureText}>Firma del Participante</Text>
                    </View>
                    <View style={styles.signatureLine}>
                        <Text style={styles.signatureText}>Sello Recepción PROFE</Text>
                    </View>
                </View>
            </Page>

            {/* PAGINA 2: DOCUMENTO DE COMPROMISO */}
            <Page size="LETTER" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Documento de Compromiso</Text>
                </View>

                <View style={styles.commitment}>
                    <Text style={styles.commitmentTitle}>ACTA DE COMPROMISO DEL PARTICIPANTE</Text>
                    <Text style={styles.commitmentText}>
                        Yo, {ins.persona?.nombre} {ins.persona?.apellidos}, con C.I. {ins.persona?.nroDocumento}, legalmente inscrito en el programa "{ins.programa?.nombre}",
                        me comprometo formalmente a cumplir con las siguientes disposiciones establecidas por el Programa de Formación Especializada (PROFE):{"\n\n"}
                        1. ASISTENCIA Y PUNTUALIDAD: Me comprometo a asistir puntualmente a todas las sesiones (presenciales o virtuales) programadas, cumpliendo con el mínimo del 80% de asistencia para habilitar mi evaluación.{"\n\n"}
                        2. RENDIMIENTO ACADÉMICO: Acepto la responsabilidad de realizar todas las actividades, tareas, foros y exámenes dentro de los plazos establecidos en la plataforma virtual, alcanzando la nota mínima de aprobación exigida por el reglamento.{"\n\n"}
                        3. COMPROMISO ECONÓMICO: Me comprometo a cancelar la totalidad del costo del programa (Bs. {ins.programa?.costo}) según el cronograma de pagos establecido, entendiendo que la falta de pago inhabilitará mi acceso a la plataforma y certificación final.{"\n\n"}
                        4. ÉTICA PROFESIONAL: Me comprometo a mantener una conducta ética, respetando los derechos de autor y evitando cualquier forma de plagio en mis trabajos académicos.{"\n\n"}
                        Al firmar este documento, declaro conocer y aceptar la normativa vigente del Ministerio de Educación y del Programa PROFE.
                    </Text>
                </View>

                <View style={[styles.signatures, { marginTop: 100 }]}>
                    <View style={styles.signatureLine}>
                        <Text style={styles.signatureText}>{ins.persona?.nombre} {ins.persona?.apellidos}</Text>
                        <Text style={styles.signatureText}>C.I. {ins.persona?.nroDocumento}</Text>
                    </View>
                </View>

                <View style={{ marginTop: 50, alignItems: 'center' }}>
                    <Text style={{ fontSize: 8, color: '#94a3b8' }}>Documento generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}</Text>
                </View>
            </Page>
        </Document>
    );
};
