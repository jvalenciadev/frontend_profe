import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import {
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
            INNER JOIN evento_inscripcion ei 
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
            INNER JOIN evento_inscripcion ei 
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

        return NextResponse.json({
            success: true,
            cuposGlobales,
            cuposInstitucion
        }, { headers: responseHeaders });
    } catch (err: any) {
        console.warn('[API Cupos] No se pudo obtener conteo de BD (devolviendo conteo vacío seguro):', err.message);
        return NextResponse.json({
            success: true,
            cuposGlobales: {},
            cuposInstitucion: {},
            warning: err.message
        }, { headers: responseHeaders });
    }
}
