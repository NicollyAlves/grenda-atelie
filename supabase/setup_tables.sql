-- SQL ATUALIZADO PARA GRENDA ATELIÊ
-- Copie e cole este código no Editor SQL do seu projeto Supabase

-- 1. Tabela de Chat do Pedido
CREATE TABLE IF NOT EXISTS public.order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Perguntas (Dúvidas) sobre Produtos
CREATE TABLE IF NOT EXISTS public.product_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Adicionar coluna para persistir imagem escolhida no carrinho
-- Se já existir, não fará nada.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cart_items' AND column_name='selected_image_url') THEN
    ALTER TABLE public.cart_items ADD COLUMN selected_image_url TEXT;
  END IF;
END $$;

-- 4. Habilitar RLS (Segurança)
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inquiries ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para Mensagens de Pedido
DROP POLICY IF EXISTS "Users involved can view order messages" ON public.order_messages;
CREATE POLICY "Users involved can view order messages" ON public.order_messages FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can insert order messages" ON public.order_messages;
CREATE POLICY "Users can insert order messages" ON public.order_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

-- 6. Políticas para Perguntas de Produtos
DROP POLICY IF EXISTS "Users and admins can view inquiries" ON public.product_inquiries;
CREATE POLICY "Users and admins can view inquiries" ON public.product_inquiries FOR SELECT 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users and admins can insert inquiries" ON public.product_inquiries;
CREATE POLICY "Users and admins can insert inquiries" ON public.product_inquiries FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 7. ATIVAR REALTIME (CRÍTICO PARA CHAT SEM F5)
-- Adiciona as tabelas à publicação de tempo real do Supabase
-- Verifique se sua publicação se chama 'supabase_realtime' (padrão)
BEGIN;
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.product_inquiries;
    ELSE
      CREATE PUBLICATION supabase_realtime FOR TABLE public.order_messages, public.product_inquiries;
    END IF;
  END $$;
COMMIT;
