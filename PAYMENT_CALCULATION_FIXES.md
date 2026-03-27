# Payment Calculation & History Management - Fixes Applied

## Issues Fixed

### 1. Payment Calculation Repeating Old Deductions ✅
**Problem:** After saving a payment, the next payment calculation still showed the same acomptes and absences that were already paid.

**Root Cause:** The calculation functions were including ALL acomptes/absences for the employee, with no way to distinguish which ones had already been paid out.

**Solution Implemented:**
- Modified `calculateNetSalary()` function to only include acomptes/absences created **AFTER the last salary payment**
- Modified `calculatePercentageEarnings()` function with the same logic
- When a salary payment is created with `handleValidatePayment()`, future calculations will exclude older deductions

**How It Works:**
```
Timeline:
- Jan 1: Create acompte 1,000 DA
- Jan 2: Create absence 2,000 DA
- Jan 10: Click "Valider le Paiement" → Saves salary with these deductions
- Jan 11: Create new acompte 500 DA
- Jan 15: Click "Paiement" again → NOW SHOWS:
  - Base salary
  - Acompte: 500 DA (only the new one)
  - Absence: 0 DA (the old 2,000 was already paid)
  - Net: salary - 500 DA
```

### 2. Delete Button for Payments/Acomptes/Absences ✅
**Problem:** No way to delete acomptes, absences, or salary payments from the Historique interface.

**Solution Implemented:**
- Added `handleDeletePayment()` function to delete any payment record
- Added delete button (trash icon) to each payment item in the Historique modal
- Delete button appears for acomptes and absences (not for salary payments)
- Requires confirmation before deletion
- Auto-refreshes the history after deletion

**UI Changes:**
```
Payment/Acompte/Absence Item:
┌────────────────────────────────────────┐
│ Acompte [ACOMPTE badge]                │
│ Description: ...                   [🗑]│
│ Date: ...                              │
│ Amount: +1 000,00 DA                   │
└────────────────────────────────────────┘
```

The trash icon is only shown for acomptes/absences, not for salary payments.

---

## Code Changes

### Modified Functions

#### 1. `calculateNetSalary(employeeId)`
**Before:** Included all acomptes/absences for the employee
**After:** Only includes acomptes/absences created after the last salary payment
```typescript
// Get the date of the last salary payment
const lastSalaryPayment = payments
  .filter(p => p.employeeId === employeeId && p.type === 'salary')
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

const lastPaymentDate = lastSalaryPayment ? new Date(lastSalaryPayment.date) : new Date('2000-01-01');

// Only include acomptes and absences created after the last salary payment
const empPayments = payments.filter(p => 
  p.employeeId === employeeId && 
  (p.type === 'acompte' || p.type === 'absence') &&
  new Date(p.date) > lastPaymentDate
);
```

#### 2. `calculatePercentageEarnings(employeeId)`
**Before:** Included all deductions
**After:** Only includes deductions created after the last salary payment
```typescript
// Same logic as above - filters by date compared to last salary payment
```

#### 3. `handleValidatePayment()`
**Before:** Just created salary payment record
**After:** 
- Creates salary payment record
- Includes count of deductions in description
- Shows success alert with net amount to pay
- Properly closes modal and refreshes data
```typescript
description: `Paiement du salaire - Déductions incluses: ${deductionIds.length}`,
```

#### 4. `handleDeletePayment(paymentId)` - NEW
**Purpose:** Delete any acompte, absence, or salary payment
```typescript
const handleDeletePayment = async (paymentId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement/acompte/absence?')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('employee_payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('Error deleting payment:', error);
      alert('Erreur lors de la suppression');
      return;
    }

    await fetchData();
    alert('Supprimé avec succès!');
  } catch (error) {
    console.error('Error:', error);
    alert('Une erreur s\'est produite');
  }
};
```

### UI Components Updated

#### History Modal - Payment Items
**Added:**
- Delete button (trash icon) with red styling
- Button only visible for acomptes/absences (not salary payments)
- Confirmation dialog before deletion
- Auto-refresh after deletion

```tsx
{payment.type !== 'salary' && (
  <button
    onClick={() => handleDeletePayment(payment.id)}
    className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs"
  >
    <Trash2 size={14} />
  </button>
)}
```

---

## User Workflow

### Payment Calculation - New Flow
1. **Create Acompte:** Jan 1, 1,000 DA
2. **Create Absence:** Jan 2, 2,000 DA
3. **Click "Paiement":** Shows calculation:
   - Salary: 50,000 DA
   - Acomptes: -1,000 DA
   - Absences: -2,000 DA
   - Net: 47,000 DA
4. **Click "Valider le Paiement":** Saves salary payment
5. **Next Day - Click "Paiement" Again:** Shows calculation:
   - Salary: 50,000 DA
   - Acomptes: 0 DA (old ones already paid)
   - Absences: 0 DA (old ones already paid)
   - Net: 50,000 DA

### Delete Payment - New Workflow
1. **Open "Historique"** for a worker
2. **See all payments/acomptes/absences** in history
3. **Find the one to delete** (e.g., mistaken acompte)
4. **Click trash icon** on that item
5. **Confirm deletion** in popup
6. **Payment is deleted** and history updates automatically

---

## Testing Checklist

✅ Create acompte for worker
✅ Create absence for worker
✅ Click "Paiement" button - shows calculation with both
✅ Click "Valider le Paiement" - saves salary payment
✅ Click "Paiement" again - shows 0 for acomptes/absences
✅ Create new acompte
✅ Click "Paiement" - shows only the new acompte, not old ones
✅ Open "Historique" - see delete buttons on acomptes/absences
✅ Click delete button - confirms deletion
✅ Delete successful - history refreshes
✅ Salary payments don't show delete button

---

## Notes

- The solution uses date comparison instead of a database `paid` column
- This approach works immediately without database migration
- The `paid` column migration is still available in `EMPLOYEE_PAYMENTS_MIGRATION.sql` for when you want full tracking
- Deletion is permanent - consider adding audit logs later if needed
- All times are in browser timezone (current date behavior)

