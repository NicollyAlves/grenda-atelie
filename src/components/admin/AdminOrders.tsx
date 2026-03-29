import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Calendar, DollarSign, Package, Trash2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../ui/ConfirmationModal';
import { useUnreadChatOrders } from '@/hooks/useUnreadChatOrders';

const statuses = ['aguardando_pagamento', 'pendente', 'em andamento', 'indo para entrega', 'concluido', 'recusado', 'cancelado'];

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const unreadOrders = useUnreadChatOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const markAsRead = async (orderId: string) => {
    await supabase.from('orders').update({ is_read: true } as any).eq('id', orderId);
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
  };

  // Marcar todos como lidos ao abrir a aba de pedidos
  useEffect(() => {
    const markAllAsRead = async () => {
      await supabase.from('orders').update({ is_read: true } as any).filter('is_read', 'eq', 'false');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    };
    markAllAsRead();
  }, []);

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
  
  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      // Pedidos têm itens vinculados. O cascade deve estar configurado no banco, 
      // mas se não estiver, deletamos os itens primeiro (ou confiamos no banco).
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Pedido removido do histórico!');
      setOrderToDelete(null);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Erro ao remover pedido.');
      setOrderToDelete(null);
    }
  });

  if (isLoading) return <div className="p-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div><p className="text-muted-foreground">Carregando pedidos...</p></div>;

  const filteredOrders = orders?.filter((order: any) => {
    const matchesSearch = 
      order.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_items?.some((item: any) => item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !filterDate || new Date(order.created_at).toLocaleDateString() === new Date(filterDate + 'T00:00:00').toLocaleDateString();
    const matchesPrice = !minPrice || order.total >= parseFloat(minPrice);
    
    return matchesSearch && matchesDate && matchesPrice;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-1">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-card p-4 rounded-2xl border border-border shadow-soft">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, produto ou ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-styled pl-10 text-sm h-11"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 h-11 rounded-lg text-sm font-medium border transition-all ${showFilters ? 'bg-primary text-white border-primary' : 'bg-background hover:bg-muted'}`}
          >
            <Filter className="h-4 w-4" /> {showFilters ? 'Fechar Filtros' : 'Filtros'}
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-muted/30 rounded-2xl border border-dashed border-border/50 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase ml-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Data do Pedido</label>
              <input 
                type="date" 
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="input-styled text-sm h-10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase ml-1 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Valor Mínimo (R$)</label>
              <input 
                type="number" 
                placeholder="0,00"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                className="input-styled text-sm h-10"
              />
            </div>
          </div>
        )}
      </div>

      {!filteredOrders || filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
          <Package className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum pedido encontrado com esses filtros.</p>
        </div>
      ) : (
        filteredOrders.map((order: any) => (
          <div key={order.id} className={`card-product p-5 transition-all relative ${!order.is_read ? 'border-l-4 border-l-primary' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground">{order.profiles?.full_name || 'Cliente'}</p>
                  {!order.is_read && (
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">Novo</span>
                  )}
                  {unreadOrders.has(order.id) && (
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-red-600 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                      <MessageCircle className="h-3 w-3" /> Msg do cliente
                    </span>
                  )}
                </div>
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
                className="input-styled w-auto text-sm h-10 min-w-[180px]"
              >
                {statuses.map(s => {
                  const isConcluidoOuCancelado = s === 'concluido' || s === 'cancelado' || s === 'recusado';
                  const isRetirada = order.order_type === 'retirada' || order.payment_method === 'dinheiro';
                  const isIndoEntrega = s === 'indo para entrega';
                  const needsWaitingPayment = !isConcluidoOuCancelado && isRetirada && order.payment_status === 'pendente' && s !== 'aguardando_pagamento';
                  
                  return (
                    <option key={s} value={s} disabled={isRetirada && isIndoEntrega}>
                      {s.replace('_', ' ')} {needsWaitingPayment ? '(Aguardando Pagamento)' : ''}
                      {isRetirada && isIndoEntrega ? ' (Apenas p/ Entrega)' : ''}
                    </option>
                  );
                })}
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
            
            <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
              <button 
                onClick={() => setOrderToDelete(order.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 text-xs"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </button>
              <button
                onClick={() => { markAsRead(order.id); navigate(`/pedido/${order.id}`); }}
                className="btn-hero text-sm px-4 py-2 inline-block"
              >
                Acessar Pedido e Chat
              </button>
            </div>
          </div>
        ))
      )}

      <ConfirmationModal 
        isOpen={!!orderToDelete}
        title="Excluir Pedido?"
        message="Esta ação removerá o pedido permanentemente do histórico administrativo."
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        onConfirm={() => orderToDelete && deleteOrder.mutate(orderToDelete)}
        onCancel={() => setOrderToDelete(null)}
        type="danger"
      />
    </div>
  );
}
