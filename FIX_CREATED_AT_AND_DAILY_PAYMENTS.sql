-- ============================================================
-- FIX 1: Add hire_date column to profiles (separate from created_at)
-- ============================================================

-- Add hire_date column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hire_date date DEFAULT NULL;

-- Migrate existing created_at values to hire_date (extract just the date part)
UPDATE public.profiles
SET hire_date = (created_at AT TIME ZONE 'Africa/Algiers')::date
WHERE hire_date IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_hire_date ON public.profiles(hire_date);

-- ============================================================
-- FIX 2: Create table for tracking daily payment periods
-- ============================================================

-- This table tracks payment periods for daily workers
-- Each row represents a payment for a specific period (e.g., 10/03/2026 to 20/03/2026)
CREATE TABLE IF NOT EXISTS public.worker_daily_payment_periods (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  worker_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  daily_rate numeric NOT NULL,
  total_amount numeric NOT NULL,
  payment_date date,
  status text DEFAULT 'unpaid' CHECK (status = ANY (ARRAY['paid', 'unpaid'])),
  description text,
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone,
  CONSTRAINT worker_daily_payment_periods_pkey PRIMARY KEY (id),
  CONSTRAINT worker_daily_payment_periods_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_daily_periods_worker_id ON public.worker_daily_payment_periods(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_daily_periods_status ON public.worker_daily_payment_periods(status);
CREATE INDEX IF NOT EXISTS idx_worker_daily_periods_date_range ON public.worker_daily_payment_periods(start_date, end_date);

-- ============================================================
-- FIX 3: Modify employee_payments to track period-based payments
-- ============================================================

-- Add period reference to employee_payments if needed
ALTER TABLE public.employee_payments
ADD COLUMN IF NOT EXISTS period_id uuid DEFAULT NULL;

-- Add foreign key for period reference
ALTER TABLE public.employee_payments
ADD CONSTRAINT fk_employee_payments_period_id FOREIGN KEY (period_id) REFERENCES public.worker_daily_payment_periods(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_employee_payments_period_id ON public.employee_payments(period_id);

-- ============================================================
-- FIX 4: View to show daily payment summary for workers
-- ============================================================

-- This view makes it easy to query daily payment periods
CREATE OR REPLACE VIEW public.vw_worker_daily_payment_summary AS
SELECT
  wdpp.id,
  wdpp.worker_id,
  p.full_name,
  p.daily_rate,
  wdpp.start_date,
  wdpp.end_date,
  wdpp.total_days,
  wdpp.daily_rate as rate_per_day,
  wdpp.total_amount,
  wdpp.payment_date,
  wdpp.status,
  wdpp.created_at,
  wdpp.paid_at,
  CASE 
    WHEN wdpp.status = 'paid' THEN 'Payé'
    ELSE 'Non payé'
  END as status_label
FROM public.worker_daily_payment_periods wdpp
JOIN public.profiles p ON wdpp.worker_id = p.id
ORDER BY wdpp.created_at DESC;

-- ============================================================
-- FIX 5: Enable RLS on new tables if needed
-- ============================================================

ALTER TABLE public.worker_daily_payment_periods ENABLE ROW LEVEL SECURITY;

-- Admin can see all periods
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

COMMIT;
