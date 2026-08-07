-- Little Birdee Group 6: drive the chirp dispatcher from pg_cron.
-- Vercel Hobby caps scheduled functions at one run per day, which is far too
-- coarse for per-operator delivery times, so Postgres owns the schedule and
-- calls the Next.js route instead.
--
-- The bearer token lives in Vault rather than inline: cron.job stores its
-- command in plaintext and is readable by anyone with database access.

create extension if not exists pg_net;

-- Re-running this migration replaces the schedule rather than duplicating it.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'chirps-dispatch') then
    perform cron.unschedule('chirps-dispatch');
  end if;
end $$;

select cron.schedule(
  'chirps-dispatch',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://littlebirdeetoldme.com/api/cron/chirps',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'chirp_cron_secret'
      )
    ),
    timeout_milliseconds := 60000
  )
  -- Stay silent until the secret exists, rather than posting a null bearer.
  where exists (
    select 1 from vault.decrypted_secrets where name = 'chirp_cron_secret'
  );
  $$
);
