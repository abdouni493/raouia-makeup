# QUICK ACTION: Fix Email & Password Issues

## What To Do Right Now

### Step 1: Add Email Column to Database (2 minutes)

**Go to:** Supabase Console → SQL Editor → New Query

**Copy & Paste this:**
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);
```

**Then:** Click Execute

**Result:** You should see "Query executed successfully"

---

### Step 2: Code Is Already Fixed ✅

**No action needed!** The following changes are already applied:

1. ✅ `src/components/Employees.tsx` line ~445 - Email now displays in edit modal
2. ✅ `src/components/Employees.tsx` line ~301 - Email now saves to database

**Just deploy/rebuild your app!**

---

### Step 3: Test It Works (2 minutes)

1. Go to **Employees** tab
2. Create a **new worker** with:
   - Name: Test Worker
   - Email: `test@example.com`
   - Password: `TestPass123`
   - Other info: optional
3. Click **Enregistrer** (Save)
4. Click **Modifier** (Edit) on that worker
5. **Check:** Email field shows `test@example.com` ✅
6. Change any field (e.g., phone)
7. Click **Enregistrer** (Save)
8. Click **Modifier** again
9. **Check:** Email is still there ✅

---

## What Was Wrong

❌ **Before:** Email wasn't displayed in edit modal (showed empty)
❌ **Before:** Email wasn't saved to database
❌ **Before:** Database table missing email column

✅ **Now:** Email displays correctly
✅ **Now:** Email saves to database
✅ **Now:** Database table has email column

---

## About Password

**Password Note:** Password field in edit modal is intentionally empty because:
- Passwords are stored in Supabase Auth (not in database)
- You can't see stored passwords for security reasons
- Workers change password in their profile settings (Paramètres tab)

To reset a worker's password:
1. They click "Forgot Password" on login
2. Or admin can remove user and recreate account with new password

---

## Done! 🎉

That's it! 

1. Run the SQL in Supabase ✅
2. Deploy the code (already updated) ✅
3. Test it ✅

All fixed!

---

## Detailed Info

For full details, read: [FIX_EMAIL_PASSWORD_STORAGE.md](FIX_EMAIL_PASSWORD_STORAGE.md)
