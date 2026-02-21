'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

/**
 * Renderiza el Navbar solo en rutas públicas (no en /dashboard, /login, /register)
 */
export default function ConditionalNavbar() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const routesToHide = [
        '/dashboard',
        '/login',
        '/register',
        '/registro-profe'
    ];

    const shouldHide = routesToHide.some(route => pathname?.startsWith(route));

    if (shouldHide) return null;

    return <Navbar />;
}
