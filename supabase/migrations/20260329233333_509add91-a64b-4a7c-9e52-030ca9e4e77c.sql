
DROP POLICY IF EXISTS "admins_manage_product_variants" ON public.product_variants;
CREATE POLICY "admins_manage_product_variants" ON public.product_variants
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
