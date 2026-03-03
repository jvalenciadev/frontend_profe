import { useState, useCallback } from 'react';
import { ComunicadoApi } from '../infrastructure/ComunicadoApi';
import { Comunicado } from '../domain/Comunicado';
import { toast } from 'sonner';

export const useComunicados = () => {
  const [items, setItems] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadItems = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const data = await ComunicadoApi.getAll(params);
      setItems(data);
    } catch (err: any) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (data: Partial<Comunicado>) => {
    try {
      setLoading(true);
      await ComunicadoApi.create(data);
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

  const updateItem = async (id: string, data: Partial<Comunicado>) => {
    try {
      setLoading(true);
      await ComunicadoApi.update(id, data);
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
      await ComunicadoApi.delete(id);
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
