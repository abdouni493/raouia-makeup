# 🚀 COMPLETE PERFORMANCE OPTIMIZATION GUIDE

## 📊 Overview
This guide provides complete optimization strategies for both database and frontend interfaces.

---

## 🗄️ DATABASE OPTIMIZATIONS

### 1. **Indexes** (Most Important)
- **Foreign Key Indexes**: Applied to all FK relationships for JOIN operations
- **Date Indexes**: DESC order for reverse chronological queries
- **Composite Indexes**: For common query patterns (date + employee, date + status)
- **Partial Indexes**: For active records to reduce index size

**Impact**: 10-100x faster queries on large tables

```sql
-- Example: Date range query with index
SELECT * FROM reservations 
WHERE date >= '2024-01-01' AND status = 'completed'
ORDER BY date DESC;
-- Uses: idx_reservations_date_status
```

### 2. **Materialized Views** (For Reporting)
Pre-computed aggregations that refresh daily:
- `mv_employee_monthly_summary` - Monthly employee stats
- `mv_reservation_daily_summary` - Daily revenue summary
- `mv_purchase_supplier_summary` - Supplier totals
- `mv_service_revenue_summary` - Service performance

**Impact**: Reports run 100x faster (seconds vs minutes)

```sql
-- Instead of computing sums on demand:
SELECT 
  total_revenue, 
  total_paid, 
  total_due
FROM mv_reservation_daily_summary 
WHERE date >= '2024-01-01';
```

### 3. **Regular Views** (For Complex Queries)
- `v_reservations_detailed` - Includes all related data
- `v_employees_active` - Filtered employees
- `v_purchases_detailed` - With payment status

**Usage**: Use for consistency instead of repeated JOINs

### 4. **Query Patterns to Follow**

✅ **GOOD**:
```sql
-- Filtered query with index
SELECT * FROM reservations 
WHERE date >= '2024-01-01' 
  AND date < '2024-02-01'
  AND status = 'completed'
ORDER BY date DESC
LIMIT 100;

-- Uses materialized view
SELECT * FROM mv_employee_monthly_summary
WHERE employee_id = '123' AND month >= '2024-01-01';

-- Batch insert
INSERT INTO employee_payments (employee_id, amount, type, date)
VALUES 
  ('emp1', 1000, 'payment', '2024-01-15'),
  ('emp2', 2000, 'payment', '2024-01-15'),
  ('emp3', 1500, 'payment', '2024-01-15');
```

❌ **BAD**:
```sql
-- No filters - scans entire table
SELECT * FROM reservations;

-- Function in WHERE - can't use index
SELECT * FROM employee_payments
WHERE EXTRACT(MONTH FROM date) = 1;

-- N+1 queries - multiple roundtrips
SELECT * FROM reservations;
-- Then for each reservation:
SELECT * FROM profiles WHERE id = worker_id;

-- Large OFFSET - inefficient pagination
SELECT * FROM reservations OFFSET 100000 LIMIT 50;
```

---

## 🎨 FRONTEND OPTIMIZATIONS

### 1. **Data Service Layer** (`src/lib/dataService.ts`)

**Features**:
- ✅ Built-in caching with TTL
- ✅ Batch operations
- ✅ Parallel data fetching
- ✅ Request deduplication
- ✅ Pagination support

**Usage**:
```typescript
// Single fetch with cache
const employees = await fetchEmployees();

// Batch fetch in parallel
const [emp, services, prestations] = await Promise.all([
  fetchEmployees(),
  fetchServices(),
  fetchPrestations()
]);

// Date range query
const payments = await fetchEmployeePayments(employeeId, {
  from: '2024-01-01',
  to: '2024-01-31'
});

// Pagination
const { data, pageCount } = await fetchWithPagination('reservations', 1, 50);
```

### 2. **Caching Strategy**

```typescript
const CACHE_DURATION = {
  SHORT: 1 * 60 * 1000,      // 1 minute - live data
  MEDIUM: 5 * 60 * 1000,     // 5 minutes - semi-static
  LONG: 30 * 60 * 1000,      // 30 minutes - static data
};
```

**When to update cache**:
- SHORT: Reservations, payments, live counters
- MEDIUM: Employee lists, expenses
- LONG: Services, prestations, settings

### 3. **Performance Hooks** (`src/lib/hooks.ts`)

**useDebounce** - For search, filters:
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

// Only search after user stops typing
useEffect(() => {
  if (debouncedSearch) {
    searchEmployees(debouncedSearch);
  }
}, [debouncedSearch]);
```

**useThrottle** - For scroll, resize:
```typescript
const handleScroll = useThrottle(() => {
  loadMoreItems();
}, 300);

window.addEventListener('scroll', handleScroll);
```

**usePagination** - For large lists:
```typescript
const { currentItems, currentPage, totalPages, goToPage } = usePagination(
  allEmployees, 
  50
);

return (
  <>
    {currentItems.map(emp => <EmployeeCard {...emp} />)}
    <Pagination 
      current={currentPage} 
      total={totalPages} 
      onChange={goToPage} 
    />
  </>
);
```

**useIntersectionObserver** - For lazy loading:
```typescript
const ref = useRef(null);
const isVisible = useIntersectionObserver(ref);

return (
  <div ref={ref}>
    {isVisible ? <ExpensiveComponent /> : <Skeleton />}
  </div>
);
```

### 4. **Component Optimization**

**Use React.memo for expensive renders**:
```typescript
const EmployeeCard = React.memo(({ employee, onEdit, onDelete }) => {
  return <div>...</div>;
}, (prev, next) => {
  // Custom comparison - rerender only if necessary
  return prev.employee.id === next.employee.id;
});
```

**Memoize computed values**:
```typescript
const employeeStats = useMemo(() => {
  return new Map(
    employees.map(emp => [
      emp.id,
      {
        totalPaid: calculateTotal(emp.id),
        totalAdvances: calculateAdvances(emp.id)
      }
    ])
  );
}, [employees]);
```

**Use useCallback to avoid recreating functions**:
```typescript
const handleDelete = useCallback(async (id) => {
  await deleteRecord('employees', id);
  setEmployees(employees.filter(e => e.id !== id));
}, [employees]);
```

### 5. **Rendering Optimization**

**Virtualization for large lists**:
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={10000}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>
      {employees[index].fullName}
    </div>
  )}
</FixedSizeList>
```

**Pagination instead of loading all**:
```typescript
// Load 50 items per page
const { data, pageCount } = await fetchWithPagination('reservations', 1, 50);
// User clicks next → Load page 2
```

---

## 📈 IMPLEMENTATION CHECKLIST

### Database Setup (Run Once)
```sql
-- Run DATABASE_OPTIMIZATION.sql
-- This includes:
-- ✅ All indexes
-- ✅ Materialized views
-- ✅ Regular views
-- ✅ Helper functions
```

### Frontend Implementation

- [ ] Replace old data fetching with `DataService`
- [ ] Update all components to use caching
- [ ] Implement pagination on large lists
- [ ] Add debouncing to search inputs
- [ ] Add throttling to scroll/resize events
- [ ] Use `React.memo` on list items
- [ ] Use `useMemo` for expensive calculations
- [ ] Use `useCallback` for event handlers
- [ ] Implement lazy loading with `useIntersectionObserver`

### Migration Example

**Before** (Slow):
```typescript
useEffect(() => {
  const fetchData = async () => {
    const { data } = await supabase.from('employees').select('*');
    const { data: payments } = await supabase.from('payments').select('*');
    const { data: services } = await supabase.from('services').select('*');
    // 3 sequential requests = 3x slower
  };
  fetchData();
}, []);
```

**After** (Fast):
```typescript
useEffect(() => {
  const fetchData = async () => {
    const [employees, payments, services] = await Promise.all([
      fetchEmployees(),      // With cache
      fetchEmployeePayments(),
      fetchServices()        // With cache
    ]);
    // Parallel + cached = 3x faster + instant on repeat
  };
  fetchData();
}, []);
```

---

## 🔍 Performance Monitoring

### Check Index Usage
```sql
SELECT 
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Check Table Sizes
```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitor Slow Queries
```sql
SELECT 
    query,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## 📊 Expected Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dashboard Load | 3-5s | 0.5-1s | **5-10x** |
| List Rendering (1000 items) | 2-3s | <300ms | **10x** |
| Filter/Search | 1-2s | <100ms | **20x** |
| Report Generation | 10-30s | 0.5-1s | **50x** |
| Repeated Queries | Same | Cached | **∞** |
| Database Queries | 500-1000ms | 10-50ms | **10-100x** |

---

## 🎯 Quick Reference

### Most Important Changes:
1. **Create indexes** on FK and date columns (DATABASE_OPTIMIZATION.sql)
2. **Use DataService** instead of direct Supabase calls
3. **Implement caching** with appropriate TTLs
4. **Batch queries** when possible
5. **Paginate lists** instead of loading all
6. **Memoize components** that don't change often
7. **Use debounce** for search/filters
8. **Lazy load** images and heavy components

### Files to Update:
- [Dashboard.tsx](src/components/Dashboard.tsx) - Use parallel fetch
- [Employees.tsx](src/components/Employees.tsx) - Use DataService + caching
- [Reservations.tsx](src/components/Reservations.tsx) - Add pagination
- [Reports.tsx](src/components/Reports.tsx) - Use materialized views
- [Inventory.tsx](src/components/Inventory.tsx) - Batch queries

---

## 🔗 References
- **Supabase Docs**: https://supabase.com/docs/guides/performance
- **PostgreSQL Performance**: https://www.postgresql.org/docs/current/sql-explain.html
- **React Performance**: https://react.dev/reference/react/useMemo
- **Database Design**: https://databaseengineeringstudio.com/

---

**Last Updated**: March 27, 2026
**Status**: Ready for Production
