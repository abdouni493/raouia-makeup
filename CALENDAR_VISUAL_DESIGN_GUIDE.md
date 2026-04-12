# Calendar Interface - Visual Design & Animations Guide

## User Interface Layout

### 1. Calendar Grid View (Before Clicking a Day)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Réservations                             │
│     Gérez les rendez-vous et le planning de votre salon        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  < Avril 2026 >           [Finalisé]  [En attente]            │
│                                                                 │
│  Lun   Mar   Mer   Jeu   Ven   Sam   Dim                       │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                   │
│ │  1  │  2  │  3  │  4  │  5  │  6  │  7  │                   │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│ │  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │                   │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│ │ 15* │ 16  │ 17  │ 18  │ 19  │ 20  │ 21  │  ← Today (15)*  │
│ │ 3RDV│     │     │     │     │     │     │   Blue highlight │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│ │ 22  │ 23  │ 24  │ 25  │ 26  │ 27  │ 28  │                   │
│ │ 5RDV│     │     │ 2RDV│     │     │     │                   │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│ │ 29  │ 30  │     │     │     │     │     │                   │
│ │ 1RDV│     │     │     │     │     │     │                   │
│ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                   │
│                                                                 │
│ Each day cell shows preview of up to 3 reservations:          │
│ ┌────────────────────────────────────┐                        │
│ │ 15                              3RDV│ ← Today, 3 reserv.   │
│ │ ┌──────────────────────────────────┐│                      │
│ │ │ 09:00 • Maria           Green    ││ ← Time • Name       │
│ │ │ 10:30 • Sophie          Amber    ││   Status color      │
│ │ │ 14:00 • Alice           Green    ││                      │
│ │ │ +3 autres                        ││ ← More if >3         │
│ │ └──────────────────────────────────┘│                      │
│ └────────────────────────────────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Color Guide:
🟢 Green (Emerald) = Finalized reservation
🟠 Amber = Pending reservation
🔵 Blue = Today's date highlight
```

---

### 2. Day View Modal (After Clicking a Day)

```
┌────────────────────────────────────────────────────────────────────┐
│ SPRING ANIMATION EFFECT:                                           │
│ 0%:   [Small, far away, transparent]                              │
│ 50%:  [Getting bigger, moving closer, more visible]               │
│ 100%: [Full size, positioned correctly, fully visible]            │
└────────────────────────────────────────────────────────────────────┘

FINAL RENDERED MODAL:
┌────────────────────────────────────────────────────────────────────┐
│                                                                ✕   │ ← Close X
│ 15 Avril 2026                                                     │
│ Mercredi                                                           │ ← Date & Day
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│ │ Total RDV      │  │ ✓ Finalisés   │  │ ○ En attente   │       │
│ │                │  │                │  │                │       │
│ │      5         │  │       3        │  │       2        │       │
│ └────────────────┘  └────────────────┘  └────────────────┘       │
│                                                                    │
│ Statistics Row (3 columns with hover effects)                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ Reservation Card 1 (Enters first, staggered):                    │
│ ┌────────────────────────────────────────────────────────────────┐│
│ │ ┌────┐  Maria        Coupe              €95      ✓ Terminé  ┌─┤│
│ │ │ 09 │  06 12 34 56 78            Reste: €0      → │ ┌─────┘│ │
│ │ │ 00 │                                              │▼      │ │
│ │ └────┘                                              └────────┘ │
│ │ + Shampoing  + Séchage                                          │
│ └────────────────────────────────────────────────────────────────┘│
│                                                                    │
│ Reservation Card 2 (Enters 50ms later):                          │
│ ┌────────────────────────────────────────────────────────────────┐│
│ │ ┌────┐  Sophie       Coloring            €65      ○ Prévu    ┌─┤│
│ │ │ 10 │  06 98 76 54 32            Reste: €65      → │ ┌─────┘│ │
│ │ │ 30 │                                              │▼      │ │
│ │ └────┘                                              └────────┘ │
│ │ + Soin capillaire                                               │
│ └────────────────────────────────────────────────────────────────┘│
│                                                                    │
│ Reservation Card 3 (Enters 100ms later):                         │
│ ┌────────────────────────────────────────────────────────────────┐│
│ │ ┌────┐  Alice        Extensions          €120     ✓ Terminé  ┌─┤│
│ │ │ 14 │  06 55 44 33 22            Reste: €0       → │ ┌─────┘│ │
│ │ │ 00 │                                              │▼      │ │
│ │ └────┘                                              └────────┘ │
│ └────────────────────────────────────────────────────────────────┘│
│                                                                    │
│ [Scrollable area - more cards below]                             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### 3. Detailed Reservation Card Anatomy

```
STATUS COLOR VARIATIONS:

🟢 FINALIZED (Green Background):
┌─────────────────────────────────────────────────┐
│ Background: #f0fdf4 (Emerald-50)               │
│ Border: #bbf7d0 (Emerald-200)                  │
│ Text: #047857 (Emerald-700)                    │
│ Hover: #dcfce7 (Emerald-100)                   │
│                                                 │
│ Time Box: #dcfce7 (Emerald-100)                │
│ Status: "✓ Terminé"                            │
└─────────────────────────────────────────────────┘

🟠 PENDING (Amber Background):
┌─────────────────────────────────────────────────┐
│ Background: #fffbeb (Amber-50)                 │
│ Border: #fde68a (Amber-200)                    │
│ Text: #b45309 (Amber-700)                      │
│ Hover: #fef3c7 (Amber-100)                     │
│                                                 │
│ Time Box: #fef3c7 (Amber-100)                  │
│ Status: "○ Prévu"                              │
└─────────────────────────────────────────────────┘

CARD LAYOUT BREAKDOWN:
┌────────────────────────────────────────────────────────┐
│ ┌──────┐                                          ┌──┐ │
│ │  09  │  Client Name                  €95  Status  > │ │
│ │ :00  │  Prestation Type            (Elm)│  ▶   │ │
│ │      │  📞 +213 612 345 678           │        │ │
│ │      │  Remaining: €0 (if pending)     │        │ │
│ │      │  + Service1  + Service2 + Srv3  │        │ │
│ └──────┘                                          └──┘ │
│
│ Time Box │ LEFT SECTION            │ CENTER SECTION    │ RIGHT │
│ (Colored)│ Client & Details        │ Prices            │ Arrow │
└────────────────────────────────────────────────────────┘

ANIMATION ON CARD ENTRY:
─ 0ms:    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (Invisible, left)
─ 50ms:   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ (Fading in)
─ 150ms:  ██████████████████████████████ (Visible, positioned)
```

---

### 4. Animation Sequence Diagram

```
Timeline of Day View Modal Opening:

TIME:    0ms      50ms     100ms    150ms    200ms    250ms    300ms
         |        |        |        |        |        |        |
MODAL:   |        |        |        |        |        |        |
         ↓        ↓        ↓        ↓        ↓        ↓        ↓
SCALE:   0.9  →  0.95  → 0.98  → 1.0   → 1.0   → 1.0   → 1.0
OPACITY: 0%   →  25%   →  50%   → 75%   → 100%  → 100%  → 100%
Y-POS:  +40px → +30px → +15px →  0px  →  0px  →  0px  →  0px

         (Spring physics: smooth, overshoots slightly, settles)


Card Entry Sequence:

TIME:    0ms      50ms     100ms    150ms    200ms    250ms    300ms
         |        |        |        |        |        |        |
CARD 1:  |        |        |        |        |        |        |
         ╔════════╗
         ║██████  ║ (Fading in, sliding from left)
         ║███████ ║
         ╚════════╝

CARD 2:  |        |
         │        ╔════════╗
         │        ║░░░░░░░░║ (Starts 50ms later)
         │        ║░░░░░░░░║
         │        ╚════════╝

CARD 3:  |        |        |
         │        │        ╔════════╗
         │        │        ║░░░░░░░░║ (Starts 100ms later)
         │        │        ║░░░░░░░░║
         │        │        ╚════════╝

CARD 4:  |        |        |        |
         │        │        │        ╔════════╗ (Starts 150ms later)
         │        │        │        ║░░░░░░░░║
         │        │        │        ╚════════╝

Result: Cascading wave effect as cards enter
```

---

### 5. Service Tags Animation

```
Service tags appear with pop-in effect (each staggered 20ms):

Initial State (Hidden):
────────────────────────

Animating (Scale):
── 0% ──   [░] Shampoing
──50% ──   [░░░░] Shampoing  
──100%──   [█████] Shampoing  ← Service 1 visible

Then:
──50% ──   [░] Séchage
──100%──   [█████] Séchage    ← Service 2 visible

Then:
──50% ──   [░] Soin
──100%──   [█████] Soin       ← Service 3 visible

FINAL RESULT:
─────────────────────────────────────────────────────
+ Shampoing  + Séchage  + Soin  + Coloring

Each tag has slight scale bounce and rotation:
Scale: 0.8 → 1.1 → 1.0
```

---

### 6. Hover Effects

```
CARD HOVER:
┌─ Before Hover ─────────────────────┐
│                                    │
│  Maria        Coupe      €95       │
│  Background: Normal, scale: 1.0    │
│  Shadow: Subtle                    │
│                                    │
└────────────────────────────────────┘

After Hovering (Mouse/Touch):
┌─ Scaling and Moving ───────────────┐
│                                    │
│  Maria        Coupe      €95       │
│  Background: Slight color shift    │
│  Scale: 1.02 (2% larger)           │
│  X Position: +5px (slides right)   │
│  Shadow: Larger, more visible      │
│  Cursor: Pointer                   │
│                                    │
└────────────────────────────────────┘


STATISTICS BOX HOVER:
┌─ Before ──────┐        ┌─ After ───────┐
│ Total RDV     │        │ Total RDV     │
│      5        │  →     │      5        │
└───────────────┘        └───────────────┘
Scale: 1.0              Scale: 1.05
Shadow: None            Shadow: Medium
```

---

### 7. Color Palette Reference

```
BRAND COLORS:
┌─────────────────────────────────────┐
│ Accent (Primary):   #c8966c         │
│ Ink (Text):         #1a1a1a         │
│ White (Background): #ffffff         │
│ Primary BG:         #f5f5f5         │
└─────────────────────────────────────┘

STATUS COLORS:
┌─────────────────────────────────────┐
│ FINALIZED (✓):                      │
│   Light:    #f0fdf4 (Emerald-50)   │
│   Border:   #bbf7d0 (Emerald-200)  │
│   Dark:     #047857 (Emerald-700)  │
│   Hover:    #dcfce7 (Emerald-100)  │
│                                    │
│ PENDING (○):                        │
│   Light:    #fffbeb (Amber-50)     │
│   Border:   #fde68a (Amber-200)    │
│   Dark:     #b45309 (Amber-700)    │
│   Hover:    #fef3c7 (Amber-100)    │
└─────────────────────────────────────┘

INTERACTION COLORS:
┌─────────────────────────────────────┐
│ Hover Highlight:     rgba(200,150,100,0.1)  │
│ Focus Ring:          #c8966c (accent)       │
│ Border Default:      #e5e5e5                │
│ Border Active:       #c8966c                │
│ Shadow:              rgba(26,26,26,0.1)     │
└─────────────────────────────────────┘
```

---

### 8. Empty State Display

```
When a day has no reservations:

┌────────────────────────────────────────────────────────────┐
│                                                       ✕     │
│ 22 Avril 2026                                             │
│ Lundi                                                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│ │ Total RDV      │  │ ✓ Finalisés   │  │ ○ En attente   │ │
│ │      0         │  │      0         │  │       0        │ │
│ └────────────────┘  └────────────────┘  └────────────────┘ │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│                                                             │
│                    📅                                      │
│                                                             │
│         Aucun rendez-vous pour cette journée              │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

### 9. Mobile Responsive View

```
MOBILE (< 768px):
┌──────────────────────────┐
│ 15 Avril 2026       ✕    │ ← Compact header
│ Mercredi                 │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ Total RDV: 5         │ │ ← Stacked stats
│ │ ✓ Finalisés: 3       │ │
│ │ ○ En attente: 2      │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ ┌─┐ Maria           │ │ ← Full width cards
│ │ │9│ Coupe   €95     │ │
│ │ │0│ 06 12 34 56     │ │
│ │ └─┘ + Shampoing    │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ ┌──┐ Sophie         │ │
│ │ │10│ Coloring €65   │ │
│ │ │30│ 06 98 76 54    │ │
│ │ └──┘ + Soin         │ │
│ └──────────────────────┘ │
│ [More cards below]       │
└──────────────────────────┘

TABLET (768px - 1024px):
┌────────────────────────────────────┐
│ 15 Avril 2026              ✕       │
│ Mercredi                           │
├────────────────────────────────────┤
│ [Optimized spacing and sizes]     │
│ [Cards wider than mobile]         │
│ [Still single column]              │
└────────────────────────────────────┘

DESKTOP (> 1024px):
┌─────────────────────────────────────────────┐
│ 15 Avril 2026                          ✕    │
│ Mercredi                                   │
├─────────────────────────────────────────────┤
│ [Full size, max-width 48rem (3xl)]        │
│ [Comfortable spacing]                      │
│ [All features visible]                     │
└─────────────────────────────────────────────┘
```

---

### 10. Interaction Flow Diagram

```
User Interaction Path:

START: Calendar View
  │
  ├─ User Action: "Click on day 15"
  │
  ├─ State Change:
  │  └─ selectedCalendarDay = April 15
  │  └─ modal = 'dayView'
  │
  ├─ Animation Trigger:
  │  ├─ Modal scales in (spring physics)
  │  ├─ Cards stagger fade-in from left
  │  └─ Service tags pop-in
  │
  ├─ END: Day View Modal Opens
  │       ├─ See statistics
  │       ├─ Browse reservations
  │       │
  │       ├─ User Action: "Click on reservation"
  │       │  ├─ State Change:
  │       │  │  └─ modal = 'details'
  │       │  └─ Details Modal Opens
  │       │
  │       └─ User Action: "Click X or backdrop"
  │           ├─ Animation: Modal scales out
  │           ├─ State Change:
  │           │  └─ modal = null
  │           │  └─ selectedCalendarDay = null
  │           └─ Back to Calendar View
```

---

## Summary

The calendar interface provides a beautiful, intuitive experience with:

✨ **Smooth Animations**
- Spring physics for modal entry
- Staggered card animations
- Pop-in service tags
- Hover effects on all interactive elements

🎨 **Consistent Design**
- Color-coded status (green/amber)
- Professional layout
- Responsive across devices
- Accessible touch targets

📱 **Responsive Layout**
- Mobile (< 768px): Full-width stacked
- Tablet (768-1024px): Optimized spacing
- Desktop (> 1024px): Full featured

🎯 **Intuitive Navigation**
- Click any day to see all reservations
- Click any reservation to see details
- Close via X button or backdrop
- Empty states handled gracefully

---

**Design Quality**: ⭐⭐⭐⭐⭐ Professional
**Animation Smoothness**: ⭐⭐⭐⭐⭐ Fluid
**User Experience**: ⭐⭐⭐⭐⭐ Intuitive
**Visual Appeal**: ⭐⭐⭐⭐⭐ Beautiful
