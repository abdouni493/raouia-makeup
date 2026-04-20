# Fix Worker Login Issues - Complete Guide

## Problem Summary
Worker accounts cannot login. The login page shows errors like:
- "Profile not found"
- "Database permission error"
- "Failed to load profile"
- RLS policy violations

## Root Cause
The Row-Level Security (RLS) policies on the `profiles` table don't allow workers to read their own profile data after Supabase Authentication succeeds.

## Solution Steps

### Step 1: Apply the Database Fix

1. **Go to Supabase Console**
   - URL: https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** on left sidebar
   - Click **New Query** button

3. **Copy and paste the entire contents of `FIX_WORKER_LOGIN.sql`**
   - From your project: [FIX_WORKER_LOGIN.sql](FIX_WORKER_LOGIN.sql)

4. **Execute the Query**
   - Click **Execute** button (or Ctrl+Enter)
   - Wait for: "Query executed successfully"

### Step 2: Verify the Fix

After running the SQL, verify the policies are applied:

```sql
-- Run this in SQL Editor to verify
SELECT 
  policyname,
  qual as policy_condition
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

Expected output should show these policies:
- ✅ `Authenticated users can read profiles` (SELECT)
- ✅ `Users can create own profile` (INSERT)
- ✅ `Users can update own profile` (UPDATE)
- ✅ `Admins can manage profiles` (ALL)

### Step 3: Test Worker Login

1. **Go to application login page**
   - URL: http://localhost:3003 (or your app URL)

2. **Login with a worker account**
   - Example: email: `marie@salon.fr`, password: `SecurePass123`

3. **Expected results**
   - ✅ Login succeeds
   - ✅ Redirects to WorkerDashboard (not Admin Dashboard)
   - ✅ Worker can see: Réservations, Mes Paiements, Paramètres tabs
   - ✅ Cannot see: Configuration, Inventaire, Dépenses, etc.

### Step 4: Monitor Console for Debugging

If login still fails, check browser console (F12) for logs:

```
[LOGIN] Starting login process...
[LOGIN] ✅ Authentication successful. User ID: 12345-uuid-here
[LOGIN] Fetching user profile...
[FETCH PROFILE] Attempt 1/3 for user: 12345-uuid-here
[FETCH PROFILE] ✅ Successfully fetched profile for user: marie
[LOGIN] ✅ Profile loaded. Role: worker Username: marie
```

### Step 5: Code Changes Made

The following files were updated to improve error handling:

#### 1. `src/lib/utils.ts` - Enhanced `fetchUserProfile` function
- Added detailed console logging
- Detects RLS policy errors specifically
- Improved exponential backoff retry logic
- Added missing database columns to SELECT

#### 2. `src/components/Login.tsx` - Enhanced error handling
- Added detailed login flow logging
- Detects RLS policy errors specifically
- Shows helpful error messages
- Logs each step of the authentication process

## Troubleshooting

### "Still getting profile not found error"

**Cause**: Profiles table doesn't have the worker's record

**Fix**:
1. Open Supabase Dashboard
2. Go to Database → Tables → profiles
3. Look for the worker's account (search by email)
4. If missing: Admin must create the worker again in the app

### "RLS Policy Error" message

**Cause**: Policies not applied correctly

**Fix**:
1. Run the FIX_WORKER_LOGIN.sql again
2. Verify policies are listed (see Step 2 above)
3. Clear browser cache: Ctrl+Shift+Delete

### "Database permission error"

**Cause**: RLS policies blocking access

**Fix**:
1. Verify policies in Supabase SQL Editor:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
2. All 4 policies should be present
3. If missing, rerun FIX_WORKER_LOGIN.sql
4. Hard refresh browser: Ctrl+Shift+R

### Worker logs in but sees Admin Dashboard

**Cause**: Role not set correctly in profiles table

**Fix**:
1. Go to Supabase Dashboard
2. Database → Tables → profiles
3. Find the worker account
4. Check the `role` column = should be `'worker'` (not `'admin'`)
5. If wrong, edit it directly in Supabase

## How It Works Now

```
1. Worker enters email/password → Login page
2. Supabase authenticates credentials
3. If valid → System has auth session
4. Application calls fetchUserProfile(userId)
5. fetchUserProfile SELECT from profiles table
6. RLS Policy: "Authenticated users can read profiles"
   ✅ User is authenticated, so access allowed
7. Profile data returned to app
8. App checks role field
9. If role = 'worker' → Show WorkerDashboard
10. If role = 'admin' → Show AdminDashboard
```

## Security Overview

The RLS policies after the fix:

| Operation | Who Can? | Why Safe? |
|-----------|----------|-----------|
| SELECT profiles | All authenticated users | No sensitive data in profiles table; app layer filters by role |
| INSERT own profile | Users creating account | Can only create with their own ID (auth.uid() = id) |
| UPDATE own profile | Users + Admins | Users only update themselves; Admins manage all |
| DELETE | Nobody | Not allowed (no policy) - prevents accidents |
| Admin operations | Admins only | Requires role = 'admin' or 'super_admin' |

## Files Modified

### Database Changes
- **FIX_WORKER_LOGIN.sql** - SQL to fix RLS policies
  - Drop problematic SELECT policies
  - Create new SELECT policy for authenticated users
  - Recreate INSERT/UPDATE/ALL policies

### Code Changes
- **src/lib/utils.ts**
  - Enhanced fetchUserProfile() with better logging
  - Added RLS error detection
  - Improved retry logic with exponential backoff
  - Added missing columns: daily_rate, monthly_rate

- **src/components/Login.tsx**
  - Added detailed login flow logging
  - Enhanced error messages
  - RLS error specific handling
  - Better debugging information

## Testing Checklist

- [ ] FIX_WORKER_LOGIN.sql executed in Supabase
- [ ] Policies verified in SQL Editor
- [ ] Worker account exists in profiles table (role = 'worker')
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Try logging in with worker email/password
- [ ] Check console logs (F12 → Console tab)
- [ ] Worker successfully logged in
- [ ] Sees WorkerDashboard, not AdminDashboard
- [ ] Can see Réservations, Mes Paiements, Paramètres
- [ ] Cannot see admin features

## Common Worker Account Credentials for Testing

If your admin created test workers:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| marie | marie@salon.fr | SecurePass123 | worker |
| jean | jean@salon.fr | SecurePass123 | worker |
| alice | alice@salon.fr | SecurePass123 | worker |

(Replace with your actual worker accounts)

## Need Help?

If problems persist:

1. **Check FIX_WORKER_LOGIN.sql execution**
   - Run the SQL again
   - Look for errors in execution log

2. **Verify worker account exists**
   - Supabase Dashboard → Authentication → Users
   - Should see worker's email address

3. **Check profiles table**
   - Supabase Dashboard → Tables → profiles
   - Should have row with role = 'worker'

4. **Review console logs**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for [LOGIN] or [FETCH PROFILE] messages
   - Copy error message for debugging

5. **Manual test in SQL Editor**
   - As logged-in worker, run:
     ```sql
     SELECT * FROM profiles WHERE id = auth.uid();
     ```
   - Should return your profile

## Production Deployment

To deploy these fixes to production:

1. **Apply FIX_WORKER_LOGIN.sql to production Supabase project**
   - Same steps as above, but in production project

2. **Deploy code changes**
   - New versions of `src/lib/utils.ts` and `src/components/Login.tsx`
   - No breaking changes
   - Backward compatible with existing admin logins

3. **Clear caches**
   - Browser: Ctrl+Shift+Delete
   - CDN: If applicable
   - Database: N/A

4. **Monitor logs**
   - Check browser console for [LOGIN] messages
   - Verify worker logins complete successfully
   - Monitor any error reports

## Success Indicators

You'll know it's working when:

✅ Workers can login with their email/password
✅ Worker sees dedicated dashboard
✅ Worker cannot access admin features
✅ No RLS policy errors in console
✅ Profile loads in <1 second
✅ Browser console shows successful login logs

## Reference Documentation

- [WORKER_DASHBOARD_SETUP.md](WORKER_DASHBOARD_SETUP.md) - Worker feature overview
- [SETUP_RLS_POLICY_FIX.md](SETUP_RLS_POLICY_FIX.md) - Original RLS setup documentation
- [FIX_WORKER_LOGIN.sql](FIX_WORKER_LOGIN.sql) - The SQL fix to apply
