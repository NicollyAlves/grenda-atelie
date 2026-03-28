-- SQL ATUALIZADO (VERSÃO FINAL 5.0)
-- Copie e cole este código no Editor SQL do seu projeto Supabase

-- 1. ADICIONAR COLUNA order_type EM orders (Se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_type') THEN
    ALTER TABLE public.orders ADD COLUMN order_type TEXT DEFAULT 'entrega';
  END IF;
END $$;

-- 2. Tabela de Chat do Pedido
CREATE TABLE IF NOT EXISTS public.order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de Perguntas (Dúvidas) - Com FK para Profiles para JOIN automático
CREATE TABLE IF NOT EXISTS public.product_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de Avaliações - Com FK para Profiles
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Adicionar coluna para persistir imagem escolhida no carrinho
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cart_items' AND column_name='selected_image_url') THEN
    ALTER TABLE public.cart_items ADD COLUMN selected_image_url TEXT;
  END IF;
END $$;

-- 6. HABILITAR SEGURANÇA (RLS)
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE AVALIAÇÕES (Público vê, Logado avalia/edita/apaga o seu)
DROP POLICY IF EXISTS "Public can view reviews" ON public.product_reviews;
CREATE POLICY "Public can view reviews" ON public.product_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can insert reviews" ON public.product_reviews;
CREATE POLICY "Authenticated can insert reviews" ON public.product_reviews FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.product_reviews;
CREATE POLICY "Users can update their own reviews" ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and admins can delete reviews" ON public.product_reviews;
CREATE POLICY "Users and admins can delete reviews" ON public.product_reviews FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 8. POLÍTICAS DE CHAT E PERGUNTAS
DROP POLICY IF EXISTS "Users involved can view order messages" ON public.order_messages;
CREATE POLICY "Users involved can view order messages" ON public.order_messages FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users and admins can view inquiries" ON public.product_inquiries;
CREATE POLICY "Users and admins can view inquiries" ON public.product_inquiries FOR SELECT 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 9. ATIVAR REALTIME (Lógica corrigida contra erros de duplicata)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_inquiries;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
