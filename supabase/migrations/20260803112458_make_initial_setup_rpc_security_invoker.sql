-- The public RPC only coordinates existing RLS-aware checks. Run it as the
-- caller so the venue lookup remains subject to the caller's venue policy.
alter function public.can_start_initial_setup(uuid) security invoker;
