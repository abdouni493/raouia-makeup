# Journalier Worker Payment Interface - Complete Analysis & Implementation Plan

## Database Schema Analysis

### Key Tables for Journalier Payment System:

1. **reservations** (Main Table)
   - `id`: uuid - Reservation identifier
   - `client_name`: text - Client name (searchable)
   - `client_phone`: text - Client phone (searchable)
   - `total_price`: numeric - Total service price
   - `paid_amount`: numeric - Amount already paid
   - `finalized_by`: uuid - Worker who finalized (for journalier)
   - `finalized_at`: timestamp - When finalized
   - `status`: text - 'pending', 'completed', 'cancelled'

2. **reservation_workers** (Payment Tracking)
   - `id`: uuid - Record ID
   - `reservation_id`: uuid - FK to reservations
   - `worker_id`: uuid - FK to profiles
   - `payment_type`: text - 'percentage', 'month', 'days'
   - `amount`: numeric - Fixed amount for days workers
   - `percentage`: numeric - % for percentage workers
   - `status`: text - 'paid' or 'unpaid' ← KEY FOR FILTERING

3. **profiles** (Worker Information)
   - `id`: uuid - Worker ID
   - `full_name`: text
   - `payment_type`: text - 'days', 'month', 'percentage'
   - `daily_rate`: numeric - Daily rate (for journalier)
   - `phone`: text
   - `client_name`: text

4. **employee_payments** (Payment Records)
   - `id`: uuid
   - `employee_id`: uuid - FK to profiles
   - `amount`: numeric - Amount paid
   - `type`: enum - 'acompte', 'absence', 'salary'
   - `date`: date - Payment date
   - `status`: text - 'paid', 'unpaid'

5. **worker_reservation_payments** (Individual Payment Tracking)
   - `id`: uuid
   - `reservation_worker_id`: uuid - FK to reservation_workers
   - `reservation_id`: uuid - FK to reservations
   - `worker_id`: uuid - FK to profiles
   - `amount`: numeric - Specific payment amount
   - `percentage`: numeric - % applied
   - `status`: text - 'paid', 'unpaid'

## Current Implementation Gap

**Current State**: 
- Journalier payment interface only shows basic day calculation
- No reservation-based payment tracking
- No search functionality for adding reservations
- No percentage-based calculation for journalier workers

**What Needs to Be Added**:
1. Display all finalized unpaid reservations for selected journalier worker
2. Search & add additional reservations to payment
3. Calculate total from selected reservations
4. Optional percentage-based payment calculation
5. Update reservation_workers.status to 'paid' when payment saved
6. Create employee_payments record with proper tracking

## Data Flow for Journalier Payment

### Phase 1: Load Worker's Unpaid Reservations
```sql
SELECT 
  r.id,
  r.client_name,
  r.client_phone,
  r.date,
  r.total_price,
  r.status,
  rw.amount,
  rw.payment_type,
  rw.status as payment_status
FROM reservations r
JOIN reservation_workers rw ON r.id = rw.reservation_id
WHERE rw.worker_id = :selected_worker_id
  AND rw.payment_type = 'days'
  AND rw.status = 'unpaid'
  AND r.status = 'completed'
ORDER BY r.date DESC;
```

### Phase 2: Search for Additional Reservations
```sql
SELECT 
  r.id,
  r.client_name,
  r.client_phone,
  r.date,
  r.total_price,
  r.status,
  rw.amount,
  rw.payment_type,
  rw.status as payment_status
FROM reservations r
JOIN reservation_workers rw ON r.id = rw.reservation_id
WHERE rw.worker_id = :selected_worker_id
  AND rw.payment_type = 'days'
  AND rw.status = 'unpaid'
  AND r.status = 'completed'
  AND (r.client_name ILIKE :search_term OR r.client_phone ILIKE :search_term)
ORDER BY r.date DESC
LIMIT 10;
```

### Phase 3: Save Payment & Mark as Paid
```
BEGIN TRANSACTION
1. UPDATE reservation_workers
   SET status = 'paid'
   WHERE id IN (:selected_reservation_worker_ids)

2. INSERT INTO employee_payments
   VALUES (
     employee_id = :worker_id,
     amount = :payment_amount,
     type = 'salary',
     date = TODAY,
     status = 'paid',
     description = '...'
   )

3. INSERT INTO worker_reservation_payments (if percentage used)
   For each reservation: record amount paid with percentage applied

4. COMMIT
```

## UI Components Needed

### Main Payment Interface
- **Worker Selection Card** - Show selected worker details
- **Reservations List** - All unpaid finalized reservations
  - Client name, phone, date
  - Reservation amount
  - Payment status indicator
  - Checkbox or selection
- **Search Bar** - Find additional reservations by name/phone
- **Calculation Section**
  - Total amount (sum of selected reservations)
  - Payment type selector (Fixed amount vs Percentage)
  - Input field for payment amount
  - Percentage input with auto-calculation
- **Summary Section**
  - Amount to pay (red/highlighted)
  - Breakdown by reservation
- **Action Buttons** - Save / Cancel

### State Management Needed
```typescript
const [selectedReservations, setSelectedReservations] = useState<string[]>([]);
const [paymentAmount, setPaymentAmount] = useState('');
const [paymentPercentage, setPaymentPercentage] = useState('');
const [usePercentage, setUsePercentage] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [workerReservations, setWorkerReservations] = useState([]);
const [totalAmount, setTotalAmount] = useState(0);
```

## Calculation Logic

### Fixed Amount Payment
```
Total = Sum of selected reservation amounts
Payment = User input (must be <= Total)
```

### Percentage-Based Payment
```
Total = Sum of selected reservation amounts
Percentage = User input (e.g., 30%)
Payment = Total * (Percentage / 100)
```

### Important Notes
- Only UNPAID reservation_workers records should be displayed
- Only COMPLETED reservations should be included
- After payment, mark reservation_workers.status = 'paid'
- Create employee_payments record for tracking
- If percentage is used, also create worker_reservation_payments records
