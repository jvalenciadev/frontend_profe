import api from '@/lib/api';

export interface UploadResponse {
    success: boolean;
    message: string;
    data: {
        filename: string;
        path: string;
        size: number;
        mimetype: string;
    };
}

class UploadService {
    /**
     * Sube un archivo al servidor
     * @param file - Archivo a subir
     * @param tableName - Nombre de la tabla (eventos, blogs, comunicados, etc.)
     * @returns Información del archivo subido
     */
    async uploadFile(file: File, tableName: string): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<UploadResponse>(`/upload/${tableName}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    }

    /**
     * Valida un archivo antes de subirlo
     * @param file - Archivo a validar
     * @param maxSizeMB - Tamaño máximo en MB (default: 5MB)
     * @param allowedTypes - Tipos MIME permitidos
     */
    validateFile(
        file: File,
        maxSizeMB: number = 5,
        allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    ): { valid: boolean; error?: string } {
        // Validar tamaño
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            return {
                valid: false,
                error: `El archivo excede el tamaño máximo permitido (${maxSizeMB}MB)`,
            };
        }

        // Validar tipo
        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`,
            };
        }

        return { valid: true };
    }

    /**
     * Convierte un archivo a base64 para preview
     */
    async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

export const uploadService = new UploadService();
