-- SQL Migration: Add Status Column to employee_payments Table
-- Date: March 27, 2026
-- Purpose: Track payment status (paid/unpaid) for acomptes and absences

-- Step 1: Add status column to employee_payments table
ALTER TABLE employee_payments 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'unpaid';

-- Step 2: Add constraint to ensure valid status values
ALTER TABLE employee_payments
ADD CONSTRAINT check_status CHECK (status IN ('paid', 'unpaid'));

-- Step 3: Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_employee_payments_status ON employee_payments(status);

-- Step 4: Create index on employee_id and status for combined filtering
CREATE INDEX IF NOT EXISTS idx_employee_payments_emp_status ON employee_payments(employee_id, status);

-- Step 5: Update existing unpaid acomptes/absences to have correct status
UPDATE employee_payments 
SET status = 'unpaid'
WHERE type IN ('acompte', 'absence') 
  AND status IS NULL;

-- Step 6: Mark all salary payments as paid
UPDATE employee_payments 
SET status = 'paid'
WHERE type = 'salary';

-- Step 7: Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employee_payments' 
  AND column_name = 'status';

-- Step 8: View table structure
SELECT * FROM employee_payments LIMIT 1;

-- Step 9: Check status distribution
SELECT 
  type,
  status,
  COUNT(*) as count
FROM employee_payments
GROUP BY type, status
ORDER BY type, status;
