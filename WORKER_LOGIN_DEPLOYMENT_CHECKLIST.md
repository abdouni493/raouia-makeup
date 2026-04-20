# Worker Login Fix - Deployment Checklist

## Pre-Deployment ✓

- [ ] Read [WORKER_LOGIN_FIX_SUMMARY.md](WORKER_LOGIN_FIX_SUMMARY.md) - overview of changes
- [ ] Read [FIX_WORKER_LOGIN_GUIDE.md](FIX_WORKER_LOGIN_GUIDE.md) - detailed setup guide
- [ ] Review [FIX_WORKER_LOGIN.sql](FIX_WORKER_LOGIN.sql) - database changes
- [ ] Understand the 3 components being fixed (database + 2 code files)

## Step 1: Apply Database Fix

- [ ] Open Supabase Console: https://app.supabase.com
- [ ] Select your project
- [ ] Go to **SQL Editor** → Click **New Query**
- [ ] Open [FIX_WORKER_LOGIN.sql](FIX_WORKER_LOGIN.sql) file
- [ ] Copy entire SQL content
- [ ] Paste into SQL Editor query box
- [ ] Click **Execute** button
- [ ] Verify: Message shows "Query executed successfully" (no errors)

## Step 2: Verify Database Changes

Run this verification query in SQL Editor:

```sql
SELECT 
  policyname,
  qual as policy_condition
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

Expected policies should include:
- [ ] `Authenticated users can read profiles`
- [ ] `Users can create own profile`
- [ ] `Users can update own profile`
- [ ] `Admins can manage profiles`

## Step 3: Deploy Code Changes

The following files have been updated:
- [ ] `src/lib/utils.ts` - Enhanced `fetchUserProfile()` function
- [ ] `src/components/Login.tsx` - Enhanced `handleLoginSubmit()` function

**Deployment method:**
- [ ] Build your project (npm run build)
- [ ] Deploy to production (your CI/CD pipeline)
- [ ] Or if testing locally: npm start

## Step 4: Clear Caches

- [ ] Clear browser cache:
  - [ ] Chrome: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
  - [ ] Firefox: Ctrl+Shift+Delete
  - [ ] Safari: Develop → Empty Caches
- [ ] Close all browser tabs with the app
- [ ] Restart the app in browser
- [ ] If using CDN, clear CDN cache

## Step 5: Test Worker Login

### Create Test Account (if needed)
- [ ] Open admin dashboard
- [ ] Go to **Employés** tab
- [ ] Click **+ Ajouter**
- [ ] Fill form with:
  - Name: `Test Worker`
  - Email: `testworker@salon.fr`
  - Password: `TestPass123`
  - Other fields: Optional
- [ ] Click **Enregistrer**
- [ ] Note: Admin should stay logged in after this

### Test Login
- [ ] **Logout** from admin account
- [ ] Verify login page appears
- [ ] Enter worker credentials:
  - Email: `testworker@salon.fr`
  - Password: `TestPass123`
- [ ] Click **Connexion**

### Verify Success
- [ ] ✅ Login succeeds (no error message)
- [ ] ✅ Redirects to **WorkerDashboard** (not AdminDashboard)
- [ ] ✅ See these tabs: **Réservations**, **Mes Paiements**, **Paramètres**
- [ ] ✅ Do NOT see: **Configuration**, **Inventaire**, **Dépenses**, **Rapports**
- [ ] ✅ Can click tabs without errors
- [ ] ✅ Can view profile in **Paramètres** tab

### Check Browser Console
- [ ] Open DevTools: F12 (or right-click → Inspect)
- [ ] Go to **Console** tab
- [ ] Look for logs like:
  ```
  [LOGIN] Starting login process...
  [LOGIN] ✅ Authentication successful. User ID: ...
  [LOGIN] Fetching user profile...
  [FETCH PROFILE] ✅ Successfully fetched profile for user: testworker
  [LOGIN] ✅ Profile loaded. Role: worker
  ```
- [ ] ✅ No error messages
- [ ] ✅ No RLS policy errors

## Step 6: Test Admin Login

- [ ] Logout from worker account
- [ ] Login with **admin** credentials
- [ ] ✅ Sees AdminDashboard (not WorkerDashboard)
- [ ] ✅ Can access all admin tabs

## Step 7: Test Multiple Workers

If applicable, test at least one more worker:
- [ ] Create 2nd test worker via Employees tab
- [ ] Logout from current account
- [ ] Login with 2nd worker credentials
- [ ] ✅ 2nd worker sees WorkerDashboard
- [ ] ✅ No errors

## Post-Deployment Testing

### Functionality Tests
- [ ] Worker can view their reservations
- [ ] Worker can view their payments
- [ ] Worker can see profile settings
- [ ] Worker can change password
- [ ] Worker can update profile info
- [ ] Admin features are hidden for workers
- [ ] No console errors during normal use

### Edge Cases
- [ ] Worker tries invalid password: ✅ Shows error
- [ ] Worker tries admin email: ✅ Shows WorkerDashboard (not AdminDashboard)
- [ ] Admin tries worker email: ✅ Shows AdminDashboard
- [ ] Unknown user tries login: ✅ Shows error

### Performance
- [ ] Login completes in < 2 seconds
- [ ] No loading indicators stuck
- [ ] No memory leaks (check DevTools Performance)
- [ ] Dashboard loads smoothly

## Rollback Plan (If Needed)

If something goes wrong:

### Rollback Database
```sql
-- Run this in SQL Editor to revert RLS policies:
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- Then recreate original policies (from backup/previous version)
```

### Rollback Code
- [ ] Revert `src/lib/utils.ts` to previous version
- [ ] Revert `src/components/Login.tsx` to previous version
- [ ] Redeploy application

## Sign-Off

- [ ] Database changes verified ✅
- [ ] Code deployed ✅
- [ ] Worker login tested ✅
- [ ] Admin login still works ✅
- [ ] No console errors ✅
- [ ] Performance acceptable ✅
- [ ] Ready for production ✅

**Deployed By:** ________________
**Date:** ________________
**Time:** ________________

## Monitoring (First 24 Hours)

- [ ] Monitor worker login attempts
- [ ] Check error logs for RLS policy issues
- [ ] Verify no increase in failed logins
- [ ] Monitor performance metrics
- [ ] Get user feedback from testers
- [ ] Watch for any unexpected behavior

## Documentation

- [ ] Team notified of changes
- [ ] Release notes updated
- [ ] Users informed (if applicable)
- [ ] Wiki/documentation updated

---

## Quick Reference

### If Worker Cannot Login
1. Check browser console (F12 → Console)
2. Look for [LOGIN] or [FETCH PROFILE] logs
3. If RLS error: Rerun FIX_WORKER_LOGIN.sql
4. If profile not found: Create worker account in admin panel
5. See [FIX_WORKER_LOGIN_GUIDE.md](FIX_WORKER_LOGIN_GUIDE.md) for detailed troubleshooting

### Files to Verify After Deployment
```
src/lib/utils.ts           - Should have enhanced fetchUserProfile()
src/components/Login.tsx   - Should have enhanced handleLoginSubmit()
FIX_WORKER_LOGIN.sql       - Should be applied to database
```

### Support Contact
For issues with worker login:
1. Check [WORKER_LOGIN_FIX_SUMMARY.md](WORKER_LOGIN_FIX_SUMMARY.md)
2. Check [FIX_WORKER_LOGIN_GUIDE.md](FIX_WORKER_LOGIN_GUIDE.md)
3. Review browser console logs (F12)
4. Check Supabase dashboard for user/profile records
