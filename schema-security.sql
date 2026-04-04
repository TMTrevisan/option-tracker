-- Security Hardening: Isolate SnapTrade Secrets
-- Create a private table that is not accessible via Row Level Security (RLS) from the client

CREATE TABLE IF NOT EXISTS public.private_user_secrets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    snaptrade_secret TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but create NO policies. 
-- This means NO client can read/write to this table. 
-- It can only be accessed using the SUPABASE_SERVICE_ROLE_KEY (Server-side admins only)
ALTER TABLE public.private_user_secrets ENABLE ROW LEVEL SECURITY;

-- Optional: If you need a trigger to update 'updated_at'
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_private_user_secrets_modtime ON public.private_user_secrets;
CREATE TRIGGER update_private_user_secrets_modtime
BEFORE UPDATE ON public.private_user_secrets
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Migration Step: Move existing secrets from user_metadata to the new table
-- Safe to run multiple times because of ON CONFLICT
INSERT INTO public.private_user_secrets (user_id, snaptrade_secret)
SELECT 
    id as user_id, 
    raw_user_meta_data->>'snaptrade_secret' as snaptrade_secret
FROM auth.users
WHERE raw_user_meta_data->>'snaptrade_secret' IS NOT NULL
ON CONFLICT (user_id) DO UPDATE 
SET snaptrade_secret = EXCLUDED.snaptrade_secret;

-- Note: We are NOT deleting the secret from user_metadata yet to ensure the app doesn't break 
-- during deployment until all API routes are fully updated and tested.
