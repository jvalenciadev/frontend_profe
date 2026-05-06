import axios from 'axios';
import Cookies from 'js-cookie';
import { errorStore } from './error-store';
import { toast } from 'sonner';

// Configuración de constantes de entorno
// Durante SSG/SSR en Node, es imperativo tener URLs absolutas para evitar DEP0169 (url.parse)
const API_URL = typeof window === 'undefined' ? 'http://127.0.0.1:3000' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011');
const VIEWS_API_URL = typeof window === 'undefined' ? 'http://127.0.0.1:3005' : (process.env.NEXT_PUBLIC_VIEWS_API_URL || 'http://localhost:3005');
// IMPORTANTE: El fallback debe coincidir con API_SECRET_KEY del backend
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET || 'qjmwyxYXMqe';
const LMS_API_URL = typeof window === 'undefined' ? 'http://127.0.0.1:3008/api/aula' : (process.env.NEXT_PUBLIC_LMS_API_URL || 'http://localhost:3008/api/aula');
const LMS_API_SECRET = process.env.NEXT_PUBLIC_LMS_API_SECRET || 'LMS_SEC_key_2024_0bb62283a6691_aula_virtual';

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

/**
 * API AULA VIRTUAL (LMS)
 * Requiere sesión (aula_token) y su propio X-SECRET
 */
export const lmsApi = axios.create({
    baseURL: LMS_API_URL,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-SECRET': LMS_API_SECRET
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

// Interceptor de Request para API LMS (usa aula_token)
lmsApi.interceptors.request.use(
    (config) => {
        const token = Cookies.get('aula_token');
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
    // Ya no disparamos toasts automáticos aquí porque
    // cada vista y custom hook (ej. useUsers, EventoPublicoClient)
    // lanza sus propios mensajes personalizados, evitando duplicados molestos.
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
lmsApi.interceptors.response.use(handleResponseSuccess, handleResponseError);

export default api;
