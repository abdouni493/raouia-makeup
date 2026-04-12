# Quick Reference: Daily Payment Calculation Flow

## What Changed

### Before (Broken):
- Payment: 25/03-29/03 (5 days) → Saved ✓
- Next visit (29/03): Still shows "5 jours du 25/03 à aujourd'hui"
- Problem: Paid days were shown again

### After (Fixed):
- Payment: 25/03-29/03 (5 days) → Saved ✓ + Period recorded
- Next visit (29/03): Shows "0 jours du 30/03 à aujourd'hui"
- Next visit (31/03): Shows "2 jours du 30/03 à aujourd'hui"
- Solution: Only unpaid days are shown

---

## System Architecture

```
Payment Interface
    ↓
calculateNetSalary()
    ↓
Check paidPeriods state
    ├─ Has paid periods? → Start from last_paid_date + 1 day
    └─ No paid periods? → Start from hire_date
    ↓
Count days (start_date → today)
    ↓
Calculate salary & deductions
    ↓
Display to user
```

---

## Data Flow

### 1. Data Fetching (on component mount)

```
fetchData()
├─ Fetch employees from profiles table
├─ Fetch payments from employee_payments table  
└─ Fetch paid periods from worker_daily_payment_periods table ← NEW
    └─ Store in paidPeriods state
```

### 2. Payment Calculation

```
calculateNetSalary(employeeId)
├─ Get employee from employees array
├─ If paymentType === 'days':
│   ├─ Get all paid periods for this worker
│   ├─ If periods exist:
│   │   ├─ Get last period end date
│   │   └─ Start calculation from (end_date + 1 day)
│   ├─ Else:
│   │   └─ Start calculation from hire_date
│   ├─ Count days from start to today
│   └─ Calculate salary
├─ Get deductions (acomptes, absences)
└─ Return: { base, days, deductions, net, calculationStartDate }
```

### 3. Payment Recording

```
When user confirms payment:
├─ Insert into employee_payments table
└─ Insert into worker_daily_payment_periods table ← NEW
    └─ Record: start_date, end_date, total_days, status='paid'
```

---

## Example Scenarios

### Scenario 1: First Payment
```
Hire Date: 25/03/2026
Today: 29/03/2026

Calculation:
- Paid periods: None
- Start date: 25/03/2026 (hire date)
- Days: 25, 26, 27, 28, 29 = 5 days
- Amount: 5 × 2,000 = 10,000 DA
- Save: Period (25/03 → 29/03, 5 days, paid)
```

### Scenario 2: Second Payment (Same Day)
```
After first payment on 29/03

Today: 29/03/2026
Calculation:
- Paid periods: [25/03 → 29/03]
- Start date: 30/03/2026 (after last paid date)
- Days: None (30/03 is after today)
- Amount: 0 DA
- Can't pay (no unpaid days)
```

### Scenario 3: Second Payment (Few Days Later)
```
After first payment on 29/03

Today: 31/03/2026
Calculation:
- Paid periods: [25/03 → 29/03]
- Start date: 30/03/2026 (after last paid date)
- Days: 30, 31 = 2 days
- Amount: 2 × 2,000 = 4,000 DA
- Save: Period (30/03 → 31/03, 2 days, paid)
```

### Scenario 4: Gap in Payments
```
First payment: 25/03 → 29/03 (5 days)
No payment for 5 days
Today: 03/04/2026

Calculation:
- Paid periods: [25/03 → 29/03]
- Start date: 30/03/2026 (after last paid date)
- Days: 30/03, 31/03, 01/04, 02/04, 03/04 = 5 days
- Amount: 5 × 2,000 = 10,000 DA
- Save: Period (30/03 → 03/04, 5 days, paid)
```

---

## Database Records

### worker_daily_payment_periods Table

| Field | Type | Example |
|-------|------|---------|
| id | UUID | 550e8400-e29b-41d4-a716-446655440000 |
| worker_id | UUID | 12345678-1234-1234-1234-123456789012 |
| start_date | date | 2026-03-25 |
| end_date | date | 2026-03-29 |
| total_days | integer | 5 |
| daily_rate | numeric | 2000.00 |
| total_amount | numeric | 10000.00 |
| payment_date | date | 2026-03-29 |
| status | text | 'paid' |
| created_at | timestamp | 2026-03-29 14:30:00 |
| paid_at | timestamp | 2026-03-29 14:30:00 |

---

## Key Functions

### parseDateString(dateString: string): Date
- Parses "YYYY-MM-DD" format without timezone conversion
- Used to avoid date shift issues

### calculateNetSalary(employeeId: string, customDays?: number)
- Calculates unpaid salary for an employee
- Now checks paidPeriods to exclude paid days
- Returns: { base, days, deductions, net, acomptes, absences, calculationStartDate }

### handleAddPaymentAction()
- Handles payment confirmation
- Records payment in employee_payments
- Also records period in worker_daily_payment_periods

---

## Common Issues & Solutions

### Issue: Still showing paid days
**Solution**: Make sure `FIX_CREATED_AT_AND_DAILY_PAYMENTS.sql` migration was run

### Issue: Date showing wrong day
**Solution**: This is fixed by using `parseDateString()` instead of direct `new Date()`

### Issue: Payment history empty
**Solution**: Check that payment was actually saved (look in database)

### Issue: "0 jours" showing when should have unpaid days
**Solution**: Check that `worker_daily_payment_periods` table has the correct dates

---

## Testing

```bash
# 1. Clear browser cache to ensure latest code
Ctrl+Shift+Delete (Chrome/Edge) or Cmd+Shift+Delete (Mac)

# 2. Test flow:
# - Create worker (hire date: 25/03)
# - Open payment form → shows ~5 days
# - Pay the worker
# - Refresh page
# - Open payment form → should show 0 or 1 days (not 5)

# 3. Verify database:
SELECT * FROM worker_daily_payment_periods 
WHERE status = 'paid' 
ORDER BY created_at DESC;
```

---

## Related Files

- Main Code: `src/components/Employees.tsx`
- SQL Setup: `FIX_CREATED_AT_AND_DAILY_PAYMENTS.sql`
- Verification: `DAILY_PAYMENT_VERIFICATION.sql`
- Documentation: `FIX_PAID_PERIODS_INTERFACE.md`

---
