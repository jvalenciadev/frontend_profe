import api from '@/lib/api';

export const asignacionService = {
    getAll: async () => {
        const { data } = await api.get<any>('/asignaciones-facilitadores');
        return Array.isArray(data) ? data : (data?.data || []);
    },

    getByPrograma: async (programaId: string) => {
        const { data } = await api.get<any>(`/asignaciones-facilitadores?programaId=${programaId}`);
        return Array.isArray(data) ? data : (data?.data || []);
    },

    create: async (payload: {
        programaId: string;
        moduloId: string;
        turnoId: string;
        facilitadorId: string;
    }, config: any = {}) => {
        const { data } = await api.post<any>('/asignaciones-facilitadores', payload, config);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.patch<any>(`/asignaciones-facilitadores/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/asignaciones-facilitadores/${id}`);
    }
};
