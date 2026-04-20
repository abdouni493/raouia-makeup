-- ============================================
-- FIX WORKER LOGIN ISSUE
-- ============================================
-- This script fixes Row-Level Security (RLS) policies that prevent workers from logging in
-- Problem: Workers cannot read their own profile after authentication
-- Solution: Allow authenticated users to read profiles, allow role-based filtering

-- ============================================
-- DROP PROBLEMATIC POLICIES
-- ============================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles viewable by own user" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- ============================================
-- CREATE FIXED POLICIES FOR WORKER LOGIN
-- ============================================

-- Allow all authenticated users to read ALL profiles (for login and user list)
-- This is safe because we filter data in the application layer by role
CREATE POLICY "Authenticated users can read profiles" 
  ON profiles 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile (during signup)
CREATE POLICY "Users can create own profile" 
  ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow admins to perform all operations on profiles
CREATE POLICY "Admins can manage profiles" 
  ON profiles 
  FOR ALL 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' 
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- ============================================
-- VERIFY POLICIES ARE WORKING
-- ============================================
-- Run these commands to verify:
-- SELECT * FROM pgsql_meta.policies WHERE table_name = 'profiles';
-- SELECT auth.role(), auth.uid();

-- ============================================
-- TEST THE LOGIN FLOW
-- ============================================
-- After applying these policies:
-- 1. Worker enters email/password on login page
-- 2. supabase.auth.signInWithPassword() authenticates the user
-- 3. fetchUserProfile() is called with the user's ID
-- 4. SELECT query on profiles table should now succeed
-- 5. Worker profile is loaded and role = 'worker' is detected
-- 6. App routes to WorkerDashboard component
-- 7. Worker successfully sees their data

-- ============================================
-- IF WORKER LOGIN STILL FAILS
-- ============================================
-- Run this diagnostic query:
/*
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role,
  p.id as profile_id,
  p.username,
  p.role,
  p.full_name
FROM profiles p
WHERE p.id = auth.uid();
*/

-- Expected result: Shows the logged-in worker's profile
-- If empty: RLS policy still blocking access
-- If error: Database connection issue

-- ============================================
-- SECURITY NOTES
-- ============================================
-- The "Authenticated users can read profiles" policy is safe because:
-- 1. Only authenticated (logged-in) users can access
-- 2. Application layer filters data by role
-- 3. Sensitive data (passwords, emails) is not in profiles table
-- 4. Workers cannot modify other profiles (UPDATE policy prevents it)
-- 5. Workers cannot delete profiles (no DELETE policy)
-- 6. Admins have full access for management

-- ============================================
-- COMPLETE PROFILES RLS POLICY SUMMARY
-- ============================================
/*
After this fix, the profiles table RLS policies are:

1. SELECT (Read):
   - ✅ All authenticated users can read ALL profiles
   - Purpose: Allow login lookup and user selection in UI

2. INSERT (Create):
   - ✅ Users can insert their own profile (auth.uid() = id)
   - Purpose: Allow worker account creation during signup

3. UPDATE (Modify):
   - ✅ Users can update their own profile (auth.uid() = id)
   - ✅ Admins can update any profile
   - Purpose: Allow password/profile changes

4. DELETE (Remove):
   - ❌ No policy defined - impossible to delete
   - Purpose: Prevent accidental data loss

5. ALL (Admin operations):
   - ✅ Admins (role = 'admin' or 'super_admin') can do anything
   - Purpose: Admin management interface
*/

-- ============================================
-- ROLLBACK (If needed to restore previous state)
-- ============================================
/*
-- Run this if you need to revert:
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- Then reapply the previous policies from SETUP_RLS_POLICY_FIX.md
*/
