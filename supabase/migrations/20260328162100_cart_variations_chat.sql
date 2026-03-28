-- Variações de produtos
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Carrinho de compras persistente
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat de dúvidas de produtos (Pré-venda)
CREATE TABLE IF NOT EXISTS public.product_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inquiries ENABLE ROW LEVEL SECURITY;

-- Policies for variants (viewable by all, managed by admin)
CREATE POLICY "Anyone can view product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage product variants" ON public.product_variants FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Policies for cart (owned by user)
CREATE POLICY "Users can manage their own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- Policies for inquiries
CREATE POLICY "Users and admins can view inquiries" ON public.product_inquiries FOR SELECT 
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users and admins can insert inquiries" ON public.product_inquiries FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Extension for products and order items
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id);
