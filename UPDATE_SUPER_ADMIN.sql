-- Update user to super_admin role
-- Run this in Supabase SQL Editor

UPDATE public.profiles
SET role = 'super_admin'
WHERE id = 'd961eeba-21ee-497b-84f1-e0b0c4635777';

-- Verify the update
SELECT id, username, full_name, role
FROM public.profiles
WHERE id = 'd961eeba-21ee-497b-84f1-e0b0c4635777';
