# Complete Setup Instructions - Fix RLS Policy Error

## Problem
When signing up, you get: `row violates row-level security policy for table "profiles"`

This happens because the current RLS policies don't allow new users to insert their own profile.

## Solution - Step by Step

### Step 1: Open Supabase Console
1. Go to https://app.supabase.com
2. Log in to your account
3. Select your project: **uvwogiqozurbgiugrdpt**

### Step 2: Go to SQL Editor
1. Click **SQL Editor** on the left sidebar
2. Click **New Query** button

### Step 3: Fix the RLS Policies
Copy and paste **ALL** of this code into the SQL editor:

```sql
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
```

### Step 4: Execute the Query
1. Click the **Execute** button (or press Ctrl+Enter)
2. Wait for the query to complete
3. You should see: `Query executed successfully`

### Step 5: Test the App
1. Go back to http://localhost:3003/
2. Click **Créer un compte** (Create Account)
3. Fill in:
   - Nom complet: `Marie Laurent`
   - Email: `marie@salon.fr`
   - Nom d'utilisateur: `marie_beaute`
   - Mot de passe: `password123`
   - Confirmer: `password123`
4. Click **Créer mon compte**
5. You should be logged in successfully!

## If You Still Get an Error

If you get another error:

1. **Check RLS is enabled properly:**
   - Go to Database → Tables
   - Click on `profiles` table
   - Check the **RLS** toggle in the top right - it should be ON

2. **Check the `is_admin()` function exists:**
   - Go to SQL Editor → New Query
   - Run: `SELECT is_admin();`
   - It should return without error

3. **Double-check the `profiles` table exists:**
   - Go to Database → Tables
   - Look for `profiles` in the list
   - It should have these columns: `id`, `username`, `full_name`, `role`, `avatar_url`, `phone`, `address`, `payment_type`, `percentage`, `created_at`

## Key Policy Changes

| Policy | Old | New |
|--------|-----|-----|
| Profiles INSERT | ❌ Not allowed | ✅ Users can insert own profile |
| Profiles UPDATE | ✅ Users own only | ✅ Users own + Admins all |
| Reservations INSERT | ✅ Users own | ✅ Users own + unchanged |
| Admin operations | ✅ Requires admin | ✅ Requires admin (unchanged) |

The crucial fix is: **"Users can insert their own profile"** - This allows new users to create their profile during signup.
