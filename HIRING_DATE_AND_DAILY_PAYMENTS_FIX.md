# Fix for Hiring Date and Daily Payment Periods

## Summary of Changes

This document outlines the complete fix for:
1. **Hiring Date Display Issue** - `created_at` field was being confused with profile creation date
2. **Daily Payment Period Tracking** - New system to track payment periods for daily workers

---

## Database Changes Required

Run the SQL migration file: `FIX_CREATED_AT_AND_DAILY_PAYMENTS.sql`

This migration will:
1. Add `hire_date` column to `profiles` table (separate from `created_at`)
2. Migrate existing `created_at` timestamps to `hire_date` (extracting just the date part)
3. Create new `worker_daily_payment_periods` table to track payment periods
4. Create view `vw_worker_daily_payment_summary` for easy querying
5. Set up RLS policies for the new table

---

## Code Changes Made

### 1. Updated Type Definition
- Changed `User` interface in `src/types.ts` to use `hireDate` instead of `createdAt`
- `hireDate` is now a required string field (YYYY-MM-DD format)

### 2. Updated Employees Component
- Form now uses `hireDate` instead of `createdAt`
- Hiring date is saved to `hire_date` column in database
- Validation ensures a hiring date is always selected
- Display functions updated to show correct hiring dates

### 3. Date Handling
- Dates are stored as `date` type in database (no timezone issues)
- Form uses HTML `type="date"` input
- Display uses `formatDateWithoutTimezone()` helper function

---

## How to Use the New Daily Payment Period System

### For Admin Users:

1. **Create a Payment Period** (when paying a daily worker for a range of dates):
   - Open worker's history modal
   - Click on the payment section for daily workers
   - Enter the period details:
     - **Start Date**: First day of the period (e.g., 01/03/2026)
     - **End Date**: Last day of the period (e.g., 15/03/2026)
     - **Total Days**: Number of working days (e.g., 12)
     - **Daily Rate**: The rate per day
     - **Total Amount**: Calculated as total_days × daily_rate
   - This creates a record in `worker_daily_payment_periods`

2. **Mark Period as Paid**:
   - Once payment is made, update the status to "paid"
   - This prevents those days from being shown again in future payment calculations

3. **Query Payment History**:
   ```sql
   SELECT * FROM vw_worker_daily_payment_summary 
   WHERE worker_id = 'worker-uuid' 
   AND status = 'unpaid'
   ORDER BY start_date DESC;
   ```

### For Workers:

- Can view their payment periods in the history modal
- Can see which periods have been paid and which are pending

---

## Database Schema Changes

### New Table: `worker_daily_payment_periods`

```sql
- id: UUID (primary key)
- worker_id: UUID (foreign key to profiles)
- start_date: date (start of payment period)
- end_date: date (end of payment period)
- total_days: integer (number of days worked in period)
- daily_rate: numeric (rate per day)
- total_amount: numeric (total amount for period)
- payment_date: date (when the payment was made)
- status: text ('paid' or 'unpaid')
- description: text (notes about the period)
- created_at: timestamp
- paid_at: timestamp (when it was marked as paid)
```

### Modified Table: `profiles`

```sql
- hire_date: date (NEW - the hiring date, separate from created_at)
- created_at: timestamp with time zone (still exists - profile creation timestamp)
```

---

## Migration Steps

1. **Backup your database** (always recommended before migrations)

2. **Run the SQL migration**:
   ```
   - Open FIX_CREATED_AT_AND_DAILY_PAYMENTS.sql in your SQL editor
   - Execute it against your database
   ```

3. **Verify the migration**:
   ```sql
   -- Check that hire_date column exists
   SELECT column_name FROM information_schema.columns 
   WHERE table_name='profiles' AND column_name='hire_date';
   
   -- Check new table exists
   SELECT * FROM worker_daily_payment_periods LIMIT 1;
   ```

4. **Update all existing employees**:
   - Go to each worker's profile
   - Click "Modifier"
   - Set their correct "Date d'embauche" (hiring date)
   - Click Save
   - Repeat for all workers

5. **Test with the app**:
   - Create a new worker and set their hire date
   - Verify it displays correctly
   - Test payment period creation for daily workers

---

## Testing Checklist

- [ ] Can create a new employee with a specific hire date
- [ ] Hire date displays correctly (not showing as today)
- [ ] Can edit existing employee and set their hire date
- [ ] Daily workers show correct default payment period (from hire date to today)
- [ ] Can create a payment period in history
- [ ] Paid periods don't show up in next payment calculation
- [ ] Payment history shows period dates correctly

---

## Troubleshooting

**Issue**: All employees still showing today's date as hire date

**Solution**: 
1. Run the migration first
2. Edit each employee and set their correct hire date
3. Make sure to click Save

**Issue**: Date input showing wrong date format

**Solution**: The form uses HTML5 date input, which shows MM/DD/YYYY but stores as YYYY-MM-DD internally

**Issue**: Timezone still showing wrong dates

**Solution**: The new system uses `date` type (not timestamp), so no timezone conversion happens

---

## SQL Query Examples

### Find all unpaid daily payment periods for a specific worker

```sql
SELECT 
  start_date,
  end_date,
  total_days,
  total_amount,
  status
FROM worker_daily_payment_periods
WHERE worker_id = 'your-worker-id'
  AND status = 'unpaid'
ORDER BY start_date DESC;
```

### Calculate total owed to a worker

```sql
SELECT 
  p.full_name,
  SUM(wdpp.total_amount) as total_owed
FROM worker_daily_payment_periods wdpp
JOIN profiles p ON wdpp.worker_id = p.id
WHERE wdpp.status = 'unpaid'
GROUP BY p.id, p.full_name;
```

### Mark a period as paid

```sql
UPDATE worker_daily_payment_periods
SET status = 'paid',
    paid_at = NOW()
WHERE id = 'period-uuid';
```

---

## Important Notes

1. **Backward Compatibility**: Existing `created_at` timestamps are preserved. The new `hire_date` column is separate.

2. **Date Format**: Dates are stored as YYYY-MM-DD in the database. The form and display handle timezone conversions correctly.

3. **Required Field**: Every employee must have a `hire_date` set. The form will not allow saving without it.

4. **Period-Based Payments**: For daily workers, always create a payment period record when paying, so you can track which days have been paid.

---
