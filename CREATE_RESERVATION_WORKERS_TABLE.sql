-- Create reservation_workers junction table to track multiple workers per reservation
-- This allows one reservation to have multiple workers with different earnings

CREATE TABLE IF NOT EXISTS public.reservation_workers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reservation_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  payment_type text NOT NULL DEFAULT 'percentage',
  amount numeric NOT NULL DEFAULT 0,
  percentage numeric DEFAULT 0,
  status text DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reservation_workers_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_workers_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE,
  CONSTRAINT reservation_workers_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT unique_reservation_worker UNIQUE (reservation_id, worker_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reservation_workers_reservation_id ON public.reservation_workers(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_workers_worker_id ON public.reservation_workers(worker_id);
CREATE INDEX IF NOT EXISTS idx_reservation_workers_status ON public.reservation_workers(status);
CREATE INDEX IF NOT EXISTS idx_reservation_workers_worker_status ON public.reservation_workers(worker_id, status);

-- Add finalized_by column to track who finalized the reservation (if it doesn't exist)
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS finalized_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Migrate existing data: If a reservation has a worker_id, create a record in reservation_workers
INSERT INTO public.reservation_workers (reservation_id, worker_id, payment_type, amount, percentage, status)
SELECT 
  r.id,
  r.worker_id,
  COALESCE(p.payment_type, 'month'),
  CASE 
    WHEN COALESCE(p.payment_type, 'month') = 'percentage' THEN r.total_price * COALESCE(p.percentage, 0) / 100
    ELSE 0
  END,
  CASE
    WHEN COALESCE(p.payment_type, 'month') = 'percentage' THEN COALESCE(p.percentage, 0)
    ELSE 0
  END,
  'unpaid'
FROM public.reservations r
LEFT JOIN public.profiles p ON r.worker_id = p.id
WHERE r.worker_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.reservation_workers rw 
    WHERE rw.reservation_id = r.id AND rw.worker_id = r.worker_id
  );

-- Create a view for easier querying of reservation workers with full details
DROP VIEW IF EXISTS public.v_reservation_workers CASCADE;

CREATE OR REPLACE VIEW public.v_reservation_workers AS
SELECT 
  rw.id,
  rw.reservation_id,
  rw.worker_id,
  p.full_name as worker_name,
  p.payment_type,
  p.percentage as worker_percentage,
  rw.amount as worker_amount,
  rw.percentage as reservation_percentage,
  rw.status,
  rw.created_at,
  r.total_price as reservation_total,
  r.client_name,
  r.date as reservation_date,
  r.finalized_by,
  r.finalized_at
FROM public.reservation_workers rw
LEFT JOIN public.profiles p ON rw.worker_id = p.id
LEFT JOIN public.reservations r ON rw.reservation_id = r.id;

-- Create a table for storing worker payments from reservations (percentage-based)
CREATE TABLE IF NOT EXISTS public.worker_reservation_payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reservation_worker_id uuid NOT NULL,
  reservation_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  percentage numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT worker_reservation_payments_pkey PRIMARY KEY (id),
  CONSTRAINT worker_reservation_payments_reservation_worker_fkey FOREIGN KEY (reservation_worker_id) REFERENCES public.reservation_workers(id) ON DELETE CASCADE,
  CONSTRAINT worker_reservation_payments_reservation_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE,
  CONSTRAINT worker_reservation_payments_worker_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_worker_reservation_payments_worker_id ON public.worker_reservation_payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_reservation_payments_status ON public.worker_reservation_payments(status);
CREATE INDEX IF NOT EXISTS idx_worker_reservation_payments_worker_status ON public.worker_reservation_payments(worker_id, status);

-- Verify the tables were created
SELECT 'reservation_workers' as table_name, COUNT(*) as row_count FROM public.reservation_workers
UNION ALL
SELECT 'worker_reservation_payments' as table_name, COUNT(*) as row_count FROM public.worker_reservation_payments
UNION ALL
SELECT 'reservations' as table_name, COUNT(*) as row_count FROM public.reservations;
