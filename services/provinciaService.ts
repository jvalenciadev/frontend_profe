import api from '@/lib/api';

export const provinciaService = {
    getAll: async () => {
        const { data } = await api.get<any>('/provincias');
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    getById: async (id: string) => {
        const { data } = await api.get<any>(`/provincias/${id}`);
        return data;
    },

    create: async (payload: any) => {
        const { data } = await api.post<any>('/provincias', payload);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.put<any>(`/provincias/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/provincias/${id}`);
    }
};
