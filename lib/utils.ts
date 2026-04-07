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

    // Usar la URL de la API configurada (puerto 3000 por defecto para recursos compartidos)
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Limpiar la URL base (quitar diagonal final si existe)
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }

    // Si la URL base termina en /api, lo quitamos para los recursos estáticos (uploads)
    if (baseUrl.toLowerCase().endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
    }

    // Normalizar el path: asegurar que empiece con /
    let normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Si el path no incluye /uploads/ ni uploads/, lo añadimos
    if (!normalizedPath.toLowerCase().startsWith('/uploads/') && !normalizedPath.toLowerCase().startsWith('uploads/')) {
        normalizedPath = `/uploads${normalizedPath}`;
    }

    // Evitar dobles diagonales al unir
    return `${baseUrl}${normalizedPath}`;
}

export function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
}
