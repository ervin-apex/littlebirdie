# Little Birdie

Profit-tracking dashboard for small businesses — connect your revenue and cost
inputs, and Little Birdie tells you where your money is going and how the day is
tracking against your budget.

Built with **Next.js 15** (App Router), **React 19**, **Tailwind CSS 4**,
**Recharts**, and **Motion**.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the local development server   |
| `npm run build` | Production build                     |
| `npm run start` | Serve the production build locally   |
| `npm run lint`  | Run ESLint                           |

## Deployment

Deployed on **Vercel**. Every push to `main` triggers an automatic production
deployment. Assets in `public/brand/` resolve at the domain root via
`lib/site.ts` `assetPath()`.
