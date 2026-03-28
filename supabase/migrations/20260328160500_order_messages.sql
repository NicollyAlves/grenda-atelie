-- Create order_messages table (if not already managed by something else)
CREATE TABLE IF NOT EXISTS public.order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- Policies for order_messages
-- 1. Anyone involved in the order can view messages
CREATE POLICY "Users involved can view order messages" ON public.order_messages FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

-- 2. Users can insert messages for their own orders
CREATE POLICY "Users can insert order messages" ON public.order_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid()) OR
      public.has_role(auth.uid(), 'admin')
    )
  );

-- 3. Admins can do anything
CREATE POLICY "Admins have full access to messages" ON public.order_messages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
