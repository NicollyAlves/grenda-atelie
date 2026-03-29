import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Package, ChevronDown, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function MyInquiries() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openThreadProductId, setOpenThreadProductId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [files, setFiles] = useState<{ file: File; preview: string; type: 'image' | 'video' }[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Busca todas as dúvidas do usuário (suas perguntas + respostas do admin)
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['my-inquiries', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_inquiries')
        .select('*, products(id, name, image_url)')
        .or(`user_id.eq.${user!.id},is_from_admin.eq.true`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  // Agrupa por produto para formar threads
  const threads = (inquiries ?? []).reduce((acc: Record<string, any>, msg: any) => {
    const pid = msg.product_id;
    if (!acc[pid]) {
      acc[pid] = {
        product_id: pid,
        product: msg.products,
        messages: [],
        lastDate: msg.created_at,
      };
    }
    acc[pid].messages.push(msg);
    if (msg.created_at > acc[pid].lastDate) acc[pid].lastDate = msg.created_at;
    return acc;
  }, {});

  const threadList = Object.values(threads).sort(
    (a: any, b: any) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
  );

  const activeThread: any = openThreadProductId ? threads[openThreadProductId] : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread?.messages?.length, openThreadProductId]);

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!user || !openThreadProductId) return;
      setUploading(true);
      try {
        const attachments: { url: string; type: 'image' | 'video' }[] = [];
        for (const item of files) {
          const ext = item.file.name.split('.').pop();
          const path = `inquiries/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error } = await supabase.storage.from('media').upload(path, item.file);
          if (error) throw error;
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
          attachments.push({ url: urlData.publicUrl, type: item.type });
        }
        const { error } = await supabase.from('product_inquiries').insert({
          product_id: openThreadProductId,
          user_id: user.id,
          message: replyText.trim(),
          is_from_admin: false,
          attachments,
        });
        if (error) throw error;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      setReplyText('');
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ['my-inquiries', user?.id] });
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === today.toDateString()) return `Hoje, ${time}`;
    if (d.toDateString() === yesterday.toDateString()) return `Ontem, ${time}`;
    return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${time}`;
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Faça login para ver suas dúvidas.</p>
        <Link to="/login" className="btn-hero mt-4 inline-block">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Minhas Dúvidas</h1>
          <p className="text-sm text-muted-foreground">Perguntas sobre produtos e respostas do Ateliê</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      ) : threadList.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
          <MessageCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Você ainda não fez nenhuma pergunta.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Na página de um produto, clique em <strong>"Tirar Dúvida"</strong> para começar.
          </p>
          <Link to="/produtos" className="btn-hero mt-6 inline-block">Ver Produtos</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {threadList.map((thread: any) => {
            const isOpen = openThreadProductId === thread.product_id;
            const lastMsg = thread.messages[thread.messages.length - 1];
            const hasAdminReply = thread.messages.some((m: any) => m.is_from_admin);
            const unread = thread.messages.some((m: any) => m.is_from_admin && !m.is_read);

            return (
              <div
                key={thread.product_id}
                className={`card-product overflow-hidden transition-all ${unread ? 'border-l-4 border-l-red-500' : ''}`}
              >
                {/* Cabeçalho do thread — clicável */}
                <button
                  onClick={() => setOpenThreadProductId(isOpen ? null : thread.product_id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted border border-border/50 flex-shrink-0">
                    {thread.product?.image_url ? (
                      <img src={thread.product.image_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground truncate">{thread.product?.name || 'Produto'}</p>
                      {unread && (
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-red-600 text-white px-1.5 py-0.5 rounded-full animate-pulse flex-shrink-0">
                          Nova resposta!
                        </span>
                      )}
                      {hasAdminReply && !unread && (
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-primary/15 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0">
                          Respondido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {lastMsg.is_from_admin ? '🏪 Ateliê: ' : 'Você: '}
                      {lastMsg.message || '[mídia]'}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDate(lastMsg.created_at)}</p>
                  </div>

                  <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Chat expandido */}
                {isOpen && (
                  <div className="border-t border-border/50">
                    {/* Mensagens */}
                    <div
                      ref={scrollRef}
                      className="max-h-72 overflow-y-auto p-4 space-y-3 bg-muted/5"
                    >
                      {thread.messages.map((msg: any) => {
                        const isMe = !msg.is_from_admin;
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && (
                              <span className="text-[9px] text-muted-foreground uppercase font-bold mb-1 ml-1">Ateliê</span>
                            )}
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                              isMe
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-card text-foreground rounded-tl-none border border-border/50'
                            }`}>
                              {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                              {msg.attachments?.length > 0 && (
                                <div className={`grid gap-1.5 mt-2 ${msg.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                  {msg.attachments.map((at: any, i: number) => (
                                    <div key={i} className="rounded-lg overflow-hidden aspect-square border border-white/10">
                                      {at.type === 'video'
                                        ? <video src={at.url} controls className="w-full h-full object-cover" />
                                        : <img src={at.url} className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(at.url, '_blank')} />
                                      }
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className={`text-[9px] mt-1 opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                                {formatDate(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pré-visualização de arquivos */}
                    {files.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto px-4 pt-3">
                        {files.map((f, i) => (
                          <div key={i} className="relative w-12 h-12 flex-shrink-0 rounded border border-border">
                            {f.type === 'video'
                              ? <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-[8px]">Video</div>
                              : <img src={f.preview} className="w-full h-full object-cover rounded" />
                            }
                            <button
                              onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input de resposta */}
                    <div className="p-3 border-t border-border/50 bg-card flex gap-2 items-end">
                      <label className="p-2.5 rounded-lg border border-border bg-muted hover:bg-muted/80 cursor-pointer transition-colors flex-shrink-0">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFiles} />
                      </label>
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Escreva sua mensagem..."
                        rows={1}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (replyText.trim() || files.length > 0) sendReply.mutate();
                          }
                        }}
                        className="input-styled text-sm py-2.5 flex-1 resize-none min-h-[44px] max-h-28"
                      />
                      <button
                        onClick={() => sendReply.mutate()}
                        disabled={(!replyText.trim() && files.length === 0) || uploading}
                        className="btn-hero p-2.5 flex-shrink-0 flex items-center justify-center rounded-xl disabled:grayscale"
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
