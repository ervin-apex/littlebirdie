# Group 5 billing implementation plan

**Date:** 3 August 2026
**Status:** Implementation complete in Stripe sandbox; enforcement remains disabled pending UAT
**Scope:** Business-level subscription billing, entitlement enforcement, cancellation, failed-payment recovery, and billing-related deletion safeguards

## Outcome

Little Birdee will charge one **AUD $12 weekly subscription, inclusive of GST, per business**. The subscription covers every venue and permitted team member in that business. Users complete their first business and venue setup before being sent to Stripe Checkout. Financial features become available only after Little Birdee receives a verified Stripe event confirming payment.

Stripe is the payment and subscription system of record. Supabase stores a small local projection of subscription and paid-access state so application pages and database policies never need to call Stripe on every request.

## Approved commercial rules

- Price: AUD $12.00 per week.
- GST: included in the displayed $12 price.
- Billing unit: one subscription per business, not per user or venue.
- Trial: none.
- Checkout timing: after the first venue setup is complete.
- Cancellation: self-service and effective at the end of the paid period.
- Access after cancellation: available until the paid-through timestamp.
- Access after the paid period ends: financial product features are fully locked.
- Refund policy: no voluntary refunds through the application.
- Payment provider: Stripe.
- Business identity for invoices: NO FAKE PLANTS PTY LTD, ABN 19 653 257 151.
- Operational financial data: deleted when the subscription reaches its terminal end, subject to the failed-payment recovery distinction below.
- Retained records: only minimal billing/audit facts required for reconciliation, disputes, tax, fraud prevention, and proof of deletion. Full financial inputs must not survive inside audit payloads after deletion.

## Recommended failed-payment distinction

Cancellation and payment failure need different data handling:

1. **Voluntary cancellation:** access continues through the already-paid period. When Stripe confirms the subscription has ended, Little Birdee deletes the business's operational venue and financial data.
2. **Failed renewal:** access locks when the previously paid-through time expires. Data remains inaccessible only while Stripe is actively retrying/recovering the payment. Successful recovery restores access. If Stripe exhausts recovery and marks the subscription terminal (`unpaid` or `canceled` under the configured policy), Little Birdee deletes the operational data.

This preserves Scott's complete lock while allowing the failed-payment recovery he approved. It also avoids deleting the operator's records after a temporary card failure and then restoring an empty account when Stripe succeeds on retry.

## Customer journey

```text
Landing
  -> Sign up / log in
  -> Business onboarding
  -> First venue financial setup
  -> Subscription screen
  -> Stripe-hosted Checkout
  -> Payment confirmation screen
  -> Verified webhook updates business entitlement
  -> Dashboard
```

Returning states:

- **Active:** dashboard and all subscribed business venues work normally.
- **Cancellation scheduled:** app remains usable and Account shows the final access date plus a Manage billing action.
- **Payment failed but paid time remains:** app remains usable with a payment warning.
- **Paid time expired / recovery active:** financial product routes and APIs are locked; Billing, payment recovery, Account, export/deletion controls, logout, and public/legal pages remain reachable.
- **Recovered:** access returns only after a verified successful invoice event.
- **Terminal:** operational data is deleted; the account retains only the minimum billing shell needed to understand status, download available billing documents through Stripe, or start again.

The Stripe success redirect is not proof of payment. The confirmation screen must wait for the webhook-backed Supabase entitlement before sending the user into the app.

## Stripe configuration

Create these resources in Ervin's connected sandbox first. Nothing in source code should depend on the sandbox account identity, so the IDs and secrets can later be replaced with Scott's sandbox and live account configuration.

1. Product: `Little Birdee`.
2. Recurring Price:
   - currency: `aud`;
   - amount: `1200` cents;
   - interval: `week`;
   - interval count: `1`;
   - tax behavior: `inclusive`.
3. Australian GST:
   - begin with a fixed inclusive 10% Australian GST tax rate for the Australian launch;
   - configure the legal entity, ABN, support details, statement descriptor, invoice branding, and invoice footer in Stripe;
   - do not pay for global automatic tax calculation unless the launch geography or tax treatment expands beyond this fixed Australian case.
4. Stripe-hosted Checkout:
   - subscription mode;
   - one fixed Price controlled on the server;
   - server-verified business ID in metadata/client reference;
   - no promotion codes, quantity changes, trials, or customer-entered prices.
5. Stripe Customer Portal:
   - update payment method;
   - view invoices;
   - cancel at period end only;
   - no plan switching, quantity editing, or immediate cancellation.
6. Revenue recovery:
   - Stripe retries and recovery emails;
   - Little Birdee still controls product locking from its paid-through entitlement.
7. Webhook endpoint:
   - signed endpoint on the Vercel application;
   - sandbox endpoint and secret first;
   - separate live endpoint and secret before commercial launch.

## Supabase data model

### `business_subscriptions`

One row per business, protected by RLS and writable only by trusted server code.

Suggested fields:

- `business_id` primary key;
- `stripe_customer_id` unique;
- `stripe_subscription_id` unique nullable until Checkout completes;
- `stripe_price_id`;
- `status` using Stripe-compatible lifecycle values;
- `paid_through` as Little Birdee's entitlement boundary, advanced only from confirmed paid invoices;
- `current_period_start` and `current_period_end` for presentation;
- `cancel_at_period_end`;
- `canceled_at`, `ended_at`, and `payment_failed_at`;
- `access_state` (`pending`, `active`, `locked_recovery`, `ended`);
- `data_state` (`present`, `deletion_pending`, `deleted`);
- `last_stripe_event_at` and `updated_at`.

`paid_through` must not be inferred only from a subscription's nominal `current_period_end`, because a failed renewal can advance subscription-period fields without proving that the new period was paid.

### Private webhook-event ledger

Store in a non-exposed schema:

- Stripe event ID as a unique key;
- event type and Stripe object ID;
- received, processing, processed, and failed timestamps/status;
- attempt count and a bounded error classification;
- no unnecessary full Stripe payload.

This ledger makes retries idempotent and supports investigation without retaining excessive customer/payment data.

### Minimal deletion receipt

Retain an irreversible record containing only:

- business identifier or one-way tombstone identifier;
- subscription/customer references required for billing reconciliation;
- termination reason and time;
- deletion completion time and result;
- the policy version used.

The existing `audit_events` table contains before/after row payloads. Operational audit rows for a deleted business must be purged or redacted in the same deletion transaction; otherwise Little Birdee would appear to delete financial data while retaining copies in its audit log.

## Server boundaries

Add centralized server-only helpers instead of scattering subscription checks across components:

- `requireAuthenticatedUser()`;
- `requireBusinessMembership()`;
- `getBusinessEntitlement()`;
- `requireActiveBusinessEntitlement()`;
- `canAccessBillingRecovery()`.

Use these in both page loaders/server components and every financial mutation/read API. Hiding buttons is not access control.

RLS remains the final data boundary. Financial tables should require both existing business/venue membership and a current business entitlement. Billing/account tables need narrower policies so locked owners can still view status and recover payment. Stripe customer and subscription mutations remain server-only through the service role or tightly scoped private database functions; the service-role key must never reach browser code.

## Application routes and interfaces

Recommended routes:

- `/billing` — subscription promise, $12/week inclusive of GST, what the business receives, and Checkout action.
- `/billing/confirm` — waits for verified entitlement after Checkout.
- `/billing/locked` — explains why access is locked and provides recovery/portal/logout actions.
- `/api/stripe/checkout` — authenticated server-created Checkout Session.
- `/api/stripe/portal` — authenticated server-created Customer Portal Session.
- `/api/stripe/webhook` — raw-body, signature-verified, idempotent Stripe events.

Account screen additions:

- plan and GST-inclusive price;
- status in plain language;
- next charge or final access date;
- payment warning when relevant;
- `Manage billing` action opening Stripe's portal;
- no refund action.

The billing screen should use Little Birdee's established hero-first visual language, but implementation should begin with the state machine and route behavior before visual polish.

## Event contract

Minimum events:

- `checkout.session.completed` — connect the verified Checkout customer/subscription to the authorized business; do not grant long-term access from this event alone if the payment is not confirmed.
- `invoice.paid` — advance `paid_through`, activate/restore access, and clear the payment-failure state.
- `invoice.payment_failed` — record the failure and show recovery state; lock once previously paid access expires.
- `customer.subscription.created` and `.updated` — synchronize status, period dates, and cancellation scheduling.
- `customer.subscription.deleted` — mark terminal and execute the idempotent deletion transaction.

Events can be duplicated or delivered out of order. After verifying and claiming an event, retrieve the current canonical Stripe object where necessary before updating Supabase. Never rely only on event arrival order.

## Deletion transaction

The deletion operation must be idempotent and business-scoped. At minimum it must remove or redact:

- venues and venue memberships where appropriate;
- venue settings and setup drafts;
- financial assumptions;
- weekly plans and plan days;
- daily actual revisions;
- operational audit-event payloads;
- future P&L files/extractions when Group 2 exists;
- future Chirp content/history when Group 6 exists.

Keep the user/profile and a minimal business/billing shell so the owner can authenticate, understand what happened, access Stripe billing documents, and create a fresh subscription/setup if product policy permits.

Webhook-driven deletion is the primary path. A scheduled reconciliation job must find subscriptions whose terminal state or deletion deadline was missed because of an outage. A failed deletion should make the webhook return a retryable error and remain visibly incomplete in the private ledger.

## Implementation order

### Phase 0 — contract and scaffolding

- Approve this plan and the failed-payment distinction.
- Add the Stripe server SDK with a pinned version and committed lockfile.
- Define typed billing statuses and entitlement tests before UI work.
- Add environment validation without committing secrets.

**Gate:** all lifecycle transitions are represented in table-driven tests.

### Phase 1 — database foundation

- Create subscription, private event-ledger, and deletion-receipt migrations.
- Add business-scoped RLS and indexes.
- Add idempotent subscription-projection and operational-deletion database functions.
- Generate types and run Supabase security/performance advisors.

**Gate:** cross-business access is denied; duplicate transitions and deletion calls are harmless.

### Phase 2 — Stripe sandbox resources

- Create the Product, inclusive weekly Price, GST configuration, portal configuration, and webhook endpoint in Ervin's sandbox.
- Add sandbox IDs/secrets to local and Vercel settings, never source control.

**Gate:** configuration audit confirms sandbox mode, AUD, weekly interval, inclusive GST, no trial, and period-end cancellation.

### Phase 3 — server integration

- Implement Checkout, Customer Portal, webhook verification, event claiming, Stripe reconciliation, and Supabase projection.
- Prevent duplicate active subscriptions and forged business IDs.
- Add structured logs without secrets or full payment payloads.

**Gate:** automated tests cover forged/unsigned requests, duplicate and out-of-order events, Checkout retries, and portal authorization.

### Phase 4 — entitlement enforcement

- Add centralized page/API guards.
- Add RLS entitlement checks to financial records.
- Preserve billing recovery, account, export/deletion, auth, and public/legal access while locked.

**Gate:** a locked user cannot read or mutate financial records by page URL, API request, or direct Data API access.

### Phase 5 — connected product journey

- Route completion of the first venue setup to Billing when no entitlement exists.
- Build Billing, confirmation, locked, and Account billing states.
- Ensure additional venues do not create additional subscriptions.
- Add responsive desktop, medium, and mobile behavior.

**Gate:** the complete signup -> setup -> payment -> dashboard journey works and is understandable without accounting or Stripe knowledge.

### Phase 6 — lifecycle and deletion

- Implement cancel-at-period-end, payment failure, recovery, terminal deletion, and reconciliation job behavior.
- Purge operational audit copies.
- Produce an internal deletion receipt without retaining deleted financial content.

**Gate:** voluntary cancellation, failed renewal, successful recovery, terminal failure, and repeated webhook delivery all produce the expected access and data states.

### Phase 7 — deployment and UAT

- Deploy with sandbox Stripe configuration to `littlebirdie-gray.vercel.app`.
- Register the deployed webhook and verify Vercel runtime logs.
- Run the Group 5 browser, logic, security, webhook, and responsive UAT suite.
- Repeat against Scott's sandbox after access arrives; later repeat with separate live resources before commercial launch.

**Gate:** no failed/blocking launch-critical cases, no secret exposure, and independent review of entitlement/deletion evidence.

## Required test coverage

### Straightforward

- Successful first subscription.
- Checkout cancellation returns safely without access.
- Active owner reaches all venues under the business.
- Member access follows the business entitlement.
- Portal opens only for an authorized business member.

### Complex lifecycle

- Duplicate Checkout submission does not create two subscriptions.
- Duplicate webhook delivery is idempotent.
- Out-of-order subscription and invoice events converge to Stripe's current state.
- Cancellation keeps access through `paid_through` and locks afterward.
- Failed weekly renewal locks after paid access, recovery restores access, exhausted recovery deletes data.
- Adding venues never changes price or quantity.
- Two different businesses owned by one user require separate subscriptions.

### Security and edge cases

- Forged `business_id`, customer ID, subscription ID, and Price ID are rejected.
- Unsigned or incorrectly signed webhook is rejected without database changes.
- Locked users cannot bypass through direct URLs, API calls, or Supabase Data API requests.
- A webhook cannot link one business to another business's Stripe customer.
- Service-role and webhook secrets never appear in browser bundles, errors, logs, screenshots, or Git.
- Deletion removes financial values from both primary tables and audit payloads.
- A repeated deletion call succeeds safely without deleting another business.
- Stripe/Vercel outage paths leave retryable, observable states rather than silently granting access.

## Environment separation

Use separate values for local/sandbox, Vercel preview, and eventual live deployment:

- `STRIPE_SECRET_KEY`;
- `STRIPE_WEBHOOK_SECRET`;
- `STRIPE_PRICE_ID`;
- `NEXT_PUBLIC_APP_URL` or existing canonical site URL configuration;
- server-only Supabase service-role credential for webhook/database operations.

The publishable Stripe key is unnecessary for Stripe-hosted Checkout unless a later UI requirement introduces Stripe.js. Do not expose a key merely because a generic integration template includes it.

Ervin's sandbox is temporary infrastructure. Swapping to Scott's account means replacing environment-scoped resource IDs/secrets and replaying configuration/UAT, not changing business logic or database architecture.

## Items outside this billing pass

- Live Stripe activation, payout bank account, and real-money verification.
- Final Little Birdee domain and production email domain.
- Deputy, POS, and P&L integrations.
- Group 6 Chirp delivery.
- Global/multi-jurisdiction tax support.
- Custom card forms or storage of card details.
- Staff invitation and advanced role-management UI unless separately approved.

## External inputs still needed before live payments

These do not block sandbox implementation:

- Scott's owned Stripe sandbox/live-account access.
- Final legal Terms, Privacy Policy, financial-information disclaimer, and data-retention wording.
- Final support email, domain, statement descriptor, and customer-facing Stripe branding.
- Confirmation from an Australian accountant/legal adviser that the invoice/GST presentation and retention wording are suitable. The application must not invent legal retention periods.

## Definition of done

Billing is complete only when a newly created business can finish setup, pay $12 AUD weekly inclusive of GST, receive business-wide access through a verified event, manage billing without staff help, cancel for the paid-period end, recover from a failed payment, and be securely locked/deleted according to the approved lifecycle—with all of those outcomes enforced beyond the UI and proven in UAT.
# Implementation status — 3 August 2026

- Implemented the business-level subscription projection, signed Stripe event ledger, entitlement states, paid-through rule, and terminal operational-data deletion receipt.
- Applied and verified Supabase migrations `20260803060203`, `20260803062039`, and `20260803062528` on project `ixnbyfusijjjgualqwov`.
- Implemented Stripe-hosted Checkout, Customer Portal, raw-body signed webhook processing, duplicate-event handling, and canonical subscription refreshes.
- Implemented the approved subscription offer, verified confirmation, payment-recovery, and Account billing interfaces for desktop, medium, and mobile layouts.
- Added the setup-to-billing transition and an environment-controlled product gate. Enforcement remains off until the sandbox loop is proven end to end.
- Created the Stripe sandbox product `prod_V0Fl3o0UzYmsSN` and inclusive AUD 12/week price `price_1U0FGQ3Z5oFedYZmjBZFPLkD`.

Remaining activation blockers:

1. Create the manual inclusive Australian GST tax rate and record its `txr_...` identifier.
2. Configure the Stripe Customer Portal to allow payment-method changes and cancel only at period end.
3. Make the billing routes available on the Vercel preview, create the signed webhook endpoint, and save its `whsec_...` secret.
4. Add the server-only Stripe secret and Supabase service-role key to local/Vercel runtime configuration.
5. Run paid, failed, recovered, canceled, duplicate-event, multi-venue, and responsive UAT before enabling `BILLING_ENFORCEMENT_ENABLED=true`.
