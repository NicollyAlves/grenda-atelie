-- 1. Garante que o usuário logado se torne um ADMIN (Substitua auth.uid() pelo seu ID se necessário)
-- Ou simplesmente rode isto enquanto estiver logado no console do Supabase:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'O_SEU_EMAIL_AQUI'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Reforça a função de verificação de Admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Atualiza Políticas de RLS para Pedidos (Garantindo acesso ao Dono e ao Admin)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users and admins can view orders" ON public.orders 
FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
-- (A política acima já cobre o admin, mas podemos manter separado se preferir)

-- 4. Atualiza Políticas de RLS para Itens do Pedido
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users and admins can view order items" ON public.order_items 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- 5. Garante que variantes e fotos sejam visíveis
DROP POLICY IF EXISTS "Anyone can view product variants" ON public.product_variants;
CREATE POLICY "Anyone can view product variants" ON public.product_variants FOR SELECT USING (true);

-- 6. Garante persistência do carrinho
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.cart_items;
CREATE POLICY "Users can manage their own cart" ON public.cart_items 
FOR ALL USING (auth.uid() = user_id);
