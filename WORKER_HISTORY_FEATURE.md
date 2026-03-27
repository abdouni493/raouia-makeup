# Worker History Feature Documentation

## Overview
A comprehensive history feature has been added to the Employees section that displays detailed information about each worker's activities, including their work assignments, payment status, advance payments (acomptes), and absences.

## Features Implemented

### 1. History Button on Worker Cards
- Added a **"Historique"** (History) button to each worker card in the Employees component
- Button color: Blue (#5B9BFF) with hover effect
- Icon: History icon from lucide-react
- Positioned as the first button in the action buttons grid

### 2. Comprehensive History Modal
When clicking the History button, a large modal opens displaying:

#### Employee Summary Section
- **Type of Payment**: Shows if the worker is paid monthly, daily, or by percentage
- **Total Works**: Number of completed tasks
- **Total Advances (Acomptes)**: Sum of all advance payments
- **Total Absences**: Sum of all absence deductions

#### Works Section
Displays all work/reservations assigned to the worker with:
- **Client Name**: Name of the client serviced
- **Date**: Full formatted date (e.g., "Jeudi 27 mars 2026")
- **Work Status**: 
  - Finalized (green badge)
  - Pending (blue badge)
  - Cancelled (red badge)
- **Total Price**: Amount for the work
- **For Percentage-Based Workers**: Shows:
  - Amount payable based on percentage
  - Amount actually paid
  - Color-coded indicators

#### Payments, Advances & Absences Section
Lists all financial transactions chronologically (newest first):

Each entry shows:
- **Type Badge**: Color-coded (Acompte=Blue, Absence=Red, Payment=Green)
- **Description**: Optional notes about the transaction
- **Date**: Full formatted date
- **Amount**: With + or - symbol and color-coded
  - Acomptes: Blue with + prefix
  - Absences: Red with - prefix
  - Payments: Green with + prefix

#### Summary for Percentage-Based Workers
A special section appears only for workers with percentage-based payment:
- **Total Works Value**: Sum of all work prices
- **Percentage Calculation**: Automatic calculation of 30%, 25%, etc.
- **Total Paid**: Sum of all payments made
- **Total Advances**: Sum of all acomptes
- **Total Absences**: Sum of absence deductions
- **Balance**: Remaining amount due or overpaid (green if due, red if overpaid)

## Database Integration

### Data Sources
1. **Reservations Table**: 
   - Fetches all reservations where `worker_id` matches the selected worker
   - Retrieves: client_name, date, status, total_price, paid_amount

2. **Employee Payments Table**:
   - Fetches all payments for the worker
   - Filters by type: 'salary', 'acompte', 'absence'
   - Automatically sorted by date (newest first)

### Database Queries
```typescript
// Get all works assigned to a worker
const { data: reservationsData } = await supabase
  .from('reservations')
  .select('*')
  .eq('worker_id', emp.id)
  .order('date', { ascending: false });

// Get all payments for the worker
const employeePayments = payments.filter(p => p.employeeId === emp.id)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
```

## UI/UX Design

### Modal Structure
- **Header**: Employee name, subtitle, close button
- **Summary Cards**: 4-column grid (responsive to 2 columns on mobile)
- **Content Sections**: 
  - Works section with scrollable list
  - Payments section with scrollable list
  - Summary section (percentage workers only)
- **Footer**: Close button

### Visual Indicators
- **Status Badges**: Different colors for different statuses
- **Amount Colors**: 
  - Green for positive amounts (payments received)
  - Red for deductions (absences)
  - Blue for advances
- **Icons**: Briefcase for works, DollarSign for payments

### Responsive Design
- Desktop: Full 4-column summary grid
- Mobile/Tablet: 2-column grid, adjusted spacing
- Full-height scrollable content area with custom scrollbar
- Max-width of 4xl (56rem) on desktop

## Code Changes

### Files Modified
1. **src/components/Employees.tsx**
   - Added `History` icon import from lucide-react
   - Added `historyModal` state management
   - Added `historyData` state for storing fetched data
   - Added `openHistoryModal()` function
   - Updated button grid from 3 to 4 columns
   - Added complete history modal UI

### New State Variables
```typescript
const [historyModal, setHistoryModal] = useState<{ 
  isOpen: boolean; 
  employee: Employee | null 
}>({ isOpen: false, employee: null });

const [historyData, setHistoryData] = useState<{
  works: Array<{ 
    id: string; 
    name: string; 
    date: string; 
    status?: string 
  }>;
  payments: EmployeePayment[];
}>({ works: [], payments: [] });
```

### New Functions
```typescript
const openHistoryModal = async (emp: Employee) => {
  // Fetches all reservations for the worker
  // Fetches all payments for the worker
  // Maps data to component state
  // Opens the modal
}
```

## Usage Instructions

### For Users
1. Navigate to the Employees section
2. Find the worker card you want to view history for
3. Click the blue "Historique" (History) button
4. Review:
   - All work assignments and completion status
   - Payment history with dates and amounts
   - Advance payments and absence deductions
   - Balance owed or overpaid
5. Close the modal by clicking the X or Close button

### For Developers
- The feature automatically fetches data when opening
- All data is sorted chronologically (newest first)
- Calculations are performed on the client side
- No API calls are made except for initial data fetch
- Compatible with all payment types (monthly, daily, percentage)

## Features by Payment Type

### Monthly/Daily Workers
- Shows all works and financial transactions
- No percentage calculations
- Simple balance tracking

### Percentage-Based Workers
- Shows all works with calculated earnings
- Displays payment status for each work (paid/unpaid)
- Shows advance payments against percentage earnings
- Calculates remaining balance
- Special summary section with breakdown

## Future Enhancement Possibilities

1. **Export to PDF**: Generate a detailed report
2. **Date Filtering**: Filter history by date range
3. **Payment Reconciliation**: Mark works as paid/unpaid
4. **Salary Calculation**: Auto-calculate final salary
5. **Statistics**: Add charts and graphs
6. **Email Reports**: Send history via email to worker
7. **Print Functionality**: Print-optimized view

## Troubleshooting

### No History Displayed
- Ensure worker has been assigned to reservations
- Check database for employee_payments records
- Verify worker_id matches in reservations table

### Incorrect Calculations
- Verify percentage value in worker profile
- Check all payments are properly recorded
- Ensure dates are correct in database

### Modal Not Opening
- Check browser console for errors
- Verify supabase connection is active
- Confirm worker record exists in database

## Technical Notes

- Uses Framer Motion for animations
- Responsive design with Tailwind CSS
- Custom scrollbar styling with `.custom-scrollbar` class
- Currency formatting using `formatCurrency()` helper
- Dates formatted in French locale
- Color scheme follows existing app design system
