import api from '@/lib/api';

export interface Evento {
    id: string;
    nombre: string;
    codigo?: string;
    descripcion: string;
    banner: string;
    afiche: string;
    modalidadIds: string;
    fecha: string;
    inscripcionAbierta: boolean;
    asistencia?: boolean;
    lugar: string;
    totalInscritos: number;
    estado?: string;
    tipoId: string;
    tenantId?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

class EventoService {
    async getAll(search?: string): Promise<Evento[]> {
        const params = search ? { search } : {};
        const response = await api.get('/eventos', { params });
        return response.data;
    }

    async getById(id: string): Promise<Evento> {
        const response = await api.get(`/eventos/${id}`);
        return response.data;
    }

    async create(data: Partial<Evento>): Promise<Evento> {
        const response = await api.post('/eventos', data);
        return response.data;
    }

    async update(id: string, data: Partial<Evento>): Promise<Evento> {
        const response = await api.patch(`/eventos/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/eventos/${id}`);
    }

    async getTipos(): Promise<any[]> {
        const response = await api.get('/tipos-evento');
        return response.data;
    }
}

export const eventoService = new EventoService();
