-- ============================================================
-- FIX RLS POLICIES FOR worker_daily_payment_periods TABLE
-- ============================================================

-- First, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'worker_daily_payment_periods';

-- ============================================================
-- OPTION 1: DISABLE RLS (Simplest - if you trust your auth)
-- ============================================================

ALTER TABLE public.worker_daily_payment_periods DISABLE ROW LEVEL SECURITY;

-- If you want to re-enable it later, use:
-- ALTER TABLE public.worker_daily_payment_periods ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- OPTION 2: FIX RLS POLICIES (If you want RLS enabled)
-- ============================================================

-- First, drop all existing policies
DROP POLICY IF EXISTS "Admin can view all daily payment periods" ON public.worker_daily_payment_periods;
DROP POLICY IF EXISTS "Workers can view own daily payment periods" ON public.worker_daily_payment_periods;
DROP POLICY IF EXISTS "Admin can insert daily payment periods" ON public.worker_daily_payment_periods;
DROP POLICY IF EXISTS "Admin can update daily payment periods" ON public.worker_daily_payment_periods;
DROP POLICY IF EXISTS "Admin can delete daily payment periods" ON public.worker_daily_payment_periods;

-- Make sure RLS is enabled
ALTER TABLE public.worker_daily_payment_periods ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (admin role users) to perform all operations
CREATE POLICY "Allow authenticated users all operations on payment periods"
ON public.worker_daily_payment_periods
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ALTERNATIVELY: More restrictive policies

-- Drop the above if you want specific policies
-- DROP POLICY IF EXISTS "Allow authenticated users all operations on payment periods" ON public.worker_daily_payment_periods;

-- -- Admin can view all periods
-- CREATE POLICY "Admin view all payment periods"
-- ON public.worker_daily_payment_periods
-- FOR SELECT
-- USING (true);

-- -- Admin can insert
-- CREATE POLICY "Admin insert payment periods"
-- ON public.worker_daily_payment_periods
-- FOR INSERT
-- WITH CHECK (true);

-- -- Admin can update
-- CREATE POLICY "Admin update payment periods"
-- ON public.worker_daily_payment_periods
-- FOR UPDATE
-- USING (true)
-- WITH CHECK (true);

-- -- Admin can delete
-- CREATE POLICY "Admin delete payment periods"
-- ON public.worker_daily_payment_periods
-- FOR DELETE
-- USING (true);

-- ============================================================
-- VERIFY THE FIX
-- ============================================================

-- Check that RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'worker_daily_payment_periods';

-- Check policies (should be empty if RLS disabled, or show your policies if enabled)
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'worker_daily_payment_periods';

-- ============================================================
-- TEST: Try inserting a test record
-- ============================================================

-- Get a worker ID first
SELECT id, full_name FROM profiles WHERE payment_type = 'days' LIMIT 1;

-- If you get a result, replace 'worker-id-here' with the actual ID and run:
/*
INSERT INTO worker_daily_payment_periods 
(worker_id, start_date, end_date, total_days, daily_rate, total_amount, payment_date, status, description)
VALUES (
  'worker-id-here',
  CURRENT_DATE - 10,
  CURRENT_DATE - 5,
  5,
  2000,
  10000,
  CURRENT_DATE,
  'paid',
  'Test period'
);
*/

-- Verify it was inserted:
-- SELECT * FROM worker_daily_payment_periods ORDER BY created_at DESC LIMIT 1;
