-- Add 'paid' column to employee_payments table for tracking paid deductions
-- This enables the feature where once a payment is validated, those acomptes/absences won't be deducted again

ALTER TABLE employee_payments 
ADD COLUMN paid BOOLEAN DEFAULT FALSE;

-- Create index on paid column for faster queries
CREATE INDEX idx_employee_payments_paid ON employee_payments(paid);

-- Optional: Update existing records
-- All existing records are considered unpaid (already paid out historically)
UPDATE employee_payments 
SET paid = FALSE 
WHERE type IN ('acompte', 'absence');

-- Verify the column was added successfully
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employee_payments' AND column_name = 'paid';
