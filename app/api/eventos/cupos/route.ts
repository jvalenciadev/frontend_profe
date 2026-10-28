import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import {
    ECE_ID_FECHA,
    ECE_ID_INSTITUCION,
    ECE_ID_MESA
} from '@/lib/constants/eventoTransformacion';

// Pool singleton para evitar agotar conexiones
let pool: Pool | null = null;

function getPool(): Pool | null {
    const connectionString = process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/profe_minedu?schema=public';
    if (!pool) {
        try {
            pool = new Pool({
                connectionString,
                connectionTimeoutMillis: 3000,
                idleTimeoutMillis: 10000,
                max: 10
            });
            pool.on('error', (err) => {
                console.error('[API Cupos] Error inesperado en pool pg:', err.message);
                pool = null;
            });
        } catch (e: any) {
            console.error('[API Cupos] Error inicializando pool pg:', e.message);
            pool = null;
        }
    }
    return pool;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const eventoId = searchParams.get('eventoId');
    const inscripcionId = searchParams.get('inscripcionId');
    const ciParam = searchParams.get('ci');

    const responseHeaders = {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };

    const p = getPool();
    if (!p) {
        return NextResponse.json({
            success: true,
            cuposGlobales: {},
            cuposInstitucion: {},
            respuestas: {},
            message: 'Base de datos en modo offline/standby'
        }, { headers: responseHeaders });
    }

    try {
        // 1. Conteo global por mesa
        const queryGlobal = `
            SELECT 
                ecer_mesa.ecer_valor AS mesa,
                COUNT(*)::int AS total
            FROM evento_campo_extra_respuesta ecer_mesa
            INNER JOIN evento_inscripcion_v2 ei 
                ON ei.eve_ins_id = ecer_mesa.eve_ins_id
            WHERE ecer_mesa.ece_id = $1
              AND (ei.deleted_at IS NULL)
              ${eventoId ? 'AND ei.eve_id = $2::uuid' : ''}
            GROUP BY ecer_mesa.ecer_valor;
        `;
        const paramsGlobal = eventoId ? [ECE_ID_MESA, eventoId] : [ECE_ID_MESA];
        const resGlobal = await p.query(queryGlobal, paramsGlobal);

        const cuposGlobales: Record<string, number> = {};
        for (const row of resGlobal.rows) {
            if (row.mesa) {
                cuposGlobales[row.mesa.trim()] = Number(row.total) || 0;
            }
        }

        // 2. Conteo por institución y mesa
        const queryInst = `
            SELECT 
                ecer_mesa.ecer_valor AS mesa,
                ecer_inst.ecer_valor AS institucion,
                COUNT(*)::int AS total
            FROM evento_campo_extra_respuesta ecer_mesa
            INNER JOIN evento_campo_extra_respuesta ecer_inst 
                ON ecer_inst.eve_ins_id = ecer_mesa.eve_ins_id
            INNER JOIN evento_inscripcion_v2 ei 
                ON ei.eve_ins_id = ecer_mesa.eve_ins_id
            WHERE ecer_mesa.ece_id = $1
              AND ecer_inst.ece_id = $2
              AND (ei.deleted_at IS NULL)
              ${eventoId ? 'AND ei.eve_id = $3::uuid' : ''}
            GROUP BY ecer_mesa.ecer_valor, ecer_inst.ecer_valor;
        `;
        const paramsInst = eventoId ? [ECE_ID_MESA, ECE_ID_INSTITUCION, eventoId] : [ECE_ID_MESA, ECE_ID_INSTITUCION];
        const resInst = await p.query(queryInst, paramsInst);

        const cuposInstitucion: Record<string, Record<string, number>> = {};
        for (const row of resInst.rows) {
            const inst = (row.institucion || '').trim();
            const mesa = (row.mesa || '').trim();
            if (!cuposInstitucion[inst]) {
                cuposInstitucion[inst] = {};
            }
            cuposInstitucion[inst][mesa] = Number(row.total) || 0;
        }

        // 3. Respuestas específicas del participante consultado (si se envió inscripcionId o ci)
        const respuestasParticipante: Record<string, string> = {};
        if (inscripcionId && inscripcionId !== 'existente') {
            try {
                const queryResp = `
                    SELECT ece_id, ecer_valor 
                    FROM evento_campo_extra_respuesta 
                    WHERE eve_ins_id = $1::uuid
                `;
                const resResp = await p.query(queryResp, [inscripcionId]);
                for (const row of resResp.rows) {
                    respuestasParticipante[row.ece_id] = row.ecer_valor;
                }
            } catch (err: any) {
                console.warn('[API Cupos] Error consultando respuestas por inscripcionId:', err.message);
            }
        } else if (ciParam && eventoId) {
            try {
                const cleanCi = ciParam.split('-')[0].replace(/\D/g, '');
                if (cleanCi) {
                    const queryRespCi = `
                        SELECT ecer.ece_id, ecer.ecer_valor 
                        FROM evento_campo_extra_respuesta ecer
                        INNER JOIN evento_inscripcion_v2 ei ON ei.eve_ins_id = ecer.eve_ins_id
                        INNER JOIN evento_personas ep ON ep.eve_per_id = ei.eve_per_id
                        WHERE ep.eve_per_ci = $1::bigint
                          AND ei.eve_id = $2::uuid
                          AND ei.deleted_at IS NULL
                        ORDER BY ecer.created_at DESC
                    `;
                    const resRespCi = await p.query(queryRespCi, [cleanCi, eventoId]);
                    for (const row of resRespCi.rows) {
                        respuestasParticipante[row.ece_id] = row.ecer_valor;
                    }
                }
            } catch (err: any) {
                console.warn('[API Cupos] Error consultando respuestas por CI:', err.message);
            }
        }

        return NextResponse.json({
            success: true,
            cuposGlobales,
            cuposInstitucion,
            respuestas: respuestasParticipante
        }, { headers: responseHeaders });
    } catch (err: any) {
        console.warn('[API Cupos] Error procesando consulta en PostgreSQL:', err.message);
        return NextResponse.json({
            success: true,
            cuposGlobales: {},
            cuposInstitucion: {},
            respuestas: {},
            warning: err.message
        }, { headers: responseHeaders });
    }
}
