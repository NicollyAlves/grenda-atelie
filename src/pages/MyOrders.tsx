import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusColors: Record<string, string> = {
  pendente: 'bg-accent text-accent-foreground',
  confirmado: 'bg-primary/20 text-primary',
  'em produção': 'bg-accent text-accent-foreground',
  enviado: 'bg-primary/20 text-primary',
  entregue: 'bg-secondary text-secondary-foreground',
  cancelado: 'bg-destructive/20 text-destructive',
};

export default function MyOrders() {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, image_url))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  if (isLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="section-title mb-8">Meus Pedidos</h1>
      {!orders || orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order.id} to={`/pedido/${order.id}`} className="block card-product p-5 hover:border-primary transition-colors hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${statusColors[order.status] || 'bg-muted text-muted-foreground'}`}>
                  {order.status.replace('_', ' ')}
                  {order.payment_method === 'dinheiro' && order.payment_status === 'pendente' && order.status !== 'aguardando_pagamento' ? ' (Aguardando Pgto)' : ''}
                </span>
              </div>
              <div className="space-y-2">
                {(order as any).order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {item.products?.image_url ? (
                        <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.products?.name}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors">Clique para ver mais detalhes ou falar no Chat</span>
                <span className="font-bold text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
