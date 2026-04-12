# Fix: Daily Payment Interface - Exclude Paid Periods

## Problem
After paying a daily worker for a period (e.g., 25/03-29/03), the payment interface still showed the same 5 days available for payment instead of showing 0 days (since all days were paid).

## Root Cause
The payment calculation was always starting from the hire date, ignoring previously paid periods stored in the `worker_daily_payment_periods` table.

## Solution Implemented

### 1. **Added Paid Periods State**
```typescript
const [paidPeriods, setPaidPeriods] = useState<Array<{
  workerId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
}>>([]);
```

### 2. **Fetch Paid Periods in fetchData()**
When loading employee data, the system now also fetches all paid periods from the database:
```typescript
const { data: periodsData } = await supabase
  .from('worker_daily_payment_periods')
  .select('worker_id, start_date, end_date, total_days')
  .eq('status', 'paid');
```

### 3. **Updated calculateNetSalary() Logic**
The function now:
- Checks if the worker has any paid periods
- If yes: starts calculation from the day **after** the last paid period
- If no: starts calculation from the hire date
- Counts only unpaid days

**Example:**
- Hire date: 25/03/2026
- Last paid period: 25/03 → 29/03 (5 days paid)
- Next calculation: starts from 30/03
- If today is 29/03: 0 days unpaid
- If today is 31/03: 2 days unpaid (30/03 and 31/03)

### 4. **Updated Display**
The help text now shows:
```
Par défaut: 0 jours (du 30/03/2026 à aujourd'hui)
```

Instead of always showing the hire date.

## Code Changes

### Files Modified:
- `src/components/Employees.tsx`
  - Added `paidPeriods` state
  - Updated `fetchData()` to fetch paid periods
  - Rewrote `calculateNetSalary()` to check paid periods
  - Updated display help text to use `calculationStartDate`
  - Added `calculationStartDate` to return objects

### New Functions (Already Present):
- `parseDateString()` - Properly parses date strings without timezone issues
- `fetchPaidPeriods()` - Fetches paid periods for a worker (helper function)
- `isDateInPaidPeriod()` - Checks if a date is in a paid period (helper function)

## How It Works Now

### Payment Flow:

1. **User opens payment modal** (Example: Worker "journalier" hired 25/03)
   - System shows: "5 jours (du 25/03/2026 à aujourd'hui)"
   - Available to pay: 10,000 DA (5 × 2,000 DA/day)

2. **User confirms payment on 29/03**
   - Payment recorded in `employee_payments` table
   - Period recorded in `worker_daily_payment_periods` table:
     ```
     start_date: 25/03/2026
     end_date: 29/03/2026
     total_days: 5
     status: paid
     ```

3. **User returns to payment form on 29/03**
   - System checks paid periods
   - Finds period ending 29/03
   - Starts calculation from 30/03
   - Today is 29/03, so: 30/03 → 29/03 = 0 days
   - Shows: "0 jours (du 30/03/2026 à aujourd'hui)"
   - Amount to pay: 0 DA

4. **On 31/03, user returns to payment form**
   - System finds last paid period ending 29/03
   - Starts calculation from 30/03
   - Today is 31/03, so: 30/03, 31/03 = 2 days
   - Shows: "2 jours (du 30/03/2026 à aujourd'hui)"
   - Amount to pay: 4,000 DA (2 × 2,000 DA/day)

## Database Verification

Run these queries to verify everything is working:

### Check Paid Periods
```sql
SELECT * FROM worker_daily_payment_periods
WHERE worker_id = 'worker-uuid'
ORDER BY end_date DESC;
```

### Calculate Unpaid Days
```sql
SELECT 
  p.full_name,
  MAX(wdpp.end_date) as last_paid_date,
  (CURRENT_DATE - COALESCE(MAX(wdpp.end_date), p.hire_date)::date) as unpaid_days
FROM profiles p
LEFT JOIN worker_daily_payment_periods wdpp 
  ON p.id = wdpp.worker_id AND wdpp.status = 'paid'
WHERE p.payment_type = 'days'
GROUP BY p.id, p.full_name;
```

## Testing Checklist

- [ ] After first payment, help text shows correct start date (day after last payment)
- [ ] After first payment, days calculation shows 0 (or 1 if next day)
- [ ] Multiple payments can be made without recounting paid days
- [ ] Each payment period is recorded in database with correct dates
- [ ] Payment history shows all periods with "PAYÉ" status
- [ ] No error messages in browser console

## Important Notes

1. **Backward Compatibility**: Existing payments not yet recorded in `worker_daily_payment_periods` table won't affect calculation. Only new payments going forward will be properly tracked.

2. **Catch-up**: If you need to record historical payments, you can manually insert them:
   ```sql
   INSERT INTO worker_daily_payment_periods 
   (worker_id, start_date, end_date, total_days, daily_rate, total_amount, payment_date, status)
   VALUES ('worker-uuid', '2026-03-20', '2026-03-25', 5, 2000, 10000, '2026-03-25', 'paid');
   ```

3. **Corrections**: If a period needs to be reversed:
   ```sql
   UPDATE worker_daily_payment_periods
   SET status = 'unpaid'
   WHERE id = 'period-uuid';
   ```

4. **Date Timezone**: All calculations use the user's local timezone (no UTC conversion).

## File References

- **Main Changes**: [Employees.tsx](Employees.tsx#L8-L900)
- **SQL Verification**: [DAILY_PAYMENT_VERIFICATION.sql](DAILY_PAYMENT_VERIFICATION.sql)
- **Related Documentation**: [FIX_DAILY_PAYMENT_PERIODS.md](FIX_DAILY_PAYMENT_PERIODS.md)
