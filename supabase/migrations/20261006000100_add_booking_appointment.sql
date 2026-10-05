-- Appointments are optional. Existing enquiries keep their original data and are
-- shown as unscheduled until an admin sets an actual appointment.
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS appointment_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_quote_requests_appointment_at
  ON public.quote_requests(appointment_at);
