import api from '@/lib/api';

export const galeriaService = {
    getAll: async () => {
        const { data } = await api.get<any>('/galerias');
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    getById: async (id: string) => {
        const { data } = await api.get<any>(`/galerias/${id}`);
        return data;
    },

    create: async (payload: any) => {
        const { data } = await api.post<any>('/galerias', payload);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.put<any>(`/galerias/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/galerias/${id}`);
    }
};
