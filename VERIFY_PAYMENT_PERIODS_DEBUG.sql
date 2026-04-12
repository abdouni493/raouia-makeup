-- ============================================================
-- VERIFY PAYMENT RECORDING AND PERIODS
-- ============================================================

-- Check all payments for a specific worker
-- Replace 'worker-uuid' with actual worker ID from profiles table
SELECT 
  id,
  employee_id,
  type,
  amount,
  description,
  date,
  status,
  created_at
FROM employee_payments
WHERE employee_id = (SELECT id FROM profiles WHERE full_name = 'journalier2' LIMIT 1)
ORDER BY created_at DESC;

-- ============================================================
-- VERIFY DAILY PAYMENT PERIODS ARE RECORDED
-- ============================================================

-- Check all payment periods for a specific worker
SELECT 
  id,
  worker_id,
  start_date,
  end_date,
  total_days,
  daily_rate,
  total_amount,
  status,
  payment_date,
  created_at
FROM worker_daily_payment_periods
WHERE worker_id = (SELECT id FROM profiles WHERE full_name = 'journalier2' LIMIT 1)
ORDER BY created_at DESC;

-- ============================================================
-- CHECK IF PERIODS ARE BEING CREATED WITH SALARY PAYMENTS
-- ============================================================

-- Verify that when a salary payment is made, a period is also created
SELECT 
  ep.id as payment_id,
  ep.description as payment_description,
  ep.date as payment_date,
  ep.status as payment_status,
  wdpp.id as period_id,
  wdpp.start_date,
  wdpp.end_date,
  wdpp.total_days,
  wdpp.status as period_status
FROM employee_payments ep
LEFT JOIN worker_daily_payment_periods wdpp 
  ON ep.employee_id = wdpp.worker_id 
  AND ep.date = wdpp.payment_date
WHERE ep.type = 'salary'
  AND ep.employee_id = (SELECT id FROM profiles WHERE full_name = 'journalier2' LIMIT 1)
ORDER BY ep.date DESC;

-- ============================================================
-- TROUBLESHOOTING: FIND SALARY PAYMENTS WITHOUT PERIODS
-- ============================================================

-- If a salary payment was made but no period was created,
-- it will show up here with NULL period_id values
SELECT 
  ep.id as payment_id,
  ep.description,
  ep.date,
  ep.amount,
  wdpp.id as period_id,
  wdpp.start_date,
  wdpp.end_date
FROM employee_payments ep
LEFT JOIN worker_daily_payment_periods wdpp 
  ON ep.employee_id = wdpp.worker_id
WHERE ep.type = 'salary'
  AND ep.employee_id = (SELECT id FROM profiles WHERE full_name = 'journalier2' LIMIT 1)
  AND wdpp.id IS NULL;

-- ============================================================
-- VERIFY UNPAID DAYS CALCULATION
-- ============================================================

-- See the current unpaid amount for the worker
SELECT 
  p.full_name,
  p.hire_date,
  p.daily_rate,
  MAX(COALESCE(wdpp.end_date, p.hire_date::date)) as last_paid_or_hire_date,
  (CURRENT_DATE - COALESCE(MAX(wdpp.end_date), p.hire_date)::date) as unpaid_days,
  (CURRENT_DATE - COALESCE(MAX(wdpp.end_date), p.hire_date)::date) * p.daily_rate as unpaid_amount
FROM profiles p
LEFT JOIN worker_daily_payment_periods wdpp 
  ON p.id = wdpp.worker_id AND wdpp.status = 'paid'
WHERE p.full_name = 'journalier2'
GROUP BY p.id, p.full_name, p.hire_date, p.daily_rate;

-- ============================================================
-- CHECK DATA CONSISTENCY
-- ============================================================

-- Verify all salary payments have corresponding periods recorded
SELECT 
  COUNT(*) as total_salary_payments,
  COUNT(CASE WHEN wdpp.id IS NOT NULL THEN 1 END) as payments_with_periods,
  COUNT(CASE WHEN wdpp.id IS NULL THEN 1 END) as payments_without_periods
FROM employee_payments ep
LEFT JOIN worker_daily_payment_periods wdpp 
  ON ep.employee_id = wdpp.worker_id AND ep.date = wdpp.payment_date
WHERE ep.type = 'salary'
  AND ep.employee_id = (SELECT id FROM profiles WHERE full_name = 'journalier2' LIMIT 1);
