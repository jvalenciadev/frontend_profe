'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersProfileRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.push('/dashboard/mi-ficha');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
                    Redirigiendo a Matriz de Perfil...
                </p>
            </div>
        </div>
    );
}
