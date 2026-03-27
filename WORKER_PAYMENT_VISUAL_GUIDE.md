# Worker Payment Feature - Visual Guide

## Feature Workflow

### Step 1: Opening Finalization
When user clicks "Finaliser" on a reservation:
- Finalization modal opens
- Services section appears (existing feature)
- Worker selection section shows **new card-based interface**

### Step 2: Worker Selection Screen
```
┌─────────────────────────────────────────┐
│ Employé ayant effectué le travail      │
├─────────────────────────────────────────┤
│ ┌─ [✓] Moi-même (Current User) ───────┐│ (highlighted if selected)
│ │ 👤 John Doe                          ││
│ │   15% de la prestation               ││
│ └──────────────────────────────────────┘│
│                                          │
│ ┌─ [ ] Sarah Johnson ──────────────────┐│
│ │ 👤 Sarah Johnson                     ││
│ │   10% de la prestation               ││
│ └──────────────────────────────────────┘│
│                                          │
│ ┌─ [ ] Mike Chen ──────────────────────┐│
│ │ 👤 Mike Chen                         ││
│ │   Paiement à la journée              ││
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**Card States:**
- **Selected**: Background color + border + shadow + checkmark
- **Unselected**: White background + subtle border
- **Hover**: Border highlights slightly on unselected cards

**Payment Type Indicators:**
- Percentage worker: "X% de la prestation"
- Daily worker: "Paiement à la journée"
- Monthly worker: "Paiement mensuel"

### Step 3: Payment Information Display (For Percentage Workers)
After selecting a percentage-based worker, payment info appears:

```
┌─────────────────────────────────────────┐
│ ✂️  Paiement employé                    │
│ 15% de 50,000.00 DA                     │
├─────────────────────────────────────────┤
│       💰 7,500.00 DA          [✏️ Edit] │
└─────────────────────────────────────────┘
```

**Elements:**
- Scissors icon (visual indicator)
- Percentage label
- Base service amount
- Current calculated payment (large serif font)
- Edit button with pencil icon

### Step 4: Edit Mode (Click on Payment Amount)
When user clicks the payment amount:

```
┌────────────────────────────────────────────┐
│ Montant à payer (DA)                       │
├────────────────────────────────────────────┤
│  [-] │  7,500  │ [+]  (≈1,000 DA increments)
│ Red  │  Input  │ Green
│ -1000│  Field  │ +1000
├────────────────────────────────────────────┤
│            [Confirmer]                     │
└────────────────────────────────────────────┘
```

**Edit Controls:**
- **Red Minus Button**: Decreases by 1,000 DA
- **Center Input**: Type exact amount
- **Green Plus Button**: Increases by 1,000 DA
- **Confirm Button**: Saves and closes edit mode

**Validation:**
- Prevents negative values (0 is minimum)
- Accepts any positive number
- Smooth animations when toggling edit mode

## Visual Design Elements

### Colors
- **Accent**: Primary brand color (orange/accent)
- **Background**: white/light gray
- **Text**: dark/ink color
- **Minus Button**: Red theme (danger/decrease)
- **Plus Button**: Green theme (success/increase)
- **Highlights**: Accent color with opacity variations

### Typography
- **Labels**: 10px, bold, uppercase, tracking-widest
- **Names**: Font bold, regular size
- **Payment Amount**: Large (18px+), serif font, bold
- **Buttons**: Bold, uppercase where appropriate

### Spacing & Sizing
- Card padding: 16px (p-4)
- Grid gap: 12px (gap-3)
- Button height: ~40px
- Icon sizes: 16-20px

### Animations
- **Card Selection**: Smooth color transition (border, background)
- **Payment Box**: Fade in + slide down (opacity + y offset)
- **Edit Mode**: Expand/collapse with smooth height animation
- **Hover States**: Color transitions on interactive elements

## User Experience Flow

### Path 1: Non-Percentage Worker
```
Select Worker → No Payment Box → Continue with Finalization
```
Payment information only shows for percentage-based workers.

### Path 2: Percentage Worker (Accept Default)
```
Select Worker → Payment Box Shows (Auto-calculated) → Continue
```
Default payment calculated automatically based on percentage.

### Path 3: Percentage Worker (Edit Payment)
```
Select Worker → Payment Box Shows → Click Amount → Edit Mode
    ↓
Adjust with +/- buttons or type value → Click Confirm
    ↓
Amount Updates → Continue with Finalization
```

## State Management

### State Variables
```typescript
// Worker payment states
const [workerPaymentAmount, setWorkerPaymentAmount] = useState(0);
const [editingWorkerPayment, setEditingWorkerPayment] = useState(false);
```

### State Updates
1. **On Worker Selection**: Calculate payment, reset edit mode
   ```
   setWorkerPaymentAmount(calculatedAmount)
   setEditingWorkerPayment(false)
   ```

2. **On Edit Button Click**: Enable edit mode
   ```
   setEditingWorkerPayment(true)
   ```

3. **On Confirm Button Click**: Disable edit mode, keep amount
   ```
   setEditingWorkerPayment(false)
   ```

4. **On Minus Click**: Decrease by 1,000
   ```
   setWorkerPaymentAmount(Math.max(0, workerPaymentAmount - 1000))
   ```

5. **On Plus Click**: Increase by 1,000
   ```
   setWorkerPaymentAmount(workerPaymentAmount + 1000)
   ```

6. **On Manual Input**: Update with validated value
   ```
   setWorkerPaymentAmount(Math.max(0, Number(e.target.value)))
   ```

## Integration Points

### With Service Selection
- Services are added/removed in separate section
- Final price updates when services change
- Worker payment recalculates automatically based on new final price
- Payment display updates in real-time

### With Finalization Save
- Selected worker ID is saved to database
- Payment amount is display-only (for reference)
- Could be extended to save payment history in future

## Responsive Behavior

### Desktop (lg and up)
- Worker cards in single column
- Full-width payment editing interface
- Plenty of padding and spacing

### Tablet/Mobile
- Cards stack in single column
- Full-width buttons
- Touch-friendly button sizes
- Optimized spacing for smaller screens

## Accessibility Features

- Buttons have proper click handlers
- Text is properly labeled and semantic
- Color contrasts meet standards
- Icon buttons have hover/focus states
- Tab-navigable interactive elements
- Clear visual feedback for interactions

## Example Scenarios

### Scenario 1: 15% Worker
```
Base Price: 50,000 DA
Service 1: +10,000 DA
Service 2: +5,000 DA
─────────────────────
Final Price: 65,000 DA
Worker Payment: 15% = 9,750 DA
```
User can edit to any amount (e.g., 10,000 DA for rounding)

### Scenario 2: Multiple Services
```
Each time a service is added/removed:
1. Final price updates
2. Worker payment recalculates
3. Display updates automatically
4. User can still edit to override
```

### Scenario 3: Non-Percentage Worker
```
Daily/Monthly worker selected:
→ No payment information box
→ No editable payment amount
→ Normal finalization continues
```
