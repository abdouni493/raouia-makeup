-- ====================================
-- CREATE SUPER ADMIN ACCOUNT
-- ====================================
-- Email: admin@admin.com
-- User ID: d961eeba-21ee-497b-84f1-e0b0c4635777
-- Role: admin (will NOT appear in workers interface)

-- ====================================
-- STEP 1: Make user a super admin in auth.users table
-- ====================================
UPDATE auth.users 
SET is_super_admin = true 
WHERE id = 'd961eeba-21ee-497b-84f1-e0b0c4635777';

-- ====================================
-- STEP 2: Create or update profile in profiles table
-- ====================================
INSERT INTO public.profiles (
  id, 
  username, 
  full_name, 
  role, 
  phone, 
  address, 
  payment_type, 
  percentage
) 
VALUES (
  'd961eeba-21ee-497b-84f1-e0b0c4635777',
  'admin',
  'Admin User',
  'admin',  -- This role will NOT show in workers list
  '',
  '',
  'month',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Admin User'
;

-- ====================================
-- VERIFY: Check the profile was created/updated
-- ====================================
SELECT * FROM public.profiles WHERE id = 'd961eeba-21ee-497b-84f1-e0b0c4635777';

-- Check auth user
SELECT id, email, is_super_admin FROM auth.users WHERE id = 'd961eeba-21ee-497b-84f1-e0b0c4635777';
