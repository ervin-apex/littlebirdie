# Defect and retest policy

## Classify first

- **Product defect:** implementation contradicts an approved requirement or established UI pattern.
- **Test-data blocker:** necessary identity, venue, email, or record is unavailable.
- **External blocker:** provider, production domain, physical device, or third-party state is unavailable.
- **Product decision:** more than one valid behavior exists and requirements do not decide.
- **Environment noise:** extension injection, stale HMR state, or local-server conflict not caused by the product.

Do not fix test-data blockers, external blockers, or product decisions as product defects.

## Repair boundary

Repair only a confirmed in-scope product defect. Use the smallest plausible change.

Preserve:

- existing page structure and information hierarchy;
- shared components and design tokens;
- established fonts, colors, radii, borders, shadows, and spacing;
- approved Little Birdee copy and terminology;
- mascot placement and role;
- responsive behavior at unaffected breakpoints;
- unrelated user/concurrent work.

Do not:

- redesign a screen while fixing a bug;
- invent new features;
- replace shared components with one-off styling;
- alter financial rules without the Group 0 contract;
- change authentication/security policy to make a test pass;
- delete test or customer data broadly.

## Retest

After repair, rerun:

1. the exact failed test;
2. the same test at every affected viewport;
3. adjacent navigation and shared-component tests;
4. relevant automated tests and production build.

Record defect ID, files changed, before/after observations, automated validation, and final status.

