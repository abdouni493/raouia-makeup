-- Fix created_at dates for employees
-- Set NULL created_at values to a default date (today)
-- This ensures all employees have a valid hire date

UPDATE profiles
SET created_at = CURRENT_DATE::text
WHERE created_at IS NULL OR created_at = '';

-- Alternative: If you want to use the actual profile creation date from Supabase metadata
-- This requires checking the internal created_at timestamp in Supabase
-- For now, we'll set all NULL values to today's date

COMMIT;
