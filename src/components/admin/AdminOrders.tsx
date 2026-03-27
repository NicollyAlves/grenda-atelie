import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package } from 'lucide-react';
import { toast } from 'sonner';

const statuses = ['pendente', 'confirmado', 'em produção', 'enviado', 'entregue', 'cancelado'];

export default function AdminOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name)), profiles:user_id(full_name, phone)')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Status atualizado!');
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando pedidos...</p>;

  return (
    <div className="space-y-4">
      {!orders || orders.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Nenhum pedido ainda.</p>
      ) : (
        orders.map((order: any) => (
          <div key={order.id} className="card-product p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <p className="font-medium text-foreground">{order.profiles?.full_name || 'Cliente'}</p>
                <p className="text-xs text-muted-foreground">{order.profiles?.phone || 'Sem telefone'}</p>
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <select
                value={order.status}
                onChange={e => updateStatus.mutate({ id: order.id, status: e.target.value })}
                className="input-styled w-auto text-sm"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">{item.products?.name} × {item.quantity}</span>
                  <span className="text-muted-foreground">R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-border">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="font-bold text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
            {order.notes && <p className="text-xs text-muted-foreground mt-2 italic">Obs: {order.notes}</p>}
          </div>
        ))
      )}
    </div>
  );
}
