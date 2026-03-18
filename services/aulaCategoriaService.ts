import api from '@/lib/api';

/**
 * aulaCategoriaService
 *
 * Servicio frontend para gestión de categorías de calificación LMS
 * a través del API del Dashboard (puerto 3000 / backend académico).
 */
export const aulaCategoriaService = {

    // ─── CONFIG GLOBAL POR TIPO DE PROGRAMA ────────────────────────────
    /**
     * Retorna todos los tipos de programa con sus categorías configuradas.
     */
    getTiposConConfig: async () => {
        const { data } = await api.get('/aula-categorias/tipo-config');
        return data;
    },

    /**
     * Retorna las categorías configuradas para un tipo de programa específico.
     */
    getConfigByTipo: async (tipoProgramaId: string) => {
        const { data } = await api.get(`/aula-categorias/tipo-config/${tipoProgramaId}`);
        return data;
    },

    /**
     * Crea una nueva categoría de calificación para un tipo de programa.
     */
    createConfig: async (tipoProgramaId: string, payload: {
        nombre: string;
        peso: number;
        esEvalFinal?: boolean;
        orden?: number;
    }) => {
        const { data } = await api.post(`/aula-categorias/tipo-config/${tipoProgramaId}`, payload);
        return data;
    },

    /**
     * Actualiza una categoría de configuración existente.
     */
    updateConfig: async (id: string, payload: {
        nombre?: string;
        peso?: number;
        esEvalFinal?: boolean;
        orden?: number;
    }) => {
        const { data } = await api.put(`/aula-categorias/tipo-config/${id}`, payload);
        return data;
    },

    /**
     * Elimina (soft delete) una configuración de tipo.
     */
    deleteConfig: async (id: string) => {
        await api.delete(`/aula-categorias/tipo-config/${id}`);
    },

    /**
     * Aplica la configuración de un tipo de programa a un módulo.
     */
    aplicarConfigAModulo: async (moduloId: string, tipoProgramaId: string) => {
        const { data } = await api.post(`/aula-categorias/modulo/${moduloId}/aplicar-config`, { tipoProgramaId });
        return data;
    },

    // ─── MÓDULOS ────────────────────────────────────────────────────────

    /**
     * Retorna los módulos asignados al facilitador autenticado.
     */
    getMisModulos: async () => {
        const { data } = await api.get('/aula-categorias/mis-modulos');
        return data;
    },

    /**
     * Retorna todos los módulos del sistema (para admins del dashboard).
     */
    getAllModulos: async (params?: { search?: string; tipoProgramaId?: string }) => {
        const { data } = await api.get('/aula-categorias/todos-modulos', { params });
        return data;
    },

    // ─── CATEGORÍAS POR MÓDULO ──────────────────────────────────────────

    /**
     * Retorna las categorías instanciadas para un módulo específico.
     */
    getAll: async (moduloId: string) => {
        const { data } = await api.get(`/aula-categorias/${moduloId}`);
        return data;
    },

    /**
     * Crea una nueva categoría en un módulo específico.
     */
    create: async (moduloId: string, payload: { nombre: string; ponderacion: number; esEvalFinal?: boolean }) => {
        const { data } = await api.post(`/aula-categorias/${moduloId}`, payload);
        return data;
    },

    /**
     * Actualiza una categoría existente en un módulo.
     */
    update: async (id: string, payload: { nombre?: string; ponderacion?: number; esEvalFinal?: boolean }) => {
        const { data } = await api.put(`/aula-categorias/${id}`, payload);
        return data;
    },

    /**
     * Elimina (soft delete) una categoría de un módulo.
     */
    delete: async (id: string) => {
        await api.delete(`/aula-categorias/${id}`);
    },
};
