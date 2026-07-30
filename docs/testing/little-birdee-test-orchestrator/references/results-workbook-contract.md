# Results workbook contract

The group manifest identifies the canonical workbook. Sub-agents never edit it. The orchestrator consolidates their structured results using the spreadsheet skill.

## Required result fields

- Run ID
- Agent
- Test ID
- Area
- Priority
- Result
- Device
- Viewport
- URL
- Expected
- Actual
- UI observations
- Evidence
- Console/network
- Refresh reproduction
- Severity
- Major blocker
- Account/venue
- Defect ID
- Notes

## Required defect fields

- Defect ID
- Linked tests
- Priority
- Status
- Category
- Viewports
- Reproduction
- Expected
- Actual
- Evidence
- Root cause
- Repair
- Retest
- Owner/next action

## Workbook rules

- Preserve the existing workbook’s style and sheets.
- Add a separate results/summary pair for a materially new batch.
- Retain prior failed evidence after repair; change disposition rather than deleting history.
- Record manual/external postponements as `DEFERRED`, not `PASS`, `FAIL`, or `BLOCKED`.
- Keep one `Deferred Manual` sheet for return triggers.
- Store screenshots under `docs/testing/evidence/group-<n>/<run-id>/` when evidence files are retained.
- Never store passwords, tokens, private keys, or unnecessary personal data.

## Acceptance

Report product-functionality acceptance separately from production, security, physical-device, and external-provider readiness. A group may be accepted with product-owner-approved deferrals when its manifest allows it.

