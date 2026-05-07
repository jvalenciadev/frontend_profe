import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) {
        return path;
    }

    // Lógica Senior: Si estamos en el navegador, usamos rutas relativas.
    // El proxy configurado en next.config.ts se encargará de redirigir a la API.
    if (typeof window !== 'undefined') {
        let normalizedPath = path.startsWith('/') ? path : `/${path}`;
        if (!normalizedPath.toLowerCase().startsWith('/uploads/') && !normalizedPath.toLowerCase().startsWith('uploads/')) {
            normalizedPath = `/uploads${normalizedPath}`;
        }
        return normalizedPath;
    }

    // Lógica para SSR (Servidor)
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    if (baseUrl.toLowerCase().endsWith('/api')) baseUrl = baseUrl.slice(0, -4);

    let normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (!normalizedPath.toLowerCase().startsWith('/uploads/') && !normalizedPath.toLowerCase().startsWith('uploads/')) {
        normalizedPath = `/uploads${normalizedPath}`;
    }

    return `${baseUrl}${normalizedPath}`;
}

export function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
}
