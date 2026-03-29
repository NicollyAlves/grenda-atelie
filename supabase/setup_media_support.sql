-- SUPORTE A MÍDIAS (FOTOS/VÍDEOS) EM MENSAGENS E AVALIAÇÕES
-- Execute este script no SQL Editor do Supabase

-- 1. ADICIONAR COLUNA ATTACHMENTS NAS TABELAS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_messages' AND column_name='attachments') THEN
    ALTER TABLE public.order_messages ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_inquiries' AND column_name='attachments') THEN
    ALTER TABLE public.product_inquiries ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_reviews' AND column_name='attachments') THEN
    ALTER TABLE public.product_reviews ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 2. CRIAR BUCKET DE STORAGE PARA MÍDIAS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 3. POLÍTICAS DE STORAGE PARA O BUCKET 'MEDIA'
-- Everyone can view media
DROP POLICY IF EXISTS "Public View Media" ON storage.objects;
CREATE POLICY "Public View Media" ON storage.objects FOR SELECT 
  USING (bucket_id = 'media');

-- Authenticated users can upload to 'media'
DROP POLICY IF EXISTS "Authenticated Upload Media" ON storage.objects;
CREATE POLICY "Authenticated Upload Media" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Users can delete their own media (if needed)
DROP POLICY IF EXISTS "Users Delete Own Media" ON storage.objects;
CREATE POLICY "Users Delete Own Media" ON storage.objects FOR DELETE 
  USING (bucket_id = 'media' AND auth.uid() = owner);
