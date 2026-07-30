# Scott Requirements Implementation Audit

**Date:** 27 July 2026  
**Scope:** Little Birdee product application, with emphasis on Dashboard, What If, What Happened, See Full Numbers, and the foundations required to make those screens real.  
**Status:** Current implementation audit and approved dependency-aware delivery plan. Group 0 product-owner testing was accepted with recorded later-group gaps on 28 July; the external accountant check remains pending. This is not a claim that the current local worktree has been released.

## Executive conclusion

The current Dashboard, What Happened, What If, and See Full Numbers screens substantially match the user-interface direction Scott approved on 20 July, and their calculations now delegate to the tested Group 0 financial contract. Group 1 authentication, tenant ownership, multi-venue selection, and current-plan persistence are now in place. Setup and the current-period reporting screens use the selected venue's Supabase records; the last-week, month, and custom history adapters remain demo-backed pending the reporting-data pass.

The larger blocker is now the incomplete manual operating loop: recurring-income entry, daily revenue, hybrid planned-labour estimates, corrections, and stored historical reporting. P&L ingestion and Deputy no longer block that first usable loop.

Scott's 27 July direction changes the accounting-data strategy:

> "We might be able to create a little bit of AI software... a P&L can come in the form of a 7-day P&L or a month-long P&L or a quarter or a year."  
> "The business owner or the accountant can upload into Little Bernie a P&L that just spits out those two numbers."

Sources: [27 July meeting, accounting approach](../meetings/07-27-2026.txt#L141), [upload and two outputs](../meetings/07-27-2026.txt#L143)

Therefore:

- Do **not** prioritize separate Xero, MYOB, or other accounting APIs for the first implementation.
- Establish the full manual configuration and reporting loop before building P&L upload/OCR/AI extraction.
- Keep the future P&L path source-neutral so confirmed extracted values write the same venue-assumption records as manual values.
- A historical P&L establishes COGS and other-cost baselines but does not provide yesterday's operational revenue or labour.
- Support manual daily revenue as the initial proof-of-value path.
- Allocate weekly planned labour across days for launch and label the result estimated.
- Treat Deputy as a separate Group 7 rather than a Group 0 or manual-MVP gate.
- Keep all future POS and rostering connectors provider-specific.

Scott's 28 July answer was:

> "it will have to be a hybrid of B and C – with the focus being on linking rostering software as a priority and then the POS (also important) but much easier to enter manually"

Source: [Scott financial-contract email response](../Meetings/07-28-2026-scott-financial-contract-email-response.md#1-what-birdee-knows-when-it-chirps)

## Approved sequencing decisions - 28 July

These decisions now govern the implementation groups and supersede the earlier queue:

1. **Manual workflow first.** Little Birdee will first prove a complete setup-to-reporting loop using manually entered forecast revenue, weekly planned labour, COGS rate, weekly other operating costs, optional recurring operating income, and daily actual revenue.
2. **Allocated labour at launch.** Weekly planned labour is allocated across the locked week using each day's locked forecast-revenue share. It remains an estimate and cannot be presented as actual labour.
3. **Deputy is Group 7.** Deputy proof, OAuth, tokens, venue mapping, cost-state selection, synchronization, correction handling, and connection UI form a separate non-blocking integration group.
4. **P&L ingestion is parked Group 2.** Production upload, OCR, AI classification, review, and extraction move to the end of the current queue because they are costly and unpredictable. The five-sample oracle and financial-classification work remain preserved for that later group.
5. **One financial-record architecture.** Manual Setup and a future confirmed P&L extraction must write the same source-neutral, versioned venue-assumption records. Calculations and reporting may disclose provenance but must not fork into manual and imported formula paths.
6. **Honest product claims.** Until connected sources exist, reports and Chirps say `Estimated EBITDA`, identify allocated labour and manual assumptions, suppress actual-labour variance claims, and never imply that Birdee automatically knows complete yesterday results.
7. **Historical stability.** Weekly plans and daily allocations are locked/versioned so changing assumptions later affects future unlocked periods without silently rewriting historical budgets or results.

## Sources reviewed

### Scott's requirements

- [24 June meeting](../meetings/06-24-2026.txt)
- [25 June meeting](../meetings/06-25-2026.txt)
- [29 June meeting](../meetings/06-29-2026.txt)
- [14 July meeting](../meetings/07-14-2026.txt)
- [20 July meeting](../meetings/07-20-2026.txt)
- [22 July brand feedback](<../meetings/07-22-2026 brand identity feedback.txt>)
- [27 July meeting](../meetings/07-27-2026.txt)
- [28 July financial-contract email response](../Meetings/07-28-2026-scott-financial-contract-email-response.md)

### Current implementation

- [Dashboard and child views](../../app/app/page.tsx)
- [Profit and period calculations](../../lib/profit.ts)
- [Number entry](../../app/setup/page.tsx)
- [First-run home](../../app/home/page.tsx)

### Scott's P&L samples

- [Ground truth](<../P and Ls/ground_truth.json>)
- [Cafe - annual](<../P and Ls/PL_01_Cafe_LumenLane_FY2025.pdf>)
- [Hairdresser - quarter](<../P and Ls/PL_02_Hairdresser_HaloAndCo_Q3_FY2025.pdf>)
- [Book retailer - annual](<../P and Ls/PL_03_BookRetailer_MarrowAndVine_FY2025.pdf>)
- [Small bar - month and YTD](<../P and Ls/PL_04_SmallBar_CopperSparrow_May2026.pdf>)
- [Restaurant - annual](<../P and Ls/PL_05_Restaurant_SaltbushAndPepper_FY2025.pdf>)

The five PDFs are two-page, GST-exclusive Australian P&Ls. Together they exercise different business types, report periods, layouts, account names, comparison columns, percentage columns, notes, and profit outcomes.

## P&L sample implications

| Sample | Period | Comparison structure | COGS / GST-exclusive revenue |
|---|---|---|---:|
| Cafe | Annual | Current year and prior year | 34.65% |
| Hairdresser | Quarter | Current period only; includes `% of income` | 21.75% |
| Book retailer | Annual | Current, prior, and variance columns | 58.02% |
| Small bar | Month | Current month and YTD columns | 32.54% |
| Restaurant | Annual | Current year and prior year; notes and tax | 35.01% |

### Decisions preserved for the parked extractor

1. **Revenue and GST basis**

   All five sample P&Ls state that amounts are GST-exclusive. The current app treats `Week.rev` as GST-inclusive because it calculates net revenue as `rev / 1.1`, while it applies the COGS percentage directly to gross revenue: [current formula](../../lib/profit.ts#L40).

   A COGS rate extracted as `P&L COGS / P&L GST-exclusive revenue` cannot be applied directly to GST-inclusive revenue without changing its meaning. The product must choose one canonical basis:

   - Recommended: store and calculate with GST-exclusive revenue internally, while allowing the entry UI to accept GST-inclusive takings and convert once at the boundary.
   - Alternative: retain GST-inclusive revenue internally but convert the extracted P&L COGS rate before use.

   This decision changes profit, break-even, percentages, What If, What Happened, and Full Numbers. It must precede all of them.

2. **Labour classification**

   The samples use different labels:

   - `Wages & Salaries`
   - `Wages - Stylists`
   - `Wages - Apprentices`
   - `Wages - Bar & Floor`
   - `Wages - Kitchen`
   - `Wages - Front of House`
   - `Wages - Management & Administration`
   - `Superannuation` or `Superannuation Contributions`

   The team must decide whether Little Birdee labour includes superannuation, workers compensation, recruitment, uniforms, training, and other employment on-costs. The AI cannot infer the product policy safely if the policy has not been defined.

3. **Other fixed and variable cost classification**

   Scott described the AI as producing COGS percentage and fixed/variable costs. Total operating expenses cannot be used directly because it contains labour. The extraction must classify and subtract labour before producing the other-cost baseline.

   Decisions are also required for depreciation, amortisation, finance costs, income tax, other income, and exceptional or non-operating items.

4. **Period normalisation**

   The sample set contains monthly, quarterly, and annual reports. The app needs a weekly other-cost baseline.

   Recommended rule: normalise using the exact inclusive period dates (`period amount / period days * 7`) and retain the original amount, period, and calculation provenance. Do not silently divide every annual report by 52 or every month by 4.

5. **Column selection**

   The parser must distinguish:

   - Current period from comparative period.
   - Current month from YTD.
   - Actual values from variance and percentage columns.

   The Small Bar sample is the key regression case because current month and YTD appear side by side.

6. **Human confirmation**

   AI extraction should propose values, not silently commit them. The operator needs to see:

   - The selected period and GST basis.
   - Revenue and COGS totals.
   - Extracted COGS rate.
   - Labour accounts included and excluded.
   - Other-cost accounts included and excluded.
   - Normalised weekly other costs.
   - Confidence and source-page references.

### Ground-truth gap

The supplied `ground_truth.json` is a good document-extraction oracle for entity, period, totals, and profit. It is not yet sufficient as the Little Birdee product oracle because it does not contain:

- Expected COGS rate.
- Labour account classification and labour total.
- Other-cost account classification.
- Expected weekly other-cost baseline.
- Expected exclusions and warnings.
- Expected selected column when comparative or YTD values exist.

Those fields should be added before the AI pipeline is considered tested.

## Dependency-aware implementation groups

Priority is based on both user impact and dependency order. A later group should not begin in earnest until the named acceptance conditions of its prerequisite are stable.

Group numbers are retained as stable audit identifiers. The delivery queue near the end of this document is authoritative: Group 2 is now deliberately parked until the manual workflow is established, even though its original identifier is lower.

### Group 0 - Canonical financial contract and calculation tests

**Priority:** P0 - implement first  
**Why first:** Every other group consumes these definitions. Building the uploader, database, or UI before resolving them would reproduce financial rules in several places and force later migrations.

**Implementation status, 28 July:** Group 0 engineering is implemented and product-owner acceptance testing is signed off with the later-group gaps recorded in the [Group 0 UI acceptance procedures](../testing/test-cases/GROUP_0_UI_ACCEPTANCE_TEST_PROCEDURES_2026-07-28.md). The provider-neutral financial records, GST normalisation, EBITDA/break-even engine, exact-day scaling, exact-cent allocation, What If transformations, account-treatment map, P&L baseline scaling, period aggregation/presentation, provider contracts, and Vitest suite are implemented in [`lib/finance`](../../lib/finance). The temporary screen adapter in [`lib/profit.ts`](../../lib/profit.ts) and the existing Setup, Dashboard, What Happened, What If, and Full Numbers views delegate to that contract. Full Numbers exposes component source, certainty, and timestamp availability. The five-P&L oracle now includes Little Birdee account classifications, warnings, exact-period baselines, and exact versus rate-based EBITDA expectations. All 67 tests, TypeScript validation, the production build, and focused desktop/mobile browser checks pass. Australian-accountant validation remains the external Group 0 release check. Deputy is separated into Group 7, browser-local demo storage moves to Group 1, and the production P&L extractor is parked as Group 2 at the end of the queue.

**Working brief:** [Group 0 financial contract decision brief](./GROUP_0_FINANCIAL_CONTRACT_DECISION_BRIEF_2026-07-27.md)

**Scott evidence**

Scott described the core calculation as revenue, GST, COGS, labour, and fixed/variable costs producing daily net profit ([24 June meeting](../meetings/06-24-2026.txt#L225)). He later corrected break-even because COGS was being applied to the wrong revenue amount ([14 July meeting](../meetings/07-14-2026.txt#L169)). On 28 July, he resolved the profit boundary:

> "we wont include anything that doesn’t appear as an EBITDA number"

> "this is not a cashflow – it’s a snapshopt of EBITDA"

Source: [Scott financial-contract email response](../Meetings/07-28-2026-scott-financial-contract-email-response.md#2-what-is-included-in-profit)

**Implement together**

- Implement canonical GST-exclusive revenue, COGS, labour, recurring operating other-income, and other-cost semantics.
- Apply COGS and wage percentages to GST-exclusive revenue.
- Encode Scott's EBITDA inclusions and exclusions.
- Preserve employment on-cost and P&L account classifications for confirmation and audit.
- Define exact period-normalisation rules.
- Carry source and certainty states from each component into every result.
- Create shared typed financial records used by setup, extraction, storage, calculations, and reporting.
- Move EBITDA, break-even, period, What If, and variance rules behind one tested calculation module.
- Add golden tests using all five P&L samples and representative weekly/daily scenarios.

**Correct existing screen defects in this group**

- [Implemented] What If starts with zero adjustments.
- [Implemented] What If uses the selected day, week, month, or custom-period result as its baseline.
- [Implemented] Dollar adjustments apply once to the whole selected period.
- [Implemented] Next Week Full Numbers shows forecast values rather than `$0 Actual profit`.
- [Implemented] COGS and GST rows no longer praise revenue-driven reductions as cost improvements.
- [Implemented] Wage-to-hours copy only appears when a confirmed loaded hourly rate exists; the hard-coded `$31/hour` assumption is removed.

**Acceptance conditions**

- One documented financial glossary and calculation contract.
- Unit tests cover daily, weekly, monthly, custom, historical, and future periods.
- Extracted P&L values and manually entered values produce identical results when economically equivalent.
- No UI component reimplements financial formulas.
- Every Chirp and report distinguishes forecast, estimate, provisional actual, and confirmed actual from its input sources.

### Group 1 - Identity, business, venue, and financial-record persistence

**Priority:** P0 - second  
**Depends on:** Group 0 data contract  
**Why before the manual workflow:** Plans and actuals must belong to an authenticated business and venue. Establishing this ownership before replacing demo storage prevents later account, venue, and history migrations.

**Implementation status, 28 July:** Core implementation complete; live Auth/device acceptance and stored historical-period queries remain. Supabase email/password account creation, login, logout, password recovery, cookie-backed sessions, protected Setup/report routes, private Auth-trigger first-business/first-venue creation, atomic second-venue creation, and a protected venue switcher are implemented. Setup now saves selected-venue GST settings, versioned manual assumptions, a new weekly-plan version, seven exact-cent daily allocations, and the lock transition in one transaction. Dashboard, What Happened, What If, and Full Numbers load the database-backed current plan and no longer use seeded actuals for authenticated users. An old local week can prefill an unconfigured venue but becomes authoritative only after the operator explicitly completes Setup. The remote database has stable UUID-backed user, business, membership, venue, settings, source-neutral financial-assumption, versioned weekly-plan, daily-allocation, immutable actual-revision, and audit-event records. All 11 public tables have RLS; anonymous table access is revoked; authenticated privileges are operation-specific; rollback-only two-account and two-venue tests passed without leaving test data; and the Supabase security advisor reports no findings. Remaining work is real-email/device acceptance, optional staff invitation UI, and replacing the hard-coded last-week/month/custom history adapter with queries over stored plan versions and actual revisions. See the [Group 1 persistence implementation brief](./GROUP_1_PERSISTENCE_IMPLEMENTATION_BRIEF_2026-07-28.md).

**Scott evidence**

Scott identified the remaining "sign up bit and the payment bit" ([27 July meeting](../meetings/07-27-2026.txt#L42)), raised users with "multiple venues or multiple shops" ([27 July meeting](../meetings/07-27-2026.txt#L113)), and explicitly deferred "compliance... linking... and data safety" as required work ([20 July meeting](../meetings/07-20-2026.txt#L548)).

**Implement together**

- Account creation, login, logout, recovery, and sessions.
- User, organisation/business, and venue entities.
- User-to-business and user-to-venue permissions.
- Database persistence for versioned plans, actuals, history, manually configured financial assumptions, and settings.
- Source-neutral COGS-rate, other-cost, recurring-income, and labour records carrying source, certainty, source period, confirmation, and last-updated time.
- Persist a source-neutral venue-assumption model rather than the P&L-specific `HistoricalBaseline` helper; [`baselineForPeriod`](../../lib/finance/baseline.ts) remains an input adapter for future historical P&L values, not the database model.
- Immutable weekly-plan versions and locked daily allocation snapshots so later edits do not rewrite history.
- Migration away from single-browser `localStorage`: [current storage](../../lib/profit.ts#L131).
- Basic audit log for configuration, confirmation, correction, and deletion.
- Reserve stable business and venue identifiers that later Deputy, POS, and P&L-import records can reference.

Private P&L file storage, upload retention, extraction records, and AI-processing audit events move with Group 2. They should not be built speculatively in Group 1.

**Acceptance conditions**

- Data is isolated between accounts and venues.
- A user can switch venues without overwriting another venue's numbers.
- Manually entered assumptions retain their source, effective period, version, and editor.
- Locked weekly plans and their daily allocations remain historically stable.
- Refreshing, changing devices, or clearing browser storage does not lose records.

### Group 2 - P&L upload, AI extraction, review, and business baseline

**Priority:** Parked - last in the current queue  
**Depends on:** Groups 0 and 1 plus an established manual workflow in Groups 3 and 4  
**Supersedes:** First-release Xero/MYOB accounting APIs

**Sequencing decision, 28 July:** This group is valuable but costly and unpredictable because it combines file handling, layout extraction, OCR, model behaviour, accounting classification, confidence, correction, privacy, and reprocessing. Little Birdee will first prove that operators can configure COGS, weekly other costs, recurring operating income, and weekly labour manually and then use those values through a complete reporting loop. Group 2 remains designed, tested against the five-sample oracle, and intentionally parked until that manual flow is stable.

**Architecture rule while parked:** Manual configuration and future extraction must write the same canonical venue-assumption records. The downstream calculation and reporting code may branch on provenance for disclosure, but it must never branch on whether a value originated in Setup or an uploaded P&L. A confirmed extraction will therefore replace or version manual assumptions; it will not create a second calculation path.

The current [`baselineForPeriod`](../../lib/finance/baseline.ts) helper deliberately labels its output as `pnl`; it is safe to retain as a future Group 2 adapter, but it must not become the persisted source-neutral assumption schema used by the manual workflow.

**Scott evidence**

Scott said the AI should analyse a P&L to generate "two things": amortised fixed/variable costs and historical COGS percentage ([27 July meeting](../meetings/07-27-2026.txt#L153)). He called the engine "really really important" and described it as something that "chews up P&L and spits out the numbers that we need" ([27 July meeting](../meetings/07-27-2026.txt#L177)).

**Implement together**

- PDF upload and validation.
- Text/layout extraction with OCR fallback for scanned files.
- AI classification into revenue, COGS, labour, and other costs.
- Current/comparative/YTD column selection.
- Period and GST-basis detection.
- Exact-date weekly normalisation.
- Confidence and source-page provenance for every proposed value.
- User review and correction screen.
- Confirmation that writes the COGS rate and weekly other-cost baseline to the selected venue.
- Confirmation that also writes recurring operating income and retains the source period, included/excluded accounts, confidence, and operator corrections.
- Reprocessing and versioning when a corrected model or taxonomy is deployed.
- Golden tests against all five PDFs.
- Private upload storage, access control, retention, deletion, and AI-processing audit events deferred from Group 1.

**Do not include in the first version**

- Separate Xero and MYOB accounting APIs.
- Silent auto-acceptance of low-confidence classifications.
- General bookkeeping, tax advice, or complete accounting automation.

**Acceptance conditions**

- All five samples select the correct period and value column.
- All five match expanded Little Birdee ground truth.
- The operator can see and correct every included/excluded account.
- Confirmation produces the same calculation inputs as manual entry.
- Failed or ambiguous extraction never changes live reporting values.
- Replacing a manual assumption with a confirmed extraction creates a versioned change and never rewrites locked historical weeks.

### Group 3 - Weekly plan and daily actual-data workflow

**Priority:** P0 - third in the delivery queue  
**Depends on:** Groups 0 and 1; does not depend on Group 2  
**Why before P&L upload:** This establishes the smallest usable operator loop with understandable manual inputs. It proves the product behaviour and record model before an unpredictable extractor is allowed to write the same assumptions.

**Scott evidence**

Scott required "both options whether they put it in manually or it populates itself" ([24 June meeting](../meetings/06-24-2026.txt#L166)). On 27 July he reiterated: "Put the numbers in yourself or link to your software" ([27 July meeting](../meetings/07-27-2026.txt#L103)).

**Implement together**

- Weekly predicted revenue by day.
- Manually entered weekly planned labour, including the agreed employment on-cost boundary.
- Manually entered COGS rate based on GST-exclusive revenue.
- Manually entered weekly other operating costs.
- An explicit optional weekly recurring-operating-income amount; zero is only accepted after the operator confirms there is none.
- Manual daily actual revenue.
- Daily estimated labour allocated from the locked weekly labour plan using each day's locked forecast-revenue share.
- Week locking/versioning so changing a future plan does not rewrite historical budgets.
- Manual-source, missing-day, estimate, and correction states.

**Launch labour decision, 28 July**

Scott noted that users can enter daily revenue but may not know daily labour ([27 July meeting](../meetings/07-27-2026.txt#L109)). The initial product will use the temporary rule he described on 24 June:

```text
day share = locked day forecast revenue / locked week forecast revenue
day labour estimate = locked weekly planned labour × day share
```

The allocated amount is an estimate, not actual labour. If every forecast weight is zero, the total must be preserved using an explicit fallback across the venue's declared trading days. A later Deputy value may replace the estimate for an individual day through the existing provider boundary.

**Acceptance conditions**

- A real operator can complete one week without seeded data.
- Past-day actuals and future-day budgets coexist without being overwritten.
- Missing actuals are visibly unknown, not treated as zero.
- Historical budget-versus-actual remains stable after later plan changes.
- Daily allocated labour reconciles exactly, to the cent, to the locked weekly labour total.
- Full Numbers identifies COGS, other costs, recurring income, and labour as manually entered or allocated estimates.
- What Happened does not invent an actual-labour variance or labour-driven explanation.

### Group 4 - Reporting screens wired to real records

**Priority:** P1 - fourth in the delivery queue  
**Depends on:** Groups 0, 1, and 3; Group 2 is not required  
**Why after real data:** Rebuilding dashboard states before the period model and actual-data rules are stable would duplicate loading, empty, correction, and history logic.

**Scott evidence**

Scott said most users would look for about 15 seconds, asking "How much money did I make? Am I in budget?" ([14 July meeting](../meetings/07-14-2026.txt#L39)). He defined What Happened as the analysis breaking down what happened and What If as applying to any selected screen or period ([20 July meeting](../meetings/07-20-2026.txt#L95)).

**Preserve**

- Profit-first hierarchy.
- Revenue/Budget/Week framing.
- Adjacent What Happened and What If actions.
- Day-by-day budget performance.
- Birdee's supportive information-state reactions.
- Progressive disclosure into explanations and full numbers.

**Implement together**

- Replace demo period builders and seeded actuals with repository-backed queries.
- Correct period semantics across Dashboard, What Happened, What If, and Full Numbers.
- Add explicit loading, no-data, incomplete-day, manual-source, estimated-labour, and corrected-data states.
- Add monthly/custom trend analysis for revenue, COGS rate, and other costs; defer actual-labour trends until a real labour source exists.
- Surface consistent multi-week revenue patterns. Scott's example of labour repeatedly over budget ([24 June meeting](../meetings/06-24-2026.txt#L332)) is unavailable while daily labour is allocated from the plan and must not be fabricated.
- Verify mobile "15-second" comprehension with real incomplete and negative data.

**Acceptance conditions**

- The same period means the same records and baseline in every child screen.
- Future periods never present `$0 actual` as a completed result.
- What Happened reconciles exactly to Full Numbers.
- What If always begins at the selected result and never mutates saved reports.
- Month/custom views explain both aggregate variance and repeated trends.

### Group 5 - Privacy, compliance, billing, and account controls

**Priority:** P1 - fifth in the delivery queue, before paid launch  
**Depends on:** Group 1; can progress alongside Groups 3 and 4

**Scott evidence**

Scott asked for a "compliance and privacy piece" ([27 July meeting](../meetings/07-27-2026.txt#L26)), fixed the price at `$12 a week` with no hidden upsell ([27 July meeting](../meetings/07-27-2026.txt#L70)), and required "no lock in contract" and "cancel whenever you like" ([27 July meeting](../meetings/07-27-2026.txt#L81)).

**Implement together**

- Privacy policy, terms, consent, and financial-information disclaimer.
- Data access/export/deletion workflow.
- Subscription creation and `$12/week` billing.
- Payment failure and grace states.
- Self-service cancellation with no lock-in.
- Account and venue deletion.
- Operational privacy/compliance checks for manually entered financial records.
- P&L-file retention and AI-processing controls move with Group 2 and must be completed before that parked group ships.

**Acceptance conditions**

- A user can understand what manual financial information is stored and how it is used.
- A user can export and delete their data.
- A user can subscribe and cancel without staff intervention.
- Product behaviour matches the landing-page promise.

### Group 6 - Scheduled Chirps

**Priority:** P2 - sixth in the delivery queue, after the manual reporting loop  
**Depends on:** Groups 1, 3, and 4  
**Why after reporting:** A notification is useful only when Yesterday contains complete, authorised manual inputs and an honestly labelled estimate.

**Scott evidence**

Scott wanted a user-selected time and frequency with a Chirp linking directly to Yesterday ([20 July meeting](../meetings/07-20-2026.txt#L465)). He accepted scheduled email as the simpler first version ([20 July meeting](../meetings/07-20-2026.txt#L514)).

**Implement together**

- Notification settings: enabled, timezone, time, and frequency.
- Scheduled email delivery first.
- Deep link to the correct venue and Yesterday period.
- Before actual revenue is entered, send only a prompt to add yesterday's revenue; do not invent a result.
- After actual revenue is entered, describe the result as estimated EBITDA using allocated planned labour and manual financial assumptions.
- Missing-data suppression or an explicit "numbers incomplete" message.
- Delivery logging, unsubscribe, and retry handling.
- PWA push only after the email workflow is proven.

**Acceptance conditions**

- The Chirp never reports seeded or partial data as final.
- The Chirp never implies automatic knowledge of yesterday's complete result while revenue or labour remains manual/allocated.
- The link opens the correct account, venue, and date.
- Timezone and unsubscribe behaviour are reliable.

### Group 7 - Deputy rostering integration

**Priority:** Separate P1 integration track; does not block the manual MVP  
**Depends on:** Groups 0, 1, and 3  
**Why separate:** OAuth, rotating tokens, installation/region storage, venue mapping, scheduled/worked/approved cost states, on-cost configuration, late timesheet changes, sync, and connection recovery form an integration subsystem. The manual product can remain useful with allocated estimated labour while this work is validated independently.

**Implement together**

- Deputy trial and consenting real-tenant proof.
- OAuth connect/callback, encrypted rotating-token storage, reconnect, and disconnect.
- Deputy installation/region and Little Birdee venue mapping.
- Scheduled roster, worked timesheet, and approved pay-return cost retrieval.
- On-cost configuration and source-state validation.
- Background sync, webhook or polling strategy, idempotency, and late-edit revisions.
- Connection status and venue-selection UI.
- Visible fallback to allocated weekly labour whenever Deputy is unlinked, incomplete, stale, or unavailable.

**Acceptance conditions**

- A venue can be linked without exposing credentials to the browser.
- Scheduled, worked, and approved labour remain distinguishable.
- Yesterday's usable labour state and freshness are known by the configured Chirp cutoff.
- Missing or stale Deputy data visibly falls back to allocated estimated labour.
- Late changes create a revision and do not silently rewrite locked history.
- Disconnecting Deputy does not break the manual workflow.

## Recommended delivery sequence

```text
0. Financial contract and calculation tests
   ↓
1. Identity, business, venue, and financial-record persistence
   ↓
3. Weekly plan and real daily actual-data workflow
   ↓
4. Existing reporting screens wired to real records
   ↓
5. Privacy, compliance, billing, and account controls
   ↓
6. Scheduled email Chirps
```

Separate non-blocking integration track after Groups 1 and 3:

```text
7. Deputy rostering integration
```

Parked until the manual loop is established and placed last in the current queue:

```text
2. P&L upload, AI extraction, review, and confirmed baseline
```

Group identifiers remain stable for audit traceability; they no longer imply queue order. Groups 1 and the policy portions of Group 5 may run in parallel after Group 0. Group 2 must not begin in earnest until manual assumptions have been used through a complete setup-to-reporting flow, and it must not ship before its private file ownership, retention, deletion, and AI-processing controls exist.

## Work explicitly deferred

- Xero and MYOB accounting APIs.
- Multiple accounting-platform-specific integrations.
- Production P&L upload/OCR/AI extraction until the manual configuration and reporting loop is established; retained as queued Group 2 rather than cancelled.
- PWA push notifications before scheduled email.
- Broad marketing/social deliverables, which are outside this product audit.
- A general accounting or tax-advice engine.

## Immediate next actions

1. Have an Australian accountant validate the already implemented EBITDA and manual-input boundary.
2. Finish Group 1's real-email/device acceptance and decide whether staff invitation UI is launch scope; replace stored historical-period queries with Group 4 if handled there.
3. Implement Group 3's remaining manual loop: recurring-income entry, daily actual revenue, and honest hybrid estimate states over the persisted weekly plan.
4. Wire Group 4 reporting to those persisted manual records and remove seeded/demo actuals.
5. Complete the paid-launch portions of Group 5 and the manual-mode Chirp behaviour in Group 6.
6. Run Group 7's Deputy proof and connector as a separate, non-blocking integration track.
7. Start Group 2 only after the manual loop is stable; make its confirmed output write the same canonical assumption records.
