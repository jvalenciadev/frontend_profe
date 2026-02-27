import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { getImageUrl } from '@/lib/utils';

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
    },
    // Nuevos estilos para un diseño más profesional
    headerContainer: {
        flexDirection: 'column',
        marginBottom: 20,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 20,
        marginBottom: 10,
    },
    logoGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20
    },
    cvTitleContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    cvTitle: {
        fontSize: 26,
        fontWeight: 'extrabold',
        color: '#1e3a8a',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    cvSubtitle: {
        fontSize: 7,
        color: '#64748b',
        fontWeight: 'bold',
        marginTop: 2,
        letterSpacing: 2,
        textTransform: 'uppercase'
    },
    brandingBar: {
        backgroundColor: '#1e3a8a',
        height: 45,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    brandingBarText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5
    },
    brandingBarSub: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 7,
        textTransform: 'uppercase'
    },
    personalHeader: {
        flexDirection: 'row',
        marginTop: 30,
        marginBottom: 30,
        paddingHorizontal: 10,
        gap: 25,
        alignItems: 'center'
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#f8fafc',
        overflow: 'hidden'
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center'
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4
    },
    userRoleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15
    },
    userRole: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e3a8a',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        textTransform: 'uppercase'
    },
    userCategory: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: 'medium'
    },
    metaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20
    },
    metaItem: {
        flexDirection: 'column',
        gap: 2
    },
    metaLabel: {
        fontSize: 7,
        color: '#94a3b8',
        textTransform: 'uppercase',
        fontWeight: 'bold'
    },
    metaValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#334155'
    }
});

interface FichaPDFProps {
    ficha: any;
    config: any;
    profe?: any;
}

export const FichaPDF: React.FC<FichaPDFProps> = ({ ficha, config, profe }) => {
    const cargoNombre = ficha.cargoPostulacion?.nombre || config?.cargos.find((c: any) => c.id === (ficha.cargoPostulacionId || ficha.cargoId))?.nombre || 'Cargo no definido';
    const categoriaNombre = config?.categorias.find((c: any) => c.id === String(ficha.categoriaId))?.nombre || 'Sin categoría';

    const userImage = ficha.user?.imagen || ficha.imagen;
    const fullImageUrl = getImageUrl(userImage);

    // Logos institucionales - Soportando ambos formatos de nombre por seguridad
    const logoProfeUrl = (profe?.imagen || profe?.profe_imagen) ? getImageUrl(profe?.imagen || profe?.profe_imagen) : null;
    const logoMineduUrl = (profe?.logoPrincipal || profe?.profe_logo_principal) ? getImageUrl(profe?.logoPrincipal || profe?.profe_logo_principal) : null;

    // El generador de PDF no soporta SVG, detectamos para evitar errores
    const isProfeSvg = logoProfeUrl?.toLowerCase().endsWith('.svg');
    const isMineduSvg = logoMineduUrl?.toLowerCase().endsWith('.svg');

    // Color Institucional Dinámico
    const instColor = profe?.color || '#1e3a8a';

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* ENCABEZADO TÉCNICO PROFESIONAL */}
                <View style={styles.headerContainer}>
                    <View style={styles.topBar}>
                        {/* Logos con espaciado controlado */}
                        <View style={styles.logoGroup}>
                            {!isMineduSvg && logoMineduUrl && (
                                <Image
                                    src={logoMineduUrl}
                                    style={{ width: 160, height: 60, objectFit: 'contain' }}
                                />
                            )}
                        </View>

                        {/* Título CV - Fixed hyphenation issue */}
                        <View style={styles.cvTitleContainer}>
                            <Text style={[styles.cvTitle, { color: instColor }]}>
                                CURRICULUM VITAE
                            </Text>
                            <Text style={styles.cvSubtitle}>
                                SISTEMA DE GESTIÓN PROFESIONAL DIGITAL
                            </Text>
                        </View>
                    </View>
                    {/* Barra Institucional Dinámica (Premium) */}
                    <View style={[styles.brandingBar, { backgroundColor: instColor }]}>
                        <View>
                            <Text style={styles.brandingBarText}>
                                {profe?.nombre || 'PROGRAMA DE FORMACIÓN ESPECIALIZADA'}
                            </Text>
                            <Text style={styles.brandingBarSub}>
                                MINISTERIO DE EDUCACIÓN
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 6, fontWeight: 'bold' }}>ESTADO PLURINACIONAL DE BOLIVIA</Text>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 5, marginTop: 1, letterSpacing: 0.5 }}>ID-DOC: {ficha.id.substring(0, 8).toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                {/* Perfil Personal de Alto Impacto */}
                <View style={styles.personalHeader}>
                    <View style={styles.profilePhoto}>
                        {fullImageUrl ? (
                            <Image src={fullImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontSize: 40, color: '#e2e8f0', fontWeight: 'bold' }}>{ficha.nombre?.charAt(0)}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>{ficha.nombre} {ficha.apellidos}</Text>
                        <View style={styles.userRoleContainer}>
                            <Text style={[styles.userRole, { color: instColor }]}>{cargoNombre}</Text>
                            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1' }} />
                            <Text style={styles.userCategory}>{categoriaNombre}</Text>
                        </View>

                        <View style={styles.metaGrid}>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>Cédula de Identidad</Text>
                                <Text style={styles.metaValue}>{ficha.user?.ci || ficha.ci}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>Departamento</Text>
                                <Text style={styles.metaValue}>{(ficha.user?.departamento || 'No definido').toUpperCase()}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>Estado Ficha</Text>
                                <Text style={styles.metaValue}>{(ficha.estado || 'ACTIVO').toUpperCase()}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>Fecha Emisión</Text>
                                <Text style={styles.metaValue}>{new Date().toLocaleDateString()}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Resumen */}
                {ficha.resumenProfesional && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: instColor, borderBottomColor: instColor + '40' }]}>Perfil Profesional</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#334155', textAlign: 'justify' }}>
                            {ficha.resumenProfesional}
                        </Text>
                    </View>
                )}

                {/* Datos Personales */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: instColor, borderBottomColor: instColor + '40' }]}>Información Personal</Text>
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
                        <Text style={styles.label}>Idiomas:</Text>
                        <Text style={styles.value}>{ficha.idiomas || '---'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Magisterio:</Text>
                        <Text style={styles.value}>{ficha.esMaestro ? `Sí - Categoría: ${categoriaNombre}` : 'No'}</Text>
                    </View>
                </View>

                {/* Experiencia Laboral */}
                {ficha.experienciaLaboral && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: instColor, borderBottomColor: instColor + '40' }]}>Experiencia Laboral Relevante</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#334155', textAlign: 'justify' }}>
                            {ficha.experienciaLaboral}
                        </Text>
                    </View>
                )}

                {/* Formación Base */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: instColor, borderBottomColor: instColor + '40' }]}>Formación Académica</Text>
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
                        <Text style={[styles.sectionTitle, { color: instColor, borderBottomColor: instColor + '40' }]}>Postgrados y Especializaciones</Text>
                        {ficha.postgrados.map((p: any, i: number) => (
                            <View key={i} style={[styles.posgradoItem, { borderLeftColor: instColor }]}>
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
                        <Text style={[styles.sectionTitle, { color: instColor, borderBottomColor: instColor + '40' }]}>Producción Intelectual</Text>
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
                        <Text style={[styles.sectionTitle, { color: instColor, borderBottomColor: instColor + '40' }]}>Habilidades</Text>
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
