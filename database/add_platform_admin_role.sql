-- Migration: Add platform admin role to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- Force a specific user to be admin if needed for development (optional instruction for user)
-- UPDATE public.users SET is_platform_admin = true WHERE email = 'admin@example.com';
