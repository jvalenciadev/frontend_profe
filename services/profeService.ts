import api from '@/lib/api';

export interface Profe {
    id: string;
    imagen: string;
    logoPrincipal: string | null;
    nombre: string;
    nombreAbreviado: string | null;
    descripcion: string;
    sobreNosotros: string;
    mision: string;
    vision: string;
    actividad: string;
    fechaCreacion: string;
    correo: string | null;
    celular: string | null;
    telefono: string | null;
    pagina: string | null;
    facebook: string | null;
    tiktok: string | null;
    youtube: string | null;
    ubicacion: string;
    latitud: number | null;
    longitud: number | null;
    banner: string;
    afiche: string;
    convocatoria: string;
    color: string | null;
    colorSecundario: string | null;
    estado: string;
    mantenimiento: boolean;
}

export const profeService = {
    get: async () => {
        const response = await api.get<Profe>('/profe');
        return response.data;
    },

    update: async (id: string, data: Partial<Profe>) => {
        const response = await api.patch<Profe>(`/profe/${id}`, data);
        return response.data;
    },

    create: async (data: Partial<Profe>) => {
        const response = await api.post<Profe>('/profe', data);
        return response.data;
    }
};
