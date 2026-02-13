import api from '@/lib/api';

export const distritoService = {
    getAll: async () => {
        const { data } = await api.get<any>('/distritos');
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    getById: async (id: string) => {
        const { data } = await api.get<any>(`/distritos/${id}`);
        return data;
    },

    create: async (payload: any) => {
        const { data } = await api.post<any>('/distritos', payload);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.put<any>(`/distritos/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/distritos/${id}`);
    }
};
