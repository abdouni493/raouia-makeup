# QUICK DEPLOYMENT - Worker Auth Fix

## What Was Fixed

When you create a worker in the Employees UI, the system now:
1. ✅ Creates an auth account in Supabase Auth
2. ✅ Bypasses email confirmation
3. ✅ Worker can login immediately
4. ✅ Admin stays logged in

---

## Deploy in 3 Steps

### Step 1: Deploy Edge Functions

**Using Supabase CLI:**
```bash
supabase functions deploy create-worker-auth
supabase functions deploy delete-worker-auth
```

**OR via Supabase Dashboard:**
1. Go to https://app.supabase.com → Your Project
2. Click **Edge Functions** (left sidebar)
3. Copy-paste the code from:
   - `supabase/functions/create-worker-auth/index.ts`
   - `supabase/functions/delete-worker-auth/index.ts`
4. Create both functions

### Step 2: Rebuild Your App

```bash
npm run build
```

### Step 3: Test

1. Login as admin
2. Go to **Employés** tab
3. Create a new worker with email + password
4. Logout
5. Login with the worker's email + password
6. **SUCCESS!** ✅

---

## Files Changed

### Modified:
- `src/components/Employees.tsx` - Worker creation now creates auth account

### Created:
- `supabase/functions/create-worker-auth/index.ts`
- `supabase/functions/delete-worker-auth/index.ts`
- `supabase/functions/deno.json`

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Unable to invoke function" | Functions not deployed | Run `supabase functions deploy` |
| "Email already registered" | Duplicate email | Use different email |
| "Invalid login credentials" | Auth account not created | Verify function deployed |
| Worker can't login | Session not restored | Check browser console for errors |

---

## Verify Deployment

**Check Edge Functions:**
```bash
supabase functions list
```
Should show both functions as "Active"

**Check Logs:**
```bash
supabase functions logs create-worker-auth
```

**In Supabase Dashboard:**
- Go to Edge Functions
- Should see both functions listed
- Status should be "Active" (green)

---

## Rollback (If Needed)

If something goes wrong:

```bash
# Delete edge functions
supabase functions delete create-worker-auth
supabase functions delete delete-worker-auth

# Revert Employees.tsx (git)
git checkout src/components/Employees.tsx

# Rebuild
npm run build
```

---

## That's It!

Worker creation now works properly. Employees can be created and login immediately.

For detailed setup guide, see: `WORKER_AUTH_CREATION_FIX.md`

