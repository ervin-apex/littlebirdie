# Browser testing standard

## Required browser

Every browser-testing sub-agent must use the Chrome connector and read its complete control skill before acting. Do not substitute standalone Playwright, shell HTTP clients, Computer Use, or the in-app browser for a required Chrome journey.

## Viewport matrix

Use these default dimensions unless the group manifest overrides them:

| Class | Viewport |
|---|---|
| Desktop | `1440 × 900` |
| Medium | `1024 × 768` |
| Mobile | `390 × 844` |
| Short mobile | `390 × 700` |

Reset temporary viewport overrides before finalizing tabs.

## Logic checks

Verify the test specification’s expected:

- route and redirect;
- selected account, business, venue, and period;
- entered, saved, and restored values;
- loading, disabled, success, and error states;
- calculations and labels;
- isolation and versioning;
- refresh behavior;
- network/console behavior when relevant.

Do not infer persistence solely from what remains in the current React state. Refresh or revisit when the test requires server persistence.

## UI checks

At each assigned viewport inspect:

- no horizontal page overflow;
- no clipped text, mascot, menu, field, card, or button;
- fixed/sticky controls do not obscure the final field or content;
- headings, body text, and actions follow the existing visual hierarchy;
- controls have readable labels and usable target sizes;
- venue selector, account menu, disclosures, and error messages remain inside the viewport;
- text wraps intentionally;
- cards and controls have consistent radii, borders, shadows, typography, and spacing;
- Birdee supports the task and does not obscure content;
- focus indicators and keyboard order are understandable;
- loading and empty states do not produce broken layouts.

Inspect screenshots visually; DOM dimensions alone are not sufficient for visual acceptance.

## Evidence

Return:

- URL;
- viewport;
- expected and observed behavior;
- screenshot identifier/path when captured;
- concise console/network notes;
- reproduction steps for any defect;
- whether refresh reproduces it.

Do not include passwords, tokens, secrets, or unnecessary personal data in evidence.

