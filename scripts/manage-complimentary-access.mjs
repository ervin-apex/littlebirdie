import { createClient } from "@supabase/supabase-js";

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : null;
}

function required(name) {
  const value = argument(name)?.trim();
  if (!value) throw new Error(`Missing --${name}`);
  return value;
}

async function findUserByEmail(admin, email) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
    );
    if (user) return user;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}

async function resolveBusiness(admin) {
  const explicitBusinessId = argument("business-id")?.trim();
  if (explicitBusinessId) {
    const { data, error } = await admin
      .from("businesses")
      .select("id, trading_name")
      .eq("id", explicitBusinessId)
      .single();
    if (error) throw error;
    return data;
  }

  const email = required("email");
  const user = await findUserByEmail(admin, email);
  if (!user) throw new Error(`No Supabase user found for ${email}`);

  const { data: memberships, error } = await admin
    .from("business_members")
    .select("business_id, businesses(id, trading_name)")
    .eq("user_id", user.id);
  if (error) throw error;
  if (!memberships?.length) throw new Error(`${email} does not belong to a business yet`);
  if (memberships.length > 1) {
    const choices = memberships.map((row) => row.business_id).join(", ");
    throw new Error(`${email} belongs to multiple businesses. Re-run with --business-id using one of: ${choices}`);
  }

  const business = memberships[0].businesses;
  if (!business || Array.isArray(business)) throw new Error("Could not resolve the business record");
  return business;
}

async function main() {
  const command = process.argv[2];
  if (command !== "grant" && command !== "revoke") {
    throw new Error("Use either grant or revoke");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const business = await resolveBusiness(admin);
  const reason = required("reason");
  const operator = required("by");

  if (command === "grant") {
    const grantType = required("type");
    if (grantType !== "permanent" && grantType !== "beta") {
      throw new Error("--type must be permanent or beta");
    }
    const { data, error } = await admin.rpc("grant_business_complimentary_access", {
      p_business_id: business.id,
      p_grant_type: grantType,
      p_reason: reason,
      p_granted_by: operator,
    });
    if (error) throw error;
    console.log(JSON.stringify({
      action: "granted",
      businessId: business.id,
      businessName: business.trading_name,
      grantType: data.grant_type,
      startsAt: data.starts_at,
      expiresAt: data.expires_at,
      retentionUntil: data.retention_until,
    }, null, 2));
    return;
  }

  const { data, error } = await admin.rpc("revoke_business_complimentary_access", {
    p_business_id: business.id,
    p_reason: reason,
    p_revoked_by: operator,
  });
  if (error) throw error;
  console.log(JSON.stringify({
    action: "revoked",
    businessId: business.id,
    businessName: business.trading_name,
    revokedAt: data.revoked_at,
    retentionUntil: data.retention_until,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
