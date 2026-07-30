# Orchestration protocol

## 1. Establish the run

1. Read the requested group manifest.
2. Confirm the C-drive worktree, base URL, current branch, dirty files, and running server.
3. Read the formal UAT specification completely.
4. Read the canonical result workbook and identify:
   - passed tests unaffected by later changes;
   - failed or blocked tests;
   - deferred/manual tests;
   - not-run tests;
   - tests invalidated by recent code changes.
5. Select the next contiguous batch using the UAT execution order.

Do not rerun everything by default. Rerun an earlier test only when its code path, shared component, data contract, or prerequisite changed.

## 2. Plan sub-agents

Use up to three testing roles:

1. **Journey/logic agent** — performs permitted state-changing steps and verifies expected logic.
2. **Desktop/medium visual agent** — inspects the stable state at `1440×900` and `1024×768`.
3. **Mobile visual agent** — inspects the stable state at `390×844` and `390×700`.

When state must be created first, run the journey agent to completion before starting the visual agents. Never let multiple agents switch venues, log in/out, or edit the same records concurrently.

## 3. Assignment contract

Build each assignment from `docs/testing/templates/SUBAGENT_ASSIGNMENT.md`. Include:

- exact test IDs and specification links;
- base URL and expected final URL;
- account/venue/test data;
- whether mutation is permitted;
- viewport(s);
- required logic assertions;
- required UI assertions;
- stop conditions;
- response schema.

Require the sub-agent to read the Chrome browser skill fully before browser work.

## 4. Consolidate

Reject unsupported PASS claims. A PASS needs the expected result and at least one concrete observation. UI PASS needs viewport-specific evidence. A test may be `BLOCKED` by missing test data without making the group blocked.

Deduplicate defects by root cause. One shared responsive defect may affect several test IDs and viewports.

## 5. Stop conditions

Stop state-changing tests and notify the user immediately if:

- one account can access another account’s data;
- one venue save changes another venue;
- a successful save creates partial or missing financial records;
- a locked version is overwritten;
- protected data is returned while signed out;
- a private key or secret appears in the browser;
- the application cannot load its primary authenticated journey.

## 6. Repair loop

If repair is authorized by the run:

1. reproduce and record the defect;
2. identify the smallest in-scope code owner;
3. preserve unrelated work;
4. patch without redesign;
5. validate locally;
6. delegate retest of the failed case and adjacent paths;
7. update workbook status from open to resolved only after retest.

