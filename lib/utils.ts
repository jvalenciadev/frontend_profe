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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    // Asegurar que no haya doble diagonal
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
}
