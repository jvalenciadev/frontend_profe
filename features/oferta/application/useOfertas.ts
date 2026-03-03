import { useState, useCallback } from 'react';
import { OfertaApi } from '../infrastructure/OfertaApi';
import { Oferta } from '../domain/Oferta';
import { toast } from 'sonner';

export const useOfertas = () => {
  const [items, setItems] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadItems = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const data = await OfertaApi.getAll(params);
      setItems(data);
    } catch (err: any) {
      toast.error('Error al cargar ofertas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (data: Partial<Oferta>) => {
    try {
      setLoading(true);
      await OfertaApi.create(data);
      toast.success('Oferta creada');
      await loadItems();
      return true;
    } catch (err: any) {
      toast.error('Error al crear oferta');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, loadItems, createItem };
};
