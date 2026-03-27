import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  in_stock: boolean;
  stock_quantity: string;
}

const emptyForm: ProductForm = { name: '', description: '', price: '', category: '', image_url: '', in_stock: true, stock_quantity: '0' };

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        category: form.category || null,
        image_url: form.image_url || null,
        in_stock: form.in_stock,
        stock_quantity: parseInt(form.stock_quantity) || 0,
      };
      if (editId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
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
      toast.success('Produto removido!');
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) { toast.error('Erro ao enviar imagem'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const openEdit = (p: any) => {
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      category: p.category || '',
      image_url: p.image_url || '',
      in_stock: p.in_stock,
      stock_quantity: String(p.stock_quantity ?? 0),
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
                <input placeholder="Qtd. estoque" type="number" min="0" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} className="input-styled" />
              </div>
              <input placeholder="Categoria (ex: Bolsa, Mochila)" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-styled" />
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Imagem do produto</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-muted-foreground" />
                {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
                {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 w-24 h-24 rounded-lg object-cover" />}
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.in_stock} onChange={e => setForm(f => ({ ...f, in_stock: e.target.checked }))} className="rounded" />
                Em estoque
              </label>
              <button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.price || saveMutation.isPending} className="btn-hero w-full">
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
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
                <button onClick={() => { if (confirm('Remover produto?')) deleteMutation.mutate(p.id); }} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
