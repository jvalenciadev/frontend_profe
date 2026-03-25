import { aulaApi } from '@/lib/aulaApi';

export const aulaUploadConfigService = {
    getAll: async () => {
        const response = await aulaApi.get('/upload-configs');
        return response.data;
    },
    findOneByTable: async (tableName: string) => {
        const response = await aulaApi.get(`/upload-configs/${tableName}`);
        return response.data;
    }
};
