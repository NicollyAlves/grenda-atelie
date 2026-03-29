import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UnreadCounts {
  orders: number;
  inquiries: number;
  total: number;
}

export function useUnreadAdmin(): UnreadCounts {
  const { isAdmin } = useAuth();
  const [counts, setCounts] = useState<UnreadCounts>({ orders: 0, inquiries: 0, total: 0 });

  const fetchCounts = async () => {
    if (!isAdmin) return;

    try {
      const [ordersRes, inquiriesRes] = await Promise.all([
        // Pedidos não lidos pelo admin
        supabase.from('orders').select('id').filter('is_read', 'eq', 'false'),
        // Dúvidas de clientes não lidas (somente as mensagens de clientes, não respostas do admin)
        supabase.from('product_inquiries').select('id').filter('is_read', 'eq', 'false').filter('is_from_admin', 'eq', 'false'),
      ]);

      const o = ordersRes.data?.length ?? 0;
      const i = inquiriesRes.data?.length ?? 0;

      setCounts({ orders: o, inquiries: i, total: o + i });
    } catch {
      // Silencia erros enquanto schema não está atualizado no cliente
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    fetchCounts();

    // Escutar em tempo real novos pedidos
    const orderSub = supabase
      .channel('admin-unread-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, fetchCounts)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, fetchCounts)
      .subscribe();

    // Escutar novas dúvidas de clientes
    const inquirySub = supabase
      .channel('admin-unread-inquiries')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'product_inquiries' }, fetchCounts)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'product_inquiries' }, fetchCounts)
      .subscribe();

    return () => {
      orderSub.unsubscribe();
      inquirySub.unsubscribe();
    };
  }, [isAdmin]);

  return counts;
}
