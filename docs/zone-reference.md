# Zone Reference — Complete Guide

Every HTML attribute, every identification method, every prompt control option, every capability.

For AI agent integration, see [SKILL.md](../SKILL.md). For backend setup (schemas, governance, seed data), see [SETUP-GUIDE.md](../SETUP-GUIDE.md).

---

## All HTML Attributes

| Attribute | Required | What It Does |
|---|---|---|
| `data-gs-zone` | Yes | What to display — a property value or AI-generated text |
| `data-gs-identify` | Once per page | How to find the record — which collection:property matches the visitor |
| `data-gs-prompt` | Optional | Custom instructions for AI-generated zones |
| `data-gs-memorize` | Optional | Capture input and write it back to Personize |
| `data-gs-trigger` | Optional | When to capture (blur, change, submit, click) |

## All JavaScript Methods

| Method | What It Does |
|---|---|
| `GS.identify(email, traits)` | Identify visitor + auto-refresh all zones (mid-session upgrade) |
| `GS.track(event, properties)` | Track custom event (batched, sent every 5s) |
| `GS.memorize(target, value)` | Write to collection:property for current visitor |
| `GS.consent({ analytics, marketing })` | Set consent levels (overrides auto-detected managers) |
| `GS.refresh(zoneId?)` | Force re-render one or all zones |
| `GS.on(event, callback)` | Listen: `zone:render`, `meta`, `done`, `error`, `identify`, `memorize`, `tier:upgrade`, `consent` |
| `GS.debug()` | Returns config, visitor, zones, consent state, preview mode |

## All URL Parameters

| Parameter | What It Does |
|---|---|
| `?gs=encrypted_token` | Identify visitor via encrypted token |
| `?gs_preview=email` | Preview mode — see what a contact would see (test keys only) |
| `?gs_id=value` | Generic identify value (fallback for data-gs-identify) |
| `?utm_source`, `?utm_campaign`, etc. | Forwarded as AI context for campaign-aware copy |
| `/for/slug` | Unique URL — slug matched via data-gs-identify |

## All Capabilities

| Capability | Status |
|---|---|
| Property zones (collection:property — instant, no LLM) | Working |
| Structured generative zones (output.field — grouped AI outputs) | Working |
| Flat generative zones (AI-written with prompt control) | Working |
| Auth session identification (window.__GS_USER__) | Working |
| Collection lookup identification (data-gs-identify) | Working |
| Location identification (automatic from geo headers) | Working |
| Deanonymization (RB2B person-level, Clearbit company-level) | Working (configure API keys on Edge API) |
| Mid-session tier upgrades (GS.identify → auto-refresh) | Working |
| SPA support (MutationObserver for dynamic zones) | Working |
| Preview mode (?gs_preview=email, test keys only) | Working |
| Consent bridge (OneTrust, CookieBot, Osano auto-detection) | Working |
| Memorize from website (data-gs-memorize) | Working |
| UTM forwarding for campaign-aware AI | Working |
| Custom prompts per zone (data-gs-prompt) | Working |
| Event tracking with session narrative memorization | Working |
| Minified build (gs.min.js, ~3kb gzipped) | Available |

---

## data-gs-zone — What to Display

Three zone syntaxes, distinguished by separator:

| Syntax | Separator | Type | Resolution | Example |
|---|---|---|---|---|
| `collection:property` | `:` | Property zone | Memory lookup (instant) | `website_zones:hero_headline` |
| `output.field` | `.` | Structured generative | AI output → JSON field | `hero.headline` |
| `plain-id` | none | Flat generative | AI output → plain text | `headline` |

### Property zone (from Personize memory, instant, no AI)

```html
<h1 data-gs-zone="website_zones:hero_headline">Fallback text</h1>
```

Format: `collectionSystemName:propertySystemName`

The Edge API reads the `hero_headline` property from the `website_zones` collection for the identified visitor. If the visitor has that property, it replaces the text. If not, fallback stays.

### Structured generative zone (grouped AI output)

```html
<h1 data-gs-zone="hero.headline">Default headline</h1>
<p data-gs-zone="hero.subtitle">Default subtitle</p>
<button data-gs-zone="hero.cta">Get Started</button>
```

Format: `outputName.fieldName`

Zones sharing the same output name (`hero`) are grouped and generated as one coherent JSON object. The AI produces `{"headline": "...", "subtitle": "...", "cta": "..."}` and each field is delivered to its element **progressively** — as soon as the AI finishes that output group.

Use structured zones when:
- Multiple elements should be **contextually consistent** (headline + subtitle + CTA)
- You want **coherent messaging** across a section
- You want **faster delivery** (one AI output instead of three separate ones)

Rules:
- Exactly one dot allowed (no deep paths like `hero.section.title`)
- Output name and field name must be alphanumeric/underscore/hyphen
- Custom prompts via `data-gs-prompt` are not used on individual structured zones — the field names and context guide the AI

### Flat generative zone (independent AI text)

```html
<h1 data-gs-zone="headline">Fallback text</h1>
```

Format: just a name (no colon, no dot)

The Edge API generates text using Personize `prompt()` with the visitor's context (location, company, profile) + brand guidelines + the zone's prompt instruction. Use `data-gs-prompt` to control what the AI writes.

### Mixing all three on the same page

```html
<!-- Property zones — instant, from memory -->
<h1 data-gs-zone="website_zones:hero_headline">Welcome</h1>
<p data-gs-zone="website_zones:sub_headline">We help teams</p>

<!-- Structured generative — coherent group, streamed progressively -->
<p data-gs-zone="hero.subtitle">Built for teams</p>
<button data-gs-zone="hero.cta">Get Started</button>

<!-- Flat generative — independent AI text, custom prompts -->
<p data-gs-zone="proof"
   data-gs-prompt="Social proof mentioning their city">Trusted by 500+ companies</p>
```

Property zones are served first (instant). Structured zones arrive as each group finishes generating. Flat zones arrive independently.

---

## data-gs-identify — How to Find the Record

This attribute tells the Edge API **how to identify the visitor** by searching a Personize collection. Only needed ONCE on the page — all zones use the same identity.

### Format

```
data-gs-identify="collectionName:propertyName"
```

The Edge API searches `collectionName` for a record where `propertyName` matches a value from the URL or server-side signals.

### Identification by slug (ABM campaigns)

```html
<h1 data-gs-zone="website_zones:hero_headline"
    data-gs-identify="website_zones:slug">
  Welcome
</h1>
```

**URL:** `https://yoursite.com/for/sarah-chen`

**What happens:**
1. gs.js extracts `sarah-chen` from the URL path `/for/sarah-chen`
2. Sends to Edge API: `identify_collection=website_zones&identify_property=slug&identify_value=sarah-chen`
3. Edge API searches: `recall({ collections: ['website_zones'], query: 'slug sarah-chen' })`
4. Finds record where `slug = sarah-chen` → gets ALL properties
5. Serves all `website_zones:*` zones from that one record

**The user must have a record in Personize:**
```
Collection: website_zones
Record for sarah@acme.com:
  slug: "sarah-chen"
  hero_headline: "How Acme Corp Scaled API Ops by 3x"
  sub_headline: "Built for API-first engineering teams"
  cta_text: "See Sarah's demo"
```

### Identification by email (URL parameter)

```html
<h1 data-gs-zone="client_portal:welcome_message"
    data-gs-identify="client_portal:email">
  Welcome back
</h1>
```

**URL:** `https://yoursite.com/portal?email=sarah@acme.com`

gs.js sees property name `email`, checks URL params, finds `?email=sarah@acme.com`, sends it.

### Identification by any URL parameter

```html
<h1 data-gs-zone="proposals:headline"
    data-gs-identify="proposals:customer_id">
  Your proposal
</h1>
```

**URL:** `https://yoursite.com/proposal?customer_id=ACME-2024`

gs.js checks `?customer_id=`, finds `ACME-2024`, Edge API searches `proposals` collection for `customer_id = ACME-2024`.

### Identification by location (server-side, automatic)

```html
<h1 data-gs-zone="location_content:hero_headline"
    data-gs-identify="location_content:location">
  Welcome
</h1>
```

**URL:** `https://yoursite.com` (no special URL needed)

**What happens:**
1. gs.js sees property `location`, can't find it in the URL → sends with no value
2. Edge API detects server-side property name `location`
3. Edge API reads geo headers: city=Austin, region=TX, country=US
4. Generates lookup value: `austin-tx-us`
5. Searches `location_content` collection for `location = austin-tx-us`
6. Gets record → serves `hero_headline` property for Austin visitors

**The user must have location records in Personize:**
```
Collection: location_content
Record for Austin:
  location: "austin-tx-us"
  hero_headline: "Trusted by 14 companies in Austin"
  proof: "Built for Texas-based engineering teams"

Record for London:
  location: "london--gb"
  hero_headline: "Built for UK teams"
  proof: "GDPR-compliant by design"
```

**Server-side property names recognized:**
| Property Name | Resolved From | Example Value |
|---|---|---|
| `location` | Geo headers (composite) | `austin-tx-us` |
| `city` | Geo city header | `austin` |
| `region` or `state` | Geo region header | `tx` |
| `country` | Geo country header | `us` |

### Identification by auth session (SaaS apps)

No `data-gs-identify` needed. Set `window.__GS_USER__` instead:

```html
<script>
  window.__GS_USER__ = {
    email: 'sarah@acme.com',
    firstName: 'Sarah',
    company: 'Acme Corp'
  };
</script>
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<h1 data-gs-zone="dashboard:greeting">Welcome back</h1>
```

Auth session is highest priority — it overrides `data-gs-identify`.

### Identification by encrypted token (email links)

No `data-gs-identify` needed. Append `?gs=encrypted_token` to any URL:

```
https://yoursite.com/pricing?gs=eyJ1c2VyIjoic2FyYWh...
```

The token decrypts server-side to `{ email, campaignId }`. All zones get personalized.

### Auth + identify combo (web apps with property zones)

For web apps that use both auth AND property zones — this is the fastest pattern:

```html
<script>window.__GS_USER__ = { email: 'sarah@acme.com' };</script>
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<h1 data-gs-zone="dashboard:greeting"
    data-gs-identify="dashboard:email">Welcome back</h1>
<p data-gs-zone="dashboard:insight">Your summary</p>
<div data-gs-zone="dashboard:recommendation">Features</div>
```

Auth provides the email. `data-gs-identify="dashboard:email"` tells the Edge API to use that email to load the entire `dashboard` collection record in one call. All `dashboard:*` property zones are served from that single result.

Without `data-gs-identify`, auth-only mode does a separate recall per property zone (slower with many zones).

| Pattern | Property zone resolution | API calls |
|---|---|---|
| Auth only (no `data-gs-identify`) | Per-zone recall | N calls (one per zone) |
| Auth + `data-gs-identify` | One bulk record load | 1 call (all zones) |
| Website (no auth, just `data-gs-identify`) | One bulk record load | 1 call (all zones) |

### Priority order

When multiple identification methods are present:

```
1. Auth session (window.__GS_USER__)     ← highest, checks for data-gs-identify too
2. Collection lookup (data-gs-identify)  ← website path (slug, email, location)
3. Location (geo headers)                ← fallback for anonymous visitors
```

---

## data-gs-prompt — Control AI Generation

For generative zones (no colon), you can provide custom instructions:

### Basic prompt

```html
<p data-gs-zone="proof"
   data-gs-prompt="Write a social proof statement. Mention our 99.9% uptime SLA. Max 2 sentences.">
  Trusted by 500+ companies
</p>
```

### What the prompt controls

The `data-gs-prompt` text becomes the instruction for this specific zone in the `prompt()` call. It's combined with:

1. **Your prompt** → per-zone instructions ("mention SLA, max 2 sentences")
2. **Brand guidelines** → loaded automatically via `smartGuidelines()` from your governance rules
3. **Visitor context** → loaded automatically via `smartDigest()` — their name, company, history
4. **Tier rules** → automatic: "don't reference personal details for anonymous visitors"
5. **System rules** → always: "output plain text only, never invent facts, never HTML"

### The full prompt sent to Personize

```
CONTEXT:
  ## Brand Guidelines
  [from smartGuidelines() — your governance rules]

  ## Visitor Profile
  [from smartDigest() — what Personize knows about this contact]

  ## Visitor Location
  City: Austin, Region: TX, Country: US

  ## Page
  URL: https://yoursite.com/pricing

  ## Personalization Tier
  Tier: known, Confidence: 1.0

INSTRUCTIONS:
  Generate personalized text for each website zone.

  ZONES:
  - proof: Write a social proof statement. Mention our 99.9% uptime SLA. Max 2 sentences.
  - cta-text: Write a CTA button label, max 5 words. Match the visitor's likely next step.

  RULES:
  - Output ONLY plain text. No HTML, no markdown, no quotes.
  - NEVER invent facts not in the context.
  - Match the brand voice from the guidelines.
  - Full personalization. Use the visitor's name, company, and context.

  FORMAT:
  proof: your text here
  cta-text: your text here
```

### Default prompts (when no data-gs-prompt)

If you don't set `data-gs-prompt`, the system uses defaults based on the zone ID:

| Zone ID | Default Prompt |
|---|---|
| `headline` | "Write a compelling hero headline, max 12 words. Be specific to the visitor if possible." |
| `subheadline` | "Write a supporting subheadline, max 25 words." |
| `cta-text` | "Write a CTA button label, max 5 words." |
| `proof` | "Write a social proof statement, max 2 sentences." |
| `value-prop` | "Write a value proposition, max 2 sentences." |
| `description` | "Write a brief description, max 3 sentences." |
| Any other | "Write personalized text for the '[zoneId]' section, max 2 sentences." |

### Quality control layers

| Layer | What Controls It | Where Configured |
|---|---|---|
| **Zone prompt** | Per-zone instructions | `data-gs-prompt` on HTML element |
| **Brand guidelines** | Org-wide voice, tone, approved claims | Personize dashboard → Governance |
| **Prohibited content** | What the AI must never say | Personize dashboard → Governance |
| **Tier rules** | What level of personalization is appropriate | Automatic in Edge API |
| **System rules** | Plain text only, no invented facts, no HTML | Hardcoded in Edge API |

---

## data-gs-memorize — Capture Input

Write visitor input back to Personize memory. Off by default, opt-in per element.

### Single field

```html
<textarea
  data-gs-memorize="feedback:feature_request"
  data-gs-trigger="blur"
  placeholder="What feature would help you most?"
></textarea>
```

On blur → value sent to Personize → stored as `feature_request` property in `feedback` collection for this contact.

### Form

```html
<form data-gs-memorize-form="onboarding">
  <input data-gs-memorize="onboarding:primary_goal" placeholder="Your main goal" />
  <select data-gs-memorize="onboarding:team_size" data-gs-trigger="change">
    <option value="1-10">1-10</option>
    <option value="11-50">11-50</option>
  </select>
  <button type="submit">Save</button>
</form>
```

On submit → all fields captured in one batch.

### JavaScript API

```javascript
GS.memorize('feedback:feature_request', 'Need better batch processing');
```

### Triggers

| Trigger | When | Default For |
|---|---|---|
| `blur` | User tabs/clicks away | `<input>`, `<textarea>` |
| `change` | Value changes | `<select>` |
| `submit` | Parent form submits | Elements in `data-gs-memorize-form` |
| `click` | Element clicked | Buttons |

### Requirement: visitor must be identified

Memorize writes are silently dropped for anonymous visitors. The visitor must be identified via auth, token, slug, or `GS.identify()` first.

---

## Complete Examples

### ABM landing page (slug-based)

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<!-- Property zones from memory + identify by slug -->
<h1 data-gs-zone="website_zones:hero_headline"
    data-gs-identify="website_zones:slug">
  See how we can help your team
</h1>
<p data-gs-zone="website_zones:sub_headline">The modern platform for growing teams</p>

<!-- Generative zones with custom prompts -->
<span data-gs-zone="cta-text"
      data-gs-prompt="CTA with their first name, max 5 words">
  Book a Demo
</span>
<p data-gs-zone="proof"
   data-gs-prompt="Social proof mentioning their industry. Reference our uptime SLA.">
  Trusted by 500+ companies
</p>
```

**URL:** `https://yoursite.com/for/sarah-chen`

### Location-personalized page (no contact needed)

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<!-- Property zones from location collection -->
<h1 data-gs-zone="location_content:hero_headline"
    data-gs-identify="location_content:location">
  Welcome
</h1>
<p data-gs-zone="location_content:proof">We serve customers worldwide</p>

<!-- Generative zone (AI-written with location context, no collection needed) -->
<p data-gs-zone="local-cta"
   data-gs-prompt="Write a CTA relevant to the visitor's city. Be specific, not generic.">
  Get started today
</p>
```

### SaaS dashboard (auth session)

```html
<script>
  window.__GS_USER__ = { email: currentUser.email, firstName: currentUser.name, plan: currentUser.plan };
</script>
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<h1 data-gs-zone="dashboard:greeting">Welcome back</h1>
<p data-gs-zone="usage-insight"
   data-gs-prompt="Write a usage insight based on their plan and API call volume. Be specific with numbers.">
  Here's your usage summary
</p>
<div data-gs-zone="recommendation"
     data-gs-prompt="Suggest a feature or upgrade based on their usage patterns. Be helpful, not pushy.">
  Check out our latest features
</div>
```

### Client portal with feedback capture

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<!-- Read: show personalized content -->
<h1 data-gs-zone="client_portal:welcome_message"
    data-gs-identify="client_portal:email">
  Welcome back
</h1>
<div data-gs-zone="client_portal:meeting_summary">Your meeting notes</div>
<p data-gs-zone="client_portal:next_steps">Next steps from your conversation</p>

<!-- Write: capture feedback -->
<textarea
  data-gs-memorize="client_portal:feedback"
  data-gs-trigger="blur"
  placeholder="How was your experience?"
></textarea>
```

**URL:** `https://yoursite.com/portal?email=sarah@acme.com`

### Pure generative (no collections, just AI)

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<h1 data-gs-zone="headline">Welcome to our platform</h1>
<p data-gs-zone="subheadline"
   data-gs-prompt="Supporting text that complements the headline. Reference the visitor's location if known.">
  We help teams build faster.
</p>
<span data-gs-zone="cta-text">Get Started</span>
<p data-gs-zone="proof"
   data-gs-prompt="Social proof with a specific number. Reference their city if located.">
  Trusted by 500+ companies
</p>
```

No collections, no identify, no contact lookup. AI generates everything based on visitor location. Works for 100% of visitors including anonymous.

---

## Preview Mode

Test what any contact would see. Add `?gs_preview=email` to the URL:

```
https://yoursite.com/pricing?gs_preview=sarah@acme.com
```

- Edge API resolves identity as `sarah@acme.com`
- All zones render with Sarah's personalized content
- **Only works with `pk_test_` keys** — rejected with `pk_live_` (security)
- `GS.debug()` shows `preview: "sarah@acme.com"` when active

Useful for QA-ing campaign pages before sending links.

---

## SPA Support (MutationObserver)

gs.js watches for new `data-gs-zone` elements added to the DOM after initial page load. When a React/Next.js/Vue route change renders new zones, they're automatically discovered and connected:

```
Initial load → discovers 3 zones → connects SSE
User navigates (SPA) → new DOM elements with data-gs-zone
MutationObserver → discovers 2 new zones → auto-connects SSE
```

Also discovers new `data-gs-memorize` bindings on route changes.

No extra code needed — works automatically with React Router, Next.js App Router, Vue Router.

---

## Mid-Session Tier Upgrades

When `GS.identify()` is called, gs.js:

1. Sends the identify event to the server
2. Sets `window.__GS_USER__` with the email
3. Waits 500ms (for the identify POST to complete)
4. Re-connects SSE for all zones with the new identity

All zones re-render with personalized content for the identified contact.

```javascript
// Visitor fills a form → call identify → zones auto-refresh
document.querySelector('form').addEventListener('submit', function(e) {
  var email = document.querySelector('[name=email]').value;
  GS.identify(email, { firstName: 'Sarah' });
  // All zones will re-render with Sarah's content ~500ms later
});
```

---

## Consent Bridge

Auto-detects consent managers and gates features:

| Manager | Detection |
|---|---|
| **OneTrust** | `window.OneTrust` or `OptanonActiveGroups` |
| **CookieBot** | `window.Cookiebot.consent` |
| **Osano** | `window.Osano.cm` |

| Feature | Required Consent |
|---|---|
| Location personalization | Essential (always allowed) |
| Cookies (`_gs_uid`) | Essential |
| Event tracking (`GS.track()`) | Analytics |
| Memorize writes (`GS.memorize()`) | Analytics |
| Deanonymization (Clearbit/RB2B) | Marketing |
| `GS.identify()` | Marketing |

If no consent manager is detected, all features are allowed.

Manual override:

```javascript
GS.consent({ analytics: true, marketing: false });
```

When consent is denied, the feature is silently skipped — no errors, no broken UX.

---

## Deanonymization

Server-side IP-based identification for anonymous B2B visitors:

| Provider | Returns | Tier Achieved |
|---|---|---|
| **RB2B** | Person: email, name, title, company | Known |
| **Clearbit Reveal** | Company: name, industry, size | Account |

Runs in a waterfall (RB2B first, Clearbit fallback). Both cache results per-IP.

Configure on the Edge API (not in gs.js):

```
RB2B_API_KEY=your_key
CLEARBIT_API_KEY=your_key
```

Requires **marketing consent** — skipped if consent is denied.

---

## JavaScript API Reference

```javascript
// Identify (triggers mid-session zone refresh)
GS.identify('sarah@acme.com', { firstName: 'Sarah', company: 'Acme Corp' });

// Track events (batched, sent every 5s)
GS.track('feature_used', { feature: 'batch-api' });

// Write to collection:property
GS.memorize('feedback:feature_request', 'Need batch processing');

// Set consent levels
GS.consent({ analytics: true, marketing: false });

// Re-render zones
GS.refresh();             // all zones
GS.refresh('headline');   // one zone

// Callbacks
GS.on('zone:render', function(d) { console.log(d.zone, d.text); });
GS.on('meta', function(d) { console.log(d.tier, d.location); });
GS.on('memorize', function(d) { console.log(d.target, d.value); });
GS.on('tier:upgrade', function(d) { console.log('Upgraded to', d.newTier); });
GS.on('consent', function(d) { console.log('Consent:', d); });
GS.on('identify', function(d) { console.log(d.email); });
GS.on('done', function(d) { console.log('Done in', d.duration_ms, 'ms'); });
GS.on('error', function(d) { console.log(d.code, d.message); });

// Debug
console.log(GS.debug());
// → { config, visitor, zones, consent: { essential, analytics, marketing }, preview: null }
```
