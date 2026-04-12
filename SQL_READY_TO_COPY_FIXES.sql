-- ============================================================================
-- READY-TO-COPY SQL FIXES FOR DELETE BUTTON ISSUES
-- ============================================================================
-- Copy each section and paste into Supabase SQL Editor
-- Run them one at a time
-- ============================================================================

-- ============================================================================
-- SECTION 1: VERIFY EVERYTHING IS SET UP CORRECTLY
-- ============================================================================

-- Check if RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('services', 'prestations', 'expenses', 'profiles', 'employee_payments', 'suppliers', 'purchases', 'reservations', 'reservation_workers')
ORDER BY tablename;

-- ============================================================================
-- SECTION 2: ENABLE DELETE POLICIES (if missing)
-- ============================================================================

-- For services table
DROP POLICY IF EXISTS "Enable delete for services" ON services;
CREATE POLICY "Enable delete for services"
ON services
FOR DELETE
USING (true);

-- For prestations table
DROP POLICY IF EXISTS "Enable delete for prestations" ON prestations;
CREATE POLICY "Enable delete for prestations"
ON prestations
FOR DELETE
USING (true);

-- For expenses table
DROP POLICY IF EXISTS "Enable delete for expenses" ON expenses;
CREATE POLICY "Enable delete for expenses"
ON expenses
FOR DELETE
USING (true);

-- For profiles table (for deleting workers)
DROP POLICY IF EXISTS "Enable delete own profile" ON profiles;
CREATE POLICY "Enable delete own profile"
ON profiles
FOR DELETE
USING (true);

-- For employee_payments table
DROP POLICY IF EXISTS "Enable delete for employee_payments" ON employee_payments;
CREATE POLICY "Enable delete for employee_payments"
ON employee_payments
FOR DELETE
USING (true);

-- For suppliers table
DROP POLICY IF EXISTS "Enable delete for suppliers" ON suppliers;
CREATE POLICY "Enable delete for suppliers"
ON suppliers
FOR DELETE
USING (true);

-- For purchases table
DROP POLICY IF EXISTS "Enable delete for purchases" ON purchases;
CREATE POLICY "Enable delete for purchases"
ON purchases
FOR DELETE
USING (true);

-- For reservations table (invoices)
DROP POLICY IF EXISTS "Enable delete for reservations" ON reservations;
CREATE POLICY "Enable delete for reservations"
ON reservations
FOR DELETE
USING (true);

-- For reservation_workers table
DROP POLICY IF EXISTS "Enable delete for reservation_workers" ON reservation_workers;
CREATE POLICY "Enable delete for reservation_workers"
ON reservation_workers
FOR DELETE
USING (true);

-- ============================================================================
-- SECTION 3: VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Get all current foreign keys
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM (
  SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
) fk
ORDER BY table_name;

-- ============================================================================
-- SECTION 4: CLEANUP ORPHANED RECORDS
-- ============================================================================

-- Find orphaned employee_payments (payments for deleted employees)
SELECT id, employee_id, amount, type
FROM employee_payments
WHERE employee_id NOT IN (SELECT id FROM profiles);

-- DELETE orphaned employee_payments
DELETE FROM employee_payments
WHERE employee_id NOT IN (SELECT id FROM profiles);

---

-- Find orphaned reservation_workers
SELECT rw.id, rw.worker_id, rw.reservation_id
FROM reservation_workers rw
LEFT JOIN profiles p ON rw.worker_id = p.id
LEFT JOIN reservations r ON rw.reservation_id = r.id
WHERE p.id IS NULL OR r.id IS NULL;

-- DELETE orphaned reservation_workers
DELETE FROM reservation_workers
WHERE worker_id NOT IN (SELECT id FROM profiles)
   OR reservation_id NOT IN (SELECT id FROM reservations);

---

-- Find orphaned purchases (purchases for deleted suppliers)
SELECT id, supplier_id, description
FROM purchases
WHERE supplier_id NOT IN (SELECT id FROM suppliers);

-- DELETE orphaned purchases
DELETE FROM purchases
WHERE supplier_id NOT IN (SELECT id FROM suppliers);

-- ============================================================================
-- SECTION 5: ENABLE CASCADE DELETE (Optional - Recommended)
-- ============================================================================

-- This allows deleting a parent automatically deletes children
-- WARNING: Make sure you want cascade behavior!

-- For employee_payments → profiles
ALTER TABLE employee_payments
DROP CONSTRAINT IF EXISTS employee_payments_employee_id_fkey;

ALTER TABLE employee_payments
ADD CONSTRAINT employee_payments_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES profiles(id) ON DELETE CASCADE;

---

-- For reservation_workers → profiles (worker)
ALTER TABLE reservation_workers
DROP CONSTRAINT IF EXISTS reservation_workers_worker_id_fkey;

ALTER TABLE reservation_workers
ADD CONSTRAINT reservation_workers_worker_id_fkey
FOREIGN KEY (worker_id) REFERENCES profiles(id) ON DELETE CASCADE;

---

-- For reservation_workers → reservations
ALTER TABLE reservation_workers
DROP CONSTRAINT IF EXISTS reservation_workers_reservation_id_fkey;

ALTER TABLE reservation_workers
ADD CONSTRAINT reservation_workers_reservation_id_fkey
FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;

---

-- For purchases → suppliers
ALTER TABLE purchases
DROP CONSTRAINT IF EXISTS purchases_supplier_id_fkey;

ALTER TABLE purchases
ADD CONSTRAINT purchases_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

-- ============================================================================
-- SECTION 6: TEST DELETES (Optional - Use with TEST DATA ONLY!)
-- ============================================================================

-- Get a test service to delete
SELECT id, name FROM services LIMIT 1;

-- Delete that service
-- DELETE FROM services WHERE id = 'copy-the-id-here';

---

-- Get a test expense to delete
SELECT id, name FROM expenses LIMIT 1;

-- Delete that expense
-- DELETE FROM expenses WHERE id = 'copy-the-id-here';

---

-- Get a test supplier to delete
SELECT id, full_name FROM suppliers LIMIT 1;

-- Delete that supplier (will cascade to purchases)
-- DELETE FROM suppliers WHERE id = 'copy-the-id-here';

-- ============================================================================
-- SECTION 7: VERIFY RESULTS
-- ============================================================================

-- Count records in each table
SELECT 'services' as table_name, COUNT(*) as count FROM services
UNION ALL
SELECT 'prestations', COUNT(*) FROM prestations
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'profiles (workers)', COUNT(*) FROM profiles WHERE role = 'worker'
UNION ALL
SELECT 'profiles (all)', COUNT(*) FROM profiles
UNION ALL
SELECT 'employee_payments', COUNT(*) FROM employee_payments
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchases
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'reservation_workers', COUNT(*) FROM reservation_workers
ORDER BY table_name;

-- ============================================================================
-- SECTION 8: FINAL VERIFICATION (Run after all fixes)
-- ============================================================================

-- Check no orphaned records remain
SELECT 'ORPHANED EMPLOYEE PAYMENTS' as check_type, COUNT(*) as count
FROM employee_payments
WHERE employee_id NOT IN (SELECT id FROM profiles)

UNION ALL

SELECT 'ORPHANED RESERVATION WORKERS', COUNT(*)
FROM reservation_workers
WHERE worker_id NOT IN (SELECT id FROM profiles)
   OR reservation_id NOT IN (SELECT id FROM reservations)

UNION ALL

SELECT 'ORPHANED PURCHASES', COUNT(*)
FROM purchases
WHERE supplier_id NOT IN (SELECT id FROM suppliers)

ORDER BY check_type;

-- If all results show 0 or no results, you're good to go!

-- ============================================================================
-- SECTION 9: QUICK REFERENCE - TABLE RELATIONSHIPS
-- ============================================================================

-- SERVICE/PRESTATION
-- services → (used by) reservations
-- prestations → (used by) reservations

-- EXPENSES
-- expenses → (standalone, no dependencies)

-- EMPLOYEES/WORKERS
-- profiles → (has) employee_payments (MUST delete first)
-- profiles → (has) reservation_workers (SHOULD delete first)

-- SUPPLIERS/PURCHASES
-- suppliers → (has) purchases (MUST delete first)
-- purchases → (standalone)

-- RESERVATIONS
-- reservations → (has) reservation_workers (MUST delete first)
-- reservations → (uses) prestations
-- reservations → (uses) services

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================

-- 1. RLS POLICIES: All DELETE policies have been enabled above
--    If still getting "violates row-level security policy" error,
--    verify the policy was created successfully

-- 2. CASCADING DELETES: The CASCADE commands above are optional
--    They make the database automatically delete children
--    If you don't run them, the code handles it manually (which is now fixed)

-- 3. ORPHANED RECORDS: Run Section 4 to clean up any orphaned records
--    This can happen if deletions failed previously

-- 4. TESTING: Use Section 6 to test with actual data
--    Just uncomment the DELETE line and replace the ID

-- 5. VERIFICATION: Run Section 7 and 8 to verify everything worked
--    All sections should show the counts you expect

-- ============================================================================
-- IF YOU STILL HAVE PROBLEMS
-- ============================================================================

-- Step 1: Find a real service ID to test with
SELECT id, name FROM services LIMIT 1;
-- Copy the ID from the result above

-- Step 2: Try deleting it (UNCOMMENT and REPLACE the id below with a real UUID):
-- DELETE FROM services WHERE id = '12345678-1234-1234-1234-123456789abc';

-- Step 3: Copy any error message and search in DELETE_ERRORS_DEBUG.md

-- Or run diagnostics on policies:
SELECT * FROM pg_policies WHERE tablename = 'services';
-- This shows all policies on services table - should see "Enable delete for services"

-- ============================================================================
-- END OF FIXES
-- ============================================================================
