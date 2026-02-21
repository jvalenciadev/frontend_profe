import api from '@/lib/api';

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
        const { data } = await api.get<LandingPageData>('/public/landing-page', {
            params: { tenant }
        });
        return data;
    },

    /**
     * Obtiene la lista de departamentos activos
     */
    async getDepartamentos(): Promise<any[]> {
        const { data } = await api.get<any[]>('/public/departamentos');
        return data;
    }
};

export default publicService;
