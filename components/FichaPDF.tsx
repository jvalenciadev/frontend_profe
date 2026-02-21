import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Registrar fuentes (opcional, si quieres usar algo distinto a las standard)
Font.register({
    family: 'Roboto',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf'
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#1e3a8a',
        paddingBottom: 20
    },
    headerText: {
        flexGrow: 1,
        paddingLeft: 20
    },
    name: {
        fontSize: 24,
        color: '#1e3a8a',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    title: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 5,
        textTransform: 'uppercase',
        letterSpacing: 1.5
    },
    photo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f1f5f9',
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: '#1e3a8a',
        overflow: 'hidden'
    },
    logo: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#1e3a8a',
        color: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: 24
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#1e3a8a',
        fontWeight: 'bold',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: 120,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase'
    },
    value: {
        flex: 1,
        fontSize: 10,
        color: '#334155'
    },
    posgradoItem: {
        marginBottom: 10,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#1e3a8a'
    },
    posgradoTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    posgradoSubtitle: {
        fontSize: 9,
        color: '#64748b'
    },
    pill: {
        backgroundColor: '#eff6ff',
        padding: '3 8',
        borderRadius: 10,
        marginRight: 5,
        marginBottom: 5
    },
    pillText: {
        fontSize: 8,
        color: '#1e3a8a'
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    footer: {
        marginTop: 40,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8'
    }
});

interface FichaPDFProps {
    ficha: any;
    config: any;
}

export const FichaPDF: React.FC<FichaPDFProps> = ({ ficha, config }) => {
    const cargoNombre = ficha.cargoPostulacion?.nombre || config?.cargos.find((c: any) => c.id === (ficha.cargoPostulacionId || ficha.cargoId))?.nombre || 'Cargo no definido';
    const categoriaNombre = config?.categorias.find((c: any) => c.id === String(ficha.categoriaId))?.nombre || 'Sin categoría';

    const userImage = ficha.user?.imagen || ficha.imagen;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const fullImageUrl = userImage ? (userImage.startsWith('http') ? userImage : `${API_URL}${userImage}`) : null;

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={styles.logo}>
                            <Text>P</Text>
                        </View>
                        <View>
                            <Text style={{ fontSize: 12, fontStyle: 'italic', fontWeight: 'bold', color: '#1e3a8a' }}>PROGRAMA PROFE</Text>
                            <Text style={{ fontSize: 7, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Ministerio de Educación</Text>
                        </View>
                    </View>
                    <View style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: 8, color: '#94a3b8' }}>FICHA PROFESIONAL INTEGRADA</Text>
                        <Text style={{ fontSize: 7, color: '#cbd5e1' }}>SISTEMA NACIONAL DE GESTIÓN EDUCATIVA</Text>
                    </View>
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.photo}>
                        {fullImageUrl ? (
                            <Image src={fullImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Text style={{ textAlign: 'center', marginTop: 35, fontSize: 32, color: '#cbd5e1', fontWeight: 'bold' }}>
                                {ficha.user?.nombre?.charAt(0)}
                            </Text>
                        )}
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.name}>
                            {ficha.user?.nombre || ficha.nombre} {ficha.user?.apellidos || ficha.apellidos}
                        </Text>
                        <Text style={styles.title}>{cargoNombre}</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                            <Text style={{ fontSize: 9, color: '#94a3b8' }}>CI: {ficha.user?.ci}</Text>
                            <Text style={{ fontSize: 9, color: '#94a3b8' }}>•</Text>
                            <Text style={{ fontSize: 9, color: '#94a3b8' }}>Estado: {ficha.estado?.toUpperCase() || 'ACTIVO'}</Text>
                        </View>
                    </View>
                </View>

                {/* Resumen */}
                {ficha.resumenProfesional && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Perfil Profesional</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#334155', textAlign: 'justify' }}>
                            {ficha.resumenProfesional}
                        </Text>
                    </View>
                )}

                {/* Datos Personales */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información Personal</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Correo:</Text>
                        <Text style={styles.value}>{ficha.user?.correo}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Celular:</Text>
                        <Text style={styles.value}>{ficha.user?.celular || ficha.celular || 'No registrado'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Género:</Text>
                        <Text style={styles.value}>{ficha.user?.genero || ficha.genero || '---'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Est. Civil:</Text>
                        <Text style={styles.value}>{ficha.user?.estadoCivil || ficha.estadoCivil || '---'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Dirección:</Text>
                        <Text style={styles.value}>{ficha.user?.direccion || ficha.direccion || '---'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>LinkedIn:</Text>
                        <Text style={styles.value}>{ficha.linkedinUrl || 'No disponible'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Magisterio:</Text>
                        <Text style={styles.value}>{ficha.esMaestro ? `Sí - Categoría: ${categoriaNombre}` : 'No'}</Text>
                    </View>
                </View>

                {/* Formación Base */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Formación Académica</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Lic. Universitaria:</Text>
                        <Text style={styles.value}>{ficha.licUniversitaria || '---'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Lic. MESCP:</Text>
                        <Text style={styles.value}>{ficha.licMescp || '---'}</Text>
                    </View>
                </View>

                {/* Postgrados */}
                {ficha.postgrados && ficha.postgrados.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Postgrados y Especializaciones</Text>
                        {ficha.postgrados.map((p: any, i: number) => (
                            <View key={i} style={styles.posgradoItem}>
                                <Text style={styles.posgradoTitle}>{p.titulo}</Text>
                                <Text style={styles.posgradoSubtitle}>
                                    {p.tipoPosgrado?.nombre} • {new Date(p.fecha).toLocaleDateString()}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Producción Intelectual */}
                {ficha.produccionIntelectual && ficha.produccionIntelectual.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Producción Intelectual</Text>
                        {ficha.produccionIntelectual.map((p: any, i: number) => (
                            <View key={i} style={{ marginBottom: 5 }}>
                                <Text style={{ fontSize: 10, color: '#334155' }}>
                                    • {p.titulo} <Text style={{ color: '#94a3b8' }}>({p.anioPublicacion})</Text>
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Habilidades */}
                {ficha.habilidades && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Habilidades</Text>
                        <View style={styles.skillsContainer}>
                            {ficha.habilidades.split(',').map((skill: string, i: number) => (
                                <View key={i} style={styles.pill}>
                                    <Text style={styles.pillText}>{skill.trim()}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Generado por PROGRAMA PROFE</Text>
                    <Text style={styles.footerText}>{new Date().toLocaleDateString()}</Text>
                </View>
            </Page>
        </Document>
    );
};
