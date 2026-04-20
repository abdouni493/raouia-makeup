# Journalier Payment Interface Analysis & Fixes

## Problem Statement
When a journalier (daily-rate) worker finalizes a reservation in the system, it's not appearing in their payment interface to collect payment.

---

## Database Schema Analysis

### Relevant Tables:

**1. reservations table**
- `id` - Reservation ID
- `client_name, client_phone` - Client info
- `prestation_id` - Service type
- `date, time` - When
- `total_price` - Full cost
- `paid_amount` - Amount already paid
- `status` - 'pending', 'completed', 'cancelled'
- `created_by` - Which profile created it
- `finalized_by` - **KEY FIELD**: Which profile finalized it (admin or worker)
- `finalized_at` - When it was finalized

**2. reservation_workers table** (CRITICAL FOR PAYMENTS)
- `id` - Auto ID
- `reservation_id` - Links to reservation
- `worker_id` - Links to worker profile
- `payment_type` - 'percentage', 'days', or 'month'
- `amount` - How much worker gets
- `percentage` - If percentage-based
- `status` - 'paid' or 'unpaid'
- **Composite Key**: (reservation_id, worker_id) should be unique

**3. profiles table**
- `id` - User ID
- `role` - 'admin', 'worker', 'super_admin'
- `payment_type` - How worker is paid ('days', 'month', 'percentage')
- `percentage` - For percentage-based workers
- `daily_rate` - For journalier workers

---

## Data Flow Analysis: How It SHOULD Work

### Step 1: Worker Views Reservation Interface
**File**: `src/components/Reservations.tsx` in `fetchData()` function

**BEFORE FIX:**
```typescript
const reservationQuery = supabase
  .from('reservations')
  .select('*')
  .order('date', { ascending: false })
  .limit(500);
```
❌ Problem: Fetches ALL reservations for admin and worker alike

**AFTER FIX:**
```typescript
let reservationQuery = supabase.from('reservations').select('*').order('date', { ascending: false }).limit(500);

if (currentUser.role === 'worker') {
  // Workers can only see reservations they created, were assigned to, or finalized
  reservationQuery = reservationQuery.or(
    `created_by.eq.${currentUser.id},worker_id.eq.${currentUser.id},finalized_by.eq.${currentUser.id}`
  );
}
```
✅ Fixed: Workers now only see relevant reservations

---

### Step 2: Worker Finalizes a Reservation
**File**: `src/components/Reservations.tsx` in `saveFinalize()` function

**WHAT SHOULD HAPPEN:**
1. Update `reservations` table:
   - Set `status = 'completed'`
   - Set `finalized_by = currentUser.id` ← **KEY: Track who finalized it**
   - Set `finalized_at = now()`
   
2. Add entry to `reservation_workers` table:
   - `worker_id = currentUser.id`
   - `payment_type = currentUser.paymentType` (must be 'days' for journalier)
   - `amount = totalPrice` (for journalier workers)
   - `status = 'unpaid'` (ready for payment)

**CODE IN saveFinalize():**
```typescript
// 1. Update reservation
const { error: updateError } = await supabase
  .from('reservations')
  .update({
    status: 'completed',
    total_price: totalFinalPrice,
    paid_amount: selectedReservation.paidAmount + currentPayment,
    finalized_by: currentUser.id,  // ✅ Mark worker as finalizer
    finalized_at: new Date().toISOString()
  })
  .eq('id', selectedReservation.id);

// 2. Add worker to reservation_workers if they are percentage or journalier-based
if (currentUser.paymentType === 'percentage' || currentUser.paymentType === 'days') {
  const currentUserAmount = workerAmounts[currentUser.id] || (
    currentUser.paymentType === 'percentage' 
      ? finalPrice * (currentUser.percentage || 0) / 100
      : finalPrice  // ✅ For journalier: full amount is their pay
  );
  
  const { error: mainWorkerError } = await supabase
    .from('reservation_workers')
    .upsert({
      reservation_id: selectedReservation.id,
      worker_id: currentUser.id,
      payment_type: currentUser.paymentType,  // ✅ MUST be 'days'
      amount: currentUserAmount,
      percentage: currentUser.paymentType === 'percentage' ? (currentUser.percentage || 0) : 0,
      status: 'unpaid'  // ✅ Ready for payment
    }, {
      onConflict: 'reservation_id,worker_id'
    });
}
```

---

### Step 3: Journalier Worker Views Payment Interface
**File**: `src/components/Employees.tsx` in `loadJournalierReservations()` function

**WHAT QUERIES:**
```sql
SELECT 
  rw.id,
  rw.reservation_id,
  rw.payment_type,
  rw.status,
  r.id, r.client_name, r.client_phone, r.date, r.total_price, r.status, r.finalized_by
FROM reservation_workers rw
JOIN reservations r ON rw.reservation_id = r.id
WHERE rw.worker_id = $currentWorkerId
  AND rw.payment_type = 'days'
  AND rw.status = 'unpaid'
```

**FILTERING LOGIC:**
- `worker_id = currentUser.id` → Only this worker's entries
- `payment_type = 'days'` → Only journalier reservations
- `status = 'unpaid'` → Only unpaid reservations

**RESULT MAPPING:**
```typescript
const reservations = (data || []).map((rw: any) => ({
  reservationId: rw.reservation_id,
  reservationWorkerId: rw.id,
  clientName: rw.reservations?.client_name || '',
  clientPhone: rw.reservations?.client_phone || '',
  date: rw.reservations?.date || '',
  amount: rw.reservations?.total_price || 0,  // Amount they earned
  paymentStatus: 'unpaid' as const,
}))
```

---

## Debug Logging Added

### In Reservations.tsx (saveFinalize):
```typescript
console.log('Adding worker to reservation_workers:', {
  reservation_id: selectedReservation.id,
  worker_id: currentUser.id,
  payment_type: currentUser.paymentType,
  amount: currentUserAmount,
  percentage: ...
});

// After save:
console.log('Main worker saved successfully:', mainWorkerData);
```

### In Employees.tsx (loadJournalierReservations):
```typescript
console.log('Loading journalier reservations for worker:', workerId);

// After fetch:
console.log('Journalier reservations data fetched:', data);
console.log('Processed journalier reservations:', reservations);
```

### In Employees.tsx (searchJournalierReservations):
```typescript
console.log('Searching journalier reservations for:', { workerId, searchTerm });

// After search:
console.log('Search results:', data);
```

---

## Testing Checklist

### Test 1: Worker Creates & Finalizes Reservation
1. Login as **journalier worker** account
2. Go to Reservations → Create new reservation
3. Select prestation and add services
4. Click "Finaliser" to complete
5. **Check browser console**: Should see "Adding worker to reservation_workers" log
6. Should show success message

### Test 2: Payment Interface Shows Finalized Reservation
1. Still logged in as **journalier worker**
2. Go to Employees → Click "Paiements Journaliers"
3. **Check browser console**: Should see "Loading journalier reservations for worker: [ID]"
4. **Should display**: The reservation you just finalized
5. **Amount shown**: Should match total_price from reservation

### Test 3: Admin Finalizes, Worker Sees It
1. Login as **admin**
2. Create new reservation
3. Assign it to the **journalier worker** (set worker_id)
4. Finalize it with admin account
5. Login as **journalier worker**
6. Go to Payment interface
7. **Should show**: The reservation admin finalized (if admin had added worker to reservation_workers)

### Test 4: Search Function
1. Login as **journalier worker**
2. Open Payment interface
3. Type client name in search box
4. **Check console**: Should see search logs
5. **Should display**: Matching reservations

---

## What the Interface Displays

### Journalier Payment Mode Shows:
- Client name
- Client phone
- Date
- **Amount** (total_price from reservation)
- Checkbox to select for payment
- Total selected amount
- Payment options (partial or percentage-based)

### Data Source:
All data comes from `reservation_workers` table joined with `reservations`

### Filters Applied:
- `worker_id` = Current logged-in worker
- `payment_type` = 'days'
- `status` = 'unpaid'

---

## Key Points to Understand

1. **The Problem Was Two-Fold:**
   - Workers could see ALL reservations (security issue)
   - When workers finalized reservations, they weren't added to `reservation_workers` properly

2. **The Fix:**
   - Restricted worker visibility to only relevant reservations
   - Ensured current user is added to `reservation_workers` when they finalize (with payment_type='days')
   - Added comprehensive logging for debugging

3. **Critical Fields:**
   - `reservation_workers.payment_type` MUST be 'days' for journalier
   - `reservation_workers.status` MUST be 'unpaid' to show in interface
   - `reservations.finalized_by` tracks WHO finalized (for permissions)

4. **Why Journalier Workers Need This:**
   - They manage their own reservations
   - They need to see what they've completed to collect payment
   - Each completed reservation = earn that day's rate

---

## If It Still Doesn't Work

### Debug Steps:
1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **As worker, finalize a reservation**
4. **Look for logs**: 
   - "Adding worker to reservation_workers:" ← Should show correct data
   - "Main worker saved successfully:" ← Should show the saved record
5. **Check Database** (Supabase Dashboard):
   - Go to `reservation_workers` table
   - Filter by `worker_id` = worker's ID
   - Should see a new entry with `payment_type = 'days'` and `status = 'unpaid'`
6. **As worker, open Payment interface**
7. **Look for logs**:
   - "Loading journalier reservations for worker: [ID]"
   - "Journalier reservations data fetched:" ← Should show the reservation_workers entry
   - "Processed journalier reservations:" ← Should show mapped data

### If No Data in Logs:
- Check that worker's `payment_type` in `profiles` table is set to 'days'
- Check that reservation's `status` is 'completed'
- Check that `reservation_workers` entry has `status = 'unpaid'` (not 'paid')

