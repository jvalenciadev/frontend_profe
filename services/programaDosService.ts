import api from '@/lib/api';

export const programaDosService = {
    getAll: async () => {
        const { data } = await api.get<any>('/programa-dos');
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    getById: async (id: string) => {
        const { data } = await api.get<any>(`/programa-dos/${id}`);
        return data;
    },

    create: async (payload: any) => {
        const { data } = await api.post<any>('/programa-dos', payload);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.put<any>(`/programa-dos/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/programa-dos/${id}`);
    }
};
