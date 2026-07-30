# Group 1 user acceptance test procedures

**Product:** Little Birdee  
**Test URL:** `http://localhost:3000`  
**Prepared:** 29 July 2026  
**Scope:** Account creation, authentication, business onboarding, venue selection, weekly-plan persistence, versioning, tenant isolation, and the related user interface  
**Acceptance status:** Ready for product-owner testing. Google sign-in remains conditional on external provider activation.

## 1. What this test is proving

This is the tester-facing sign-off pack for Group 1. It proves that Little Birdee can reliably answer these questions:

1. Who is using the app?
2. Which business and venue do their records belong to?
3. Can they leave and return without losing their saved weekly plan?
4. Can one business operate more than one venue without mixing their numbers?
5. Does changing a plan create a new saved version instead of rewriting history?
6. Can one account ever see or change another account's records?
7. Are the account and persistence journeys usable on desktop and mobile?

The financial arithmetic itself was accepted in the separate Group 0 test document. This Group 1 pack repeats only enough arithmetic to prove that the correct plan was saved and reloaded for the correct venue.

## 2. Acceptance boundary

### 2.1 Included in this sign-off

- first-run welcome;
- email/password account creation;
- email confirmation;
- login and logout;
- forgot-password and password-reset journeys;
- Google signup/login when the provider is enabled;
- authenticated business onboarding;
- creation of the first business and venue;
- current-venue selection;
- creation and switching of additional venues;
- weekly Setup persistence;
- immutable weekly-plan versions;
- refresh, cleared-browser-storage, second-browser, and second-device persistence;
- cross-account and cross-venue isolation;
- loading, validation, error, keyboard, responsive, and short-viewport behavior for these journeys.

### 2.2 Not included in this sign-off

Do not fail Group 1 merely because these later-group features are absent:

- real last-week, month, custom-range, and Recorded History queries;
- manual daily actual revenue;
- editable recurring operating income;
- P&L upload, AI extraction, review, retention, and deletion;
- POS integrations;
- Deputy or other rostering integrations;
- multi-user invitation and role-management UI, unless it is separately declared launch scope;
- payments or subscription enforcement;
- production email branding;
- production deployment itself.

Last-week, month, and custom reporting are still demo-backed. Use **This week**, **Next week**, and **Setup** when verifying the saved venue plan.

## 3. Priority, result, and stop rules

### 3.1 Priority

- **P0:** blocks Group 1 sign-off.
- **P1:** must be fixed or explicitly accepted before launch.
- **P2:** polish that may be scheduled if there is a safe, documented workaround.

### 3.2 Result

Record one result for every test:

- **PASS:** every expected result occurred.
- **FAIL:** at least one expected result did not occur.
- **BLOCKED:** an external dependency or earlier failure prevented the test.
- **NOT RUN:** deliberately skipped, with the reason recorded.

For every failure, capture:

- test ID;
- complete URL;
- expected and actual behavior;
- screenshot or screen recording;
- browser, operating system, viewport, and zoom;
- console and Network-panel errors;
- whether refresh reproduced it;
- affected account, business, and venue, without recording the password.

### 3.3 Stop and escalate immediately

Stop the run if any of these occur:

- Account A can see, select, or change Account B's business, venue, or plan.
- Saving one venue changes another venue's values.
- Setup reports success but produces a partial plan or fewer than seven daily rows.
- A second Setup submission overwrites or deletes the first locked plan.
- an unauthenticated visitor can retrieve venue records;
- the browser exposes a Supabase service-role key or Google client secret.

These are P0 data-integrity or security failures. Do not continue creating more test data until the cause is known.

## 4. Tester preparation

### 4.1 Required access

Prepare:

- a desktop browser at 100% zoom;
- a mobile browser or responsive mode at `390 × 844`;
- a short mobile viewport at approximately `390 × 700`;
- a second browser profile, incognito session, or separate device;
- two inboxes that can receive confirmation and reset emails;
- optional read-only access to the connected Supabase project for database checks;
- one Google account if Google authentication is part of this acceptance run.

Do not use a real customer's account, business name, venue, or financial data.

### 4.2 Start the application

From:

`C:\Users\User\Desktop\Apex\Little Birdie`

run:

```powershell
npm run dev
```

Open:

`http://localhost:3000`

Optional engineering pre-flight:

```powershell
npm test -- --reporter=verbose --maxWorkers=1
npx tsc --noEmit --incremental false
npm run build
```

All three should complete successfully before final sign-off.

### 4.3 Test identities

Use unique addresses for this run. Add the date or a plus-address suffix if the email provider supports it.

| Identity | Suggested data |
|---|---|
| Account A name | Alex Test |
| Account A email | Tester-owned unique inbox A |
| Account A business | North Star Café |
| Account A venue 1 | Surry Hills |
| Account A venue 2 | Newtown |
| Account A industry | Café / Restaurant |
| Account B name | Bailey Test |
| Account B email | Tester-owned unique inbox B |
| Account B business | Harbour Bakehouse |
| Account B venue 1 | Manly |
| Account B industry | Café / Restaurant |

Use a unique password of at least eight characters for each account. Do not put passwords in this document or screenshots.

### 4.4 Reusable financial datasets

These datasets make venue mixing easy to notice.

#### Dataset A — Account A, Surry Hills, version 1

| Setup input | Value |
|---|---:|
| Monday revenue | $1,000 |
| Tuesday revenue | $1,000 |
| Wednesday revenue | $1,000 |
| Thursday revenue | $1,000 |
| Friday revenue | $2,000 |
| Saturday revenue | $3,000 |
| Sunday revenue | $2,000 |
| GST registered | Yes |
| Revenue figures | Include GST |
| Weekly wages | $2,000 |
| COGS | 30% |
| Other weekly costs | $1,500 |

Expected total entered revenue is **$11,000**. Expected estimated EBITDA is **+$3,500**.

#### Dataset A2 — Account A, Surry Hills, version 2

Use Dataset A, but change Monday revenue from **$1,000** to **$1,200**.

Expected total entered revenue is **$11,200**. Because the revenue is GST-inclusive and COGS is 30%, the expected estimated EBITDA is approximately **+$3,627** after whole-dollar display rounding.

#### Dataset N — Account A, Newtown

| Setup input | Value |
|---|---:|
| Every day, Monday to Sunday | $700 |
| GST registered | No |
| Weekly wages | $1,200 |
| COGS | 25% |
| Other weekly costs | $650 |

Expected total entered revenue is **$4,900**. Expected estimated EBITDA is **+$1,825**.

#### Dataset B — Account B, Manly

| Setup input | Value |
|---|---:|
| Every day, Monday to Sunday | $500 |
| GST registered | Yes |
| Revenue figures | Exclude GST |
| Weekly wages | $900 |
| COGS | 20% |
| Other weekly costs | $400 |

Expected total entered revenue is **$3,500**. Expected estimated EBITDA is **+$1,500**.

### 4.5 Optional Supabase inspection map

The user journey must pass through the UI. Database inspection is a second proof, not a replacement for it.

If the tester has Supabase Dashboard access, use:

- **Authentication → Users** for the Auth identity;
- **Table Editor → profiles** for the display name and onboarding completion;
- **businesses** and **business_members** for business ownership;
- **venues**, **venue_members**, and **venue_settings** for venue identity and configuration;
- **weekly_plans** for locked plan versions;
- **weekly_plan_days** for the seven daily allocations;
- **financial_assumptions** for versioned COGS, labour, other costs, and related assumptions;
- **audit_events** for recorded changes.

Never edit production-like records directly merely to make a UI test pass.

## 5. Required execution order

Run the tests in this order to reuse the same records and expose dependency failures early:

1. Pre-flight tests P-01 to P-04.
2. Simple journey tests S-01 to S-12 using Account A.
3. Persistence and versioning tests C-01 to C-05.
4. Multi-venue tests C-06 to C-10 using Newtown.
5. Create Account B and run isolation tests C-11 to C-14.
6. Run authentication lifecycle tests A-01 to A-08.
7. Run Google tests G-01 to G-05 if Google is in scope and enabled.
8. Run edge, security, and UI tests E-01 to E-17.
9. Perform the final reconciliation and cleanup.

Do not create Newtown before the first Surry Hills plan has been saved and checked. This makes any wrong-venue behavior easier to diagnose.

## 6. Pre-flight tests

### P-01 — Correct application and clean browser context

**Priority:** P0

1. Confirm the server was started from `C:\Users\User\Desktop\Apex\Little Birdie`.
2. Open a private/incognito window.
3. Open `http://localhost:3000`.
4. Open the browser console and Network panel.

**Expected:**

- The welcome screen opens from the C-drive checkout.
- There are no red runtime errors.
- Requests are made to the expected Little Birdee localhost and Supabase project.
- No customer session or customer data is already present.

### P-02 — Protected pages reject an unauthenticated visitor

**Priority:** P0

While signed out, directly open each URL:

1. `http://localhost:3000/onboarding`
2. `http://localhost:3000/setup`
3. `http://localhost:3000/app?period=this-week`
4. `http://localhost:3000/account`

**Expected:** Every URL ends at `/auth?mode=login`. No protected business, venue, or financial content flashes before the redirect.

### P-03 — Venue API rejects an unauthenticated visitor

**Priority:** P0

1. Stay signed out.
2. Open `http://localhost:3000/api/venue-state`.
3. Inspect the Network response if the browser formats the JSON.

**Expected:** The response is HTTP **401** and says the user must sign in. It contains no business, venue, plan, or actual data.

### P-04 — Google launch dependency is recorded

**Priority:** P1, or P0 when Google is part of the launch promise

1. On `/auth?mode=signup`, inspect the Google sign-in control.
2. Record whether a Google consent page opens.

**Expected, current disabled-provider state:** The control settles to disabled **Google sign-in coming soon** copy and cannot open a consent flow.

**Expected after activation:** The Google consent journey opens. Run section 10.

Do not mark the core email journey failed merely because the provider is deliberately disabled. If Google is promised for this release, mark Group 1 **BLOCKED** until section 10 passes.

## 7. Simple user-journey tests

### S-01 — Unified account gateway and account choices

**Priority:** P0

1. While signed out, open `/`.
2. Confirm the browser opens `/auth?mode=signup`.
3. Read the product promise and inspect the **Create account** and **Log in** tabs.
4. Switch to login using the top tab and return to signup using the link below the form.

**Expected:**

- The product promise and account form appear together as one complete gateway.
- **Create account** selects `/auth?mode=signup` and shows name, email, and password fields.
- **Log in** selects `/auth?mode=login` and shows email and password fields.
- The selected tab, URL, keyboard focus, and visible form remain synchronized.

### S-02 — Create-account form and basic validation

**Priority:** P0

1. Open `/auth?mode=signup`.
2. Confirm the page contains name, email, and password fields; a Google option; and a login link.
3. Attempt to submit with every field blank.
4. Enter an invalid email.
5. Enter a password shorter than eight characters.
6. Correct the email and password.

**Expected:**

- Fields have visible labels.
- The browser blocks blank required fields.
- The browser identifies the invalid email.
- The browser blocks a password shorter than eight characters.
- Correcting the values clears the browser validation and permits submission.
- Password characters are masked.

### S-03 — Create Account A with email

**Priority:** P0

1. Enter Account A's name, unique email, and password.
2. Press **Create my Little Birdee** once.
3. Observe the loading state.
4. Wait for the response.

**Expected:**

- The button shows a clear in-progress state and cannot create repeated accounts through accidental rapid clicks.
- When email confirmation is enabled, the page changes to **Check your email** and does not silently log the user into protected content.
- The message explains that the confirmation link is required.
- A single Account A identity appears in **Authentication → Users**.

### S-04 — Unconfirmed email cannot use the protected journey

**Priority:** P0

1. Before opening the confirmation link, open `/auth?mode=login` in another private tab.
2. Try Account A's email and password.
3. Directly open `/onboarding`.

**Expected:**

- Login does not grant a usable authenticated session before confirmation.
- The user receives a short, understandable authentication error.
- `/onboarding` returns to `/auth?mode=login`.
- No business details are exposed.

If the test Supabase project deliberately disables email confirmation, record **NOT RUN — confirmation disabled by environment** and obtain explicit launch approval for that configuration.

### S-05 — Confirm Account A's email

**Priority:** P0

1. Open Account A's confirmation email.
2. Confirm the sender and destination are expected.
3. Open the confirmation link once.
4. Wait for the callback to finish.

**Expected:**

- The link returns to the same Little Birdee origin through `/auth/callback`.
- The authenticated new user lands on `/onboarding`.
- The browser does not remain on a blank callback page.
- The URL never redirects to an unrelated external domain.

### S-06 — Auth bootstrap creates one tenant skeleton

**Priority:** P0

**Precondition:** Account A is confirmed.

1. Before completing onboarding, optionally inspect Supabase.
2. Find Account A by email.
3. Follow its user ID through the relevant tables.

**Expected:**

- There is one Auth user and one matching `profiles` row.
- There is one placeholder business and one owner `business_members` row.
- There is one placeholder venue with one `venue_settings` row.
- The records use stable IDs rather than the displayed names as relationships.
- No second business or venue was created by confirmation or refresh.

### S-07 — Complete Account A business onboarding

**Priority:** P0

1. On `/onboarding`, wait for the form to finish loading.
2. Confirm the name is prefilled from account creation.
3. Select **Café / Restaurant**.
4. Enter **North Star Café**.
5. Enter **Surry Hills**.
6. Confirm the currency note says Australian dollars and that GST choices come with revenue.
7. Press **Next: my numbers** once.

**Expected:**

- The form cannot continue while a required field is blank.
- Saving has a visible loading state.
- The browser opens `/setup?from=onboarding`.
- The saved profile, business, venue, and industry values match the trimmed entries.
- `profiles.onboarding_completed_at` is populated.
- No duplicate business or venue is created.

### S-08 — First Setup opens for the correct venue

**Priority:** P0

1. On Setup, confirm the first question is revenue.
2. Confirm the four-step progress indicator is visible.
3. Confirm the revenue step has no bottom **Back** button.
4. Confirm **Exit setup** and **Ask Birdee** are available.
5. At desktop and mobile widths, scroll to the final field and bottom action.

**Expected:**

- Revenue is the first Setup step for Surry Hills.
- No misleading Back button appears on the first revenue step.
- The active step and next action are clear.
- The final field is not hidden behind fixed bottom actions.
- Ask Birdee can be expanded and collapsed.

### S-09 — Save Dataset A as the first Surry Hills plan

**Priority:** P0

1. Enter Dataset A.
2. Use the Setup Next buttons through all four screens.
3. On each screen, check that the main displayed total matches the field.
4. On the last screen, press **See my profit** once.

**Expected:**

- The app waits while saving and does not double-submit.
- The browser opens `/app?period=this-week`.
- The dashboard loads without an error.
- The current venue's latest plan contains $11,000 entered revenue, $2,000 wages, 30% COGS, and $1,500 other costs.
- The forecast result is consistent with approximately **+$3,500 estimated EBITDA**.

### S-10 — Saved plan reloads after refresh

**Priority:** P0

1. Refresh the dashboard twice.
2. Open `/setup`.
3. Step through all four screens without saving.

**Expected:**

- Refresh does not return the user to onboarding or erase the plan.
- Setup reloads Dataset A from the selected Surry Hills venue.
- The dashboard and Setup do not revert to unrelated demo defaults.
- No duplicate plan is created merely by viewing Setup or refreshing.

### S-11 — Account page identifies the current venue

**Priority:** P0

1. Open `/account` through the application navigation.
2. Confirm the venue selector sits immediately beside the Little Birdee logo in the shared header.
3. Read the greeting, signed-in identity, provider, member date, access, venue list, and logout action.
4. Open the header venue selector.

**Expected:**

- The greeting uses **Alex Test**.
- The header selector shows **Surry Hills** as the current venue and **North Star Café** as its business where space permits.
- The selector is left-aligned beside the logo rather than centred in the page.
- Surry Hills is shown once and marked **Current**.
- The signed-in email, sign-in method, membership date, and **Owner** access are visible.
- The selector lists only authorized venues and includes **Add another venue**.
- **Start venue setup** and **Log out** are available.

### S-12 — Logout and normal returning-user login

**Priority:** P0

1. On `/account`, press **Log out**.
2. Confirm the browser opens `/auth?mode=login`.
3. Try to open `/app?period=this-week`; confirm it returns to login.
4. Log in with Account A's email and password.

**Expected:**

- Logout ends the usable local session.
- Protected pages no longer open after logout.
- Correct credentials return through `/auth/finish-setup`.
- Because onboarding and a locked plan exist, Account A returns to `/app?period=this-week`.
- Surry Hills and Dataset A remain selected and unchanged.

## 8. Complex persistence and versioning tests

### C-01 — Setup viewing does not create a version

**Priority:** P0

1. Record the current Surry Hills count and highest version in `weekly_plans`, if Supabase access is available.
2. Open `/setup`.
3. Move forward and backward through the four screens.
4. Press **Exit setup** without completing the final save.
5. Return to the dashboard.

**Expected:**

- The saved Dashboard plan remains Dataset A.
- Opening, navigating, and exiting Setup do not create a new locked plan.
- The database count and highest version remain unchanged.

### C-02 — A second Setup submission creates version 2

**Priority:** P0

1. Open `/setup`.
2. Enter Dataset A2 by changing only Monday from $1,000 to $1,200.
3. Leave every other value unchanged.
4. Complete all four steps and press **See my profit**.
5. Refresh the dashboard.

**Expected:**

- The latest plan totals $11,200.
- The forecast is approximately **+$3,627** after whole-dollar display rounding.
- A new locked plan exists for Surry Hills with `version = 2`.
- The first plan still exists as locked version 1.
- Version 2 has exactly seven daily rows.
- Version 1's Monday remains $1,000; version 2's Monday is $1,200.

### C-03 — Earlier locked plan remains immutable

**Priority:** P0

1. In Supabase, open Surry Hills weekly plan version 1.
2. Record its header and seven day rows.
3. Compare them with the values recorded before C-02.
4. If an authorized engineering tester is performing a non-production security check, attempt to edit one locked row and then cancel or roll back any allowed operation.

**Expected:**

- Version 1 and all seven of its daily rows are unchanged.
- Version 2 points to a new plan ID.
- The application reads version 2 as latest.
- Direct mutation or deletion of locked history is rejected.

### C-04 — Plan save is complete and internally consistent

**Priority:** P0

1. Inspect Surry Hills version 2.
2. Count its `weekly_plan_days`.
3. Compare the day amounts with Dataset A2.
4. Inspect its financial assumptions and audit evidence.

**Expected:**

- There are exactly seven day rows numbered Monday through Sunday.
- Daily revenue sums to $11,200.
- The plan header contains the same GST basis, COGS, labour, and other-cost settings shown in Setup.
- The relevant assumptions have new versioned records and retain their earlier records.
- Audit evidence identifies the affected venue and record.

### C-05 — Browser-local values do not override the server plan

**Priority:** P0

1. While Account A is logged in, use DevTools to clear Local Storage only.
2. Keep cookies intact.
3. Refresh `/setup`.
4. Recheck every Dataset A2 value.

**Expected:**

- Setup still loads Dataset A2 from Supabase.
- The plan is not replaced by old browser defaults.
- Clearing Local Storage creates no plan version.
- Server persistence remains authoritative for an already configured venue.

### C-06 — Create a second venue

**Priority:** P0

1. Open `/account`.
2. Press **Start venue setup**.
3. Confirm the browser opens `/venues/new`.
4. Read the reason each venue needs its own Setup.
5. Enter **Newtown** as the venue name.
6. Press **Next: venue numbers** once.

**Expected:**

- The new-venue page identifies this as **Step 1 of 2** and explains that each venue keeps separate profit inputs.
- Newtown is created once, becomes the selected venue, and the app opens `/setup?from=new-venue`.
- Setup identifies **Newtown** and explains that all four steps are required before Birdee can calculate that venue's profit.
- The list contains Surry Hills and Newtown once each.
- Newtown has its own venue ID and settings row.
- Surry Hills remains present and unchanged.

### C-07 — An unfinished venue remains visible and resumes Setup

**Priority:** P0

1. With Newtown's Setup open, press **Exit setup** before saving the final plan.
2. Confirm the browser returns to `/account?setup=pending`.
3. Inspect the Newtown row and the header selector.
4. Select Newtown again from the header or press **Finish setup**.

**Expected:**

- The Account page explains that Newtown still needs Setup.
- Newtown remains visible and is labelled **Setup required** rather than disappearing or appearing ready.
- Selecting the unfinished venue returns to `/setup?from=venue-switch`.
- Dataset A or A2 is not presented as Newtown's saved server plan.
- No Surry Hills plan is copied merely by creating or selecting Newtown.
- The user receives a clear recovery path rather than a broken or empty dashboard.

Note: a legacy browser-local week may prefill a brand-new venue as a convenience. It must not become authoritative until **See my profit** is pressed, and it must not be described as an already saved Newtown plan.

### C-08 — Save a distinct Newtown plan

**Priority:** P0

1. Enter Dataset N in Setup.
2. Complete the four steps.
3. Press **See my profit**.
4. Refresh the dashboard.
5. Return to `/account` and reopen the header venue selector.

**Expected:**

- Newtown's plan totals $4,900.
- Its estimated EBITDA is **+$1,825**.
- Newtown has locked version 1 with seven daily rows.
- Newtown is now labelled **Ready** and no longer routes back to Setup.
- Surry Hills still has its separate versions 1 and 2.

### C-09 — Switching venues switches every current record

**Priority:** P0

1. Open the venue selector beside the Little Birdee logo.
2. Select Surry Hills.
3. Confirm the browser opens `/app?period=this-week`.
4. Open `/setup` and verify Dataset A2.
5. Open the shared header selector and select Newtown.
6. Open `/setup` and verify Dataset N.

**Expected:**

- Surry Hills loads $11,200 and its A2 cost assumptions.
- Newtown loads $4,900 and its N cost assumptions.
- The header label and Account-page Current marker follow the selected venue.
- Revenue, GST basis, wages, COGS, other costs, and dashboard result switch together.
- No value from one venue is written into the other.

### C-10 — Current venue survives refresh and a normal relaunch

**Priority:** P0

1. Leave Newtown selected.
2. Refresh `/account` and `/app`.
3. Close the browser normally without clearing cookies.
4. Reopen the browser and log in if required.

**Expected:**

- Newtown remains current for the local browser session.
- If login is required, `/auth/finish-setup` selects an authorized venue and loads a valid plan.
- The selected venue is never an unauthorized or deleted venue.
- The `little-birdee-venue` cookie is scoped to the app, HTTP-only, and SameSite Lax. It is Secure in production; localhost may show it without Secure.

### C-11 — Create Account B as an independent tenant

**Priority:** P0

1. Log out Account A.
2. In a separate clean browser profile, repeat S-03 to S-09 for Account B.
3. Use **Harbour Bakehouse**, **Manly**, and Dataset B.

**Expected:**

- Account B receives its own profile, business, venue, settings, and plan IDs.
- Account B's Manly dashboard is approximately **+$1,500**.
- Account A's businesses and venues never appear.

### C-12 — Account B cannot see Account A through the UI

**Priority:** P0

1. While logged in as Account B, open `/account`.
2. Inspect all listed businesses and venues.
3. Search the rendered page for **North Star**, **Surry Hills**, and **Newtown**.
4. Open Dashboard and Setup.

**Expected:**

- Only Harbour Bakehouse and Manly appear.
- Account B loads Dataset B, not A2 or N.
- Account A names and amounts are absent from HTML, controls, and network responses.

### C-13 — Unauthorized venue selection is rejected

**Priority:** P0

1. Copy Surry Hills' venue ID from Supabase while Account A is the reference account.
2. Log in as Account B.
3. In DevTools, change the hidden `venueId` value in Account B's venue-switch form to Surry Hills' ID.
4. Submit the modified form.
5. Reopen `/account` and `/app`.

**Expected:**

- The app redirects to `/account?error=venue`.
- It says **That venue is not available to this account.**
- Current venue remains Manly.
- No Account A data is returned or changed.

If DevTools editing is not available, record this case as **BLOCKED** and require an engineering-level RLS test before sign-off.

### C-14 — Returning to Account A proves no cross-tenant mutation

**Priority:** P0

1. Log out Account B.
2. Log in as Account A in Account A's browser profile.
3. Open `/account`.
4. Switch between Surry Hills and Newtown and verify their saved plans.

**Expected:**

- Account A still has only North Star Café, Surry Hills, and Newtown.
- Surry Hills remains Dataset A2.
- Newtown remains Dataset N.
- Account B's Manly plan never appears.

## 9. Authentication lifecycle tests

### A-01 — Incorrect password

**Priority:** P0

1. Log out.
2. On `/auth?mode=login`, enter Account A's email and an incorrect password.
3. Press **Log in**.

**Expected:**

- The user remains on the login screen.
- A short error is announced and displayed.
- No protected content opens.
- The password is not echoed in the URL, page, console, or error text.

### A-02 — Unknown email and account-discovery resistance

**Priority:** P1

1. Try logging in with an address that has never been registered.
2. Request a password reset for the same unknown address.
3. Compare the visible response with a reset request for Account A.

**Expected:**

- Login fails without exposing sensitive account details.
- The forgot-password journey gives a neutral completion response and does not clearly disclose whether the address exists.
- No account is created by a reset request.

### A-03 — Forgot-password email

**Priority:** P0

1. Open `/auth/forgot-password`.
2. Enter Account A's email.
3. Press **Send reset link** once.
4. Open the inbox.

**Expected:**

- The button shows a sending state.
- The page changes to **Check your email**.
- One current reset email arrives.
- Its destination returns through `/auth/callback?next=/auth/reset-password`.

### A-04 — Password mismatch and minimum length

**Priority:** P0

1. Open the current reset link.
2. Enter fewer than eight characters in both fields.
3. Enter two different valid-length passwords.
4. Submit each attempt.

**Expected:**

- The browser blocks the too-short password.
- Different valid-length passwords show **Passwords do not match.**
- The session is not redirected to the dashboard until both fields match and the update succeeds.

### A-05 — Successful password reset

**Priority:** P0

1. Enter the same new valid password in both fields.
2. Press **Save new password**.
3. Log out.
4. Try the old password.
5. Try the new password.

**Expected:**

- Successful reset opens `/app?period=this-week`.
- The old password no longer logs in.
- The new password logs in.
- Businesses, venues, current plan versions, and amounts remain unchanged.

### A-06 — Expired or reused recovery link

**Priority:** P1

1. Reopen the already-used reset link.
2. If the environment permits, also test a deliberately expired link.
3. Attempt to set another password.

**Expected:**

- An invalid link does not silently grant account access.
- The user receives a safe route back to login or forgot password.
- Existing business and plan data remain unchanged.

### A-07 — Refresh and second-device persistence

**Priority:** P0

1. Log in as Account A on a second browser profile or device.
2. Open `/account`.
3. Select Surry Hills if needed.
4. Open `/setup` and verify Dataset A2.
5. Refresh repeatedly.

**Expected:**

- The same account, business, venue list, and server plan are available.
- No Local Storage copying is required.
- The second browser starts from an authorized venue even if it does not share the first browser's current-venue cookie.
- Refresh does not duplicate records.

### A-08 — Cleared-site-data recovery

**Priority:** P0

1. In Account A's second browser, clear cookies, Local Storage, and site data for localhost.
2. Reopen `/app?period=this-week`.
3. Log in again.
4. Open `/account`, then verify both venues and plans.

**Expected:**

- Clearing site data signs the local browser out.
- Login restores Account A's server records.
- Both Surry Hills and Newtown still exist.
- Their Dataset A2 and Dataset N plans remain separate and unchanged.

## 10. Google authentication tests

Run this section only after the Google Web OAuth client, Supabase callback, provider, site URL, and allowed redirect URLs have been configured.

### G-01 — New user creates an account with Google

**Priority:** P1, or P0 when Google is in the launch promise

1. Sign out of Little Birdee.
2. Open `/auth?mode=signup`.
3. Press **Continue with Google** after the provider has been activated.
4. Select a Google identity not previously used with Little Birdee.
5. Accept the requested consent.

**Expected:**

- The consent screen shows the expected Little Birdee identity and domain.
- Only basic identity scopes are requested.
- The callback returns to `/onboarding`.
- One Auth user and one tenant skeleton are created.

### G-02 — Google onboarding follows the same product journey

**Priority:** P1, or P0 when Google is in the launch promise

1. Complete business onboarding for the Google account.
2. Complete Setup with a small distinct test dataset.
3. Log out.

**Expected:**

- Google users use the same onboarding, venue, and Setup rules as email users.
- The account receives one business and one first venue.
- The plan persists after logout.

### G-03 — Returning Google login reuses the account

**Priority:** P1, or P0 when Google is in the launch promise

1. On `/auth?mode=login`, press **Continue with Google** after the provider has been activated.
2. Choose the same Google identity.

**Expected:**

- The user returns through `/auth/finish-setup`.
- The existing business, venue, and plan load.
- No second business, venue, profile, or plan is created by login.

### G-04 — Cancelled Google consent

**Priority:** P1

1. Start Google login again.
2. Cancel or deny consent.

**Expected:**

- The user returns safely to Little Birdee or can navigate back to login.
- No partial authenticated session or duplicate tenant appears.
- Email login remains available.

### G-05 — Google production-domain callback

**Priority:** P0 before production Google launch

1. Repeat G-01 or G-03 on the permanent production domain.
2. Inspect the callback domain and final destination.

**Expected:**

- The OAuth callback uses the configured Supabase callback.
- Little Birdee returns to the permanent production origin, not localhost or a preview URL.
- No redirect-mismatch warning occurs.

## 11. Edge, security, and interface tests

### E-01 — Onboarding blank and whitespace-only values

**Priority:** P0

1. With a fresh test account, clear each onboarding field in turn.
2. Enter spaces only in name, business, and venue.
3. Try to submit.

**Expected:**

- Blank or whitespace-only required values cannot complete onboarding.
- The user remains on the form with the entered context intact.
- No blank business or venue name is persisted.

### E-02 — Names are trimmed and support normal punctuation

**Priority:** P1

1. Use values with leading/trailing spaces.
2. Include common business punctuation and Unicode, such as `O'Bird & Co. Café`.
3. Save onboarding or create a non-production venue.

**Expected:**

- Leading and trailing spaces are removed.
- Apostrophes, ampersands, accents, and normal punctuation display correctly.
- Text is not shown as HTML and cannot change the page structure.

### E-03 — Maximum-length names remain usable

**Priority:** P1

1. Enter the longest permitted display name.
2. Enter the longest permitted business and venue names.
3. Check desktop, `390 × 844`, and `390 × 700`.

**Expected:**

- The browser stops input at the defined maximum.
- Long names wrap or truncate without hiding actions or creating horizontal scrolling.
- Account and current-venue cards remain readable.

### E-04 — Duplicate venue name

**Priority:** P1

1. In Account A, open **Start venue setup**.
2. On `/venues/new`, try to create another venue named **Surry Hills**.
3. Observe the response and venue list.

**Expected:**

- The app either rejects the duplicate with a clear message or creates a separately identifiable venue according to the agreed product rule.
- It never silently changes the existing Surry Hills venue or plan.
- The behavior is recorded for a product decision if duplicate names are currently allowed.

### E-05 — Rapid repeated submissions

**Priority:** P0

Test rapid double-clicking on:

1. **Create my Little Birdee**;
2. **Next: my numbers**;
3. **See my profit**;
4. **Next: venue numbers**.

**Expected:**

- Loading states prevent duplicate account, onboarding, plan, or venue records.
- At most one successful operation occurs per intended submission.
- If the network repeats a request, the app produces either one authoritative result or a clear error without partial records.

### E-06 — Refresh during onboarding

**Priority:** P1

1. Enter unsaved onboarding changes.
2. Refresh before pressing **Next: my numbers**.
3. Repeat after a successful save.

**Expected:**

- Unsaved form edits are not mistaken for persisted data.
- After successful save, refresh routes through the completed onboarding state.
- Refresh does not create another business or venue.

### E-07 — Exit Setup with unsaved changes

**Priority:** P0

1. Open Surry Hills Setup with Dataset A2 saved.
2. Change several values but do not reach the final save.
3. Press **Exit setup**.
4. Return to Setup.

**Expected:**

- Dataset A2 remains the saved Surry Hills plan.
- Unsaved edits do not create a plan version or overwrite any locked version.
- The dashboard remains based on Dataset A2.

### E-08 — Network loss during final Setup save

**Priority:** P0

1. In a disposable venue, enter a distinct plan.
2. Use DevTools Network conditions to go offline immediately before **See my profit**.
3. Press the button once.
4. Restore the network and inspect the UI and Supabase.

**Expected:**

- The user remains in Setup and sees a clear save error.
- Entered values remain available for retry.
- No partial locked plan, partial daily rows, or partial assumptions exist.
- Retrying once online creates one complete version.

### E-09 — Invalid venue cookie recovers safely

**Priority:** P0

1. While logged in, replace or remove the `little-birdee-venue` cookie using DevTools.
2. Refresh `/app` and `/account`.

**Expected:**

- A missing or invalid cookie falls back to an authorized active venue.
- The app never uses a venue from another account.
- The recovered venue ID is stored for later requests.
- If no authorized venue exists, the app shows a safe error rather than unrelated data.

### E-10 — External redirect injection is rejected

**Priority:** P0

1. While signed out, open `/auth/callback?next=//example.com`.
2. Repeat with `next=https://example.com`.

**Expected:**

- The app does not redirect to `example.com`.
- Without a valid callback code, the user returns to Little Birdee login.
- Only safe same-origin paths are accepted as callback destinations.

### E-11 — Logout, browser Back, and two open tabs

**Priority:** P0

1. Open Dashboard and Account in two tabs.
2. Log out from the Account tab.
3. In the Dashboard tab, press Back, Forward, and refresh.

**Expected:**

- Cached visuals may briefly remain in browser history, but refresh cannot retrieve protected records.
- The stale tab returns to login when it needs server or API data.
- No mutation is possible after logout.

### E-12 — No privileged secrets in the browser

**Priority:** P0

1. Search page source, loaded JavaScript, Network requests, and browser storage for `service_role`, Google client secret, or other private credentials.
2. Inspect `.env.example`, not `.env.local`, when recording which variables are intended for the browser.

**Expected:**

- Only the Supabase public URL and publishable/anon credential are browser-available.
- No service-role key or Google client secret appears.
- Google client secret exists only in the Supabase provider configuration.

### E-13 — Mobile account and authentication layouts

**Priority:** P0

At `390 × 844`, test:

1. welcome;
2. create account;
3. login;
4. forgot password;
5. onboarding;
6. account;
7. new venue at `/venues/new`;
8. Setup.

**Expected:**

- No horizontal page scroll.
- The venue selector remains beside the Little Birdee mark, the current venue remains readable, and the Account action remains reachable.
- Opening the selector keeps the entire menu inside the viewport.
- Every field, error, help control, venue status, and primary action is visible.
- The new-venue explanation stacks below the form without hiding **Next: venue numbers** or **Cancel**.
- The keyboard does not permanently hide the active field or submit action.
- Touch targets are comfortably usable.
- Long content can scroll without fixed controls covering it.

### E-14 — Short mobile viewport

**Priority:** P0

Repeat the essential account, onboarding, and Setup journey at approximately `390 × 700`.

**Expected:**

- The shared header does not wrap into an unusable second row.
- The lowest field can scroll above any fixed action dock.
- Ask Birdee remains available on all Setup steps.
- Buttons do not overlap cards or each other.
- The user can reach the primary action without browser zoom.

### E-15 — Keyboard-only journey

**Priority:** P1

1. Put the mouse aside.
2. Use Tab, Shift+Tab, Space, Enter, arrow keys, and Escape.
3. Complete login, onboarding, venue switching, and Setup navigation.

**Expected:**

- Focus order follows the visual order.
- Every interactive control receives a visible focus indicator.
- Labels are announced with their fields.
- Select controls and buttons work from the keyboard.
- Escape closes an open Ask Birdee disclosure.
- Focus is not trapped or lost after a save error.

### E-16 — Zoom and text resizing

**Priority:** P1

1. Test key screens at 200% browser zoom on desktop.
2. Increase browser text size where supported.

**Expected:**

- Content reflows without overlapping or disappearing.
- Essential actions and error messages remain reachable.
- Horizontal scrolling is not required for ordinary form completion.

### E-17 — Loading, error, and retry clarity

**Priority:** P1

1. Use network throttling to slow signup, onboarding load/save, login, venue switch, and Setup save.
2. Temporarily block a request to observe its error state.
3. Restore the request and retry.

**Expected:**

- Each long operation has a visible loading or disabled state.
- The user cannot accidentally submit the same action repeatedly.
- Errors explain what failed in plain language without exposing internals.
- Retrying succeeds without reloading unrelated defaults or creating duplicates.

## 12. Final data reconciliation

After all P0 tests, complete this table:

| Check | Expected | Actual | Result |
|---|---|---|---|
| Account A Auth users | 1 | | |
| Account A profiles | 1 | | |
| Account A businesses | North Star Café only | | |
| Account A venues | Surry Hills and Newtown | | |
| Surry Hills latest plan | Dataset A2, version 2 | | |
| Surry Hills earlier plan | Dataset A, version 1 unchanged | | |
| Surry Hills day rows | 7 per plan version | | |
| Newtown latest plan | Dataset N, version 1 | | |
| Newtown day rows | 7 | | |
| Account B businesses | Harbour Bakehouse only | | |
| Account B venues | Manly only | | |
| Manly latest plan | Dataset B, version 1 | | |
| Cross-account records visible | 0 | | |
| Partial locked plans | 0 | | |
| Duplicate unintended venues | 0 | | |
| Browser-visible private secrets | 0 | | |

Any cross-account visibility, wrong-venue plan, overwritten locked plan, partial plan, or exposed private secret is a P0 failure.

## 13. Known dependencies and decision records

Record these separately from functional failures:

| Item | Current position | Sign-off treatment |
|---|---|---|
| Google provider | Application UI exists; external provider may still be disabled | Required only if Google is part of this release promise |
| Production Auth URLs | Local callback can be tested now | Must pass on the permanent production domain before production launch |
| Multi-user invitations | Database roles exist; invitation/management UI is not yet defined | Product decision required; not a Group 1 failure unless declared launch scope |
| Historical periods | Still demo-backed | Group 4 |
| Daily actual entry | Not part of this persistence run | Group 3 |
| P&L upload | Parked | Group 2 |
| POS and rostering | Separate connector work | Not required for Group 1 |

## 14. Cleanup

After the run:

1. Export or save the completed result sheet and evidence.
2. Keep the accepted Account A records only if they are needed for the next implementation group.
3. In Supabase **Authentication → Users**, delete disposable Auth users using an authorized administrator workflow.
4. Confirm related disposable business and venue records are removed or archived according to the project's retention rule.
5. Never delete records by broadly clearing production tables.
6. Remove screenshots that contain email addresses if they are not needed as test evidence.

## 15. Final sign-off criteria

Group 1 may be accepted only when:

- every P0 test is PASS;
- no tenant-isolation, venue-isolation, partial-save, or immutable-history failure exists;
- email confirmation, login, logout, reset, refresh, cleared-storage, and second-browser/device journeys pass in the launch-like environment;
- two venues visibly retain distinct plans through the UI;
- a second Setup save visibly creates a new latest version while the earlier version remains unchanged;
- desktop, standard mobile, and short-mobile journeys remain usable;
- production Auth URLs are confirmed before production release;
- Google tests pass if Google is included in the launch promise;
- every accepted P1 exception has an owner, rationale, and target date;
- later-group gaps are recorded and not mistaken for completed Group 1 behavior.

### Tester sign-off

| Sign-off item | Owner | Result/date |
|---|---|---|
| Automated pre-flight passed | Engineering | |
| P0 pre-flight and simple tests passed | Product/QA | |
| P0 persistence and versioning tests passed | Product/QA | |
| P0 multi-venue tests passed | Product/QA | |
| P0 tenant-isolation tests passed | Product/QA | |
| P0 authentication lifecycle tests passed | Product/QA | |
| Mobile and accessibility checks passed | Product/QA | |
| Google accepted or formally excluded | Product owner | |
| Production Auth URLs confirmed | Engineering/Product | |
| Test data cleaned up or retained deliberately | Tester | |
| Group 1 accepted | Product owner | |

### Tester summary

```text
Test date:
Tester:
Commit/build tested:
Environment:
Desktop browser and viewport:
Mobile browser and viewport:
Second browser/device:

P0 passed:
P0 failed:
P1 failed:
Blocked:
Not run:

Google status: PASS / BLOCKED / EXCLUDED FROM THIS RELEASE
Production Auth URL status: CONFIRMED / PENDING
Multi-user invitations: IN SCOPE / OUT OF SCOPE / UNDECIDED

Group 1 recommendation: ACCEPT / ACCEPT WITH RECORDED P1 EXCEPTIONS / DO NOT ACCEPT

Notes:
```
