import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const FIXTURE_KIND = "g5_b12_b15";
const STATE_DIRECTORY = path.join(process.cwd(), ".billing-uat-fixtures");
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 90_000;

const OPERATIONAL_TABLES = [
  "venues",
  "venue_members",
  "venue_settings",
  "venue_setup_drafts",
  "financial_assumptions",
  "weekly_plans",
  "weekly_plan_days",
  "daily_actual_revisions",
];

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : null;
}

function required(name) {
  const value = argument(name)?.trim();
  if (!value) throw new Error(`Missing --${name}`);
  return value;
}

export function assertSandboxKey(secretKey) {
  if (!secretKey?.startsWith("sk_test_")) {
    throw new Error("B12-B15 fixtures require a Stripe sk_test_ sandbox key");
  }
}

export function assertExactBusinessConfirmation(businessId, confirmation) {
  if (businessId !== confirmation) {
    throw new Error("--confirm-business-id must exactly match the resolved business ID");
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

export function stableRowsHash(rows) {
  const canonicalRows = rows
    .map((row) => JSON.stringify(canonicalize(row)))
    .sort();
  return createHash("sha256").update(canonicalRows.join("\n")).digest("hex");
}

export function operationalSnapshotsMatch(left, right) {
  return OPERATIONAL_TABLES.every((table) =>
    left?.[table]?.count === right?.[table]?.count
    && left?.[table]?.sha256 === right?.[table]?.sha256,
  );
}

function loadConfiguration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePriceId = process.env.STRIPE_PRICE_ID;
  const stripeTaxRateId = process.env.STRIPE_TAX_RATE_ID;

  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey || !stripePriceId || !stripeTaxRateId) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, "
      + "STRIPE_PRICE_ID and STRIPE_TAX_RATE_ID are required",
    );
  }
  assertSandboxKey(stripeSecretKey);
  if (process.env.BILLING_UAT_ALLOW_DESTRUCTIVE_FIXTURES !== "1") {
    throw new Error("Set BILLING_UAT_ALLOW_DESTRUCTIVE_FIXTURES=1 to use this disposable helper");
  }

  return { supabaseUrl, serviceRoleKey, stripeSecretKey, stripePriceId, stripeTaxRateId };
}

function clients(config) {
  return {
    admin: createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    stripe: new Stripe(config.stripeSecretKey, {
      appInfo: { name: "Little Birdee Billing UAT", version: "1.0.0" },
    }),
  };
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
  const email = required("email").toLowerCase();
  const user = await findUserByEmail(admin, email);
  if (!user) throw new Error(`No Supabase user found for ${email}`);

  const requestedBusinessId = argument("business-id")?.trim() ?? null;
  let query = admin
    .from("business_members")
    .select("business_id, role, businesses(id, trading_name)")
    .eq("user_id", user.id);
  if (requestedBusinessId) query = query.eq("business_id", requestedBusinessId);

  const { data: memberships, error } = await query;
  if (error) throw error;
  if (!memberships?.length) throw new Error(`${email} does not own the requested business`);
  if (memberships.length > 1) {
    throw new Error("This user has multiple businesses. Add --business-id before continuing");
  }
  const membership = memberships[0];
  if (membership.role !== "owner") throw new Error("The fixture business must be owned by the supplied user");
  const business = membership.businesses;
  if (!business || Array.isArray(business)) throw new Error("Could not resolve the business record");

  assertExactBusinessConfirmation(business.id, required("confirm-business-id"));
  return { ...business, email, userId: user.id };
}

function statePath(businessId) {
  return path.join(STATE_DIRECTORY, `group-5-${businessId}.json`);
}

async function readState(businessId) {
  try {
    return JSON.parse(await readFile(statePath(businessId), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`No fixture state exists for business ${businessId}. Run prepare first`);
    }
    throw error;
  }
}

async function saveState(state) {
  await mkdir(STATE_DIRECTORY, { recursive: true });
  await writeFile(statePath(state.businessId), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function operationalSnapshot(admin, businessId) {
  const snapshot = {};
  for (const table of OPERATIONAL_TABLES) {
    const { data, error, count } = await admin
      .from(table)
      .select("*", { count: "exact" })
      .eq("business_id", businessId)
      .limit(1000);
    if (error) throw new Error(`${table}: ${error.message}`);
    if ((count ?? data.length) > data.length) {
      throw new Error(`${table}: fixture exceeds the 1000-row checksum safety limit`);
    }
    snapshot[table] = {
      count: count ?? data.length,
      sha256: stableRowsHash(data),
    };
  }
  return snapshot;
}

function assertMeaningfulBaseline(snapshot) {
  if (snapshot.venues.count < 1) {
    throw new Error("Complete venue setup before preparing B12-B15");
  }
  if (snapshot.weekly_plans.count < 1 || snapshot.daily_actual_revisions.count < 1) {
    throw new Error("Add a weekly budget and at least one daily revenue entry before preparing B12-B15");
  }
}

async function subscriptionProjection(admin, businessId) {
  const { data, error } = await admin
    .from("business_subscriptions")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function assertNoProtectingGrant(admin, businessId) {
  const { data, error } = await admin
    .from("business_access_grants")
    .select("id, grant_type, revoked_at, retention_until")
    .eq("business_id", businessId)
    .is("revoked_at", null)
    .limit(1);
  if (error) throw error;
  if (data?.length) {
    throw new Error("Remove the complimentary grant before using this paid-lifecycle fixture");
  }
}

async function waitFor(description, check, timeoutMs = POLL_TIMEOUT_MS) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`Timed out waiting for ${description}`);
}

async function waitForClock(stripe, clockId) {
  return waitFor("Stripe test clock", async () => {
    const clock = await stripe.testHelpers.testClocks.retrieve(clockId);
    return clock.status === "ready" ? clock : null;
  });
}

async function advanceClock(stripe, clockId, frozenTime) {
  const current = await stripe.testHelpers.testClocks.retrieve(clockId);
  if (current.frozen_time >= frozenTime) return current;
  await stripe.testHelpers.testClocks.advance(clockId, { frozen_time: frozenTime });
  return waitForClock(stripe, clockId);
}

async function assertFixtureStripeObjects(stripe, state, businessId) {
  const customer = await stripe.customers.retrieve(state.customerId);
  if (customer.deleted) throw new Error("Fixture customer has already been deleted");
  if (customer.livemode) throw new Error("Refusing a live-mode Stripe customer");
  if (
    customer.metadata.little_birdee_fixture !== FIXTURE_KIND
    || customer.metadata.little_birdee_business_id !== businessId
    || customer.test_clock !== state.testClockId
  ) {
    throw new Error("Stripe customer is not the expected B12-B15 disposable fixture");
  }
  return customer;
}

async function prepare(admin, stripe, config, business) {
  await assertNoProtectingGrant(admin, business.id);
  const existing = await subscriptionProjection(admin, business.id);
  if (existing?.stripe_customer_id || existing?.stripe_subscription_id) {
    throw new Error("Prepare requires a business with no existing Stripe customer or subscription");
  }

  const baseline = await operationalSnapshot(admin, business.id);
  assertMeaningfulBaseline(baseline);

  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: Math.floor(Date.now() / 1000),
    name: `Little Birdee B12-B15 ${business.id.slice(0, 8)}`,
  });
  let customer;
  try {
    customer = await stripe.customers.create({
      email: business.email,
      name: business.trading_name,
      test_clock: clock.id,
      payment_method: "pm_card_visa",
      invoice_settings: { default_payment_method: "pm_card_visa" },
      metadata: {
        little_birdee_business_id: business.id,
        little_birdee_fixture: FIXTURE_KIND,
      },
    });

    const { error: prepareError } = await admin
      .from("business_subscriptions")
      .upsert({ business_id: business.id }, { onConflict: "business_id", ignoreDuplicates: true });
    if (prepareError) throw prepareError;

    const { data: bound, error: bindingError } = await admin
      .from("business_subscriptions")
      .update({ stripe_customer_id: customer.id })
      .eq("business_id", business.id)
      .is("stripe_customer_id", null)
      .select("business_id")
      .maybeSingle();
    if (bindingError) throw bindingError;
    if (!bound) throw new Error("Could not reserve the fixture Stripe customer binding");

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: config.stripePriceId, quantity: 1 }],
      default_tax_rates: [config.stripeTaxRateId],
      collection_method: "charge_automatically",
      payment_behavior: "error_if_incomplete",
      metadata: { little_birdee_business_id: business.id },
    });

    const projection = await waitFor("initial paid subscription projection", async () => {
      const row = await subscriptionProjection(admin, business.id);
      return row?.stripe_subscription_id === subscription.id
        && row.status === "active"
        && row.paid_through
        ? row
        : null;
    });

    const state = {
      fixtureKind: FIXTURE_KIND,
      businessId: business.id,
      businessName: business.trading_name,
      email: business.email,
      testClockId: clock.id,
      customerId: customer.id,
      subscriptionId: subscription.id,
      successfulPaymentMethodId: typeof customer.invoice_settings.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings.default_payment_method?.id ?? "pm_card_visa",
      stage: "paid",
      createdAt: new Date().toISOString(),
      baseline,
    };
    await saveState(state);
    return { state, projection };
  } catch (error) {
    if (customer) {
      await admin
        .from("business_subscriptions")
        .update({ stripe_customer_id: null })
        .eq("business_id", business.id)
        .eq("stripe_customer_id", customer.id);
    }
    await stripe.testHelpers.testClocks.del(clock.id).catch(() => undefined);
    throw error;
  }
}

async function failRenewal(admin, stripe, business) {
  const state = await readState(business.id);
  await assertFixtureStripeObjects(stripe, state, business.id);
  if (state.stage !== "paid") throw new Error(`Expected paid stage, found ${state.stage}`);

  const failingMethod = await stripe.paymentMethods.attach("pm_card_chargeCustomerFail", {
    customer: state.customerId,
  });
  await stripe.customers.update(state.customerId, {
    invoice_settings: { default_payment_method: failingMethod.id },
  });

  const subscription = await stripe.subscriptions.retrieve(state.subscriptionId);
  const periodEnd = subscription.items.data[0]?.current_period_end;
  if (!periodEnd) throw new Error("Stripe subscription has no current period end");

  await advanceClock(stripe, state.testClockId, periodEnd);
  await advanceClock(stripe, state.testClockId, periodEnd + 2 * 60 * 60);

  const projection = await waitFor("failed-renewal projection", async () => {
    const row = await subscriptionProjection(admin, business.id);
    return row?.payment_failed_at && ["past_due", "unpaid"].includes(row.status) ? row : null;
  });

  state.stage = "failed_paid_time_remaining";
  state.failedAt = projection.payment_failed_at;
  state.paidThroughBeforeExpiry = projection.paid_through;
  await saveState(state);
  return { state, projection };
}

async function expirePaidAccess(admin, stripe, business) {
  const state = await readState(business.id);
  await assertFixtureStripeObjects(stripe, state, business.id);
  if (state.stage !== "failed_paid_time_remaining") {
    throw new Error(`Expected failed_paid_time_remaining stage, found ${state.stage}`);
  }

  const projection = await subscriptionProjection(admin, business.id);
  if (!projection?.payment_failed_at || !["past_due", "unpaid"].includes(projection.status)) {
    throw new Error("The verified failed-renewal projection is missing");
  }

  const expiredAt = new Date(Date.now() - 60_000).toISOString();
  const { data: locked, error } = await admin
    .from("business_subscriptions")
    .update({ paid_through: expiredAt, access_state: "locked_recovery" })
    .eq("business_id", business.id)
    .eq("stripe_customer_id", state.customerId)
    .eq("stripe_subscription_id", state.subscriptionId)
    .select("*")
    .single();
  if (error) throw error;

  state.stage = "locked_recovery";
  state.simulatedPaidThrough = expiredAt;
  await saveState(state);
  return { state, projection: locked };
}

async function recoverPayment(admin, stripe, business) {
  const state = await readState(business.id);
  await assertFixtureStripeObjects(stripe, state, business.id);
  if (state.stage !== "locked_recovery") {
    throw new Error(`Expected locked_recovery stage, found ${state.stage}`);
  }

  await stripe.customers.update(state.customerId, {
    invoice_settings: { default_payment_method: state.successfulPaymentMethodId },
  });

  const invoices = await stripe.invoices.list({
    customer: state.customerId,
    subscription: state.subscriptionId,
    status: "open",
    limit: 10,
  });
  const renewalInvoice = invoices.data[0];
  if (!renewalInvoice) throw new Error("No open failed-renewal invoice was found");
  await stripe.invoices.pay(renewalInvoice.id, {
    payment_method: state.successfulPaymentMethodId,
  });

  const projection = await waitFor("recovered paid projection", async () => {
    const row = await subscriptionProjection(admin, business.id);
    return row?.status === "active"
      && row.access_state === "active"
      && !row.payment_failed_at
      && row.paid_through
      && Date.parse(row.paid_through) > Date.now()
      ? row
      : null;
  });
  const afterRecovery = await operationalSnapshot(admin, business.id);
  const dataUnchanged = operationalSnapshotsMatch(state.baseline, afterRecovery);
  if (!dataUnchanged) {
    throw new Error("Operational data changed during payment failure/recovery; inspect the saved checksums");
  }

  state.stage = "recovered";
  state.recoveredAt = new Date().toISOString();
  state.afterRecovery = afterRecovery;
  await saveState(state);
  return { state, projection, dataUnchanged };
}

async function fixtureStatus(admin, stripe, business) {
  const state = await readState(business.id);
  await assertFixtureStripeObjects(stripe, state, business.id);
  const projection = await subscriptionProjection(admin, business.id);
  const current = await operationalSnapshot(admin, business.id);
  return {
    state: { ...state, baseline: undefined, afterRecovery: undefined },
    projection,
    operationalDataMatchesBaseline: operationalSnapshotsMatch(state.baseline, current),
    baseline: state.baseline,
    current,
  };
}

async function destroyFixture(admin, stripe, business) {
  const state = await readState(business.id);
  await assertFixtureStripeObjects(stripe, state, business.id);
  if (required("confirm-destroy") !== business.id) {
    throw new Error("--confirm-destroy must exactly match the business ID");
  }
  await stripe.testHelpers.testClocks.del(state.testClockId);
  state.stage = "stripe_fixture_destroyed";
  state.destroyedAt = new Date().toISOString();
  await saveState(state);
  return {
    state,
    warning: "Destroying the test clock cancels its subscription. Terminal webhooks may purge this disposable business under the approved policy.",
  };
}

function printable(result) {
  const projection = result.projection
    ? {
        businessId: result.projection.business_id,
        status: result.projection.status,
        accessState: result.projection.access_state,
        dataState: result.projection.data_state,
        paidThrough: result.projection.paid_through,
        paymentFailedAt: result.projection.payment_failed_at,
      }
    : undefined;
  return {
    fixture: result.state
      ? {
          kind: result.state.fixtureKind,
          businessId: result.state.businessId,
          businessName: result.state.businessName,
          stage: result.state.stage,
          testClockId: result.state.testClockId,
          customerId: result.state.customerId,
          subscriptionId: result.state.subscriptionId,
        }
      : undefined,
    projection,
    dataUnchanged: result.dataUnchanged ?? result.operationalDataMatchesBaseline,
    warning: result.warning,
    baseline: result.baseline,
    current: result.current,
  };
}

async function main() {
  const command = process.argv[2];
  if (!["prepare", "fail-renewal", "expire-paid-access", "recover-payment", "status", "destroy"].includes(command)) {
    throw new Error(
      "Use prepare, fail-renewal, expire-paid-access, recover-payment, status, or destroy",
    );
  }
  const config = loadConfiguration();
  const { admin, stripe } = clients(config);
  const business = await resolveBusiness(admin);

  let result;
  if (command === "prepare") result = await prepare(admin, stripe, config, business);
  if (command === "fail-renewal") result = await failRenewal(admin, stripe, business);
  if (command === "expire-paid-access") result = await expirePaidAccess(admin, stripe, business);
  if (command === "recover-payment") result = await recoverPayment(admin, stripe, business);
  if (command === "status") result = await fixtureStatus(admin, stripe, business);
  if (command === "destroy") result = await destroyFixture(admin, stripe, business);

  console.log(JSON.stringify(printable(result), null, 2));
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
