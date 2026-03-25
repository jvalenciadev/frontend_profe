import api from '@/lib/api';

export const uploadConfigService = {
    getAll: async () => {
        const response = await api.get('/upload-configs');
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/upload-configs/${id}`, data);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/upload-configs', data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/upload-configs/${id}`);
        return response.data;
    }
};
