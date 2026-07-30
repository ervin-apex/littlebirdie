# Little Birdee testing

This folder is the stable entry point for group-based product testing.

## Give another agent this instruction

> Read `docs/testing/little-birdee-test-orchestrator/SKILL.md` and test Group 1.

Replace `Group 1` with the required group. The orchestrator must find the group manifest, UAT procedures, requirements, prior results, and deferred checks without relying on conversation history.

## Structure

```text
docs/testing/
├── README.md
├── groups/                         # one machine-readable manifest per group
├── test-cases/                     # tester-facing UAT procedures
├── little-birdee-test-orchestrator/
│   ├── SKILL.md                    # portable orchestrator instruction
│   ├── agents/openai.yaml
│   └── references/                 # execution, browser, repair, and reporting rules
├── results/                        # canonical workbooks and result index
└── templates/                      # sub-agent and reporting contracts
```

## Non-negotiable rules

- Use only `C:\Users\User\Desktop\Apex\Little Birdie`.
- The orchestrator delegates browser execution to sub-agents.
- Every browser sub-agent uses the Chrome connector.
- Verify logic and UI at desktop, medium, mobile, and short-mobile viewports.
- Serialize mutations to shared authentication, venue, and financial state.
- Preserve the established Little Birdee look and feel when repairing defects.
- Record evidence and results in the group’s canonical workbook.
- Do not convert deferred manual/external checks into failures.

The workbook schema and status rules are defined in
`little-birdee-test-orchestrator/references/results-workbook-contract.md`.

## Current group state

| Group | State | Manifest |
|---|---|---|
| 0 | Engineering and product-owner accepted; external accountant check retained | [group-0.yaml](groups/group-0.yaml) |
| 1 | Active product-functionality acceptance | [group-1.yaml](groups/group-1.yaml) |
| 2 | Parked until the manual loop is stable | [group-2.yaml](groups/group-2.yaml) |
| 3 | Queued after Groups 0 and 1 | [group-3.yaml](groups/group-3.yaml) |
| 4 | Queued after real stored actuals | [group-4.yaml](groups/group-4.yaml) |
| 5 | Queued/parallel policy and account controls | [group-5.yaml](groups/group-5.yaml) |
| 6 | Queued scheduled Chirps | [group-6.yaml](groups/group-6.yaml) |
| 7 | Parked integration track | [group-7.yaml](groups/group-7.yaml) |
