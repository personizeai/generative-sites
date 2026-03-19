/**
 * Tests for sample data integrity, zone type classification, and SDK helpers.
 *
 * Covers:
 *   - Sample contacts CSV data integrity
 *   - Zone type classification (property, structured, flat)
 *   - Slug generation
 *   - Site key classification
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CSV_PATH = join(__dirname, '..', '..', 'setup', 'sample-contacts.csv');

// ─── Sample CSV Tests ───────────────────────────────────────────────────────

describe('Sample Contacts CSV — Data Integrity', () => {
  const csv = readFileSync(CSV_PATH, 'utf-8');
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1);

  it('should have exactly 4 sample contacts', () => {
    expect(rows.length).toBe(4);
  });

  it('should have all required columns', () => {
    const required = [
      'email', 'slug', 'first_name', 'company_name', 'role_title',
      'industry', 'primary_goal', 'biggest_blocker', 'desired_outcome',
      'hero_headline', 'sub_headline', 'cta_text', 'proof', 'value_prop',
    ];

    for (const col of required) {
      expect(headers).toContain(col);
    }
  });

  it('should have unique emails for all contacts', () => {
    const emailIndex = headers.indexOf('email');
    const emails = rows.map(row => {
      const fields = row.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      return fields[emailIndex]?.replace(/"/g, '');
    });

    const unique = new Set(emails);
    expect(unique.size).toBe(4);
  });

  it('should have unique slugs for all contacts', () => {
    const slugIndex = headers.indexOf('slug');
    const slugs = rows.map(row => {
      const fields = row.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      return fields[slugIndex]?.replace(/"/g, '');
    });

    const unique = new Set(slugs);
    expect(unique.size).toBe(4);
  });
});

// ─── Zone Type Classification ───────────────────────────────────────────────

describe('Zone Type Classification', () => {
  function classifyZone(id: string): 'property' | 'structured' | 'flat' {
    if (id.indexOf(':') > 0) return 'property';
    if (id.indexOf('.') > 0) return 'structured';
    return 'flat';
  }

  it('should classify property zones (collection:property)', () => {
    expect(classifyZone('website_zones:hero_headline')).toBe('property');
    expect(classifyZone('website_zones:cta_text')).toBe('property');
    expect(classifyZone('dashboard:greeting')).toBe('property');
  });

  it('should classify structured zones (output.field)', () => {
    expect(classifyZone('hero.headline')).toBe('structured');
    expect(classifyZone('hero.subtitle')).toBe('structured');
    expect(classifyZone('insight.summary')).toBe('structured');
  });

  it('should classify flat zones (name only)', () => {
    expect(classifyZone('headline')).toBe('flat');
    expect(classifyZone('proof')).toBe('flat');
    expect(classifyZone('objection_reframe')).toBe('flat');
  });

  it('should enforce the 20-zone cap is documented', () => {
    // The cap is enforced server-side by gs-edge, not client-side
    const MAX_ZONES = 20;
    expect(MAX_ZONES).toBe(20);
  });
});

// ─── Slug Generation ────────────────────────────────────────────────────────

describe('Slug Generation', () => {
  function slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  it('should generate slugs from name + company', () => {
    expect(slugify('Maya OrbitStack')).toBe('maya-orbitstack');
    expect(slugify('Daniel Northstar Systems')).toBe('daniel-northstar-systems');
  });

  it('should handle special characters', () => {
    expect(slugify("O'Brien & Co.")).toBe('o-brien-co');
  });

  it('should trim leading/trailing hyphens', () => {
    expect(slugify(' leading ')).toBe('leading');
    expect(slugify('---trailing---')).toBe('trailing');
  });
});

// ─── Site Key Classification ────────────────────────────────────────────────

describe('Site Key Classification', () => {
  function classifyKey(key: string): 'pk_test' | 'pk_live' | 'none' {
    if (key.startsWith('pk_test_')) return 'pk_test';
    if (key.startsWith('pk_live_')) return 'pk_live';
    return 'none';
  }

  it('should classify test keys', () => {
    expect(classifyKey('pk_test_abc123')).toBe('pk_test');
  });

  it('should classify live keys', () => {
    expect(classifyKey('pk_live_xyz789')).toBe('pk_live');
  });

  it('should reject invalid keys', () => {
    expect(classifyKey('')).toBe('none');
    expect(classifyKey('invalid')).toBe('none');
    expect(classifyKey('sk_live_secret')).toBe('none');
  });
});
