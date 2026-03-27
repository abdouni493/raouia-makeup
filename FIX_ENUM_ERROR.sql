-- ============================================================================
-- FIX ENUM ERROR - Resolve 'completed' status value issue
-- ============================================================================

-- Drop the incorrect partial index
DROP INDEX IF EXISTS idx_reservations_active;

-- Recreate it with the correct status value
CREATE INDEX IF NOT EXISTS idx_reservations_active 
  ON public.reservations(date DESC) 
  WHERE status != 'finalized' AND status != 'cancelled';

-- Verify it was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_reservations_active';

-- Done! Now you can continue with the other STEPS
