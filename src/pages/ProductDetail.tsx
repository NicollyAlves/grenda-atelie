import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingBag, ArrowLeft, MessageCircle, Package, Star, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
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
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryFiles, setInquiryFiles] = useState<{ file: File; preview: string; type: 'image' | 'video' }[]>([]);
  const [reviewFiles, setReviewFiles] = useState<{ file: File; preview: string; type: 'image' | 'video' }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const { addItem } = useCart();
  const queryClient = useQueryClient();

  const uploadFiles = async (files: { file: File; type: 'image' | 'video' }[], path: string) => {
    const attachments: { url: string; type: 'image' | 'video' }[] = [];
    for (const item of files) {
      const fileExt = item.file.name.split('.').pop();
      const fileName = `${id}/${Math.random()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, item.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      attachments.push({ url: publicUrl, type: item.type });
    }
    return attachments;
  };

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
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('product_reviews' as any)
        .select('*')
        .eq('product_id', id!)
        .order('created_at', { ascending: false });
        
      if (reviewsError) throw reviewsError;
      
      if (reviewsData && reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map((r: any) => r.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
        
        return reviewsData.map((review: any) => ({
          ...review,
          profiles: profiles?.find((p: any) => p.user_id === review.user_id) || null
        }));
      }
      return reviewsData || [];
    },
  });

  const { data: variants } = useQuery({
    queryKey: ['product_variants', id],
    queryFn: async () => {
      const { data } = await supabase.from('product_variants').select('*').eq('product_id', id!);
      return data || [];
    },
  });

  const { data: inquiries } = useQuery({
    queryKey: ['product_inquiries', id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Busca mensagens do usuário + respostas do admin para este produto
      const { data } = await supabase
        .from('product_inquiries')
        .select('*')
        .eq('product_id', id!)
        .or(`user_id.eq.${user.id},is_from_admin.eq.true`)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const activeVariant = useMemo(() => {
    return variants?.find(v => v.id === selectedVariantId) || null;
  }, [variants, selectedVariantId]);

  const currentStock = useMemo(() => {
    if (product?.has_variants && activeVariant) return activeVariant.stock_quantity;
    return product?.stock_quantity || 0;
  }, [product, activeVariant]);

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      setIsUploading(true);
      try {
        const attachments = await uploadFiles(reviewFiles, 'reviews');
        const { error } = await supabase.from('product_reviews' as any).insert({
          product_id: id,
          user_id: user.id,
          rating: reviewRating,
          comment: reviewComment,
          attachments: attachments
        });
        if (error) throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      toast.success('Avaliação enviada!');
      setReviewComment('');
      setReviewFiles([]);
      queryClient.invalidateQueries({ queryKey: ['product_reviews', id] });
    },
    onError: () => {
      toast.error('Erro ao enviar avaliação.');
    }
  });

  const deleteReview = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.from('product_reviews' as any).delete().eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Avaliação removida!');
      queryClient.invalidateQueries({ queryKey: ['product_reviews', id] });
    }
  });

  const { isAdmin } = useAuth();
  const [editingReview, setEditingReview] = useState<string | null>(null);

  const submitInquiry = useMutation({
    mutationFn: async () => {
      if (!user) { navigate('/login'); return; }
      setIsUploading(true);
      try {
        const attachments = await uploadFiles(inquiryFiles, 'inquiries');
        const { error } = await supabase.from('product_inquiries').insert({
          product_id: id,
          user_id: user.id,
          message: inquiryMessage,
          is_from_admin: false,
          attachments: attachments
        });
        if (error) throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      setInquiryMessage('');
      setInquiryFiles([]);
      queryClient.invalidateQueries({ queryKey: ['product_inquiries', id] });
      toast.success('Pergunta enviada!');
    }
  });

  const handleInquiryFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
      }));
      setInquiryFiles(prev => [...prev, ...files]);
    }
  };

  const handleReviewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
      }));
      setReviewFiles(prev => [...prev, ...files]);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.has_variants && !selectedVariantId) {
      toast.error('Por favor, selecione um modelo clicando nas imagens abaixo.');
      return;
    }
    
    const allImages = product.has_variants
      ? (variants?.map(v => ({ url: v.image_url, id: v.id })) || []).filter(img => img.url) as { url: string, id: string | null }[]
      : [
          { url: product.image_url, id: null }, 
          ...((product as any).additional_images || []).map((url: string) => ({ url, id: null }))
        ].filter(img => img.url) as { url: string, id: string | null }[];

    await addItem({
      product_id: product.id,
      variant_id: selectedVariantId || undefined,
      selected_image_url: allImages[selectedImg]?.url,
      quantity,
      product,
      variant: activeVariant
    });
  };

  const handleOrder = () => {
    if (!user) { navigate('/login'); return; }
    if (!product) return;
    if (product.has_variants && !selectedVariantId) {
      toast.error('Por favor, selecione um modelo/imagem.');
      return;
    }
    
    const allImages = product.has_variants
      ? (variants?.map(v => ({ url: v.image_url, id: v.id })) || []).filter(img => img.url) as { url: string, id: string | null }[]
      : [
          { url: product.image_url, id: null }, 
          ...((product as any).additional_images || []).map((url: string) => ({ url, id: null }))
        ].filter(img => img.url) as { url: string, id: string | null }[];

    navigate('/checkout', {
      state: {
        items: [{
          product,
          variant: activeVariant,
          selected_image_url: allImages[selectedImg]?.url,
          quantity,
          notes
        }]
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
          const allImages = product.has_variants
            ? (variants?.map(v => ({ url: v.image_url, id: v.id })) || []).filter(img => img.url) as { url: string, id: string | null }[]
            : [
                { url: product.image_url, id: null }, 
                ...((product as any).additional_images || []).map((url: string) => ({ url, id: null }))
              ].filter(img => img.url) as { url: string, id: string | null }[];
          
          return (
            <div className="space-y-3">
              <div className="w-full max-w-[92vw] sm:max-w-none mx-auto">
                <div className="relative rounded-2xl overflow-hidden group aspect-square border border-border/10 shadow-soft">
                  <img 
                    src={allImages[selectedImg]?.url || product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                </div>
              </div>
                <div className="flex gap-2 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide max-w-[92vw] sm:max-w-none mx-auto">
                  {allImages.map((img, i) => (
                    <button 
                      key={i} 
                      onClick={() => {
                        setSelectedImg(i);
                        if (img.id) setSelectedVariantId(img.id);
                        else if (i === 0 && !product.has_variants) setSelectedVariantId(null);
                      }} 
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all aspect-square shadow-sm ${i === selectedImg ? 'border-primary ring-4 ring-primary/10' : 'border-transparent opacity-60 hover:opacity-100 hover:border-primary/30'}`}
                    >
                      <img src={img.url} alt={`${product.name} ${i+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
            </div>
          );
        })()}
        <div>
          {product.category && <span className="badge-category mb-3 inline-block shadow-sm">{product.category}</span>}
          <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4 leading-tight">{product.name}</h1>
          {product.description && <p className="text-muted-foreground mb-6 leading-relaxed text-sm md:text-base">{product.description}</p>}
          <p className="text-3xl md:text-4xl font-bold text-primary mb-2">R$ {product.price.toFixed(2).replace('.', ',')}</p>

          <div className="flex items-center gap-2 mb-6 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            {product.in_stock ? (
              <span className={currentStock > 0 ? "text-muted-foreground" : "text-amber-600 font-medium"}>
                {currentStock > 0 ? `${currentStock} unidades em estoque` : 'Disponível sob encomenda'}
                {product.has_variants && activeVariant && " (modelo selecionado)"}
                {product.has_variants && !activeVariant && " (selecione um modelo abaixo)"}
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
              <button onClick={handleAddToCart} className="btn-hero w-full bg-secondary text-foreground border border-border hover:bg-secondary/80 flex items-center justify-center gap-2">
                Adicionar ao Carrinho
              </button>
              <button onClick={handleOrder} disabled={ordering} className="btn-hero w-full flex items-center justify-center gap-2">
                Comprar Agora
              </button>
              
              <div className="pt-2">
                <button
                  onClick={() => setShowInquiry(!showInquiry)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Tirar Dúvida sobre o Produto
                </button>

                {showInquiry && (
                  <div className="mt-4 border rounded-xl p-4 bg-card shadow-soft animate-in slide-in-from-top-2">
                    <div className="max-h-60 overflow-y-auto space-y-3 mb-4 pr-2">
                      {inquiries?.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">Mande sua dúvida abaixo e o admin responderá aqui mesmo!</p>
                      ) : (
                        inquiries?.map((msg: any) => (
                          <div key={msg.id} className={`flex flex-col ${msg.is_from_admin ? 'items-start' : 'items-end'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm ${msg.is_from_admin ? 'bg-secondary text-foreground' : 'bg-primary text-white'}`}>
                              <p>{msg.message}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="grid grid-cols-2 gap-1 mt-2">
                                  {msg.attachments.map((at: any, i: number) => (
                                    <div key={i} className="rounded-lg overflow-hidden border border-white/10 aspect-square">
                                      {at.type === 'video' ? <video src={at.url} className="w-full h-full object-cover" /> : <img src={at.url} className="w-full h-full object-cover" />}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {inquiryFiles.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-3">
                        {inquiryFiles.map((f, i) => (
                          <div key={i} className="relative w-12 h-12 flex-shrink-0 rounded border">
                            {f.type === 'video' ? <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[8px] text-white">Video</div> : <img src={f.preview} className="w-full h-full object-cover" />}
                            <button onClick={() => setInquiryFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"><X className="h-2 w-2" /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input 
                          value={inquiryMessage} 
                          onChange={e => setInquiryMessage(e.target.value)}
                          placeholder="Escreva sua dúvida..." 
                          className="input-styled text-xs py-2 h-auto flex-1"
                        />
                        <label className="p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleInquiryFiles} />
                        </label>
                        <button 
                          onClick={() => submitInquiry.mutate()} 
                          disabled={(!inquiryMessage.trim() && inquiryFiles.length === 0) || isUploading}
                          className="btn-hero w-auto px-4 py-2 text-xs flex items-center gap-1"
                        >
                          {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Enviar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
          <div id="review-form" className="bg-background border border-primary/20 p-6 rounded-2xl mb-12 shadow-soft space-y-4 animate-in fade-in zoom-in duration-300">
            <h4 className="font-bold text-sm uppercase tracking-widest text-primary flex items-center justify-between">
              {editingReview ? 'Editando sua avaliação' : 'Deixe sua avaliação'}
              {editingReview && (
                <button onClick={() => { setEditingReview(null); setReviewComment(''); setReviewRating(5); }} className="text-[10px] text-muted-foreground underline">Cancelar</button>
              )}
            </h4>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setReviewRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                  <Star className={`w-6 h-6 ${reviewRating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                </button>
              ))}
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
                <input
                  type="text"
                  placeholder="Conte o que achou..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="input-styled flex-1 h-12"
                  maxLength={150}
                />
                <label className="p-3 border-2 border-dashed border-border/10 rounded-xl cursor-pointer hover:bg-muted/30 transition-all flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ImageIcon className="h-5 w-5" /> {reviewFiles.length ? `${reviewFiles.length} mídias` : 'Fotos/Vídeos'}
                  <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleReviewFiles} />
                </label>
              </div>

              {reviewFiles.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-2">
                  {reviewFiles.map((f, i) => (
                    <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border">
                      {f.type === 'video' ? <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[8px] text-white">Video</div> : <img src={f.preview} className="w-full h-full object-cover" />}
                      <button onClick={() => setReviewFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1 shadow-md"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => {
                  if (editingReview) {
                    supabase.from('product_reviews' as any).update({ rating: reviewRating, comment: reviewComment }).eq('id', editingReview).then(({ error }) => {
                      if (error) toast.error('Erro ao editar.');
                      else {
                        toast.success('Avaliação atualizada!');
                        setEditingReview(null);
                        setReviewComment('');
                        queryClient.invalidateQueries({ queryKey: ['product_reviews', id] });
                      }
                    });
                  } else {
                    submitReview.mutate();
                  }
                }} 
                disabled={isUploading || (!reviewComment.trim() && reviewFiles.length === 0)} 
                className="btn-hero py-3 px-8 shadow-lg flex items-center justify-center gap-2"
              >
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingReview ? 'Salvar Alterações' : 'Postar Avaliação'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {reviews?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Nenhuma avaliação ainda.</p>
          ) : (
            reviews?.map((review: any) => (
              <div key={review.id} className="pb-8 border-b border-border/30 last:border-0 opacity-95 transition-opacity hover:opacity-100 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {review.profiles?.full_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground block">{review.profiles?.full_name || 'Cliente'}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`w-3 h-3 ${review.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {(user?.id === review.user_id || isAdmin) && (
                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user?.id === review.user_id && (
                        <button 
                          onClick={() => {
                            setReviewComment(review.comment);
                            setReviewRating(review.rating);
                            setEditingReview(review.id);
                            window.scrollTo({ top: document.getElementById('review-form')?.offsetTop || 0, behavior: 'smooth' });
                          }}
                          className="text-[10px] font-bold uppercase text-primary hover:underline tracking-tight"
                        >
                          Editar
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja apagar esta avaliação?')) {
                            deleteReview.mutate(review.id);
                          }
                        }}
                        className="text-[10px] font-bold uppercase text-destructive hover:underline tracking-tight"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
                {review.comment && <p className="text-muted-foreground text-sm leading-relaxed mb-4 font-medium italic">"{review.comment}"</p>}
                
                {review.attachments && review.attachments.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    {review.attachments.map((at: any, i: number) => (
                      <div key={i} className="w-24 h-24 md:w-32 md:h-32 rounded-xl border border-border/50 overflow-hidden flex-shrink-0 bg-muted/20">
                        {at.type === 'video' ? (
                          <video src={at.url} controls className="w-full h-full object-cover" />
                        ) : (
                          <img 
                            src={at.url} 
                            alt={`Avaliação ${i+1}`} 
                            className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform" 
                            onClick={() => window.open(at.url, '_blank')}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-bold">
                  {new Date(review.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
