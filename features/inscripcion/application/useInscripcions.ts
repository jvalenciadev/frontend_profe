import { useState, useCallback } from 'react';
import { InscripcionApi } from '../infrastructure/InscripcionApi';
import { Inscripcion } from '../domain/Inscripcion';
import { toast } from 'sonner';

export const useInscripcions = () => {
  const [items, setItems] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadItems = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const data = await InscripcionApi.getAll(params);
      setItems(data);
    } catch (err: any) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (data: Partial<Inscripcion>) => {
    try {
      setLoading(true);
      await InscripcionApi.create(data);
      toast.success('Creado exitosamente');
      await loadItems();
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al crear';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, data: Partial<Inscripcion>) => {
    try {
      setLoading(true);
      await InscripcionApi.update(id, data);
      toast.success('Actualizado exitosamente');
      await loadItems();
      return true;
    } catch (err) {
      toast.error('Error al actualizar');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setLoading(true);
      await InscripcionApi.delete(id);
      toast.success('Eliminado exitosamente');
      await loadItems();
    } catch (err) {
      toast.error('No se pudo eliminar');
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, loadItems, createItem, updateItem, deleteItem };
};
