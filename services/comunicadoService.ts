import api from '@/lib/api';

export interface Comunicado {
    id: string;
    nombre: string;
    descripcion: string;
    imagen: string;
    tipo?: string;
    importancia: string;
    estado?: string;
    tenantId?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

class ComunicadoService {
    async getAll(search?: string): Promise<Comunicado[]> {
        const params = search ? { search } : {};
        const response = await api.get('/comunicados', { params });
        return response.data;
    }

    async getById(id: string): Promise<Comunicado> {
        const response = await api.get(`/comunicados/${id}`);
        return response.data;
    }

    async create(data: Partial<Comunicado>): Promise<Comunicado> {
        const response = await api.post('/comunicados', data);
        return response.data;
    }

    async update(id: string, data: Partial<Comunicado>): Promise<Comunicado> {
        const response = await api.patch(`/comunicados/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/comunicados/${id}`);
    }
}

export const comunicadoService = new ComunicadoService();
