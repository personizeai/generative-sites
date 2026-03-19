/**
 * create-schemas.ts — One-time setup: creates the `website_zones` collection in Personize.
 *
 * Run with: npm run setup:schemas
 *
 * Safe to re-run — skips creation if the collection already exists.
 * Mirrors the schema documented in the flagship demo's HTML table and seed CSV.
 */

import { client, WEBSITE_ZONES_COLLECTION, PRIMARY_KEY_FIELD } from '../src/config.js';

async function createSchemas() {
  const existing = await client.collections.list();
  const existingSlugs = existing.data?.map((c: any) => c.slug) || [];

  if (existingSlugs.includes(WEBSITE_ZONES_COLLECTION)) {
    console.log(`[gs-setup] Collection "${WEBSITE_ZONES_COLLECTION}" already exists — skipping.`);
    return;
  }

  await client.collections.create({
    name: 'Website Zones',
    slug: WEBSITE_ZONES_COLLECTION,
    description: 'Visitor-specific website copy zones — property values for instant rendering, plus context fields for AI generation.',
    icon: 'globe',
    color: '#79ECFF',
    primaryKeyField: PRIMARY_KEY_FIELD,
    properties: [
      // ─── Identification ───────────────────────────────────────────────
      {
        propertyName: 'Email',
        systemName: 'email',
        type: 'text',
        autoSystem: false,
        description: 'Primary identifier for auth and preview mode.',
      },
      {
        propertyName: 'Slug',
        systemName: 'slug',
        type: 'text',
        autoSystem: false,
        description: 'ABM lookup path for /for/:slug routes. Unique per visitor.',
      },

      // ─── Visitor Profile ──────────────────────────────────────────────
      {
        propertyName: 'First Name',
        systemName: 'first_name',
        type: 'text',
        autoSystem: false,
        description: 'Short-name personalization when the tier supports it.',
      },
      {
        propertyName: 'Company Name',
        systemName: 'company_name',
        type: 'text',
        autoSystem: false,
        description: 'Company-aware positioning for property and generated zones.',
      },
      {
        propertyName: 'Role Title',
        systemName: 'role_title',
        type: 'text',
        autoSystem: true,
        description: 'Role-sensitive messaging — PM, architect, marketer, etc.',
      },
      {
        propertyName: 'Industry',
        systemName: 'industry',
        type: 'text',
        autoSystem: true,
        description: 'Industry proof and guardrail context for zone generation.',
      },
      {
        propertyName: 'Primary Goal',
        systemName: 'primary_goal',
        type: 'text',
        autoSystem: true,
        description: 'Main objective captured from forms, pipelines, or CRM sync.',
      },
      {
        propertyName: 'Biggest Blocker',
        systemName: 'biggest_blocker',
        type: 'text',
        autoSystem: true,
        description: 'Used for objection reframes and next-step prompts in generated zones.',
      },
      {
        propertyName: 'Desired Outcome',
        systemName: 'desired_outcome',
        type: 'text',
        autoSystem: true,
        description: 'Outcome framing for hero and story zones.',
      },

      // ─── Property Zone Values (deterministic, instant) ────────────────
      {
        propertyName: 'Hero Headline',
        systemName: 'hero_headline',
        type: 'text',
        autoSystem: false,
        description: 'Deterministic property hero line. Rendered instantly from memory, no LLM at serve time.',
      },
      {
        propertyName: 'Sub Headline',
        systemName: 'sub_headline',
        type: 'text',
        autoSystem: false,
        description: 'Supporting deterministic hero copy.',
      },
      {
        propertyName: 'CTA Text',
        systemName: 'cta_text',
        type: 'text',
        autoSystem: false,
        description: 'Primary CTA label. Keep under 5 words.',
      },
      {
        propertyName: 'Proof',
        systemName: 'proof',
        type: 'text',
        autoSystem: false,
        description: 'Industry or motion-specific social proof line.',
      },
      {
        propertyName: 'Value Prop',
        systemName: 'value_prop',
        type: 'text',
        autoSystem: false,
        description: 'Short description of why the page matters to this visitor.',
      },

      // ─── Append-Only Context ──────────────────────────────────────────
      {
        propertyName: 'Notes',
        systemName: 'notes',
        type: 'array',
        autoSystem: true,
        updateSemantics: 'append',
        description: 'Open-ended context from operators, agents, or visitors. Append only.',
      },
      {
        propertyName: 'Interests',
        systemName: 'interests',
        type: 'array',
        autoSystem: true,
        updateSemantics: 'append',
        description: 'Accumulating list of motions, features, or topics the visitor cares about.',
      },
    ],
  });

  console.log(`[gs-setup] Created "${WEBSITE_ZONES_COLLECTION}" collection with ${17} properties.`);
}

createSchemas()
  .then(() => {
    console.log('[gs-setup] Schema setup complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[gs-setup] Schema setup failed:', err);
    process.exit(1);
  });
