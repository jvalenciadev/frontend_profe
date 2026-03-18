import axios from 'axios';
import Cookies from 'js-cookie';
import { errorStore } from './error-store';
import { toast } from 'sonner';

// Configuración de constantes de entorno
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const VIEWS_API_URL = process.env.NEXT_PUBLIC_VIEWS_API_URL || 'http://localhost:3005';
// IMPORTANTE: El fallback debe coincidir con API_SECRET_KEY del backend
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET || 'mQsYt86mu5wiiqjmwyxYXMqeHVo4lRqIT6dQUwqYqzM=';

/**
 * API PRINCIPAL (Backend Administrativo / Dashboard)
 * Requiere sesión (JWT) y X-SECRET
 */
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-SECRET': API_SECRET
    },
});

/**
 * API DE VISTAS PÚBLICAS (Página Principal, Inscripciones)
 * No requiere sesión, sólo X-SECRET
 */
export const viewsApi = axios.create({
    baseURL: VIEWS_API_URL,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-SECRET': API_SECRET
    },
});

// Interceptor de Request para API Principal (incluye Token)
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        if (token && config.headers && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (!config.timeout) config.timeout = 30000;
        return config;
    },
    (error) => Promise.reject(error)
);

// Manejo Global de Errores para ambas APIs
const handleResponseSuccess = (response: any) => {
    const isSilent = (response.config as any)._silent;
    if (isSilent) return response;

    const method = response.config?.method?.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
        if (response.status === 201) {
            toast.success('¡Registro exitoso!', { className: 'bg-emerald-500 text-white' });
        } else if (response.status === 200 && method !== 'GET') {
            toast.success('¡Operación exitosa!', { className: 'bg-emerald-600 text-white' });
        }
    }
    return response;
};

const handleResponseError = (error: any) => {
    const isSilent = (error.config as any)._silent;
    const backendError = error.response?.data;
    const status = error.response?.status;

    if (isSilent) return Promise.reject(error);

    if (status === 401) {
        Cookies.remove('token');
        Cookies.remove('user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    }

    if (backendError && backendError.success === false) {
        if ([403, 409, 500, 503].includes(status)) {
            errorStore.setError(backendError);
        } else {
            toast.error(`Error ${status}: ${backendError.title || 'Error'}`, {
                description: backendError.message,
                className: 'bg-rose-500 text-white'
            });
        }
    } else {
        errorStore.setError({
            success: false,
            statusCode: status || 500,
            timestamp: new Date().toISOString(),
            path: error.config?.url || 'unknown',
            method: error.config?.method || 'unknown',
            message: error.message || 'Error de conexión',
            errorCode: 'SERVER_OR_NETWORK_ERROR'
        });
    }

    return Promise.reject(error);
};

api.interceptors.response.use(handleResponseSuccess, handleResponseError);
viewsApi.interceptors.response.use(handleResponseSuccess, handleResponseError);

export default api;
