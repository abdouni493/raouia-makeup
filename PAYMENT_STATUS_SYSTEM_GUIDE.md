# Payment Status System - Complete Implementation

## Overview
The system now tracks payment status for acomptes (advances) and absences, automatically managing their payment state through the salary payment workflow.

---

## Key Features Implemented

### 1. Status Field ✅
Each acompte/absence now has a status:
- **unpaid** (default for new records)
- **paid** (automatically set when included in a salary payment)

### 2. Smart Payment Calculation ✅
The "Calcul du Paiement" modal now:
- Only displays **unpaid** acomptes and absences
- Automatically excludes paid/deducted items
- Prevents duplicate deductions

### 3. Automatic Status Updates ✅
When user clicks "Valider le Paiement":
- All included acomptes/absences change from **unpaid → paid**
- Salary payment record is created
- Next calculation only shows new unpaid items

### 4. Organized History Interface ✅
History modal now shows three separate sections:
1. **Acomptes** (blue) - with status badges
2. **Absences** (red) - with status badges  
3. **Paiements de Salaire** (green) - all marked as PAYÉ
Each section has delete buttons (can delete any item)

---

## User Workflow

### Creating an Acompte
```
1. Click "Acompte" button
2. Enter amount and description
3. Click "Enregistrer l'acompte"
→ Status automatically set to "unpaid"
```

### Creating an Absence
```
1. Click "Absence" button
2. Enter amount and description
3. Click "Enregistrer l'absence"
→ Status automatically set to "unpaid"
```

### Payment Calculation
```
1. Click "Paiement" button
2. See ONLY unpaid deductions:
   - Salaire: 50,000 DA
   - Acomptes: -1,000 DA (unpaid)
   - Absences: -2,000 DA (unpaid)
   - Net: 47,000 DA
3. Click "Valider le Paiement"
→ All unpaid items → paid
→ Salary payment saved
```

### Next Payment
```
1. Create new acompte: 500 DA (unpaid)
2. Click "Paiement"
3. See calculation:
   - Salaire: 50,000 DA
   - Acomptes: -500 DA (new one, unpaid)
   - Absences: 0 DA (old ones already paid)
   - Net: 49,500 DA
→ Previous deductions NOT repeated
```

### Viewing History
```
1. Click "Historique"
2. See three organized sections:
   
   ACOMPTES Section:
   ├─ Acompte 1,000 DA [PAYÉ] (green badge) [🗑]
   └─ Acompte 500 DA [NON PAYÉ] (yellow badge) [🗑]
   
   ABSENCES Section:
   ├─ Absence 2,000 DA [PAYÉ] (green badge) [🗑]
   └─ (no unpaid absences)
   
   PAIEMENTS DE SALAIRE Section:
   └─ Paiement 47,000 DA [PAYÉ] (green badge) [🗑]
```

---

## Database Schema

### SQL Migration Required
Run the SQL file: `ADD_STATUS_COLUMN_MIGRATION.sql`

This adds:
- `status` column (VARCHAR, default 'unpaid')
- CHECK constraint to validate values
- Indexes for performance
- Automatic updates for existing data

### Final Table Structure
```sql
CREATE TABLE employee_payments (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES profiles(id),
  amount DECIMAL(10, 2),
  type VARCHAR(50), -- 'salary', 'acompte', 'absence'
  description TEXT,
  date DATE,
  status VARCHAR(20) DEFAULT 'unpaid', -- NEW FIELD
  created_at TIMESTAMP,
  
  CONSTRAINT check_status CHECK (status IN ('paid', 'unpaid'))
);

-- Indexes
CREATE INDEX idx_employee_payments_status ON employee_payments(status);
CREATE INDEX idx_employee_payments_emp_status ON employee_payments(employee_id, status);
```

---

## Code Changes

### 1. Types Updated (types.ts)
```typescript
export interface EmployeePayment {
  id: string;
  employeeId: string;
  amount: number;
  type: 'salary' | 'acompte' | 'absence';
  description: string;
  date: string;
  status?: 'paid' | 'unpaid'; // NEW FIELD
  paid?: boolean; // Legacy
}
```

### 2. Creating New Acompte/Absence
When `handleAddPaymentAction()` is called:
```typescript
const paymentData = {
  employee_id: employeeId,
  type: 'acompte', // or 'absence'
  amount: Number(paymentFormData.amount),
  description: paymentFormData.description,
  date: paymentFormData.date,
  status: 'unpaid' // Always unpaid initially
};
```

### 3. Payment Calculation Logic
Functions now filter unpaid items:
```typescript
const empPayments = payments.filter(p => 
  p.employeeId === employeeId && 
  (p.type === 'acompte' || p.type === 'absence') &&
  new Date(p.date) > lastPaymentDate &&
  (p.status === 'unpaid' || !p.status) // Only unpaid
);
```

### 4. Marking Paid
When `handleValidatePayment()` is called:
```typescript
// Mark all unpaid deductions as paid
for (const deduction of unpaidDeductions) {
  await supabase
    .from('employee_payments')
    .update({ status: 'paid' })
    .eq('id', deduction.id);
}
```

### 5. History Display
Three organized sections in modal:
- **Acomptes**: Filtered by `type === 'acompte'`
- **Absences**: Filtered by `type === 'absence'`
- **Salaires**: Filtered by `type === 'salary'`

Each shows status badge:
- **PAYÉ** (green) when `status === 'paid'`
- **NON PAYÉ** (yellow) when `status === 'unpaid'`

---

## Implementation Steps

### Step 1: Apply SQL Migration
```bash
# Connect to your Supabase database
# Run: ADD_STATUS_COLUMN_MIGRATION.sql
```

### Step 2: Verify Column Created
```sql
SELECT * FROM employee_payments LIMIT 1;
-- Should show 'status' column
```

### Step 3: Test the Feature
1. Create new acompte → status should be 'unpaid'
2. Check payment calculation → should only show unpaid
3. Click "Valider le Paiement" → unpaid items should → paid
4. Create new acompte → should not include old paid ones
5. Check history → should show organized sections with status badges

### Step 4: Delete Old Records (Optional)
```sql
-- Clean up any test data
DELETE FROM employee_payments 
WHERE status IS NULL AND type IN ('acompte', 'absence');
```

---

## Status Badge Styles

### In Payment Modal
```
Payment Calculation Display:
├─ Acompte: 1,000 DA [UNPAID - yellow badge]
└─ Absence: 2,000 DA [UNPAID - yellow badge]
```

### In History Modal
```
ACOMPTES (Blue Section):
├─ [PAYÉ - green badge] 1,000 DA (done)
└─ [NON PAYÉ - yellow badge] 500 DA (pending)

ABSENCES (Red Section):
└─ [PAYÉ - green badge] 2,000 DA (done)

PAIEMENTS DE SALAIRE (Green Section):
└─ [PAYÉ - green badge] 47,000 DA (salary)
```

---

## Data Integrity

### Status Values
- `'paid'` - Deduction was processed in a salary payment
- `'unpaid'` - Deduction not yet processed

### Constraints
- Status is always lowercase
- Valid values: only 'paid' or 'unpaid'
- Default is 'unpaid' for new records
- Database enforces via CHECK constraint

### Backwards Compatibility
- Existing records get `status = 'unpaid'`
- Code checks `(status === 'unpaid' || !status)` to handle null
- Salary payments always `status = 'paid'`

---

## Delete Functionality

### What Can Be Deleted
✅ Acomptes (any status)
✅ Absences (any status)
✅ Salary payments

### Delete Button
- Appears in History modal for all items
- Requires confirmation: "Êtes-vous sûr..."
- Permanently removes record from database
- Auto-refreshes history

### Effect of Deletion
- Removed from payment calculations
- Won't appear in history anymore
- Changes salary calculations for next month

---

## Testing Checklist

- [ ] SQL migration applied successfully
- [ ] New acompte created with status 'unpaid'
- [ ] New absence created with status 'unpaid'
- [ ] Payment calculation shows only unpaid items
- [ ] "Valider le Paiement" marks items as paid
- [ ] Next payment doesn't include old paid items
- [ ] History shows organized sections
- [ ] Status badges display correctly (PAYÉ/NON PAYÉ)
- [ ] Delete buttons work for all types
- [ ] Deletion refreshes history automatically
- [ ] Salary calculations update after deletion

---

## SQL Migration File Location
`/ADD_STATUS_COLUMN_MIGRATION.sql`

Run this in Supabase SQL Editor before using the new features.

---

## Notes

⚠️ **Important**: Status field must be added to database before using new features
✅ Code is ready and deployed
✅ Type definitions updated
✅ Calculation logic enhanced
✅ UI organized and improved
❌ Database migration still needed
