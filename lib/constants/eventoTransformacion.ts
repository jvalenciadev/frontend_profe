// ─── CONSTANTES Y REGLAS DE NEGOCIO PARA EL EVENTO DE TRANSFORMACIÓN DE MAESTROS ───

export const EVENTO_TRANSFORMACION_SLUG = 'encuentro-nacional-por-la-tranformacion-de-maestros';
export const ECE_ID_FECHA = '8fb36258-dd5d-4a49-8574-931a473f381e';
export const ECE_ID_INSTITUCION = '211f76be-1dba-4b26-b4d8-ae6720a5c4c3';
export const ECE_ID_MESA = 'a51efab3-3776-4548-8722-40e0ab18536b';
export const CUPO_MAXIMO_GLOBAL_MESA = 35;

export const MESAS_EVENTO_TRANSFORMACION = [
    'Inicial',
    'Primaria',
    'Secundaria',
    'Educación Especial',
    'Educación Alternativa',
    'Investigación',
    'Técnica Tecnológico',
    'Educación Superior'
] as const;

export interface InstitucionConfig {
    nombre: string;
    cupo: number | null; // null = INDEFINIDO
}

export const INSTITUCIONES_EVENTO_TRANSFORMACION: InstitucionConfig[] = [
    { nombre: 'MINEDU', cupo: null },
    { nombre: 'CÁMARA DE DIPUTADOS', cupo: 9 },
    { nombre: 'CÁMARA DE SENADORES', cupo: 3 },
    { nombre: 'GOBERNACION DE LA PAZ', cupo: 2 },
    { nombre: 'GOBERNACION DE ORURO', cupo: 2 },
    { nombre: 'GOBERNACION DE SANTA CRUZ', cupo: 2 },
    { nombre: 'GOBERNACION DE POTOSI', cupo: 2 },
    { nombre: 'GOBERNACION DE BENI', cupo: 2 },
    { nombre: 'GOBERNACION DE PANDO', cupo: 2 },
    { nombre: 'GOBERNACION DE CHUQUISACA', cupo: 2 },
    { nombre: 'FEDERACION DE PADRES DE FAMILIA', cupo: 3 },
    { nombre: 'CSUTCB', cupo: 3 },
    { nombre: 'FEDERACION DE JUNTAS VECINALES', cupo: 3 },
    { nombre: 'COMISION DE EDUCACION DE LA CAMARA DE DIPUTADOS', cupo: 10 },
    { nombre: 'DIRECCION DEPARTAMENTAL DE EDUCACIÓN DE LA PAZ', cupo: 3 },
    { nombre: 'DIRECCION DEPARTAMENTAL DE SANTA CRUZ', cupo: 3 },
    { nombre: 'DIRECCION DEPARTAMENTAL DE PANDO', cupo: 3 },
    { nombre: 'DIRECCION DEPARTAMENTAL DE CHUQUISACA', cupo: 3 },
    { nombre: 'DIRECCION DEPARTAMENTAL DE ORURO', cupo: 3 },
    { nombre: 'DIRECCION DEPARTAMENTAL DE BENI', cupo: 3 },
    { nombre: 'DIRECCION DEPARTAMENTAL DE POTOSI', cupo: 3 },
    { nombre: 'DIRECCION DEPARTAMENTAL DE TARIJA', cupo: 3 },
    { nombre: 'DIRECCION DEPARTAMENTAL DE COCHABAMBA', cupo: 3 },
    { nombre: 'ESFM FRANZ TAMAYO VILLA SERRANO - CH', cupo: 5 },
    { nombre: 'ESFM MARISCAL SUCRE - CH', cupo: 5 },
    { nombre: 'ESFM SIMON BOLIVAR CORORO - CH', cupo: 5 },
    { nombre: 'ESFM ISMAEL MONTES - CB', cupo: 5 },
    { nombre: 'ESFM MANUEL ASCENCIO VILLARROEL - CB', cupo: 5 },
    { nombre: 'ESFM SIMON RODRIGUEZ - CB', cupo: 9 },
    { nombre: 'ESFM ANTONIO JOSE DE SUCRE - LP', cupo: 5 },
    { nombre: 'ESFM MARISCAL ANDRES DE SANTA CRUZ Y CALAHUMANA - LP', cupo: 7 },
    { nombre: 'ESFM SANTIAGO DE HUATA - LP', cupo: 5 },
    { nombre: 'ESFM SIMON BOLIVAR - LP', cupo: 6 },
    { nombre: 'ESFM TECNOLOGICO HUMANISTICO DE EL ALTO - LP', cupo: 5 },
    { nombre: 'ESFM VILLA AROMA - LP', cupo: 5 },
    { nombre: 'ESFM WARISATA - LP', cupo: 5 },
    { nombre: 'ESFM ANGEL MENDOZA JUSTINIANO - OR', cupo: 6 },
    { nombre: 'ESFM CARACOLLO - OR', cupo: 6 },
    { nombre: 'ESFM PUERTO RICO - PD', cupo: 7 },
    { nombre: 'ESFM EDUARDO AVAROA - PT', cupo: 6 },
    { nombre: 'ESFM FRAN TAMAYO DE LLICA - PT', cupo: 5 },
    { nombre: 'ESFM JOSE DAVID BERRIOS - PT', cupo: 5 },
    { nombre: 'ESFM MARISCAL ANDRES DE SANTA CRUZ - PT', cupo: 7 },
    { nombre: 'ESFM ENRIQUE FINOT - SC', cupo: 6 },
    { nombre: 'ESFM MULTIETNICA INDIGENA DE CONCEPCION - SC', cupo: 5 },
    { nombre: 'ESFM PLURIETNICA DEL ORIENTE Y CHACO - SC', cupo: 6 },
    { nombre: 'ESFM RAFAEL CHAVEZ ORTIZ - SC', cupo: 6 },
    { nombre: 'ESFM JUAN MISAEL SARACHO - TJ', cupo: 7 },
    { nombre: 'ESFM RIBERALTA - BN', cupo: 5 },
    { nombre: 'ESFM CLARA PARADA DE PINTO - BN', cupo: 6 },
    { nombre: 'UNIVERSIDAD MAYOR DE SAN ANDRES', cupo: 8 },
    { nombre: 'UNIVERSIDAD MAYOR DE SAN SIMON', cupo: 8 },
    { nombre: 'UNIVERSIDAD AUTONOMA GABRIEL RENE MORENO', cupo: 8 },
    { nombre: 'UNIVERSIDAD SAN FRANCISCO XAVIER', cupo: 8 },
    { nombre: 'UNIVERSIDAD CATOLICA BOLIVIANA SAN PABLO', cupo: 8 },
    { nombre: 'UNIVERSIDAD SALESIANA', cupo: 8 },
    { nombre: 'UNIVERSIDAD LA SALLE', cupo: 8 },
    { nombre: 'CONFERENCIA EPISCOPAL DE BOLIVIA', cupo: 8 },
    { nombre: 'CAMPANA BOLIVIANA POR EL DERECHO A LA EDUCACION', cupo: 5 },
    { nombre: 'ASOCIACION NACIONAL DE UNIVERSIDADES PRIVADAS ANUP', cupo: 8 },
    { nombre: 'GOBIERNO AUTÓNOMO MUNICIPAL PUERTO ACOSTA', cupo: 4 },
    { nombre: 'GOBIERNO AUTONOMO MUNICIPAL ED CARACOLLO', cupo: 3 },
    { nombre: 'GOBIERNO AUTÓNOMO MUNICIPAL DE CHARAÑA', cupo: 3 },
    { nombre: 'GOBIERNO AUTONOMO MUNICIPAL DE REYES', cupo: 3 },
    { nombre: 'GOBIERNO AUTONOMO MUNICIPAL DE CHULUMANI', cupo: 3 },
    { nombre: 'GOBIERON AUTONOMO MUNICIPAL DE SAN BORJA', cupo: 3 },
    { nombre: 'GOBIERNO AUTONOMO MUNICIPAL DE LLICA', cupo: 3 },
    { nombre: 'GOBIERNO AUTONOMO MUNICIPAL DE SAN LUCAS', cupo: 3 },
    { nombre: 'GOBIERNO AUTONOMO MUNICIPAL DE CORIPATA', cupo: 3 },
    { nombre: 'UNICEF', cupo: 3 },
    { nombre: 'CAF', cupo: 3 },
    { nombre: 'CETUB', cupo: 22 },
    { nombre: 'CONMERB', cupo: 30 },
    { nombre: 'CEFOM-B', cupo: 30 },
    { nombre: 'FEFOM', cupo: 30 },
    { nombre: 'FUNDACION ALMA', cupo: 3 },
    { nombre: 'CONSULTORES EXTERNOS', cupo: 5 },
    { nombre: 'PRENSA', cupo: 12 },
    { nombre: 'UP', cupo: 3 },
    { nombre: 'UNEFCO', cupo: 20 },
];

/**
 * Normaliza textos para comparación segura (sin tildes, mayúsculas, espacios limpios)
 */
export function normalizarTexto(txt: string | undefined | null): string {
    if (!txt) return '';
    return txt
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();
}

/**
 * Evalúa la disponibilidad de cada una de las 8 mesas según las reglas de negocio
 */
export function calcularDisponibilidadMesas({
    institucionNombre,
    cuposGlobales = {},
    cuposInstitucion = {}
}: {
    institucionNombre: string;
    cuposGlobales: Record<string, number>;
    cuposInstitucion: Record<string, Record<string, number>>;
}): Record<string, { disponible: boolean; motivo?: string; conteoMesa: number; conteoInst: number; limiteInstMesa: number | null }> {
    const instNorm = normalizarTexto(institucionNombre);
    const instConfig = INSTITUCIONES_EVENTO_TRANSFORMACION.find(
        i => normalizarTexto(i.nombre) === instNorm
    );

    // Buscar clave de la institución de manera normalizada
    const instKey = Object.keys(cuposInstitucion).find(
        k => normalizarTexto(k) === instNorm
    );
    const instConteoMesas = instKey ? cuposInstitucion[instKey] : (cuposInstitucion[institucionNombre] || {});

    // Suma de inscritos totales de esta institución
    const totalInstGeneral = Object.values(instConteoMesas).reduce((acc, curr) => acc + (Number(curr) || 0), 0);

    const cupoTotalInst = instConfig ? instConfig.cupo : null;
    const totalMesas = MESAS_EVENTO_TRANSFORMACION.length; // 8

    // Límite máximo por mesa para esta institución:
    // Si cupo <= 8: el límite es estrictamente 1 por mesa (no pueden repetir mesa).
    // Si cupo > 8: límite = ceil(cupo / 8)
    let limiteInstPorMesa: number | null = null;
    if (cupoTotalInst !== null) {
        if (cupoTotalInst <= totalMesas) {
            limiteInstPorMesa = 1;
        } else {
            limiteInstPorMesa = Math.ceil(cupoTotalInst / totalMesas);
        }
    }

    // Helper para obtener conteo de una mesa para esta institución
    const getConteoInstMesa = (nombreMesa: string): number => {
        const mNorm = normalizarTexto(nombreMesa);
        const mKey = Object.keys(instConteoMesas).find(k => normalizarTexto(k) === mNorm);
        return mKey ? (Number(instConteoMesas[mKey]) || 0) : (Number(instConteoMesas[nombreMesa]) || 0);
    };

    // Helper para obtener conteo global de una mesa
    const getConteoGlobalMesa = (nombreMesa: string): number => {
        const mNorm = normalizarTexto(nombreMesa);
        const mKey = Object.keys(cuposGlobales).find(k => normalizarTexto(k) === mNorm);
        return mKey ? (Number(cuposGlobales[mKey]) || 0) : (Number(cuposGlobales[nombreMesa]) || 0);
    };

    // Verificar si alguna mesa aún no tiene al menos 1 inscrito de esta institución
    const tieneMesasEnCero = MESAS_EVENTO_TRANSFORMACION.some(
        m => getConteoInstMesa(m) === 0
    );

    const resultado: Record<string, { disponible: boolean; motivo?: string; conteoMesa: number; conteoInst: number; limiteInstMesa: number | null }> = {};

    MESAS_EVENTO_TRANSFORMACION.forEach(mesa => {
        const inscritosGlobalesMesa = getConteoGlobalMesa(mesa);
        const inscritosInstMesa = getConteoInstMesa(mesa);

        // Regla 1: Tope global de la mesa (35 participantes)
        if (inscritosGlobalesMesa >= CUPO_MAXIMO_GLOBAL_MESA) {
            resultado[mesa] = {
                disponible: false,
                motivo: `Mesa completa a nivel nacional (${CUPO_MAXIMO_GLOBAL_MESA}/${CUPO_MAXIMO_GLOBAL_MESA})`,
                conteoMesa: inscritosGlobalesMesa,
                conteoInst: inscritosInstMesa,
                limiteInstMesa: limiteInstPorMesa
            };
            return;
        }

        // Regla 2: Cupo total institucional agotado
        if (cupoTotalInst !== null && totalInstGeneral >= cupoTotalInst) {
            resultado[mesa] = {
                disponible: false,
                motivo: `Cupo total de la institución completado (${cupoTotalInst}/${cupoTotalInst})`,
                conteoMesa: inscritosGlobalesMesa,
                conteoInst: inscritosInstMesa,
                limiteInstMesa: limiteInstPorMesa
            };
            return;
        }

        // Regla 3: Si cupo <= 8 (ej. ESFM FRAN TAMAYO DE LLICA = 5 cupos),
        // solo puede haber MÁXIMO 1 participante de esta institución por mesa.
        if (cupoTotalInst !== null && cupoTotalInst <= totalMesas) {
            if (inscritosInstMesa >= 1) {
                resultado[mesa] = {
                    disponible: false,
                    motivo: `Su institución ya tiene un participante en esta mesa (Máx. 1)`,
                    conteoMesa: inscritosGlobalesMesa,
                    conteoInst: inscritosInstMesa,
                    limiteInstMesa: 1
                };
                return;
            }
        }

        // Regla 4: Fase 1 obligatoria para cupos grandes (cupo > 8)
        // Debe cubrir primero al menos 1 por cada una de las 8 mesas antes de habilitar la segunda ronda
        if (cupoTotalInst !== null && cupoTotalInst > totalMesas && tieneMesasEnCero) {
            if (inscritosInstMesa >= 1) {
                resultado[mesa] = {
                    disponible: false,
                    motivo: `Su institución debe cubrir primero 1 cupo en cada una de las 8 mesas`,
                    conteoMesa: inscritosGlobalesMesa,
                    conteoInst: inscritosInstMesa,
                    limiteInstMesa: limiteInstPorMesa
                };
                return;
            }
        }

        // Regla 5: Límite proporcional por mesa para la institución (cupo > 8)
        if (limiteInstPorMesa !== null && inscritosInstMesa >= limiteInstPorMesa) {
            resultado[mesa] = {
                disponible: false,
                motivo: `Límite por mesa de su institución alcanzado (${limiteInstPorMesa})`,
                conteoMesa: inscritosGlobalesMesa,
                conteoInst: inscritosInstMesa,
                limiteInstMesa: limiteInstPorMesa
            };
            return;
        }

        // Mesa disponible
        resultado[mesa] = {
            disponible: true,
            conteoMesa: inscritosGlobalesMesa,
            conteoInst: inscritosInstMesa,
            limiteInstMesa: limiteInstPorMesa
        };
    });

    return resultado;
}
