import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Retorna um Set de order_ids que possuem mensagens não lidas
 * para o usuário atual (mensagens enviadas pela outra parte, ainda is_read=false)
 */
export function useUnreadChatOrders(): Set<string> {
  const { user } = useAuth();
  const [unreadOrders, setUnreadOrders] = useState<Set<string>>(new Set());

  const fetchUnread = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('order_messages')
        .select('order_id')
        .filter('is_read', 'eq', 'false')
        .neq('user_id', user.id);

      if (data) {
        setUnreadOrders(new Set(data.map(m => m.order_id)));
      }
    } catch {
      // silencioso - schema pode ainda não ter is_read
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchUnread();

    const sub = supabase
      .channel(`unread-chat-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_messages' }, fetchUnread)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_messages' }, fetchUnread)
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [user?.id]);

  return unreadOrders;
}
