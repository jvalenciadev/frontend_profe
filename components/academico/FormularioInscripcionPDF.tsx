'use client';
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 35,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        fontSize: 9,
    },
    // ── ENCABEZADO ──────────────────────────────────────────
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#C9A74F',
        paddingBottom: 8,
    },
    headerLogo: {
        width: 55,
        height: 55,
        marginRight: 10,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerInst: {
        fontSize: 7,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    headerTitle: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: '#C9A74F',
        textTransform: 'uppercase',
        marginTop: 2,
        marginBottom: 1,
    },
    headerSub: {
        fontSize: 8,
        color: '#475569',
    },
    headerRight: {
        width: 80,
        alignItems: 'flex-end',
    },
    headerRightBox: {
        borderWidth: 1,
        borderColor: '#C9A74F',
        borderRadius: 4,
        padding: 5,
        alignItems: 'center',
    },
    headerRightLabel: {
        fontSize: 6,
        color: '#64748b',
        textTransform: 'uppercase',
    },
    headerRightValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#C9A74F',
    },
    // ── SECCIONES ────────────────────────────────────────────
    sectionHeader: {
        backgroundColor: '#C9A74F',
        color: '#ffffff',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        padding: '4 8',
        marginTop: 10,
        marginBottom: 4,
        letterSpacing: 0.8,
    },
    // ── GRILLA DE CAMPOS ─────────────────────────────────────
    grid2: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 4,
    },
    grid3: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 4,
    },
    fieldBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 3,
        padding: '3 5',
    },
    fieldLabel: {
        fontSize: 6.5,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 1,
    },
    fieldValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
    // ── FOTO ─────────────────────────────────────────────────
    photoBox: {
        width: 75,
        height: 90,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        marginLeft: 8,
    },
    photoLabel: {
        fontSize: 6.5,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 4,
    },
    // ── BAUCHER ──────────────────────────────────────────────
    baucherBox: {
        borderWidth: 1,
        borderColor: '#10b981',
        borderRadius: 4,
        padding: 8,
        marginTop: 6,
        backgroundColor: '#f0fdf4',
    },
    baucherTitle: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#065f46',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    // ── FIRMA ────────────────────────────────────────────────
    signatureArea: {
        marginTop: 18,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    signatureBlock: {
        alignItems: 'center',
        width: 140,
    },
    signatureLine: {
        width: 130,
        borderTopWidth: 1,
        borderTopColor: '#000',
        marginBottom: 3,
        marginTop: 30,
    },
    signatureLabel: {
        fontSize: 7.5,
        textAlign: 'center',
        color: '#334155',
    },
    signatureSub: {
        fontSize: 6.5,
        color: '#64748b',
        textAlign: 'center',
    },
    // ── PIE DE PÁGINA ─────────────────────────────────────────
    footer: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 6.5,
        color: '#94a3b8',
    },
    footerBadge: {
        fontSize: 6.5,
        color: '#C9A74F',
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },
    // ── ESTADO BADGE ─────────────────────────────────────────
    estadoBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#C9A74F',
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    estadoText: {
        fontSize: 8,
        color: '#92400e',
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },
});

interface FormularioInscripcionPDFProps {
    inscripcion: any;
    programa?: any;
}

function val(v?: string | null, fallback = '—') {
    if (!v || String(v).trim() === '') return fallback;
    return String(v).toUpperCase();
}

function formatDate(d?: string | Date | null) {
    if (!d) return '—';
    try {
        const s = typeof d === 'string' ? d.split('T')[0] : d.toISOString().split('T')[0];
        const [y, m, day] = s.split('-').map(Number);
        return new Date(y, m - 1, day).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return String(d); }
}

export const FormularioInscripcionPDF: React.FC<FormularioInscripcionPDFProps> = ({ inscripcion: ins, programa }) => {
    const prog = programa || ins?.programa;
    const persona = ins?.persona;
    const baucher = ins?.baucher;
    const esPago = prog?.costo > 0 || ins?.costo > 0;
    const today = new Date();
    const todayStr = today.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>

                {/* ── ENCABEZADO INSTITUCIONAL ── */}
                <View style={styles.headerRow}>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Formulario de Inscripción</Text>
                        <Text style={styles.headerSub}>
                            Programa de Formación Especializada — PROFE
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <View style={styles.headerRightBox}>
                            <Text style={styles.headerRightLabel}>Gestión</Text>
                            <Text style={styles.headerRightValue}>{today.getFullYear()}</Text>
                            <Text style={{ ...styles.headerRightLabel, marginTop: 4 }}>Estado</Text>
                            <Text style={{ ...styles.headerRightValue, fontSize: 7, color: '#C9A74F' }}>
                                {val(ins?.estadoNombre || ins?.estado || 'PENDIENTE')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── I. DATOS DEL PROGRAMA ── */}
                <Text style={styles.sectionHeader}>I. Datos del Programa</Text>

                <View style={styles.grid2}>
                    <View style={{ ...styles.fieldBox, flex: 2 }}>
                        <Text style={styles.fieldLabel}>Nombre del Programa</Text>
                        <Text style={styles.fieldValue}>{val(prog?.nombre || ins?.programa?.nombre)}</Text>
                    </View>
                    <View style={styles.fieldBox}>
                        <Text style={styles.fieldLabel}>Tipo de Programa</Text>
                        <Text style={styles.fieldValue}>{val(prog?.tipo?.nombre || ins?.programa?.tipo?.nombre)}</Text>
                    </View>
                </View>

                <View style={styles.grid3}>
                    <View style={styles.fieldBox}>
                        <Text style={styles.fieldLabel}>Versión / Gestión</Text>
                        <Text style={styles.fieldValue}>
                            {prog?.version?.numero
                                ? `VERSIÓN ${prog.version.numero} — ${prog.version.gestion}`
                                : ins?.version
                                    ? `VERSIÓN ${ins.version}`
                                    : 'VERSIÓN ÚNICA'}
                        </Text>
                    </View>
                    <View style={styles.fieldBox}>
                        <Text style={styles.fieldLabel}>Modalidad</Text>
                        <Text style={styles.fieldValue}>{val(prog?.modalidad?.nombre || ins?.modalidad)}</Text>
                    </View>
                    <View style={styles.fieldBox}>
                        <Text style={styles.fieldLabel}>Carga Horaria</Text>
                        <Text style={styles.fieldValue}>{prog?.cargaHoraria || ins?.cargaHoraria || '—'} Horas</Text>
                    </View>
                </View>

                {/* ── II. DATOS DE SEDE Y TURNO ── */}
                <Text style={styles.sectionHeader}>II. Sede y Turno de Inscripción</Text>

                <View style={styles.grid2}>
                    <View style={styles.fieldBox}>
                        <Text style={styles.fieldLabel}>Departamento</Text>
                        <Text style={styles.fieldValue}>
                            {val(
                                ins?.departamento ||
                                prog?.sede?.departamento?.nombre ||
                                ins?.sede?.departamento?.nombre
                            )}
                        </Text>
                    </View>
                    <View style={styles.fieldBox}>
                        <Text style={styles.fieldLabel}>Sede de Estudios</Text>
                        <Text style={styles.fieldValue}>
                            {val(ins?.sede || prog?.sede?.nombre || ins?.sede?.nombre || 'SEDE CENTRAL')}
                        </Text>
                    </View>
                </View>

                <View style={styles.grid2}>
                    <View style={styles.fieldBox}>
                        <Text style={styles.fieldLabel}>Turno / Horario</Text>
                        <Text style={styles.fieldValue}>
                            {val(ins?.turno || ins?.turnoNombre || 'ÚNICO')}
                            {(ins?.horaInicio && ins?.horaFin)
                                ? ` (${ins.horaInicio.substring(0, 5)} — ${ins.horaFin.substring(0, 5)})`
                                : ''}
                        </Text>
                    </View>
                    <View style={styles.fieldBox}>
                        <Text style={styles.fieldLabel}>Fecha de Inscripción</Text>
                        <Text style={styles.fieldValue}>{formatDate(ins?.fechaInscripcion || today)}</Text>
                    </View>
                </View>

                {/* ── III. DATOS DEL PARTICIPANTE ── */}
                <Text style={styles.sectionHeader}>III. Datos Personales del Participante</Text>

                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.grid2}>
                            <View style={{ ...styles.fieldBox, flex: 2 }}>
                                <Text style={styles.fieldLabel}>Apellidos y Nombres Completos</Text>
                                <Text style={styles.fieldValue}>
                                    {val(persona?.apellidos || '')} {val(persona?.nombre || '')}
                                </Text>
                            </View>
                            <View style={styles.fieldBox}>
                                <Text style={styles.fieldLabel}>C.I. / Nro. Documento</Text>
                                <Text style={styles.fieldValue}>
                                    {val(persona?.nroDocumento || persona?.ci)}
                                    {persona?.complemento ? ` ${persona.complemento}` : ''}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.grid3}>
                            <View style={styles.fieldBox}>
                                <Text style={styles.fieldLabel}>Fecha de Nacimiento</Text>
                                <Text style={styles.fieldValue}>{val(persona?.fechaNacimiento)}</Text>
                            </View>
                            <View style={styles.fieldBox}>
                                <Text style={styles.fieldLabel}>Género</Text>
                                <Text style={styles.fieldValue}>{val(persona?.genero)}</Text>
                            </View>
                            <View style={styles.fieldBox}>
                                <Text style={styles.fieldLabel}>Celular (WhatsApp)</Text>
                                <Text style={styles.fieldValue}>{val(persona?.celular)}</Text>
                            </View>
                        </View>

                        <View style={styles.grid2}>
                            <View style={{ ...styles.fieldBox, flex: 2 }}>
                                <Text style={styles.fieldLabel}>Correo Electrónico</Text>
                                <Text style={{ ...styles.fieldValue, textTransform: 'lowercase' }}>
                                    {persona?.correo || persona?.email || '—'}
                                </Text>
                            </View>
                            <View style={styles.fieldBox}>
                                <Text style={styles.fieldLabel}>Nivel de Formación</Text>
                                <Text style={styles.fieldValue}>{val(persona?.nivel)}</Text>
                            </View>
                        </View>

                        <View style={styles.grid2}>
                            <View style={styles.fieldBox}>
                                <Text style={styles.fieldLabel}>Unidad Educativa</Text>
                                <Text style={styles.fieldValue}>{val(persona?.unidadEducativa)}</Text>
                            </View>
                            <View style={styles.fieldBox}>
                                <Text style={styles.fieldLabel}>Área de Desempeño</Text>
                                <Text style={styles.fieldValue}>{val(persona?.area)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Foto */}
                    <View style={styles.photoBox}>
                        <Text style={styles.photoLabel}>FOTOGRAFÍA{'\n'}3×4</Text>
                    </View>
                </View>

                {/* ── IV. DATOS DE PAGO / BAUCHER (solo si aplica) ── */}
                {esPago && (() => {
                    const costoProg = Number(prog?.costo || ins?.costo || 0);
                    const montoDeposito = Number(baucher?.monto || ins?.baucher?.monto || 0);
                    const saldoPendiente = Math.max(0, costoProg - montoDeposito);
                    const esGradual = montoDeposito > 0 && montoDeposito < costoProg;

                    return (
                        <>
                            <Text style={styles.sectionHeader}>IV. Comprobante de Pago (Baucher)</Text>
                            <View style={styles.baucherBox}>
                                <Text style={styles.baucherTitle}>
                                    {esGradual ? '⚠ Depósito Inicial Registrado — Pago Gradual' : '✓ Depósito Bancario Registrado'}
                                </Text>
                                <View style={styles.grid3}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.fieldLabel}>Nro. Comprobante / Depósito</Text>
                                        <Text style={{ ...styles.fieldValue, fontSize: 10 }}>
                                            {val(baucher?.nroDeposito || ins?.baucher?.nroDeposito)}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.fieldLabel}>Fecha de Depósito</Text>
                                        <Text style={styles.fieldValue}>
                                            {formatDate(baucher?.fecha || ins?.baucher?.fecha)}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.fieldLabel}>Monto Depositado</Text>
                                        <Text style={{ ...styles.fieldValue, color: '#065f46', fontSize: 11 }}>
                                            {montoDeposito > 0 ? montoDeposito : (costoProg > 0 ? costoProg : '—')} Bs.
                                        </Text>
                                    </View>
                                </View>
                                {costoProg > 0 && (
                                    <View style={{ ...styles.grid3, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#d1fae5' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fieldLabel}>Costo Total del Programa</Text>
                                            <Text style={{ ...styles.fieldValue, color: '#374151' }}>{costoProg} Bs.</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fieldLabel}>Saldo Pendiente</Text>
                                            <Text style={{ ...styles.fieldValue, color: saldoPendiente > 0 ? '#b91c1c' : '#065f46', fontSize: 10 }}>
                                                {saldoPendiente > 0 ? `${saldoPendiente} Bs. — PENDIENTE` : '0 Bs. — COMPLETADO'}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fieldLabel}>Tipo de Pago</Text>
                                            <Text style={{ ...styles.fieldValue, color: '#374151' }}>
                                                {esGradual ? 'GRADUAL / A CUENTA' : 'PAGO COMPLETO'}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </>
                    );
                })()}


                {/* ── V. DECLARACIÓN Y FIRMAS ── */}
                <Text style={{ ...styles.sectionHeader, marginTop: 12 }}>
                    {esPago ? 'V.' : 'IV.'} Declaración Jurada y Firmas
                </Text>

                <Text style={{ fontSize: 8, color: '#475569', lineHeight: 1.5, textAlign: 'justify' }}>
                    Yo, el/la suscrito/a, declaro que los datos consignados en el presente formulario son verídicos y exactos,
                    y me comprometo a cumplir con las normas y reglamentos del Programa de Formación Especializada — PROFE del
                    Instituto de Investigación Plurinacional Pública (IIPP). Asimismo, declaro conocer los requisitos académicos
                    y administrativos del programa al que me inscribo, aceptando las condiciones establecidas.
                </Text>

                <View style={styles.signatureArea}>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Firma del Participante</Text>
                        <Text style={styles.signatureSub}>
                            {val(persona?.nombre || '')} {val(persona?.apellidos || '')}
                        </Text>
                        <Text style={styles.signatureSub}>CI: {val(persona?.nroDocumento || persona?.ci)}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Sello y Firma del Responsable</Text>
                        <Text style={styles.signatureSub}>Sede: {val(ins?.sede || prog?.sede?.nombre || 'Central')}</Text>
                        <Text style={styles.signatureSub}>Cargo: Encargado de Inscripciones</Text>
                    </View>
                </View>

                {/* ── PIE ── */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Emitido el {todayStr} — Sistema AULA PROFE v1.0
                    </Text>
                    <Text style={styles.footerBadge}>IIPP — Formulario Oficial de Inscripción</Text>
                </View>

            </Page>
        </Document>
    );
};
