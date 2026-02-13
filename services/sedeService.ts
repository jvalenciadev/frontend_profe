import api from '@/lib/api';

export const sedeService = {
    getAll: async () => {
        const { data } = await api.get<any>('/sedes');
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    getById: async (id: string) => {
        const { data } = await api.get<any>(`/sedes/${id}`);
        return data;
    },

    create: async (payload: any) => {
        const { data } = await api.post<any>('/sedes', payload);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.put<any>(`/sedes/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/sedes/${id}`);
    }
};
