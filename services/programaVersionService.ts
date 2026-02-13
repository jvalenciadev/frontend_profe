import api from '@/lib/api';

export const programaVersionService = {
    getAll: async () => {
        const { data } = await api.get<any>('/programa-versiones');
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    },

    getById: async (id: string) => {
        const { data } = await api.get<any>(`/programa-versiones/${id}`);
        return data;
    },

    create: async (payload: any) => {
        const { data } = await api.post<any>('/programa-versiones', payload);
        return data;
    },

    update: async (id: string, payload: any) => {
        const { data } = await api.put<any>(`/programa-versiones/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/programa-versiones/${id}`);
    },

    versionalizar: async (masterId: string, payload: any) => {
        const { data } = await api.post<any>(`/academic-ops/versionalizar/${masterId}`, payload);
        return data;
    }
};
