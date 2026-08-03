-- Billing shells are created only by authenticated server routes using the
-- service role. No SECURITY DEFINER billing mutation remains browser-callable.
drop function if exists public.prepare_business_billing(uuid);
