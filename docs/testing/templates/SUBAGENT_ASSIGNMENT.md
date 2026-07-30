# Browser sub-agent assignment

## Identity

- Run ID:
- Role: Journey/logic | Desktop/medium UI | Mobile/short-mobile UI
- Group:
- Test IDs:

## Required sources

- UAT specification:
- Group manifest:
- Design/reference source:
- Prior result rows:

## Environment

- Repository: `C:\Users\User\Desktop\Apex\Little Birdie`
- Base URL: `http://localhost:3000`
- Browser: Chrome connector
- Viewport(s):
- Account/business/venue:
- Mutation allowed: Yes | No

## Preconditions

List the exact initial state and test data. Do not assume another agent has finished unless the orchestrator confirms it.

## Actions

Copy the precise steps from the UAT specification. Include navigation URLs and permitted submissions.

## Required logic assertions

- Expected route/state:
- Expected saved/restored data:
- Expected isolation/versioning:
- Expected loading/error behavior:

## Required UI assertions

- No clipping or overflow.
- No fixed-control obstruction.
- Established typography, spacing, cards, controls, and mascot treatment remain consistent.
- Menus, fields, messages, and actions remain readable and reachable.
- Capture a screenshot when visual judgment is material.

## Stop conditions

Stop immediately for cross-account data, cross-venue mutation, partial saves, overwritten locked records, unauthenticated data, exposed secrets, or a broken primary journey.

## Return format

```yaml
test_id:
result: PASS | FAIL | BLOCKED | DEFERRED | NOT_RUN
priority:
url:
viewport:
expected:
actual:
logic_observations:
ui_observations:
evidence:
console_network:
refresh_reproduces:
defect_candidate:
major_blocker:
notes:
```

