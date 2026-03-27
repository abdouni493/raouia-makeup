# Worker Payment System - Updated Interface

## Overview

The Employees interface has been updated to properly save and display worker payment amounts based on their payment type (Daily, Monthly, or Percentage).

---

## How It Works

### 1. Creating a New Worker

**Step 1:** Click "Ajouter un employé" button

**Step 2:** Fill in employee information:
- Nom Complet (Full Name)
- Téléphone (Phone)
- Adresse (Address)
- Poste (Role: Employé or Administrateur)

**Step 3:** Select "Type de Paiement" (Payment Type):

#### Option A: Mensuel (Monthly)
```
Type de Paiement: [Mensuel ▼]
Salaire Mensuel (DA): [________________]
Example: 60000
```
- Employee receives a fixed amount each month
- Enters monthly salary in DA (Dinars Algériens)

#### Option B: Journalier (Daily)
```
Type de Paiement: [Journalier ▼]
Salaire Journalier (DA): [________________]
Example: 3000
```
- Employee receives a daily rate
- Enters daily salary in DA

#### Option C: Pourcentage (Percentage)
```
Type de Paiement: [Pourcentage ▼]
Pourcentage (%): [________________]
Example: 30
```
- Employee receives a percentage of services
- Enters commission percentage (0-100)

**Step 4:** Click "Enregistrer" (Save)

---

## What Gets Saved to Database

### Employee Record Structure

When saving, the following data is stored in the `profiles` table:

```sql
{
  id: UUID,
  username: 'john_doe',
  full_name: 'John Doe',
  role: 'worker',
  phone: '05551234567',
  address: '123 Rue de la Paix, Alger',
  payment_type: 'month',          -- 'days', 'month', or 'percentage'
  
  -- Payment amounts (only relevant field is populated)
  percentage: NULL,                -- Only if payment_type = 'percentage'
  daily_rate: NULL,                -- Only if payment_type = 'days'
  monthly_rate: 60000.00,          -- Only if payment_type = 'month'
  
  created_at: '2026-03-27T...'
}
```

### Validation Rules

The system validates that:
✅ Employee name is provided
✅ Username is provided
✅ Payment amount is entered (based on type selected):
  - If Monthly: monthly_rate required
  - If Daily: daily_rate required
  - If Percentage: percentage required

If validation fails, user sees error message:
- "Veuillez remplir tous les champs requis" (Fill all required fields)
- "Veuillez entrer le salaire journalier" (Enter daily salary)
- "Veuillez entrer le salaire mensuel" (Enter monthly salary)
- "Veuillez entrer le pourcentage" (Enter percentage)

---

## Employee Card Display

Once saved, each worker's card shows:

```
┌─────────────────────────────────┐
│ John Doe                    Worker│
│                                  │
│ 📱 05551234567                  │
│ 📍 123 Rue de la Paix, Alger    │
│ 📅 Embauché le: 27/03/2026      │
│ 💰 Rémunération: 60 000,00 DA /mois │
│                                  │
│ [Historique] [Acompte] [Absence] [Paiement] │
└─────────────────────────────────┘
```

The rémunération (payment) section shows:
- **Monthly Worker:** `60 000,00 DA /mois`
- **Daily Worker:** `3 000,00 DA /jour`
- **Percentage Worker:** `30%`

---

## Editing a Worker

**To edit an existing worker:**

1. Click the edit button (pencil icon) on the worker's card
2. Form pre-fills with all existing data including payment amount
3. Modify any fields needed
4. Update payment type or amount if needed
5. Click "Enregistrer"
6. See success message: "Employé mis à jour avec succès!"

---

## Database Schema

The required columns in `profiles` table:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10, 2) DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_rate DECIMAL(10, 2) DEFAULT NULL;
```

Both columns are:
- **Type:** DECIMAL(10, 2) - allows currency values with 2 decimal places
- **Nullable:** YES - NULL for payment types that don't use this field
- **Range:** 0.00 to 9999999.99 DA

---

## Form Flow Diagram

```
User Opens Form
    ↓
Select Payment Type
    ↓
    ├─→ "Mensuel" → Show Monthly Rate Input
    │      ↓
    │    Enter: 60000
    │
    ├─→ "Journalier" → Show Daily Rate Input
    │      ↓
    │    Enter: 3000
    │
    └─→ "Pourcentage" → Show Percentage Input
           ↓
         Enter: 30

    ↓
Click "Enregistrer"
    ↓
Validate All Fields
    ↓
Save to Database
    ↓
Show Success/Error Message
    ↓
Close Modal & Refresh List
```

---

## Error Handling

### Validation Errors (Before Save)
```
❌ "Veuillez remplir tous les champs requis"
   → Username or Name is missing

❌ "Veuillez entrer le salaire journalier"
   → Daily payment type selected but no amount entered

❌ "Veuillez entrer le salaire mensuel"
   → Monthly payment type selected but no amount entered

❌ "Veuillez entrer le pourcentage"
   → Percentage type selected but no percentage entered
```

### Database Errors (During Save)
```
❌ "Erreur lors de la création: [Database Error]"
   → Problem saving to database

❌ "Erreur lors de la mise à jour: [Database Error]"
   → Problem updating existing employee
```

### Success Messages
```
✅ "Employé créé avec succès!"
   → New employee saved successfully

✅ "Employé mis à jour avec succès!"
   → Existing employee updated successfully
```

---

## Data Types in TypeScript

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'worker';
  phone?: string;
  address?: string;
  paymentType?: 'days' | 'month' | 'percentage';
  percentage?: number;           // For percentage-based pay
  dailyRate?: number;            // For daily pay (in DA)
  monthlyRate?: number;          // For monthly pay (in DA)
  createdAt: string;
}
```

---

## Currency Format

All payment amounts display in DZD (Algerian Dinars):

- **Monthly Example:** `60 000,00 DA` (60,000 Dinars)
- **Daily Example:** `3 000,00 DA` (3,000 Dinars)
- **Format:** Space thousands separator, comma decimal separator
- **Decimals:** Always 2 decimal places (`.00`)

Uses `formatCurrency()` function from `lib/utils.ts`

---

## Complete Example SQL

### Create New Worker with Monthly Salary

```sql
INSERT INTO profiles (
  id,
  username,
  full_name,
  role,
  phone,
  address,
  payment_type,
  monthly_rate,
  created_at
) VALUES (
  gen_random_uuid(),
  'john_doe',
  'John Doe',
  'worker',
  '05551234567',
  '123 Rue de la Paix, Alger',
  'month',
  60000.00,
  NOW()
);
```

### Update Worker Payment

```sql
UPDATE profiles
SET 
  monthly_rate = 65000.00,
  payment_type = 'month'
WHERE username = 'john_doe';
```

### Query All Worker Salaries

```sql
SELECT 
  full_name,
  payment_type,
  COALESCE(daily_rate, monthly_rate, percentage) as payment_amount,
  CASE 
    WHEN payment_type = 'days' THEN 'DA/jour'
    WHEN payment_type = 'month' THEN 'DA/mois'
    ELSE '%'
  END as unit
FROM profiles
WHERE role = 'worker'
ORDER BY full_name;
```

---

## Testing the Interface

### Test Case 1: Create Monthly Worker
1. Click "Ajouter un employé"
2. Enter: Name=Fatima, Phone=0555..., Role=Worker
3. Select: Payment Type = "Mensuel"
4. Enter: Monthly = 55000
5. Click Save
6. ✅ Should see "Employé créé avec succès!"
7. ✅ Card should show "55 000,00 DA /mois"

### Test Case 2: Create Daily Worker
1. Click "Ajouter un employé"
2. Enter: Name=Ahmed, Phone=0556..., Role=Worker
3. Select: Payment Type = "Journalier"
4. Enter: Daily = 4000
5. Click Save
6. ✅ Should see "Employé créé avec succès!"
7. ✅ Card should show "4 000,00 DA /jour"

### Test Case 3: Edit Worker Payment
1. Click edit button on existing worker card
2. Change payment amount (e.g., 65000 → 70000)
3. Click Save
4. ✅ Should see "Employé mis à jour avec succès!"
5. ✅ Card should update with new amount

### Test Case 4: Validation Error
1. Click "Ajouter un employé"
2. Enter: Name=Test
3. Select: Payment Type = "Mensuel"
4. **Leave Monthly field empty**
5. Click Save
6. ✅ Should see "Veuillez entrer le salaire mensuel"
7. ✅ Modal should stay open for correction

---

## Summary

✅ Workers can now have properly configured payment types  
✅ Payment amounts are saved and displayed on cards  
✅ Three payment methods supported (Daily, Monthly, Percentage)  
✅ Full validation before saving  
✅ Error messages guide users  
✅ Success confirmations after saves  
✅ Data persists in database with proper schema  
✅ Editing pre-fills all payment information  

The interface now fully matches the database structure and provides a complete worker payment management system!
