# External validation checklist - Group 0 accountant review and deferred Group 7 Deputy proof

**Status:** Group 0 awaits professional confirmation; Deputy validation moved to non-blocking Group 7  
**Purpose:** Preserve the accountant review needed for the financial contract and the real-tenant proof needed later for the separate Deputy integration.

## Gate A - Australian accountant validation

### What the accountant is validating

Little Birdee's operator-facing `Profit` is an EBITDA snapshot:

```text
GST-exclusive revenue
+ recurring operating other income
- COGS
- labour including on-costs
- ordinary operating other costs
```

The contract excludes depreciation, amortisation, financing interest, income tax, exceptional items, owner drawings, and loan-principal repayments.

### Requested answer format

Ask the accountant to reply `Yes`, `No`, or `Needs context` to each item:

1. Is the EBITDA formula above suitable for the product's stated purpose?
2. Should wages, superannuation, and workers compensation be included in labour?
3. Should recruitment, training, uniforms, staff amenities, contractors, and chair-rental costs require operator confirmation rather than automatic classification?
4. Should supplier rebates be included only when they are recurring and operating?
5. Should interest received be excluded consistently with other financing interest?
6. Should inventory write-offs be treated as COGS, an ordinary operating cost, or an exceptional item by default?
7. Is `Estimated profit - an EBITDA snapshot, not cash flow or statutory profit` sufficiently clear for an Australian small-business operator?
8. Is a historical COGS rate rounded to `0.01%` sufficiently precise for daily and weekly operational estimates?

### Evidence pack

- [Financial contract decision brief](./GROUP_0_FINANCIAL_CONTRACT_DECISION_BRIEF_2026-07-27.md)
- [Five-sample product oracle](<../P and Ls/ground_truth.json>)
- The five source P&L PDFs in [`docs/P and Ls`](<../P and Ls>)

### Pass condition

- The accountant confirms the formula and default classifications.
- Every exception is recorded as a product rule or an operator-confirmation rule.
- No ambiguous category is silently auto-accepted.

## Group 7 validation - Deputy real-tenant proof

### Access required

- A Deputy trial account or a consenting Australian business tenant.
- Permission to create test employees, shifts, timesheets, and approved pay-return records.
- Permission to create an OAuth application or otherwise test the supported Deputy API authentication flow.

A POS account is not required for this proof. The goal is specifically to determine whether Deputy can provide yesterday's usable labour cost.

### Test data required

Create one completed test day containing:

- at least two employees with different hourly rates;
- ordinary hours;
- a penalty-rate or overtime period;
- an unpaid break;
- one late timesheet edit;
- superannuation or another on-cost if the tenant exposes it;
- the tenant's `SHIFT_COST_ADDITIONAL` setting recorded.

### Compare these Deputy states

1. Scheduled roster cost before the shift.
2. Worked timesheet cost after clock-out but before approval.
3. Approved timesheet or pay-return cost.
4. The same records after a late edit.

For each state record:

- API object and field containing the cost;
- when the value becomes available;
- whether the value is scheduled, provisional, or approved;
- which penalty rates, casual loading, superannuation, workers compensation, payroll tax, or other on-costs are included;
- whether a late edit can change a previously generated Chirp.

### Pass condition

- Little Birdee can retrieve a venue/day labour amount without reading an entire payroll system.
- The cost's certainty state can be mapped to `estimated`, `provisional`, or `confirmed`.
- Included and missing on-costs are documented.
- Yesterday's value is available by the intended Chirp time.
- Late changes have an explicit refresh/correction rule.

## Decisions after the respective checks

After the accountant check:

1. freeze the confirmed account-classification policy;
2. proceed with Group 1 persistence and the manual Group 3 workflow without reopening the Group 0 calculation contract.

When Group 7 begins and the Deputy check is complete:

1. choose scheduled, worked, or approved Deputy labour as the connected Chirp source;
2. retain allocated weekly labour as the visible fallback when Deputy is unlinked or yesterday's labour is incomplete;
3. define cutoff, freshness, correction, and late-edit behaviour before presenting Deputy labour as connected data.

Production P&L upload/extraction remains parked Group 2 at the end of the queue. It is not unlocked by the Deputy check.
