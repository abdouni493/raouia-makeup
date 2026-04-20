# Login Troubleshooting Guide - "Invalid login credentials"

## What This Error Means

The error `Invalid login credentials` with `400 Bad Request` means:
- The email/password combination does NOT exist in Supabase Auth
- Supabase rejected the login attempt

**Common causes:**
1. ❌ No worker accounts created yet
2. ❌ Worker account creation failed
3. ❌ Email/password entered incorrectly
4. ❌ Worker account was deleted from Supabase Auth
5. ❌ Email not saved correctly to database

---

## Troubleshooting Steps

### Step 1: Verify Worker Accounts Exist (2 minutes)

**In Supabase Console:**

1. Go to https://app.supabase.com
2. Select your project: `uvwogiqozurbgiugrdpt`
3. Click **Authentication** → **Users**
4. Look for worker accounts (should show email addresses)

**Result:**
- ✅ See worker email? Continue to Step 2
- ❌ Don't see any users? Go to Step 3 (Create Test Worker)

---

### Step 2: Check Database for Worker Profiles (2 minutes)

**Run this SQL in Supabase SQL Editor:**

```sql
SELECT id, username, email, full_name, role 
FROM profiles 
WHERE role = 'worker'
ORDER BY created_at DESC;
```

**Result:**
- ✅ Shows workers with emails? Continue to Step 4
- ❌ Shows workers but NO emails? Worker emails not saved (go to Step 3)
- ❌ Empty result? No workers created (go to Step 3)

---

### Step 3: Create a Test Worker Account (3 minutes)

**Via the App UI:**

1. **Login as admin** first (if you can)
2. Go to **Employés** tab
3. Click **+ Ajouter** (Add Worker)
4. Fill form with:
   - **Name:** `Test Worker`
   - **Email:** `testworker@example.com`
   - **Password:** `TestWorker123`
   - **Username:** `testworker`
   - **Other fields:** Optional (phone, address, etc.)
5. Click **Enregistrer** (Save)
6. Message should say: "Employé créé avec succès"

**Then:**
- Go back to Supabase Console
- **Authentication** → **Users**
- You should see `testworker@example.com` in the list

---

### Step 4: Try Logging In with Test Account (2 minutes)

1. **Logout** from admin account
2. Go to **Login** page
3. Enter:
   - **Email:** `testworker@example.com`
   - **Password:** `TestWorker123`
4. Click **Connexion** (Login)

**Result:**
- ✅ Login works? Issue solved! ✅
- ❌ Still get "Invalid login credentials"? Continue to Step 5

---

### Step 5: Check Browser Console (2 minutes)

1. Press **F12** (Open Developer Tools)
2. Go to **Console** tab
3. Look for error messages that start with `[LOGIN]`

**Look for these messages:**
```
[LOGIN] Starting login process...
[LOGIN] ✅ Authentication successful. User ID: ...
```

vs.

```
[LOGIN] ❌ Authentication error: Invalid login credentials
```

**If you see the error:**
- Email/password combination doesn't exist in Supabase
- Password might be wrong
- Account might not be confirmed

---

### Step 6: Check Email Format (1 minute)

Common issues with email:

```
❌ WRONG: "Test Worker Email" (spaces not allowed)
❌ WRONG: "TestWorker@Example.Com" (case sensitive for password auth)
❌ WRONG: " testworker@example.com" (leading space)
✅ CORRECT: "testworker@example.com" (lowercase, no spaces)
```

**When creating worker:**
- Use plain email with no spaces
- Lowercase is preferred (Supabase converts to lowercase anyway)

---

### Step 7: Verify Email Was Actually Saved (2 minutes)

**Run this SQL:**

```sql
SELECT username, email, full_name 
FROM profiles 
WHERE username = 'testworker';
```

**Result:**
- ✅ Shows email: `testworker@example.com` → Email saved correctly
- ❌ Shows email as NULL or empty → Email not saving (bug in code)

If email is NULL:
1. Edit the worker via UI
2. Make sure email is in the field
3. Click save
4. Check the database query again
5. If still NULL: Code bug (contact developer)

---

## Quick Diagnosis Checklist

Use this SQL to diagnose everything at once:

```sql
-- 1. Count workers
SELECT COUNT(*) as worker_count FROM profiles WHERE role = 'worker';

-- 2. Show workers with emails
SELECT username, email FROM profiles WHERE role = 'worker';

-- 3. Check RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- 4. Check email column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'email';
```

**Expected output:**
```
worker_count: 1 or more
username | email
testworker | testworker@example.com
policyname includes "Authenticated users can read profiles"
column_name: email
```

---

## Most Common Fixes

### Fix 1: Email Column Missing
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;
```
Then recreate workers via UI.

### Fix 2: Email Not Saving
- Run `ADD_EMAIL_TO_PROFILES.sql` first
- Make sure code changes are deployed
- Recreate the worker
- Check database to verify email is there

### Fix 3: Wrong Password
- User can click "Mot de passe oublié" (Forgot Password) on login
- Or delete worker and recreate with new password

### Fix 4: Account Not Confirmed
- Check Supabase → Authentication → Users
- If account shows "Not confirmed": Email verification may be required
- Click on user and resend confirmation email

### Fix 5: Multiple Accounts with Same Email
```sql
SELECT email, COUNT(*) FROM profiles 
WHERE email IS NOT NULL 
GROUP BY email HAVING COUNT(*) > 1;
```
If results show duplicates, delete the extra ones.

---

## Test Checklist

- [ ] Run diagnostic SQL queries above
- [ ] Create test worker via UI (testworker@example.com)
- [ ] Check Supabase Auth → Users (should see testworker@example.com)
- [ ] Check database profiles table (should see email)
- [ ] Try logging in with testworker@example.com
- [ ] Check browser console for [LOGIN] messages
- [ ] If login works → Problem solved ✅
- [ ] If still fails → Check each step above

---

## When All Else Fails

1. **Clear browser cache:** Ctrl+Shift+Delete
2. **Hard refresh:** Ctrl+F5
3. **Rebuild app:** npm run build
4. **Restart dev server:** Kill and restart npm start
5. **Check Supabase status:** Is the database online?
6. **Try different email:** Create worker with different email and retry

---

## Support Info

**If you're still stuck:**

1. Take a screenshot of the error
2. Run the SQL diagnostic queries
3. Screenshot the results
4. Share both with developer
5. Developer can pinpoint exact issue

**Key info to share:**
- Error message from browser console
- Results from SQL diagnostic queries
- Email and password you're trying
- Whether worker exists in Supabase Auth

---

## Summary

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| Invalid login credentials | Email/password doesn't exist | Create worker via UI |
| Empty email in edit modal | Email not saving | Run ADD_EMAIL_TO_PROFILES.sql + recreate |
| Can't see workers | None created | Go to Employees tab, add worker |
| Email field NULL in DB | Database missing column | Run ADD_EMAIL_TO_PROFILES.sql |
| Worker in Auth but not DB | Profile creation failed | Delete Auth user and recreate |

---

**Next:** Try Step 1-4 above, then report back if you need more help! 👍
