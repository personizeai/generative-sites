# Generative Sites

AI-personalized text zones for any website. One script tag, HTML attributes, no build step. Powered by [Personize](https://personize.com).

> **Early Access** — This project is under active development. The SDK API and zone behavior may change between releases.
> Want to collaborate closely? [Let us know](CONTRIBUTING.md#collaborate-closely) · [Become a sponsor](CONTRIBUTING.md#sponsors)

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](.github/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?logo=typescript&logoColor=white)](tsconfig.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## Quick Start

### 1. Add the script tag

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_YOUR_KEY" async></script>
```

Get your site key from the [Personize dashboard](https://personize.com) → Generative Sites → Create Site.

### 2. Mark text elements as zones

```html
<h1 data-gs-zone="hero.headline">Welcome to our platform</h1>
<p data-gs-zone="hero.subtitle">We help teams ship faster.</p>
<span data-gs-zone="hero.cta">Get Started</span>
```

### 3. Verify

Open DevTools → Console → type `GS.debug()`. You should see your zones, visitor tier, and connection status.

That's it. Anonymous visitors see location-personalized text immediately.

---

## Three Zone Types

| Type | Syntax | Source | Speed |
|---|---|---|---|
| **Property** | `website_zones:hero_headline` | Personize memory lookup | Instant |
| **Structured** | `hero.headline` + `hero.subtitle` | AI-generated as a coherent group | 2-5s |
| **Flat** | `headline` | AI-generated independently | 2-5s |

Mix all three on the same page. Property zones cost zero. All generative zones are batched into one AI call.

---

## Examples

| Example | Scenario |
|---|---|
| [basic.html](examples/basic.html) | Anonymous visitor — structured zones + custom prompt, location personalization |
| [abm-landing-page.html](examples/abm-landing-page.html) | ABM outbound — property zones + `/for/:slug` identification |
| [saas-dashboard.html](examples/saas-dashboard.html) | Logged-in app — `window.__GS_USER__` auth session |
| [lead-capture.html](examples/lead-capture.html) | Lead form — `GS.identify()` + memorize + mid-session re-render |

Each example is a single HTML file. Replace `pk_test_YOUR_KEY` with your key and open in a browser.

---

## JavaScript API

```javascript
GS.identify(email, { firstName, company })  // Identify visitor, auto-refresh zones
GS.track(event, properties)                 // Track event (batched every 5s)
GS.memorize('collection:property', value)   // Write to Personize memory
GS.consent({ analytics, marketing })        // Set consent (overrides OneTrust/CookieBot/Osano)
GS.refresh()                                // Re-render all zones
GS.refresh('zone-id')                       // Re-render one zone
GS.on('zone:render', fn)                    // Callback when a zone renders
GS.on('meta', fn)                           // Callback with visitor tier + location
GS.debug()                                  // Returns config, visitor, zones, consent state
```

---

## Identification Methods

| Method | How | Priority |
|---|---|---|
| Auth session | `window.__GS_USER__ = { email, firstName }` | Highest |
| Preview | `?gs_preview=email` (test keys only) | High |
| Collection lookup | `data-gs-identify="collection:property"` + URL param | Medium |
| Deanonymization | RB2B / Clearbit (server-side config) | Low |
| Location | Automatic from edge headers | Fallback |

---

## Backend Setup

Create the Personize schema, governance rules, and seed sample contacts:

```bash
npm install
cp .env.example .env        # add your PERSONIZE_SECRET_KEY
npm run setup                # create website_zones collection + governance
npm run seed                 # import 4 sample contacts
```

See [SETUP-GUIDE.md](SETUP-GUIDE.md) for the full walkthrough.

---

## Documentation

| Doc | What It Covers |
|---|---|
| [Zone Reference](docs/zone-reference.md) | Every attribute, method, URL parameter, and pattern |
| [CMS Guides](docs/cms-guides.md) | WordPress, Webflow, Shopify, Squarespace, Next.js |
| [Security](docs/security.md) | Attack surface, key model, XSS prevention |
| [Deployment Architecture](docs/deployment-architecture.md) | Who hosts what — CDN, gs-edge, Personize cloud |
| [Integrations](docs/integrations.md) | Pipelines, AI agents, Zapier, CRM sync |
| [SKILL.md](SKILL.md) | AI agent reference — for Claude, GPT, Cursor |

---

## CMS Compatibility

Works behind any cache, CDN, or CMS — like adding Google Analytics or HubSpot.

WordPress, Webflow, Shopify, Squarespace, Next.js, plain HTML. See [CMS Guides](docs/cms-guides.md).

---

## Sponsors

This project is supported by companies who believe website personalization should be open. [Become a sponsor](CONTRIBUTING.md#sponsors).

<!-- Gold Sponsors -->
<!-- <a href="https://example.com"><img src="logo.png" width="200" alt="Sponsor" /></a> -->

*Your logo here — [sponsor this project](mailto:sponsors@personize.ai)*

---

## Contributing

We welcome contributions! See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the full guide and **[ROADMAP.md](ROADMAP.md)** for claimable features.

---

## License

MIT
