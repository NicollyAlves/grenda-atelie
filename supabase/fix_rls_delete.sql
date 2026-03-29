-- FIX: Adicionar políticas de exclusão para administradores
-- Execute este comando no SQL Editor do Supabase

-- 1. Permitir que Admins excluam Pedidos
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Permitir que Admins excluam Itens de Pedido
DROP POLICY IF EXISTS "Admins can delete order items" ON public.order_items;
CREATE POLICY "Admins can delete order items" ON public.order_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 3. Garantir que as tabelas de suporte também permitam exclusão (já deve ter via cascade, mas reforçamos)
DROP POLICY IF EXISTS "Admins can manage messages for deletion" ON public.order_messages;
CREATE POLICY "Admins can manage messages for deletion" ON public.order_messages FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
