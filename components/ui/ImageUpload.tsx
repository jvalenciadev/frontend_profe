'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadService } from '@/services/uploadService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    tableName: string;
    label?: string;
    className?: string;
    maxSizeMB?: number;
    allowedTypes?: string[];
    showPreview?: boolean;
}

export function ImageUpload({
    value,
    onChange,
    tableName,
    label = 'Subir Imagen',
    className,
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    showPreview = true,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar archivo
        const validation = uploadService.validateFile(file, maxSizeMB, allowedTypes);
        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        try {
            setUploading(true);

            // Generar preview
            if (showPreview) {
                const base64 = await uploadService.fileToBase64(file);
                setPreview(base64);
            }

            // Subir archivo
            const response = await uploadService.uploadFile(file, tableName);

            if (response.success) {
                // Actualizar con la URL del servidor
                onChange(response.data.path);
                toast.success('Imagen subida correctamente');
            }
        } catch (error: any) {
            console.error('Error uploading file:', error);
            toast.error(error?.response?.data?.message || 'Error al subir la imagen');
            setPreview(value || null);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={cn('space-y-3', className)}>
            {label && (
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}

            <div className="relative">
                {preview ? (
                    <div className="relative group">
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-border bg-muted/30">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleClick}
                                    disabled={uploading}
                                    className="p-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    <Upload className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    disabled={uploading}
                                    className="p-3 rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {uploading && (
                            <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3 text-white">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Subiendo...</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={handleClick}
                        disabled={uploading}
                        className="w-full p-10 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 transition-colors bg-muted/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-12 h-12 text-primary mb-4 animate-spin" />
                                <p className="text-[11px] font-black uppercase tracking-widest text-foreground">
                                    Subiendo imagen...
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-8 h-8" />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-foreground">
                                    {label}
                                </p>
                                <p className="text-[9px] font-bold uppercase text-muted-foreground mt-1">
                                    Arrastra o haz clic para seleccionar
                                </p>
                                <p className="text-[8px] font-medium text-muted-foreground/60 mt-2">
                                    Máximo {maxSizeMB}MB • {allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}
                                </p>
                            </>
                        )}
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={allowedTypes.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
        </div>
    );
}
