-- ============================================
-- ADD EMAIL COLUMN TO PROFILES TABLE
-- ============================================
-- The profiles table was missing the email column
-- This causes email not to display or save in the edit interface

-- Add email column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Add unique constraint on email (optional but recommended)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- ============================================
-- MIGRATE EXISTING DATA (OPTIONAL)
-- ============================================
-- If you have existing workers and want to populate their emails from auth,
-- you'll need to do that manually or use Supabase admin API
-- For now, new workers will have email populated when created

-- ============================================
-- UPDATE PROFILES RLS POLICY IF NEEDED
-- ============================================
-- Ensure the SELECT policy includes the email field
-- Run this if workers can't see their own email after edit:

DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
CREATE POLICY "Authenticated users can read profiles" 
  ON profiles 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- ============================================
-- VERIFY THE CHANGE
-- ============================================
-- Run this to verify email column was added:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name = 'email';
-- Should return: email | text
