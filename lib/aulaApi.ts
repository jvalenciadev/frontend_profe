import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_LMS_API_URL || 'http://localhost:3008/api/aula';
const API_SECRET = process.env.NEXT_PUBLIC_LMS_API_SECRET || 'LMS_SEC_key_2024_0bb62283a6691_aula_virtual';

export const aulaApi = axios.create({
    baseURL: API_URL,
    headers: { 'X-SECRET': API_SECRET }
});

aulaApi.interceptors.request.use((config) => {
    // Si ya viene un token (inyectado desde el servidor), no lo tocamos
    if (config.headers.Authorization) {
        config.headers['X-SECRET'] = API_SECRET;
        return config;
    }

    // Usar exclusivamente aula_token (cookie) - Solo en cliente
    if (typeof window !== 'undefined') {
        const token = Cookies.get('aula_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['X-SECRET'] = API_SECRET;
    return config;
});

aulaApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                // Limpiar tokens y redirigir
                Cookies.remove('aula_token');
                Cookies.remove('aula_user');
                if (!window.location.pathname.includes('/aula/login')) {
                    window.location.href = '/aula/login';
                }
            }
        }
        return Promise.reject(error);
    }
);
