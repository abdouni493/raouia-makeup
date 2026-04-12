# 🔓 Remove Delete Restrictions - Step by Step Guide

## Problem
You're getting: `Erreur lors de la suppression: La suppression a échoué - vérifiez vos permissions`

This means RLS policies are blocking deletion.

## Solution
Remove the RLS delete restrictions so all authenticated users can delete.

---

## How to Apply the Fix

### Step 1: Open Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)

### Step 2: Create a New Query
1. Click **New Query**
2. Copy the SQL from `REMOVE_DELETE_RESTRICTIONS.sql`
3. Paste it in the editor

### Step 3: Run the Query
1. Click **Run** button (or Ctrl+Enter)
2. Wait for it to complete
3. You should see: ✅ Success

### Step 4: Verify
The query will show all your RLS policies. Look for:
- ✅ New policies with names like "Allow authenticated delete..."
- ✅ Old admin-only policies are GONE

---

## What This Does

### REMOVES
- ❌ `Admin manage purchases`
- ❌ `Admin manage suppliers`
- ❌ `Admin manage expenses`
- ❌ `Admin manage prestations`
- ❌ `Admin manage services`
- ❌ Etc. (all admin-only delete policies)

### ADDS
- ✅ `Allow authenticated delete purchases`
- ✅ `Allow authenticated delete suppliers`
- ✅ `Allow authenticated delete expenses`
- ✅ Etc. (permissive delete for all users)

### KEEPS (Unchanged)
- ✅ All SELECT policies (can still read)
- ✅ All INSERT policies (can still create)
- ✅ All UPDATE policies (can still edit)
- ✅ Public read access where applicable

---

## Result After Running

### Before Fix
```
Click Delete → Permission Error → Item stays
❌ Cannot delete
```

### After Fix
```
Click Delete → Item deletes instantly
✅ Delete works for all authenticated users
```

---

## Testing the Fix

### Step 1: Navigate to Delete
Go to: **Inventory → Purchases tab**

### Step 2: Delete a Purchase
1. Click trash icon on any purchase
2. Click **"Supprimer"**
3. Expected: **Item disappears instantly** ✅

### Step 3: Check Console
Press F12 → Console, you should see:
```
[DELETE] Starting purchase deletion: abc-123
[DELETE] Delete response: { data: [{...}], error: null, rowCount: 1 }
[DELETE SUCCESS] purchase deleted successfully
```

**NO ERROR = ✅ FIX WORKED!**

---

## Security Considerations

### Before (Restrictive)
- ❌ Only admins could delete
- ✅ More secure
- ❌ Regular users couldn't delete anything

### After (Permissive)
- ✅ All authenticated users can delete
- ❌ Less secure
- ✅ No permission issues

### Risk Level
**MEDIUM** - Anyone logged in can delete data. Consider:
1. Keeping regular users in **worker** role
2. Making only managers have **admin** role
3. Adding audit logging for deletions

---

## If You Want to Restrict Delete Again

### Option 1: Go Back to Admin-Only
1. Drop the new permissive policies
2. Recreate the admin-only policies
3. Run this SQL:

```sql
-- Drop permissive policies
DROP POLICY IF EXISTS "Allow authenticated delete purchases" ON purchases;
DROP POLICY IF EXISTS "Allow authenticated delete suppliers" ON suppliers;
-- ... etc

-- Recreate admin-only policies
CREATE POLICY "Admin manage purchases" 
  ON purchases FOR ALL USING (is_admin());
-- ... etc
```

### Option 2: Restrict by Role
```sql
CREATE POLICY "Only managers can delete purchases"
  ON purchases FOR DELETE USING (auth.jwt() ->> 'role' = 'manager');
```

### Option 3: Contact Support
If you need help reverting changes, the fix can be reversed by reapplying the original RLS policies.

---

## Troubleshooting

### Still Getting Permission Error?

**Step 1: Verify Policies Were Dropped**
1. Go to Supabase Dashboard
2. Go to **Authentication** → **Policies**
3. Look for the table (e.g., "purchases")
4. Check if old policies are gone

**Step 2: Clear Browser Cache**
1. Press Ctrl+Shift+Delete
2. Clear all cache
3. Refresh the app
4. Try deleting again

**Step 3: Check Supabase Status**
1. Go to [https://status.supabase.com](https://status.supabase.com)
2. Make sure there are no outages

**Step 4: Run SQL Verification**

```sql
-- Check all policies on purchases table
SELECT * FROM pg_policies 
WHERE tablename = 'purchases' 
AND schemaname = 'public';

-- Should show: "Allow authenticated delete purchases"
-- Should NOT show: "Admin manage purchases"
```

---

## Verification SQL

Run this query to verify the fix worked:

```sql
-- List all delete policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%delete%'
ORDER BY tablename;

-- Should show all "Allow authenticated delete..." policies
```

---

## File Location

The complete SQL script is here:
**`REMOVE_DELETE_RESTRICTIONS.sql`**

---

## Next Steps

1. ✅ Open Supabase Dashboard
2. ✅ Go to SQL Editor
3. ✅ Copy and run the SQL from `REMOVE_DELETE_RESTRICTIONS.sql`
4. ✅ Wait for success ✅
5. ✅ Test delete in the app
6. ✅ Done! 🎉

---

## Summary

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Copy SQL | Code copied ✅ |
| 2 | Paste in Supabase | SQL ready ✅ |
| 3 | Run | Policies updated ✅ |
| 4 | Test delete | Item disappears ✅ |
| 5 | Check console | [DELETE SUCCESS] ✅ |

---

## Questions?

**Q: Will this affect other operations?**
A: No - only DELETE permissions change. SELECT, INSERT, UPDATE remain unchanged.

**Q: Can I undo this?**
A: Yes - revert by restoring the admin-only policies.

**Q: Who can delete after this?**
A: Any authenticated user (anyone logged in).

**Q: Is this permanent?**
A: Yes, until you change it again in Supabase.

---

**Ready?** Copy the SQL from `REMOVE_DELETE_RESTRICTIONS.sql` and run it in Supabase! 🚀
