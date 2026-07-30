-- Trigger functions do not require caller EXECUTE privileges at runtime.

revoke all on function private.handle_new_user_account()
from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated, service_role;
