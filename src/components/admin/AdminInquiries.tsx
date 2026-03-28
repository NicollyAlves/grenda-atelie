import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { MessageSquare, Send, User, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminInquiries() {
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: async () => {
      const { data: inquiriesData, error } = await supabase
        .from('product_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching inquiries:', error);
        return [];
      }

      if (inquiriesData && inquiriesData.length > 0) {
        const productIds = [...new Set(inquiriesData.map(i => i.product_id))];
        const userIds = [...new Set(inquiriesData.map(i => i.user_id))];
        
        const [productsRes, profilesRes] = await Promise.all([
          supabase.from('products').select('id, name, image_url').in('id', productIds),
          supabase.from('profiles').select('user_id, full_name, phone').in('user_id', userIds)
        ]);

        return inquiriesData.map(inquiry => ({
          ...inquiry,
          product: productsRes.data?.find(p => p.id === inquiry.product_id) || null,
          profiles: profilesRes.data?.find(p => p.user_id === inquiry.user_id) || null
        }));
      }

      return inquiriesData || [];
    },
  });

  const sendReply = useMutation({
    mutationFn: async ({ productId, userId, message }: { productId: string, userId: string, message: string }) => {
      const { error } = await supabase.from('product_inquiries').insert({
        product_id: productId,
        user_id: userId,
        message,
        is_from_admin: true
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      setReplyText(prev => ({ ...prev, [`${variables.productId}-${variables.userId}`]: '' }));
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] });
      // Also invalidate product-specific inquiries for real-time feel if admin has a product page open
      queryClient.invalidateQueries({ queryKey: ['product_inquiries'] });
      toast.success('Resposta enviada!');
    }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando dúvidas...</div>;

  // Group by product and user to create "chat threads"
  const grouped = (inquiries || []).reduce((acc: any, curr: any) => {
    const key = `${curr.product_id}-${curr.user_id}`;
    if (!acc[key]) {
      acc[key] = { 
        product: curr.product, 
        profile: curr.profiles, 
        productId: curr.product_id, 
        userId: curr.user_id, 
        messages: [] 
      };
    }
    acc[key].messages.push(curr);
    return acc;
  }, {});

  const threads = Object.values(grouped);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-display font-semibold text-foreground">Dúvidas de Produtos</h2>
      </div>
      
      {threads.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma dúvida recebida ainda.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">As perguntas feitas pelos clientes nas páginas de produtos aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {threads.map((thread: any) => {
            const key = `${thread.productId}-${thread.userId}`;
            return (
              <div key={key} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Thread Header */}
                <div className="bg-secondary/20 p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border/50">
                      <img src={thread.product?.image_url} alt={thread.product?.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground leading-tight">{thread.product?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border/50">
                          <User className="h-3 w-3" /> {thread.profile?.full_name || 'Cliente'}
                        </span>
                        {thread.profile?.phone && (
                          <span className="text-[10px] text-muted-foreground/70">{thread.profile.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Message List */}
                <div className="p-4 bg-background/30 max-h-72 overflow-y-auto space-y-4">
                  {thread.messages.slice().reverse().map((m: any) => (
                    <div key={m.id} className={`flex ${m.is_from_admin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`group relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.is_from_admin ? 'bg-primary text-primary-foreground shadow-sm rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'}`}>
                        <p className="leading-relaxed">{m.message}</p>
                        <p className={`text-[9px] mt-1 opacity-70 ${m.is_from_admin ? 'text-right' : 'text-left'}`}>
                          {new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex gap-2">
                    <input 
                      value={replyText[key] || ''} 
                      onChange={e => setReplyText(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Responder para ${thread.profile?.full_name?.split(' ')[0] || 'cliente'}...`} 
                      className="input-styled text-sm py-2.5 h-auto bg-muted/20 border-border/50 focus:bg-background"
                      onKeyDown={e => { 
                        if (e.key === 'Enter' && replyText[key]?.trim() && !sendReply.isPending) {
                          sendReply.mutate({ productId: thread.productId, userId: thread.userId, message: replyText[key] });
                        }
                      }}
                    />
                    <button 
                      onClick={() => sendReply.mutate({ productId: thread.productId, userId: thread.userId, message: replyText[key] })}
                      disabled={!replyText[key]?.trim() || sendReply.isPending}
                      className="btn-hero w-auto px-5 py-2.5 flex items-center justify-center disabled:opacity-50"
                    >
                      {sendReply.isPending ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
