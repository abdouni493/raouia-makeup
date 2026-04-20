-- Disable email verification requirement for new signups
-- This allows workers to login immediately after account creation

-- Run this in Supabase SQL Editor:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Click "SQL Editor" (left sidebar)
-- 4. Click "New Query"
-- 5. Copy-paste everything below
-- 6. Click "Run"

-- Update auth settings to NOT require email confirmation
UPDATE auth.config 
SET mailer_autoconfirm = true 
WHERE NOT mailer_autoconfirm;

-- Verify the setting
SELECT mailer_autoconfirm FROM auth.config;

-- Expected output: t (true)
-- If you get "table does not exist", email confirmation is NOT required by default

-- Alternative: Check if it's already disabled
-- Run in Supabase dashboard SQL editor
SELECT * FROM auth.config;

-- If you see: mailer_autoconfirm = true, then email confirmation is disabled ✅
-- If you see: mailer_autoconfirm = false, then email confirmation is enabled ❌

-- NOTE: After running this, newly created workers will:
-- 1. Have their auth account created
-- 2. Email confirmation will be automatic (no verification email needed)
-- 3. Can login immediately with email + password
