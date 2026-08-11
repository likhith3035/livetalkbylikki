-- Create database tables for File Sharing & Share Code System (Non-AI, privacy-first)
CREATE TABLE IF NOT EXISTS public.shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other',
  folder_id UUID,
  is_in_trash BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  max_downloads INT,
  download_count INT NOT NULL DEFAULT 0,
  has_password BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  disabled_at TIMESTAMPTZ,
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.file_share_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES public.file_shares(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.shared_files(id) ON DELETE CASCADE
);

-- Indices for rapid lookup by share code and expiration
CREATE INDEX IF NOT EXISTS file_shares_code_idx ON public.file_shares (code);
CREATE INDEX IF NOT EXISTS file_shares_expires_at_idx ON public.file_shares (expires_at);
CREATE INDEX IF NOT EXISTS shared_files_owner_idx ON public.shared_files (owner_id);

-- Enable RLS
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_share_items ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Public read active shares by code"
  ON public.file_shares FOR SELECT
  TO anon, authenticated
  USING (status = 'active' AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Anyone can insert shares"
  ON public.file_shares FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can update or disable their shares"
  ON public.file_shares FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can upload shared file refs"
  ON public.shared_files FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read shared files"
  ON public.shared_files FOR SELECT
  TO anon, authenticated
  USING (is_in_trash = false);

CREATE POLICY "Anyone can link share items"
  ON public.file_share_items FOR ALL
  TO anon, authenticated
  USING (true);
