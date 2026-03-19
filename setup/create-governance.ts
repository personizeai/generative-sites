/**
 * create-governance.ts — One-time setup: creates governance variables for zone generation.
 *
 * Run with: npm run setup:governance
 *
 * These variables are extracted by gs-edge during AI zone generation via smartGuidelines().
 * They ensure every generated zone follows brand rules, length limits, and tone.
 */

import { client } from '../src/config.js';

const GOVERNANCE_VARIABLES = [
  {
    name: 'Zone Brand Voice',
    slug: 'zone-brand-voice',
    content: `
## Brand Voice for Website Zones

### Tone
- Confident but never pushy — the page should feel helpful, not sales-y
- Direct — lead with what matters to the visitor, not what we want to say
- Specific — reference the visitor's role, industry, or situation when context is available
- Practical — focus on outcomes and next steps, not abstract promises

### Rules
- NEVER use "synergy", "leverage", "touch base", "circle back", "unlock", "supercharge"
- NEVER invent customer names, case studies, or statistics
- NEVER start with "Welcome to" or "Introducing" — the visitor is already on the page
- First sentence must be about THEM (their situation, their goal), not about the product
- Keep zone text concise — every word must earn its place
- If no visitor context is available, use industry-level relevance over generic copy

### Personalization Guardrails
- Reference at most ONE specific fact about the visitor per zone
- The fact must come from memory context — never invented
- Don't over-personalize: mentioning their recent funding round is relevant, mentioning their last vacation is creepy
- When context is thin, fall back to role-based or industry-based messaging
    `.trim(),
    triggerKeywords: ['voice', 'tone', 'writing', 'style', 'brand', 'zone', 'copy', 'text'],
  },
  {
    name: 'Zone Generation Guidelines',
    slug: 'zone-generation-guidelines',
    content: `
## Zone Generation Rules

### Length Limits (strict)
- hero_headline: max 12 words, typically 6-10
- sub_headline: max 30 words, 1-2 sentences
- cta_text: max 5 words
- proof: max 25 words, 1-2 sentences
- value_prop: max 35 words, 1-2 sentences
- social_proof: max 25 words, 1-2 sentences
- objection_reframe: max 25 words, 2 sentences max
- implementation_nudge: max 18 words, 1 sentence

### Structure Rules
- Property zones (collection:property) are instant lookups — they are NEVER generated, only recalled
- Structured zones (output.field) share a single prompt — all fields in a group must be thematically coherent
- Flat zones get independent prompts — they can reference visitor context but stand alone

### Fallback Safety
- Every zone MUST have fallback text in the HTML
- If generation fails for any reason, the original text stays — never leave a zone blank
- Generated text is rendered via textContent only (never innerHTML) for XSS safety

### Consent Tiers
- Essential (no consent needed): property zones, structured zones with no PII
- Analytics (analytics consent): event tracking, memorize writes
- Marketing (marketing consent): deanonymization, identify calls
    `.trim(),
    triggerKeywords: ['zone', 'generation', 'rules', 'length', 'limit', 'consent', 'structure', 'property', 'structured', 'flat'],
  },
  {
    name: 'Zone Content Policy',
    slug: 'zone-content-policy',
    content: `
## Content Policy for Generated Zones

### Prohibited Content
- No competitor name-dropping (even positively)
- No pricing claims or discount offers
- No urgency manipulation ("Act now!", "Limited time!")
- No health, legal, or financial advice
- No political, religious, or controversial statements

### Required Attributes
- Every generated zone must be factually accurate given the context
- If no visitor context exists, the zone must still make sense to an anonymous visitor
- Zones must read naturally in the page design — they are text fragments, not standalone paragraphs
- Generated copy must not contradict the fallback text's intent

### Quality Bar
- If the generated text is not clearly better than the fallback, prefer the fallback
- Avoid filler phrases: "In today's fast-paced world", "As a leader in", "We're proud to"
- Each zone should feel like a human copywriter wrote it for that specific person
    `.trim(),
    triggerKeywords: ['content', 'policy', 'prohibited', 'quality', 'generated', 'zone'],
  },
];

async function createGovernance() {
  for (const variable of GOVERNANCE_VARIABLES) {
    try {
      await client.governance.upsert({
        name: variable.name,
        slug: variable.slug,
        content: variable.content,
        triggerKeywords: variable.triggerKeywords,
      });
      console.log(`[gs-setup] Upserted governance: "${variable.name}"`);
    } catch (err: any) {
      console.error(`[gs-setup] Failed to upsert "${variable.name}":`, err.message || err);
    }
  }
}

createGovernance()
  .then(() => {
    console.log('[gs-setup] Governance setup complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[gs-setup] Governance setup failed:', err);
    process.exit(1);
  });
