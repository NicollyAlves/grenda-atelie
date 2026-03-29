-- SETUP: Rastreamento de Itens Não Lidos pelo Admin
-- Execute este script no Editor SQL do Supabase

-- 1. Coluna is_read na tabela de pedidos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='is_read') THEN
    ALTER TABLE public.orders ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Coluna is_read na tabela de dúvidas (apenas para mensagens de clientes, não do admin)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_inquiries' AND column_name='is_read') THEN
    ALTER TABLE public.product_inquiries ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 3. Coluna is_read nas mensagens do chat de pedidos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_messages' AND column_name='is_read') THEN
    ALTER TABLE public.order_messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 4. Permitir que admins atualizem o campo is_read em orders
DROP POLICY IF EXISTS "Admins can mark orders as read" ON public.orders;
CREATE POLICY "Admins can mark orders as read" ON public.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 5. Permitir que admins atualizem o campo is_read em product_inquiries
DROP POLICY IF EXISTS "Admins can mark inquiries as read" ON public.product_inquiries;
CREATE POLICY "Admins can mark inquiries as read" ON public.product_inquiries FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 6. Permitir que admins atualizem o campo is_read em order_messages
DROP POLICY IF EXISTS "Admins can mark messages as read" ON public.order_messages;
CREATE POLICY "Admins can mark messages as read" ON public.order_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 7. Permitir que usuários marquem como lidas as mensagens dos pedidos DELES
DROP POLICY IF EXISTS "Users can mark their order messages as read" ON public.order_messages;
CREATE POLICY "Users can mark their order messages as read" ON public.order_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_messages.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- 8. Permitir que usuários vejam respostas do admin nas dúvidas de produtos
-- (as respostas do admin têm is_from_admin=true e user_id=admin, por isso a política anterior não as retornava)
DROP POLICY IF EXISTS "Users and admins can view inquiries" ON public.product_inquiries;
CREATE POLICY "Users and admins can view inquiries" ON public.product_inquiries FOR SELECT
  USING (
    -- Admin pode ver tudo
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR
    -- Usuário pode ver suas próprias mensagens
    auth.uid() = user_id
    OR
    -- Usuário pode ver respostas do admin para produtos que ele perguntou
    (
      is_from_admin = true
      AND EXISTS (
        SELECT 1 FROM public.product_inquiries pi2
        WHERE pi2.product_id = product_inquiries.product_id
        AND pi2.user_id = auth.uid()
        AND pi2.is_from_admin = false
      )
    )
  );
