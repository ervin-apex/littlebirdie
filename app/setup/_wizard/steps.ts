import type { Week } from "@/lib/profit";
import type { SetupStepKey } from "@/lib/venues/setup-navigation";

export type StepDefinition = {
  key: SetupStepKey;
  label: string;
  title: string;
  description: string;
  helpLabel: string;
  help: string;
  scoreLabel: string;
  scoreCaption: string;
  nextLabel: string;
  birdeeAsset: string;
};

export const VENUE_STEP: StepDefinition = {
  key: "venue",
  label: "Venue",
  title: "What should Birdee call this venue?",
  description: "Use the name you recognise in your roster or POS.",
  helpLabel: "Why does each venue need its own setup?",
  help: "Each venue keeps its own revenue and costs, so Birdee can show the right profit without mixing locations together.",
  scoreLabel: "Your new venue",
  scoreCaption: "Its numbers stay separate.",
  nextLabel: "Next: revenue",
  birdeeAsset: "/brand/birdee-reference-business-v1.png",
};

export const NUMBER_STEPS: StepDefinition[] = [
  {
    key: "revenue",
    label: "Revenue",
    title: "What revenue are ya expecting?",
    description: "Pop in each day. We’ll keep the weekly total sorted.",
    helpLabel: "What counts as revenue?",
    help: "Enter the sales figure you normally use, then tell us below whether it already excludes GST.",
    scoreLabel: "Week total",
    scoreCaption: "Before costs",
    nextLabel: "Next: wages",
    birdeeAsset: "/brand/birdee-setup-revenue-v1.png",
  },
  {
    key: "wages",
    label: "Wages",
    title: "What will wages cost ya?",
    description: "Use the weekly total from your roster.",
    helpLabel: "What counts as wages?",
    help: "Your full roster cost, including super and other employment on-costs, plus your own wage if that applies.",
    scoreLabel: "Weekly wages",
    scoreCaption: "From your roster",
    nextLabel: "Next: COGS",
    birdeeAsset: "/brand/birdee-setup-wages-v1.png",
  },
  {
    key: "cogs",
    label: "COGS",
    title: "What’s your cost of goods rate?",
    description: "Use the share of GST-exclusive revenue spent making what you sell.",
    helpLabel: "What counts as COGS?",
    help: "The direct cost of what you sell, entered as a percentage of revenue excluding GST.",
    scoreLabel: "COGS rate",
    scoreCaption: "Of revenue excluding GST",
    nextLabel: "Next: other costs",
    birdeeAsset: "/brand/birdee-setup-cogs-v1.png",
  },
  {
    key: "fixed",
    label: "Fixed + variable",
    title: "What are your other weekly costs?",
    description: "Rent, power, insurance and the rest — one weekly total.",
    helpLabel: "What counts as other costs?",
    help: "Ordinary running costs such as rent, power, insurance and software. Leave out tax, interest, depreciation, loan principal and owner drawings.",
    scoreLabel: "Other costs",
    scoreCaption: "Weekly total",
    nextLabel: "Next: other income",
    birdeeAsset: "/brand/birdee-setup-other-costs-v1.png",
  },
  {
    key: "income",
    label: "Other income",
    title: "Any other income each week?",
    description: "Add ordinary, recurring income such as supplier rebates.",
    helpLabel: "What counts as other income?",
    help: "Include recurring operating income that belongs in EBITDA, such as regular supplier rebates. Leave out one-off or exceptional income.",
    scoreLabel: "Other income",
    scoreCaption: "Added to EBITDA",
    nextLabel: "See my profit",
    birdeeAsset: "/brand/birdee-setup-other-costs-v1.png",
  },
];

export const VENUE_STEPS: StepDefinition[] = [VENUE_STEP, ...NUMBER_STEPS];

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
