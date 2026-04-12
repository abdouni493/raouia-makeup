-- ============================================================
-- VERIFY worker_daily_payment_periods TABLE EXISTS
-- ============================================================

-- Check if table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'worker_daily_payment_periods'
ORDER BY ordinal_position;

-- Expected output should show columns:
-- worker_id, uuid
-- start_date, date
-- end_date, date
-- total_days, integer
-- daily_rate, numeric
-- total_amount, numeric
-- payment_date, date
-- status, text (with values 'paid' or 'unpaid')
-- created_at, timestamp with time zone
-- paid_at, timestamp with time zone

-- ============================================================
-- ENSURE RLS POLICIES ARE PROPERLY SET UP
-- ============================================================

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Admin can view all daily payment periods" ON public.worker_daily_payment_periods;
DROP POLICY IF EXISTS "Workers can view own daily payment periods" ON public.worker_daily_payment_periods;
DROP POLICY IF EXISTS "Admin can insert daily payment periods" ON public.worker_daily_payment_periods;
DROP POLICY IF EXISTS "Admin can update daily payment periods" ON public.worker_daily_payment_periods;
DROP POLICY IF EXISTS "Admin can delete daily payment periods" ON public.worker_daily_payment_periods;

-- Admin can view all daily payment periods
CREATE POLICY "Admin can view all daily payment periods" 
ON public.worker_daily_payment_periods 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

-- Workers can only see their own periods
CREATE POLICY "Workers can view own daily payment periods" 
ON public.worker_daily_payment_periods 
FOR SELECT 
USING (worker_id = auth.uid());

-- Admin can insert daily payment periods
CREATE POLICY "Admin can insert daily payment periods" 
ON public.worker_daily_payment_periods 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admin can update daily payment periods
CREATE POLICY "Admin can update daily payment periods" 
ON public.worker_daily_payment_periods 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Admin can delete daily payment periods
CREATE POLICY "Admin can delete daily payment periods" 
ON public.worker_daily_payment_periods 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- VERIFY DATA INTEGRITY
-- ============================================================

-- Check for any gaps in payment periods for workers
SELECT 
  p.id,
  p.full_name,
  p.daily_rate,
  p.hire_date,
  MAX(wdpp.end_date) as last_paid_date,
  (CURRENT_DATE - COALESCE(MAX(wdpp.end_date), p.hire_date)::date) as days_since_last_payment
FROM profiles p
LEFT JOIN worker_daily_payment_periods wdpp 
  ON p.id = wdpp.worker_id AND wdpp.status = 'paid'
WHERE p.payment_type = 'days'
GROUP BY p.id, p.full_name, p.daily_rate, p.hire_date
ORDER BY p.full_name;

-- ============================================================
-- CALCULATE UNPAID DAYS FOR ALL DAILY WORKERS
-- ============================================================

-- This query shows how many days remain unpaid for each daily worker
SELECT 
  p.id,
  p.full_name,
  p.daily_rate,
  p.hire_date,
  MAX(COALESCE(wdpp.end_date, p.hire_date::date)) as last_paid_or_hire_date,
  (CURRENT_DATE - COALESCE(MAX(wdpp.end_date), p.hire_date)::date) as unpaid_days,
  (CURRENT_DATE - COALESCE(MAX(wdpp.end_date), p.hire_date)::date) * p.daily_rate as unpaid_amount
FROM profiles p
LEFT JOIN worker_daily_payment_periods wdpp 
  ON p.id = wdpp.worker_id AND wdpp.status = 'paid'
WHERE p.payment_type = 'days'
GROUP BY p.id, p.full_name, p.daily_rate, p.hire_date
HAVING (CURRENT_DATE - COALESCE(MAX(wdpp.end_date), p.hire_date)::date) > 0
ORDER BY unpaid_amount DESC;

-- ============================================================
-- VIEW ALL PAYMENT PERIODS FOR A SPECIFIC WORKER
-- ============================================================

-- EXAMPLE QUERY - Replace 'worker-uuid' with actual worker UUID
-- Run this query in your SQL editor after copying an actual worker ID:
/*
SELECT 
  start_date,
  
  end_date,
  total_days,
  daily_rate,
  total_amount,
  status,
  payment_date,
  created_at
FROM worker_daily_payment_periods
WHERE worker_id = 'your-actual-worker-uuid-here'
ORDER BY end_date DESC;
*/

-- ============================================================
-- MARK PERIOD AS UNPAID (if needed for corrections)
-- ============================================================

-- If a payment needs to be reversed, run this:
-- UPDATE worker_daily_payment_periods
-- SET status = 'unpaid'
-- WHERE id = 'period-uuid';

-- ============================================================
-- CREATE VIEW FOR REPORTING
-- ============================================================

CREATE OR REPLACE VIEW vw_worker_payment_summary AS
SELECT 
  p.id,
  p.full_name,
  p.daily_rate,
  p.hire_date,
  COUNT(DISTINCT wdpp.id) FILTER (WHERE wdpp.status = 'paid') as paid_periods,
  COALESCE(SUM(wdpp.total_amount) FILTER (WHERE wdpp.status = 'paid'), 0) as total_paid,
  COALESCE(SUM(wdpp.total_days) FILTER (WHERE wdpp.status = 'paid'), 0) as total_paid_days,
  MAX(COALESCE(wdpp.end_date, p.hire_date::date)) as last_paid_date,
  (CURRENT_DATE - COALESCE(MAX(wdpp.end_date), p.hire_date)::date) as unpaid_days,
  (CURRENT_DATE - COALESCE(MAX(wdpp.end_date), p.hire_date)::date) * p.daily_rate as unpaid_amount
FROM profiles p
LEFT JOIN worker_daily_payment_periods wdpp ON p.id = wdpp.worker_id
WHERE p.payment_type = 'days'
GROUP BY p.id, p.full_name, p.daily_rate, p.hire_date
ORDER BY p.full_name;

-- ============================================================
-- USAGE EXAMPLE
-- ============================================================

-- View the summary for all daily workers
-- SELECT * FROM vw_worker_payment_summary;

-- To get a specific worker's unpaid amount:
-- SELECT 
--   full_name,
--   daily_rate,
--   unpaid_days,
--   unpaid_amount
-- FROM vw_worker_payment_summary
-- WHERE full_name = 'Journalier';
