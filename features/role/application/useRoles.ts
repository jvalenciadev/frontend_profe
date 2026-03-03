import { useState, useCallback } from 'react';
import { RoleApi } from '../infrastructure/RoleApi';
import { Role } from '../domain/Role';
import { toast } from 'sonner';

export const useRoles = () => {
  const [items, setItems] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadItems = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const data = await RoleApi.getAll(params);
      setItems(data);
    } catch (err: any) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (data: Partial<Role>) => {
    try {
      setLoading(true);
      await RoleApi.create(data);
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

  const updateItem = async (id: string, data: Partial<Role>) => {
    try {
      setLoading(true);
      await RoleApi.update(id, data);
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
      await RoleApi.delete(id);
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
