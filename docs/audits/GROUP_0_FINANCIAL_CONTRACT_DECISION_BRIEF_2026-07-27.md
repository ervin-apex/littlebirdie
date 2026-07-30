# Group 0 financial contract decision brief

**Status:** Group 0 engineering and product-owner acceptance testing complete; accountant validation remains the external financial-contract check  
**Prepared:** 27 July 2026  
**Updated:** 28 July 2026 after Scott's financial-contract email response  
**Purpose:** Give Little Birdee one financial language and one calculation contract before P&L extraction, storage, and reporting are implemented.

## Executive answer

Scott has now resolved the material product-policy questions that previously prevented Group 0 from becoming a stable contract:

- Little Birdee's headline `Profit` is an **EBITDA snapshot**, not cash flow, profit after tax, or bank balance;
- daily actual revenue can come from a supported POS or manual entry;
- launch labour is the weekly planned roster total allocated across days and clearly labelled estimated; actual labour may later come from supported rostering software;
- the launch journey is a hybrid: users may prove the product's value with manual revenue before linking software;
- rostering integration is the higher priority because manual revenue is easier than manual actual labour;
- onboarding asks whether entered sales include or exclude GST;
- businesses with mixed taxable and GST-free sales must enter GST-exclusive revenue;
- the launch flow accepts manual COGS, other-cost, recurring-income, and labour assumptions;
- uploaded P&Ls remain the future alternative to Xero/MYOB but their OCR/AI extraction group is parked until the manual loop is established.

Scott's exact answers are preserved in [Scott financial-contract email response](../Meetings/07-28-2026-scott-financial-contract-email-response.md).

Group 0 engineering and product-owner acceptance testing are now complete. An Australian accountant should still validate the final EBITDA wording and manual classification boundary. Deputy proof is owned by separate Group 7, and production P&L ingestion is parked Group 2; neither blocks Group 1 implementation.

## The small amount of accounting Ervin needs to know

### 1. Revenue is not automatically money the business keeps

An operator may type `$11,000` because that is what the till took. If all those sales are taxable and the amount includes Australian GST:

- GST is `$1,000`;
- revenue excluding GST is `$10,000`;
- profit calculations should start from the `$10,000`, not the `$11,000`.

For a fully taxable GST-inclusive sale, GST is one-eleventh of the GST-inclusive price. Not every business is registered for GST, and some sales can be GST-free. The product therefore cannot safely divide every possible revenue amount by `1.1` without knowing its GST treatment. See the Australian Taxation Office's [GST definitions](https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/in-detail/definitions) and [GST registration rules](https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst).

### 2. COGS means the direct cost of what was sold

For a cafe, this can include food, coffee, packaging and stock movements. For a bookshop, it includes the books and other inventory sold. It is different from rent, bookkeeping, advertising, or wages.

Scott's sample P&Ls calculate their COGS percentages from GST-exclusive revenue. For example, the cafe's rate is:

`$291,350 COGS / $840,850 GST-exclusive revenue = 34.65%`

If Little Birdee separately removes GST and then applies `34.65%` to the original GST-inclusive till amount, it charges too much COGS. COGS must be applied to the same revenue basis from which its rate was calculated.

### 3. Labour is more than the cash wage line

Scott wrote:

> "wages (including all on costs)"

([Scott's brand voice document](../brand%20voice%20doc%20from%20Scott.txt#L19))

For Little Birdee, the labour bucket should therefore start with wages and include clear employment on-costs such as superannuation and workers compensation. When a P&L groups recruitment, training, uniforms, or similar accounts inside `Employment Expenses`, the extractor should propose them as labour and let the operator confirm. Ambiguous items such as contractors or chair-rental costs require review rather than a silent AI decision.

### 4. "Other costs" is Scott's simple name for everything else

Scott defined fixed and variable costs as:

> "all the other costs in your business that are NOT wages or cost of goods"

He then gave examples including rent, power, insurance, advertising, software, and loan repayments ([Scott's brand voice document](../brand%20voice%20doc%20from%20Scott.txt#L21)).

The product does not need to teach an operator the accounting distinction between fixed and variable expenses. It uses one combined weekly `Other costs` number. Internally, it can preserve the source accounts so the total is explainable.

### 5. Profit is a Little Birdee EBITDA snapshot

Scott has now defined the headline number:

> "we wont include anything that doesn’t appear as an EBITDA number"

> "this is not a cashflow – it’s a snapshopt of EBITDA"

([Scott's financial-contract email response](../Meetings/07-28-2026-scott-financial-contract-email-response.md#2-what-is-included-in-profit))

The canonical product model is:

```text
Little Birdee Profit (EBITDA snapshot)
= Revenue excluding GST
+ Recurring operating other income
− Cost of goods
− Labour including on-costs
− Ordinary operating other costs
```

Scott described the same sequence:

> "we take off the GST, we apply the cost of goods, then we take away the labor and the fixed and variable cost which will then generate a net profit figure."

([24 June meeting](../Meetings/06-24-2026.txt#L225))

For this product contract:

- include recurring operating other income, such as supplier rebates;
- exclude depreciation and amortisation;
- exclude interest and other financing costs;
- exclude income tax;
- exclude one-off or exceptional income and expenses;
- exclude owner drawings and loan-principal repayments because they are cash/balance-sheet movements, not EBITDA expenses.

`EBITDA` is not a substitute for statutory accounting profit or cash flow. Internally, the result should be named `ebitda`; the interface may use Scott's simpler label `Profit` only if `How calculated` explains that it is an EBITDA snapshot.

### 6. Budget, forecast, actual, and projected are different

- **Budget/forecast:** what the operator expected for the selected period.
- **Actual:** what has really happened in a completed period.
- **Projected:** actual results so far plus the remaining forecast.
- **Profit:** the result produced from the applicable inputs above.

Scott specifically requires the interface to use `Revenue` and `Budget`, not `Made` and `Plan` ([20 July meeting](../Meetings/07-20-2026.txt#L38)).

An "actual profit" is not genuinely actual if daily labour is still an estimate. Until Little Birdee receives real labour for that day, it should say `Estimated profit` or clearly disclose that rostered/allocated labour was used.

## What the existing evidence already settles

### A. Four financial drivers

Scott's own written summary says the four numbers are:

> "revenue, wages (including all on costs), Cost of Goods and F+V"

([Scott's brand voice document](../brand%20voice%20doc%20from%20Scott.txt#L19))

**Decision:** The canonical model has four operator-facing drivers: revenue, labour, COGS, and other costs.

### B. Canonical internal revenue basis

Scott said the calculation takes GST off revenue before calculating the result ([24 June meeting](../Meetings/06-24-2026.txt#L225)). He later specified percentages against:

> "net revenue, not total revenue"

([14 July meeting](../Meetings/07-14-2026.txt#L226))

Every supplied sample P&L also states that its amounts are GST-exclusive.

**Decision:** Store and calculate with GST-exclusive revenue internally. Preserve the entered amount and its GST treatment so the conversion is auditable.

### C. COGS percentage basis

Scott asked for COGS and wages percentages against net revenue, and explicitly excluded a percentage for fixed and variable costs ([14 July meeting](../Meetings/07-14-2026.txt#L220)).

**Decision:** `COGS rate = COGS dollars / GST-exclusive revenue`.

### D. Labour policy

Scott's written definition says wages include all on-costs ([Scott's brand voice document](../brand%20voice%20doc%20from%20Scott.txt#L19)).

**Decision:** Labour includes wages and clearly attributable employment on-costs. The extractor must expose its included accounts for confirmation.

### E. Other-cost policy

Scott defined F+V as all business costs other than wages and COGS, amortised into an average cost ([Scott's brand voice document](../brand%20voice%20doc%20from%20Scott.txt#L21)).

**Decision:** Use the operator-facing label `Other costs`. It is the confirmed collection of ordinary operating P&L costs that are not COGS or labour. It excludes depreciation, amortisation, interest, income tax, exceptional items, owner drawings, and loan principal.

### F. P&L normalisation

Scott said a P&L can cover seven days, a month, a quarter, or a year and asked for the longest period available ([27 July meeting](../Meetings/07-27-2026.txt#L141)).

**Decision:** Preserve exact inclusive start and end dates and calculate:

```text
average daily other costs = selected-period other costs / inclusive period days
weekly other-cost baseline = average daily other costs × 7
```

Do not use `annual / 52` or `month / 4`, because those shortcuts create inconsistent day rates and fail for partial periods.

### G. Daily allocation of weekly budgets

Scott was explicit:

> "if we're doing 11% of the revenue on a Monday then 11% of the fixed and variable cost needs to be applied to the Monday."

([24 June meeting](../Meetings/06-24-2026.txt#L128))

He applied the same temporary rule to weekly labour ([24 June meeting](../Meetings/06-24-2026.txt#L215)).

**Decision when no day-level roster exists:**

```text
day share = day forecast revenue / week forecast revenue
day labour budget = week labour budget × day share
day other-cost budget = week other-cost budget × day share
```

When a real day-level roster or actual labour amount exists, that amount replaces the allocated labour estimate. Other-cost allocation remains fixed to the original forecast share for budget-versus-actual comparison.

### H. COGS rate stays fixed; dollars change

Scott described COGS as a set percentage that does not change day to day ([24 June meeting](../Meetings/06-24-2026.txt#L146)). His written product description calls it "proven COGs" from a historical P&L ([Scott's brand voice document](../brand%20voice%20doc%20from%20Scott.txt#L22)).

**Decision:** The historical rate is fixed until the operator updates it. COGS dollars for a day equal that rate multiplied by that day's GST-exclusive revenue. If actual revenue changes, actual COGS dollars change even though the rate does not.

### I. Manual configuration launches first; P&L upload remains a later accounting-import path

Scott reconsidered Xero and MYOB and asked for:

> "AI software ... to analyze a P&L to generate two things"

Those two outputs were amortised fixed/variable costs and historical COGS percentage ([27 July meeting](../Meetings/07-27-2026.txt#L141)).

**Decision:** Group 0 defines the outputs consumed by both manual Setup and the future P&L extractor. The first usable flow asks the operator for the COGS rate, weekly other operating costs, optional recurring operating income, and weekly planned labour. The costly and unpredictable upload/OCR/AI-classification work is parked until this manual flow is established. When added, a confirmed extraction must write the same canonical venue-assumption records rather than create a second calculation path. The design must not depend on Xero- or MYOB-specific records.

### J. Chirp source priority and truthfulness

Scott confirmed a hybrid connected/manual journey:

> "with the focus being on linking rostering software as a priority and then the POS (also important) but much easier to enter manually"

([Scott's financial-contract email response](../Meetings/07-28-2026-scott-financial-contract-email-response.md#1-what-birdee-knows-when-it-chirps))

**Decision:** Revenue actuals may be manual or provider-supplied. Labour actuals should be provider-supplied. Planned roster cost and allocated weekly labour remain estimates; they must not silently become actual labour.

Every component must carry its source and certainty. Because COGS and other costs currently come from historical baselines, even a completed day with actual revenue and approved labour still produces an **Estimated EBITDA** result:

| Input situation | Revenue source | Labour source | Honest presentation |
|---|---|---|---|
| Future period | forecast | planned/allocated | Forecast EBITDA |
| Current period blending completed and future days | actual plus forecast | actual plus planned/allocated | Projected EBITDA |
| Completed day with scheduled/allocated labour | manual or POS actual | scheduled roster or allocated plan | Estimated EBITDA; labour estimated |
| Completed day with worked labour | manual or POS actual | worked but unapproved timesheet | Estimated EBITDA; labour provisional |
| Completed day with approved labour | manual or POS actual | approved timesheet cost | Estimated EBITDA; revenue/labour confirmed, COGS and other costs estimated |

A result can only be labelled `Confirmed EBITDA` if every component is confirmed actual data. That is not the current Little Birdee model. This distinction lets the launch journey work before every integration exists without making the landing-page Chirp misleading.

**Deputy feasibility check, 28 July:** Deputy's official API documentation exposes:

- planned shift cost on the [`Roster` resource](https://developer.deputy.com/docs/roster);
- worked shift cost on the [`Timesheet` resource](https://developer.deputy.com/docs/timesheet);
- approved payroll cost lines on [`TimesheetPayReturn`](https://developer.deputy.com/docs/timesheetpayreturn);
- a location-level [`SHIFT_COST_ADDITIONAL`](https://developer.deputy.com/docs/modifying-location-settings) percentage intended to add on-costs to calculated wage costs; and
- OAuth 2.0 and webhooks through the [public API](https://developer.deputy.com/docs/public-api-facts-and-overview).

Therefore Deputy can technically provide daily labour dollars. The unresolved point is which cost state is available and reliable at the Chirp cutoff, and whether a particular customer's Deputy configuration represents all on-costs promised by Little Birdee. That requires a real-tenant proof, not another accounting assumption.

### K. Simple GST onboarding

Scott selected the simple onboarding approach:

> "yes this one"

([Scott's financial-contract email response](../Meetings/07-28-2026-scott-financial-contract-email-response.md#3-gst-interaction))

**Decision:** Keep two distinct facts:

```text
GST registration
- not registered
- registered

Manual revenue entry basis, when registered
- includes GST
- excludes GST
```

For a non-registered business, the entered amount is already the canonical revenue amount. For a registered, fully taxable business entering GST-inclusive sales, convert to GST-exclusive revenue. A mixed-sales business must enter a GST-exclusive figure. Do not add recurring GST fields to weekly or daily entry.

## Proposed canonical calculation

### Stored values

The current `Week` object is too ambiguous. `rev` does not say whether it includes GST, and `fix` loses the provenance of the P&L baseline.

The canonical records should preserve at least:

```text
Revenue input
- entered amount
- entered basis: GST-inclusive or GST-exclusive
- GST registration status
- GST treatment/method
- GST amount
- canonical GST-exclusive amount
- source: forecast, manual actual, or provider actual

COGS baseline
- rate against GST-exclusive revenue
- source P&L and source period
- included source accounts
- operator confirmation

Labour
- planned amount
- actual amount when available
- included on-cost policy
- optional average loaded hourly cost
- source: allocated plan, scheduled roster, worked timesheet, or approved timesheet
- source status and last-updated time

Other-cost baseline
- original period amount
- original period dates
- included and excluded source accounts
- average daily amount
- weekly equivalent
- operator confirmation

Recurring operating other-income baseline
- original period amount and dates
- included and excluded source accounts
- average daily amount and weekly equivalent
- operator confirmation

Calculated result
- EBITDA amount
- result state: forecast, estimated, provisional actual, or confirmed actual
- component sources and last-updated times
```

All user-facing screens should consume calculated results from one financial module. They should never redo GST, percentages, period scaling, or profit arithmetic inside React components.

### Period calculation

For one selected period:

```text
net revenue = revenue excluding GST
cogs = net revenue × confirmed COGS rate
ebitda = net revenue
         + recurring operating other income
         − cogs
         − labour including on-costs
         − ordinary operating other costs
wage rate = labour / net revenue
COGS rate = cogs / net revenue
```

No fixed/variable percentage is shown, matching Scott's July instruction. UI labels may say `Profit`; calculation and storage names should say `ebitda`.

### Worked example

Assume:

- GST-inclusive fully taxable till takings: `$11,000`
- COGS rate: `30%`
- labour including on-costs: `$2,500`
- other costs: `$2,000`

Then:

```text
GST                         $1,000
Revenue excluding GST      $10,000
COGS at 30%                 $3,000
Labour                      $2,500
Other costs                 $2,000
Profit                      $2,500
```

The current formula calculates COGS as 30% of `$11,000` after separately removing GST, producing `$3,300` COGS and `$2,200` profit. That is a `$300` understatement caused by using two different revenue bases.

## Audit of the current implementation

| Area | Current behaviour | Group 0 finding |
|---|---|---|
| Core profit | Net revenue is `rev / 1.1`, but COGS is `rate × rev` in [`lib/profit.ts`](../../lib/profit.ts#L40) | COGS is applied to GST-inclusive revenue while the supplied rate is based on GST-exclusive revenue. |
| EBITDA boundary | The current model has only revenue, COGS, labour, and `fix` | It cannot represent recurring operating other income separately or prove that depreciation, amortisation, interest, tax, and exceptional items were excluded from an extracted baseline. |
| Result certainty | The current result has no source/certainty contract | A planned roster, unapproved timesheet, and approved timesheet could all appear as the same `Profit` even though they have different reliability. |
| Setup revenue help | Says "before GST and costs" in [`app/setup/page.tsx`](../../app/setup/page.tsx#L43) | An operator cannot tell whether to enter till takings including GST or P&L revenue excluding GST. |
| Setup COGS help | Says only "percentage of revenue" in [`app/setup/page.tsx`](../../app/setup/page.tsx#L67) | It must say percentage of revenue excluding GST, or hide the accounting language once derived from a P&L. |
| Labour definition | Says roster total and "including your own wage if that applies" in [`app/setup/page.tsx`](../../app/setup/page.tsx#L54) | It does not tell the operator to include superannuation and other on-costs, contrary to Scott's written definition. |
| Other costs | UI examples are rent, power, insurance and subscriptions in [`app/setup/page.tsx`](../../app/setup/page.tsx#L79) | Directionally correct, but too incomplete to support manual equivalence with an extracted P&L. |
| Suggested wage percentage | Uses `labour / rev` in [`lib/profit.ts`](../../lib/profit.ts#L94) | This is a gross-revenue percentage and conflicts with Scott's net-revenue instruction. |
| Full Numbers wages | Uses wages divided by `revenue / 1.1` in [`app/app/page.tsx`](../../app/app/page.tsx#L1314) | This readout follows Scott's net-revenue rule. |
| Full Numbers COGS | Labels COGS as "of gross revenue" in [`app/app/page.tsx`](../../app/app/page.tsx#L1442) | The label and calculation conflict with Scott's July instruction and the sample P&Ls. |
| Daily ledger | Allocates planned labour and other costs using predicted revenue share in [`lib/profit.ts`](../../lib/profit.ts#L219) | This matches Scott's stated temporary allocation rule. |
| Daily actual | Uses actual revenue/labour when present, but the values are seeded demo data | The math path exists, but the product still lacks a real source or honest estimate label. |
| Future Full Numbers | Totals only completed actual rows | A future period becomes `$0 Actual profit`; it must be framed as forecast, not actual. |
| What If defaults | Starts with a `−$62/day` wage change in [`app/app/page.tsx`](../../app/app/page.tsx#L94) | A sandbox must start at zero adjustment. |
| What If hours | Divides wage change by hard-coded `$31` in [`app/app/page.tsx`](../../app/app/page.tsx#L1086) | Hours cannot be truthful without a venue-specific loaded hourly cost. |
| What If periods | Dollar adjustments are interpreted per day for revenue/wages and per week for other costs in [`app/app/page.tsx`](../../app/app/page.tsx#L1892) | The units are not explicit enough for day, week, month, and custom ranges. |
| Tests | No project test runner or financial unit tests are configured in [`package.json`](../../package.json) | Formula changes currently have no automated protection. |

## What the five P&L samples add

All five samples are GST-exclusive, but they deliberately vary in structure:

- annual, quarterly, and monthly reporting periods;
- comparative-year, single-period, and current-month-plus-YTD columns;
- different names and groupings for wages and employment costs;
- different presentations of other income, finance costs, depreciation, amortisation, and income tax.

The most important Group 0 cases are:

1. [Cafe](../P%20and%20Ls/PL_01_Cafe_LumenLane_FY2025.pdf): wages, superannuation, workers compensation, training, depreciation, other income, and loan interest all appear separately.
2. [Hairdresser](../P%20and%20Ls/PL_02_Hairdresser_HaloAndCo_Q3_FY2025.pdf): contractor/chair-rental cost is ambiguous and must be confirmed rather than guessed.
3. [Book retailer](../P%20and%20Ls/PL_03_BookRetailer_MarrowAndVine_FY2025.pdf): includes inventory movements, supplier rebates, finance costs, and a loss.
4. [Small bar](../P%20and%20Ls/PL_04_SmallBar_CopperSparrow_May2026.pdf): month and YTD sit side by side; wages explicitly exclude superannuation.
5. [Restaurant](../P%20and%20Ls/PL_05_Restaurant_SaltbushAndPepper_FY2025.pdf): separately groups employment expenses and includes depreciation, amortisation, finance costs, profit before tax, and profit after tax.

These variations are why the AI must propose classifications and show them to the operator. A hidden "AI knows accounting" step is not safe enough.

## Decisions received and remaining implementation questions

### Decisions received from Scott on 28 July

1. `Profit` means the Little Birdee EBITDA snapshot.
2. Include recurring operating other income, such as supplier rebates.
3. Exclude tax, depreciation, amortisation, interest, principal repayments, owner drawings, and exceptional items.
4. Use simple GST onboarding: ask whether entered sales include or exclude GST.
5. Mixed-sales businesses must provide GST-exclusive revenue.
6. Use a hybrid journey: manual revenue is valid, but linking rostering software is the first integration priority.
7. Do not ask users for manual actual labour in the initial journey.

### Product-owner decisions already recorded

1. A What If dollar adjustment applies to the whole selected period.
2. What If starts with zero adjustment and uses the selected period's labour amount.
3. `Month` means calendar month.
4. Deputy is a separate Group 7 and does not block the manual MVP.
5. Production P&L upload/OCR/AI extraction remains Group 2 but moves to the end of the queue.
6. The launch baseline is entered manually and must carry the same provenance, period, confirmation, and version semantics as a future extracted baseline.

### Items to resolve through engineering and validation, not another general Scott email

1. **Manual recurring income:** Setup must ask explicitly about recurring operating income; it cannot silently assume zero for businesses with rebates or similar recurring income.
2. **Manual assumption versioning:** define effective dates, confirmation, correction, and whether a changed COGS or other-cost value applies only to future unlocked plans.
3. **P&L classification:** an accountant should validate the inclusion/exclusion mapping, while the operator confirms ambiguous accounts and whether other income is genuinely recurring.
4. **All-zero allocation:** define how real weekly labour and other costs are allocated when every forecast-revenue day is zero so costs never disappear.
5. **Loaded hourly cost:** the hours view in What If needs a venue-specific loaded rate or should remain hidden; it cannot use the demo's universal `$31`.

Deputy cost-state, on-cost, cutoff, and late-edit questions move together to Group 7 and no longer block Group 0 or the manual launch flow.

## Questions not to send Scott again

Avoid reopening these unless Scott changes direction:

- Should wages include on-costs? **Yes.**
- Are wages and COGS percentages based on net revenue excluding GST? **Yes.**
- Should F+V show a percentage? **No.**
- Does COGS use a historical rate from the P&L? **Yes.**
- Do COGS dollars change when revenue changes? **Yes; the rate is what stays fixed.**
- Are weekly labour and other costs initially allocated by forecast-revenue share? **Yes.**
- Does P&L upload remain the future alternative to Xero/MYOB integration? **Yes, but it is no longer required for the first manual release.**
- Should What If alter saved reports? **No.**
- Is Little Birdee a cash-flow product? **No; it is an EBITDA snapshot.**
- Are depreciation, amortisation, interest, income tax, principal repayments, drawings, or exceptional items included? **No.**
- Is recurring operating other income included? **Yes.**
- Must actual revenue always come from a POS? **No; manual actual revenue is an intentional launch path.**
- Is POS the first integration priority? **No; rostering is the first priority because actual labour is harder to enter manually.**
- Does simple GST onboarding add recurring tax fields? **No.**

## Accountant validation request

Send the approved contract—not the whole codebase—to an Australian accountant or experienced management bookkeeper:

> Please validate Little Birdee's EBITDA-snapshot calculation and P&L account-classification policy. The result is GST-exclusive revenue plus recurring operating other income, minus COGS, labour including on-costs, and ordinary operating other costs. It excludes depreciation, amortisation, interest, income tax, exceptional items, owner drawings, and loan principal. Please confirm that supplier rebates and similar recurring operating income are handled consistently, flag ambiguous account categories, and identify any wording that could materially mislead an Australian small-business operator. The interface may call the result Profit but will disclose that it is an EBITDA snapshot, not cash flow or statutory profit.

This is a one-time professional review of the product contract. It is not a request for the accountant to redesign the app.

ASIC treats measures presented outside accounting standards as non-IFRS financial information and emphasises clear, non-misleading disclosure in [Regulatory Guide 230](https://asic.gov.au/regulatory-resources/find-a-document/regulatory-guides/rg-230-disclosing-non-ifrs-financial-information/). That is why Little Birdee should define its EBITDA snapshot explicitly instead of assuming every accountant or P&L uses an identical EBITDA boundary.

## Implementation status — 28 July 2026

Implemented:

- canonical integer-cent money, basis-point rates, GST-registration, revenue-basis, source, status, date-range, baseline, scenario, and EBITDA records in [`lib/finance/types.ts`](../../lib/finance/types.ts);
- GST normalisation with explicit rejection of unsafe mixed-sales GST-inclusive input in [`lib/finance/revenue.ts`](../../lib/finance/revenue.ts);
- COGS-on-GST-exclusive-revenue, EBITDA, and break-even calculations in [`lib/finance/ebitda.ts`](../../lib/finance/ebitda.ts);
- exact-cent allocation with an explicit all-zero fallback in [`lib/finance/allocation.ts`](../../lib/finance/allocation.ts);
- exact inclusive-day and calendar-month scaling in [`lib/finance/period.ts`](../../lib/finance/period.ts);
- whole-selected-period What If transformations in [`lib/finance/scenario.ts`](../../lib/finance/scenario.ts);
- Scott's EBITDA inclusion/exclusion map and operator-confirmation retention in [`lib/finance/classification.ts`](../../lib/finance/classification.ts);
- confirmed P&L-baseline scaling that remains honestly estimated in [`lib/finance/baseline.ts`](../../lib/finance/baseline.ts);
- day-to-period aggregation and forecast/projected/estimated result presentation in [`lib/finance/aggregate.ts`](../../lib/finance/aggregate.ts) and [`lib/finance/presentation.ts`](../../lib/finance/presentation.ts);
- provider-neutral POS and rostering boundaries in [`lib/finance/providers.ts`](../../lib/finance/providers.ts);
- an explicit temporary bridge from the legacy demo `Week` model in [`lib/finance/legacy-week.ts`](../../lib/finance/legacy-week.ts);
- the legacy screen adapter in [`lib/profit.ts`](../../lib/profit.ts) now delegates EBITDA, GST, COGS, break-even, allocation, status, and period calculations to the canonical engine;
- Setup now records GST registration and whether entered revenue includes or excludes GST;
- Dashboard, What Happened, What If, and Full Numbers now use GST-basis-aware EBITDA calculations, start scenarios at zero, apply adjustments once to the selected period, and distinguish forecast from estimated results;
- Full Numbers shows the source, certainty, and last-updated state for every calculation component, including explicit `Demo data`, `No live sync`, and `No live timestamp` disclosures where appropriate;
- [`ground_truth.json`](../P%20and%20Ls/ground_truth.json) now contains selected-column rules, exact period days, COGS rates, account-level EBITDA classifications, operator-confirmation warnings, weekly baselines, exact source EBITDA, and rate-based estimated EBITDA for all five supplied P&Ls;
- 21 P&L golden checks verify source files, classification totals, exact-day scaling, manual/extracted equivalence, rate-rounding behaviour, and blocking of ambiguous classifications;
- Vitest commands and 67 passing financial contract, golden-sample, and screen-adapter tests across eleven test files.

Verified:

- `npm test`: 11 test files and 67 tests passed;
- `npx tsc --noEmit`: passed;
- `npm run build`: production build passed.
- Browser verification: GST registration/basis controls, estimate disclosure, expanded EBITDA rows, component provenance, period-scoped What If, future-period forecast labels, and a 390px mobile viewport passed with no browser console errors or horizontal overflow.

External financial-contract check not yet completed:

- accountant validation of the classification contract.

The removal of browser-local demo storage belongs to Group 1. Deputy proof and production integration belong to Group 7. The production P&L upload/extractor that consumes the completed golden oracle remains Group 2 but is parked at the end of the queue. Manual configuration must first prove the complete setup-to-reporting loop.

### Golden-sample findings that must remain visible

- Four of the five sample P&Ls contain at least one classification that needs operator confirmation. Only the Small Bar sample can produce a confirmed baseline without a classification warning.
- Ambiguous examples include contractor/chair-rental costs, staff training and amenities, inventory write-offs, recruitment and uniforms, and mixed sundry-income/supplier-rebate lines.
- Exact P&L COGS dollars and a COGS percentage rounded to `0.01%` do not reconstruct the same annual EBITDA to the cent. The oracle therefore preserves both exact source-period EBITDA and the rate-based estimated EBITDA used for future periods.
- A warning-bearing extraction cannot become a live baseline until its classifications are confirmed.

## Dependency-safe implementation sequence

### 0A. Freeze the contract and vocabulary

**Engineering status:** Implemented. Accountant validation remains a release gate.

1. Treat this document and Scott's 28 July response as the product-policy source.
2. Use `ebitda` internally and `Profit` only as an operator-facing label with an EBITDA explanation.
3. Record money in integer cents, periods with inclusive dates, and venue timezone explicitly.
4. Have the one-page calculation and classification policy accountant-validated. Engineering can build types and tests while that review is arranged, but do not ship the P&L classifier before it passes.

### 0B. Replace ambiguous data shapes

**Engineering status:** Canonical records and provider contracts implemented. Existing screens still load the temporary `Week` storage shape, but its financial calculations now delegate to the canonical engine. Canonical persisted records remain for Group 1.

1. Replace `Week.rev/lab/fix/cogs` with basis-aware records for revenue, COGS, labour, other costs, and recurring operating other income.
2. Give every actual or estimate a source, source state, covered period, and last-updated time.
3. Define provider-neutral contracts before building Deputy or POS-specific code.

### 0C. Build one pure financial engine and tests

**Engineering status:** Implemented. The core engine and all 67 unit, integration, and golden-sample checks pass.

1. Implement GST normalisation, COGS, EBITDA, break-even, period scaling, allocation, What If, and result certainty outside React.
2. Add the minimum test matrix below before changing UI outputs.
3. Add P&L golden tests using all five samples and an expanded [`ground_truth.json`](../P%20and%20Ls/ground_truth.json).

Recommended boundary:

```text
lib/finance/types.ts          canonical records and source states
lib/finance/revenue.ts        GST and input-basis normalisation
lib/finance/ebitda.ts         period EBITDA, rates, and break-even
lib/finance/allocation.ts     weekly-to-daily allocation
lib/finance/scenario.ts       What If transformations
lib/finance/aggregate.ts      day/week/month/custom aggregation
lib/finance/index.ts          public API consumed by screens
lib/finance/*.test.ts         pure unit and reconciliation tests
```

Vitest is now configured through `npm test`. Keep the existing [`lib/profit.ts`](../../lib/profit.ts) temporarily during migration, using [`lib/finance/legacy-week.ts`](../../lib/finance/legacy-week.ts) as the explicit conversion boundary. Remove the demo storage and duplicated formulas after all consumers move.

### 0D. Preserve later integration boundaries without blocking the manual launch

**Status:** Implemented at the financial-contract level. Deputy proof and connection work moved to Group 7.

1. Keep the provider-neutral labour contract and source states.
2. Use allocated weekly planned labour as the launch fallback and label it estimated.
3. Allow a future scheduled, worked, or approved provider value to replace the allocation for an individual day.
4. Keep connection UI, OAuth, tokens, venue mapping, sync, cost-state validation, and late-edit handling outside Group 0.
5. Do not let the landing page or Chirp imply actual labour before Group 7 is connected and fresh.

### 0E. Migrate existing screens together

**Status:** Implemented and verified. Full Numbers now shows component source, certainty, and timestamp availability. Replacement of browser-local demo inputs belongs to Group 1 and the live-data groups.

Migrate Setup, Dashboard, What Happened, What If, and Full Numbers to the same engine in one coordinated change. This prevents each screen from preserving a different definition of revenue or Profit.

Required UI changes include:

- ask GST registration and manual revenue basis separately;
- remove the global `/ 1.1` assumption;
- label planned/allocated labour results as estimated;
- remove the What If demo adjustment and hard-coded `$31`;
- use whole-selected-period What If adjustments;
- treat Month as calendar month;
- stop presenting future `$0` rows as Actual;
- show each component and its source in `How calculated`.

## Minimum calculation test matrix

The Group 0 implementation is not complete until tests cover:

- GST-exclusive manual revenue;
- GST-inclusive fully taxable revenue;
- non-GST-registered revenue;
- the approved mixed/GST-free behaviour;
- COGS applied to net revenue;
- wages and COGS percentages against net revenue;
- labour including on-costs;
- recurring operating other income included;
- depreciation, amortisation, interest, tax, principal, drawings, and exceptional items excluded;
- exact-day normalisation for 7-day, monthly, quarterly, annual, and leap-year periods;
- day allocations summing back to the weekly totals;
- a closed day with zero forecast revenue;
- an all-zero-revenue week without dropping real weekly costs;
- actual revenue changing COGS dollars but not the COGS rate;
- actual labour replacing allocated labour;
- missing actual labour producing an estimated, not falsely actual, result;
- scheduled labour producing an estimate;
- worked but unapproved labour producing a provisional result;
- approved labour producing a confirmed result;
- component source and last-updated timestamps surviving aggregation;
- past, current, and future periods;
- What If starting with zero change and inheriting the selected scope;
- dollar and percentage scenarios across day, week, month, and custom ranges;
- break-even reconciling to exactly zero profit;
- extracted and manually entered economically equivalent inputs producing the same result.
