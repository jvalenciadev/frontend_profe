import api from '@/lib/api';

export const programaMaestroService = {
    getAll: async () => {
        const { data } = await api.get<any>('/programas-maestros');
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    getById: async (id: string) => {
        const { data } = await api.get<any>(`/programas-maestros/${id}`);
        return data;
    },

    create: async (payload: any) => {
        const { data } = await api.post<any>('/programas-maestros', payload);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.put<any>(`/programas-maestros/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/programas-maestros/${id}`);
    }
};
