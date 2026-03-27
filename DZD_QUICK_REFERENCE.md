# DZD Currency & Calculations - Quick Reference

## What Changed

### Currency
- **Old Format**: €EUR (Euro)
- **New Format**: DA (Algerian Dinars)
- **Applied To**: All components across the app

### Benefit Formula
```
NET BENEFIT = Total Paid by Clients - Total Expenses

Example:
Total Paid: 100,000 DA
Expenses:
  - Supplies: 20,000 DA
  - Salaries: 40,000 DA
  - Rent/Utilities: 15,000 DA
Total Expenses: 75,000 DA

NET BENEFIT = 100,000 - 75,000 = 25,000 DA (25% margin)
```

## Key Features Implemented

### 1. Reports & Statistiques Interface
✅ **4 KPI Cards:**
- Revenue (Green) - Total finalized prestations
- Collections (Blue) - Actual payments received  
- Outstanding Debt (Red) - Unpaid amounts
- Net Profit (Accent) - Final benefit after expenses

✅ **Expense Analysis:**
- Supplies breakdown (Red)
- Salaries breakdown (Amber)
- Store fees breakdown (Purple)
- Total and percentages

✅ **Service Performance:**
- Top 5 services by revenue
- Revenue per service
- Collection rates
- Animated graphs

✅ **Statistics Cards:**
- Total reservations
- Unique clients
- Average basket value
- Satisfaction rating

### 2. Dashboard
✅ Updated all KPI displays to DZD
✅ Revenue calculations for finalized reservations only
✅ Weekly revenue chart in DZD

### 3. All Other Components
✅ Reservations - DZD pricing
✅ Prestations - DZD pricing
✅ Inventory - DZD costs
✅ Expenses - DZD amounts
✅ Employees - DZD salaries

## Expense Categories

### Supplies (Stock/Products)
- Materials for services
- Product inventory
- Supplies
- Category: `supplies` or `achats`

### Salaries (Worker Payments)
- Employee compensation
- Worker bonuses
- Category: `salary` or `salaire`

### Store Fees (Operating)
- Rent/Location cost
- Utilities/Electricity
- Water/Internet
- Category: `rent`, `utilities`, or `loyer`

## Correct Calculations

| Metric | Formula | Example |
|--------|---------|---------|
| **Revenue** | SUM(finalized.total_price) | 200,000 DA |
| **Paid** | SUM(finalized.paid_amount) | 180,000 DA |
| **Debt** | Revenue - Paid | 20,000 DA |
| **Expenses** | Supplies + Salaries + Store | 120,000 DA |
| **Benefit** | Paid - Expenses | 60,000 DA |
| **Margin %** | (Benefit / Paid) × 100 | 33.3% |

## Number Format

All prices display as: `X XXX,XX DA`

Examples:
- 1000 → `1 000,00 DA`
- 50000 → `50 000,00 DA`  
- 125.5 → `125,50 DA`
- Decimal separator: `,` (comma)
- Thousands separator: ` ` (space)

## Components Using New Format

| Component | Location |
|-----------|----------|
| Reports | src/components/Reports.tsx |
| Dashboard | src/components/Dashboard.tsx |
| Reservations | src/components/Reservations.tsx |
| Prestations | src/components/Prestations.tsx |
| Inventory | src/components/Inventory.tsx |
| Expenses | src/components/Expenses.tsx |
| Employees | src/components/Employees.tsx |

## Implementation Details

### Shared Function (lib/utils.ts)
```typescript
export function formatCurrency(value: number | undefined | null): string {
  if (!value && value !== 0) return '0,00 DA';
  return new Intl.NumberFormat('fr-DZ', { 
    style: 'currency', 
    currency: 'DZD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
```

### Usage in Components
```typescript
import { formatCurrency } from '../lib/utils';

// Display currency
<span>{formatCurrency(1000)}</span> // Output: 1 000,00 DA
```

## Data Flow

```
Database (Supabase)
    ↓
Fetch Data (Reservations, Expenses, Services)
    ↓
Calculate Metrics:
  - Total Revenue (finalized only)
  - Total Paid
  - Total Debt
  - Expense Categories
  - Net Benefit
    ↓
Format with formatCurrency()
    ↓
Display on Cards/Charts with DZD
```

## Verification Checklist

- [x] All prices show "DA" suffix
- [x] Benefit = Paid - Expenses (correct formula)
- [x] Only finalized reservations count for revenue
- [x] Expenses properly categorized
- [x] Collection % calculated correctly
- [x] No console errors
- [x] All components updated
- [x] Responsive on all devices
- [x] Animations smooth

## Notes

- All calculations use actual database values
- Null/undefined values default to "0,00 DA"
- Benefit can be negative (shown in red)
- Percentages calculated with 2 decimal places
- Collections tracked separately from benefit
