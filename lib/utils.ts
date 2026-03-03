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

    // Usar la URL de la API configurada
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    // Limpiar la URL base (quitar diagonal final si existe)
    const cleanBaseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    // Asegurar que el path sea relativo a uploads si no lo es ya
    let cleanPath = path;
    if (!cleanPath.startsWith('/uploads/') && !cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.startsWith('/') ? `/uploads${cleanPath}` : `/uploads/${cleanPath}`;
    } else {
        cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    }

    return `${cleanBaseUrl}${cleanPath}`;
}
