-- ============================================================================
-- FIX DELETE BUTTONS - Database Verification and Cleanup
-- ============================================================================
-- This SQL script verifies foreign key relationships and enables proper cascading
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. VERIFY TABLE STRUCTURES
-- ============================================================================

-- Check prestations table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'prestations'
ORDER BY ordinal_position;

-- Check services table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;

-- Check expenses table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;

-- Check profiles table (employees)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check employee_payments table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'employee_payments'
ORDER BY ordinal_position;

-- Check suppliers table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'suppliers'
ORDER BY ordinal_position;

-- Check purchases table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'purchases'
ORDER BY ordinal_position;

-- Check reservations table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'reservations'
ORDER BY ordinal_position;

-- Check reservation_workers table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'reservation_workers'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. CHECK FOREIGN KEY CONSTRAINTS
-- ============================================================================

SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu USING (constraint_name, table_schema)
WHERE constraint_type = 'FOREIGN KEY'
ORDER BY table_name, constraint_name;

-- ============================================================================
-- 3. VERIFY DATA INTEGRITY
-- ============================================================================

-- Check for orphaned employee_payments (payments for deleted employees)
SELECT ep.id, ep.employee_id, ep.type, ep.amount
FROM employee_payments ep
LEFT JOIN profiles p ON ep.employee_id = p.id
WHERE p.id IS NULL;

-- Check for orphaned reservation_workers (workers for deleted reservations)
SELECT rw.id, rw.worker_id, rw.reservation_id
FROM reservation_workers rw
LEFT JOIN reservations r ON rw.reservation_id = r.id
LEFT JOIN profiles p ON rw.worker_id = p.id
WHERE r.id IS NULL OR p.id IS NULL;

-- Check for orphaned purchases (purchases for deleted suppliers)
SELECT p.id, p.supplier_id, p.description
FROM purchases p
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE s.id IS NULL;

-- Check for orphaned reservations (services for deleted prestations)
SELECT r.id, r.prestation_id
FROM reservations r
LEFT JOIN prestations pr ON r.prestation_id = pr.id
WHERE pr.id IS NULL;

-- ============================================================================
-- 4. CLEANUP ORPHANED RECORDS (if needed)
-- ============================================================================

-- Delete orphaned employee_payments
DELETE FROM employee_payments ep
WHERE ep.employee_id NOT IN (SELECT id FROM profiles);

-- Delete orphaned reservation_workers
DELETE FROM reservation_workers rw
WHERE rw.worker_id NOT IN (SELECT id FROM profiles)
   OR rw.reservation_id NOT IN (SELECT id FROM reservations);

-- Delete orphaned purchases
DELETE FROM purchases p
WHERE p.supplier_id NOT IN (SELECT id FROM suppliers);

-- Delete orphaned reservations (optional - be careful!)
-- DELETE FROM reservations r
-- WHERE r.prestation_id NOT IN (SELECT id FROM prestations);

-- ============================================================================
-- 5. ADD CASCADING DELETE CONSTRAINTS (Optional but Recommended)
-- ============================================================================

-- Note: These commands will fail if constraints already exist
-- First, let's check what exists:

-- For employee_payments -> profiles
-- ALTER TABLE employee_payments
-- DROP CONSTRAINT IF EXISTS employee_payments_employee_id_fkey;
-- 
-- ALTER TABLE employee_payments
-- ADD CONSTRAINT employee_payments_employee_id_fkey 
-- FOREIGN KEY (employee_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- For reservation_workers -> profiles (worker)
-- ALTER TABLE reservation_workers
-- DROP CONSTRAINT IF EXISTS reservation_workers_worker_id_fkey;
-- 
-- ALTER TABLE reservation_workers
-- ADD CONSTRAINT reservation_workers_worker_id_fkey 
-- FOREIGN KEY (worker_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- For reservation_workers -> reservations
-- ALTER TABLE reservation_workers
-- DROP CONSTRAINT IF EXISTS reservation_workers_reservation_id_fkey;
-- 
-- ALTER TABLE reservation_workers
-- ADD CONSTRAINT reservation_workers_reservation_id_fkey 
-- FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;

-- For purchases -> suppliers
-- ALTER TABLE purchases
-- DROP CONSTRAINT IF EXISTS purchases_supplier_id_fkey;
-- 
-- ALTER TABLE purchases
-- ADD CONSTRAINT purchases_supplier_id_fkey 
-- FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

-- For reservations -> prestations
-- ALTER TABLE reservations
-- DROP CONSTRAINT IF EXISTS reservations_prestation_id_fkey;
-- 
-- ALTER TABLE reservations
-- ADD CONSTRAINT reservations_prestation_id_fkey 
-- FOREIGN KEY (prestation_id) REFERENCES prestations(id) ON DELETE CASCADE;

-- ============================================================================
-- 6. VERIFY DELETION WORKS
-- ============================================================================

-- Test delete prestation (will cascade to reservations, then to reservation_workers)
-- DELETE FROM prestations WHERE id = 'test-id-here';

-- Test delete service
-- DELETE FROM services WHERE id = 'test-id-here';

-- Test delete expense
-- DELETE FROM expenses WHERE id = 'test-id-here';

-- Test delete employee (will cascade to employee_payments and reservation_workers)
-- DELETE FROM profiles WHERE id = 'test-id-here' AND role = 'worker';

-- Test delete supplier (will cascade to purchases)
-- DELETE FROM suppliers WHERE id = 'test-id-here';

-- Test delete purchase
-- DELETE FROM purchases WHERE id = 'test-id-here';

-- Test delete reservation (will cascade to reservation_workers)
-- DELETE FROM reservations WHERE id = 'test-id-here';

-- ============================================================================
-- 7. COUNT RECORDS BY TYPE (for verification)
-- ============================================================================

SELECT 'prestations' as table_name, COUNT(*) as count FROM prestations
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'profiles (workers)', COUNT(*) FROM profiles WHERE role = 'worker'
UNION ALL
SELECT 'employee_payments', COUNT(*) FROM employee_payments
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchases
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'reservation_workers', COUNT(*) FROM reservation_workers;

-- ============================================================================
-- 8. ENABLE RLS POLICIES FOR DELETE
-- ============================================================================

-- Make sure RLS policies allow DELETE operations
-- Check existing policies:
SELECT * FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Example policy for deleting own records:
-- ALTER POLICY "Users can delete own records" ON prestations USING (true);

-- ============================================================================
-- 9. FINAL VERIFICATION
-- ============================================================================

-- Log what was done
SELECT 'Cleanup completed. Verify deletion logs in application console.' as status;
