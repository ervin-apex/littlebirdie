# Independent Sol review — G4A-UAT-2026-08-03-B

## Verdict

**ACCEPTED — 6 PASS, 0 FAIL, 0 BLOCKED.**

Run B closes the two required fixture/evidence blockers and all three confirmed
G4A-05 defects. No new product defect remains. This accepts the Group 4A
launch-integrity slice only; it does not claim full Group 4 historical reporting
or production sign-off for the manifest's later deferred work.

## Final decisions

| Test | Decision | Independent judgement |
|---|---|---|
| G4A-01 | PASS | Carried forward from run A. The centralized availability and direct-parameter guards were not touched by the responsive repair, and run B's excluded-week journey gives adjacent regression coverage. |
| G4A-02 | PASS | The prior included-week result is retained. Run B adds a dedicated 3–9 August saved-week fixture: direct Yesterday resolves to This week, Yesterday remains unavailable, Monday remains Monday/Today, and the state persists across the required responsive widths. |
| G4A-03 | PASS | Missing Sunday revenue now has settled 1440x900, 1024x768, 390x844, and 390x700 evidence. The hero says `Waiting for revenue`, explains the missing sales total, offers the 2 August Sunday entry action, and omits completed-result actions. |
| G4A-04 | PASS | Carried forward from run A. No completed actual was overwritten during run B, and the responsive-only repair does not change saved-revision calculations or persistence. |
| G4A-05 | PASS | At 1440x900 and 1024x768 the completed weekly dashboard scrolls to a fully reachable `See all numbers`; the selected Sunday breakdown is contained. At both mobile heights there is no settled horizontal scrollbar and the final tracking content clears the fixed dock. |
| G4A-06 | PASS | Carried forward from run A. The guarded period logic is unchanged and the excluded-week regression exposes no demo history or unsupported completed period. |

## Defect closure

1. **G4A-05-DESKTOP-VERTICAL-CONTAINMENT — RESOLVED**
   The desktop short-height rule now gives `.dashboard-view` vertical scrolling.
   Retest geometry was `816/954` client/scroll height at 1440x900 and `684/771`
   at 1024x768; retained after-scroll images show the footer action completely
   reachable.

2. **G4A-05-DESKTOP-POPOVER-CONTAINMENT — RESOLVED**
   The final stop's breakdown is constrained to its available width. At
   1440x900 its right edge (`1366.41`) remains inside the rail (`1367.41`), and
   its values, verdict, and Sunday-numbers action are visibly intact.

3. **G4A-05-MOBILE-HORIZONTAL-OVERFLOW — RESOLVED**
   The mobile dashboard now contains the x-axis and clamps the decorative hero
   shape. Settled 390x844 and 390x700 top/bottom evidence has no horizontal
   scrollbar; `See all numbers` clears the dock at both heights.

No confirmed defect remains open.

## Rejected environment and capture artifacts

- The initial Next.js `__webpack_modules__[moduleId] is not a function` overlay
  was stale local runtime/cache state. A verified server restart cleared it and
  it did not recur in any UAT journey.
- Loading-skeleton screenshots are transition captures, not product failures;
  each tested state has a settled companion image.
- The stale browser reference that prevented one venue-menu request was a
  connector action failure. Direct navigation to the same visible selection
  endpoint reached the server and produced the intended venue state.
- Generic browser-extension message-channel warnings did not originate from
  Little Birdee and did not affect the journeys.
- One mobile top frame retained a transient horizontal/framing offset, while
  its settled companion, bottom-state image, CSS containment, and measured
  geometry agree. It is not reproducible product overflow.

## Fixture notes

- Included/missing state: existing Tae's Den venue, saved week 27 July–2 August
  2026, Sunday actual absent.
- Excluded state: isolated `G4A Excluded Week` venue, saved week 3–9 August 2026.
- Completed state: existing `asdasd` venue with its saved Sunday result retained.
- No completed daily actual was overwritten. Run B created only the isolated
  excluded-week venue and its weekly setup.

## Evidence assessment

All 23 retained PNGs were visually inspected. Some refresh/top files are
skeleton or duplicate captures and screenshots do not expose the address bar;
those files are not used alone to prove a result. The settled responsive images,
Terra's returned route/geometry observations, centralized guard code, and
focused source review form a sufficient combined record. No evidence gap blocks
Group 4A acceptance.

Independent automated validation after the repair:

- `npx.cmd vitest run lib/profit.test.ts lib/persistence/daily-actual.test.ts` —
  2 files and 18 tests passed.
- `npx.cmd tsc --noEmit` — passed.
- `npm.cmd run build` — passed; all application routes compiled.

## Workbook-ready Actual / Notes

| Test | Actual | Notes |
|---|---|---|
| G4A-01 | Last Week, Next Week, Month, and Custom remain disabled and guarded unsupported periods resolve to This week without demo results. | **PASS** — retained from run A; run B provides adjacent excluded-week regression coverage. |
| G4A-02 | Included-week Yesterday remains truthful; an excluded 3–9 August week renders This week, keeps Yesterday unavailable, and never relabels Monday after direct navigation or refresh. | **PASS** — dedicated excluded-week fixture exercised at 1440x900, 1024x768, 390x844, and 390x700. |
| G4A-03 | Missing Sunday revenue shows Waiting for revenue, missing-sales explanation, and Add Sunday's revenue only; completed-result actions are absent. | **PASS** — settled evidence captured at all four required viewports and after refresh. |
| G4A-04 | The saved `777` Sunday revision remains `+$436` estimated, `+$214` budget, and `+$222` ahead across refresh and child views. | **PASS** — retained from run A; run B did not alter completed actual data or calculation code. |
| G4A-05 | Desktop weekly content and Sunday detail are reachable/contained; mobile has no settled horizontal overflow and final content clears the fixed dock. | **PASS** — all three prior G4A-05 defects passed exact affected-viewport retests. |
| G4A-06 | No Demo history, June seeded report, or unsupported completed period is reachable through launch navigation or guarded period URLs. | **PASS** — retained from run A with no regression concern. |
