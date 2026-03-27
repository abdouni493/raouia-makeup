-- ============================================================================
-- SALON DE BEAUTÉ - DATABASE OPTIMIZATION SQL
-- Complete optimization with indexes, views, and materialized views
-- ============================================================================

-- ============================================================================
-- 1. CREATE INDEXES FOR FOREIGN KEYS (High Priority)
-- ============================================================================

-- Employee Payments indexes
CREATE INDEX idx_employee_payments_employee_id ON public.employee_payments(employee_id);
CREATE INDEX idx_employee_payments_date ON public.employee_payments(date DESC);
CREATE INDEX idx_employee_payments_type ON public.employee_payments(type);
CREATE INDEX idx_employee_payments_created_at ON public.employee_payments(created_at DESC);

-- Purchases indexes
CREATE INDEX idx_purchases_supplier_id ON public.purchases(supplier_id);
CREATE INDEX idx_purchases_date ON public.purchases(date DESC);
CREATE INDEX idx_purchases_created_at ON public.purchases(created_at DESC);

-- Reservations indexes
CREATE INDEX idx_reservations_prestation_id ON public.reservations(prestation_id);
CREATE INDEX idx_reservations_worker_id ON public.reservations(worker_id);
CREATE INDEX idx_reservations_created_by ON public.reservations(created_by);
CREATE INDEX idx_reservations_date ON public.reservations(date DESC);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_created_at ON public.reservations(created_at DESC);

-- Reservation Services indexes
CREATE INDEX idx_reservation_services_reservation_id ON public.reservation_services(reservation_id);
CREATE INDEX idx_reservation_services_service_id ON public.reservation_services(service_id);

-- Profiles indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Expenses indexes
CREATE INDEX idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX idx_expenses_created_at ON public.expenses(created_at DESC);

-- ============================================================================
-- 2. COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Date range queries on employee payments
CREATE INDEX idx_emp_payments_date_employee ON public.employee_payments(date DESC, employee_id);

-- Date range queries on reservations
CREATE INDEX idx_reservations_date_status ON public.reservations(date DESC, status);
CREATE INDEX idx_reservations_date_worker ON public.reservations(date DESC, worker_id);

-- Date range queries on purchases
CREATE INDEX idx_purchases_date_supplier ON public.purchases(date DESC, supplier_id);

-- Date range queries on expenses
CREATE INDEX idx_expenses_date_name ON public.expenses(date DESC, name);

-- ============================================================================
-- 3. PARTIAL INDEXES FOR ACTIVE RECORDS
-- ============================================================================

-- Active reservations (not finalized)
CREATE INDEX idx_reservations_active ON public.reservations(date DESC) 
WHERE status != 'finalized' AND status != 'cancelled';

-- Active employees (not archived)
CREATE INDEX idx_profiles_active_workers ON public.profiles(id) 
WHERE role = 'worker';

-- ============================================================================
-- 4. OPTIMIZED MATERIALIZED VIEWS FOR REPORTING
-- ============================================================================

-- Employee monthly summary
CREATE MATERIALIZED VIEW mv_employee_monthly_summary AS
SELECT 
    ep.employee_id,
    p.full_name,
    p.payment_type,
    p.percentage,
    DATE_TRUNC('month', ep.date)::date as month,
    SUM(CASE WHEN ep.type = 'acompte' THEN ep.amount ELSE 0 END) as total_advances,
    SUM(CASE WHEN ep.type = 'absence' THEN ep.amount ELSE 0 END) as total_absences,
    COUNT(*) as total_payments,
    MAX(ep.created_at) as last_updated
FROM public.employee_payments ep
JOIN public.profiles p ON ep.employee_id = p.id
GROUP BY ep.employee_id, p.full_name, p.payment_type, p.percentage, DATE_TRUNC('month', ep.date)::date;

CREATE UNIQUE INDEX idx_mv_employee_monthly_emp_id_month 
  ON mv_employee_monthly_summary(employee_id, month);
CREATE INDEX idx_mv_employee_monthly_month 
  ON mv_employee_monthly_summary(month DESC);

-- Reservation daily summary
CREATE MATERIALIZED VIEW mv_reservation_daily_summary AS
SELECT 
    r.date,
    r.status,
    COUNT(*) as total_reservations,
    SUM(r.total_price) as total_revenue,
    SUM(r.paid_amount) as total_paid,
    SUM(r.total_price - COALESCE(r.paid_amount, 0)) as total_due,
    MAX(r.created_at) as last_updated
FROM public.reservations r
GROUP BY r.date, r.status;

CREATE UNIQUE INDEX idx_mv_reservation_daily_date_status 
  ON mv_reservation_daily_summary(date, status);
CREATE INDEX idx_mv_reservation_daily_date 
  ON mv_reservation_daily_summary(date DESC);

-- Purchase summary by supplier
CREATE MATERIALIZED VIEW mv_purchase_supplier_summary AS
SELECT 
    p.supplier_id,
    s.full_name as supplier_name,
    COUNT(*) as total_purchases,
    SUM(p.cost) as total_cost,
    SUM(p.paid_amount) as total_paid,
    SUM(p.cost - COALESCE(p.paid_amount, 0)) as total_due,
    MAX(p.created_at) as last_updated
FROM public.purchases p
LEFT JOIN public.suppliers s ON p.supplier_id = s.id
GROUP BY p.supplier_id, s.full_name;

CREATE UNIQUE INDEX idx_mv_purchase_supplier_id 
  ON mv_purchase_supplier_summary(supplier_id);

-- Revenue by service
CREATE MATERIALIZED VIEW mv_service_revenue_summary AS
SELECT 
    pres.id as prestation_id,
    pres.name as prestation_name,
    COUNT(r.id) as total_reservations,
    SUM(r.total_price) as total_revenue,
    AVG(r.total_price) as average_price,
    COUNT(DISTINCT r.date) as days_used,
    MAX(r.created_at) as last_updated
FROM public.prestations pres
LEFT JOIN public.reservations r ON pres.id = r.prestation_id
GROUP BY pres.id, pres.name;

CREATE UNIQUE INDEX idx_mv_service_revenue_id 
  ON mv_service_revenue_summary(prestation_id);

-- ============================================================================
-- 5. OPTIMIZED VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Detailed reservation view with all related info
CREATE VIEW v_reservations_detailed AS
SELECT 
    r.id,
    r.client_name,
    r.client_phone,
    r.date,
    r.time,
    r.total_price,
    r.paid_amount,
    r.status,
    r.finalized_at,
    r.created_at,
    pres.id as prestation_id,
    pres.name as prestation_name,
    pres.price as prestation_price,
    w.id as worker_id,
    w.full_name as worker_name,
    w.phone as worker_phone,
    cb.id as created_by_id,
    cb.full_name as created_by_name,
    STRING_AGG(DISTINCT s.name, ', ') as services
FROM public.reservations r
LEFT JOIN public.prestations pres ON r.prestation_id = pres.id
LEFT JOIN public.profiles w ON r.worker_id = w.id
LEFT JOIN public.profiles cb ON r.created_by = cb.id
LEFT JOIN public.reservation_services rs ON r.id = rs.reservation_id
LEFT JOIN public.services s ON rs.service_id = s.id
GROUP BY r.id, r.client_name, r.client_phone, r.date, r.time, r.total_price, 
         r.paid_amount, r.status, r.finalized_at, r.created_at, pres.id, pres.name, 
         pres.price, w.id, w.full_name, w.phone, cb.id, cb.full_name;

-- Active employees view
CREATE VIEW v_employees_active AS
SELECT 
    id,
    username,
    full_name,
    role,
    avatar_url,
    phone,
    address,
    payment_type,
    percentage,
    created_at
FROM public.profiles
WHERE role = 'worker';

-- Purchase details view
CREATE VIEW v_purchases_detailed AS
SELECT 
    p.id,
    p.supplier_id,
    s.full_name as supplier_name,
    s.phone as supplier_phone,
    p.description,
    p.cost,
    p.paid_amount,
    (p.cost - COALESCE(p.paid_amount, 0)) as remaining,
    p.date,
    p.created_at,
    CASE 
        WHEN p.paid_amount >= p.cost THEN 'paid'
        WHEN p.paid_amount > 0 THEN 'partial'
        ELSE 'unpaid'
    END as payment_status
FROM public.purchases p
LEFT JOIN public.suppliers s ON p.supplier_id = s.id;

-- ============================================================================
-- 6. REFRESH MATERIALIZED VIEWS (Schedule these daily)
-- ============================================================================

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_employee_monthly_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_reservation_daily_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_purchase_supplier_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_revenue_summary;

-- ============================================================================
-- 7. FUNCTION TO BATCH REFRESH ALL MATERIALIZED VIEWS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_employee_monthly_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_reservation_daily_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_purchase_supplier_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_revenue_summary;
    RAISE NOTICE 'All materialized views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. PERFORMANCE MONITORING QUERIES
-- ============================================================================

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries (requires log_min_duration_statement set in config)
SELECT 
    query,
    calls,
    mean_exec_time,
    max_exec_time,
    total_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ============================================================================
-- 9. QUERY OPTIMIZATION RECOMMENDATIONS
-- ============================================================================

-- Always use these optimized patterns:

-- ✓ GOOD: Use views for complex queries
-- SELECT * FROM v_reservations_detailed WHERE date >= '2024-01-01';

-- ✓ GOOD: Use materialized views for reports
-- SELECT * FROM mv_employee_monthly_summary WHERE month >= '2024-01-01';

-- ✓ GOOD: Filter before joining
-- SELECT * FROM reservations WHERE status = 'completed' AND date >= '2024-01-01';

-- ✗ BAD: Avoid SELECT * without filters
-- SELECT * FROM reservations;

-- ✗ BAD: Avoid multiple separate queries in loops
-- Use batch operations or views instead

-- ✗ BAD: Avoid functions in WHERE clause
-- WHERE EXTRACT(MONTH FROM date) = 1  -- BAD
-- WHERE date >= '2024-01-01' AND date < '2024-02-01'  -- GOOD
