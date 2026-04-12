# Fix for Daily Payment Issues

## Problems Fixed

### 1. **Date Decalage (1-day shift)**
**Problem**: When hire date was set to 25/03/2026, the payment calculation showed 24/03/2026.

**Root Cause**: Using `new Date("YYYY-MM-DD")` in JavaScript treats the string as UTC, then applies local timezone conversion, causing a 1-day shift for timezones west of UTC.

**Solution**:
- Created `parseDateString()` helper function that properly parses date strings without timezone conversion
- Updated all date calculations to use this function
- Now dates are handled consistently in the user's local timezone

### 2. **Paid Periods Still Appearing in Calculation**
**Problem**: After saving a payment period (e.g., 24/03-29/03), the system still showed all 7 days available for payment instead of excluding the 6 paid days.

**Root Cause**: The payment calculation wasn't checking the `worker_daily_payment_periods` table to see which days had already been paid.

**Solution**:
- Modified `calculateNetSalary()` to properly count days between hire date and today
- Added `worker_daily_payment_periods` recording when a daily worker is paid
- When payment is made, a record is created with the period dates, so future calculations will exclude those dates

---

## Code Changes Made

### 1. New Helper Functions

**`parseDateString(dateString: string): Date`**
- Safely parses date strings (YYYY-MM-DD) without timezone conversion
- Prevents the 1-day shift issue
- Used throughout the payment calculation logic

**`fetchPaidPeriods(workerId: string): Promise<Array>`**
- Fetches all paid payment periods for a worker from database
- Returns array of { startDate, endDate } objects

**`isDateInPaidPeriod(date: Date, paidPeriods: Array): boolean`**
- Checks if a given date falls within any paid period
- Used to exclude paid days from calculations

### 2. Updated `calculateNetSalary()` Function
- Now uses `parseDateString()` for proper date handling
- Correctly calculates day count between hire date and today
- No longer has off-by-one-day errors

### 3. Payment Recording
- When a daily worker payment is made, a record is automatically created in `worker_daily_payment_periods` table
- This allows future payment calculations to exclude already-paid days

---

## How It Works Now

### Payment Calculation Flow:

1. **User opens payment modal for a daily worker**
   - `calculateNetSalary()` is called
   - Uses `parseDateString()` to correctly parse hire date
   - Counts days from hire date to today
   - Example: hire date 25/03 → today 29/03 = 5 days (25, 26, 27, 28, 29)

2. **User confirms payment**
   - Payment is recorded in `employee_payments` table
   - Period is also recorded in `worker_daily_payment_periods` table with:
     - start_date: day after last payment
     - end_date: today
     - status: 'paid'
     - total_days: number of days paid
     - total_amount: amount paid

3. **Next payment calculation**
   - `fetchPaidPeriods()` retrieves all paid periods
   - Only unpaid days are included in the calculation
   - System shows 0 days available if all days have been paid

---

## Database Verification

To verify the periods are being recorded:

```sql
-- Check paid periods for a specific worker
SELECT 
  start_date,
  end_date,
  total_days,
  total_amount,
  status,
  payment_date
FROM worker_daily_payment_periods
WHERE worker_id = 'worker-uuid'
ORDER BY start_date DESC;
```

Expected output:
```
start_date  | end_date   | total_days | total_amount | status | payment_date
2026-03-24  | 2026-03-29 | 6          | 12000.00     | paid   | 2026-03-29
```

---

## Testing Checklist

- [ ] Hire date displays correctly (no 1-day shift)
- [ ] Payment calculation shows correct number of days
- [ ] After payment, next calculation shows 0 or fewer days
- [ ] Payment period is recorded in database
- [ ] Multiple payments can be tracked for same worker
- [ ] Date range in payment description is correct

---

## SQL Queries for Admin

### View unpaid days for all daily workers

```sql
SELECT 
  p.full_name,
  p.daily_rate,
  p.hire_date,
  CAST(
    EXTRACT(DAY FROM (CURRENT_DATE - p.hire_date::date)) + 1 
    AS INTEGER
  ) as total_days_since_hire,
  (SELECT COUNT(*) FROM worker_daily_payment_periods 
   WHERE worker_id = p.id AND status = 'paid') as paid_periods
FROM profiles p
WHERE p.payment_type = 'days'
ORDER BY p.full_name;
```

### Calculate unpaid amount for a worker

```sql
SELECT 
  p.full_name,
  p.daily_rate,
  (
    SELECT COUNT(*)
    FROM (
      SELECT GENERATE_SERIES(p.hire_date::date, CURRENT_DATE, '1 day'::interval)::date as day_date
    ) all_days
    WHERE NOT EXISTS (
      SELECT 1 FROM worker_daily_payment_periods wdpp
      WHERE wdpp.worker_id = p.id
      AND wdpp.status = 'paid'
      AND all_days.day_date BETWEEN wdpp.start_date AND wdpp.end_date
    )
  ) as unpaid_days,
  (
    SELECT COUNT(*)
    FROM (
      SELECT GENERATE_SERIES(p.hire_date::date, CURRENT_DATE, '1 day'::interval)::date as day_date
    ) all_days
    WHERE NOT EXISTS (
      SELECT 1 FROM worker_daily_payment_periods wdpp
      WHERE wdpp.worker_id = p.id
      AND wdpp.status = 'paid'
      AND all_days.day_date BETWEEN wdpp.start_date AND wdpp.end_date
    )
  ) * p.daily_rate as unpaid_amount
FROM profiles p
WHERE p.payment_type = 'days'
ORDER BY p.full_name;
```

---

## Important Notes

1. **Backward Compatibility**: Existing payments in `employee_payments` are unchanged. Only new payments will have corresponding period records.

2. **Date Timezone**: The fix now properly handles dates in your local timezone (Africa/Algiers, UTC+1).

3. **Payment Gaps**: If you have multiple payments for the same worker, each period will be separate. The system automatically tracks which dates have been paid.

4. **Manual Corrections**: If a period was recorded incorrectly, you can update it:
   ```sql
   UPDATE worker_daily_payment_periods
   SET status = 'unpaid'
   WHERE id = 'period-uuid';
   ```

---
