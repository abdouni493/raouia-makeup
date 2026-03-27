-- ===================================
-- DROP EXISTING POLICIES
-- ===================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin manage payments" ON employee_payments;
DROP POLICY IF EXISTS "Employees can view own payments" ON employee_payments;
DROP POLICY IF EXISTS "Admin manage inventory" ON suppliers;
DROP POLICY IF EXISTS "Admin manage purchases" ON purchases;
DROP POLICY IF EXISTS "Admin manage expenses" ON expenses;
DROP POLICY IF EXISTS "Admins manage all reservations" ON reservations;
DROP POLICY IF EXISTS "Workers can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Workers can create reservations" ON reservations;
DROP POLICY IF EXISTS "Admin manage prestations" ON prestations;
DROP POLICY IF EXISTS "Anyone can view prestations" ON prestations;
DROP POLICY IF EXISTS "Admin manage services" ON services;
DROP POLICY IF EXISTS "Anyone can view services" ON services;
DROP POLICY IF EXISTS "Public read store config" ON store_config;
DROP POLICY IF EXISTS "Admin update store config" ON store_config;
DROP POLICY IF EXISTS "Admin manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Workers can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Anyone can view reservation services" ON reservation_services;
DROP POLICY IF EXISTS "Admin manage reservation services" ON reservation_services;

-- ===================================
-- CREATE NEW POLICIES (FIXED)
-- ===================================

-- Store Config Policies
CREATE POLICY "Public read store config" 
  ON store_config FOR SELECT USING (true);

CREATE POLICY "Admin update store config" 
  ON store_config FOR UPDATE USING (is_admin());

-- Profiles Policies - CRITICAL FIX
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
  ON profiles FOR ALL USING (is_admin());

-- Prestations Policies
CREATE POLICY "Anyone can view prestations" 
  ON prestations FOR SELECT USING (true);

CREATE POLICY "Admin manage prestations" 
  ON prestations FOR ALL USING (is_admin());

-- Services Policies
CREATE POLICY "Anyone can view services" 
  ON services FOR SELECT USING (true);

CREATE POLICY "Admin manage services" 
  ON services FOR ALL USING (is_admin());

-- Reservations Policies
CREATE POLICY "Workers can view all reservations" 
  ON reservations FOR SELECT USING (true);

CREATE POLICY "Workers can create reservations" 
  ON reservations FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workers can update own reservations" 
  ON reservations FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = worker_id);

CREATE POLICY "Admins manage all reservations" 
  ON reservations FOR ALL USING (is_admin());

-- Suppliers Policies
CREATE POLICY "Admin manage suppliers" 
  ON suppliers FOR ALL USING (is_admin());

-- Purchases Policies
CREATE POLICY "Admin manage purchases" 
  ON purchases FOR ALL USING (is_admin());

-- Expenses Policies
CREATE POLICY "Admin manage expenses" 
  ON expenses FOR ALL USING (is_admin());

-- Employee Payments Policies
CREATE POLICY "Employees can view own payments" 
  ON employee_payments FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Admin manage payments" 
  ON employee_payments FOR ALL USING (is_admin());

-- Reservation Services Policies
CREATE POLICY "Anyone can view reservation services" 
  ON reservation_services FOR SELECT USING (true);

CREATE POLICY "Admin manage reservation services" 
  ON reservation_services FOR ALL USING (is_admin());
