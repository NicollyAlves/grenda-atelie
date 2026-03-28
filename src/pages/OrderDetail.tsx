import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Package, Clock, CreditCard } from 'lucide-react';
import OrderChat from '@/components/chat/OrderChat';
import { toast } from 'sonner';

const statuses = ['aguardando_pagamento', 'pendente', 'em andamento', 'indo para entrega', 'concluido', 'recusado', 'cancelado'];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*, products(name, image_url), variant:product_variants(*))
        `)
        .eq('id', id!)
        .maybeSingle();
        
      if (error) {
        console.error('ERROR DETAILED from supabase OrderDetail:', error);
        toast.error('Ocorreu um erro ao carregar o pedido. Verifique o console.');
        throw error;
      }
      
      if (!orderData) {
        console.warn('Order not found or no access for ID:', id);
        return null;
      }
      
      if (orderData) {
        const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('user_id', orderData.user_id).maybeSingle();
        (orderData as any).profiles = profile;
      }
      
      return orderData;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ status, notes }: { status: string, notes?: string }) => {
      const updateData: any = { status };
      if (notes !== undefined) updateData.notes = notes;
      const { error } = await supabase.from('orders').update(updateData).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Status do pedido atualizado!');
    },
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === 'recusado') {
      const reason = window.prompt('Informe o motivo da recusa para o cliente:');
      if (reason) {
         updateStatus.mutate({ status: newStatus, notes: `Recusado: ${reason}` });
      }
    } else {
      updateStatus.mutate({ status: newStatus });
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando...</div>;
  if (!order) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Pedido não encontrado.</div>;

  // Security check for non-admins trying to access someone else's order
  if (!isAdmin && order.user_id !== user.id) return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="grid lg:grid-cols-5 gap-6 md:gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="card-product p-4 md:p-6 lg:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-xl font-semibold mb-1">Pedido #{order.id.slice(0, 8).toUpperCase()}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> 
                  {new Date(order.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border uppercase">
                {order.status.replace('_', ' ')}
                {order.payment_method === 'dinheiro' && order.payment_status === 'pendente' && order.status !== 'aguardando_pagamento' ? ' (Aguardando Pagamento)' : ''}
              </span>
            </div>

            {isAdmin && (
               <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                 <span className="font-medium text-sm">Atualizar Status:</span>
                 <select value={order.status} onChange={handleStatusChange} className="input-styled w-auto text-sm">
                   {statuses.map(s => (
                     <option key={s} value={s}>
                       {s} {order.payment_method === 'dinheiro' && order.payment_status === 'pendente' && s !== 'aguardando_pagamento' ? '(Aguardando Pagamento)' : ''}
                     </option>
                   ))}
                 </select>
               </div>
            )}

            <div className="space-y-4 mb-6">
              <h3 className="font-medium flex items-center gap-2 border-b pb-2">
                <Package className="h-5 w-5" /> Itens do Pedido
              </h3>
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <img 
                    src={item.selected_image_url || item.variant?.image_url || item.products?.image_url} 
                    alt="" 
                    className="w-20 h-20 bg-muted rounded-xl object-cover shadow-sm border border-border/50 transition-transform hover:scale-105" 
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.products?.name}</p>
                    {item.variant && <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Modelo Específico</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">Qtd: {item.quantity} × R$ {item.unit_price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <p className="font-medium">R$ {(item.quantity * item.unit_price).toFixed(2).replace('.', ',')}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Informações de Pagamento
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                   <p className="text-muted-foreground">Método</p>
                   <p className="font-medium uppercase">{order.payment_method || 'Não inf.'}</p>
                 </div>
                 <div>
                   <p className="text-muted-foreground">Status do Pgto</p>
                   <p className="font-medium uppercase text-green-600">{order.payment_status || 'pendente'}</p>
                 </div>
                 <div>
                   <p className="text-muted-foreground">Subtotal</p>
                   <p className="font-medium">R$ {(order.total - (order.shipping_fee || 0)).toFixed(2).replace('.', ',')}</p>
                 </div>
                 <div>
                   <p className="text-muted-foreground">Frete</p>
                   <p className="font-medium">R$ {(order.shipping_fee || 0).toFixed(2).replace('.', ',')}</p>
                 </div>
              </div>
              <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg mt-4">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
            
            {(order.notes && !order.notes.startsWith('Recusado:')) && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium mb-1">Notas do Pedido (Adicionadas no Checkout):</p>
                <p className="text-muted-foreground">{order.notes}</p>
              </div>
            )}

            {order.status === 'recusado' && order.notes?.startsWith('Recusado:') && (
               <div className="mt-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
                 <p className="font-medium mb-1">Motivo da Recusa:</p>
                 <p>{order.notes.replace('Recusado: ', '')}</p>
               </div>
            )}

          </div>
        </div>

        <div className="lg:col-span-2">
          <OrderChat orderId={order.id} />
        </div>
      </div>
    </div>
  );
}
