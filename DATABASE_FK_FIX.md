# Fix Database Foreign Key Constraint Issue

## Problem
When creating new employees, you get this error:
```
insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"
```

This happens because the code tries to insert a profile with a randomly generated UUID that doesn't correspond to any auth.users record.

## Solution

You have two options:

### Option 1: Remove the Foreign Key Constraint (Recommended for your use case)

Run the SQL in `FIX_PROFILES_FK.sql`:
```sql
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;
```

This allows creating employee profiles without requiring auth.users records. Profiles can now be created independently with any UUID.

**Pros:**
- Employees can be created immediately as profiles
- Simpler workflow for admin users
- No need for complex auth setup

**Cons:**
- Profiles won't have auth accounts for login
- You'd need to create auth users separately if they need to log in

### Option 2: Create Auth Users First (If you want login capability)

If you want employees to be able to log in, you need to:
1. Create an auth.users record first (email + password)
2. Get the generated UUID from the auth user
3. Create the profile with that UUID

This requires using Supabase Admin API or Auth API, which needs a service role key.

## How to Apply the Fix

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the SQL from `FIX_PROFILES_FK.sql`
5. Run it
6. Your profiles table will now allow inserts without foreign key requirements

## Current App Status

With the fix applied:
- ✅ Employee creation will work with the new `created_at` field
- ✅ All employee data will be saved with creation timestamp
- ✅ No foreign key constraint errors
- ⚠️ Employees won't have auth accounts (if you need this, use Option 2)

## Testing

After applying the fix, try creating a new employee:
1. Click add employee
2. Fill in the form
3. Click save
4. Should succeed without errors
