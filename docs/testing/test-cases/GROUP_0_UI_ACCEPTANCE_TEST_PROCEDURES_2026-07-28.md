# Group 0 UI acceptance test procedures

**Product:** Little Birdee  
**Test URL:** `http://localhost:3000`  
**Prepared:** 28 July 2026  
**Scope:** Group 0 financial contract as exposed through Setup, Dashboard, What Happened, What If, and Full Numbers
**Acceptance status:** Product-owner testing signed off on 28 July 2026 with the recorded later-group gaps below. The separate Australian-accountant review remains pending.

## 1. What this test is proving

These procedures test whether the existing screens consistently apply Little Birdee's agreed financial rules:

```text
Revenue excluding GST
+ Recurring operating other income
− COGS
− Labour
− Other operating costs
= Estimated EBITDA ("Profit" in the product)
```

For the current manual setup flow:

- GST is removed only when a GST-registered business says its entered revenue includes GST.
- COGS is calculated from revenue **excluding GST**.
- Weekly labour is the loaded roster cost, including super and other employment on-costs.
- Other costs are ordinary operating costs. They exclude tax, interest, depreciation, loan principal, and owner drawings.
- The result is an **estimated EBITDA snapshot**, not bank cash, statutory net profit, or income after tax.
- What If changes apply once to the whole selected period and must not overwrite the saved report.

### Current route note

The base URL `http://localhost:3000/` now redirects to the account gateway at `/home`.

Group 1 authentication has started, so `/setup`, `/app`, and `/account` now redirect unauthenticated visitors to `/auth/login`. The Group 0 sign-off recorded in this document was completed before that protection was added. Future regression runs should log in with a test account before using:

- Setup: `http://localhost:3000/setup`
- Dashboard: `http://localhost:3000/app?period=this-week`
- Account and venue selection: `http://localhost:3000/account`

## 2. What is not being accepted in this test

Do not mark Group 0 as failed merely because the following later-group functionality is absent or was not part of the signed-off Group 0 test:

- the now-started Group 1 login, account, business, venue, and persistence work;
- stored last-week, month, and custom-period history queries;
- daily manual actual-revenue entry;
- a manual recurring-other-income field;
- live POS revenue;
- live Deputy or other rostering data;
- P&L upload and AI extraction;
- real live timestamps;
- production onboarding and source-connection screens.

These omissions should still be reported if they prevent a test, but they belong to later implementation groups. Authenticated current-week reporting no longer seeds actuals; last-week, month, and custom-period screens remain demo-backed until the stored-history pass.

Product-owner Group 0 acceptance is complete. A separate financial-release check still requires:

1. the separate accountant review confirms the financial policy and wording;
2. any accountant correction is added to the canonical contract and regression tests before release.

## 3. Tester preparation

### 3.1 Before opening the app

1. Confirm the development server is running.
2. Open a desktop browser at `http://localhost:3000/` and log in with a test account.
3. Prefer a separate test account and venue. Current Setup values persist to Supabase; an older browser-local week may only prefill an otherwise unconfigured venue until the operator completes Setup.
4. Set browser zoom to 100%.
5. Open the browser developer console if comfortable doing so. Keep it visible during the tests and record any red errors.

Optional engineering pre-flight from the project folder:

```powershell
npm test -- --reporter=verbose --maxWorkers=1
npx tsc --noEmit --incremental false
```

Both commands should finish successfully before manual sign-off.

### 3.2 Record the starting values

Setup changes are saved only after completing all four steps and pressing **See my profit**. Before changing anything, visit `/setup` and record the current values:

| Input | Starting value |
|---|---:|
| Monday revenue | |
| Tuesday revenue | |
| Wednesday revenue | |
| Thursday revenue | |
| Friday revenue | |
| Saturday revenue | |
| Sunday revenue | |
| GST registered | |
| Revenue includes/excludes GST | |
| Weekly wages | |
| COGS rate | |
| Other weekly costs | |

Restore these values after testing if they matter to the current demo.

### 3.3 How to record a result

Use one result per test:

- **PASS:** every stated expected result occurred.
- **FAIL:** a calculation, label, route, persistence rule, or interaction differed.
- **BLOCKED:** the screen could not be reached or the app stopped responding.
- **NOT RUN:** intentionally skipped, with a reason.

For every failure, capture:

- test ID;
- actual value and expected value;
- screenshot;
- complete URL;
- browser and viewport size;
- console error, if any;
- whether refreshing reproduced it.

## 4. Accounting cheat sheet for the tester

You do not need to be an accountant to run these tests. Use these rules:

### GST

For fully taxable, GST-inclusive Australian sales:

```text
Revenue excluding GST = Entered revenue ÷ 1.1
GST removed = Entered revenue − Revenue excluding GST
```

Example:

```text
$11,000 entered revenue
÷ 1.1
= $10,000 revenue excluding GST

$11,000 − $10,000 = $1,000 GST
```

If the entry already excludes GST, or the business is not GST-registered, do not divide by 1.1.

### COGS

```text
COGS = Revenue excluding GST × COGS rate
```

At a 30% rate on $10,000 GST-exclusive revenue, COGS is $3,000.

### Estimated EBITDA

Using $10,000 net revenue, 30% COGS, $2,000 wages, and $1,500 other costs:

```text
$10,000 revenue excluding GST
− $3,000 COGS
− $2,000 wages
− $1,500 other costs
= $3,500 estimated EBITDA
```

### Break-even

With no recurring operating income:

```text
Break-even revenue excluding GST
= (Wages + Other costs) ÷ (1 − COGS rate)
```

For the example above:

```text
($2,000 + $1,500) ÷ (1 − 30%)
= $5,000 excluding GST
= $5,500 when displayed as GST-inclusive revenue
```

## 5. Required execution order

Run the tests in this order to avoid repeating setup:

1. Simple smoke tests S-01 to S-10 using the existing saved values.
2. Enter Golden Dataset A once.
3. Run complex tests C-01 to C-05.
4. Change only the GST setting for C-06 and C-07.
5. Re-enter the special datasets needed for the edge tests.
6. Restore the starting values recorded in section 3.2.

P0 failures block Group 0 acceptance. P1 failures should be corrected before Group 1 creates permanent user/business data around the behaviour. P2 failures can be scheduled if the workaround is clear and no calculation is wrong.

## 6. Simple test cases

### S-01 — Working entry routes and returning-user redirect

**Priority:** P0  
**Purpose:** Confirm the tester can reach the implemented product without relying on the missing root route.

1. Open `http://localhost:3000/home`.
2. Wait for the loading message to finish.
3. If setup was previously saved, confirm the browser redirects to `/app?period=this-week`.
4. Open `http://localhost:3000/setup` directly.
5. Confirm the Revenue step appears.
6. Confirm the first Revenue step has **Next: wages** but no **Back** button.

**Expected:**

- `/home` opens successfully and either offers the appropriate entry choice or redirects a returning user to the app.
- `/setup` shows **What revenue are ya expecting?**
- The first setup step cannot navigate backward to a non-existent earlier step.
- No blank screen or console error appears.

### S-02 — Setup language matches the financial contract

**Priority:** P0  
**Purpose:** Ensure a non-accountant is told what each number means.

1. On `/setup`, open **Ask Birdee: What counts as revenue?**
2. Confirm the answer tells the user to identify whether the sales figure already excludes GST.
3. Press **Next: wages**.
4. Open **Ask Birdee: What counts as wages?**
5. Confirm it mentions the full roster cost, super, other employment on-costs, and the owner's wage if applicable.
6. Press **Next: COGS** and open the COGS help.
7. Confirm COGS is described as a percentage of revenue excluding GST.
8. Press **Next: other costs** and open the help.
9. Confirm it includes ordinary running costs and excludes tax, interest, depreciation, loan principal, and owner drawings.

**Expected:** Every statement above is visible and understandable. No screen describes COGS as a percentage of GST-inclusive or gross revenue.

### S-03 — Daily revenue inputs control the weekly total

**Priority:** P0  
**Purpose:** Confirm the weekly revenue is the sum of the seven daily predictions.

1. Return to the Revenue step.
2. Record the seven daily values.
3. Add them with a calculator.
4. Compare the result with **Week total**.
5. Change Monday by $100.
6. Confirm **Week total** changes by exactly $100.
7. Put Monday back to its starting value before leaving the test.

**Expected:** The displayed weekly total always equals the seven visible day inputs.

### S-04 — GST choices show the correct recurring interaction

**Priority:** P0  
**Purpose:** Confirm Scott's chosen simple-onboarding path is represented.

1. Select **Yes** under **Registered for GST?**
2. Confirm a second choice appears: **Include GST** or **Exclude GST**.
3. Select **Exclude GST**.
4. Confirm the note says this can be used for GST-exclusive reports or mixed taxable and GST-free sales.
5. Select **No** under **Registered for GST?**
6. Confirm the include/exclude question disappears.

**Expected:**

- GST-registered users choose the basis once during setup.
- Mixed-sales users are directed to enter a GST-exclusive figure rather than enter GST on every day.
- Not-registered users are treated as GST-exclusive.

### S-05 — Setup completion saves and opens the dashboard

**Priority:** P0  
**Purpose:** Confirm all four inputs form one complete setup transaction.

1. Complete Revenue, Wages, COGS, and Other costs without changing the recorded values.
2. On the fourth step, press **See my profit**.
3. Confirm the URL becomes `/app?period=this-week`.
4. Refresh the page.
5. Select **Update numbers**.

**Expected:**

- The dashboard opens.
- Refreshing does not lose the saved setup.
- Returning to Setup shows the saved values.

### S-06 — Reporting periods and URLs remain synchronized

**Priority:** P1  
**Purpose:** Confirm the selected reporting period is unambiguous and shareable.

1. On the dashboard, select each period:
   - Yesterday
   - Last week
   - This week
   - Next week
   - Month
   - Custom
2. After each click, confirm the pressed period and URL agree.
3. Confirm the expected query values are:
   - `period=yesterday`
   - `period=last-week`
   - `period=this-week`
   - `period=next-week`
   - `period=month`
   - `period=custom&from-date=YYYY-MM-DD&to-date=YYYY-MM-DD`
4. When **Custom** is selected, confirm it immediately becomes the pressed period, the Custom range card opens, and the URL does not remain `period=month`.
5. Refresh on **Custom**.

**Expected:** The same period remains selected after refresh. Custom has its own URL and remains selected after refresh. Changing a period returns to the dashboard's main Revenue result.

### S-07 — Child views open and return to the same period

**Priority:** P0  
**Purpose:** Detect period loss or broken navigation between the related screens.

1. Select **This week**.
2. Open **What happened**.
3. Confirm the URL starts with `/app/what-happened?period=this-week`.
4. At a mobile viewport, confirm the footer action still says **See this week's numbers**, not **See all numbers**.
5. Use the back control labelled **This week**.
6. Open **What if**.
7. Confirm the URL includes `period=this-week&view=what-if`.
8. Use the back control.
9. Open **See all numbers**.
10. Confirm the URL includes `period=this-week&view=full-numbers`.
11. Use the back control.

**Expected:** Every child view returns to This week. It must not silently change to another period.

### S-08 — Honest source, certainty, and timestamp disclosure

**Priority:** P0  
**Purpose:** Ensure demo and estimated data are not presented as live facts.

1. Select **This week**.
2. Open **See all numbers**.
3. Press **See all numbers** inside the reconciliation table to expand it.
4. Inspect the small evidence line under Revenue, COGS, Wages, Fixed & variable, and Estimated profit.

**Expected:**

- Revenue and labour use a short label such as **Demo estimate · Not live**.
- COGS and profit use a short label such as **Calculated estimate · Not live**.
- Other manually configured amounts use a short label such as **Manual estimate · Not live**.
- No evidence label uses the longer **No live timestamp** sentence.
- The dashboard's main support text is the concise **Available actuals, with remaining costs estimated**.

### S-09 — Mobile controls remain clear of fixed actions

**Priority:** P0  
**Purpose:** Prevent the fixed action bars from covering the last editable control or clipping the dashboard's What If action.

Run this test first at **499 × 856**, then repeat it at **390 × 700**.

1. Open `/setup` on the Revenue step and scroll to the end.
2. Confirm the complete **Ask Birdee** row is visible rather than collapsed into a thin strip.
3. Expand **Ask Birdee** and confirm Birdee's full tip remains visible and pushes the form down without clipping.
4. Confirm Sunday, **Registered for GST?**, **These revenue figures…**, and the confirmation message can all be scrolled completely above Back and Next.
5. Continue through Wages, COGS, and Other weekly costs.
6. On every step, confirm Ask Birdee, the input, and the confirmation message remain fully visible above Back and Next.
7. Open `/app?period=yesterday`, `/app?period=last-week`, and `/app?period=this-week`.
8. On every period, confirm the complete **What if** button is inside the yellow result card with visible space beneath it.
9. Select **Custom**.
10. Confirm there is clear separation between the period selector, Custom range card, chapter tabs, and yellow result card.
11. Scroll below the yellow result card and confirm **Recorded history** contains readable, horizontally scrollable cards.

**Expected:**

- The user can scroll every setup control clear of the fixed action bar.
- No input, confirmation message, or What If button is clipped.
- The Custom range card does not touch the period selector or result card.
- Recorded History remains present and usable on mobile.

### S-10 — Cost totals and cost comparisons use different sign conventions

**Priority:** P0  
**Purpose:** Keep P&L totals mathematically correct without producing confusing phrases such as “−$29 above budget”.

1. Select **This week** and open **See all numbers**.
2. Expand the reconciliation table with its inner **See all numbers** button.
3. Confirm the Result and Budget columns show COGS, Wages, and Fixed & variable as negative amounts because they reduce EBITDA.
4. Inspect the comparison at the right of each row.
5. Confirm each comparison uses an unsigned magnitude plus a direction, for example:
   - **$164 over budget**
   - **$468 below budget**
   - **$0 on budget**

**Expected:** Cost totals remain negative, but no comparison begins with a negative sign. The direction words carry the meaning.

## 7. Golden Dataset A

Use this dataset for the main calculation tests:

| Input | Value |
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
| COGS rate | 30% |
| Other weekly costs | $1,500 |

The revenue total is $11,000. Complete all setup steps and press **See my profit**.

Expected forecast:

| Calculation | Expected |
|---|---:|
| Entered revenue | $11,000 |
| GST removed | $1,000 |
| Revenue excluding GST | $10,000 |
| COGS | $3,000 |
| Wages | $2,000 |
| Other costs | $1,500 |
| Recurring other income | $0 |
| Estimated EBITDA | **+$3,500** |
| Break-even revenue, entered basis | $5,500 |
| Amount above break-even | $5,500 |

## 8. More complex test cases

### C-01 — GST-inclusive golden forecast

**Priority:** P0  
**Precondition:** Golden Dataset A is saved.

1. On the dashboard, select **Next week**.
2. Read the main Revenue result.
3. Open **See all numbers**.
4. Expand the reconciliation using the second **See all numbers** control.
5. Read every result component.

**Expected:**

- The dashboard says **Your forecast** and **+$3,500**.
- Full Numbers says **Forecast profit** and **+$3,500**.
- Revenue is $11,000.
- GST is −$1,000.
- COGS is −$3,000, not −$3,300.
- Wages are −$2,000.
- Fixed & variable costs are −$1,500.
- Recurring other income is $0.
- Estimated profit is +$3,500.
- The forecast and budget columns agree, so variances are $0.

**Why use Next week:** It contains only the saved forecast. This week contains seeded demo actuals for completed days and is not a clean setup-only arithmetic test.

### C-02 — Break-even agrees with the profit calculation

**Priority:** P0  
**Precondition:** Golden Dataset A; remain in Next week Full Numbers.

1. Find **Break-even picture**.
2. Read Revenue plan, Break-even, and the gap.
3. Confirm the rate context below the chart.

**Expected:**

- Revenue plan is $11,000.
- Break-even is $5,500.
- The plan is $5,500 above break-even.
- Wages are 20.0% of net revenue.
- COGS rate is 30.0% **of revenue excluding GST**.
- The panel says the revenue plan clears the current cost mix.

### C-03 — Revenue What If follows GST and COGS

**Priority:** P0  
**Precondition:** Golden Dataset A; Next week selected.

1. Open **What if**.
2. Confirm **Right now** is +$3,500 and Scenario profit initially matches it.
3. Leave **Revenue** in dollar mode.
4. In **Change by**, enter `300` and press Enter or move focus away.
5. Confirm the helper below the input says **New revenue $11,300**.

**Expected:**

```text
New entered revenue             $11,300
New revenue excluding GST       $10,272.73
New COGS at 30%                  $3,081.82
New estimated EBITDA             $3,690.91
Rounded UI result               +$3,691
Improvement shown                 +$191
```

The result must not improve by the whole $300, because GST and COGS both follow the added revenue.

6. Replace the adjustment with `5000` and confirm the field accepts the larger scenario rather than capping it at the quick-adjust slider's original limit.
7. Press **Reset**.
8. Confirm Scenario profit returns to +$3,500 and Revenue says **No change**.

### C-04 — Each cost driver applies once to the selected period

**Priority:** P0  
**Precondition:** Golden Dataset A; Next week What If; scenario reset.

Run these one at a time, pressing **Reset** between rows:

| Driver and change | Action | Expected scenario | Expected change |
|---|---|---:|---:|
| Wages −$300 | Open Wages, use dollar mode, enter `-300` in **Change by** | +$3,800 | +$300 |
| COGS −0.5 percentage point | Open COGS, press Decrease once | +$3,550 | +$50 |
| Fixed & variable −$50 | Open Fixed & variable, press Decrease once | +$3,550 | +$50 |

**Expected:**

- A dollar adjustment is applied once to the whole Next week period.
- The Wages −$300 test must not become −$2,100 by multiplying it across seven days.
- The COGS row should show 29.5%, not “29.5% less.”
- Reset restores all four drivers, not only the open driver.

### C-05 — What If never mutates the report

**Priority:** P0  
**Precondition:** Golden Dataset A.

1. In Next week What If, apply any two non-zero adjustments.
2. Record the scenario result.
3. Press **Close scenario** without pressing Reset.
4. Confirm the dashboard still shows +$3,500.
5. Open Full Numbers and confirm all saved components still match Golden Dataset A.
6. Open What If again.

**Expected:**

- The dashboard and Full Numbers remain unchanged.
- A newly opened What If starts from no adjustments.
- The temporary scenario result never becomes the saved report.

### C-06 — GST-exclusive entry produces the equivalent forecast

**Priority:** P0

1. Open **Update numbers**.
2. Change the daily revenue inputs so they total **$10,000**. One suitable split is:
   - Mon $1,000
   - Tue $1,000
   - Wed $1,000
   - Thu $1,000
   - Fri $2,000
   - Sat $2,000
   - Sun $2,000
3. Keep GST registered as **Yes**.
4. Select **Exclude GST**.
5. Keep wages $2,000, COGS 30%, and other costs $1,500.
6. Save and select **Next week**.
7. Open Full Numbers and expand all rows.

**Expected:**

- Revenue is $10,000.
- GST is $0.
- COGS is $3,000.
- Estimated EBITDA is +$3,500.
- Break-even is $5,000 and the gap is $5,000.
- The result is financially equivalent to C-01 even though the entered revenue basis differs.

### C-07 — Not-GST-registered path does not remove GST

**Priority:** P0

1. Return to Setup with the C-06 values.
2. Select **No** under GST registration.
3. Confirm the include/exclude choice disappears.
4. Save and select **Next week**.
5. Open Full Numbers and expand all rows.

**Expected:**

- Revenue remains $10,000.
- GST is $0.
- COGS is $3,000.
- Estimated EBITDA is +$3,500.
- No `/1.1` calculation is applied.

### C-08 — This week explains its mixed actual/forecast state honestly

**Priority:** P1  
**Purpose:** Verify the current demo behaviour without mistaking it for the pure forecast.

1. Select **This week**.
2. Record the main estimated/projection value.
3. Open **What happened**.
4. Confirm its Estimated value matches the dashboard value.
5. Confirm it shows Budget profit, the largest drivers, and a statement that revenue impact includes GST and budgeted COGS.
6. Press **See this week's numbers**.
7. Confirm Full Numbers labels its hero **Estimated profit to date**, not full-week forecast.
8. Select **By day**.

**Expected:**

- Dashboard and What Happened describe the full selected week's mixed projection.
- Full Numbers clearly distinguishes its completed-days-to-date result.
- Completed days show Estimated, Budget, and Vs budget.
- Today says **Not entered** and future days say **Not yet**.
- Future rows cannot be opened as if they were completed actuals.

Do not require the Full Numbers to-date hero to equal the dashboard's full-week projection; require the scope labels and day totals to make the difference explicit.

### C-09 — Month and Custom use bounded demo history

**Priority:** P1

1. Select **Month**.
2. Confirm the screen identifies June 2026 and presents an estimated historical result.
3. Select **Custom**.
4. Confirm the panel says demo records are available from 1 to 30 June 2026.
5. Choose a valid range within June and press **View range**.
6. Refresh and confirm the custom range remains in the URL and view.
7. Open What Happened and Full Numbers for the custom range.

**Expected:**

- The chosen date range is preserved through child views and refresh.
- Full Numbers changes its detail tab to **By week** for historical ranges.
- No live-data wording appears.
- The result is presented as estimated demo history.

## 9. Edge-case test cases

### E-01 — All values zero

**Priority:** P0

1. In Setup, set every daily revenue to $0.
2. Set wages to $0, COGS to 0%, and other costs to $0.
3. Save and select **Next week**.
4. Open Full Numbers.

**Expected:**

- Forecast profit is +$0.
- Revenue, GST, COGS, wages, and other costs are all $0.
- Break-even is $0.
- No `NaN`, `Infinity`, blank currency, crash, or misleading positive success amount appears.

### E-02 — Zero revenue does not make fixed costs disappear

**Priority:** P0

1. Keep all daily revenue at $0.
2. Set wages to $700.
3. Set COGS to 30%.
4. Set other weekly costs to $700.
5. Save and select **Next week**.
6. Open Full Numbers, then **By day**.

**Expected:**

- Forecast profit is **−$1,400**.
- COGS is $0 because revenue is $0.
- Wages total $700 and other costs total $700.
- The seven-day allocation does not lose or multiply either weekly total.
- Every value remains finite.

### E-03 — Revenue on only one day preserves weekly totals

**Priority:** P0

1. Enter $0 for every day except Saturday.
2. Enter Saturday revenue as $11,000.
3. Select GST registered **Yes** and **Include GST**.
4. Set wages to $700, COGS to 30%, and other costs to $700.
5. Save and select **Next week**.
6. Open Full Numbers and select **By day**.

**Expected weekly result:**

```text
$10,000 net revenue
− $3,000 COGS
− $700 wages
− $700 other costs
= +$5,600
```

**Expected allocation:**

- The weekly total remains +$5,600.
- Saturday carries the revenue-linked allocation.
- Zero-revenue days do not invent revenue or COGS.
- The sum of the seven rows reconciles to the weekly totals.

### E-04 — COGS boundary values

**Priority:** P0

Use $10,000 GST-exclusive revenue, no wages, and no other costs.

1. Enter COGS as 0%, save, and inspect Next week.
2. Expected profit: +$10,000 and COGS $0.
3. Return to Setup and enter COGS as 99%, save, and inspect Next week.
4. Expected profit: +$100 and COGS $9,900.
5. Return to Setup and attempt to enter 120%.

**Expected:**

- The input clamps to 99%.
- No negative contribution margin is accepted.
- Full Numbers always states that the rate is applied to revenue excluding GST.

### E-05 — Negative and non-numeric entries are safely normalized

**Priority:** P1  
**Warning:** Do not finish Setup until you have restored sensible values unless this is an isolated browser profile.

1. Select all text in one revenue field and enter `-500`.
2. Select all text in a different revenue field and enter `abc`.
3. On Wages, enter `-100`.
4. On COGS, enter letters or an invalid decimal string.
5. On Other costs, enter `-100`.

**Expected:**

- Invalid or negative money values become $0.
- Invalid COGS becomes 0%.
- The weekly total updates without `NaN`.
- The UI remains usable and no console error appears.

### E-06 — Maximum values are enforced where defined

**Priority:** P1

1. On Wages, attempt to enter $150,000.
2. On COGS, attempt to enter 120%.
3. On Other costs, attempt to enter $150,000.

**Expected:**

- Wages clamp to $100,000.
- COGS clamps to 99%.
- Other costs clamp to $100,000.
- Saving and opening Full Numbers does not overflow, truncate into nonsense, or crash.

Revenue currently has no explicit maximum. Record excessively large revenue behaviour as an observation rather than assuming a cap.

### E-07 — Switching GST paths cannot leave a hidden stale basis

**Priority:** P0

1. Select **Yes**, then **Exclude GST**.
2. Select **No**.
3. Select **Yes** again.

**Expected:**

- Selecting No forces a GST-exclusive basis.
- Selecting Yes again starts on **Include GST**.
- The visible pressed choice always matches the calculation used after saving.
- No hidden previous Exclude selection silently changes the result.

### E-08 — Repeated scenario changes and resets do not accumulate

**Priority:** P0

1. Start from Golden Dataset A and Next week.
2. Open What If.
3. Set Revenue to +$300.
4. Press Reset.
5. Set Revenue to +$300 again.
6. Repeat the reset and adjustment three times.
7. Close the scenario, reopen it, and set Revenue to +$300 once more.

**Expected:** Every run produces the same +$3,691 scenario and +$191 improvement. The adjustment never doubles or leaks between openings.

### E-09 — Root URL behaviour

**Priority:** P1 before customer testing; P2 for an internal demo using direct routes

1. Open `http://localhost:3000/`.

**Current observed result:** Next.js displays **This page could not be found**.

**Decision rule:**

- Mark PASS only if the team intentionally distributes `/home`, `/setup`, or `/app` as the entry link during this phase.
- Mark FAIL if Scott, a tester, or a customer is expected to type or receive the base domain.

Recommended acceptance target for a customer-ready app: `/` should route to the correct landing, onboarding, or returning-user experience.

### E-10 — Cancelled Setup does not partially overwrite saved values

**Priority:** P1

1. Save a known setup and record its Next week result.
2. Reopen Setup.
3. Change Revenue and Wages.
4. Before reaching the final step, press **Exit setup**.
5. Return to Setup and inspect the values.

**Expected:** The previously saved values remain. Partially edited values are not treated as a completed setup.

### E-11 — Invalid custom date order is blocked

**Priority:** P1

1. Open **Custom**.
2. Set From to a later date than To.

**Expected:**

- **View range** is disabled.
- The invalid range is not written to the URL.
- Existing report state remains unchanged.

Then choose a valid range from 1 to 30 June 2026 and confirm it can be opened.

### E-12 — Narrow/mobile layout remains usable

**Priority:** P1

Test at approximately 390 × 844 pixels using browser responsive mode:

1. Open Setup and move through all four steps.
2. Open Dashboard, What Happened, What If, and Full Numbers.
3. Expand all Full Numbers rows.
4. Open the What If controls for every driver.
5. Scroll from top to bottom on each screen.

**Expected:**

- No horizontal page overflow.
- No clipped currency values or inaccessible buttons.
- Setup Next/Back controls remain reachable.
- Full Numbers shows the mobile **Update numbers** action.
- Back controls remain visible and preserve the selected period.
- The page does not require hover to reveal essential information.

## 10. Cross-screen reconciliation checklist

After Golden Dataset A, complete this table:

| Check | Expected | Actual | Result |
|---|---:|---:|---|
| Setup week total | $11,000 | | |
| Next week Dashboard forecast | +$3,500 | | |
| Next week What If baseline | +$3,500 | | |
| Next week Full Numbers forecast | +$3,500 | | |
| Full Numbers GST | −$1,000 | | |
| Full Numbers COGS | −$3,000 | | |
| Full Numbers wages | −$2,000 | | |
| Full Numbers other costs | −$1,500 | | |
| Full Numbers break-even | $5,500 | | |
| Revenue +$300 What If result | +$3,691 | | |
| Revenue +$300 What If improvement | +$191 | | |

Any mismatch in this table is a P0 failure.

## 11. Known gaps to record separately

These observations are expected in the current build and should be attached to the test report rather than silently ignored:

| Gap | Current behaviour | Planned treatment |
|---|---|---|
| Root route | `/` is a 404 | Add a deliberate entry route before external testing |
| Actual revenue | Completed-day values are seeded demo data | Group 3 manual entry first; POS later |
| Actual labour | Completed-day values are seeded demo data | Manual allocated labour first; Deputy integration later |
| Recurring other income | Engine and Full Numbers row exist, but Setup has no editable field | Add to the complete manual workflow |
| Data persistence | Setup is stored in browser local storage | Replace with source-neutral business/venue persistence |
| Sources/timestamps | Evidence correctly says no live sync/timestamp | Populate when real manual records and connectors exist |
| Month/custom | June 2026 demo records only | Replace with real persisted history |
| P&L | No upload/extraction flow | Parked until the manual workflow is stable |

## 12. Final sign-off

| Sign-off item | Owner | Result/date |
|---|---|---|
| P0 simple tests passed | Product/QA | Passed — 28 July 2026 |
| P0 complex tests passed | Product/QA | Passed after recorded UI corrections — 28 July 2026 |
| P0 edge tests passed | Product/QA | Passed — 28 July 2026 |
| P1 failures reviewed before Group 1 | Product/engineering | Reviewed; later-group gaps remain listed in section 11 — 28 July 2026 |
| Starting setup values restored | Tester | Not recorded |
| Automated tests passed | Engineering | 67 tests, TypeScript, production build, and focused browser checks passed — 28 July 2026 |
| Accountant review completed | External accountant | Pending; remains an external financial-policy release check |
| Group 0 accepted | Product owner | Accepted with recorded gaps — 28 July 2026 |

### Tester summary

```text
Browser:
Viewport:
Commit/build tested:

P0 passed:
P0 failed:
P1 failed:
Blocked:

Group 0 recommendation: ACCEPT WITH RECORDED GAPS

Notes:
Product-owner UI and calculation testing is complete. Group 1 may proceed.
Do not present the separate accountant validation as complete until written confirmation is received.
```
