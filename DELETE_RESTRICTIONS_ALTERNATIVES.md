# Delete Restrictions - Alternative Solutions

## The Problem
You're getting permission denied errors when trying to delete purchases.

## Solution Comparison

### Option 1: Allow All Authenticated Users (EASIEST) ⭐ RECOMMENDED
**Script:** `REMOVE_DELETE_RESTRICTIONS.sql`

**What it does:**
- Anyone logged in can delete anything
- No role restrictions

**When to use:**
- You want simplest solution
- All staff members should be able to delete
- You'll add audit logging later

**Risk:** Medium (anyone can delete)

**SQL:**
```sql
CREATE POLICY "Allow authenticated delete purchases"
  ON purchases FOR DELETE USING (auth.role() = 'authenticated');
```

---

### Option 2: Allow Only Admins (RESTRICTIVE)
**For:** Fine-grained control

**When to use:**
- You want only admins to delete
- You want secure deletion

**Risk:** Low (only admins can delete)

**SQL:**
```sql
DROP POLICY IF EXISTS "Admin manage purchases" ON purchases;

CREATE POLICY "Admin can delete purchases"
  ON purchases FOR DELETE 
  USING (auth.jwt() ->> 'role' = 'admin');
```

---

### Option 3: Allow Role-Based Deletion (BALANCED)
**For:** Different permissions for different roles

**When to use:**
- Admins AND managers can delete
- Workers cannot delete

**Risk:** Low-Medium (role-based)

**SQL:**
```sql
CREATE POLICY "Managers and admins can delete"
  ON purchases FOR DELETE 
  USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));
```

---

### Option 4: Disable RLS Completely (DANGEROUS!)
**For:** Development/testing only

**When to use:**
- Testing purposes ONLY
- Temporary development work

**Risk:** HIGH (no security!)

**SQL:**
```sql
-- DISABLE RLS ON ALL TABLES - USE WITH CAUTION!
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

---

## Recommended Solution

**Use Option 1: Allow All Authenticated Users**

Why?
- ✅ Simple to implement
- ✅ Works immediately
- ✅ Still requires login (basic security)
- ✅ Easy to restrict later if needed
- ✅ Good starting point

If you need more control later, you can always:
1. Drop the permissive policy
2. Add role-based restrictions

---

## How to Choose

**Ask yourself:**

| Question | Answer | Solution |
|----------|--------|----------|
| Who should be able to delete? | Everyone | Option 1 |
| Who should be able to delete? | Only admins | Option 2 |
| Who should be able to delete? | Different roles | Option 3 |
| Just testing? | Yes | Option 4 |

---

## Implementation Steps (All Options)

### For All Options:

1. **Open Supabase SQL Editor**
   - Go to app.supabase.com
   - Select project
   - Click SQL Editor

2. **Copy the SQL for your chosen option**

3. **Paste in editor**

4. **Click Run**

5. **Verify with test delete**

---

## Verification

After running any option, verify with:

```sql
-- Check if delete works
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'purchases'
ORDER BY policyname;

-- Test deletion
DELETE FROM purchases 
WHERE id = '<test-id>' 
RETURNING *;
```

---

## Reverting Changes

### To Go Back to Admin-Only

```sql
-- Drop new policies
DROP POLICY IF EXISTS "Allow authenticated delete purchases" ON purchases;
DROP POLICY IF EXISTS "Allow authenticated delete suppliers" ON suppliers;
-- ... etc

-- Recreate admin-only
CREATE POLICY "Admin manage purchases" 
  ON purchases FOR ALL USING (is_admin());
-- ... etc
```

---

## Complete SQL for Each Option

### Option 1: Allow All Authenticated Users (RECOMMENDED)

**File:** `REMOVE_DELETE_RESTRICTIONS.sql` (already provided)

### Option 2: Allow Only Admins

**Use the original RLS policies - they already allow admin-only delete**

Or restore from backup if you deleted them.

### Option 3: Role-Based Example

```sql
-- Allow managers and admins to delete purchases
DROP POLICY IF EXISTS "Allow authenticated delete purchases" ON purchases;

CREATE POLICY "Managers and admins can delete purchases"
  ON purchases FOR DELETE 
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'manager')
  );
```

### Option 4: Disable RLS (DANGEROUS - DEVELOPMENT ONLY)

```sql
-- DISABLE ALL RLS - USE ONLY FOR TESTING!
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestations DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE worker_daily_payment_periods DISABLE ROW LEVEL SECURITY;
ALTER TABLE worker_reservation_payments DISABLE ROW LEVEL SECURITY;

-- RE-ENABLE RLS AFTER TESTING
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

---

## My Recommendation

### For Quick Fix Now:
→ Use **Option 1** (`REMOVE_DELETE_RESTRICTIONS.sql`)
- Works immediately
- Simple to understand
- Can be restricted later

### For Better Security Later:
→ Plan to use **Option 3** (role-based)
- Keep admins unrestricted
- Make managers able to delete
- Workers cannot delete

---

## Support

Need help choosing?

**Ask yourself:**
- Am I testing? → Use Option 1 (test now, restrict later)
- Production app? → Use Option 3 (role-based)
- Just want it to work? → Use Option 1

---

## Summary Table

| Option | Easiest | Safest | Recommended |
|--------|---------|--------|-------------|
| 1 - All Users | ✅ Yes | ❌ No | ✅ Yes |
| 2 - Admins Only | ❌ No | ✅ Yes | ❌ No |
| 3 - Role-Based | ⚠️ Medium | ✅ Yes | ✅ Better |
| 4 - No RLS | ✅ Yes | ❌ NO | ❌ Never |

**Best for now:** Option 1
**Best for future:** Option 3

---

**Ready to proceed? Use the SQL from `REMOVE_DELETE_RESTRICTIONS.sql`** 🚀
