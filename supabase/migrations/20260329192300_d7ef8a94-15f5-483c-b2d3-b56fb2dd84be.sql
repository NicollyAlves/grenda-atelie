
-- Create a security definer function to check if a user has inquired about a product
CREATE OR REPLACE FUNCTION public.user_has_inquiry_on_product(_user_id uuid, _product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.product_inquiries
    WHERE user_id = _user_id AND product_id = _product_id AND is_from_admin = false
  )
$$;

-- Drop the recursive SELECT policy
DROP POLICY IF EXISTS "Users and admins can view inquiries" ON public.product_inquiries;

-- Recreate without self-reference
CREATE POLICY "Users and admins can view inquiries"
ON public.product_inquiries
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR auth.uid() = user_id
  OR (is_from_admin = true AND public.user_has_inquiry_on_product(auth.uid(), product_id))
);
