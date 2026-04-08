import { viewsApi as api } from '@/lib/api';

export interface LandingPageData {
    profe: any;
    eventos: any[];
    programas: any[];
    comunicados: any[];
    blogs: any[];
    galerias: any[];
    sedes: any[];
}

export const publicService = {
    /**
     * Obtiene los datos para la landing page, opcionalmente filtrados por tenant
     */
    async getLandingPageData(tenant?: string): Promise<LandingPageData> {
        try {
            const res = await api.get<LandingPageData>('/public/landing-page', {
                params: { tenant },
                // @ts-ignore
                _silent: true
            });
            return res.data as any;
        } catch (error) {
            console.error('Error loading landing page data:', error);
            throw error;
        }
    },

    /**
     * Obtiene la lista de departamentos activos
     */
    async getDepartamentos(): Promise<any[]> {
        try {
            const res = await api.get<any[]>('/public/departamentos', {
                // @ts-ignore
                _silent: true
            });
            return res.data as any;
        } catch (error) {
            return [];
        }
    },

    /**
     * Obtiene la lista de modalidades activas
     */
    async getModalidades(): Promise<any[]> {
        try {
            const res = await api.get<any[]>('/public/modalidades', {
                // @ts-ignore
                _silent: true
            });
            return res.data as any;
        } catch (error) {
            return [];
        }
    },

    /**
     * Obtiene la lista de tipos de evento
     */
    async getTiposEvento(): Promise<any[]> {
        try {
            const res = await api.get<any[]>('/public/tipos-evento', {
                // @ts-ignore
                _silent: true
            });
            return res.data as any;
        } catch (error) {
            return [];
        }
    },

    /**
     * Obtiene el detalle de un programa por ID
     */
    async getProgramaById(id: string): Promise<any> {
        const { data } = await api.get(`/public/programa/${id}`, {
            // @ts-ignore
            _silent: true
        });
        return data;
    },

    /**
     * Verifica si una persona existe por CI + fechaNacimiento
     * Devuelve userId (admins.id) para usar en per_id de programa_inscripcion
     */
    async checkPersonaByDate(ci: string, fechaNacimiento: string, complemento?: string, programaId?: string): Promise<any> {
        const { data } = await api.get('/public/check-persona-by-date', {
            params: { ci, fechaNacimiento, complemento, programaId }
        });
        return data;
    },

    /**
     * Verifica si una persona existe por CI y complemento
     */
    async checkPersona(ci: string, complemento?: string): Promise<any> {
        const { data } = await api.get('/public/check-persona', {
            params: { ci, complemento }
        });
        return data;
    },

    /**
     * Registra una inscripción pública
     */
    async registerInscripcion(registrationData: any): Promise<any> {
        const { data } = await api.post('/public/inscripcion', registrationData);
        return data;
    },

    /**
     * Sube un baucher de manera pública (sin sesión)
     */
    async uploadBaucher(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post('/public/upload/baucher', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    /**
     * Envía un código de verificación al correo
     */
    async sendVerificationCode(correo: string, nombre: string): Promise<any> {
        const { data } = await api.post('/public/send-verification-code', { correo, nombre });
        return data;
    },

    /**
     * Verifica el código enviado al correo
     */
    async verifyCode(correo: string, code: string): Promise<any> {
        const { data } = await api.post('/public/verify-code', { correo, code });
        return data;
    },

    /**
     * Resetea la contraseña usando un código de verificación
     */
    async resetPasswordWithCode(correo: string, code: string, password: unknown): Promise<any> {
        const { data } = await api.post('/public/reset-password-with-code', { correo, code, password });
        return data;
    },
    /**
     * Obtiene la lista completa de artículos del blog/revista
     */
    async getBlogs(tenant?: string): Promise<any[]> {
        try {
            const res = await api.get<any[]>('/public/blogs', {
                params: { tenant },
                // @ts-ignore
                _silent: true
            });
            return res.data as any[];
        } catch (error) {
            return [];
        }
    },

    /**
     * Obtiene el detalle de un artículo por ID
     */
    async getBlogById(id: string): Promise<any> {
        try {
            const res = await api.get<any>(`/public/blog/${id}`, {
                // @ts-ignore
                _silent: true
            });
            return res.data;
        } catch (error) {
            return null;
        }
    },

    /**
     * Obtiene los campos extra activos para el registro público
     */
    async getCamposExtra(): Promise<any[]> {
        try {
            const { data } = await api.get('/public/campos-extra');
            return data;
        } catch (error) {
            return [];
        }
    }
};

export default publicService;
