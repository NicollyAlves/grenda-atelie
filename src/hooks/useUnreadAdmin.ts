import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UnreadCounts {
  orders: number;
  inquiries: number;
  chatMessages: number;
  total: number;
}

export function useUnreadAdmin(): UnreadCounts {
  const { isAdmin } = useAuth();
  const [counts, setCounts] = useState<UnreadCounts>({ orders: 0, inquiries: 0, chatMessages: 0, total: 0 });

  const fetchCounts = async () => {
    if (!isAdmin) return;

    try {
      // Usar RPC genérica via filter string para evitar erros de tipagem enquanto as colunas não estão nos tipos gerados
      const [ordersRes, inquiriesRes, chatRes] = await Promise.all([
        supabase.from('orders').select('id').filter('is_read', 'eq', 'false'),
        supabase.from('product_inquiries').select('id').filter('is_read', 'eq', 'false').filter('is_from_admin', 'eq', 'false'),
        supabase.from('order_messages').select('id').filter('is_read', 'eq', 'false'),
      ]);

      const o = ordersRes.data?.length ?? 0;
      const i = inquiriesRes.data?.length ?? 0;
      const c = chatRes.data?.length ?? 0;

      setCounts({ orders: o, inquiries: i, chatMessages: c, total: o + i + c });
    } catch {
      // Silencia erros de schema ainda não atualizado
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

    // Escutar novas mensagens de chat
    const chatSub = supabase
      .channel('admin-unread-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_messages' }, fetchCounts)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_messages' }, fetchCounts)
      .subscribe();

    return () => {
      orderSub.unsubscribe();
      inquirySub.unsubscribe();
      chatSub.unsubscribe();
    };
  }, [isAdmin]);

  return counts;
}
