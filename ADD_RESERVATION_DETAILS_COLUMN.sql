-- Add reservation_details column to employee_payments table
-- This column stores JSON data about which reservations were included in the payment

ALTER TABLE employee_payments
ADD COLUMN IF NOT EXISTS reservation_details JSONB DEFAULT NULL;

-- Create index for faster queries (optional)
CREATE INDEX IF NOT EXISTS idx_employee_payments_reservation_details 
ON employee_payments USING GIN (reservation_details);

-- Update RLS policies if needed (run if you have existing policies)
-- ALTER POLICY "Employee can read own payments" ON employee_payments 
-- USING (auth.uid() = employee_id);
