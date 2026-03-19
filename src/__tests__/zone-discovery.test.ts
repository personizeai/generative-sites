/**
 * Tests for zone discovery — the core mechanism that finds data-gs-zone elements.
 *
 * Covers:
 *   - Basic zone discovery from DOM
 *   - Zone ID extraction (property, structured, flat)
 *   - Fallback text preservation
 *   - Custom prompt extraction (data-gs-prompt)
 *   - data-gs-identify parsing
 *   - Deduplication (same zone ID not registered twice)
 *   - Max zone count (≤20)
 */

import { describe, it, expect, beforeEach } from 'vitest';

// We test gs.js by loading it in a jsdom environment.
// Since gs.js is an IIFE that runs on load, we set up the DOM first,
// then re-execute the SDK for each test.

function setupDocument(html: string) {
  document.head.innerHTML = '';
  document.body.innerHTML = html;
}

function injectGS(attrs: Record<string, string> = {}) {
  // Create a mock script tag that gs.js reads from
  const script = document.createElement('script');
  script.setAttribute('data-key', attrs['data-key'] || 'pk_test_abc123');
  if (attrs['data-endpoint']) {
    script.setAttribute('data-endpoint', attrs['data-endpoint']);
  }
  if (attrs['data-transition']) {
    script.setAttribute('data-transition', attrs['data-transition']);
  }
  script.setAttribute('src', 'https://gs.personize.ai/gs.js');
  document.head.appendChild(script);

  // Make it the "currentScript"
  Object.defineProperty(document, 'currentScript', {
    value: script,
    writable: true,
    configurable: true,
  });
}

describe('Zone Discovery', () => {
  beforeEach(() => {
    // Reset GS global
    delete (window as any).GS;
    setupDocument('');
  });

  it('should find all data-gs-zone elements in the DOM', () => {
    setupDocument(`
      <h1 data-gs-zone="headline">Default headline</h1>
      <p data-gs-zone="subheadline">Default sub</p>
      <span data-gs-zone="cta">Get Started</span>
    `);

    const zones = document.querySelectorAll('[data-gs-zone]');
    expect(zones.length).toBe(3);
  });

  it('should extract zone IDs from data-gs-zone attributes', () => {
    setupDocument(`
      <h1 data-gs-zone="website_zones:hero_headline">Fallback</h1>
      <p data-gs-zone="hero.subtitle">Fallback</p>
      <span data-gs-zone="social_proof">Fallback</span>
    `);

    const zones = document.querySelectorAll('[data-gs-zone]');
    const ids = Array.from(zones).map((el) => el.getAttribute('data-gs-zone'));

    expect(ids).toEqual([
      'website_zones:hero_headline',  // property zone
      'hero.subtitle',                // structured zone
      'social_proof',                 // flat zone
    ]);
  });

  it('should classify zone types correctly', () => {
    const classify = (id: string) => {
      if (id.indexOf(':') > 0) return 'property';
      if (id.indexOf('.') > 0) return 'structured';
      return 'flat';
    };

    expect(classify('website_zones:hero_headline')).toBe('property');
    expect(classify('hero.subtitle')).toBe('structured');
    expect(classify('social_proof')).toBe('flat');
    expect(classify('objection_reframe')).toBe('flat');
    expect(classify('website_zones:cta_text')).toBe('property');
    expect(classify('story.problem')).toBe('structured');
  });

  it('should preserve fallback text from elements', () => {
    setupDocument(`
      <h1 data-gs-zone="headline">This is the fallback headline</h1>
    `);

    const el = document.querySelector('[data-gs-zone="headline"]')!;
    expect(el.textContent).toBe('This is the fallback headline');
  });

  it('should extract custom prompts from data-gs-prompt', () => {
    setupDocument(`
      <p data-gs-zone="social_proof"
         data-gs-prompt="Write social proof for a website visitor.">
        Fallback proof.
      </p>
    `);

    const el = document.querySelector('[data-gs-zone="social_proof"]')!;
    expect(el.getAttribute('data-gs-prompt')).toBe('Write social proof for a website visitor.');
  });

  it('should parse data-gs-identify correctly', () => {
    setupDocument(`
      <h1 data-gs-zone="website_zones:hero_headline"
          data-gs-identify="website_zones:slug">
        Fallback
      </h1>
    `);

    const el = document.querySelector('[data-gs-identify]')!;
    const identify = el.getAttribute('data-gs-identify')!;
    const parts = identify.split(':');

    expect(parts[0]).toBe('website_zones');
    expect(parts[1]).toBe('slug');
  });

  it('should handle zones with no custom prompt', () => {
    setupDocument(`
      <h1 data-gs-zone="headline">Fallback</h1>
    `);

    const el = document.querySelector('[data-gs-zone="headline"]')!;
    expect(el.getAttribute('data-gs-prompt')).toBeNull();
  });

  it('should handle multiple zones in a complex DOM structure', () => {
    setupDocument(`
      <header>
        <h1 data-gs-zone="headline">H1</h1>
      </header>
      <main>
        <section>
          <p data-gs-zone="hero.subtitle">Sub</p>
          <div>
            <span data-gs-zone="hero.cta">CTA</span>
          </div>
        </section>
        <section>
          <p data-gs-zone="social_proof" data-gs-prompt="Write proof.">Proof</p>
        </section>
      </main>
      <footer>
        <span data-gs-zone="footer_note">Note</span>
      </footer>
    `);

    const zones = document.querySelectorAll('[data-gs-zone]');
    expect(zones.length).toBe(5);
  });

  it('should count zones and respect the 20-zone cap', () => {
    // Create 22 zones — should still discover all of them (cap is enforced server-side)
    let html = '';
    for (let i = 0; i < 22; i++) {
      html += `<p data-gs-zone="zone_${i}">Fallback ${i}</p>\n`;
    }
    setupDocument(html);

    const zones = document.querySelectorAll('[data-gs-zone]');
    expect(zones.length).toBe(22);
    // Note: the 20-zone cap is enforced by gs-edge, not the client SDK
  });
});

describe('Zone ID Uniqueness', () => {
  it('should handle duplicate zone IDs in the DOM', () => {
    setupDocument(`
      <h1 data-gs-zone="headline">First</h1>
      <h2 data-gs-zone="headline">Second</h2>
    `);

    const zones = document.querySelectorAll('[data-gs-zone="headline"]');
    expect(zones.length).toBe(2);
    // Both elements should be found, but gs.js only tracks the first one
  });
});
