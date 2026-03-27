# Finalization Interface Enhancement - Implementation Guide

## Overview
This feature enhancement allows:
1. Multiple workers per reservation with different payment types
2. Display of payment type information for each worker
3. Calculation and editing of worker earnings (especially for percentage-based workers)
4. Tracking of payment status for worker earnings
5. Integration with payment history and calculations

## Database Schema Changes

### New Tables:
- `reservation_workers` - Junction table linking reservations to workers with payment amounts and status
- `worker_reservation_payments` - Track earnings from reservations for percentage-based workers

### New Columns:
- `reservations.finalized_by` - Track who finalized the reservation (no duplication)

## Step-by-Step Implementation

### Step 1: Run SQL Migration
1. Go to Supabase SQL Editor
2. Copy and paste [CREATE_RESERVATION_WORKERS_TABLE.sql](CREATE_RESERVATION_WORKERS_TABLE.sql)
3. Click Run

This will:
- Create `reservation_workers` table
- Create `worker_reservation_payments` table
- Add `finalized_by` column to reservations
- Create `v_reservation_workers` view for easy querying
- Migrate existing data

### Step 2: Update Reservations Component

Key changes needed:

#### A. State Management
```typescript
// Multiple workers per reservation
const [reservationWorkers, setReservationWorkers] = useState<Array<{
  id: string;
  workerId: string;
  workerName: string;
  paymentType: string;
  percentage: number;
  amount: number;
  status: 'paid' | 'unpaid';
}>>([]);

// Track edited amounts
const [workerAmounts, setWorkerAmounts] = useState<Record<string, number>>({});
const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
```

#### B. Display Worker Information
- Show payment type for each worker (percentage, daily, monthly)
- If percentage: Display calculated amount and percentage
- Show current finalization user (single display, no duplication)
- Show button to add more workers

#### C. Add Worker Functionality
```typescript
const handleAddWorker = (workerId: string) => {
  const worker = employees.find(e => e.id === workerId);
  if (worker && !reservationWorkers.find(w => w.workerId === workerId)) {
    const amount = worker.paymentType === 'percentage' 
      ? finalPrice * (worker.percentage || 0) / 100 
      : 0;
    
    setReservationWorkers([
      ...reservationWorkers,
      {
        id: `temp-${Date.now()}`,
        workerId,
        workerName: worker.fullName,
        paymentType: worker.paymentType,
        percentage: worker.percentage || 0,
        amount,
        status: 'unpaid'
      }
    ]);
  }
};
```

#### D. Edit Payment Amounts
- Allow user to edit amounts for each worker
- Validate amounts don't exceed reservation total
- Save edited amounts

#### E. Save with Multiple Workers
```typescript
const handleFinalizeReservation = async () => {
  // 1. Update reservation with finalized_by (current user)
  const { error: updateError } = await supabase
    .from('reservations')
    .update({ 
      status: 'completed',
      finalized_by: currentUser.id,
      finalized_at: new Date().toISOString()
    })
    .eq('id', selectedReservation.id);

  // 2. Insert or update reservation_workers
  for (const worker of reservationWorkers) {
    const { error: workerError } = await supabase
      .from('reservation_workers')
      .upsert({
        reservation_id: selectedReservation.id,
        worker_id: worker.workerId,
        payment_type: worker.paymentType,
        amount: workerAmounts[worker.workerId] || worker.amount,
        percentage: worker.percentage,
        status: 'unpaid'
      }, {
        onConflict: 'reservation_id,worker_id'
      });
  }

  // 3. Create worker_reservation_payments for tracking
  // (only for percentage workers)
  for (const worker of reservationWorkers) {
    if (worker.paymentType === 'percentage') {
      const { data: rwData } = await supabase
        .from('reservation_workers')
        .select('id')
        .eq('reservation_id', selectedReservation.id)
        .eq('worker_id', worker.workerId)
        .single();

      if (rwData) {
        await supabase
          .from('worker_reservation_payments')
          .insert({
            reservation_worker_id: rwData.id,
            reservation_id: selectedReservation.id,
            worker_id: worker.workerId,
            amount: workerAmounts[worker.workerId] || worker.amount,
            percentage: worker.percentage,
            status: 'unpaid'
          });
      }
    }
  }
};
```

### Step 3: Update Employees Payment Calculation

For percentage-based workers, calculate total from:
1. Reservations via `worker_reservation_payments` table
2. Acomptes (advances)
3. Absences

```typescript
const calculatePercentageEarnings = (employeeId: string) => {
  // Get earnings from completed reservations
  const reservationEarnings = workerReservationPayments
    .filter(p => p.worker_id === employeeId && p.status === 'unpaid')
    .reduce((sum, p) => sum + p.amount, 0);

  // Get acomptes and absences
  const deductions = payments.filter(p =>
    p.employeeId === employeeId &&
    (p.type === 'acompte' || p.type === 'absence') &&
    (p.status === 'unpaid' || !p.status)
  );

  const totalDeductions = deductions.reduce((sum, p) => sum + p.amount, 0);

  return {
    base: reservationEarnings,
    deductions: totalDeductions,
    net: reservationEarnings - totalDeductions,
    acomptes: deductions.filter(p => p.type === 'acompte').reduce((sum, p) => sum + p.amount, 0),
    absences: deductions.filter(p => p.type === 'absence').reduce((sum, p) => sum + p.amount, 0)
  };
};
```

### Step 4: Update Payment History

Display reservation earnings in worker history with status (paid/unpaid):

```typescript
const fetchWorkerPaymentHistory = async (workerId: string) => {
  // Fetch reservation payments
  const { data: reservationPayments } = await supabase
    .from('worker_reservation_payments')
    .select('*')
    .eq('worker_id', workerId);

  // Format for display
  const formattedPayments = reservationPayments.map(p => ({
    id: p.id,
    type: 'reservation',
    description: `Réservation - ${p.reservation_id}`,
    amount: p.amount,
    date: p.created_at,
    status: p.status,
    percentage: p.percentage
  }));

  return formattedPayments;
};
```

## UI Components to Update

1. **Finalization Modal**
   - Show "Employé ayant effectué le travail" with payment type
   - Add button to add more workers (+ icon)
   - Show calculated amounts for percentage workers
   - Allow editing amounts
   - Show "Finalisé par: [Current User Name]" (single display)

2. **Worker Cards**
   - Display payment type: "X% de la prestation" or "Paiement mensuel" etc.
   - Show calculated amount
   - Edit button for amount
   - Remove button (if multiple workers)

3. **Payment History Modal**
   - Add section for "Réservations" earnings
   - Show reservation details, amount, and status
   - Mark as paid/unpaid

## Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Create reservation
- [ ] Add multiple workers in finalization
- [ ] Edit worker payment amounts
- [ ] Finalize reservation
- [ ] Check reservation_workers table has data
- [ ] Check worker_reservation_payments table has data
- [ ] View payment history shows reservation earnings
- [ ] Payment calculation includes reservation earnings
- [ ] Status updates correctly (unpaid → paid)

## Files to Modify

1. src/components/Reservations.tsx - Finalization section
2. src/components/Employees.tsx - Payment calculation for percentage workers
3. src/types.ts - Add new types if needed
4. Database - Run migration script

