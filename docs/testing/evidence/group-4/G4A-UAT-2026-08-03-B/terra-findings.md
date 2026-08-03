# Group 4A retest — Terra findings

Run ID: `G4A-UAT-2026-08-03-B`
Date: 3 August 2026
Scope: Retest of G4A-02, G4A-03, and G4A-05 after responsive containment repairs

## Environment recovery

The first fixture-inspection attempt stopped on a stale Next.js runtime cache error (`__webpack_modules__[moduleId] is not a function`). The process bound to port 3000 was identified and restarted. The server then returned HTTP 200 and all subsequent UAT journeys completed without an application runtime error. No fixture data was changed before recovery.

## Fixtures

- Included week, missing yesterday revenue: `onegood.idea.official@gmail.com`, existing Tae's Den venue, saved week 27 July–2 August 2026, Sunday actual absent.
- Excluded week: `onegood.idea.official@gmail.com`, isolated venue `G4A Excluded Week`, saved week 3–9 August 2026.
- Included week, completed yesterday: `thedistancearchives@gmail.com`, venue `asdasd`, saved Sunday result retained.

No completed daily actual was overwritten. The only created record was the isolated `G4A Excluded Week` venue and its weekly setup.

## Results

| Test | Result | Browser evidence |
| --- | --- | --- |
| G4A-02 | PASS | An included saved week truthfully labels Yesterday as Sunday 2 August. An excluded saved week redirects a direct Yesterday URL to This week, leaves Yesterday disabled, and never relabels Monday. Verified at 1440×900, 1024×768, 390×844, and 390×700 with refresh persistence. |
| G4A-03 | PASS | Missing Sunday revenue shows `Waiting for revenue`, explains the missing sales total, and offers only `Add Sunday's revenue` for 2 August. What happened, What if, and See all numbers are absent. Verified at all four target viewports and after refresh. |
| G4A-05 | PASS | At 1440×900 and 1024×768 the dashboard scrolls vertically to See all numbers. The selected Sunday breakdown stays within the day rail. At both mobile sizes, dashboard width equals its scroll width and final content clears the fixed dock at maximum scroll. |

## Repaired geometry

- 1440×900: dashboard client/scroll height `816/954`; See all numbers becomes fully visible after `scrollTop=138`; Sunday breakdown right edge `1366.41` remains inside rail right edge `1367.41`.
- 1024×768: dashboard client/scroll height `684/771`; See all numbers becomes fully visible after `scrollTop=87`.
- 390×844: document width `390/390`; See all numbers bottom `705.4`, dock top `762`.
- 390×700: document width `390/390`; See all numbers bottom `561.4`, dock top `618`.

## Browser notes

No application console or network error affected the retest. Generic browser-extension message-channel warnings were excluded. A venue-menu click initially failed to send a request because the browser reference was stale; direct navigation to the same visible selection URL reached the server and switched the venue correctly, so this was not classified as a product defect.

## Evidence folders

- `journey/` — fixture creation, included/excluded-week behavior, missing-revenue desktop state
- `desktop-medium/` — 1440×900 and 1024×768 containment and missing-revenue evidence
- `mobile-short/` — 1024×768 exclusion check plus 390×844 and 390×700 states
