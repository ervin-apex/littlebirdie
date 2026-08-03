# Group 4A launch-integrity test procedures

**Date:** 3 August 2026
**Scope:** Prevent demo-backed or unsupported reporting periods from appearing as real venue results before the full historical-reporting pass
**Engineering status:** Implemented; unit, TypeScript, and production-build checks pass
**Browser status:** Run `G4A-UAT-2026-08-03-B` accepted (6 PASS, 0 FAIL, 0 BLOCKED)

## Product rule

For the manual launch, a reporting period is selectable only when the dashboard
can resolve it from records already loaded for the selected venue. The app must
not substitute seeded history, a different week, or the current plan merely to
make an unsupported period look complete.

Month and Custom remain deferred by agreement. Last Week and Next Week remain
visible but disabled until their own stored-plan queries exist. Yesterday is
available only when yesterday falls inside the loaded saved week.

## Test cases

| ID | Priority | Purpose | Steps | Expected result | Current evidence |
|---|---|---|---|---|---|
| G4A-01 | P0 | Prevent seeded history from being opened | Sign in, open `/app?period=this-week`, inspect Last Week, Next Week, Month, and Custom, then attempt direct URLs for those period values. | Controls are visibly disabled. They do not open demo figures. Unsupported direct URLs resolve to This Week. | **PASS:** central controls and guarded URLs rendered This Week without demo figures. |
| G4A-02 | P0 | Keep Yesterday on the correct date | Use a plan whose week contains yesterday, then a plan whose week begins today or otherwise excludes yesterday. | Yesterday is selectable only in the first case. The app never labels Monday or another loaded day as yesterday merely because the real date is outside the loaded week. | **PASS:** included and excluded saved-week fixtures behaved truthfully at 1440x900, 1024x768, 390x844, and 390x700, including after refresh. |
| G4A-03 | P0 | Avoid inventing a result when yesterday has no revenue | Open Yesterday for a date inside the loaded week with no actual revenue revision. | Hero says `Waiting for revenue`, explains what is missing, and offers the correct daily-entry link. Profit, What Happened, What If, and Full Numbers are not presented as completed results. | **PASS:** the waiting state and correct daily-entry action were verified at all four target viewports and after refresh. |
| G4A-04 | P0 | Preserve a completed Yesterday result | Enter yesterday's revenue and return to Yesterday. | The saved result, What Happened, What If, Full Numbers, and comparison state remain available and use the saved revision. | **PASS:** controlled revenue `777` persisted and reconciled after refresh/revisit. |
| G4A-05 | P1 | Keep period navigation usable at every supported viewport | Check 1440x900, 1024x768, 390x844, and 390x700. | Disabled desktop labels do not overlap. Mobile shows the active period with arrows limited to selectable periods. No horizontal page overflow. | **PASS:** desktop content and the Sunday breakdown remain reachable and contained; settled mobile views have no horizontal overflow and clear the fixed dock. |
| G4A-06 | P0 | Remove reachable demo claims | Search the selectable reporting journey for `Demo history`, June 2026 seeded values, or completed figures not owned by the selected venue. | None are reachable through the launch navigation or a direct unsupported period URL. | **PASS:** no reachable Demo history, June 2026 seed report, or unsupported completed period. |

## Automated validation completed

- `npm.cmd test`: 16 files and 102 tests passed in the final combined validation.
- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run build`: passed with all application routes compiled.

## Acceptance boundary

Group 4A is accepted because G4A-01 through G4A-06 have responsive browser
evidence and independent review. This does not claim full Group 4 completion.
Stored Last Week queries and the deferred Month/Custom trend experience remain
later work.

The canonical run record is `docs/testing/results/GROUP_4_TEST_RESULTS.xlsx`.
Independent evidence review is retained under
`docs/testing/evidence/group-4/G4A-UAT-2026-08-03-B/sol-review.md`.
