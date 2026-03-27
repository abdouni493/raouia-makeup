-- FIX FOR PROFILES FOREIGN KEY CONSTRAINT
-- This script removes the foreign key constraint that requires profiles to have matching auth.users
-- This allows creating employee profiles without creating auth accounts first

-- Step 1: Drop the foreign key constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Add the constraint back WITHOUT the foreign key requirement
-- The id will just be a UUID column without referencing auth.users
-- This is already handled by the above drop - the id column will remain as is

-- Step 3: Verify the change was successful
-- The profiles table will now allow insert with any UUID without requiring auth.users records

-- NOTE: If you want to fully support this pattern, you may want to:
-- 1. Keep track of which profiles have corresponding auth users
-- 2. Create auth users separately through a different process
-- 3. Or use Supabase admin API to create auth users programmatically

-- Optional: If you need to clean up invalid profiles that don't have auth users:
-- SELECT id, full_name FROM public.profiles 
-- WHERE id NOT IN (SELECT id FROM auth.users);
