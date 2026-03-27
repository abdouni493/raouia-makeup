# Worker History Feature - Visual Reference Guide

## 📍 Location of the Feature

### Worker Card Layout (BEFORE)
```
┌─────────────────────────────────────────┐
│ [Worker Profile Header]                 │
├─────────────────────────────────────────┤
│ Phone, Address, Hire Date, Salary Info  │
├─────────────────────────────────────────┤
│ [Acompte] [Absence] [Paiement]         │  ← 3 buttons
├─────────────────────────────────────────┤
│ [Modifier] [Delete]                     │
└─────────────────────────────────────────┘
```

### Worker Card Layout (AFTER - WITH HISTORY)
```
┌─────────────────────────────────────────┐
│ [Worker Profile Header]                 │
├─────────────────────────────────────────┤
│ Phone, Address, Hire Date, Salary Info  │
├─────────────────────────────────────────┤
│ [Historique] [Acompte] [Absence] [Paiement]  │  ← 4 buttons (NEW!)
├─────────────────────────────────────────┤
│ [Modifier] [Delete]                     │
└─────────────────────────────────────────┘
```

## 🔵 History Button Details

```
┌─────────────────────────────┐
│ 📜 HISTORIQUE              │  ← History Icon (lucide-react)
└─────────────────────────────┘
Color: Blue (#5B9BFF)
Hover: Light Blue Background
Text: HISTORIQUE (uppercase)
Font Size: 10px, Bold, Uppercase, Wide Letter Spacing
```

---

## 📊 History Modal Structure

### Full Modal View
```
╔═════════════════════════════════════════════════════════════╗
║ 📜 Historique de [Worker Name]                         [X]  ║
║ Tous les travaux, paiements, acomptes et absences          ║
╠═════════════════════════════════════════════════════════════╣
║                                                             ║
║  ┌────────────┬────────────┬────────────┬────────────┐    ║
║  │ Type Paie. │ Total Work │ Acomptes   │ Absences   │    ║
║  │ Pourcent%  │     5      │  5000 DA   │  1000 DA   │    ║
║  └────────────┴────────────┴────────────┴────────────┘    ║
║                                                             ║
║  📋 Travaux Effectués (5)                                  ║
║  ┌─────────────────────────────────────────────────────┐   ║
║  │ Mme Dubois                          [Finalisé] ✓     │   ║
║  │ Jeudi 27 mars 2026                                  │   ║
║  │ 8000 DA                                             │   ║
║  │ Montant payable: 2400 DA  |  Payé: 1000 DA         │   ║
║  └─────────────────────────────────────────────────────┘   ║
║                                                             ║
║  💰 Paiements, Acomptes et Absences (8)                    ║
║  ┌─────────────────────────────────────────────────────┐   ║
║  │ [ACOMPTE] Avance salaire           +2000 DA         │   ║
║  │ Lundi 24 mars 2026                                  │   ║
║  └─────────────────────────────────────────────────────┘   ║
║  ┌─────────────────────────────────────────────────────┐   ║
║  │ [ABSENCE] Absence maladie            -500 DA        │   ║
║  │ Dimanche 23 mars 2026                               │   ║
║  └─────────────────────────────────────────────────────┘   ║
║                                                             ║
║  📊 Résumé des Paiements en Pourcentage (30%)             ║
║  ┌─────────────────┬──────────────┬───────────────┐       ║
║  │ Total Travaux   │ 30% Montant  │ Total Payé    │       ║
║  │ 25000 DA        │ 7500 DA      │ 3500 DA       │       ║
║  │ Acomptes        │ 2000 DA      │ Solde: 1500 DA│       ║
║  │ Absences        │ -500 DA      │               │       ║
║  └─────────────────┴──────────────┴───────────────┘       ║
║                                                             ║
╠═════════════════════════════════════════════════════════════╣
║                        [Fermer]                            ║
╚═════════════════════════════════════════════════════════════╝
```

---

## 📋 Section 1: Employee Summary

### Four-Column Grid (Desktop)
```
┌─────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ TYPE PAI │  │ TRAVAUX  │  │ ACOMPTES │  │ ABSENCES │ │
│  │          │  │          │  │          │  │          │ │
│  │ Mensuel  │  │    8     │  │ 5000 DA  │  │ 1000 DA  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Two-Column Grid (Mobile/Tablet)
```
┌──────────────┬──────────────┐
│  TYPE PAIE   │  TRAVAUX     │
│  Pourcentage │      8       │
├──────────────┼──────────────┤
│  ACOMPTES    │  ABSENCES    │
│  5000 DA     │  1000 DA     │
└──────────────┴──────────────┘
```

---

## 🎯 Section 2: Works/Reservations

### Single Work Entry
```
┌───────────────────────────────────────────────────┐
│ Mme Dubois                  [Finalisé] ✓           │
│ 📅 Jeudi 27 mars 2026                            │
│ 💰 8000 DA                                         │
│                                                   │
│ Pour travailleurs en pourcentage:                │
│ Montant payable: 2400 DA (30%)                  │
│ Payé: 1000 DA ✓                                 │
└───────────────────────────────────────────────────┘
```

### Status Badges
```
[Finalisé] → Green background, green text ✓ Completed
[En Attente] → Blue background, blue text ⏳ Pending
[Annulé] → Red background, red text ✗ Cancelled
```

### Works Section Empty State
```
┌───────────────────────────────────────────────────┐
│                     📋                            │
│              Aucun travail enregistré             │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 💰 Section 3: Payments, Advances & Absences

### Acompte (Advance Payment) Entry
```
┌───────────────────────────────────────────────────┐
│ [ACOMPTE] Avance salaire              +2000 DA    │
│ 📅 Lundi 24 mars 2026                           │
└───────────────────────────────────────────────────┘
Color: Blue badge, Blue amount
Prefix: +
```

### Absence Entry
```
┌───────────────────────────────────────────────────┐
│ [ABSENCE] Absence maladie               -500 DA   │
│ 📅 Dimanche 23 mars 2026                        │
└───────────────────────────────────────────────────┘
Color: Red badge, Red amount
Prefix: -
```

### Payment Entry
```
┌───────────────────────────────────────────────────┐
│ [PAIEMENT] Salaire mars                +30000 DA  │
│ 📅 Samedi 22 mars 2026                          │
└───────────────────────────────────────────────────┘
Color: Green badge, Green amount
Prefix: +
```

### Payments Section Empty State
```
┌───────────────────────────────────────────────────┐
│                      💰                          │
│           Aucun paiement enregistré               │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 📊 Section 4: Percentage Summary (Only for % Workers)

### Summary Grid
```
┌─────────────────────────────────────────────────────────────┐
│ Résumé des Paiements en Pourcentage (30%)                  │
├──────────────────┬──────────────────┬────────────────────┤
│ Total Travaux    │ 30% Montant      │ Total Payé         │
│ 25000 DA         │ 7500 DA          │ 3500 DA            │
├──────────────────┼──────────────────┼────────────────────┤
│ Acomptes         │ Absences         │ Solde              │
│ 2000 DA          │ -500 DA          │ 1500 DA (À PAYER)  │
└──────────────────┴──────────────────┴────────────────────┘
```

### Balance Indicator
```
Solde: 1500 DA     ← Green if positive (amount owed)
Solde: -500 DA     ← Red if negative (overpaid)
```

---

## 🎨 Color Scheme

### Transaction Types
```
ACOMPTE (Advance)   → Blue (#3B82F6)
ABSENCE (Deduction) → Red (#EF4444)
PAIEMENT (Payment)  → Green (#10B981)
```

### Amount Display
```
+Amount (Acompte)   → Blue
-Amount (Absence)   → Red with minus
+Amount (Payment)   → Green
```

### Status Badges
```
Finalisé (Completed) → Green background, Green text
En Attente (Pending) → Blue background, Blue text
Annulé (Cancelled)   → Red background, Red text
```

### Cards & Backgrounds
```
Main Cards           → Light background (#F0F0F0)
Hover Cards          → Slightly darker border
Summary Cards        → Light accent background
Footer               → White with top border
Header               → Gradient background (accent)
```

---

## 📱 Responsive Breakpoints

### Desktop (≥1024px)
- 4-column summary grid
- Full width modal
- Side-by-side content
- Large fonts and spacing

### Tablet (768px - 1023px)
- 2-column summary grid
- Full width modal
- Adjusted padding
- Medium fonts

### Mobile (<768px)
- 1-column or 2-column summary (wrapped)
- Full screen modal
- Reduced padding
- Optimized touch targets
- Adjusted font sizes

---

## 🎬 Animations

### Modal Open
```
Opacity: 0 → 1 (200ms)
Scale: 0.95 → 1 (200ms)
Y Position: 20px → 0 (200ms)
```

### Modal Close
```
Opacity: 1 → 0 (150ms)
Scale: 1 → 0.95 (150ms)
Y Position: 0 → 20px (150ms)
```

### Card Hover
```
Border Color: Normal → Accent/30 (300ms)
```

---

## 🔄 User Interaction Flow

```
1. User views Employees section
   ↓
2. Sees worker cards with new "Historique" button (blue)
   ↓
3. Clicks "Historique" button
   ↓
4. Modal opens with smooth animation
   ↓
5. Modal displays:
   - Summary statistics
   - All assigned works
   - Complete payment history
   - Balance calculation
   ↓
6. User can scroll through all sections
   ↓
7. User clicks "Fermer" or X to close
   ↓
8. Modal closes with animation
```

---

## ✨ Key Visual Elements

- **Icons**: Briefcase (📋), DollarSign (💰), History (📜)
- **Badges**: Colored labels for transaction types
- **Borders**: Subtle borders with hover effects
- **Spacing**: Consistent 8px, 16px, 24px spacing
- **Typography**: Bold headers, regular body text, small labels
- **Shadows**: Subtle shadows on cards and modal

---

## 📐 Dimensions

```
Modal Width: max-w-4xl (56rem / 896px)
Modal Height: max-h-[90vh] (90% of viewport)
Card Padding: p-4 (16px) or p-5 md:p-8 (20px/32px)
Border Radius: 16px (cards), 24px/32px (modal)
Gap Between Items: 8px (gap-2), 12px (gap-3), 16px (gap-4)
```

---

## 🎯 Summary

The History feature is a comprehensive modal that displays:
- Quick statistics about the worker's activities
- All work assignments with details and payment status
- Complete financial transaction history
- Balance calculation for percentage-based workers
- All information formatted in French with dates and currency

The interface is:
- Responsive on all devices
- Color-coded for easy reading
- Organized in logical sections
- Smooth and intuitive to use
- Fully integrated with the worker cards
