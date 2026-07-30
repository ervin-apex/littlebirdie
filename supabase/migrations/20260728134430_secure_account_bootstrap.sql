-- First-account creation is necessarily a privileged bootstrap: no membership
-- can authorize the first business insert because that membership is created
-- in the same transaction. The function derives every ownership field from
-- auth.uid(), accepts labels only, and has an empty search path.

alter function public.bootstrap_account(text, text, text, text)
security definer;
