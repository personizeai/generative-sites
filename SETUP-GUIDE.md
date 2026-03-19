# Generative Sites — Setup Guide

Get from zero to a working flagship demo in **~15 minutes**.

---

## Prerequisites

- **Node.js 18+** and npm
- A **Personize account** with a secret key (`sk_live_...`)
- A **site key** (`pk_test_...` or `pk_live_...`) from the Personize dashboard

---

## Phase 1: Install Dependencies (~2 min)

```bash
cd generative-sites
npm install
```

This installs the Personize SDK, CSV parser, TypeScript, Vitest, and esbuild.

---

## Phase 2: Configure Environment (~2 min)

```bash
cp .env.example .env
```

Edit `.env` and set your keys:

```env
PERSONIZE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
FLAGSHIP_DEMO_KEY=pk_test_YOUR_SITE_KEY
FLAGSHIP_DEMO_ENDPOINT=https://gs.personize.ai
```

---

## Phase 3: Create the Schema (~1 min)

This creates the `website_zones` collection in Personize with all the properties the flagship demo needs.

```bash
npm run setup:schemas
```

**What it creates:**

| Property | Type | Purpose |
|---|---|---|
| `email` | text | Primary identifier |
| `slug` | text | ABM lookup path |
| `first_name` | text | Name personalization |
| `company_name` | text | Company-aware copy |
| `role_title` | text | Role-sensitive messaging |
| `industry` | text | Industry proof |
| `primary_goal` | text | Goal-aware generation |
| `biggest_blocker` | text | Objection reframes |
| `desired_outcome` | text | Outcome framing |
| `hero_headline` | text | Property zone (instant) |
| `sub_headline` | text | Property zone (instant) |
| `cta_text` | text | Property zone (instant) |
| `proof` | text | Property zone (instant) |
| `value_prop` | text | Property zone (instant) |
| `notes` | array (append) | Open-ended context |
| `interests` | array (append) | Topic tracking |

Safe to re-run — skips creation if the collection exists.

---

## Phase 4: Set Up Governance (~1 min)

This creates the brand voice and zone generation rules that gs-edge uses during AI generation.

```bash
npm run setup:governance
```

**What it creates:**

| Variable | Purpose |
|---|---|
| Zone Brand Voice | Tone, personalization guardrails, prohibited phrases |
| Zone Generation Guidelines | Length limits per zone, structure rules, consent tiers |
| Zone Content Policy | Prohibited content, quality bar, fallback rules |

---

## Phase 5: Seed Sample Contacts (~2 min)

This imports 4 sample contacts (Maya, Daniel, Aisha, Leo) into Personize memory so property zones have data to display.

```bash
npm run seed
```

The sample data lives in `setup/sample-contacts.csv`. You can edit it or add your own rows.

---

## Phase 6: Try an Example (~1 min)

Open any example in your browser with your site key:

1. Open `examples/abm-landing-page.html`
2. Replace `pk_test_YOUR_KEY` with your actual key
3. Visit the page at `/for/maya-chen-orbitstack` (or append `?slug=maya-chen-orbitstack`)
4. Property zones should fill with Maya's pre-written copy

See all examples in the `examples/` folder.

---

## Phase 7: Build and Test (~2 min)

```bash
# Run tests
npm test

# Type check
npm run typecheck

# Build minified SDK
npm run build
```

The minified SDK is written to `dist/gs.min.js` with a source map.

---

## Quick Reference

| Command | What it does |
|---|---|
| `npm run setup` | Creates schemas + governance (both) |
| `npm run setup:schemas` | Creates the website_zones collection |
| `npm run setup:governance` | Creates brand voice + zone rules |
| `npm run seed` | Imports sample contacts into memory |
| `npm run build` | Minifies gs.js → dist/gs.min.js |
| `npm test` | Runs all tests |
| `npm run test:watch` | Runs tests in watch mode |
| `npm run test:coverage` | Runs tests with coverage report |
| `npm run typecheck` | TypeScript type checking |

---

## Troubleshooting

**"Missing required environment variable: PERSONIZE_SECRET_KEY"**
→ Create a `.env` file from `.env.example` and add your secret key.

**"Collection already exists — skipping"**
→ This is normal on re-runs. The setup is idempotent.

**Zones show fallback text**
→ Run `npm run seed` to populate contacts in Personize, then refresh the page. Check `GS.debug()` in DevTools to verify the connection.
