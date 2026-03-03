import { useState, useCallback } from 'react';
import { CargoApi } from '../infrastructure/CargoApi';
import { Cargo } from '../domain/Cargo';
import { toast } from 'sonner';

export const useCargos = () => {
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadCargos = useCallback(async (search: string = '') => {
        try {
            setLoading(true);
            setError(null);
            const data = await CargoApi.getAll(search);
            setCargos(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar cargos');
            toast.error('Error al cargar cargos');
        } finally {
            setLoading(false);
        }
    }, []);

    const createCargo = async (cargoData: Partial<Cargo>) => {
        try {
            setLoading(true);
            await CargoApi.create(cargoData);
            toast.success('Cargo creado');
            await loadCargos();
            return true;
        } catch (err) {
            toast.error('Error al crear el cargo');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateCargo = async (id: string, cargoData: Partial<Cargo>) => {
        try {
            setLoading(true);
            await CargoApi.update(id, cargoData);
            toast.success('Cargo actualizado');
            await loadCargos();
            return true;
        } catch (err) {
            toast.error('Error al actualizar el cargo');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteCargo = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este cargo?')) return;
        try {
            setLoading(true);
            await CargoApi.delete(id);
            toast.success('Cargo eliminado');
            await loadCargos();
        } catch (err) {
            toast.error('No se pudo eliminar el cargo');
        } finally {
            setLoading(false);
        }
    };

    return {
        cargos,
        loading,
        error,
        loadCargos,
        createCargo,
        updateCargo,
        deleteCargo
    };
};
