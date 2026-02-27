import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MapCatalogo {
    id: string;
    nombre: string;
    estado: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface MapPersona {
    id: string;
    ci: string;
    complemento?: string;
    nombre1?: string;
    nombre2?: string;
    apellido1?: string;
    apellido2?: string;
    fechaNacimiento: string;
    celular: number;
    correo: string;
    enFuncion: boolean;
    libretaMilitar: boolean;
    estado: string;
    genId: string;
    areaId: string;
    espId: string;
    catId: string;
    carId: string;
    subId: string;
    nivId: string;
    // relaciones incluidas
    cargo?: MapCatalogo;
    categoria?: MapCatalogo;
    especialidad?: MapCatalogo;
    subsistema?: MapCatalogo;
    nivel?: MapCatalogo;
}

export interface MapPersonaListResponse {
    data: MapPersona[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface MapPersonaFilters {
    search?: string;
    carId?: string;
    catId?: string;
    espId?: string;
    subId?: string;
    nivId?: string;
    estado?: string;
    page?: number;
    limit?: number;
}

// ─── Services ─────────────────────────────────────────────────────────────────

export const mapPersonaService = {
    getAll: async (filters: MapPersonaFilters = {}): Promise<MapPersonaListResponse> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && value !== null) {
                params.append(key, String(value));
            }
        });
        const response = await api.get<MapPersonaListResponse>(`/map-personas?${params.toString()}`);
        return response.data;
    },
};

export const mapCargoService = {
    getAll: async (): Promise<MapCatalogo[]> => {
        const response = await api.get<MapCatalogo[]>('/map-cargos');
        return response.data;
    },
};

export const mapCategoriaService = {
    getAll: async (): Promise<MapCatalogo[]> => {
        const response = await api.get<MapCatalogo[]>('/map-categorias');
        return response.data;
    },
};

export const mapEspecialidadService = {
    getAll: async (): Promise<MapCatalogo[]> => {
        const response = await api.get<MapCatalogo[]>('/map-especialidades');
        return response.data;
    },
};

export const mapNivelService = {
    getAll: async (): Promise<MapCatalogo[]> => {
        const response = await api.get<MapCatalogo[]>('/map-niveles');
        return response.data;
    },
};

export const mapSubsistemaService = {
    getAll: async (): Promise<MapCatalogo[]> => {
        const response = await api.get<MapCatalogo[]>('/map-subsistemas');
        return response.data;
    },
};
