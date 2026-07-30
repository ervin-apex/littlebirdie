# Group 1 identity and persistence implementation brief

**Product:** Little Birdee  
**Prepared:** 28 July 2026  
**Status:** Core implementation complete; Google provider activation, live email/device acceptance, and historical-period query replacement remain  
**Supabase project:** Little Birdee, Sydney region  
**Depends on:** Accepted Group 0 product contract

## 1. Why this group exists

Scott identified the remaining "sign up bit and the payment bit", raised users with "multiple venues or multiple shops", and said that "compliance... linking... and data safety" still had to be handled.

Sources:

- [27 July meeting — signup and payment](../meetings/07-27-2026.txt#L42)
- [27 July meeting — multiple venues](../meetings/07-27-2026.txt#L113)
- [20 July meeting — compliance, linking and data safety](../meetings/07-20-2026.txt#L548)

Group 1 gives every financial record a stable owner before the complete manual operating loop is built. It deliberately does not include payment, P&L files, POS, Deputy, or AI extraction.

## 2. Implemented account journey

- `/` now uses the restored "Improve ya profit" onboarding direction as the first-run welcome. It sends new users to account creation and returning users to login.
- Account creation collects only account identity. Business and venue details are collected after authentication so email/password and Google users share one onboarding path.
- `/onboarding` reuses the restored business-setup composition and persists the operator name, business name, industry, first venue, and completion state in Supabase. Currency is explicitly AUD; the accepted GST choices remain on the first revenue step to avoid asking twice.
- A private Auth signup trigger creates the profile, business, owner membership, first venue, venue-manager membership, and venue settings in the same transaction as the Auth user.
- The Auth user ID supplies every ownership field. Signup metadata supplies display labels only and is not used for authorization.
- Email confirmation returns through `/auth/callback`.
- `/auth/finish-setup` is a route handler that selects the user's venue, writes the secure venue cookie, and sends an incomplete account to onboarding, a new configured account to Setup, or an account with a plan to the Dashboard.
- Login and account creation include one shared "Continue with Google" action using Supabase's PKCE callback flow. The UI checks whether Google is enabled before leaving Little Birdee.
- Login, logout, password recovery, and password reset are implemented.
- `/setup`, `/app`, and `/account` require an authenticated session.
- The shared authenticated header keeps the current-venue selector immediately beside the Little Birdee logo on Dashboard, Account, and new-venue screens. Switching a ready venue opens its Dashboard; switching an unfinished venue resumes Setup.
- `/account` shows the signed-in identity and authorized venue readiness. `/venues/new` creates an additional venue for an owned business, then sends the operator through the existing four-number Setup before that venue is treated as ready.
- Venue readiness uses the existing authoritative rule—a venue has at least one locked weekly plan—rather than introducing a second completion flag that could drift.
- The selected venue remains stored in a secure, HTTP-only cookie.

The privileged signup and venue-creation helpers are private. No security-definer function is callable through the public Data API.

## 3. Implemented persistence records

| Record | Purpose |
|---|---|
| `profiles` | Operator identity attached to Supabase Auth |
| `businesses` | Stable business owner, business identifier, and onboarding industry |
| `business_members` | Business role and permission boundary |
| `venues` | Stable venue identifier for all future records and integrations |
| `venue_members` | Venue-specific access for non-owner users |
| `venue_settings` | Time zone, GST registration, and revenue GST basis |
| `financial_assumptions` | Versioned COGS, labour, other-cost, and recurring-income assumptions with provenance |
| `weekly_plans` | Versioned week-level plan header and lock state |
| `weekly_plan_days` | Exact daily allocations belonging to a weekly plan |
| `daily_actual_revisions` | Append-only daily actual corrections and supersession chain |
| `audit_events` | Configuration and record-change evidence |

Financial amounts use integer cents. Rates use basis points. Records carry stable UUIDs, creator/editor references, timestamps, sources, effective dates, source periods, status/certainty, and supersession links where relevant.

### Historical stability

- Confirmed assumptions and daily actuals are append-only revisions.
- Weekly plans can be edited while draft.
- Locking a weekly plan freezes both its header and daily allocations.
- Completing Setup creates a new version rather than changing a previously locked plan.
- Audit triggers retain material configuration and financial-record changes.

## 4. Application persistence boundary

- Setup loads the current venue's latest locked plan through `/api/venue-state`.
- If no database plan exists, an old browser-local week may prefill Setup, but it is not imported until the operator explicitly completes Setup.
- Completing Setup writes venue GST settings, versioned manual assumptions, the weekly plan, seven exact-cent daily allocations, and the lock transition in one database transaction.
- Dashboard, What Happened, What If, and Full Numbers use the selected venue's database-backed current plan.
- Authenticated reporting no longer seeds demo actuals when no actual records exist.
- The API can combine a future manual/POS revenue actual with planned labour, or a labour actual with planned revenue, without inventing the missing input.
- The accepted Group 0 engine remains the only calculation path.

## 5. Security boundary

- All 11 public tables have row-level security enabled.
- Anonymous users have no table privileges.
- Authenticated users receive only the required operations for each record type.
- Business owners and admins can access and add venues for their business.
- Other users require explicit business and/or venue membership.
- Private helpers are not exposed as Data API schemas.
- No service-role key is stored in the web application.
- The current Supabase security advisor reports no findings.

The performance advisor reports only unused-index informational notices. This is expected while the database has no customer traffic; required foreign-key and access-path indexes are present.

## 6. Applied migrations

| Migration group | Purpose |
|---|---|
| `20260728131438_group_1_identity_and_financial_records.sql` | Identity, tenant, venue, canonical financial records, RLS, immutability, and audit rules |
| `20260728131607_add_group_1_fk_indexes.sql` | Foreign-key and access-path indexes |
| `20260728132821_lock_down_group_1_table_privileges.sql` | Remove broad initial Data API grants and apply least privilege |
| `20260728133656_save_week_plan_transaction.sql` | Atomic Setup-to-assumptions-to-locked-plan save |
| `20260728134256` through `20260728134853` | RLS helper execution, private Auth-trigger account creation, and trigger privilege hardening |
| `20260728135329` through `20260728135747` | Atomic owner-authorized venue creation behind an unprivileged public wrapper |
| `20260729014406_add_onboarding_profile_fields.sql` | Persisted onboarding completion, business industry, and the RLS-bound transactional onboarding update |

All 12 migrations are present locally and applied to the connected Little Birdee Supabase project.

## 7. Verification completed

- TypeScript validation passes.
- All 72 tests pass across 12 test files.
- The Next.js production build passes.
- `/` opens the restored first-run welcome and authenticated users are routed through `/auth/finish-setup`.
- Unauthenticated `/setup`, `/app`, and `/account` requests redirect to `/auth/login`.
- Unauthenticated `/api/venue-state` requests return `401`.
- Account-creation and login layouts render without horizontal overflow at a 390 × 844 mobile viewport.
- Remote privilege inspection confirms anonymous table access is false for every public table.
- A live email/password browser flow proved account creation, confirmation gating, login, placeholder bootstrap, authenticated onboarding, persisted business and venue names, industry, onboarding completion, secure venue selection, and the transition into Setup.
- Desktop and 390 × 844 mobile checks passed for the restored welcome, account creation with Google, and business onboarding.
- Desktop, 900-pixel tablet, and 390 × 844 mobile checks passed for Account, the header venue selector, `/venues/new`, and the Dashboard header. No horizontal overflow or clipped mobile menu was observed.
- Google-disabled handling was verified: the user remains inside Little Birdee and receives a short email fallback instead of a broken provider redirect.
- Remote function inspection confirms `complete_onboarding` is security-invoker, authenticated-only, and unavailable to anonymous users.
- Rollback-only two-account assertions proved each owner sees one business and cannot select the other tenant's venue.
- A rollback-only two-venue flow proved an owner can atomically create a second venue and settings record; no test venue remains.
- Supabase security advisor: zero findings.

## 8. What remains before Group 1 acceptance

1. Replace the hard-coded `LAST_WEEK` and month/custom demo-history adapters with queries over stored locked plans and actual revisions.
2. Run email confirmation, password reset, logout, refresh, different-device, and cleared-storage acceptance with real test accounts.
3. Prove through the UI that two persistent venues retain separate plans when switching.
4. Prove a second Setup submission creates a new locked version and leaves the prior plan and allocations unchanged.
5. Decide whether multi-user invitation and role-management UI is launch scope; the permission model already exists.
6. Confirm the production Supabase Auth site URL and allowed redirect URLs before deployment.
7. Create the Google Web OAuth client, add the Supabase callback URL, and enable Google in Supabase Auth. The application side is implemented, but the connected project currently reports Google as disabled.

The historical-period replacement should be implemented with the Group 4 reporting-data pass so Dashboard, What Happened, What If, Full Numbers, and Recorded History all consume one period repository.

## 9. Work that remains in other groups

- Manual recurring-income entry, daily actual revenue, and the complete operating loop remain Group 3.
- Stored historical reporting and Recorded History completion remain Group 4.
- Payment and subscription enforcement remain Group 5.
- P&L file storage, OCR/AI extraction, review, retention, and deletion remain parked Group 2.
- POS and Deputy connectors remain separate integration work.

No Deputy account and no POS account is required to complete Group 1.
