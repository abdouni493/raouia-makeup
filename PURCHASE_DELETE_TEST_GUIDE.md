# Purchase Delete Button - Quick Test Guide

## How to Test the Fix

### Step 1: Open Browser DevTools
- Press **F12** or **Ctrl+Shift+I**
- Go to the **Console** tab
- Keep it visible while testing

### Step 2: Navigate to Inventory
1. Open the application
2. Go to **Inventory** → **Purchases tab**

### Step 3: Delete a Purchase

**Steps:**
1. Find a purchase in the list
2. Hover over it to see the trash icon
3. Click the **trash icon** (bottom right of the card)
4. A modal appears asking to confirm deletion
5. Click **"Supprimer"** (Delete) button

### Step 4: Check Console Output

**SUCCESS - You should see these messages:**
```
[DELETE] Starting purchase deletion: abc123def
[DELETE] Deleting from table: purchases with id: abc123def
[DELETE] Delete response: { data: [{...}], error: null, rowCount: 1 }
[DELETE SUCCESS] purchase deleted successfully from purchases
[DELETE] purchase removed from UI successfully
```

**Then:**
- ✅ Modal closes
- ✅ Purchase disappears from list
- ✅ No alert appears (we removed it)
- ✅ List updates instantly

### If It Fails

**ERROR MESSAGE 1 - RLS Policy Issue:**
```
[DELETE WARNING] Delete returned no rows - RLS policies may be blocking deletion
[DELETE] Refetching data after error...
```

**Alert shows:** "Erreur lors de la suppression: La suppression a échoué - vérifiez vos permissions"

**What to do:**
1. Verify your user is an admin in the `profiles` table
2. Check the `role` field is `'admin'` or `'super_admin'`
3. Run the RLS policy fix if needed

### If It Fails - ERROR MESSAGE 2 - Database Error:
```
[DELETE ERROR] Failed to delete purchase: {...error details...}
[DELETE CRITICAL ERROR] purchase: {...}
```

**What to do:**
1. Check the error details in the console
2. Verify the purchase ID exists
3. Check database connectivity

### Console Filter Tips

**Filter to see only DELETE messages:**
1. Click the input box at the bottom of console
2. Type: `[DELETE]`
3. Press Enter

This will show only deletion-related logs.

## Success Criteria

✅ **Delete works if:**
- Console shows `[DELETE SUCCESS]`
- No `[DELETE ERROR]` messages
- Purchase disappears from UI
- List updates instantly
- No page refresh needed

❌ **Delete fails if:**
- Console shows `[DELETE WARNING]` or `[DELETE ERROR]`
- Item is still in the list after confirmation
- Error alert appears
- Page needs refresh to reflect changes

## Compare With Other Delete Functions

### Delete Supplier
Same process, look for `[DELETE] Starting supplier deletion:`

### Delete Invoice
Same process, look for `[DELETE] Starting invoice deletion:`

All three now use the same reliable deletion pattern.

## What Changed

| Aspect | Before | Now |
|--------|--------|-----|
| Uses `.select()` on delete | ❌ No | ✅ Yes |
| Detects RLS blocks | ❌ Silent failure | ✅ Error message |
| Updates UI | Slow (refetch) | Fast (instant) |
| Success alert | ✅ Yes | ❌ Removed |
| Console logging | Basic | Detailed |

## Tested Against

This fix follows the exact pattern used in **Employees.tsx** which successfully deletes employees and all related records.

---

**Need help?** Check the browser console - it will tell you exactly what went wrong!
