-- Fix feedback -> profiles relationship for PostgREST joins
-- Run in Supabase SQL editor

-- 1) Ensure feedback.user_id references profiles(id) so we can join to profiles
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;
ALTER TABLE feedback ADD CONSTRAINT feedback_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- 2) Optional: force PostgREST to reload schema cache
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN undefined_object THEN
  -- Ignore if pgrst channel is not available
  NULL;
END $$;