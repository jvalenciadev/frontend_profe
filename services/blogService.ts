import api from '@/lib/api';

export interface Blog {
    id: string;
    titulo: string;
    descripcion?: string;
    imagenes?: any;
    tipo?: string;
    fecha?: string;
    estado?: string;
    tenantId?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

class BlogService {
    async getAll(search?: string): Promise<Blog[]> {
        const params = search ? { search } : {};
        const response = await api.get('/blogs', { params });
        console.log('[DEBUG RAW API] getAll blogs:', response.data);
        return response.data;
    }

    async getById(id: string): Promise<Blog> {
        const response = await api.get(`/blogs/${id}`);
        return response.data;
    }

    async create(data: Partial<Blog>): Promise<Blog> {
        const response = await api.post('/blogs', data);
        return response.data;
    }

    async update(id: string, data: Partial<Blog>): Promise<Blog> {
        const response = await api.patch(`/blogs/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/blogs/${id}`);
    }
}

export const blogService = new BlogService();
