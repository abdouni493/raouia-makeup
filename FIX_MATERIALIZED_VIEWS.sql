-- ============================================================================
-- FIX MATERIALIZED VIEWS - Drop old ones and recreate with UNIQUE indexes
-- Run this to fix the concurrent refresh error
-- ============================================================================

-- Drop old materialized views (in dependency order)
DROP MATERIALIZED VIEW IF EXISTS mv_employee_monthly_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_reservation_daily_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_purchase_supplier_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_service_revenue_summary CASCADE;

-- ============================================================================
-- Recreate Materialized Views with UNIQUE Indexes
-- ============================================================================

-- Employee monthly summary with UNIQUE index
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

-- UNIQUE index enables CONCURRENT refresh (must be on GROUP BY columns)
CREATE UNIQUE INDEX idx_mv_employee_monthly_emp_id_month 
  ON mv_employee_monthly_summary(employee_id, month);
CREATE INDEX idx_mv_employee_monthly_month 
  ON mv_employee_monthly_summary(month DESC);

-- Reservation daily summary with UNIQUE index
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

-- UNIQUE index on GROUP BY columns enables CONCURRENT refresh
CREATE UNIQUE INDEX idx_mv_reservation_daily_date_status 
  ON mv_reservation_daily_summary(date, status);
CREATE INDEX idx_mv_reservation_daily_date 
  ON mv_reservation_daily_summary(date DESC);

-- Purchase summary by supplier with UNIQUE index
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

-- UNIQUE index on GROUP BY column enables CONCURRENT refresh
CREATE UNIQUE INDEX idx_mv_purchase_supplier_id 
  ON mv_purchase_supplier_summary(supplier_id);

-- Revenue by service with UNIQUE index
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

-- UNIQUE index on GROUP BY column enables CONCURRENT refresh
CREATE UNIQUE INDEX idx_mv_service_revenue_id 
  ON mv_service_revenue_summary(prestation_id);

-- ============================================================================
-- Test Concurrent Refresh (should now work)
-- ============================================================================

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_employee_monthly_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_reservation_daily_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_purchase_supplier_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_revenue_summary;

-- Verify refresh function works
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

-- All done! You can now refresh these views concurrently without errors.
