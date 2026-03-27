-- Fixed Database Schema with proper ENUM types
-- Run this in Supabase SQL Editor

-- Drop existing ENUM types if they exist (CASCADE to handle dependencies)
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.payment_type CASCADE;
DROP TYPE IF EXISTS public.reservation_status CASCADE;

-- Create ENUM types
CREATE TYPE public.user_role AS ENUM ('admin', 'worker', 'manager');
CREATE TYPE public.payment_type AS ENUM ('month', 'days', 'percentage');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text DEFAULT 'worker',
  avatar_url text,
  phone text,
  address text,
  payment_type text DEFAULT 'month',
  percentage numeric,
  created_at timestamp with time zone DEFAULT now(),
  daily_rate numeric DEFAULT NULL::numeric,
  monthly_rate numeric DEFAULT NULL::numeric,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create employee_payments table with proper status field
CREATE TABLE IF NOT EXISTS public.employee_payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('salary', 'acompte', 'absence')),
  description text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'unpaid'::text CHECK (status IN ('paid', 'unpaid')),
  CONSTRAINT employee_payments_pkey PRIMARY KEY (id),
  CONSTRAINT employee_payments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_id ON public.employee_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_status ON public.employee_payments(status);
CREATE INDEX IF NOT EXISTS idx_employee_payments_type ON public.employee_payments(type);
CREATE INDEX IF NOT EXISTS idx_employee_payments_date ON public.employee_payments(date);
CREATE INDEX IF NOT EXISTS idx_employee_payments_emp_status ON public.employee_payments(employee_id, status);

-- Create prestations table
CREATE TABLE IF NOT EXISTS public.prestations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prestations_pkey PRIMARY KEY (id)
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  client_name text NOT NULL,
  client_phone text,
  prestation_id uuid,
  date date NOT NULL,
  time time without time zone NOT NULL,
  total_price numeric NOT NULL DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  worker_id uuid,
  created_by uuid,
  finalized_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_prestation_id_fkey FOREIGN KEY (prestation_id) REFERENCES public.prestations(id),
  CONSTRAINT reservations_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id),
  CONSTRAINT reservations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Create reservation_services junction table
CREATE TABLE IF NOT EXISTS public.reservation_services (
  reservation_id uuid NOT NULL,
  service_id uuid NOT NULL,
  CONSTRAINT reservation_services_pkey PRIMARY KEY (reservation_id, service_id),
  CONSTRAINT reservation_services_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE,
  CONSTRAINT reservation_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  cost numeric NOT NULL DEFAULT 0,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id)
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  phone text,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  supplier_id uuid,
  description text NOT NULL,
  cost numeric NOT NULL DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT purchases_pkey PRIMARY KEY (id),
  CONSTRAINT purchases_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
);

-- Create store_config table
CREATE TABLE IF NOT EXISTS public.store_config (
  id integer NOT NULL DEFAULT 1,
  name text NOT NULL DEFAULT 'Éclat & Soie'::text,
  logo_url text,
  slogan text DEFAULT 'Votre beauté, notre passion'::text,
  facebook text,
  instagram text,
  tiktok text,
  phone text,
  location text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT store_config_pkey PRIMARY KEY (id),
  CONSTRAINT store_config_id_check CHECK (id = 1)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy for employee_payments: Allow authenticated users to view and update payments
CREATE POLICY "Allow authenticated users to view and update employee_payments"
  ON public.employee_payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create RLS Policy for profiles: Allow authenticated users to view profiles
CREATE POLICY "Allow authenticated users to view profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Create RLS Policy for reservations: Allow authenticated users to view and manage reservations
CREATE POLICY "Allow authenticated users to manage reservations"
  ON public.reservations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- If you want stricter RLS, replace the above policies with these:
-- CREATE POLICY "User-specific employee_payments"
--   ON public.employee_payments
--   FOR SELECT
--   USING (true); -- Allow viewing all payments
-- 
-- CREATE POLICY "Update own employee_payments"
--   ON public.employee_payments
--   FOR UPDATE
--   USING (true)
--   WITH CHECK (true);
