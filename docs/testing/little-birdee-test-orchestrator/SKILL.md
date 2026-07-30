---
name: little-birdee-test-orchestrator
description: Orchestrate Little Birdee group-based user acceptance testing with browser-enabled sub-agents, responsive UI checks, logic verification, evidence capture, defect repair, retesting, and workbook reporting. Use when asked to test, retest, accept, sign off, or continue testing Group 0 through Group 7, or when maintaining the project testing pipeline.
---

# Little Birdee Test Orchestrator

Coordinate tests; do not personally perform the browser test matrix.

## Start

1. Resolve the active repository. Use `C:\Users\User\Desktop\Apex\Little Birdie`; never use the retired D: or F: checkouts.
2. Read `docs/testing/groups/group-<n>.yaml`.
3. Read every file listed under `uat_spec`, `requirements_sources`, and `design_sources`.
4. Read the canonical results workbook and its deferred/manual register.
5. Read the relevant reference below:
   - execution: `references/orchestration-protocol.md`
   - browser and viewports: `references/browser-testing-standard.md`
   - repairs: `references/defect-and-retest-policy.md`
   - reporting: `references/results-workbook-contract.md`
   - repository routing: `references/project-map.md`

If the group has no approved UAT specification, create a draft test specification from its manifest and requirements. Do not claim acceptance until that specification is approved.

## Delegate

Spawn browser-enabled sub-agents with bounded, non-overlapping assignments:

- logic and journey checks;
- desktop and medium UI inspection;
- mobile and short-mobile UI inspection.

Every testing sub-agent must read the Chrome browser-control skill and use the Chrome connector. Give it explicit test IDs, URLs, preconditions, permitted mutations, viewport sizes, expected behavior, and the result schema from `docs/testing/templates/SUBAGENT_ASSIGNMENT.md`.

Only one sub-agent may mutate authentication, selected venue, onboarding, or financial records at a time. Run read-only viewport inspections concurrently only after the required state is stable.

## Judge

For every test ID, evaluate both:

- logic: state, navigation, calculations, persistence, isolation, errors, and network behavior;
- interface: hierarchy, clipping, overflow, spacing, copy, controls, focus, and established Little Birdee visual patterns.

Use `PASS`, `FAIL`, `BLOCKED`, `DEFERRED`, or `NOT RUN`. Do not treat a deferred external/manual check as a failure.

## Repair

When a confirmed defect is within scope, the orchestrator may make the smallest code change that restores the intended behavior. Preserve the established product structure, copy hierarchy, components, tokens, typography, spacing language, mascot treatment, and responsive patterns. Do not redesign, add new features, or resolve product-policy questions by assumption.

After a repair:

1. run proportionate automated validation;
2. restart the verified C-drive development server if required;
3. delegate the failed test and adjacent regression checks again;
4. record before/after evidence and the affected files.

## Record

Sub-agents return structured findings; they do not edit the shared workbook. The orchestrator consolidates results into the group’s canonical workbook using the spreadsheet skill and preserves its existing style.

Finish with:

- result counts;
- defects and repair status;
- deferred/manual items;
- blockers;
- exact next batch;
- workbook and evidence locations;
- whether the group is accepted, accepted with recorded deferrals, or not accepted.

