-- Add missing columns to existing profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'worker',
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'month',
ADD COLUMN IF NOT EXISTS percentage numeric,
ADD COLUMN IF NOT EXISTS daily_rate numeric,
ADD COLUMN IF NOT EXISTS monthly_rate numeric;

-- Add constraint to ensure valid payment types
ALTER TABLE public.profiles
ADD CONSTRAINT check_payment_type CHECK (payment_type IN ('month', 'days', 'percentage'));

-- Update existing records with default values if they're null
UPDATE public.profiles SET role = 'worker' WHERE role IS NULL;
UPDATE public.profiles SET payment_type = 'month' WHERE payment_type IS NULL;

-- Verify the changes
SELECT id, username, full_name, role, payment_type, percentage, daily_rate, monthly_rate 
FROM public.profiles 
LIMIT 5;
