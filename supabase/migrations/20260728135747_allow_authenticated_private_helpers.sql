-- Authenticated policy/RPC wrappers need schema resolution for specifically
-- granted private helpers. The private schema is not an exposed Data API schema;
-- anonymous users retain no usage or function privileges.

grant usage on schema private to authenticated;
