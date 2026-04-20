# Worker Account Creation Fix - Complete Setup Guide

## Problem Fixed

✅ **BEFORE:** When creating a worker account via the Employees UI:
- ❌ Auth account was NOT created in Supabase Auth
- ❌ Only database profile was created
- ❌ Workers couldn't login because email/password didn't exist in Supabase Auth
- ❌ Error: "Invalid login credentials" 400 Bad Request

✅ **AFTER:** When creating a worker account:
- ✅ Auth account IS created via Supabase Admin API
- ✅ Email confirmation is bypassed (can login immediately)
- ✅ Database profile is created with correct UID
- ✅ Worker can login immediately with email and password
- ✅ Admin session is restored (no unwanted auto-login)

---

## What Changed

### 1. Modified Files

#### **src/components/Employees.tsx** - Line 326
Changed the worker creation logic to:
1. Call the `create-worker-auth` edge function
2. Get the UID from the edge function response
3. Use that UID to create the database profile
4. Restore admin session so admin stays logged in

**Key changes:**
- Uses `supabase.functions.invoke('create-worker-auth', {...})`
- Gets `createAuthResult.userId` and uses it as profile `id`
- Calls `delete-worker-auth` if profile creation fails (cleanup)
- Added success message: "Employé créé avec succès! L'employé peut maintenant se connecter..."

### 2. New Edge Functions

Created two Supabase Edge Functions:

#### **supabase/functions/create-worker-auth/index.ts**
- **Purpose:** Create auth user with Admin API (bypasses email verification)
- **Called by:** Employees.tsx when saving new worker
- **Input:** 
  ```json
  {
    "email": "youssef@abdouni.com",
    "password": "password123",
    "username": "youssef_abdouni",
    "fullName": "Youssef Abdouni"
  }
  ```
- **Output:**
  ```json
  {
    "userId": "uuid-here",
    "email": "youssef@abdouni.com",
    "message": "User created successfully"
  }
  ```
- **Key features:**
  - Uses Supabase Admin API (requires service role key)
  - Sets `email_confirm: true` (user can login immediately)
  - Includes username and fullName in user metadata
  - Handles duplicate email error gracefully
  - CORS enabled

#### **supabase/functions/delete-worker-auth/index.ts**
- **Purpose:** Delete orphaned auth users if profile creation fails
- **Called by:** Employees.tsx if database profile creation fails
- **Input:** 
  ```json
  {
    "userId": "uuid-here"
  }
  ```
- **Output:**
  ```json
  {
    "message": "User deleted successfully"
  }
  ```

#### **supabase/functions/deno.json**
- Configuration file for Deno runtime
- Specifies imports for edge functions

---

## Setup Instructions

### Step 1: Verify Edge Functions Are in Place

Check that these files exist:
- `supabase/functions/create-worker-auth/index.ts` ✅
- `supabase/functions/delete-worker-auth/index.ts` ✅
- `supabase/functions/deno.json` ✅

### Step 2: Deploy Edge Functions to Supabase

**Option A: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Deploy the edge functions
supabase functions deploy create-worker-auth
supabase functions deploy delete-worker-auth

# Verify deployment
supabase functions list
```

**Option B: Via Supabase Dashboard**

1. Go to https://app.supabase.com
2. Select your project
3. Click **Edge Functions** in the left sidebar
4. Click **Create a new function**
5. Name: `create-worker-auth`
6. Paste the content from `supabase/functions/create-worker-auth/index.ts`
7. Repeat for `delete-worker-auth`

### Step 3: Verify Edge Functions Configuration

In Supabase Dashboard → Edge Functions:

**For `create-worker-auth`:**
- ✅ Status should be "Active" or showing green checkmark
- ✅ Can see the function in the list
- ✅ Logs show any test invocations

**For `delete-worker-auth`:**
- ✅ Status should be "Active" or showing green checkmark
- ✅ Can see the function in the list

### Step 4: Rebuild and Deploy Your App

```bash
# In your project directory
npm run build

# The build will include the code changes to Employees.tsx
```

### Step 5: Test Worker Creation

**In your app:**

1. Login as admin
2. Go to **Employés** tab
3. Click **+ Ajouter** (Add)
4. Fill in worker details:
   - **Nom Complet:** Test Worker
   - **Nom d'utilisateur:** testworker
   - **Email:** testworker@example.com
   - **Mot de passe:** TestPassword123!
   - **Autres champs:** Fill in as needed
5. Click **Enregistrer** (Save)

**Expected result:**
- ✅ Message appears: "Employé créé avec succès! L'employé peut maintenant se connecter avec son email et mot de passe."
- ✅ Modal closes
- ✅ Worker appears in the list
- ✅ Worker appears in Supabase Auth → Users

### Step 6: Test Worker Login

**In your app:**

1. Logout from admin account
2. Go to **Login** page
3. Enter:
   - **Email:** testworker@example.com
   - **Mot de passe:** TestPassword123!
4. Click **Connexion** (Login)

**Expected result:**
- ✅ Login succeeds
- ✅ Worker dashboard appears
- ✅ Worker can see their information

---

## Troubleshooting

### Issue 1: "Unable to invoke function" Error

**Cause:** Edge functions not deployed or wrong project

**Fix:**
```bash
# Deploy functions
supabase functions deploy create-worker-auth
supabase functions deploy delete-worker-auth

# Check logs
supabase functions list
```

### Issue 2: "This email is already registered" Error

**Cause:** Email already exists in Supabase Auth

**Fix:**
- Use a different email address
- Or delete the existing account from Supabase Auth dashboard

### Issue 3: "Missing Supabase configuration" Error

**Cause:** Edge function can't access environment variables

**Fix:**
1. Go to Supabase Dashboard → Edge Functions
2. Click on `create-worker-auth`
3. Check that function has access to:
   - `SUPABASE_URL` (should be auto-set)
   - `SUPABASE_SERVICE_ROLE_KEY` (should be auto-set)

### Issue 4: Worker Can't Login After Creation

**Cause:** Possible reasons:
- Edge function not deployed
- Email not matching exactly (case-sensitive)
- Password wrong when trying to login
- Auth account not confirmed in Supabase Auth

**Fix:**
1. Check browser console (F12) for [LOGIN] messages
2. Verify worker exists in Supabase Auth → Users
3. Try resetting password via "Mot de passe oublié" on login page
4. Check that email in database matches email in Supabase Auth

---

## Technical Details

### How It Works

```
User clicks "Enregistrer" (Save) in Employees UI
    ↓
handleSaveEmployee() function called
    ↓
Validates form data
    ↓
If NEW worker:
    ├─ Calls create-worker-auth edge function
    │  └─ Edge function creates user in Supabase Auth
    │     └─ Returns userId (UID)
    │
    ├─ Uses returned userId as profile id
    │
    ├─ Creates profile in database
    │  └─ If fails: calls delete-worker-auth to cleanup
    │
    └─ Restores admin session
       └─ Admin stays logged in (not switched to worker)
    
If EXISTING worker:
    └─ Updates profile in database
       └─ Password updates NOT supported yet (use password reset)

User can now login with email + password
```

### Why Email Confirmation is Bypassed

Normally, Supabase requires users to confirm their email before login. This creates problems:
- ❌ Worker must click confirmation link
- ❌ Admin can't directly create worker accounts
- ❌ Creates extra steps in workflow

The edge function uses Admin API with `email_confirm: true` to:
- ✅ Bypass email confirmation
- ✅ User can login immediately
- ✅ Streamlines worker creation

### Why Admin Session is Restored

When creating a worker auth account, Supabase automatically switches the session to that user. The code immediately restores the admin session to prevent:
- ❌ Admin accidentally being logged out
- ❌ Admin being switched to worker account
- ❌ Loss of context while managing employees

---

## Security Notes

✅ **Edge functions use Admin API:**
- Service role key is server-side only
- Client cannot access it
- Safe for creating auth users

✅ **Email confirmation bypassed safely:**
- Only admin can create workers
- Admin is verified via Supabase session
- Edge function checks authorization

✅ **Session restoration prevents issues:**
- Admin stays logged in
- No risk of losing admin privileges
- Worker account is separate and independent

---

## Next Steps

1. ✅ Deploy edge functions to Supabase
2. ✅ Test worker creation
3. ✅ Test worker login
4. ✅ Verify both admin and worker accounts work

---

## Files Modified/Created

### Modified:
- `src/components/Employees.tsx` (line 326-377) - Updated handleSaveEmployee

### Created:
- `supabase/functions/create-worker-auth/index.ts` - Edge function for creating auth users
- `supabase/functions/delete-worker-auth/index.ts` - Edge function for cleanup
- `supabase/functions/deno.json` - Deno configuration

---

## Command Reference

```bash
# Deploy all functions
supabase functions deploy create-worker-auth
supabase functions deploy delete-worker-auth

# Test edge function locally
supabase functions serve

# Check deployment status
supabase functions list

# View function logs
supabase functions logs create-worker-auth
```

---

## Support

If you encounter issues:

1. Check browser console (F12) for error messages
2. Check Supabase Dashboard → Edge Functions → Logs
3. Verify worker was created in Supabase Auth → Users
4. Run SQL to verify database profile was created:
   ```sql
   SELECT id, username, email, role FROM profiles WHERE email = 'testworker@example.com';
   ```
5. Contact support with:
   - Error message
   - Browser console logs
   - Supabase function logs
   - Screenshot of Employees form

