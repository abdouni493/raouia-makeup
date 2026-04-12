# Delete Buttons - Error Debugging Guide

## Console Error Messages

When a delete fails, you'll see one of these in the console:

### Error Pattern 1: Authentication Error
```
[DELETE ERROR] Failed to delete service:
PostgrestAPIError: new row violates row-level security policy for table "services"
```
**Meaning**: Your Supabase RLS policies don't allow DELETE
**Solution**: Check Supabase → Authentication → Policies → Allow DELETE for table

### Error Pattern 2: Foreign Key Constraint
```
[DELETE ERROR] Failed to delete supplier:
PostgrestAPIError: update or delete on table "suppliers" violates foreign key constraint
```
**Meaning**: There are purchases linked to this supplier
**Solution**: Delete purchases first, or enable CASCADE DELETE in database

### Error Pattern 3: Not Found
```
[DELETE ERROR] Failed to delete prestation:
PostgrestAPIError: No rows found
```
**Meaning**: The item doesn't exist (already deleted?)
**Solution**: Refresh page to sync with database

### Error Pattern 4: Network Error
```
[DELETE CRITICAL ERROR] expenses deletion failed:
TypeError: Failed to fetch
```
**Meaning**: No internet or server unreachable
**Solution**: Check internet, wait, then try again

### Error Pattern 5: Invalid UUID
```
[DELETE ERROR] Failed to delete service:
PostgrestAPIError: invalid input syntax for type uuid
```
**Meaning**: Item ID is malformed
**Solution**: This shouldn't happen - check data in database

---

## Step-by-Step Debugging

### Step 1: Identify the Problem
Open DevTools Console and search for `[DELETE ERROR]`

**Example**: 
```
[DELETE] Starting expense deletion: abc123def456
[DELETE ERROR] Failed to delete expense: {error details}
[DELETE CRITICAL ERROR] expenses deletion failed: {error details}
```

### Step 2: Check RLS Policies
Go to Supabase Dashboard:
1. Click your project
2. Go to **Authentication** → **Policies**
3. Find table with problem (e.g., expenses)
4. Click on it to see DELETE policy
5. Should show: `(auth.uid() = user_id)` or similar

**If missing DELETE policy**:
```sql
CREATE POLICY "Users can delete own expenses"
ON expenses
FOR DELETE
USING (auth.uid() = user_id);
```

### Step 3: Check Foreign Keys
Run this SQL in Supabase:

```sql
-- For delete problems with purchases (need to delete first)
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'purchases' 
AND constraint_type = 'FOREIGN KEY';

-- For delete problems with employees
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'employee_payments' 
AND constraint_type = 'FOREIGN KEY';
```

### Step 4: Check for Cascading
If there are child records, they must be deleted first OR database must have CASCADE:

```sql
-- Check if this table has CASCADE on deletes
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_name IN ('employee_payments', 'reservation_workers', 'purchases');

-- To see the full constraint definition:
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE constraint_name LIKE '%_fkey%';
```

### Step 5: Manual Delete Test
Try to delete directly in Supabase:
1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Run: `DELETE FROM expenses WHERE id = 'xxx-xxx';`
4. If this fails with error, it's a database issue not code issue

---

## Common Fix Sequences

### Scenario A: "RLS policy error"
```
PostgrestAPIError: new row violates row-level security policy
```

**Fix**:
1. Go to Supabase Dashboard
2. Authentication → Policies
3. Find the table
4. Add a DELETE policy if missing:
   ```sql
   CREATE POLICY "Enable delete for all"
   ON services
   FOR DELETE
   USING (true);
   ```

### Scenario B: "Foreign key constraint error"
```
PostgrestAPIError: violates foreign key constraint
```

**Example**: Can't delete supplier because purchases exist

**Fix Option 1**: Delete children first
```sql
DELETE FROM purchases WHERE supplier_id = 'supplier-id';
DELETE FROM suppliers WHERE id = 'supplier-id';
```

**Fix Option 2**: Enable CASCADE in database
```sql
-- First backup your data!
-- Then:
ALTER TABLE purchases 
DROP CONSTRAINT purchases_supplier_id_fkey;

ALTER TABLE purchases 
ADD CONSTRAINT purchases_supplier_id_fkey 
FOREIGN KEY (supplier_id) 
REFERENCES suppliers(id) 
ON DELETE CASCADE;
```

### Scenario C: "Item doesn't appear deleted after refresh"
**Cause**: Multiple people/tabs editing, cache not updated

**Fix**:
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or check Supabase directly:
   ```sql
   SELECT id, name FROM services WHERE id = 'xxx-xxx';
   ```
3. If it's still there in database, delete failed (check error)

### Scenario D: "Modal closes but item not deleted"
**Cause**: stopPropagation issue (already fixed in code)

**Check**: In console, should see `[DELETE] Starting` message
- If YES: Problem is in the deletion itself (check other scenarios)
- If NO: Button not working properly (code issue)

---

## SQL Diagnostic Queries

### Check all deletion constraints:
```sql
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

### Check for orphaned records:
```sql
-- Orphaned payments (employee deleted)
SELECT COUNT(*) FROM employee_payments 
WHERE employee_id NOT IN (SELECT id FROM profiles);

-- Orphaned reservation workers
SELECT COUNT(*) FROM reservation_workers 
WHERE worker_id NOT IN (SELECT id FROM profiles) 
   OR reservation_id NOT IN (SELECT id FROM reservations);

-- Orphaned purchases (supplier deleted)
SELECT COUNT(*) FROM purchases 
WHERE supplier_id NOT IN (SELECT id FROM suppliers);
```

### Check RLS policies:
```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('services', 'expenses', 'profiles', 'purchases')
ORDER BY tablename, policyname;
```

---

## Browser Console Filtering

### Show only delete errors:
```javascript
// In console, run:
copy(
  Array.from(
    document.querySelectorAll('.console-message')
  ).filter(el => el.textContent.includes('[DELETE ERROR]'))
  .map(el => el.textContent)
  .join('\n')
)
```

### Clear console and try again:
```javascript
console.clear();
// Now perform delete operation
```

---

## Performance Checks

### If delete is slow (takes >5 seconds):
1. Check internet speed
2. Verify table doesn't have millions of rows:
   ```sql
   SELECT count(*) FROM expenses;
   SELECT count(*) FROM services;
   ```
3. Check if there are orphaned records to clean up
4. Consider adding database indexes

---

## RLS Policy Examples

### Allow owner to delete own records:
```sql
CREATE POLICY "Users can delete own records"
ON expenses
FOR DELETE
USING (auth.uid() = user_id);
```

### Allow admin to delete any record:
```sql
CREATE POLICY "Admin can delete any record"
ON expenses
FOR DELETE
USING (
  SELECT role FROM profiles 
  WHERE id = auth.uid()
) = 'admin'
);
```

### Allow anyone authenticated:
```sql
CREATE POLICY "Authenticated users can delete"
ON services
FOR DELETE
USING (auth.role() = 'authenticated');
```

---

## Final Checklist for Each Delete Issue

- [ ] Check console for exact error message
- [ ] Identify the error type (RLS, FK, etc.)
- [ ] Run SQL diagnostic query
- [ ] Check Supabase RLS policies
- [ ] Verify no foreign key conflicts
- [ ] Try manual delete in Supabase SQL editor
- [ ] Check for orphaned records
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Try delete again and watch console

---

**Last Updated**: March 28, 2026  
**Console Prefixes**: [DELETE], [DELETE SUCCESS], [DELETE ERROR], [DELETE CRITICAL ERROR]
