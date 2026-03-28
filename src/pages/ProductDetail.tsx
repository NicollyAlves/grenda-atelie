import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingBag, ArrowLeft, MessageCircle, Package, Star } from 'lucide-react';
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
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('id', id!).single();
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['product_reviews', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_reviews' as any)
        .select(`*, profiles:user_id(full_name)`)
        .eq('product_id', id!)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('product_reviews' as any).insert({
        product_id: id,
        user_id: user.id,
        rating: reviewRating,
        comment: reviewComment
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Avaliação enviada!');
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['product_reviews', id] });
    },
    onError: () => {
      toast.error('Erro ao enviar avaliação.');
    }
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
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-6xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
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
          {product.category && <span className="badge-category mb-3 inline-block shadow-sm">{product.category}</span>}
          <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4 leading-tight">{product.name}</h1>
          {product.description && <p className="text-muted-foreground mb-6 leading-relaxed text-sm md:text-base">{product.description}</p>}
          <p className="text-3xl md:text-4xl font-bold text-primary mb-2">R$ {product.price.toFixed(2).replace('.', ',')}</p>

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
              
              <div className="pt-2">
                <a
                  href={`https://wa.me/message/L5LS7YREIUINO1?text=${encodeURIComponent(`Olá! Quero tirar uma dúvida sobre o produto: ${product.name}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Tirar Dúvida sobre o Produto
                </a>
              </div>
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

      {/* Reviews Section Minimized */}
      <div className="mt-16 pt-10 border-t border-border/50 max-w-3xl mx-auto">
        <h3 className="text-xl font-semibold mb-6 flex items-center justify-between">
          Avaliações
          <div className="flex items-center text-sm font-normal text-muted-foreground gap-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            {reviews?.length ? (reviews.reduce((acc: any, curr: any) => acc + curr.rating, 0) / reviews.length).toFixed(1) : 'Novo'}
            <span>({reviews?.length || 0})</span>
          </div>
        </h3>

        {user && (
          <div className="bg-muted/30 p-5 rounded-xl mb-8 space-y-4">
            <h4 className="font-medium text-sm">Deixe sua avaliação</h4>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setReviewRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                  <Star className={`w-6 h-6 ${reviewRating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
              <input
                type="text"
                placeholder="Conte o que achou..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                className="input-styled flex-1"
                maxLength={150}
              />
              <button 
                onClick={() => submitReview.mutate()} 
                disabled={submitReview.isPending || !reviewComment.trim()} 
                className="btn-hero py-3 px-8 whitespace-nowrap"
              >
                Enviar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {reviews?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Nenhuma avaliação ainda.</p>
          ) : (
            reviews?.map((review: any) => (
              <div key={review.id} className="pb-4 border-b border-border/30 last:border-0 opacity-90 transition-opacity hover:opacity-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{review.profiles?.full_name || 'Cliente Oculto'}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`w-3 h-3 ${review.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>}
                <p className="text-xs text-muted-foreground/60 mt-2">{new Date(review.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
