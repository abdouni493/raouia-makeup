-- ===============================================
-- REMOVE DELETE RESTRICTIONS - RLS POLICIES
-- ===============================================
-- This script removes all RLS policy restrictions
-- on DELETE operations for ALL tables

-- WARNING: This will allow ALL authenticated users to delete data!
-- Use with caution and consider re-adding restrictions later.

-- ===============================================
-- DROP ALL RESTRICTIVE RLS POLICIES
-- ===============================================

-- Purchases - Remove delete restrictions
DROP POLICY IF EXISTS "Admin manage purchases" ON purchases;

-- Suppliers - Remove delete restrictions
DROP POLICY IF EXISTS "Admin manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admin manage inventory" ON suppliers;

-- Expenses - Remove delete restrictions
DROP POLICY IF EXISTS "Admin manage expenses" ON expenses;

-- Prestations - Remove delete restrictions
DROP POLICY IF EXISTS "Admin manage prestations" ON prestations;

-- Services - Remove delete restrictions
DROP POLICY IF EXISTS "Admin manage services" ON services;

-- Profiles - Remove delete restrictions
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin manage all profiles" ON profiles;

-- Reservations - Remove delete restrictions
DROP POLICY IF EXISTS "Admins manage all reservations" ON reservations;

-- Employee Payments - Remove delete restrictions
DROP POLICY IF EXISTS "Admin manage payments" ON employee_payments;

-- Reservation Workers - Remove delete restrictions
DROP POLICY IF EXISTS "Admin manage reservation workers" ON reservation_workers;

-- Reservation Services - Remove delete restrictions
DROP POLICY IF EXISTS "Admin manage reservation services" ON reservation_services;

-- Worker Daily Payment Periods - Remove delete restrictions
DROP POLICY IF EXISTS "Admin manage worker daily payments" ON worker_daily_payment_periods;

-- Worker Reservation Payments - Remove delete restrictions
DROP POLICY IF EXISTS "Admin manage worker reservation payments" ON worker_reservation_payments;

-- ===============================================
-- CREATE PERMISSIVE DELETE POLICIES
-- ===============================================
-- Now allow authenticated users to delete from all tables

-- Purchases
CREATE POLICY "Allow authenticated delete purchases"
  ON purchases FOR DELETE USING (auth.role() = 'authenticated');

-- Suppliers
CREATE POLICY "Allow authenticated delete suppliers"
  ON suppliers FOR DELETE USING (auth.role() = 'authenticated');

-- Expenses
CREATE POLICY "Allow authenticated delete expenses"
  ON expenses FOR DELETE USING (auth.role() = 'authenticated');

-- Prestations
CREATE POLICY "Allow authenticated delete prestations"
  ON prestations FOR DELETE USING (auth.role() = 'authenticated');

-- Services
CREATE POLICY "Allow authenticated delete services"
  ON services FOR DELETE USING (auth.role() = 'authenticated');

-- Profiles
CREATE POLICY "Allow authenticated delete profiles"
  ON profiles FOR DELETE USING (auth.role() = 'authenticated');

-- Reservations
CREATE POLICY "Allow authenticated delete reservations"
  ON reservations FOR DELETE USING (auth.role() = 'authenticated');

-- Employee Payments
CREATE POLICY "Allow authenticated delete employee payments"
  ON employee_payments FOR DELETE USING (auth.role() = 'authenticated');

-- Reservation Workers
CREATE POLICY "Allow authenticated delete reservation workers"
  ON reservation_workers FOR DELETE USING (auth.role() = 'authenticated');

-- Reservation Services
CREATE POLICY "Allow authenticated delete reservation services"
  ON reservation_services FOR DELETE USING (auth.role() = 'authenticated');

-- Worker Daily Payment Periods
CREATE POLICY "Allow authenticated delete worker daily payments"
  ON worker_daily_payment_periods FOR DELETE USING (auth.role() = 'authenticated');

-- Worker Reservation Payments
CREATE POLICY "Allow authenticated delete worker reservation payments"
  ON worker_reservation_payments FOR DELETE USING (auth.role() = 'authenticated');

-- ===============================================
-- KEEP EXISTING READ/INSERT/UPDATE POLICIES
-- ===============================================
-- We're keeping all other policies intact
-- Only changing DELETE permissions

-- ===============================================
-- VERIFICATION
-- ===============================================

-- List all policies to verify they're created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===============================================
-- NOTES
-- ===============================================
-- 
-- WHAT CHANGED:
-- - Removed all admin-only delete policies
-- - Added permissive delete policies for authenticated users
-- - All authenticated users can now delete data
--
-- WHAT STAYS THE SAME:
-- - SELECT policies (reading data)
-- - INSERT policies (creating data)
-- - UPDATE policies (editing data)
-- - Public read access where applicable
--
-- IF YOU WANT TO RESTRICT DELETE AGAIN:
-- Simply drop these new policies and recreate the admin-only ones
--
-- ===============================================
