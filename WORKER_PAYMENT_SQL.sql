-- SQL CODE TO SAVE WORKER PAYMENT AMOUNTS
-- Salon de Beauté Database Schema Update

-- ============================================
-- 1. ADD COLUMNS TO PROFILES TABLE
-- ============================================
-- This adds the daily_rate and monthly_rate columns to store payment amounts

ALTER TABLE profiles ADD COLUMN daily_rate DECIMAL(10, 2) DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN monthly_rate DECIMAL(10, 2) DEFAULT NULL;

-- Alternative if columns might already exist:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10, 2) DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_rate DECIMAL(10, 2) DEFAULT NULL;


-- ============================================
-- 2. UPDATE EXISTING EMPLOYEES WITH PAYMENT AMOUNTS
-- ============================================

-- Update a specific employee with daily rate
UPDATE profiles 
SET daily_rate = 3000.00 
WHERE id = 'employee-id-here' AND payment_type = 'days';

-- Update a specific employee with monthly rate
UPDATE profiles 
SET monthly_rate = 60000.00 
WHERE id = 'employee-id-here' AND payment_type = 'month';


-- ============================================
-- 3. FULL INSERT STATEMENT FOR NEW WORKER
-- ============================================

INSERT INTO profiles (
  id,
  username,
  full_name,
  role,
  phone,
  address,
  payment_type,
  percentage,
  daily_rate,
  monthly_rate,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',    -- UUID
  'john_doe',                                  -- username
  'John Doe',                                  -- full_name
  'worker',                                    -- role
  '05551234567',                              -- phone
  '123 Rue de la Paix, Alger',               -- address
  'days',                                      -- payment_type (days, month, or percentage)
  NULL,                                        -- percentage (NULL if not percentage type)
  3000.00,                                     -- daily_rate (for 'days' type)
  NULL,                                        -- monthly_rate (NULL if not monthly type)
  NOW()                                        -- created_at
);


-- ============================================
-- 4. EXAMPLE: INSERT MONTHLY WORKER
-- ============================================

INSERT INTO profiles (
  id,
  username,
  full_name,
  role,
  phone,
  address,
  payment_type,
  percentage,
  daily_rate,
  monthly_rate,
  created_at
) VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  'fatima_khalil',
  'Fatima Khalil',
  'worker',
  '05559876543',
  '456 Avenue Habib Bourguiba, Alger',
  'month',
  NULL,
  NULL,
  60000.00,                                    -- monthly_rate
  NOW()
);


-- ============================================
-- 5. EXAMPLE: INSERT PERCENTAGE-BASED WORKER
-- ============================================

INSERT INTO profiles (
  id,
  username,
  full_name,
  role,
  phone,
  address,
  payment_type,
  percentage,
  daily_rate,
  monthly_rate,
  created_at
) VALUES (
  '770e8400-e29b-41d4-a716-446655440002',
  'aisha_beauty',
  'Aisha Beauty Specialist',
  'worker',
  '05556789012',
  '789 Boulevard de la République, Alger',
  'percentage',
  30.00,                                       -- percentage: 30%
  NULL,
  NULL,
  NOW()
);


-- ============================================
-- 6. QUERY TO VIEW ALL WORKERS WITH PAYMENT INFO
-- ============================================

SELECT 
  id,
  username,
  full_name,
  phone,
  payment_type,
  percentage,
  daily_rate,
  monthly_rate,
  created_at
FROM profiles
WHERE role = 'worker'
ORDER BY created_at DESC;


-- ============================================
-- 7. QUERY TO CALCULATE TOTAL SALARIES (EXAMPLE)
-- ============================================

-- Total monthly salary expenses
SELECT 
  SUM(monthly_rate) as total_monthly_salary
FROM profiles
WHERE payment_type = 'month' AND monthly_rate IS NOT NULL;

-- Total daily rate cost for a specific date range
-- (This would be used with a work_hours or attendance table)
SELECT 
  username,
  full_name,
  daily_rate,
  COUNT(*) as days_worked,
  (daily_rate * COUNT(*)) as total_earned
FROM profiles
WHERE payment_type = 'days'
GROUP BY id, username, full_name, daily_rate;


-- ============================================
-- 8. CREATE WORKER_SALARIES TABLE (Optional)
-- ============================================
-- For tracking salary history and payments

CREATE TABLE IF NOT EXISTS worker_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL,
  salary_amount DECIMAL(10, 2) NOT NULL,
  salary_type VARCHAR(50) NOT NULL, -- 'daily', 'monthly', 'percentage'
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (worker_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_worker_salaries_worker_id 
ON worker_salaries(worker_id);


-- ============================================
-- 9. ENABLE ROW LEVEL SECURITY (OPTIONAL)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for workers to see only their own data
CREATE POLICY "Workers can view own profile"
ON profiles FOR SELECT
USING (auth.uid()::text = id OR auth.jwt() -> 'role' = '"admin"');

-- Policy for admins to manage all profiles
CREATE POLICY "Admins can manage all profiles"
ON profiles FOR ALL
USING (auth.jwt() -> 'role' = '"admin"');


-- ============================================
-- 10. MIGRATION: ADD COLUMNS IF NOT EXISTS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='daily_rate'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_rate DECIMAL(10, 2) DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='monthly_rate'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_rate DECIMAL(10, 2) DEFAULT NULL;
  END IF;
END $$;


-- ============================================
-- DATABASE SCHEMA SUMMARY
-- ============================================

/*
PROFILES TABLE STRUCTURE:
========================

Column Name       | Type         | Notes
-----------------|-------------|----------------------------------------
id               | UUID         | Primary Key
username         | TEXT         | Unique username
full_name        | TEXT         | Employee full name
role             | VARCHAR(50)  | 'admin' or 'worker'
phone            | TEXT         | Phone number
address          | TEXT         | Address
avatar_url       | TEXT         | Optional profile picture
payment_type     | VARCHAR(50)  | 'days', 'month', or 'percentage'
percentage       | DECIMAL      | Commission percentage (if percentage type)
daily_rate       | DECIMAL(10,2)| Daily salary in DA (if daily type)
monthly_rate     | DECIMAL(10,2)| Monthly salary in DA (if monthly type)
email            | TEXT         | Email address
password_hash    | TEXT         | Hashed password
created_at       | TIMESTAMP    | Account creation date
updated_at       | TIMESTAMP    | Last update date

PAYMENT TYPE LOGIC:
===================
- If payment_type = 'days' → use daily_rate (other fields NULL)
- If payment_type = 'month' → use monthly_rate (other fields NULL)  
- If payment_type = 'percentage' → use percentage (rates NULL)
*/
