-- ============================================
-- DIAGNOSE LOGIN ISSUES
-- ============================================
-- Run these queries to troubleshoot why workers can't login

-- ============================================
-- 1. CHECK IF ANY WORKER ACCOUNTS EXIST IN PROFILES
-- ============================================
SELECT id, username, email, full_name, role 
FROM profiles 
WHERE role = 'worker'
ORDER BY created_at DESC;

-- Expected: Shows list of workers with email addresses
-- If EMPTY: No worker accounts created yet (create one via UI first)
-- If shows workers: Continue to next checks

-- ============================================
-- 2. CHECK PROFILES TABLE STRUCTURE
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Expected: Should include 'email' column of type 'text'
-- If missing: Run ADD_EMAIL_TO_PROFILES.sql

-- ============================================
-- 3. VERIFY EMAIL COLUMN EXISTS AND HAS DATA
-- ============================================
SELECT id, username, email, full_name
FROM profiles 
WHERE role = 'worker' AND email IS NOT NULL
ORDER BY created_at DESC;

-- Expected: Shows workers with email addresses populated
-- If empty: Emails not being saved (might need to recreate workers)
-- If shows data: Emails are saved correctly

-- ============================================
-- 4. COUNT TOTAL WORKERS
-- ============================================
SELECT COUNT(*) as total_workers 
FROM profiles 
WHERE role = 'worker';

-- Expected: Should show at least 1
-- If 0: No workers created yet

-- ============================================
-- 5. CHECK FOR ADMINS (FOR COMPARISON)
-- ============================================
SELECT id, username, email, full_name, role 
FROM profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- Expected: Shows at least one admin account
-- This proves the system works, just need to create workers

-- ============================================
-- 6. VERIFY RLS POLICIES ARE CORRECT
-- ============================================
SELECT policyname, permissive, roles, qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Expected: Shows these policies:
-- - Authenticated users can read profiles
-- - Users can create own profile
-- - Users can update own profile
-- - Admins can manage profiles

-- ============================================
-- 7. CHECK IF EMAIL IS UNIQUE (NO DUPLICATES)
-- ============================================
SELECT email, COUNT(*) as count
FROM profiles 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Expected: Empty result (no duplicates)
-- If shows results: Duplicate emails exist (will cause issues)

-- ============================================
-- SUMMARY OF WHAT TO CHECK
-- ============================================
/*
If you're getting "Invalid login credentials" error:

Step 1: Run query #1 above
   - If no workers shown: CREATE A WORKER FIRST (via UI)
   - If workers shown: Continue

Step 2: Run query #3 above
   - If no results: Worker emails not saved (recreate workers)
   - If shows emails: Continue

Step 3: Try these test credentials
   - Go to Supabase Console → Authentication → Users
   - Look for your test worker email
   - If it exists: Try logging in with that exact email/password
   - If not exists: Create a new worker in the app UI

Step 4: Check Supabase Auth directly
   - Go to https://app.supabase.com
   - Select your project
   - Go to Authentication → Users
   - Look for workers created (should have email)
   - Click on one and check if it's confirmed

Step 5: Try resetting password
   - If worker exists but password wrong: Can't fix from database
   - User needs to click "Forgot Password" on login page
   - Or admin deletes and recreates the worker with new password
*/
