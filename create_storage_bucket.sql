-- Execute este SQL no Supabase SQL Editor
-- https://supabase.com/dashboard/project/ixymkkhcfayjltqrzezq/sql/new

-- 1. Criar o bucket (se ainda não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acesso
-- Permitir que qualquer um veja as imagens (público)
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Permitir que usuários autenticados façam upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

-- Permitir que usuários autenticados atualizem suas imagens
CREATE POLICY IF NOT EXISTS "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images');

-- Permitir que usuários autenticados deletem suas imagens
CREATE POLICY IF NOT EXISTS "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');
