import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  order_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export default function OrderChat({ orderId }: { orderId: string }) {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [messages, loading]);

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
        setMessages(prev => [...prev, payload.new as Message]);
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
        setMessages(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msg = newMessage;
    setNewMessage(''); // optimistic reset

    const { data: insertedMsg, error } = await supabase.from('order_messages').insert({
      order_id: orderId,
      user_id: user.id,
      message: msg.trim()
    }).select().single();
    
    if (!error && insertedMsg) {
       // Only add if not already added by subscription to avoid duplicates
       setMessages(prev => {
         if (prev.find(m => m.id === insertedMsg.id)) return prev;
         return [...prev, insertedMsg];
       });
    }
    
    if (error) {
      console.error('Chat send error:', error);
      toast.error('Erro ao enviar mensagem. Tem certeza que o chat está liberado?');
      setNewMessage(msg); // revert
    }
  };

  if (loading) return <div className="text-center text-sm p-4">Carregando chat...</div>;

  return (
    <div className="flex flex-col h-[400px] border border-border rounded-lg bg-card">
      <div className="p-4 border-b border-border bg-muted/50 rounded-t-lg">
        <h3 className="font-medium text-foreground">Chat do Pedido</h3>
        <p className="text-xs text-muted-foreground">Converse com o {isAdmin ? 'Cliente' : 'Ateliê'}</p>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 scroll-smooth"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-10">
            Nenhuma mensagem ainda. Escreva detalhes, dúvidas ou atualizações sobre o seu pedido aqui.
          </p>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'}`}>
                  <p>{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-border flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="input-styled flex-1"
        />
        <button type="submit" disabled={!newMessage.trim()} className="btn-hero px-4 flex items-center justify-center">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
