import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Package, Search, Calendar, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';
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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.order_items?.some((item: any) => 
      item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !filterDate || new Date(order.created_at).toLocaleDateString() === new Date(filterDate + 'T00:00:00').toLocaleDateString();
    
    return matchesSearch && matchesDate;
  }) || [];

  if (isLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>Carregando seu histórico...</div>;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="section-title text-2xl md:text-3xl m-0">Meus Pedidos</h1>
        
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar pedido ou produto..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-styled pl-10 h-10 text-sm"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-lg border transition-all ${showFilters ? 'bg-primary text-white border-primary' : 'bg-background hover:bg-muted'}`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-muted/30 rounded-2xl border border-dashed border-border/50 animate-in slide-in-from-top-2">
          <div className="max-w-xs space-y-1">
            <label className="text-[10px] font-bold uppercase ml-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Filtrar por Data</label>
            <input 
              type="date" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="input-styled h-10 text-sm"
            />
          </div>
        </div>
      )}

      {!filteredOrders || filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
          <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Nenhum pedido encontrado{searchTerm || filterDate ? ' com esses filtros' : ''}.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredOrders.map(order => (
            <Link key={order.id} to={`/pedido/${order.id}`} className="block card-product p-5 md:p-6 hover:border-primary/40 transition-all hover:shadow-lg group relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Pedido #{order.id.slice(0, 8)}</span>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                    <div className="text-right">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${statusColors[order.status] || 'bg-muted text-muted-foreground'}`}>
                        {order.status.replace('_', ' ')}
                        {((order as any).order_type === 'retirada' || order.payment_method === 'dinheiro') && order.payment_status === 'pendente' && !['concluido', 'cancelado', 'recusado'].includes(order.status) ? ' • Aguardando Pagamento' : ''}
                      </span>
                    </div>
                  </div>

              <div className="space-y-4 mb-6">
                {(order as any).order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border/50 flex-shrink-0">
                      {item.products?.image_url ? (
                        <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm md:text-base font-semibold text-foreground truncate">{item.products?.name}</p>
                      <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-foreground">
                        R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50 group-hover:border-primary/20 transition-colors">
                <span className="text-[11px] font-medium text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                  Ver Detalhes do Pedido →
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Total Pago</span>
                  <span className="text-xl font-black text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
