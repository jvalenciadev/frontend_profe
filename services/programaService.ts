import api from '@/lib/api';

export const programaService = {
    getAll: async () => {
        const { data } = await api.get<any>('/programas');
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    getById: async (id: string) => {
        const { data } = await api.get<any>(`/programas/${id}`);
        return data;
    },

    create: async (payload: any) => {
        const { data } = await api.post<any>('/programas', payload);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.patch<any>(`/programas/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/programas/${id}`);
    }
};
