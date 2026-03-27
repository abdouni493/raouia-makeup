-- ====================================
-- FIX ALL DATABASE AND RLS ISSUES
-- ====================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all users" ON public.reservations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.reservations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.reservations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.reservations;

-- 2. STORE_CONFIG RLS POLICIES - Allow all operations for authenticated users
DROP POLICY IF EXISTS "Enable read for all" ON public.store_config;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.store_config;
DROP POLICY IF EXISTS "Enable update for authenticated" ON public.store_config;
DROP POLICY IF EXISTS "Enable delete for authenticated" ON public.store_config;

CREATE POLICY "Enable read for all" ON public.store_config
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated" ON public.store_config
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON public.store_config
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON public.store_config
  FOR DELETE USING (auth.role() = 'authenticated');

-- 3. PROFILES RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;

CREATE POLICY "Enable read for all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR auth.role() = 'authenticated');

-- 4. RESERVATIONS RLS POLICIES
CREATE POLICY "Enable read for all" ON public.reservations
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.reservations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.reservations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.reservations
  FOR DELETE USING (auth.role() = 'authenticated');

-- 5. PRESTATIONS RLS POLICIES
ALTER TABLE public.prestations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all prestations" ON public.prestations;
DROP POLICY IF EXISTS "Enable insert for authenticated prestations" ON public.prestations;
DROP POLICY IF EXISTS "Enable update for authenticated prestations" ON public.prestations;

CREATE POLICY "Enable read for all prestations" ON public.prestations
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated prestations" ON public.prestations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated prestations" ON public.prestations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. SERVICES RLS POLICIES
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all services" ON public.services;
DROP POLICY IF EXISTS "Enable insert for authenticated services" ON public.services;
DROP POLICY IF EXISTS "Enable update for authenticated services" ON public.services;

CREATE POLICY "Enable read for all services" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated services" ON public.services
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated services" ON public.services
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. EXPENSES RLS POLICIES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Enable insert for authenticated expenses" ON public.expenses;
DROP POLICY IF EXISTS "Enable update for authenticated expenses" ON public.expenses;

CREATE POLICY "Enable read for all expenses" ON public.expenses
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated expenses" ON public.expenses
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 8. SUPPLIERS RLS POLICIES
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Enable insert for authenticated suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Enable update for authenticated suppliers" ON public.suppliers;

CREATE POLICY "Enable read for all suppliers" ON public.suppliers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated suppliers" ON public.suppliers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated suppliers" ON public.suppliers
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 9. PURCHASES RLS POLICIES
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all purchases" ON public.purchases;
DROP POLICY IF EXISTS "Enable insert for authenticated purchases" ON public.purchases;
DROP POLICY IF EXISTS "Enable update for authenticated purchases" ON public.purchases;

CREATE POLICY "Enable read for all purchases" ON public.purchases
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated purchases" ON public.purchases
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated purchases" ON public.purchases
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 10. EMPLOYEE_PAYMENTS RLS POLICIES
ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all payments" ON public.employee_payments;
DROP POLICY IF EXISTS "Enable insert for authenticated payments" ON public.employee_payments;
DROP POLICY IF EXISTS "Enable update for authenticated payments" ON public.employee_payments;

CREATE POLICY "Enable read for all payments" ON public.employee_payments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated payments" ON public.employee_payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated payments" ON public.employee_payments
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 11. RESERVATION_SERVICES RLS POLICIES
ALTER TABLE public.reservation_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for all reservation_services" ON public.reservation_services;
DROP POLICY IF EXISTS "Enable insert for authenticated reservation_services" ON public.reservation_services;
DROP POLICY IF EXISTS "Enable update for authenticated reservation_services" ON public.reservation_services;

CREATE POLICY "Enable read for all reservation_services" ON public.reservation_services
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated reservation_services" ON public.reservation_services
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated reservation_services" ON public.reservation_services
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ====================================
-- GRANT PERMISSIONS TO AUTHENTICATED ROLE
-- ====================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ====================================
-- ENSURE store_config HAS PROPER DATA
-- ====================================
INSERT INTO public.store_config (id, name, slogan, phone, location) 
VALUES (1, 'Éclat & Soie', 'Votre beauté, notre passion', '', '')
ON CONFLICT (id) DO NOTHING;
