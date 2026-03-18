import api from '@/lib/api';

export const inscripcionService = {
    getAll: async () => {
        const { data } = await api.get<any>('/inscripciones');
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    getById: async (id: string) => {
        const { data } = await api.get<any>(`/inscripciones/${id}`);
        return data;
    },

    create: async (payload: any) => {
        const { data } = await api.post<any>('/inscripciones', payload);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.patch<any>(`/inscripciones/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/inscripciones/${id}`);
    },

    getEstados: async () => {
        const { data } = await api.get<any>('/estados-inscripcion');
        return Array.isArray(data) ? data : (data.data || []);
    },

    getByOferta: async (ofertaId: string) => {
        const { data } = await api.get<any>(`/inscripciones-clean?programaId=${ofertaId}`);
        return Array.isArray(data) ? data : (data.data || []);
    },

    confirmBaucher: async (baucherId: string, confirmed: boolean) => {
        const { data } = await api.put<any>(`/inscripciones-clean/baucher/${baucherId}/confirmar`, { confirmed });
        return data;
    },

    confirmInscripcion: async (id: string) => {
        const { data } = await api.put<any>(`/inscripciones-clean/${id}/confirmar-inscripcion`);
        return data;
    }
};
