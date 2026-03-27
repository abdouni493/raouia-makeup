# Worker Payment Information Feature

## Overview
This feature enhances the "Finaliser la Prestation" (Finalize Service) interface to display comprehensive worker information and allow manual editing of payment amounts for percentage-based workers.

## Features Implemented

### 1. Enhanced Worker Selection Display
- **Worker Cards**: Instead of a simple dropdown, workers are now displayed as clickable cards
- **Information Shown**:
  - Worker name
  - Worker avatar icon
  - Payment type indicator:
    - For percentage workers: "X% de la prestation" (X% of the service)
    - For daily workers: "Paiement à la journée" (Daily payment)
    - For monthly workers: "Paiement mensuel" (Monthly payment)
  - Visual feedback (checkmark and highlight) when selected

### 2. Worker Payment Information Box
- **Display Only For Percentage Workers**: Shows payment details only when the selected worker has percentage-based payment
- **Information Includes**:
  - Scissors icon for payment indication
  - Worker percentage and base service price
  - Current calculated payment amount
  - Edit button to modify the payment manually

### 3. Editable Payment Amount (For Percentage Workers)
When the "Edit" button is clicked, users can:
- **Adjust Amount Using Buttons**:
  - Red minus button (-) decreases by 1,000 DA
  - Green plus button (+) increases by 1,000 DA
- **Manual Input**: Type exact amount directly in the input field
- **Confirm Button**: Save the modified amount

### 4. State Management
New state variables added:
- `workerPaymentAmount`: Stores the manually edited payment amount
- `editingWorkerPayment`: Boolean flag to toggle edit mode on/off

### 5. User Experience Flow
1. User selects a worker from the enhanced worker cards
2. If the worker is percentage-based:
   - Payment information box appears with calculated amount
   - User can see the percentage and base calculation
3. User clicks the payment amount to edit it
4. User can adjust via +/- buttons or type directly
5. User clicks "Confirmer" to confirm changes
6. Payment amount updates in the display

## Code Changes

### Files Modified
- **src/components/Reservations.tsx**

### New Imports
- `Minus` icon from lucide-react (for the decrease payment button)

### New State Variables (in Reservations component)
```typescript
const [workerPaymentAmount, setWorkerPaymentAmount] = useState(0);
const [editingWorkerPayment, setEditingWorkerPayment] = useState(false);
```

### Updated Functions
- **handleFinalize()**: Initializes worker payment states when opening finalization modal
- **Worker Selection Section**: Completely redesigned from dropdown to card-based interface

### UI Components Added
1. **Worker Cards Grid**: Displays all available workers (current user + all employees)
2. **Payment Information Box**: Shows percentage calculation and editable amount
3. **Edit Mode Interface**: Minus/Plus buttons and manual input field

## Styling Details
- Uses Tailwind CSS with custom classes
- **Selected Worker Card**: 
  - Background: `bg-accent/10`
  - Border: `border-accent` with shadow
  - Shows checkmark icon
- **Payment Box**:
  - Background: `bg-accent/5`
  - Border: `border-accent/10`
- **Edit Mode Buttons**:
  - Minus: Red themed (`bg-red-500/10`, `text-red-500`)
  - Plus: Green themed (`bg-green-500/10`, `text-green-500`)
- **Confirm Button**: Accent colored with hover effect

## Integration with Existing Features
- Works seamlessly with service selection feature
- Compatible with existing finalization workflow
- Maintains all previous functionality
- Payment calculation updates when services are added/removed

## Database Considerations
- Worker payment information is calculated in real-time based on:
  - Worker's payment type (from `profiles.payment_type`)
  - Worker's percentage (from `profiles.percentage`)
  - Service final price (sum of prestation + selected services)
- No new database modifications required
- Historical data can be tracked through reservation status changes

## Future Enhancements
- Save payment history to `employee_payments` table during finalization
- Display payment breakdown in the printed invoice
- Add payment notes/comments for special cases
- Implement approval workflow for manually edited amounts exceeding threshold

## User Testing Checklist
- [ ] User can select workers from the card interface
- [ ] Selected worker shows visual feedback (highlight + checkmark)
- [ ] Percentage workers show payment information box
- [ ] Non-percentage workers don't show payment info
- [ ] Edit button opens editable interface
- [ ] +/- buttons adjust amount by 1,000 DA increments
- [ ] Manual input accepts any numeric value
- [ ] Confirm button closes edit mode and updates display
- [ ] Payment information remains correct after adding/removing services
- [ ] Finalization saves correct worker ID
