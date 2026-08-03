# Canonical testing results

| Group | Canonical result | Notes |
|---|---|---|
| 0 | Group 0 acceptance is recorded in `docs/testing/test-cases/GROUP_0_UI_ACCEPTANCE_TEST_PROCEDURES_2026-07-28.md` | Create a workbook using the results-workbook contract only if Group 0 is reopened. |
| 1 | `docs/testing/results/GROUP_1_BROWSER_TEST_RESULTS_2026-07-29.xlsx` | Main living workbook; `Manual Test Checklist` contains all 60 cases and highlights the 15 unfinished browser-capable cases in amber. `Deferred Manual` retains external/manual-only checks. |
| 1 historical | `docs/testing/results/GROUP_1_EASY_BROWSER_TEST_RESULTS_2026-07-29.xlsx` | Preserve as earlier-wave evidence; do not update. |
| 3 | `docs/testing/results/GROUP_3_TEST_RESULTS.xlsx` | Run `G3-UAT-2026-07-31-A` is not accepted: the P0 setup-draft save blocker prevents creation of a locked weekly plan. |
| 4 | `docs/testing/results/GROUP_4_TEST_RESULTS.xlsx` | Run `G4A-UAT-2026-08-03-B` is accepted: 6 PASS, 0 FAIL, 0 BLOCKED after responsive repairs, dedicated fixture retests, Terra browser execution, and independent Sol review. |
| 2 and 5–7 | The path in each group manifest | Create only when the group has an approved UAT specification, using `references/results-workbook-contract.md`. |

Sub-agents return structured findings to the orchestrator. Only the orchestrator writes the canonical workbook.
