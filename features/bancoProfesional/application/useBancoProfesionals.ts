import { useState, useCallback } from 'react';
import { BancoProfesionalApi } from '../infrastructure/BancoProfesionalApi';
import { BancoProfesional } from '../domain/BancoProfesional';
import { toast } from 'sonner';

export const useBancoProfesionals = () => {
  const [items, setItems] = useState<BancoProfesional[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadItems = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const data = await BancoProfesionalApi.getAll(params);
      setItems(data);
    } catch (err: any) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (data: Partial<BancoProfesional>) => {
    try {
      setLoading(true);
      await BancoProfesionalApi.create(data);
      toast.success('Creado exitosamente');
      await loadItems();
      return true;
    } catch (err) {
      toast.error('Error al crear');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, data: Partial<BancoProfesional>) => {
    try {
      setLoading(true);
      await BancoProfesionalApi.update(id, data);
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
      await BancoProfesionalApi.delete(id);
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
