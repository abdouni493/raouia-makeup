# Quick Delete Buttons Testing Checklist

## Before Testing
- Open browser DevTools: **F12** or **Ctrl+Shift+I**
- Go to **Console** tab
- Keep console visible while testing

## Test All Delete Buttons

### 1. Delete Service ✅
**Location**: Configuration → Prestations → Services section
**Steps**:
1. Hover over a service card
2. Click trash icon
3. Watch console for: `[DELETE] Starting service deletion`
4. Click "Supprimer"
5. Expected: 
   - Console shows: `[DELETE SUCCESS] service deleted successfully`
   - Alert appears: "Service supprimé avec succès"
   - Service disappears from list

### 2. Delete Prestation ✅
**Location**: Configuration → Prestations → Prestations section
**Steps**:
1. Hover over a prestation card
2. Click trash icon
3. Watch console for: `[DELETE] Starting prestation deletion`
4. Click "Supprimer"
5. Expected:
   - Console shows: `[DELETE SUCCESS] prestation deleted successfully`
   - Alert appears: "Prestation supprimé avec succès"
   - Prestation disappears from list

### 3. Delete Expense ✅
**Location**: Expenses → (click trash icon on expense card)
**Steps**:
1. Find an expense in the list
2. Click trash icon
3. Watch console for: `[DELETE] Starting expense deletion`
4. Click "Supprimer"
5. Expected:
   - Console shows: `[DELETE SUCCESS] Expense deleted successfully`
   - Alert appears: "Dépense supprimée avec succès"
   - Expense disappears from list

### 4. Delete Worker ✅
**Location**: Employees
**Steps**:
1. Find a worker in the list
2. Click trash icon (red circle with trash)
3. Watch console for: `[DELETE] Starting employee deletion`
4. Click "Supprimer"
5. Expected:
   - Console shows multiple messages:
     - `[DELETE] Deleting associated payments...`
     - `[DELETE] Payments deleted successfully`
     - `[DELETE] Deleting reservation worker records...`
     - `[DELETE] Reservation workers deleted successfully`
     - `[DELETE] Deleting employee profile...`
     - `[DELETE SUCCESS] Employee deleted successfully`
   - Alert appears: "Employé supprimé avec succès"
   - Worker disappears from list

### 5. Delete Supplier ✅
**Location**: Inventory → Suppliers tab
**Steps**:
1. Find a supplier card
2. Click trash icon
3. Watch console for: `[DELETE] Starting supplier deletion`
4. Click "Supprimer"
5. Expected:
   - Console shows: `[DELETE SUCCESS] supplier deleted successfully`
   - Alert appears: "Fournisseur supprimé avec succès"
   - Supplier disappears from list

### 6. Delete Purchase ✅
**Location**: Inventory → Purchases tab
**Steps**:
1. Find a purchase card
2. Click trash icon
3. Watch console for: `[DELETE] Starting purchase deletion`
4. Click "Supprimer"
5. Expected:
   - Console shows: `[DELETE SUCCESS] purchase deleted successfully`
   - Alert appears: "Achat supprimé avec succès"
   - Purchase disappears from list

### 7. Delete Invoice ✅
**Location**: Inventory → Invoices tab
**Steps**:
1. Find an invoice card
2. Click trash icon
3. Watch console for: `[DELETE] Starting invoice deletion`
4. Click "Supprimer"
5. Expected:
   - Console shows: `[DELETE SUCCESS] invoice deleted successfully`
   - Alert appears: "Facture supprimé avec succès"
   - Invoice disappears from list

## Error Testing

### Test 1: Cancel Delete
**Steps**:
1. Click delete button on any item
2. Click "Annuler"
3. Expected:
   - Modal closes
   - No console messages
   - Item still exists in list

### Test 2: Force Error (Optional)
**Steps**:
1. Open DevTools Network tab
2. Go offline (check "offline" in Network tab)
3. Try to delete an item
4. Expected:
   - Console shows: `[DELETE ERROR]` or `[DELETE CRITICAL ERROR]`
   - Alert shows error message
   - Item NOT deleted

## Console Search Tips

**Filter console for deletions**:
- Type in console search: `[DELETE]` - shows all delete operations
- Type in console search: `[DELETE ERROR]` - shows only errors
- Type in console search: `[DELETE SUCCESS]` - shows successful deletes

## Success Criteria

✅ **All buttons working if**:
- Each delete shows confirmation modal
- Console shows appropriate [DELETE] messages
- Success alert appears after clicking "Supprimer"
- Item disappears from UI
- List refreshes automatically
- No error messages in console

❌ **Problem if**:
- Modal doesn't appear
- Console shows no [DELETE] messages
- No alert appears
- Item doesn't disappear
- Console shows [DELETE ERROR]
- Page needs refresh to see changes

## Report Issues

If a button doesn't work:
1. **Screenshot console output** showing the error
2. **Note the table name** (services, expenses, etc.)
3. **Check database** - Run the SQL verification script
4. **Share [DELETE ERROR] message** from console

---

**Test Date**: ____________  
**Tested By**: ____________  
**All Tests Passed**: ☐ YES ☐ NO

If NO, which button failed? _______________________
What was the console error? _______________________
