# Generative Sites — AI Integration Skill

> For AI agents helping developers integrate Generative Sites.
> This file contains every attribute, method, pattern, and constraint.
> When generating code for Generative Sites, follow this file exactly.
> For human-readable reference, see [docs/zone-reference.md](docs/zone-reference.md).

---

## What Generative Sites Is

A script tag (`gs.js`) that personalizes text content on any website. It replaces `textContent` in HTML elements marked with `data-gs-zone`. Content comes from Personize memory (instant property lookup) or AI generation (Personize prompt API). Hosted at `gs.personize.ai`.

**It is NOT:** a framework, an npm package, a build tool, a CMS, or a React component library. It's a single script tag + HTML attributes.

---

## Installation (Every CMS, Every Framework)

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_SITE_KEY" async></script>
```

That's it. No npm install. No build step. No imports. Works on any HTML page.

For local development or self-hosted edge:
```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_test_SITE_KEY" data-endpoint="http://localhost:3400" async></script>
```

`data-endpoint` is only needed when NOT using the default `gs.personize.ai` host.

---

## HTML Attributes — Exact Syntax

### data-gs-zone (REQUIRED — marks a text element for personalization)

**Property zone** — reads from Personize memory (instant, no AI):
```html
<h1 data-gs-zone="collectionName:propertyName">Fallback text</h1>
```

**Structured generative zone** — grouped AI output (coherent multi-field):
```html
<h1 data-gs-zone="outputName.fieldName">Fallback text</h1>
```

**Flat generative zone** — AI-written at serve time:
```html
<h1 data-gs-zone="zoneName">Fallback text</h1>
```

**Rules:**
- Contains a colon (`:`) → property zone → reads from Personize memory
- Contains a dot (`.`) → structured generative zone → zones with same output name are generated together as a coherent JSON object, each field streamed to its element progressively
- No colon or dot → flat generative zone → AI generates independent text
- The fallback text (element's existing content) is shown to search engines and when personalization is unavailable
- gs.js sets `textContent` — NEVER `innerHTML` — XSS is impossible
- Zone IDs must be unique per page
- Maximum 20 zones per page
- Structured zones: exactly one dot allowed (no deep paths like `hero.section.title`)

**Valid examples:**
```html
<!-- Property zones (instant from memory) -->
<h1 data-gs-zone="website_zones:hero_headline">Welcome</h1>
<p data-gs-zone="website_zones:sub_headline">Built for teams</p>

<!-- Structured generative zones (grouped, coherent) -->
<h1 data-gs-zone="hero.headline">Ship faster</h1>
<p data-gs-zone="hero.subtitle">The modern platform</p>
<span data-gs-zone="hero.cta">Get Started</span>

<!-- Flat generative zones (independent) -->
<p data-gs-zone="proof">Trusted by 500+ companies</p>
<div data-gs-zone="client_portal:meeting_summary">Notes here</div>
```

**Invalid — do NOT generate these:**
```html
<!-- WRONG: no zone ID -->
<h1 data-gs-zone="">Welcome</h1>

<!-- WRONG: innerHTML won't be used, only textContent -->
<div data-gs-zone="content"><strong>Bold text</strong></div>

<!-- WRONG: zone on non-text element makes no sense -->
<img data-gs-zone="hero-image" src="..." />
```

### data-gs-identify (ONCE per page — how to find the visitor's record)

```html
<h1 data-gs-zone="collectionName:propertyName"
    data-gs-identify="collectionName:lookupProperty">Fallback</h1>
```

**Rules:**
- Only ONE element per page should have `data-gs-identify`
- Format is always `collectionName:propertyName`
- The value is resolved automatically from URL path or query params
- If the value can't be resolved client-side (e.g., `location`), the Edge API resolves it server-side

**How the value is resolved (priority order):**

| Source | Example URL | What gs.js sends |
|---|---|---|
| URL param matching property name | `?slug=sarah-chen` | `identify_value=sarah-chen` |
| `/for/:value` path pattern | `/for/sarah-chen` | `identify_value=sarah-chen` |
| `?gs_id=value` generic param | `?gs_id=sarah-chen` | `identify_value=sarah-chen` |
| No value found | `https://site.com` | No value — Edge API uses server signals |

**Server-side properties (resolved by Edge API when no URL value):**

| Property name | Resolved from | Example value |
|---|---|---|
| `location` | Geo headers (city-region-country) | `austin-tx-us` |
| `city` | Geo city header | `austin` |
| `region` or `state` | Geo region header | `tx` |
| `country` | Geo country header | `us` |

**Common patterns:**

```html
<!-- Identify by slug (ABM campaign URLs) -->
<h1 data-gs-zone="website_zones:hero_headline"
    data-gs-identify="website_zones:slug">Welcome</h1>
<!-- URL: /for/sarah-chen → searches website_zones where slug = sarah-chen -->

<!-- Identify by email (URL parameter) -->
<h1 data-gs-zone="portal:greeting"
    data-gs-identify="portal:email">Welcome back</h1>
<!-- URL: ?email=sarah@acme.com → searches portal where email = sarah@acme.com -->

<!-- Identify by location (automatic, no URL needed) -->
<h1 data-gs-zone="locations:headline"
    data-gs-identify="locations:location">Welcome</h1>
<!-- Edge API: reads geo headers → searches locations where location = austin-tx-us -->

<!-- Identify by custom ID -->
<h1 data-gs-zone="proposals:headline"
    data-gs-identify="proposals:customer_id">Your proposal</h1>
<!-- URL: ?customer_id=ACME-2024 → searches proposals where customer_id = ACME-2024 -->
```

### data-gs-prompt (OPTIONAL — custom instructions for generative zones)

```html
<p data-gs-zone="proof"
   data-gs-prompt="Write social proof mentioning our 99.9% uptime SLA. Max 2 sentences.">
  Trusted by 500+ companies
</p>
```

**Rules:**
- Only applies to generative zones (no colon in zone ID)
- Ignored for property zones (they read stored values, not AI-generated)
- The prompt is combined with brand guidelines (smartGuidelines) and visitor context (smartDigest) automatically
- Keep prompts concise — they're sent as URL parameters

**Good prompts:**
```
"Write a headline for fintech teams, max 10 words"
"Social proof with a specific number, mention the visitor's city"
"CTA with their first name, max 5 words"
"Value proposition for API-first engineering teams, 2 sentences max"
```

### data-gs-memorize (OPTIONAL — capture visitor input to Personize memory)

```html
<textarea data-gs-memorize="collectionName:propertyName"
          data-gs-trigger="blur">
</textarea>
```

**Rules:**
- Format: `collectionName:propertyName` (always with colon)
- Requires an identified visitor — anonymous writes are silently dropped
- Sensitive fields auto-redacted: password, ssn, credit_card, cvv, secret, token
- Requires analytics consent (if consent manager is detected)

### data-gs-trigger (OPTIONAL — when to capture memorize input)

| Value | When it fires | Default for |
|---|---|---|
| `blur` | User tabs/clicks away from element | `<input>`, `<textarea>` |
| `change` | Value changes | `<select>` |
| `submit` | Parent form submits | Elements in `data-gs-memorize-form` |
| `click` | Element is clicked | `<button>` |

### data-gs-memorize-form (OPTIONAL — capture all fields on submit)

```html
<form data-gs-memorize-form="collectionName">
  <input data-gs-memorize="collectionName:field1" />
  <input data-gs-memorize="collectionName:field2" />
  <button type="submit">Save</button>
</form>
```

All `data-gs-memorize` children are captured on form submit in one batch.

---

## Identification Methods — Priority Order

When generating integration code, choose the right method:

```
Priority (highest to lowest):
1. Auth session        → window.__GS_USER__
2. Preview mode        → ?gs_preview=email
3. Collection lookup   → data-gs-identify
4. Deanonymization     → Clearbit/RB2B (server-side, configured on Edge API)
5. Location            → automatic from geo headers
```

### Auth session (for web apps with login)

```html
<script>
window.__GS_USER__ = {
  email: 'sarah@acme.com',       // REQUIRED
  firstName: 'Sarah',             // optional
  lastName: 'Chen',               // optional
  company: 'Acme Corp',           // optional
  domain: 'acme.com',             // optional
  plan: 'pro',                    // optional (any custom fields)
  role: 'engineering',            // optional
};
</script>
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>
```

**IMPORTANT:** The `__GS_USER__` script MUST appear BEFORE the gs.js script tag. gs.js reads it on load.

**For React/Next.js:**
```tsx
<Script
  id="gs-user"
  strategy="beforeInteractive"
  dangerouslySetInnerHTML={{
    __html: `window.__GS_USER__ = ${JSON.stringify({
      email: user.email,
      firstName: user.firstName,
    })};`
  }}
/>
<Script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." strategy="afterInteractive" />
```

### Auth + data-gs-identify combo (fastest for web apps with property zones)

```html
<script>window.__GS_USER__ = { email: user.email };</script>
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<h1 data-gs-zone="dashboard:greeting"
    data-gs-identify="dashboard:email">Welcome back</h1>
<p data-gs-zone="dashboard:insight">Summary</p>
```

Auth provides email. `data-gs-identify` tells Edge API to load the full record in one call. All `dashboard:*` zones served from one result. Without `data-gs-identify`, each property zone requires a separate API call.

---

## JavaScript API — Exact Signatures

```javascript
// All methods are on the global window.GS object

// Identify visitor (triggers mid-session zone refresh after 500ms)
GS.identify(email: string, traits?: object): void

// Track custom event (batched, sent every 5 seconds)
GS.track(eventType: string, properties?: object): void

// Write value to Personize collection:property
// Target MUST contain a colon. Requires identified visitor.
GS.memorize(target: string, value: string): void

// Set consent levels (overrides auto-detected OneTrust/CookieBot/Osano)
GS.consent(levels: { analytics?: boolean, marketing?: boolean }): void

// Force re-render zones (opens new SSE connection)
GS.refresh(): void                  // all zones
GS.refresh(zoneId: string): void    // one zone

// Register event callback
GS.on(event: string, callback: function): void

// Debug info
GS.debug(): object
```

### Callback events

| Event | Data | When |
|---|---|---|
| `zone:render` | `{ zone, text }` | A zone's text was replaced |
| `meta` | `{ tier, location, uid }` | Identity resolved, connection established |
| `done` | `{ zones, duration_ms }` | All zones delivered |
| `error` | `{ zone?, code, message }` | A zone failed or connection error |
| `identify` | `{ email, traits }` | `GS.identify()` was called |
| `memorize` | `{ target, value }` | A memorize write was queued |
| `tier:upgrade` | `{ newTier, reason, rerender }` | Tier upgrade mid-session |
| `consent` | `{ essential, analytics, marketing }` | `GS.consent()` was called |

---

## URL Parameters

| Parameter | Purpose | Example |
|---|---|---|
| `?gs=TOKEN` | Encrypted identity token | `?gs=eyJ1c2VyI...` |
| `?gs_preview=EMAIL` | Preview mode (test keys only) | `?gs_preview=sarah@acme.com` |
| `?gs_id=VALUE` | Generic identify value | `?gs_id=sarah-chen` |
| `?utm_source=X` | Forwarded as AI context | `?utm_source=hubspot` |
| `?utm_campaign=X` | Forwarded as AI context | `?utm_campaign=q2-abm` |
| `?utm_medium=X` | Forwarded as AI context | `?utm_medium=email` |
| `?utm_content=X` | Forwarded as AI context | `?utm_content=hero-v2` |
| `?utm_term=X` | Forwarded as AI context | `?utm_term=api-platform` |

UTMs and `gs_` params are auto-collected and sent to the Edge API. The AI uses them as context for generation ("visitor came from LinkedIn ad about APIs").

The `?gs=` token is cleaned from the URL bar after consumption (prevents leaking in shared URLs).

---

## Complete Integration Patterns

### Pattern 1: Public website — location personalization only

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<h1 data-gs-zone="headline">Welcome to our platform</h1>
<p data-gs-zone="subheadline">We help teams build faster.</p>
<span data-gs-zone="cta-text">Get Started</span>
```

No identification. AI personalizes by visitor's city/region/country.

### Pattern 2: ABM campaign — unique URLs with property zones

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<h1 data-gs-zone="website_zones:hero_headline"
    data-gs-identify="website_zones:slug">See how we can help</h1>
<p data-gs-zone="website_zones:sub_headline">Built for teams</p>
<span data-gs-zone="cta-text"
      data-gs-prompt="CTA with their first name, max 5 words">Book a Demo</span>
```

URL: `https://site.com/for/sarah-chen`

### Pattern 3: SaaS dashboard — auth session

```html
<script>
window.__GS_USER__ = {
  email: currentUser.email,
  firstName: currentUser.firstName,
  company: currentUser.company,
  plan: currentUser.plan,
};
</script>
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<h1 data-gs-zone="dashboard:greeting"
    data-gs-identify="dashboard:email">Welcome back</h1>
<p data-gs-zone="dashboard:insight"
   data-gs-prompt="Usage insight with specific numbers from their profile">
  Your usage summary
</p>
```

### Pattern 4: Client portal — read + write

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<!-- Read from memory -->
<h1 data-gs-zone="portal:welcome"
    data-gs-identify="portal:email">Welcome back</h1>
<div data-gs-zone="portal:meeting_summary">Meeting notes</div>

<!-- Write to memory -->
<textarea data-gs-memorize="portal:feedback"
          data-gs-trigger="blur"
          placeholder="Your feedback"></textarea>
```

URL: `https://site.com/portal?email=sarah@acme.com`

### Pattern 5: Location-specific content from memory

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<h1 data-gs-zone="locations:headline"
    data-gs-identify="locations:location">Welcome</h1>
<p data-gs-zone="locations:proof">Trusted worldwide</p>
```

No URL parameters needed. Edge API auto-resolves location from geo headers.

### Pattern 6: Lead capture with mid-session upgrade

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>

<h1 data-gs-zone="headline">Welcome to our platform</h1>
<p data-gs-zone="proof">Trusted by 500+ companies</p>

<form onsubmit="GS.identify(this.email.value, { firstName: this.name.value }); return true;">
  <input name="name" placeholder="Your name" />
  <input name="email" placeholder="Your email" />
  <button type="submit">Get Started</button>
</form>
```

After form submit, `GS.identify()` fires → zones auto-refresh with personalized content.

### Pattern 7: WordPress with Elementor Pro

Script tag: Appearance → Theme Editor → header.php (or WPCode plugin)
```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>
```

Zones: Select widget → Advanced → Attributes:
```
data-gs-zone|website_zones:hero_headline
```

Elementor uses pipe (`|`) syntax for custom attributes.

### Pattern 8: Webflow

Script: Site Settings → Custom Code → Head Code
```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>
```

Zones: Select element → Settings panel → Custom Attributes:
- Name: `data-gs-zone`
- Value: `website_zones:hero_headline`

### Pattern 9: Any CMS (CSS selector fallback)

When the CMS editor doesn't support custom attributes:

```html
<script src="https://gs.personize.ai/gs.js" data-key="pk_live_..." async></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
  var m = {
    'h1, .hero-title': 'website_zones:hero_headline',
    '.hero-subtitle': 'website_zones:sub_headline',
    '.cta-button span': 'cta-text',
    '.testimonial-text': 'proof'
  };
  for (var s in m) {
    var el = document.querySelector(s);
    if (el) el.setAttribute('data-gs-zone', m[s]);
  }
  // Also set identify on the first zone
  var first = document.querySelector('[data-gs-zone]');
  if (first) first.setAttribute('data-gs-identify', 'website_zones:slug');
});
</script>
```

---

## Consent Integration Patterns

### Auto-detected (no code needed)

gs.js auto-detects OneTrust, CookieBot, and Osano. Features gate automatically.

### Manual consent

```javascript
// After your consent UI resolves:
GS.consent({ analytics: true, marketing: false });
```

### With OneTrust callback

```javascript
// OneTrust fires this when consent changes
function OptanonWrapper() {
  // gs.js reads OptanonActiveGroups automatically
  // but you can also force an update:
  GS.consent({
    analytics: OnetrustActiveGroups.indexOf('C0002') >= 0,
    marketing: OnetrustActiveGroups.indexOf('C0004') >= 0,
  });
}
```

---

## Things That Do NOT Exist — Do Not Generate These

```javascript
// WRONG — these methods do not exist
GS.init()           // gs.js auto-initializes
GS.pause()          // not implemented
GS.resume()         // not implemented
GS.setUser()        // use window.__GS_USER__ or GS.identify()
GS.configure()      // configuration is via data-* attributes on script tag
GS.destroy()        // not implemented
GS.getZone()        // use GS.debug().zones
GS.render()         // zones render automatically
```

```html
<!-- WRONG — these attributes do not exist -->
<h1 data-gs-type="property">      <!-- type is inferred from colon in zone ID -->
<h1 data-gs-collection="zones">   <!-- collection is part of zone ID: "zones:property" -->
<h1 data-gs-mode="bake">          <!-- no bake mode in current version -->
<h1 data-gs-refresh="5000">       <!-- no auto-refresh interval -->
<h1 data-gs-animate="slide">      <!-- only opacity transition -->
<h1 data-gs-fallback="Loading..."> <!-- fallback is the element's existing textContent -->
```

```html
<!-- WRONG — gs.js does NOT support these -->
<h1 data-gs-zone="headline" innerHTML>  <!-- NEVER innerHTML, always textContent -->
<div data-gs-zone="hero-section">       <!-- zones replace TEXT, not HTML blocks -->
<img data-gs-zone="hero-image">         <!-- images are not supported, text only -->
```

---

## Edge API Endpoints (for reference only — gs.js calls these automatically)

| Endpoint | Method | Purpose |
|---|---|---|
| `gs.personize.ai/api/gs/stream` | GET (SSE) | Streams personalized zone text |
| `gs.personize.ai/api/gs/event` | POST | Batched event ingestion |
| `gs.personize.ai/api/gs/identify` | POST | Explicit visitor identification |
| `gs.personize.ai/api/gs/memorize` | POST | Write to collection:property |
| `gs.personize.ai/health` | GET | Health check |

Users never call these directly. gs.js handles all communication.

---

## Key Constraints

1. **Text only.** gs.js replaces `textContent`. No HTML, no images, no layout changes.
2. **Max 20 zones per page.** Rate limited at the Edge API.
3. **One `data-gs-identify` per page.** Multiple identifiers are not supported.
4. **Property zones need stored data.** If no value exists in Personize memory, fallback text stays.
5. **Memorize needs identified visitor.** Anonymous memorize writes are silently dropped.
6. **Preview mode needs test key.** `?gs_preview` rejected with `pk_live_` keys.
7. **`__GS_USER__` must be set BEFORE gs.js loads.** Script order matters.
8. **Zone IDs must be unique.** Two elements with the same `data-gs-zone` value — only the first one gets content.
9. **Consent is checked per-call.** If consent changes mid-session, new calls respect the new state.
10. **UTMs are forwarded, not stored.** They're used as AI context for that request only.
