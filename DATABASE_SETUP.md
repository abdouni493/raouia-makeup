# Salon de Beauté - Database Setup Guide

## Supabase Connection Information

**Project URL:** https://uvwogiqozurbgiugrdpt.supabase.co
**Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2d29naXFvenVyYmdpdWdyZHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODE0MjAsImV4cCI6MjA5MDA1NzQyMH0.8O2YZPdneNfku1f6yuBzCewJDjvJ96kCEW2PCL2r6Kw

## Setup Steps

1. Go to https://app.supabase.com and log in to your account
2. Select the project: **uvwogiqozurbgiugrdpt**
3. Navigate to **SQL Editor**
4. Click **New Query** and paste the SQL code below
5. Click **Execute** to run the migrations

## Database Schema SQL

```sql
-- ==========================================
-- 1. EXTENSIONS & TYPES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types for roles and statuses
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'worker');
    CREATE TYPE payment_type AS ENUM ('days', 'month', 'percentage');
    CREATE TYPE reservation_status AS ENUM ('pending', 'finalized', 'cancelled');
    CREATE TYPE emp_payment_type AS ENUM ('salary', 'acompte', 'absence');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 2. TABLES DEFINITION
-- ==========================================

-- Store Configuration (Single row table)
CREATE TABLE IF NOT EXISTS store_config (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name TEXT NOT NULL DEFAULT 'Éclat & Soie',
    logo_url TEXT,
    slogan TEXT DEFAULT 'Votre beauté, notre passion',
    facebook TEXT,
    instagram TEXT,
    tiktok TEXT,
    phone TEXT,
    location TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'worker',
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    payment_type payment_type DEFAULT 'month',
    percentage NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prestations (Main services like "Coupe", "Coloration")
CREATE TABLE IF NOT EXISTS prestations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services (Add-ons like "Soin", "Brushing")
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    client_phone TEXT,
    prestation_id UUID REFERENCES prestations(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12,2) DEFAULT 0,
    status reservation_status DEFAULT 'pending',
    worker_id UUID REFERENCES profiles(id),
    created_by UUID REFERENCES profiles(id),
    finalized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservation Services (Many-to-Many join table)
CREATE TABLE IF NOT EXISTS reservation_services (
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (reservation_id, service_id)
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases (Inventory)
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12,2) DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store Expenses (Rent, Electricity, etc.)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Payments (Salaries, Deposits, Absences)
CREATE TABLE IF NOT EXISTS employee_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    type emp_payment_type NOT NULL,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for Store Config (Public read, Admin write)
CREATE POLICY "Public read store config" ON store_config FOR SELECT USING (true);
CREATE POLICY "Admin update store config" ON store_config FOR UPDATE USING (is_admin());

-- Policies for Profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (is_admin());

-- Policies for Prestations (Anyone can read, Admin can write)
CREATE POLICY "Anyone can view prestations" ON prestations FOR SELECT USING (true);
CREATE POLICY "Admin manage prestations" ON prestations FOR ALL USING (is_admin());

-- Policies for Services (Anyone can read, Admin can write)
CREATE POLICY "Anyone can view services" ON services FOR SELECT USING (true);
CREATE POLICY "Admin manage services" ON services FOR ALL USING (is_admin());

-- Policies for Reservations (Workers can see all, manage their own. Admins manage all)
CREATE POLICY "Workers can view all reservations" ON reservations FOR SELECT USING (true);
CREATE POLICY "Workers can create reservations" ON reservations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins manage all reservations" ON reservations FOR ALL USING (is_admin());

-- Policies for Inventory & Expenses (Admin only)
CREATE POLICY "Admin manage inventory" ON suppliers FOR ALL USING (is_admin());
CREATE POLICY "Admin manage purchases" ON purchases FOR ALL USING (is_admin());
CREATE POLICY "Admin manage expenses" ON expenses FOR ALL USING (is_admin());

-- Policies for Employee Payments
CREATE POLICY "Employees can view own payments" ON employee_payments FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Admin manage payments" ON employee_payments FOR ALL USING (is_admin());

-- ==========================================
-- 4. INITIAL DATA
-- ==========================================
INSERT INTO store_config (id, name, slogan) 
VALUES (1, 'Éclat & Soie', 'Votre beauté, notre passion') 
ON CONFLICT DO NOTHING;
```

## What Has Been Updated in the React App

1. **Login Component** - Now integrates with Supabase Auth:
   - Login form uses `supabase.auth.signInWithPassword()`
   - Signup form creates users with `supabase.auth.signUp()`
   - New users are created with **admin role** by default
   - Includes email, username, full name, and password confirmation
   - Error messages display authentication issues

2. **App Component** - Enhanced authentication handling:
   - Checks for existing session on app load
   - Listens for auth state changes
   - Fetches user profile from `profiles` table
   - Loads store configuration from `store_config` table
   - Shows loading spinner while authenticating

3. **Environment Variables** (`.env` file):
   ```
   VITE_SUPABASE_URL=https://uvwogiqozurbgiugrdpt.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Next Steps

1. Run the SQL migrations in Supabase SQL Editor
2. Test the signup form to create your first admin account
3. The app will automatically log you in after signup
4. Start using the application!

## Features

- ✅ User authentication with Supabase Auth
- ✅ Admin role assignment on signup
- ✅ Secure password storage
- ✅ Row Level Security (RLS) policies for data protection
- ✅ Profile management
- ✅ Session persistence
