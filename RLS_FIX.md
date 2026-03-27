# Fix for Row Level Security (RLS) Policies

The error "row violates row-level security policy for table 'profiles'" occurs because the current RLS policies prevent users from inserting their own profile during signup.

## SQL Fix - Run this in Supabase SQL Editor

```sql
-- Drop existing problematic policies
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

-- ===================================
-- NEW RLS POLICIES (FIXED)
-- ===================================

-- Policies for Store Config (Public read, Admin write)
CREATE POLICY "Public read store config" 
  ON store_config FOR SELECT USING (true);
  
CREATE POLICY "Admin update store config" 
  ON store_config FOR UPDATE USING (is_admin());

-- Policies for Profiles
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);
  
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);
  
CREATE POLICY "Admins can manage all profiles" 
  ON profiles FOR ALL USING (is_admin());

-- Policies for Prestations (Anyone can read, Admin can write)
CREATE POLICY "Anyone can view prestations" 
  ON prestations FOR SELECT USING (true);
  
CREATE POLICY "Admin manage prestations" 
  ON prestations FOR ALL USING (is_admin());

-- Policies for Services (Anyone can read, Admin can write)
CREATE POLICY "Anyone can view services" 
  ON services FOR SELECT USING (true);
  
CREATE POLICY "Admin manage services" 
  ON services FOR ALL USING (is_admin());

-- Policies for Reservations
CREATE POLICY "Workers can view all reservations" 
  ON reservations FOR SELECT USING (true);
  
CREATE POLICY "Workers can create reservations" 
  ON reservations FOR INSERT WITH CHECK (auth.uid() = created_by);
  
CREATE POLICY "Workers can update own reservations" 
  ON reservations FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = worker_id);
  
CREATE POLICY "Admins manage all reservations" 
  ON reservations FOR ALL USING (is_admin());

-- Policies for Inventory (Admin only)
CREATE POLICY "Admin manage suppliers" 
  ON suppliers FOR ALL USING (is_admin());
  
CREATE POLICY "Admin manage purchases" 
  ON purchases FOR ALL USING (is_admin());
  
CREATE POLICY "Admin manage expenses" 
  ON expenses FOR ALL USING (is_admin());

-- Policies for Employee Payments
CREATE POLICY "Employees can view own payments" 
  ON employee_payments FOR SELECT USING (auth.uid() = employee_id);
  
CREATE POLICY "Admin manage payments" 
  ON employee_payments FOR ALL USING (is_admin());

-- Policies for Reservation Services
CREATE POLICY "Anyone can view reservation services" 
  ON reservation_services FOR SELECT USING (true);
  
CREATE POLICY "Admin manage reservation services" 
  ON reservation_services FOR ALL USING (is_admin());
```

## What This Fixes

1. ✅ Allows new users to insert their own profile during signup
2. ✅ Maintains security - users can only update their own profile (until they're admin)
3. ✅ Admins still have full access to manage all data
4. ✅ Proper read-only access for shared data (prestations, services, store_config)

## Testing

After running the SQL:
1. The signup form should work without RLS errors
2. New users will be created with the profile successfully
3. They'll be assigned admin role on signup
