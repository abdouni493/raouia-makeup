-- WORKER LOGIN DIAGNOSIS SCRIPT
-- Run each query below in Supabase SQL Editor to diagnose login issues

-- ============================================================================
-- QUERY 1: Check if any workers exist in the database
-- ============================================================================
SELECT 
  id, 
  username, 
  email, 
  full_name, 
  role, 
  created_at
FROM profiles 
WHERE role = 'worker'
ORDER BY created_at DESC;

-- Expected: Should show at least one row with worker account
-- If empty: No workers created yet - go to step "CREATE TEST WORKER" below
-- If shows workers: Continue to Query 2

-- ============================================================================
-- QUERY 2: Check email column exists and has data
-- ============================================================================
SELECT 
  COUNT(*) as total_workers,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as workers_with_email,
  COUNT(CASE WHEN email IS NULL THEN 1 END) as workers_without_email
FROM profiles 
WHERE role = 'worker';

-- Expected: workers_with_email should be > 0
-- If workers_with_email = 0: Email not saved - go to "FIX EMAIL STORAGE" below
-- If > 0: Continue to Query 3

-- ============================================================================
-- QUERY 3: Show workers with their email addresses
-- ============================================================================
SELECT username, email, role
FROM profiles
WHERE role = 'worker' AND email IS NOT NULL;

-- Expected: Shows list of workers with email addresses
-- Example result:
--   username   |        email        | role
--  -----------+---------------------+-------
--   testworker | testworker@test.com | worker
-- Use these emails to login

-- ============================================================================
-- QUERY 4: Check RLS policies on profiles table
-- ============================================================================
SELECT 
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Expected: Should show several policies like:
-- - "Authenticated users can read their profile"
-- - "Users can update their own profile"
-- - etc.

-- ============================================================================
-- QUERY 5: Verify profiles table structure
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Expected: Should include columns:
-- - id (uuid)
-- - email (text) - MUST exist
-- - username (text)
-- - role (text)
-- etc.

-- ============================================================================
-- QUERY 6: Check for duplicate emails
-- ============================================================================
SELECT 
  email,
  COUNT(*) as count
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Expected: Empty result (no duplicates)
-- If shows results: Duplicate emails found - contact support

-- ============================================================================
-- QUERY 7: Admin account check (should exist)
-- ============================================================================
SELECT id, username, email, role, created_at
FROM profiles
WHERE role = 'admin' OR role = 'super_admin'
LIMIT 5;

-- Expected: At least one admin account
-- If empty: No admin accounts - serious problem

-- ============================================================================
-- INSTRUCTIONS AFTER RUNNING QUERIES
-- ============================================================================
/*

SCENARIO 1: Query 1 shows no workers
→ No worker accounts created yet
→ ACTION: Create a test worker (see "CREATE TEST WORKER" section below)

SCENARIO 2: Query 3 shows workers but some with NULL email
→ Email column exists but not saved properly
→ ACTION: 
   1. Run: UPDATE profiles SET email = 'worker_email@example.com' WHERE username = 'worker_username';
   2. Or recreate worker via UI after deploying code fixes

SCENARIO 3: Query 3 shows workers with emails
→ Workers exist in database with emails
→ ACTION: Try to login with that email
   - If login works: Problem solved ✅
   - If still get "Invalid login credentials": Email exists in DB but not in Supabase Auth
   - This means: Worker profile created but auth account not created
   - SOLUTION: Delete worker and recreate via Employees UI

SCENARIO 4: Query 4 shows RLS policies
→ RLS is configured
→ ACTION: Check if policies allow authenticated users to login
   - Look for policy that allows SELECT on profiles for authenticated users
   - If missing: Run FIX_WORKER_LOGIN.sql

*/

-- ============================================================================
-- CREATE TEST WORKER
-- ============================================================================
-- If you have no workers, you MUST create one through the Employees UI:
-- 
-- 1. Login as admin (if you can)
-- 2. Go to "Employés" tab
-- 3. Click "+ Ajouter" (Add)
-- 4. Fill in:
--    Name: Test Worker
--    Email: testworker@example.com
--    Password: TestPassword123!
--    Username: testworker
-- 5. Click "Enregistrer" (Save)
-- 6. Should see: "Employé créé avec succès" (Employee created successfully)
-- 7. Then try to login with testworker@example.com / TestPassword123!

-- IMPORTANT: Creating via UI does TWO things:
--   a) Creates auth account in Supabase Auth (email + password)
--   b) Creates profile in database
-- 
-- Both are required for login to work!

-- ============================================================================
-- FIX EMAIL STORAGE (if emails are NULL)
-- ============================================================================
-- If Query 2 shows workers_without_email > 0:
-- 
-- Option A: Update existing worker with email (use exact email from Supabase Auth)
-- UPDATE profiles SET email = 'testworker@example.com' WHERE username = 'testworker';
--
-- Option B: Better - Delete and recreate via UI
-- DELETE FROM profiles WHERE username = 'testworker';
-- Then go to Employees UI and recreate the worker

-- ============================================================================
-- RLS POLICY FIX (if policies are missing)
-- ============================================================================
-- If Query 4 shows no policies or policies seem wrong:
-- Run the FIX_WORKER_LOGIN.sql script

-- ============================================================================
-- QUICK TEST FLOW
-- ============================================================================
-- 1. Run Query 1 - Do workers exist?
--    NO → Create test worker via Employees UI
--    YES → Continue
--
-- 2. Run Query 3 - Do workers have emails?
--    NO → Update with email or recreate
--    YES → Continue
--
-- 3. Try to login with email from Query 3 + its password
--    SUCCESS → Problem solved ✅
--    FAIL → Error means auth account missing (recreate worker)
--
-- 4. If still failing, run Query 4 and check RLS policies
--    Policies missing → Run FIX_WORKER_LOGIN.sql

-- ============================================================================
-- DEBUGGING CHECKLIST
-- ============================================================================
-- [  ] Ran Query 1 - saw workers
-- [  ] Ran Query 3 - saw emails
-- [  ] Tried login with exact email + password from database
-- [  ] Checked browser console for [LOGIN] messages
-- [  ] Checked if password is correct (case-sensitive!)
-- [  ] Checked if email is correct (case-sensitive!)
-- [  ] Checked Supabase Auth console for the user
-- [  ] Confirmed RLS policies exist (Query 4)
-- [  ] Verified email column exists (Query 5)

-- ============================================================================
-- IF STILL STUCK
-- ============================================================================
-- Please share:
-- 1. Results from Query 1 (list of workers)
-- 2. Results from Query 3 (workers with emails)
-- 3. Results from Query 4 (RLS policies)
-- 4. What email + password you're trying to login with
-- 5. Error message from browser console
-- 
-- With this info, we can pinpoint the exact issue!

