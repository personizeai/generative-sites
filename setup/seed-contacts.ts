/**
 * seed-contacts.ts — Imports sample contacts into Personize memory.
 *
 * Run with: npm run seed
 *
 * Reads setup/sample-contacts.csv and memorizes each record into the
 * website_zones collection. Safe to re-run — existing records are updated.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { client, WEBSITE_ZONES_COLLECTION, RATE_LIMIT_PAUSE_MS } from '../src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_PATH = join(__dirname, 'sample-contacts.csv');

interface ContactRow {
  email: string;
  slug: string;
  first_name: string;
  company_name: string;
  role_title: string;
  industry: string;
  primary_goal: string;
  biggest_blocker: string;
  desired_outcome: string;
  hero_headline: string;
  sub_headline: string;
  cta_text: string;
  proof: string;
  value_prop: string;
  notes: string;
  interests: string;
}

async function seedContacts() {
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const rows: ContactRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`[gs-seed] Found ${rows.length} contacts in sample CSV.`);

  for (const row of rows) {
    const content = [
      `Email: ${row.email}`,
      `Slug: ${row.slug}`,
      `Name: ${row.first_name}`,
      `Company: ${row.company_name}`,
      `Role: ${row.role_title}`,
      `Industry: ${row.industry}`,
      `Primary Goal: ${row.primary_goal}`,
      `Biggest Blocker: ${row.biggest_blocker}`,
      `Desired Outcome: ${row.desired_outcome}`,
      `Hero Headline: ${row.hero_headline}`,
      `Sub Headline: ${row.sub_headline}`,
      `CTA Text: ${row.cta_text}`,
      `Proof: ${row.proof}`,
      `Value Prop: ${row.value_prop}`,
      row.notes ? `Notes: ${row.notes}` : '',
      row.interests ? `Interests: ${row.interests}` : '',
    ].filter(Boolean).join('\n');

    try {
      await client.memory.memorize({
        collection: WEBSITE_ZONES_COLLECTION,
        content,
        identifier: row.email,
      });
      console.log(`[gs-seed] Seeded: ${row.first_name} (${row.email})`);
    } catch (err: any) {
      console.error(`[gs-seed] Failed to seed ${row.email}:`, err.message || err);
    }

    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_PAUSE_MS));
  }
}

seedContacts()
  .then(() => {
    console.log('[gs-seed] All contacts seeded.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[gs-seed] Seeding failed:', err);
    process.exit(1);
  });
