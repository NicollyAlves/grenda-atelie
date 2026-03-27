import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingBag, ArrowLeft, MessageCircle, Package } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedImg, setSelectedImg] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('id', id!).single();
      return data;
    },
  });

  const handleOrder = () => {
    if (!user) { navigate('/login'); return; }
    if (!product) return;
    
    // Redirect to Checkout page instead of saving directly.
    navigate('/checkout', {
      state: {
        product,
        quantity,
        notes
      }
    });
  };

  if (isLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando...</div>;
  if (!product) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Produto não encontrado.</div>;

  return (
    <div className="container mx-auto px-4 py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <div className="grid md:grid-cols-2 gap-8">
        {(() => {
          const allImages = [product.image_url, ...((product as any).additional_images || [])].filter(Boolean) as string[];
          return (
            <div className="space-y-3">
              <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                {allImages.length > 0 ? (
                  <img src={allImages[selectedImg] || allImages[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImg(i)} className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${i === selectedImg ? 'border-primary' : 'border-transparent'}`}>
                      <img src={img} alt={`${product.name} ${i+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
        <div>
          {product.category && <span className="badge-category mb-3 inline-block">{product.category}</span>}
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">{product.name}</h1>
          {product.description && <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>}
          <p className="text-3xl font-bold text-primary mb-2">R$ {product.price.toFixed(2).replace('.', ',')}</p>

          {/* Stock info */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            {product.in_stock ? (
              <span className="text-muted-foreground">
                {product.stock_quantity > 0 ? `${product.stock_quantity} unidades em estoque` : 'Disponível sob encomenda'}
              </span>
            ) : (
              <span className="text-destructive font-medium">Esgotado</span>
            )}
          </div>

          {product.in_stock ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground">Quantidade:</label>
                <select value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="input-styled w-20">
                  {Array.from({ length: Math.min(product.stock_quantity || 5, 10) }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Observações (personalização, cor, etc.)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="input-styled h-24 resize-none"
              />
              <button onClick={handleOrder} disabled={ordering} className="btn-hero w-full flex items-center justify-center gap-2">
                Ir para o Pagamento
              </button>
              <a
                href={`https://wa.me/message/L5LS7YREIUINO1?text=${encodeURIComponent(`Olá! Tenho interesse no produto: ${product.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4 inline mr-1" />
                Ou fale pelo WhatsApp
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-destructive font-medium">Produto esgotado</p>
              <a
                href={`https://wa.me/message/L5LS7YREIUINO1?text=${encodeURIComponent(`Olá! Gostaria de saber quando o produto "${product.name}" estará disponível.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero inline-flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" /> Avisar quando disponível
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
