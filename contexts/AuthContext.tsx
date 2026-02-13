'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { authService } from '@/services/authService';
import { defineAbilityFromPermissions, AppAbility } from '@/lib/ability';

interface AuthContextType {
    user: User | null;
    token: string | null;
    ability: AppAbility;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (newUser: User) => void;
    isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [ability, setAbility] = useState<AppAbility>(defineAbilityFromPermissions([], []));
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const getRolesFromUser = (user: User | null): string[] => {
        if (!user) return [];
        const roles: string[] = [];

        // 1. Verificar relación singular 'role'
        if (user.role) {
            if (typeof user.role === 'string') roles.push(user.role);
            else if (typeof user.role === 'object' && (user.role as any).name) roles.push((user.role as any).name);
        }

        // 2. Verificar relación plural 'roles'
        if (user.roles && Array.isArray(user.roles)) {
            user.roles.forEach(r => {
                if (typeof r === 'string') roles.push(r);
                else if (r && typeof r === 'object') {
                    if ('role' in r && (r as any).role?.name) roles.push((r as any).role.name);
                    else if ('name' in r) roles.push((r as any).name);
                }
            });
        }

        return [...new Set(roles)].filter(Boolean);
    };

    const getPermissionsFromUser = (user: User | null): any[] => {
        if (!user || !user.permissions) return [];
        return user.permissions.map(p => {
            if ('permission' in p) return p.permission;
            return p;
        });
    };

    // Cargar usuario desde cookies al montar
    useEffect(() => {
        const loadUser = async () => {
            const savedToken = Cookies.get('token');
            const savedUser = Cookies.get('user');

            if (savedToken && savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    // Asegurar que tenantId esté presente si existe tenant object
                    if (!parsedUser.tenantId && parsedUser.tenant?.id) {
                        parsedUser.tenantId = parsedUser.tenant.id;
                    }

                    setToken(savedToken);
                    setUser(parsedUser);
                    setAbility(defineAbilityFromPermissions(
                        getPermissionsFromUser(parsedUser),
                        getRolesFromUser(parsedUser)
                    ));
                } catch (error) {
                    console.error('Error parsing user from cookies:', error);
                    Cookies.remove('token');
                    Cookies.remove('user');
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, []);

    const login = (newToken: string, newUser: User) => {
        // Asegurar tenantId
        if (!newUser.tenantId && newUser.tenant?.id) {
            newUser.tenantId = newUser.tenant.id;
        }

        setToken(newToken);
        setUser(newUser);
        setAbility(defineAbilityFromPermissions(
            getPermissionsFromUser(newUser),
            getRolesFromUser(newUser)
        ));

        // Guardar en cookies (7 días)
        Cookies.set('token', newToken, { expires: 7 });
        Cookies.set('user', JSON.stringify(newUser), { expires: 7 });
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setAbility(defineAbilityFromPermissions([], []));

        Cookies.remove('token');
        Cookies.remove('user');

        router.push('/login');
    };

    const updateUser = (newUser: User) => {
        setUser(newUser);
        setAbility(defineAbilityFromPermissions(
            getPermissionsFromUser(newUser),
            getRolesFromUser(newUser)
        ));
        Cookies.set('user', JSON.stringify(newUser), { expires: 7 });
    };

    const isSuperAdmin = (): boolean => {
        const roles = getRolesFromUser(user);
        return roles.includes('SUPER_ADMIN') || roles.includes('ADMINISTRADOR_SISTEMA');
    };

    const value: AuthContextType = {
        user,
        token,
        ability,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        updateUser,
        isSuperAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
