import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Package, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  pendente: 'bg-accent text-accent-foreground',
  confirmado: 'bg-primary/20 text-primary',
  'em produção': 'bg-accent text-accent-foreground',
  enviado: 'bg-primary/20 text-primary',
  entregue: 'bg-secondary text-secondary-foreground',
  cancelado: 'bg-destructive/20 text-destructive',
};

export default function MyOrders() {
  const queryClient = useQueryClient();
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

  const deleteOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders', user?.id] });
      toast.success('Pedido removido do histórico!');
    },
    onError: (error) => {
      console.error('Error deleting order:', error);
      toast.error('Erro ao remover pedido. Tente novamente.');
    }
  });

  if (isLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <h1 className="section-title mb-6 md:mb-8 text-2xl md:text-3xl">Meus Pedidos</h1>
      {!orders || orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order.id} to={`/pedido/${order.id}`} className="block card-product p-4 md:p-6 hover:border-primary/30 transition-all hover:shadow-md">
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
                    <span className="text-sm font-semibold text-foreground">
                      R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors">Clique para ver mais detalhes ou falar no Chat</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                        title="Apagar pedido"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Apagar pedido do histórico?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação removerá permanentemente o pedido do seu histórico. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteOrder.mutate(order.id);
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Apagar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
