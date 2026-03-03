import { useState, useCallback } from 'react';
import { BancoProfesionalApi } from '../infrastructure/BancoProfesionalApi';
import { BancoProfesional } from '../domain/BancoProfesional';
import { toast } from 'sonner';

export const useMyProfile = () => {
    const [profile, setProfile] = useState<BancoProfesional | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await BancoProfesionalApi.getMyProfile();
            setProfile(data);
        } catch (err: any) {
            toast.error('Error al cargar perfil');
        } finally {
            setLoading(false);
        }
    }, []);

    const updateProfile = async (data: Partial<BancoProfesional>) => {
        try {
            setLoading(true);
            const updated = await BancoProfesionalApi.updateMyProfile(data);
            setProfile(updated);
            toast.success('Perfil actualizado correctamente');
            return true;
        } catch (err) {
            toast.error('Error al actualizar perfil');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { profile, loading, loadProfile, updateProfile };
};
