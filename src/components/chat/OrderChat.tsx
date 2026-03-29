import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Send, Paperclip, X, Loader2, Video, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  order_id: string;
  user_id: string;
  message: string;
  attachments?: { url: string; type: 'image' | 'video' }[];
  created_at: string;
}

export default function OrderChat({ orderId }: { orderId: string }) {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string; type: 'image' | 'video' }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (force = false) => {
    if (scrollRef.current && (isAtBottom || force)) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 60);
  };

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [loading]);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`order_messages_${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_messages',
        filter: `order_id=eq.${orderId}`
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          const isFromMe = payload.new.user_id === user?.id;
          // Se a mensagem não é minha e não estou no fim da tela, incrementa badge
          if (!isFromMe) {
            setIsAtBottom(prev2 => {
              if (!prev2) setUnreadCount(c => c + 1);
              return prev2;
            });
          }
          return [...prev, payload.new as Message];
        });
        // Scroll automático só se já estava no fundo
        setTimeout(() => scrollToBottom(), 50);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        setMessages(data.map(m => ({ ...m, attachments: Array.isArray(m.attachments) ? m.attachments as { url: string; type: "image" | "video" }[] : [] })));
        // Marcar como lidas todas as mensagens do outro lado
        const unread = data.filter(m => m.user_id !== user?.id);
        if (unread.length > 0) {
          const ids = unread.map(m => m.id);
          await supabase.from('order_messages').update({ is_read: true } as any).in('id', ids);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPending = files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
      }));
      setPendingFiles(prev => [...prev, ...newPending]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePending = (index: number) => {
    setPendingFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadFiles = async () => {
    const attachments: { url: string; type: 'image' | 'video' }[] = [];
    
    for (const item of pendingFiles) {
      const fileExt = item.file.name.split('.').pop();
      const fileName = `${orderId}/${Math.random()}.${fileExt}`;
      const filePath = `chat/${fileName}`;

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingFiles.length === 0) || !user) return;

    const msgText = newMessage;
    const filesToUpload = [...pendingFiles];
    
    setUploading(true);
    setNewMessage('');
    setPendingFiles([]);

    try {
      const attachments = await uploadFiles();

      const { data: insertedMsg, error } = await supabase.from('order_messages').insert({
        order_id: orderId,
        user_id: user.id,
        message: msgText.trim(),
        attachments: attachments
      }).select().single();
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Chat send error:', error);
      toast.error('Erro ao enviar mensagem ou mídia.');
      setNewMessage(msgText);
      setPendingFiles(filesToUpload);
    } finally {
      setUploading(false);
    }
  };

  // Formata a data/hora completa da mensagem
  const formatMsgDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    if (d.toDateString() === today.toDateString()) return `Hoje, ${time}`;
    if (d.toDateString() === yesterday.toDateString()) return `Ontem, ${time}`;
    return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${time}`;
  };

  if (loading) return <div className="text-center text-sm p-4">Carregando chat...</div>;

  return (
    <div className="flex flex-col h-[500px] border border-border rounded-lg bg-card shadow-soft overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div>
          <h3 className="font-display font-medium text-foreground">Chat do Pedido</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Converse com o {isAdmin ? 'Cliente' : 'Ateliê'}</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => { scrollToBottom(true); setUnreadCount(0); }}
            className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full animate-bounce shadow-md"
          >
            {unreadCount} nova{unreadCount > 1 ? 's' : ''} mensagem{unreadCount > 1 ? 'ns' : ''}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto space-y-4 scroll-smooth bg-muted/5"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-10 px-10">
            Nenhuma mensagem ainda. Escreva detalhes, envie fotos ou vídeos sobre seu pedido aqui.
          </p>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-foreground rounded-tl-none border border-border/50'}`}>
                  {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={`grid gap-2 mt-2 ${msg.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {msg.attachments.map((at, i) => (
                        <div key={i} className="rounded-lg overflow-hidden border border-white/10 aspect-square bg-black/20">
                          {at.type === 'video' ? (
                            <video src={at.url} controls className="w-full h-full object-cover" />
                          ) : (
                            <img 
                              src={at.url} 
                              alt="Anexo" 
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" 
                              onClick={() => window.open(at.url, '_blank')}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className={`text-[9px] mt-1.5 font-medium uppercase opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                    {formatMsgDate(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {pendingFiles.length > 0 && (
        <div className="p-3 bg-muted/50 border-t border-border flex gap-2 overflow-x-auto">
          {pendingFiles.map((item, i) => (
            <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-primary/30 shadow-sm">
              {item.type === 'video' ? (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center"><Video className="h-6 w-6 text-white" /></div>
              ) : (
                <img src={item.preview} className="w-full h-full object-cover" />
              )}
              <button 
                onClick={() => removePending(i)}
                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white hover:bg-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={sendMessage} className="p-3 border-t border-border bg-card flex flex-col gap-2">
        <div className="flex gap-2 items-end">
          <input 
            type="file" 
            multiple 
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-all active:scale-95"
            title="Anexar Fotos ou Vídeos"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="input-styled py-3 px-4 min-h-[48px] max-h-32 resize-none"
              rows={1}
            />
          </div>

          <button 
            type="submit" 
            disabled={(!newMessage.trim() && pendingFiles.length === 0) || uploading} 
            className="btn-hero p-3 flex items-center justify-center rounded-xl shadow-lg active:scale-95 disabled:grayscale"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}

