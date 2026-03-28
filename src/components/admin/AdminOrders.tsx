import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const statuses = ['aguardando_pagamento', 'pendente', 'em andamento', 'indo para entrega', 'concluido', 'recusado', 'cancelado'];

export default function AdminOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, image_url), variant:product_variants(*))')
        .order('created_at', { ascending: false });
        
      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map((o: any) => o.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, phone').in('user_id', userIds);
        
        return ordersData.map((order: any) => ({
          ...order,
          profiles: profiles?.find((p: any) => p.user_id === order.user_id) || null
        }));
      }
      
      return ordersData || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: any = { status };
      if (notes !== undefined) updateData.notes = notes;
      const { error } = await supabase.from('orders').update(updateData).eq('id', id);
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
                onChange={e => {
                  const newStatus = e.target.value;
                  if (newStatus === 'recusado') {
                    const reason = window.prompt('Informe o motivo da recusa para o cliente:');
                    if (reason) {
                      updateStatus.mutate({ id: order.id, status: newStatus, notes: `Recusado: ${reason}` });
                    }
                  } else {
                    updateStatus.mutate({ id: order.id, status: newStatus });
                  }
                }}
                className="input-styled w-auto text-sm"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>
                    {s} {order.payment_method === 'dinheiro' && order.payment_status === 'pendente' && s !== 'aguardando_pagamento' ? '(Aguardando Pagamento)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 py-1">
                  <div className="w-14 h-14 rounded overflow-hidden bg-muted flex-shrink-0 border">
                    <img 
                      src={item.selected_image_url || item.variant?.image_url || item.products?.image_url} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 text-sm min-w-0">
                    <p className="font-medium text-foreground truncate">{item.products?.name}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                       {item.quantity} × R$ {item.unit_price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="font-bold text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
            {order.notes && !order.notes.startsWith('Recusado:') && <p className="text-xs text-muted-foreground mt-2 italic">Obs: {order.notes}</p>}
            {order.notes && order.notes.startsWith('Recusado:') && <p className="text-xs text-destructive mt-2 font-medium">{order.notes}</p>}
            
            <div className="mt-4 pt-4 border-t border-border/50 text-right">
              <Link to={`/pedido/${order.id}`} className="btn-hero text-sm px-4 py-2 inline-block">
                Acessar Pedido e Chat
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
