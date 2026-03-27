-- Add missing columns to existing reservations table
-- Run this in Supabase SQL Editor

ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS worker_id uuid,
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS finalized_at timestamp with time zone;

-- Add constraint to ensure valid status values (if it doesn't exist)
DO $$ 
BEGIN 
  ALTER TABLE public.reservations
  ADD CONSTRAINT check_reservation_status CHECK (status IN ('pending', 'completed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN 
  NULL;
END $$;

-- Note: Foreign key constraints reservations_worker_id_fkey and reservations_created_by_fkey 
-- already exist in the database, so they are not recreated here.

-- Update existing records with default values if they're null
UPDATE public.reservations SET status = 'pending' WHERE status IS NULL;

-- Verify the changes
SELECT id, client_name, date, status, worker_id, created_by, finalized_at 
FROM public.reservations 
LIMIT 5;
