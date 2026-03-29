import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Minus, Check, Upload } from 'lucide-react';
import ConfirmationModal from '../ui/ConfirmationModal';
import { toast } from 'sonner';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  additional_images: string[];
  in_stock: boolean;
  stock_quantity: string;
  has_variants: boolean;
  variants: { id?: string; image_url: string; stock_quantity: string }[];
}

const emptyForm: ProductForm = { 
  name: '', 
  description: '', 
  price: '', 
  category: '', 
  image_url: '', 
  additional_images: [], 
  in_stock: true, 
  stock_quantity: '0',
  has_variants: false,
  variants: []
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const totalVariantStock = form.has_variants 
        ? form.variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity) || 0), 0)
        : parseInt(form.stock_quantity) || 0;

      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        category: form.category || null,
        image_url: form.has_variants ? (form.variants[0]?.image_url || null) : (form.image_url || null),
        additional_images: form.has_variants ? [] : form.additional_images,
        in_stock: form.in_stock,
        stock_quantity: totalVariantStock,
        has_variants: form.has_variants,
      };
      
      let productId = editId;
      if (editId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = data.id;
      }

      // Handle variants
      if (form.has_variants && productId) {
        // Simple strategy: delete old and insert new, or update. 
        // For simplicity in this implementation, we'll sync them.
        const { error: delError } = await supabase.from('product_variants').delete().eq('product_id', productId);
        if (delError) throw delError;

        if (form.variants.length > 0) {
          const variantsToInsert = form.variants.map(v => ({
            product_id: productId!,
            image_url: v.image_url,
            stock_quantity: parseInt(v.stock_quantity) || 0
          }));
          const { error: insError } = await supabase.from('product_variants').insert(variantsToInsert);
          if (insError) throw insError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(editId ? 'Produto atualizado!' : 'Produto criado!');
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error('Erro ao salvar produto'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto removido!');
      setProductToDelete(null);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Erro ao excluir: verifique se há pedidos vinculados a este produto. Converse com o usuário que pediu o produto, caso ele não esteja mais disponível no catálogo.');
      setProductToDelete(null);
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain = true) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) { toast.error('Erro ao enviar imagem'); continue; }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      
      if (isMain && !form.image_url) {
        setForm(f => ({ ...f, image_url: urlData.publicUrl }));
      } else {
        setForm(f => ({ ...f, additional_images: [...f.additional_images, urlData.publicUrl] }));
      }
    }
    setUploading(false);
  };

  const openEdit = async (p: any) => {
    // Fetch variants if they exist
    let pVariants: any[] = [];
    if (p.has_variants) {
      const { data } = await supabase.from('product_variants').select('*').eq('product_id', p.id);
      pVariants = data || [];
    }

    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      category: p.category || '',
      image_url: p.image_url || '',
      additional_images: p.additional_images || [],
      in_stock: p.in_stock,
      stock_quantity: String(p.stock_quantity ?? 0),
      has_variants: p.has_variants || false,
      variants: pVariants.map(v => ({ id: v.id, image_url: v.image_url, stock_quantity: String(v.stock_quantity) }))
    });
    setEditId(p.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-semibold text-foreground">Produtos</h2>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="btn-hero text-sm flex items-center gap-1">
          <Plus className="h-4 w-4" /> Novo Produto
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-foreground">{editId ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Nome *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-styled" required />
              <textarea placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-styled h-20 resize-none" />
              
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Preço (ex: 89.90) *" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input-styled" required />
                <input placeholder="Categoria" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-styled" />
              </div>

              {/* Checkbox de variações - estilizado */}
              <div className="bg-secondary/20 p-4 rounded-lg space-y-3 border border-border/50">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, has_variants: !f.has_variants }))}
                  className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer w-full"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    form.has_variants ? 'bg-primary border-primary' : 'border-border bg-background'
                  }`}>
                    {form.has_variants && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span>Este produto possui variações (ex: cores diferentes)</span>
                </button>
                
                {form.has_variants ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Variantes por Imagem</p>
                    <div className="grid gap-2">
                      {form.variants.map((v, i) => (
                        <div key={i} className="flex items-center gap-3 bg-background p-2 rounded-md border border-border/50 shadow-sm animate-in fade-in">
                          <img src={v.image_url} className="w-10 h-10 object-cover rounded" />
                          <div className="flex-1">
                            <input 
                              type="number" 
                              placeholder="Estoque" 
                              value={v.stock_quantity} 
                              onChange={e => {
                                const newVariants = [...form.variants];
                                newVariants[i].stock_quantity = e.target.value;
                                setForm(f => ({ ...f, variants: newVariants }));
                              }}
                              className="input-styled py-1 px-2 text-xs h-8 bg-muted/30"
                            />
                          </div>
                          <button 
                            onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }))}
                            className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <div className="pt-2">
                        <label className="text-[10px] text-muted-foreground mb-1 block">Adicionar variante via imagem</label>
                        <div className="flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg p-4 hover:border-primary/30 transition-colors bg-background/50 relative overflow-hidden">
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files) return;
                              setUploading(true);
                              for (const file of Array.from(files)) {
                                const ext = file.name.split('.').pop();
                                const path = `variants/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                                const { error } = await supabase.storage.from('product-images').upload(path, file);
                                if (error) { toast.error('Erro no upload'); continue; }
                                const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
                                setForm(f => ({ 
                                  ...f, 
                                  variants: [...f.variants, { image_url: urlData.publicUrl, stock_quantity: '0' }] 
                                }));
                              }
                              setUploading(false);
                            }} 
                            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                          />
                          <div className="text-center">
                            <Plus className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                            <p className="text-[10px] text-muted-foreground">Clique ou arraste imagens</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Estoque Geral</label>
                      {/* Controle numérico customizado */}
                      <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background h-11">
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, stock_quantity: String(Math.max(0, parseInt(f.stock_quantity || '0') - 1)) }))}
                          className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex-shrink-0"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={form.stock_quantity}
                          onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                          className="flex-1 text-center text-sm bg-transparent border-none focus:outline-none text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, stock_quantity: String(parseInt(f.stock_quantity || '0') + 1) }))}
                          className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex-shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end pb-2">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, in_stock: !f.in_stock }))}
                        className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          form.in_stock ? 'bg-primary border-primary' : 'border-border bg-background'
                        }`}>
                          {form.in_stock && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span>Em estoque</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!form.has_variants && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground block">Imagem Principal (Obrigatória se sem variantes)</label>
                  <div className="relative border-2 border-dashed border-border/50 rounded-xl p-4 hover:border-primary/40 transition-colors bg-background/40 cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, true)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Clique para selecionar imagem</p>
                        <p className="text-[10px] text-muted-foreground">PNG, JPG ou WEBP</p>
                      </div>
                      {form.image_url && <img src={form.image_url} className="w-12 h-12 rounded object-cover border ml-auto" />}
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={() => saveMutation.mutate()} 
                disabled={!form.name || !form.price || saveMutation.isPending || uploading} 
                className="btn-hero w-full mt-4 flex items-center justify-center gap-2"
              >
                {saveMutation.isPending || uploading ? 'Aguarde...' : 'Salvar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {products?.map(p => (
            <div key={p.id} className="card-product p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">Sem img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{p.name}</p>
                <p className="text-sm text-primary font-bold">R$ {p.price.toFixed(2).replace('.', ',')}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {p.category && <span className="badge-category text-[10px]">{p.category}</span>}
                  <span className="text-[10px] text-muted-foreground">Estoque: {p.stock_quantity ?? 0}</span>
                  {!p.in_stock && <span className="text-[10px] text-destructive">Esgotado</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => setProductToDelete(p.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!productToDelete}
        title="Remover Produto?"
        message="Esta ação é permanente e o produto será removido da loja."
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        onConfirm={() => productToDelete && deleteMutation.mutate(productToDelete)}
        onCancel={() => setProductToDelete(null)}
        type="danger"
      />
    </div>
  );
}
