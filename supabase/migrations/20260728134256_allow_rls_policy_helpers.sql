-- RLS policies execute these helpers as the calling authenticated role.
-- The private schema remains inaccessible and is not exposed through the Data
-- API, so this permits policy evaluation without creating a callable endpoint.

grant execute on function private.business_role(uuid) to authenticated;
grant execute on function private.can_access_business(uuid) to authenticated;
grant execute on function private.can_manage_business(uuid) to authenticated;
grant execute on function private.can_access_venue(uuid) to authenticated;
grant execute on function private.can_edit_venue(uuid) to authenticated;
