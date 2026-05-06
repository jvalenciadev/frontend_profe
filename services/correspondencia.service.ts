import api from '@/lib/api';

// Servicio API para el módulo de Correspondencia
// Utiliza el cliente global 'api' que ya maneja Token JWT y X-SECRET

// ── Tipos ──────────────────────────────────────────────────────────────────────

export type CorTipoDocumento = 'INFORME' | 'NOTA_INTERNA' | 'MEMORANDUM' | 'INSTRUCTIVO';

export interface CorUsuario {
    id: string;
    nombre: string;
    apellidos: string;
    cargoStr: string | null;
    imagen?: string | null;
}

export interface CorParticipante {
    id: string;
    userId: string;
    rol: 'DESTINATARIO' | 'VIA' | 'REMITENTE';
    usuario: CorUsuario;
}

export interface CorSeguimiento {
    id: string;
    fecha: string;
    accion: string;
    detalle: string | null;
    usuario: CorUsuario;
    archivoUrl: string | null;
}

export interface CorDocumento {
    id: string;
    tipo: CorTipoDocumento;
    cite: string;
    hr: string | null;
    correlativo: number;
    gestion: number;
    referencia: string;
    contenido: string | null;
    estado: string;
    createdAt: string;
    participantes: CorParticipante[];
    seguimientos: CorSeguimiento[];
}

export interface CreateCorrespondenciaPayload {
    tipo: CorTipoDocumento;
    hr?: string;
    referencia: string;
    contenido?: string;
    destinatarios: { userId: string; cargoLiteral?: string }[];
    vias?: { userId: string; cargoLiteral?: string }[];
    remitentes: { userId: string; cargoLiteral?: string }[];
}

// ── Funciones API ──────────────────────────────────────────────────────────────

/**
 * Crear nuevo documento (genera CITE automático)
 */
export async function crearCorrespondencia(
    payload: CreateCorrespondenciaPayload,
): Promise<CorDocumento> {
    const { data } = await api.post<CorDocumento>('/correspondencia', payload);
    return data;
}

/**
 * Buscar documento por CITE (para la página de seguimiento)
 */
export async function buscarPorCite(cite: string): Promise<CorDocumento> {
    const { data } = await api.get<CorDocumento>('/correspondencia/buscar', {
        params: { cite }
    });
    return data;
}

export interface CorBandeja {
    recibidos: CorDocumento[];
    enviados: CorDocumento[];
    enProceso: CorDocumento[];
    archivados: CorDocumento[];
}

/**
 * Obtener bandeja del usuario autenticado clasificada por categorías
 */
export async function obtenerBandeja(): Promise<CorBandeja> {
    const { data } = await api.get<CorBandeja>('/correspondencia/bandeja');
    return data;
}

/**
 * Buscar usuarios por nombre/cargo para el autocompletado
 */
export async function buscarUsuarios(q: string): Promise<CorUsuario[]> {
    const { data } = await api.get<CorUsuario[]>('/correspondencia/usuarios', {
        params: { q }
    });
    return data;
}

/**
 * Avanzar el estado de un documento con soporte para derivación y archivos
 */
export async function avanzarEstado(
    documentoId: string,
    accion: string,
    detalle: string,
    archivoUrl?: string,
    nuevoDestinatarioId?: string,
): Promise<void> {
    await api.put(`/correspondencia/${documentoId}/avanzar`, {
        accion,
        detalle,
        archivoUrl,
        nuevoDestinatarioId
    });
}

export async function subirPdf(id: string, url: string): Promise<void> {
    await api.post(`/correspondencia/${id}/pdf`, { url });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export const PREFIJOS: Record<CorTipoDocumento, string> = {
    INFORME: 'INF',
    NOTA_INTERNA: 'NI',
    MEMORANDUM: 'MEM',
    INSTRUCTIVO: 'INST',
};

export const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
    ELABORACION: { label: 'Elaboración', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    ENVIADO: { label: 'Enviado', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    RECIBIDO: { label: 'Recibido', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    EN_TRAMITE: { label: 'En Trámite', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    ARCHIVADO: { label: 'Archivado', color: 'bg-muted text-muted-foreground border-border' },
};
