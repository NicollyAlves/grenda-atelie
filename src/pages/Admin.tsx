import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminInquiries from '@/components/admin/AdminInquiries';
import { Package, ShoppingBag, MessageSquare } from 'lucide-react';

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<'products' | 'orders' | 'inquiries'>('orders');

  if (loading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="section-title mb-8">Painel Admin</h1>

      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'orders' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        >
          <Package className="h-4 w-4" /> Pedidos
        </button>
        <button
          onClick={() => setTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'products' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        >
          <ShoppingBag className="h-4 w-4" /> Produtos
        </button>
        <button
          onClick={() => setTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'inquiries' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        >
          <MessageSquare className="h-4 w-4" /> Dúvidas
        </button>
      </div>

      {tab === 'orders' && <AdminOrders />}
      {tab === 'products' && <AdminProducts />}
      {tab === 'inquiries' && <AdminInquiries />}
    </div>
  );
}
