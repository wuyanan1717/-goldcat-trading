-- ============================================================================
-- Registration Bug Fix - Production Migration
-- Date: 2026-01-15
-- ============================================================================
-- This script fixes the registration trigger to properly handle user metadata
-- and backfills missing/invalid user data
-- ============================================================================

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create enhanced handle_new_user function
-- This version ensures all critical fields are populated correctly
-- Note: Removed full_name and avatar_url as they don't exist in profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,           -- Critical Fix: Save email from auth.users
    username, 
    total_capital, 
    is_premium,
    max_trades,
    risk_mode,
    created_at, 
    updated_at
  )
  VALUES (
    new.id,
    new.email,       -- Get email directly from auth.users table
    COALESCE(new.raw_user_meta_data->>'username', new.email, 'user_' || substr(new.id::text, 1, 8)),
    0,               -- Default starting capital
    false,           -- Default: not premium
    20,              -- Default: 20 max trades
    'balanced',      -- Default: balanced risk mode
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Fix existing "invalid" accounts (missing email or defaults)
UPDATE public.profiles p
SET 
  email = u.email,
  username = COALESCE(p.username, u.raw_user_meta_data->>'username', u.email),
  is_premium = COALESCE(p.is_premium, false),
  max_trades = COALESCE(p.max_trades, 20),
  risk_mode = COALESCE(p.risk_mode, 'balanced'),
  created_at = COALESCE(p.created_at, u.created_at),
  updated_at = now()
FROM auth.users u
WHERE p.id = u.id 
  AND (p.email IS NULL OR p.username IS NULL);

-- Step 5: Fix "ghost" accounts (in auth.users but not in profiles)
INSERT INTO public.profiles (
    id, email, username, total_capital, is_premium, max_trades, risk_mode, created_at, updated_at
)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'username', email), 
    0, 
    false, 
    20, 
    'balanced',
    created_at, 
    now()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Verification
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as profiles_with_email,
    COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as profiles_with_username
FROM public.profiles;
