-- Track ephemeral room media for auto-cleanup (privacy-first, no permanent storage)
CREATE TABLE IF NOT EXISTS public.room_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS room_media_expires_at_idx ON public.room_media (expires_at);
CREATE INDEX IF NOT EXISTS room_media_room_id_idx ON public.room_media (room_id);

ALTER TABLE public.room_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert room media refs"
  ON public.room_media FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read room media refs"
  ON public.room_media FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete expired room media refs"
  ON public.room_media FOR DELETE
  TO anon, authenticated
  USING (expires_at < now());

-- Optional helper: list expired paths (client or cron can call via RPC)
CREATE OR REPLACE FUNCTION public.get_expired_room_media_paths()
RETURNS TABLE (storage_path TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT storage_path FROM public.room_media WHERE expires_at < now();
$$;

GRANT EXECUTE ON FUNCTION public.get_expired_room_media_paths() TO anon, authenticated;
